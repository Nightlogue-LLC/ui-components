import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
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
  NIGHTLOGUE_APP_TOKEN: 'test-restricted-app-token',
};

function mockApi({
  pullRequests = [pr],
  currentPr = pr,
  comments = [],
  inline = [],
  reviews = [],
  postStatus = 201,
  login = requester,
} = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const method = options.method || 'GET';
    calls.push({ url, method, body: options.body });
    const status = method === 'POST' ? postStatus : 200;
    let body;
    if (url === 'https://api.github.com/user') body = { login };
    else if (url.includes('/pulls?')) body = pullRequests;
    else if (url.includes('/pulls/89/comments?')) body = inline;
    else if (url.includes('/pulls/89/reviews?')) body = reviews;
    else if (url.includes('/comments?')) body = comments;
    else if (url.includes('/pulls/89')) body = currentPr;
    else body = { id: 123 };
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

// SHAE-13 F-2: a valid token for the wrong GitHub user used to end as a green
// "skipped" run. It must now fail the workflow without touching the PR.
test('App identity or another GitHub account cannot request the Codex review', async () => {
  for (const login of [bot, 'someone-else']) {
    const api = mockApi({ login });
    await assert.rejects(
      requestCodexReview({ env, fetchImpl: api.fetchImpl }),
      (error) =>
        error.message === 'codex_request_wrong_requester' && !error.message.includes(login),
    );
    // Only the identity probe ran: no PR lookup, no comment, no PR edit.
    assert.deepEqual(
      api.calls.map((call) => call.url),
      ['https://api.github.com/user'],
    );
  }
});

test('wrong-owner token exits non-zero with a fixed diagnostic and leaks nothing', () => {
  const stub =
    "globalThis.fetch = async (url) => { if (url === 'https://api.github.com/user') " +
    "return { ok: true, status: 200, json: async () => ({ login: 'someone-else' }) }; " +
    "throw Error('unexpected request ' + url); };";
  const token = 'secret-owner-token-0123456789';
  const run = spawnSync(
    process.execPath,
    [
      '--import',
      'data:text/javascript,' + encodeURIComponent(stub),
      fileURLToPath(new URL('./request-codex-review.mjs', import.meta.url)),
    ],
    { env: { ...env, CODEX_REVIEW_REQUEST_TOKEN: token }, encoding: 'utf8' },
  );
  const output = run.stdout + run.stderr;
  assert.equal(run.status, 1);
  assert.match(output, /::error title=Codex review not requested::/);
  assert.match(output, /remains a draft/);
  assert.match(output, /codex_request_wrong_requester/);
  assert.doesNotMatch(output, /codex_review_request requested/);
  assert.equal(output.includes(token), false);
  assert.equal(output.includes('someone-else'), false);
});

test('a correctly owned token still reports success and a request', async () => {
  const api = mockApi();
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: api.fetchImpl }), {
    status: 'requested',
  });
});

test('identity API failures report safe stage without exposing credentials', async () => {
  const fetchImpl = async () => ({ ok: false, status: 403 });
  await assert.rejects(
    requestCodexReview({ env, fetchImpl }),
    /github_request_failed_identity_403/,
  );
});

