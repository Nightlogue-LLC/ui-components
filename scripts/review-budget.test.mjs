import test from 'node:test';
import assert from 'node:assert/strict';
import {
  codexReceipt,
  classifyCodexReview,
  checkReviewBudget,
  reviewRequests,
  findingsForSha,
  MAX_REPAIRS,
} from './review-budget.mjs';

const shas = Array.from({ length: 8 }, (_, i) => (i + 1).toString(16).repeat(40));
const codex = 'chatgpt-codex-connector[bot]';
const owner = 'shavonne-senpai';

function history(severities) {
  const comments = [];
  const inline = [];
  for (let i = 0; i < severities.length; i++) {
    const sha = shas[i];
    const tagged = i
      ? '\n<!-- nightlogue-review-budget:v1 ' +
        JSON.stringify({ round: i, severity: severities[i - 1] }) +
        ' -->'
      : '';
    comments.push({
      user: { login: owner },
      created_at: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
      body: '@codex review\n<!-- nightlogue-codex-request:' + sha + ' -->' + tagged,
    });
    comments.push({
      user: { login: codex },
      updated_at: new Date(Date.UTC(2026, 0, 1, 1, i)).toISOString(),
      body:
        '<!-- codex-review-state:v1 ' +
        JSON.stringify({
          code_review: {
            commit_sha: sha,
            status: 'completed',
            has_any_findings: true,
            has_unresolved_findings: true,
          },
        }) +
        ' -->',
    });
    comments.push({
      user: { login: codex },
      body: '<!-- codex-review-receipt:v1 --> Reviewed commit: ' + sha.slice(0, 10),
    });
    inline.push({
      user: { login: codex },
      commit_id: sha,
      path: 'src/file-' + i + '.ts',
      body: '[' + severities[i] + '] Fix consequence ' + i,
    });
  }
  return { comments, inline };
}

test('initial review is round zero; untrusted markers cannot count as requests', () => {
  assert.deepEqual(checkReviewBudget({ comments: [], inline: [], sha: shas[0] }), {
    allowed: true,
    round: 0,
    severity: 'initial',
  });
  const fake = {
    user: { login: 'another-user' },
    body: '<!-- nightlogue-codex-request:' + shas[0] + ' -->',
  };
  assert.equal(reviewRequests([fake]).length, 0);
  assert.equal(
    findingsForSha([{ user: { login: 'random' }, commit_id: shas[0], body: '[P3] Minor' }], shas[0])
      .length,
    0,
  );
});

test('P3 permits one repair review, then applies a hold', () => {
  const allowed = history(['P3']);
  assert.deepEqual(checkReviewBudget({ ...allowed, sha: shas[1] }), {
    allowed: true,
    round: 1,
    severity: 'P3',
  });
  const blocked = history(['P3', 'P3']);
  const result = checkReviewBudget({ ...blocked, sha: shas[2] });
  assert.equal(result.reason, 'severity_limit');
  assert.equal(result.severity, 'P3');
});

test('P2 permits three repair reviews; P1 permits five within the global limit', () => {
  for (const [severity, limit] of [
    ['P2', 3],
    ['P1', 5],
  ]) {
    const allowed = history(Array(limit).fill(severity));
    assert.equal(checkReviewBudget({ ...allowed, sha: shas[limit] }).allowed, true);
    const blocked = history(Array(limit + 1).fill(severity));
    const result = checkReviewBudget({ ...blocked, sha: shas[limit + 1] });
    assert.equal(result.allowed, false);
    assert.ok(['severity_limit', 'global_limit'].includes(result.reason));
  }
  assert.equal(MAX_REPAIRS, 5);
});

test('unknown priority is treated as P1, never P3', () => {
  const data = history(['P2']);
  data.inline = [
    { user: { login: codex }, commit_id: shas[0], path: 'src/a.ts', body: 'Unranked issue' },
  ];
  assert.equal(checkReviewBudget({ ...data, sha: shas[1] }).severity, 'P1');
});

test('P0 critical findings stop for immediate owner review', () => {
  const data = history(['P0']);
  assert.equal(checkReviewBudget({ ...data, sha: shas[1] }).reason, 'critical_finding');
});

test('two unchanged substantive repair outcomes stop further review', () => {
  const data = history(['P2', 'P2', 'P2']);
  data.inline.forEach((comment) => {
    comment.path = 'src/repeat.ts';
    comment.body = '[P2] Same correctness issue';
  });
  assert.equal(checkReviewBudget({ ...data, sha: shas[3] }).reason, 'no_progress');
});

