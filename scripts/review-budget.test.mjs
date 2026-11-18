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

// ---------------------------------------------------------------------------
// SHAE-13: severity parsing. Real Codex findings use a rendered badge, which the
// previous parser read as "no marker" and therefore as P1 (a P0 never escalated).
// ---------------------------------------------------------------------------
const badgeLine = (level, title = 'Title') =>
  '**<sub><sub>![' +
  level +
  ' Badge](https://img.shields.io/badge/' +
  level +
  '-red?style=flat)</sub></sub>  ' +
  title +
  '**';
const finding = (body, over = {}) => ({
  user: { login: codex },
  commit_id: shas[0],
  path: 'src/a.ts',
  body,
  ...over,
});
const severityOf = (body, over) => findingsForSha([finding(body, over)], shas[0])[0]?.severity;
const LEVELS = ['P0', 'P1', 'P2', 'P3'];

// Every way the first line can state a priority, per level.
const forms = {
  'rendered badge': (level) => badgeLine(level) + '\n\nDetails.',
  'badge without emphasis': (level) =>
    '<sub><sub>![' +
    level +
    ' Badge](https://img.shields.io/badge/' +
    level +
    '-red)</sub></sub> Title',
  'lowercase badge': (level) =>
    '![' + level.toLowerCase() + ' badge](https://img.shields.io/badge/' + level + '-red) Title',
  'literal marker': (level) => '[' + level + '] Title\n\nDetails.',
  'bold literal marker': (level) => '**[' + level + '] Title**',
  'underscored literal marker': (level) => '__[' + level + '] Title__',
  'marker then bold text': (level) => '**[' + level + ']** Title',
  'lowercase literal marker': (level) => '[' + level.toLowerCase() + '] Title',
};

test('SHAE-13: every level is read from every supported first-line form', () => {
  for (const [name, make] of Object.entries(forms)) {
    for (const level of LEVELS) {
      assert.equal(severityOf(make(level)), level, name + ' ' + level);
    }
  }
});

test('SHAE-13: the same finding has one fingerprint whichever form states its priority', () => {
  const prints = Object.values(forms).map(
    (make) =>
      findingsForSha([finding(make('P2').replace('Title', 'Same finding'))], shas[0])[0]
        .fingerprint,
  );
  assert.equal(new Set(prints).size, 1, prints.join(' | '));
  assert.equal(prints[0], 'src/a.ts|same finding');
});

test('SHAE-13: ambiguous first lines resolve to the MOST severe marker, never the lowest', () => {
  const url = (alt, shown) =>
    '![' + alt + ' Badge](https://img.shields.io/badge/' + shown + '-red?style=flat) Title';
  const cases = {
    'badge P3 plus literal [P0]': [badgeLine('P3') + ' [P0]', 'P0'],
    'literal [P0] before a P3 badge': ['[P0] ' + badgeLine('P3'), 'P0'],
    'badge alt P3 but image says P0': [url('P3', 'P0'), 'P0'],
    'badge alt P0 but image says P3': [url('P0', 'P3'), 'P0'],
    'two badges P2 and P1': [badgeLine('P2') + ' ' + badgeLine('P1'), 'P1'],
    'two literal markers P3 and P2': ['[P3] [P2] Title', 'P2'],
    'literal P2 and P0 in either order': ['[P2] [P0] Title', 'P0'],
    'agreeing markers stay put': [badgeLine('P2') + ' [P2]', 'P2'],
  };
  for (const [name, [body, expected]] of Object.entries(cases)) {
    assert.equal(severityOf(body), expected, name);
  }
  // Ambiguity can only raise severity: removing the extra marker lowers it.
  assert.equal(severityOf(badgeLine('P3')), 'P3');
});