test('P3 budget exhaustion holds PR without requesting Codex again', async () => {
  const past = ['b'.repeat(40), 'c'.repeat(40)];
  const comments = [];
  const inline = [];
  for (let i = 0; i < past.length; i++) {
    const commit = past[i];
    comments.push({
      user: { login: requester },
      created_at: '2026-11-16T23:55:0' + i + 'Z',
      body: '@codex review\n<!-- nightlogue-codex-request:' + commit + ' -->',
    });
    comments.push({
      user: { login: 'chatgpt-codex-connector[bot]' },
      updated_at: '2026-11-16T23:57:0' + i + 'Z',
      body:
        '<!-- codex-review-state:v1 ' +
        JSON.stringify({
          code_review: {
            commit_sha: commit,
            status: 'completed',
            has_any_findings: true,
            has_unresolved_findings: true,
          },
        }) +
        ' -->',
    });
    comments.push({
      user: { login: 'chatgpt-codex-connector[bot]' },
      body: '<!-- codex-review-receipt:v1 --> Reviewed commit: ' + commit.slice(0, 10),
    });
    inline.push({
      user: { login: 'chatgpt-codex-connector[bot]' },
      commit_id: commit,
      path: 'src/badge.ts',
      body: '[P3] Minor clarity issue',
    });
  }
  const api = mockApi({ comments, inline });
  const result = await requestCodexReview({ env, fetchImpl: api.fetchImpl });
  assert.deepEqual(result, { status: 'review_hold', reason: 'severity_limit' });
  const writes = api.calls.filter((call) => ['POST', 'PATCH'].includes(call.method));
  assert.equal(writes.length, 1);
  assert.equal(writes[0].method, 'PATCH');
  assert.match(JSON.parse(writes[0].body).body, /\*\*REVIEW HOLD:\*\*/);
});

test('unfinished previous Codex review never starts another request', async () => {
  const api = mockApi({
    comments: [
      {
        user: { login: requester },
        created_at: '2026-11-16T23:55:00Z',
        body: '@codex review\n<!-- nightlogue-codex-request:' + 'b'.repeat(40) + ' -->',
      },
    ],
  });
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: api.fetchImpl }), {
    status: 'skipped_previous_review_pending',
  });
  assert.equal(api.calls.filter((call) => call.method === 'POST').length, 0);
});

// SHAE-13 F-1: a review that reported findings publishes its receipt as a PR
// review (not an issue comment). The request path must read both shapes, but
// accept only Codex-authored evidence for the exact previous commit.
const codexBot = 'chatgpt-codex-connector[bot]';
const priorCommit = 'b'.repeat(40);
const requestComment = (commit, minute = 0, severity = minute ? 'P2' : 'initial') => ({
  user: { login: requester },
  created_at: '2026-11-16T23:5' + minute + ':00Z',
  body:
    '@codex review\n<!-- nightlogue-codex-request:' +
    commit +
    ' -->\n<!-- nightlogue-review-budget:v1 {"round":' +
    minute +
    ',"severity":"' +
    severity +
    '"} -->',
});
const stateComment = (commit, over = {}) => ({
  user: { login: codexBot },
  updated_at: '2026-11-16T23:57:00Z',
  body:
    '<!-- codex-review-state:v1 ' +
    JSON.stringify({
      code_review: {
        commit_sha: commit,
        status: 'completed',
        has_any_findings: true,
        has_unresolved_findings: true,
        ...over,
      },
    }) +
    ' -->',
});
const receiptBody = (commit) =>
  '<!-- codex-review-receipt:v1 -->\n\n### Codex Review\n\n**Reviewed commit:** `' +
  commit.slice(0, 10) +
  '`';
const receiptComment = (commit, over = {}) => ({
  user: { login: codexBot },
  body: receiptBody(commit),
  ...over,
});
const receiptReview = (commit, over = {}) => ({
  user: { login: codexBot, type: 'Bot' },
  state: 'COMMENTED',
  commit_id: commit,
  body: receiptBody(commit),
  ...over,
});
// UI Components' severity parser reads literal "[P#]" markers.
const findingComment = (commit, title = '[P2] Needs a fix') => ({
  user: { login: codexBot },
  commit_id: commit,
  path: 'src/badge.ts',
  body: title,
});
const priorRound = [requestComment(priorCommit), stateComment(priorCommit)];
const posts = (api) => api.calls.filter((call) => call.method === 'POST');

test('F-1: a findings review whose receipt is a PR review lets the next request proceed', async () => {
  const api = mockApi({
    comments: priorRound,
    reviews: [receiptReview(priorCommit)],
    inline: [findingComment(priorCommit)],
  });
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: api.fetchImpl }), {
    status: 'requested',
  });
  assert.equal(posts(api).length, 1);
  assert.match(JSON.parse(posts(api)[0].body).body, /"round":1,"severity":"P2"/);
});

