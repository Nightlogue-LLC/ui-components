import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCodexReview } from './review-budget.mjs';
import {
  eligiblePr,
  cleanCodexReview,
  successfulCi,
  promoteReviewedPr,
} from './promote-reviewed-pr.mjs';

const sha = 'a'.repeat(40);
const pr = {
  state: 'open',
  draft: true,
  user: { login: 'nightlogue-conductor[bot]' },
  head: { sha, repo: { full_name: 'Nightlogue-LLC/ui-components' } },
  base: { ref: 'main' },
  node_id: 'PR_test',
  body: '<!-- nightlogue-auto-pr -->\n## Problem / motivation\nComplete',
};
const summary = {
  user: { login: 'chatgpt-codex-connector[bot]' },
  updated_at: '2026-11-16T23:55:02Z',
  body:
    '<!-- codex-review-state:v1 ' +
    JSON.stringify({
      code_review: {
        commit_sha: sha,
        status: 'completed',
        has_any_findings: false,
        has_unresolved_findings: false,
      },
      security_review: { status: null },
    }) +
    ' -->',
};
const receipt = {
  user: { login: 'chatgpt-codex-connector[bot]' },
  body: '<!-- codex-review-receipt:v1 -->\n' + 'Reviewed commit: ' + sha.slice(0, 10),
};
const runs = ['push', 'pull_request'].map((event) => ({
  name: 'CI',
  event,
  head_sha: sha,
  status: 'completed',
  conclusion: 'success',
  created_at: '2026-11-16T23:55:00Z',
}));

test('accepts only open, bot-owned, reviewed draft PRs', () => {
  assert.equal(eligiblePr(pr), true);
  assert.equal(eligiblePr({ ...pr, draft: false }), false);
  assert.equal(eligiblePr({ ...pr, user: { login: 'human' } }), false);
  assert.equal(eligiblePr({ ...pr, body: pr.body + '**REVIEW HOLD:**' }), false);
});

test('requires clean Codex summary and receipt for exact SHA', () => {
  assert.equal(cleanCodexReview([summary, receipt], sha), true);
  assert.equal(cleanCodexReview([summary], sha), false);
  assert.equal(cleanCodexReview([summary, receipt], 'b'.repeat(40)), false);
  assert.equal(
    cleanCodexReview(
      [{ ...summary, body: summary.body.replace('"completed"', '"running"') }, receipt],
      sha,
    ),
    false,
  );
  assert.equal(
    cleanCodexReview(
      [
        {
          ...summary,
          body: summary.body.replace('"has_any_findings":false', '"has_any_findings":true'),
        },
        receipt,
      ],
      sha,
    ),
    false,
  );
  assert.equal(
    cleanCodexReview(
      [
        summary,
        receipt,
        {
          ...summary,
          updated_at: '2026-11-16T23:59:00Z',
          body: summary.body.replace('"completed"', '"running"'),
        },
      ],
      sha,
    ),
    false,
  );
});

test('requires successful push AND pull-request CI for the exact head', () => {
  assert.equal(successfulCi(runs, sha), true);
  assert.equal(successfulCi(runs.slice(0, 1), sha), false);
  assert.equal(
    successfulCi(
      [...runs, { ...runs[0], conclusion: 'failure', created_at: '2026-11-16T23:56:00Z' }],
      sha,
    ),
    false,
  );
  assert.equal(successfulCi(runs, 'b'.repeat(40)), false);
});

function fixture({ currentPr = pr, comments = [summary, receipt], reviews = [], ci = runs } = {}) {
  const calls = [];
  let prReads = 0;
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body });
    const response = url.includes('/issues/85/comments')
      ? comments
      : url.includes('/pulls/85/reviews?')
        ? reviews
        : url.includes('/actions/runs?')
          ? { total_count: ci.length, workflow_runs: ci }
          : url === 'https://api.github.com/graphql'
            ? {
                data: {
                  markPullRequestReadyForReview: {
                    pullRequest: { isDraft: false, headRefOid: sha },
                  },
                },
              }
            : url.endsWith('/pulls/85')
              ? ++prReads === 1
                ? pr
                : currentPr
              : null;
    return { ok: true, json: async () => response };
  };
  return { fetchImpl, calls };
}