test('SHAE-13: malformed or unmarked evidence is never minor and never an exception', () => {
  // No usable marker on the first line -> P1 (missing classification is not minor).
  for (const body of [
    '',
    'Unclassified finding',
    '[P4] out of range',
    '[P] empty',
    '[P00] two digits',
    'P0 without brackets',
    'array[P0]x in code',
    '[P0]attached',
    '![P0 Badge] no url',
    '![P9 Badge](https://img.shields.io/badge/P9-red) Title',
  ]) {
    assert.equal(severityOf(body), 'P1', JSON.stringify(body));
  }
  // A marker anywhere in the first line counts, even one hidden in an HTML comment:
  // when in doubt the parser errs toward escalation, never toward a lower level.
  assert.equal(severityOf('<!-- [P0] -->'), 'P0');
  // Below the first line only a P0 counts, and it escalates (the old parser matched a
  // marker anywhere, so a P0 on a later line must not become P1).
  for (const body of [
    'Title\n\n[P0] on a later line',
    '\n[P0] first line is blank',
    'Title\n' + badgeLine('P0'),
    'Title\n![P3 Badge](https://img.shields.io/badge/P0-red) hidden',
    '[P3] Title\n\n**[P0]** appears later',
  ]) {
    assert.equal(severityOf(body), 'P0', JSON.stringify(body));
  }
  // Lower markers below the first line are ignored: they neither set nor lower a level.
  assert.equal(severityOf('Title\n\n[P3] below'), 'P1');
  assert.equal(severityOf('Title\n' + badgeLine('P2')), 'P1');
  assert.equal(severityOf('[P1] Title\n\n[P3] [P2] below'), 'P1');
  // Priority text below the first line cannot LOWER a stated priority either.
  assert.equal(severityOf(badgeLine('P0') + '\n\n[P3] [P3] [P3]'), 'P0');
  assert.equal(severityOf('[P0] Title\n![P3 Badge](https://img.shields.io/badge/P3-red)'), 'P0');
  // Hostile shapes are skipped or defaulted, not thrown.
  assert.deepEqual(
    findingsForSha(
      [
        null,
        undefined,
        {},
        finding(undefined),
        finding(null),
        finding(42),
        finding({ toString: () => '[P0]' }),
      ],
      shas[0],
    ),
    [],
  );
  assert.deepEqual(findingsForSha(undefined, shas[0]), []);
  // A non-array list is a caller bug and must fail loudly (the request script
  // already rejects non-array API responses); coercing it to "no findings" would
  // read as P1 and let the loop continue.
  assert.throws(() => findingsForSha('not-an-array', shas[0]), TypeError);
});

test('SHAE-13: only Codex-authored findings for the exact commit are counted', () => {
  const body = badgeLine('P0');
  for (const over of [
    { user: { login: owner } },
    { user: { login: 'nightlogue-conductor[bot]' } },
    { user: { login: codex + '-fake' } },
    { user: { login: 'chatgpt-codex-connector' } },
    { user: undefined },
    { commit_id: shas[1] },
    { commit_id: undefined },
  ]) {
    assert.equal(findingsForSha([finding(body, over)], shas[0]).length, 0, JSON.stringify(over));
  }
  // An outdated comment still belongs to the commit it was written for.
  assert.equal(
    findingsForSha([finding(body, { commit_id: shas[1], original_commit_id: shas[0] })], shas[0])
      .length,
    1,
  );
});

test('SHAE-13: P0 escalates to the owner in every form and is never treated as P1', () => {
  for (const [name, make] of Object.entries(forms)) {
    const data = history(['P2']);
    data.inline = [finding(make('P0'), { commit_id: shas[0], path: 'src/x.ts' })];
    const result = checkReviewBudget({ ...data, sha: shas[1] });
    assert.deepEqual(result, { allowed: false, reason: 'critical_finding', severity: 'P0' }, name);
  }
});

test('SHAE-13: a P0 among lower findings, or beside a conflicting lower marker, still escalates', () => {
  for (const inline of [
    [
      finding(badgeLine('P3'), { path: 'a' }),
      finding(badgeLine('P0'), { path: 'b' }),
      finding('[P2] x', { path: 'c' }),
    ],
    [finding(badgeLine('P3') + ' [P0]')],
    [finding('![P3 Badge](https://img.shields.io/badge/P0-red) T')],
    [finding('Unmarked finding', { path: 'a' }), finding('[P0] Critical', { path: 'b' })],
  ]) {
    const data = history(['P1']);
    assert.equal(
      checkReviewBudget({ comments: data.comments, inline, sha: shas[1] }).reason,
      'critical_finding',
    );
  }
});