test('F-1: the issue-comment receipt of a clean review still lets the next request proceed', async () => {
  const api = mockApi({
    comments: [
      requestComment(priorCommit),
      stateComment(priorCommit, { has_any_findings: false, has_unresolved_findings: false }),
      receiptComment(priorCommit),
    ],
  });
  assert.equal((await requestCodexReview({ env, fetchImpl: api.fetchImpl })).status, 'requested');
});

test('F-1: missing, forged, stale or incomplete review receipts keep the request pending', async () => {
  const forgedBy = (login) => receiptReview(priorCommit, { user: { login, type: 'User' } });
  const cases = {
    'no receipt anywhere': [],
    'review authored by the owner': [forgedBy(requester)],
    'review authored by Conductor': [forgedBy(bot)],
    'lookalike bot login': [
      receiptReview(priorCommit, { user: { login: 'chatgpt-codex-connector' } }),
    ],
    'human account typed as User': [
      receiptReview(priorCommit, { user: { login: codexBot, type: 'User' } }),
    ],
    'review for a different head': [receiptReview(priorCommit, { commit_id: 'c'.repeat(40) })],
    'body names a different commit': [
      receiptReview(priorCommit, { body: receiptBody('c'.repeat(40)) }),
    ],
    'body lacks the receipt marker': [
      receiptReview(priorCommit, { body: 'Reviewed commit: ' + priorCommit.slice(0, 10) }),
    ],
    'body lacks the Reviewed commit line': [
      receiptReview(priorCommit, { body: '<!-- codex-review-receipt:v1 -->' }),
    ],
    'unsubmitted PENDING review': [receiptReview(priorCommit, { state: 'PENDING' })],
    'DISMISSED review': [receiptReview(priorCommit, { state: 'DISMISSED' })],
    'inline finding alone is not a receipt': [],
  };
  for (const [name, reviews] of Object.entries(cases)) {
    const api = mockApi({ comments: priorRound, reviews, inline: [findingComment(priorCommit)] });
    assert.deepEqual(
      await requestCodexReview({ env, fetchImpl: api.fetchImpl }),
      { status: 'skipped_previous_review_pending' },
      name,
    );
    assert.equal(posts(api).length, 0, name);
  }
});

test('F-1: an unfinished review state is pending even when a receipt review exists', async () => {
  const api = mockApi({
    comments: [requestComment(priorCommit), stateComment(priorCommit, { status: 'running' })],
    reviews: [receiptReview(priorCommit)],
  });
  assert.equal(
    (await requestCodexReview({ env, fetchImpl: api.fetchImpl })).status,
    'skipped_previous_review_pending',
  );
  assert.equal(posts(api).length, 0);
});

test('F-1: review-budget limits still hold when receipts are PR reviews', async () => {
  // Two prior P3-or-worse rounds with PR-review receipts: the severity cap
  // must still produce a REVIEW HOLD instead of another request.
  const past = ['b'.repeat(40), 'c'.repeat(40)];
  const comments = [];
  const reviews = [];
  const inline = [];
  past.forEach((commit, i) => {
    comments.push(requestComment(commit, i, i ? 'P3' : 'initial'), stateComment(commit));
    reviews.push(receiptReview(commit));
    inline.push({ ...findingComment(commit), body: '[P3] Minor clarity issue' });
  });
  const api = mockApi({ comments, reviews, inline });
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: api.fetchImpl }), {
    status: 'review_hold',
    reason: 'severity_limit',
  });
  assert.equal(posts(api).length, 0);
  const patches = api.calls.filter((call) => call.method === 'PATCH');
  assert.equal(patches.length, 1);
  assert.match(JSON.parse(patches[0].body).body, /\*\*REVIEW HOLD:\*\*/);
});