test('marks the verified current PR ready after successful checks', async () => {
  const f = fixture();
  const result = await promoteReviewedPr({
    number: 85,
    readToken: 'read-test-token',
    appToken: 'write-test-token',
    fetchImpl: f.fetchImpl,
  });
  assert.deepEqual(result, { status: 'ready', number: 85 });
  assert.equal(f.calls.filter((c) => c.method === 'POST').length, 1);
});

test('a stale or failing review cannot transition PR to ready', async () => {
  const f = fixture({ currentPr: { ...pr, head: { ...pr.head, sha: 'b'.repeat(40) } } });
  const result = await promoteReviewedPr({
    number: 85,
    readToken: 'r',
    appToken: 'w',
    fetchImpl: f.fetchImpl,
  });
  assert.equal(result.reason, 'pr_changed');
  assert.equal(
    f.calls.some((c) => c.url === 'https://api.github.com/graphql'),
    false,
  );
});

test('missing Codex completion never invokes a write', async () => {
  const f = fixture({ comments: [summary] });
  const result = await promoteReviewedPr({
    number: 85,
    readToken: 'r',
    appToken: 'w',
    fetchImpl: f.fetchImpl,
  });
  assert.equal(result.reason, 'codex_not_clear');
  assert.equal(
    f.calls.some((c) => c.url === 'https://api.github.com/graphql'),
    false,
  );
});

// SHAE-5 negative paths: evidence that is incomplete, forged or from the wrong
// author must never make a PR ready, and skipped CI is never treated as green.
test('SHAE-5: forged or incomplete Codex evidence never clears a PR', () => {
  const codex = 'chatgpt-codex-connector[bot]';
  const forged = (comment, login) => ({ ...comment, user: { login } });
  const cases = {
    'summary only': [summary],
    'receipt only': [receipt],
    'receipt for another commit': [
      summary,
      { ...receipt, body: receipt.body.replace('aaaa', 'bbbb') },
    ],
    'Codex quote without receipt marker': [
      summary,
      { user: { login: codex }, body: 'Reviewed commit: ' + sha.slice(0, 10) },
    ],
    'receipt by Conductor': [summary, forged(receipt, 'nightlogue-conductor[bot]')],
    'receipt by owner': [summary, forged(receipt, 'shavonne-senpai')],
    'summary by Conductor': [forged(summary, 'nightlogue-conductor[bot]'), receipt],
    'summary by owner': [forged(summary, 'shavonne-senpai'), receipt],
    'corrupt summary JSON': [
      { ...summary, body: '<!-- codex-review-state:v1 {oops} -->' },
      receipt,
    ],
  };
  for (const [name, comments] of Object.entries(cases)) {
    assert.equal(cleanCodexReview(comments, sha), false, name);
  }
  assert.equal(cleanCodexReview([summary, receipt], sha), true);
});

test('SHAE-5: skipped, cancelled or missing CI on either event is never green', () => {
  const withEvent = (event, over) =>
    runs.map((run) => (run.event === event ? { ...run, ...over } : run));
  for (const event of ['push', 'pull_request']) {
    for (const conclusion of ['skipped', 'cancelled', 'neutral', 'failure', null]) {
      assert.equal(
        successfulCi(withEvent(event, { conclusion }), sha),
        false,
        event + ' ' + conclusion,
      );
    }
    assert.equal(successfulCi(withEvent(event, { status: 'in_progress' }), sha), false, event);
    assert.equal(
      successfulCi(
        runs.filter((run) => run.event !== event),
        sha,
      ),
      false,
      event,
    );
  }
});