test('SHAE-13: a P0 escalates on a later round even when every severity budget has room', () => {
  const data = history(['P1', 'P1']);
  data.inline[1] = finding(badgeLine('P0'), { commit_id: shas[1], path: 'src/y.ts' });
  const result = checkReviewBudget({ ...data, sha: shas[2] });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'critical_finding');
});

test('SHAE-13: forged P0 text from anyone but Codex cannot trigger or suppress a decision', () => {
  const data = history(['P2']);
  const forged = finding(badgeLine('P0'), { user: { login: owner } });
  const withForged = checkReviewBudget({ ...data, inline: [...data.inline, forged], sha: shas[1] });
  const without = checkReviewBudget({ ...data, sha: shas[1] });
  assert.deepEqual(withForged, without);
  assert.equal(without.allowed, true);
});

// Rewrite a history's inline findings into the rendered badge form.
const asBadges = (data, titleFor = (i) => 'Fix consequence ' + i) => ({
  ...data,
  inline: data.inline.map((comment, i) => ({
    ...comment,
    body: badgeLine(comment.body.match(/\[(P\d)\]/)[1], titleFor(i)),
  })),
});

test('SHAE-13: severity budgets hold exactly for badge-form findings (previously read as P1)', () => {
  // P3: one repair request is allowed, the next is held.
  const p3 = asBadges(history(['P3', 'P3']));
  assert.equal(checkReviewBudget({ ...p3, sha: shas[2] }).reason, 'severity_limit');
  assert.equal(checkReviewBudget({ ...p3, sha: shas[2] }).severity, 'P3');
  // P2: three repair requests allowed, the fourth held.
  const p2 = asBadges(history(['P2', 'P2', 'P2', 'P2']));
  assert.equal(checkReviewBudget({ ...p2, sha: shas[4] }).reason, 'severity_limit');
  const p2ok = asBadges(history(['P2', 'P2', 'P2']));
  assert.equal(checkReviewBudget({ ...p2ok, sha: shas[3] }).allowed, true);
  // P1: the full five repair requests, then the global cap.
  const p1 = asBadges(history(['P1', 'P1', 'P1', 'P1', 'P1']));
  assert.equal(checkReviewBudget({ ...p1, sha: shas[5] }).allowed, true);
  const six = asBadges(history(['P1', 'P1', 'P1', 'P1', 'P1', 'P1']));
  assert.equal(checkReviewBudget({ ...six, sha: shas[6] }).reason, 'global_limit');
});

test('SHAE-13: the no-progress stop works across badge and literal forms of one finding', () => {
  const data = history(['P2', 'P2', 'P2']);
  const forms3 = [forms['rendered badge'], forms['literal marker'], forms['bold literal marker']];
  data.inline = data.inline.map((comment, i) => ({
    ...comment,
    path: 'src/repeat.ts',
    body: forms3[i]('P2').replace('Title', 'Same correctness issue'),
  }));
  assert.equal(checkReviewBudget({ ...data, sha: shas[3] }).reason, 'no_progress');
});

test('SHAE-13: parsing changes nothing about receipts, reviews or request counting', () => {
  const data = history(['P2']);
  const noReceipt = data.comments.filter((c) => !c.body?.includes('codex-review-receipt:v1'));
  assert.equal(
    checkReviewBudget({ comments: noReceipt, inline: data.inline, sha: shas[1] }).reason,
    'previous_review_pending',
  );
  assert.equal(checkReviewBudget({ ...data, sha: shas[0] }).reason, 'already_requested');
  assert.equal(checkReviewBudget({ ...data, sha: 'bad' }).reason, 'invalid_sha');
});
