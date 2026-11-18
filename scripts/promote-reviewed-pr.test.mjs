import test from 'node:test';
import assert from 'node:assert/strict';
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

function fixture({ currentPr = pr, comments = [summary, receipt], ci = runs } = {}) {
  const calls = [];
  let prReads = 0;
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body });
    const response = url.includes('/issues/85/comments')
      ? comments
      : url.includes('/actions/runs?')
        ? { total_count: ci.length, workflow_runs: ci }
        : url === 'https://api.github.com/graphql'
          ? {
              data: {
                markPullRequestReadyForReview: { pullRequest: { isDraft: false, headRefOid: sha } },
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