test('SHAE-5: a ready PR or an owner-authored PR is never promoted', async () => {
  for (const currentPr of [
    { ...pr, draft: false },
    { ...pr, user: { login: 'shavonne-senpai' } },
    { ...pr, body: pr.body + '\n**REVIEW HOLD:** stop' },
  ]) {
    const { fetchImpl, calls } = fixture({ currentPr });
    const result = await promoteReviewedPr({
      number: 85,
      readToken: 'read-token-test',
      appToken: 'app-token-test',
      fetchImpl,
    });
    // The first read is `pr` (eligible); the head-recheck sees the changed PR.
    assert.equal(result.status, 'skipped');
    assert.equal(
      calls.some((call) => call.url.endsWith('/graphql')),
      false,
    );
  }
});

// SHAE-13 F-1: the gate reads Codex receipts from issue comments AND PR
// reviews, and distinguishes pending, clean and findings-bearing reviews.
const codexBot = 'chatgpt-codex-connector[bot]';
const reviewReceipt = (over = {}) => ({
  user: { login: codexBot, type: 'Bot' },
  state: 'COMMENTED',
  commit_id: sha,
  body: '<!-- codex-review-receipt:v1 -->\n\n**Reviewed commit:** `' + sha.slice(0, 10) + '`',
  ...over,
});
const findingsSummary = {
  ...summary,
  body: summary.body
    .replace('"has_any_findings":false', '"has_any_findings":true')
    .replace('"has_unresolved_findings":false', '"has_unresolved_findings":true'),
};
const gate = (fixtureOptions) => {
  const f = fixture(fixtureOptions);
  return promoteReviewedPr({
    number: 85,
    readToken: 'read-token-test',
    appToken: 'app-token-test',
    fetchImpl: f.fetchImpl,
  }).then((result) => ({ result, calls: f.calls }));
};
const wrote = (calls) => calls.some((call) => call.url.endsWith('/graphql'));

test('F-1: a clean review whose receipt is a PR review makes the PR ready', async () => {
  const { result, calls } = await gate({ comments: [summary], reviews: [reviewReceipt()] });
  assert.deepEqual(result, { status: 'ready', number: 85 });
  assert.equal(calls.filter((call) => call.method === 'POST').length, 1);
});

test('F-1: classifier separates pending, clean and findings-bearing reviews', () => {
  const classify = (comments, reviews = []) => classifyCodexReview({ comments, reviews, sha });
  assert.equal(classify([summary, receipt]).status, 'clean');
  assert.equal(classify([summary, receipt]).receipt.source, 'issue_comment');
  assert.equal(classify([summary], [reviewReceipt()]).status, 'clean');
  assert.equal(classify([summary], [reviewReceipt()]).receipt.source, 'pull_request_review');
  assert.equal(classify([findingsSummary], [reviewReceipt()]).status, 'findings');
  assert.equal(classify([findingsSummary, receipt]).status, 'findings');
  assert.deepEqual(classify([summary]), { status: 'pending', reason: 'receipt_missing' });
  assert.deepEqual(classify([]), { status: 'pending', reason: 'summary_missing' });
  const running = { ...summary, body: summary.body.replace('"completed"', '"running"') };
  assert.deepEqual(classify([running], [reviewReceipt()]), {
    status: 'pending',
    reason: 'review_not_completed',
  });
  const unknown = { ...summary, body: summary.body.replace('"has_any_findings":false', '"x":1') };
  assert.deepEqual(classify([unknown], [reviewReceipt()]), {
    status: 'pending',
    reason: 'findings_state_unknown',
  });
});

test('F-1: a findings-bearing review never makes a PR ready, whichever shape its receipt has', async () => {
  for (const evidence of [
    { comments: [findingsSummary], reviews: [reviewReceipt()] },
    { comments: [findingsSummary, receipt], reviews: [] },
  ]) {
    const { result, calls } = await gate(evidence);
    assert.deepEqual(result, { status: 'skipped', reason: 'codex_not_clear', detail: 'findings' });
    assert.equal(wrote(calls), false);
  }
});