test('previous review must have a completed state and matching receipt', () => {
  const data = history(['P1']);
  const withoutReceipt = data.comments.filter(
    (comment) => !comment.body?.includes('codex-review-receipt:v1'),
  );
  assert.equal(
    checkReviewBudget({ comments: withoutReceipt, inline: data.inline, sha: shas[1] }).reason,
    'previous_review_pending',
  );
  data.comments.find((comment) => comment.body?.includes('codex-review-state:v1')).body =
    '<!-- codex-review-state:v1 {"code_review":{"status":"running"}} -->';
  assert.equal(checkReviewBudget({ ...data, sha: shas[1] }).reason, 'previous_review_pending');
});

test('a repeated commit is not sent for review again', () => {
  const data = history(['P2']);
  assert.equal(checkReviewBudget({ ...data, sha: shas[0] }).reason, 'already_requested');
});

// SHAE-13 F-1: receipts may be issue comments (clean) or PR reviews (findings).
const head = shas[1];
const receiptText = (commit) =>
  '<!-- codex-review-receipt:v1 -->\n**Reviewed commit:** `' + commit.slice(0, 10) + '`';
const prReceipt = (over = {}) => ({
  user: { login: codex, type: 'Bot' },
  state: 'COMMENTED',
  commit_id: head,
  body: receiptText(head),
  ...over,
});
const commentReceipt = (over = {}) => ({
  user: { login: codex },
  body: receiptText(head),
  ...over,
});

test('F-1: codexReceipt accepts both Codex-authored shapes for the exact commit only', () => {
  assert.deepEqual(codexReceipt({ comments: [commentReceipt()], reviews: [], sha: head }), {
    source: 'issue_comment',
  });
  assert.deepEqual(codexReceipt({ comments: [], reviews: [prReceipt()], sha: head }), {
    source: 'pull_request_review',
  });
  // Bold/backtick decoration is optional; the line itself is not.
  for (const body of [
    '<!-- codex-review-receipt:v1 --> Reviewed commit: ' + head.slice(0, 10),
    '<!-- codex-review-receipt:v1 -->\n**Reviewed commit:** `' + head + '`',
  ]) {
    assert.ok(codexReceipt({ comments: [commentReceipt({ body })], reviews: [], sha: head }));
  }
  assert.equal(
    codexReceipt({ comments: [commentReceipt()], reviews: [prReceipt()], sha: shas[2] }),
    null,
  );
  assert.equal(codexReceipt({ comments: [commentReceipt()], reviews: [], sha: 'short' }), null);
  assert.equal(codexReceipt({ comments: undefined, reviews: undefined, sha: head }), null);
});

test('F-1: codexReceipt rejects forged, mismatched and unsubmitted evidence', () => {
  const comments = [
    commentReceipt({ user: { login: owner } }),
    commentReceipt({ user: { login: 'nightlogue-conductor[bot]' } }),
    commentReceipt({ user: { login: codex + 'x' } }),
    commentReceipt({ body: 'quoted: Reviewed commit: ' + head.slice(0, 10) }),
    commentReceipt({ body: '<!-- codex-review-receipt:v1 -->' }),
    commentReceipt({ body: receiptText(shas[2]) }),
    // Only a ten-character-or-longer hex prefix of the exact head counts.
    commentReceipt({
      body: '<!-- codex-review-receipt:v1 -->\nReviewed commit: ' + head.slice(0, 9),
    }),
    commentReceipt({
      body: '<!-- codex-review-receipt:v1 -->\nReviewed commit: ' + 'f'.repeat(10),
    }),
  ];
  const reviews = [
    prReceipt({ user: { login: owner, type: 'User' } }),
    prReceipt({ user: { login: codex, type: 'User' } }),
    prReceipt({ commit_id: shas[2] }),
    prReceipt({ commit_id: undefined }),
    prReceipt({ body: receiptText(shas[2]) }),
    prReceipt({ state: 'PENDING' }),
    prReceipt({ state: 'DISMISSED' }),
    prReceipt({ state: undefined }),
    prReceipt({ body: undefined }),
  ];
  assert.equal(codexReceipt({ comments, reviews, sha: head }), null);
});

test('F-1: a receipt written for an older commit never satisfies a newer head', () => {
  assert.equal(
    codexReceipt({
      comments: [],
      reviews: [prReceipt({ commit_id: shas[0], body: receiptText(shas[0]) })],
      sha: head,
    }),
    null,
  );
});

