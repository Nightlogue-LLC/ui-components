import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