test('F-1: PR reviews are read only after a previous request exists', async () => {
  const first = mockApi();
  await requestCodexReview({ env, fetchImpl: first.fetchImpl });
  assert.equal(
    first.calls.some((call) => call.url.includes('/reviews?')),
    false,
  );
  const later = mockApi({ comments: priorRound, reviews: [receiptReview(priorCommit)] });
  await requestCodexReview({ env, fetchImpl: later.fetchImpl });
  assert.equal(
    later.calls.some((call) => call.url.includes('/pulls/89/reviews?per_page=100&page=1')),
    true,
  );
  // Reads are plain GETs; nothing here can submit, approve or dismiss a review.
  assert.equal(
    later.calls.filter((call) => call.url.includes('/reviews') && call.method !== 'GET').length,
    0,
  );
});

test('F-1: an unreadable or over-long review list denies the request', async () => {
  const bad = mockApi({ comments: priorRound, reviews: { message: 'nope' } });
  await assert.rejects(
    requestCodexReview({ env, fetchImpl: bad.fetchImpl }),
    /invalid_reviews_response/,
  );
  assert.equal(posts(bad).length, 0);
  const many = mockApi({
    comments: priorRound,
    reviews: Array.from({ length: 100 }, () => ({
      user: { login: 'someone' },
      state: 'COMMENTED',
    })),
  });
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: many.fetchImpl }), {
    status: 'skipped_review_limit',
  });
  assert.equal(posts(many).length, 0);
});

test('duplicate events for the same commit never post a second request', async () => {
  const api = mockApi({
    comments: [requestComment(sha)],
    reviews: [receiptReview(priorCommit)],
  });
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: api.fetchImpl }), {
    status: 'already_requested',
  });
  assert.equal(posts(api).length, 0);
});

// SHAE-13 severity parsing, end to end through the real request script: a P0 in
// any form must stop for the owner (REVIEW HOLD) and never produce another
// `@codex review`. Codex's rendered badge used to read as P1 and be re-requested.
const badge = (level, title = 'Critical') =>
  '**<sub><sub>![' +
  level +
  ' Badge](https://img.shields.io/badge/' +
  level +
  '-red?style=flat)</sub></sub>  ' +
  title +
  '**';
const p0Forms = {
  'rendered badge': badge('P0'),
  'literal marker': '[P0] Critical',
  'bold literal marker': '**[P0] Critical**',
  'badge beside a conflicting lower literal marker': badge('P3') + ' [P0]',
  'badge alt P3 but image P0': '![P3 Badge](https://img.shields.io/badge/P0-red) Critical',
  'P0 found after lower findings': badge('P0'),
  'P0 marker on a later line': 'Needs attention\n\n[P0] Critical',
};
const holdPatches = (api) => api.calls.filter((call) => call.method === 'PATCH');

test('SHAE-13: a P0 in any form holds the PR for the owner and requests nothing', async () => {
  for (const [name, body] of Object.entries(p0Forms)) {
    for (const via of ['issue-comment receipt', 'PR-review receipt']) {
      const comments = [requestComment(priorCommit), stateComment(priorCommit)];
      if (via === 'issue-comment receipt') comments.push(receiptComment(priorCommit));
      const inline = [{ ...findingComment(priorCommit, '[P3] minor'), path: 'src/other.ts' }];
      inline.push(findingComment(priorCommit, body));
      const api = mockApi({
        comments,
        inline,
        reviews: via === 'PR-review receipt' ? [receiptReview(priorCommit)] : [],
      });
      const result = await requestCodexReview({ env, fetchImpl: api.fetchImpl });
      assert.deepEqual(
        result,
        { status: 'review_hold', reason: 'critical_finding' },
        name + ' / ' + via,
      );
      assert.equal(posts(api).length, 0, name + ' / ' + via);
      assert.equal(holdPatches(api).length, 1, name + ' / ' + via);
      assert.match(
        JSON.parse(holdPatches(api)[0].body).body,
        /\*\*REVIEW HOLD:\*\*.*critical_finding, P0/s,
      );
    }
  }
});

