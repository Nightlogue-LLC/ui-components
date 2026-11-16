import test from 'node:test';
import assert from 'node:assert/strict';
import { isEligiblePr, hasRequestForCommit, requestCodexReview } from './request-codex-review.mjs';

const sha = 'a'.repeat(40);
const head = 'agent/verified-codex-comment-handoff';
const bot = 'nightlogue-conductor[bot]';
const requester = 'shavonne-senpai';
const pr = {
  number: 89,
  state: 'open',
  user: { login: bot },
  head: { sha, ref: head, repo: { full_name: 'Nightlogue-LLC/ui-components' } },
  base: { ref: 'main' },
  body: '<!-- nightlogue-auto-pr -->\n## Problem / motivation\nDetails\n## Verification\nPassed\n## Risks / reviewer focus\nCheck',
};
const env = {
  GITHUB_REF: 'refs/heads/main',
  GITHUB_REPOSITORY: 'Nightlogue-LLC/ui-components',
  PR_EXPECTED_HEAD_SHA: sha,
  PR_HEAD: head,
  CODEX_REVIEW_REQUEST_TOKEN: 'test-owner-token-redacted',
};

function mockApi({
  pullRequests = [pr],
  currentPr = pr,
  comments = [],
  postStatus = 201,
  login = requester,
} = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const method = options.method || 'GET';
    calls.push({ url, method, body: options.body });
    const status = method === 'POST' ? postStatus : 200;
    const body =
      url === 'https://api.github.com/user'
        ? { login }
        : url.includes('/pulls?')
          ? pullRequests
          : url.includes('/comments?')
            ? comments
            : url.includes('/pulls/89')
              ? currentPr
              : { id: 123 };
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  };
  return { calls, fetchImpl };
}

test('accepts only current, same-repo bot PRs with complete metadata', () => {
  assert.equal(isEligiblePr(pr, sha, head), true);
  assert.equal(isEligiblePr({ ...pr, user: { login: 'other' } }, sha, head), false);
  assert.equal(
    isEligiblePr({ ...pr, head: { ...pr.head, sha: 'b'.repeat(40) } }, sha, head),
    false,
  );
  assert.equal(
    isEligiblePr({ ...pr, body: pr.body + '\n**REVIEW HOLD:** incomplete' }, sha, head),
    false,
  );
  assert.equal(
    isEligiblePr({ ...pr, head: { ...pr.head, repo: { full_name: 'other/repo' } } }, sha, head),
    false,
  );
});

test('requests review from verified owner credential for exact passed CI commit', async () => {
  const api = mockApi();
  const result = await requestCodexReview({ env, fetchImpl: api.fetchImpl });
  assert.deepEqual(result, { status: 'requested' });
  const posts = api.calls.filter((x) => x.method === 'POST');
  assert.equal(posts.length, 1);
  const body = JSON.parse(posts[0].body).body;
  assert.match(body, /^@codex review/);
  assert.match(body, /nightlogue-codex-request:aaaaaaaa/);
  assert.equal(
    api.calls.some((x) => x.url.includes('/issues/89/comments')),
    true,
  );
});

test('a previous owner request for this SHA prevents duplicates', async () => {
  const api = mockApi({
    comments: [
      {
        user: { login: requester },
        body: `@codex review\n<!-- nightlogue-codex-request:${sha} -->`,
      },
    ],
  });
  assert.equal(
    hasRequestForCommit(
      [{ user: { login: requester }, body: `<!-- nightlogue-codex-request:${sha} -->` }],
      sha,
    ),
    true,
  );
  const result = await requestCodexReview({ env, fetchImpl: api.fetchImpl });
  assert.deepEqual(result, { status: 'already_requested' });
  assert.equal(api.calls.filter((x) => x.method === 'POST').length, 0);
});

test('ineligible and incomplete PRs never get comments', async () => {
  const api = mockApi({ pullRequests: [{ ...pr, body: '**REVIEW HOLD:**' }] });
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: api.fetchImpl }), {
    status: 'skipped_ineligible_pr',
  });
  assert.equal(api.calls.filter((x) => x.method === 'POST').length, 0);
});

test('API failures stop without an apparent successful request', async () => {
  const api = mockApi({ postStatus: 403 });
  await assert.rejects(
    requestCodexReview({ env, fetchImpl: api.fetchImpl }),
    /github_request_failed_comment_post_403/,
  );
});

test('invalid workflow scope fails before external requests', async () => {
  const api = mockApi();
  await assert.rejects(
    requestCodexReview({
      env: { ...env, GITHUB_REF: 'refs/heads/agent/untrusted' },
      fetchImpl: api.fetchImpl,
    }),
    /codex_request_invalid_trusted_context/,
  );
  assert.equal(api.calls.length, 0);
});

test('does not post when a new commit arrives after comment pagination', async () => {
  const api = mockApi({ currentPr: { ...pr, head: { ...pr.head, sha: 'b'.repeat(40) } } });
  const result = await requestCodexReview({ env, fetchImpl: api.fetchImpl });
  assert.deepEqual(result, { status: 'skipped_pr_changed' });
  assert.equal(api.calls.filter((x) => x.method === 'POST').length, 0);
});

test('does not post when a review hold appears after comment pagination', async () => {
  const api = mockApi({ currentPr: { ...pr, body: pr.body + '\n**REVIEW HOLD:** missing' } });
  const result = await requestCodexReview({ env, fetchImpl: api.fetchImpl });
  assert.deepEqual(result, { status: 'skipped_pr_changed' });
  assert.equal(api.calls.filter((x) => x.method === 'POST').length, 0);
});

test('does not post when the PR closes before the final recheck', async () => {
  const api = mockApi({ currentPr: { ...pr, state: 'closed' } });
  const result = await requestCodexReview({ env, fetchImpl: api.fetchImpl });
  assert.deepEqual(result, { status: 'skipped_pr_changed' });
  assert.equal(api.calls.filter((x) => x.method === 'POST').length, 0);
});

test('missing owner token never calls GitHub or claims review was requested', async () => {
  const api = mockApi();
  const result = await requestCodexReview({
    env: { ...env, CODEX_REVIEW_REQUEST_TOKEN: undefined },
    fetchImpl: api.fetchImpl,
  });
  assert.deepEqual(result, { status: 'skipped_requester_not_configured' });
  assert.equal(api.calls.length, 0);
});

test('App identity or another GitHub account cannot request the Codex review', async () => {
  for (const login of [bot, 'someone-else']) {
    const api = mockApi({ login });
    const result = await requestCodexReview({ env, fetchImpl: api.fetchImpl });
    assert.deepEqual(result, { status: 'skipped_wrong_requester' });
    assert.equal(api.calls.filter((call) => call.method === 'POST').length, 0);
  }
});

test('identity API failures report safe stage without exposing credentials', async () => {
  const fetchImpl = async () => ({ ok: false, status: 403 });
  await assert.rejects(
    requestCodexReview({ env, fetchImpl }),
    /github_request_failed_identity_403/,
  );
});