test('F-1: previous round with a PR-review receipt allows the next request; without one it is pending', () => {
  const data = history(['P2']);
  const withoutReceipt = data.comments.filter(
    (comment) => !comment.body?.includes('codex-review-receipt:v1'),
  );
  const last = shas[0];
  const review = prReceipt({ commit_id: last, body: receiptText(last) });
  const allowed = checkReviewBudget({
    comments: withoutReceipt,
    inline: data.inline,
    reviews: [review],
    sha: shas[1],
  });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.round, 1);
  for (const reviews of [
    undefined,
    [],
    [{ ...review, user: { login: owner } }],
    [{ ...review, state: 'DISMISSED' }],
  ]) {
    assert.equal(
      checkReviewBudget({ comments: withoutReceipt, inline: data.inline, reviews, sha: shas[1] })
        .reason,
      'previous_review_pending',
    );
  }
});

test('F-1: PR-review receipts never lift P0, severity, global or no-progress limits', () => {
  const asReviews = (data) => ({
    comments: data.comments.filter((c) => !c.body?.includes('codex-review-receipt:v1')),
    inline: data.inline,
    reviews: shas
      .slice(0, MAX_REPAIRS + 1)
      .map((s) => prReceipt({ commit_id: s, body: receiptText(s) })),
  });
  const p0 = asReviews(history(['P0']));
  assert.equal(checkReviewBudget({ ...p0, sha: shas[1] }).reason, 'critical_finding');
  const p3 = asReviews(history(['P3', 'P3']));
  assert.equal(checkReviewBudget({ ...p3, sha: shas[2] }).reason, 'severity_limit');
  const repeat = history(['P2', 'P2', 'P2']);
  repeat.inline.forEach((comment) => {
    comment.path = 'src/repeat.ts';
    comment.body = '[P2] Same correctness issue';
  });
  assert.equal(checkReviewBudget({ ...asReviews(repeat), sha: shas[3] }).reason, 'no_progress');
  const many = asReviews(history(['P1', 'P1', 'P1', 'P1', 'P1', 'P1']));
  assert.equal(checkReviewBudget({ ...many, sha: shas[6] }).reason, 'global_limit');
  // A repeated commit is still refused regardless of receipts.
  assert.equal(checkReviewBudget({ ...p0, sha: shas[0] }).reason, 'already_requested');
});

test('F-1: classifyCodexReview reports pending, clean or findings and fails closed', () => {
  const state = (over = {}, security) => ({
    user: { login: codex },
    updated_at: '2026-11-16T23:57:00Z',
    body:
      '<!-- codex-review-state:v1 ' +
      JSON.stringify({
        code_review: {
          commit_sha: head,
          status: 'completed',
          has_any_findings: false,
          has_unresolved_findings: false,
          ...over,
        },
        ...(security ? { security_review: security } : {}),
      }) +
      ' -->',
  });
  const classify = (comments, reviews = []) =>
    classifyCodexReview({ comments, reviews, sha: head });
  assert.equal(classify([state()], [prReceipt()]).status, 'clean');
  assert.equal(classify([state({ has_any_findings: true })], [prReceipt()]).status, 'findings');
  assert.equal(
    classify([state({ has_unresolved_findings: true })], [prReceipt()]).status,
    'findings',
  );
  assert.equal(classify([state()]).status, 'pending');
  assert.equal(classify([state({ status: 'running' })], [prReceipt()]).status, 'pending');
  assert.equal(classify([state({ has_any_findings: null })], [prReceipt()]).status, 'pending');
  assert.equal(classify([], [prReceipt()]).status, 'pending');
  assert.equal(classify('not-an-array', [prReceipt()]).status, 'pending');
  // A security review that ran must also be complete, for the same commit.
  const sec = {
    commit_sha: head,
    status: 'completed',
    has_any_findings: false,
    has_unresolved_findings: false,
  };
  assert.equal(classify([state({}, sec)], [prReceipt()]).status, 'clean');
  assert.equal(
    classify([state({}, { ...sec, status: 'running' })], [prReceipt()]).status,
    'pending',
  );
  assert.equal(
    classify([state({}, { ...sec, commit_sha: shas[2] })], [prReceipt()]).status,
    'pending',
  );
  assert.equal(
    classify([state({}, { ...sec, has_any_findings: true })], [prReceipt()]).status,
    'findings',
  );
  // The newest Codex summary decides; an older clean one cannot mask it.
  const newer = { ...state({ status: 'running' }), updated_at: '2026-11-16T23:59:00Z' };
  assert.equal(classify([state(), newer], [prReceipt()]).status, 'pending');
});