test('SHAE-13: a P0 hold needs the App token and otherwise stops loudly without a request', async () => {
  const api = mockApi({
    comments: [requestComment(priorCommit), stateComment(priorCommit), receiptComment(priorCommit)],
    inline: [findingComment(priorCommit, badge('P0'))],
  });
  await assert.rejects(
    requestCodexReview({
      env: { ...env, NIGHTLOGUE_APP_TOKEN: undefined },
      fetchImpl: api.fetchImpl,
    }),
    /review_hold_app_token_not_configured/,
  );
  assert.equal(posts(api).length, 0);
});

test('SHAE-13: a held PR (REVIEW HOLD in its body) is never requested again, P0 or not', async () => {
  const held = { ...pr, body: pr.body + '\n\n**REVIEW HOLD:** critical_finding, P0' };
  const api = mockApi({
    pullRequests: [held],
    currentPr: held,
    comments: [requestComment(priorCommit), stateComment(priorCommit), receiptComment(priorCommit)],
    inline: [findingComment(priorCommit, badge('P0'))],
  });
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: api.fetchImpl }), {
    status: 'skipped_ineligible_pr',
  });
  assert.equal(posts(api).length + holdPatches(api).length, 0);
});

test('SHAE-13: badge-form P3 and P2 findings reach their own caps, not the looser P1 cap', async () => {
  const round = (levels) => {
    const commits = levels.map((_, i) => String(i + 1).repeat(40));
    return {
      comments: [
        ...commits.map((c, i) => requestComment(c, i, i ? levels[i - 1] : 'initial')),
        stateComment(commits.at(-1)),
      ],
      reviews: commits.map((c) => receiptReview(c)),
      inline: commits.map((c, i) => ({
        ...findingComment(c, badge(levels[i], 'Finding ' + i)),
        path: 'src/f' + i + '.ts',
      })),
    };
  };
  const p3 = mockApi(round(['P3', 'P3']));
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: p3.fetchImpl }), {
    status: 'review_hold',
    reason: 'severity_limit',
  });
  const p2 = mockApi(round(['P2', 'P2', 'P2', 'P2']));
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: p2.fetchImpl }), {
    status: 'review_hold',
    reason: 'severity_limit',
  });
  assert.equal(posts(p3).length + posts(p2).length, 0);
  // Within the P2 cap the next request is still allowed (the cap is not tightened).
  const within = mockApi(round(['P2', 'P2', 'P2']));
  assert.equal(
    (await requestCodexReview({ env, fetchImpl: within.fetchImpl })).status,
    'requested',
  );
});

test('SHAE-13: severity parsing leaves forged evidence, stale SHAs and duplicates denied', async () => {
  // A P0 written by anyone but Codex is ignored: it neither holds nor lets a request skip checks.
  const forged = mockApi({
    comments: [requestComment(priorCommit), stateComment(priorCommit)],
    reviews: [receiptReview(priorCommit)],
    inline: [{ ...findingComment(priorCommit, badge('P0')), user: { login: requester } }],
  });
  assert.equal(
    (await requestCodexReview({ env, fetchImpl: forged.fetchImpl })).status,
    'requested',
  );
  // Findings for another commit do not count against this one.
  const stale = mockApi({
    comments: [requestComment(priorCommit), stateComment(priorCommit)],
    reviews: [receiptReview(priorCommit)],
    inline: [findingComment('c'.repeat(40), badge('P0'))],
  });
  assert.equal((await requestCodexReview({ env, fetchImpl: stale.fetchImpl })).status, 'requested');
  // No receipt: pending, even with a P0 on file.
  const pending = mockApi({
    comments: [requestComment(priorCommit), stateComment(priorCommit)],
    inline: [findingComment(priorCommit, badge('P0'))],
  });
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: pending.fetchImpl }), {
    status: 'skipped_previous_review_pending',
  });
  // The same commit is never requested twice.
  const dup = mockApi({
    comments: [requestComment(sha)],
    inline: [findingComment(sha, badge('P0'))],
  });
  assert.deepEqual(await requestCodexReview({ env, fetchImpl: dup.fetchImpl }), {
    status: 'already_requested',
  });
});