test('F-1: forged, stale or incomplete PR-review receipts never make a PR ready', async () => {
  const cases = {
    'no review receipt': [],
    'review by the owner': [reviewReceipt({ user: { login: 'shavonne-senpai', type: 'User' } })],
    'review by Conductor': [reviewReceipt({ user: { login: 'nightlogue-conductor[bot]' } })],
    'lookalike login': [reviewReceipt({ user: { login: 'chatgpt-codex-connector' } })],
    'User-typed account with the bot login': [
      reviewReceipt({ user: { login: codexBot, type: 'User' } }),
    ],
    'receipt for an older head': [
      reviewReceipt({
        commit_id: 'b'.repeat(40),
        body: reviewReceipt().body.replace(sha.slice(0, 10), 'b'.repeat(10)),
      }),
    ],
    'review commit_id differs from the head': [reviewReceipt({ commit_id: 'b'.repeat(40) })],
    'body names another commit': [
      reviewReceipt({ body: reviewReceipt().body.replace(sha.slice(0, 10), 'b'.repeat(10)) }),
    ],
    'marker missing': [reviewReceipt({ body: 'Reviewed commit: ' + sha.slice(0, 10) })],
    'Reviewed commit line missing': [reviewReceipt({ body: '<!-- codex-review-receipt:v1 -->' })],
    'PENDING review': [reviewReceipt({ state: 'PENDING' })],
    'DISMISSED review': [reviewReceipt({ state: 'DISMISSED' })],
  };
  for (const [name, reviews] of Object.entries(cases)) {
    const { result, calls } = await gate({ comments: [summary], reviews });
    assert.equal(result.reason, 'codex_not_clear', name);
    assert.equal(wrote(calls), false, name);
  }
});

test('F-1: a receipt review cannot rescue a stale, running or forged summary', async () => {
  const stale = { ...summary, body: summary.body.replace(sha, 'b'.repeat(40)) };
  const forged = { ...summary, user: { login: 'shavonne-senpai' } };
  for (const comments of [[stale], [forged], []]) {
    const { result, calls } = await gate({ comments, reviews: [reviewReceipt()] });
    assert.equal(result.reason, 'codex_not_clear');
    assert.equal(wrote(calls), false);
  }
});

test('F-1: an unreadable or over-long review list fails closed', async () => {
  const bad = await gate({ comments: [summary], reviews: { message: 'nope' } });
  assert.deepEqual(bad.result, { status: 'skipped', reason: 'bad_reviews' });
  const full = Array.from({ length: 100 }, () => ({ user: { login: 'someone' } }));
  const many = await gate({ comments: [summary], reviews: full });
  assert.deepEqual(many.result, { status: 'skipped', reason: 'reviews_limit' });
  assert.equal(wrote(bad.calls) || wrote(many.calls), false);
});

test('F-1: a PR review receipt never bypasses skipped or failed CI, or a changed head', async () => {
  const skippedPush = runs.map((run) =>
    run.event === 'push' ? { ...run, conclusion: 'skipped' } : run,
  );
  const ci = await gate({ comments: [summary], reviews: [reviewReceipt()], ci: skippedPush });
  assert.equal(ci.result.reason, 'ci_not_clear');
  const moved = await gate({
    comments: [summary],
    reviews: [reviewReceipt()],
    currentPr: { ...pr, head: { ...pr.head, sha: 'b'.repeat(40) } },
  });
  assert.equal(moved.result.reason, 'pr_changed');
  assert.equal(wrote(ci.calls) || wrote(moved.calls), false);
});

test('F-1: review reads are GETs and the gate has no approve or merge path', async () => {
  const { calls } = await gate({ comments: [summary], reviews: [reviewReceipt()] });
  assert.equal(
    calls.filter((call) => call.url.includes('/reviews') && call.method !== 'GET').length,
    0,
  );
  const mutations = calls.filter((call) => call.method !== 'GET');
  assert.deepEqual(
    mutations.map((call) => call.url),
    ['https://api.github.com/graphql'],
  );
  assert.match(mutations[0].body, /markPullRequestReadyForReview/);
  assert.doesNotMatch(mutations[0].body, /merge|approve/i);
});
