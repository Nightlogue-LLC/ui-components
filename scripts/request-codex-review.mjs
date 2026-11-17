import { pathToFileURL } from 'node:url';
import { checkReviewBudget } from './review-budget.mjs';

const OWNER = 'Nightlogue-LLC';
const REPO = 'ui-components';
const ROOT = `https://api.github.com/repos/${OWNER}/${REPO}`;
const BOT = 'nightlogue-conductor[bot]';
const REQUESTER = 'shavonne-senpai';
const MARKER_PREFIX = '<!-- nightlogue-codex-request:';
const SHA_PATTERN = /^[a-f0-9]{40}$/;

export function isEligiblePr(pr, sha, head) {
  return (
    pr?.user?.login === BOT &&
    pr?.head?.sha === sha &&
    pr?.head?.ref === head &&
    pr?.head?.repo?.full_name === `${OWNER}/${REPO}` &&
    pr?.base?.ref === 'main' &&
    pr?.state === 'open' &&
    typeof pr?.body === 'string' &&
    pr.body.includes('<!-- nightlogue-auto-pr -->') &&
    !pr.body.includes('**REVIEW HOLD:**') &&
    pr.body.includes('## Problem / motivation') &&
    pr.body.includes('## Verification') &&
    pr.body.includes('## Risks / reviewer focus')
  );
}

export function hasRequestForCommit(comments, sha) {
  const marker = `${MARKER_PREFIX}${sha} -->`;
  return (
    Array.isArray(comments) &&
    comments.some(
      (comment) =>
        comment?.user?.login === REQUESTER &&
        typeof comment.body === 'string' &&
        comment.body.includes(marker),
    )
  );
}

export async function requestCodexReview({ env = process.env, fetchImpl = fetch } = {}) {
  const sha = env.PR_EXPECTED_HEAD_SHA;
  const head = env.PR_HEAD;
  const token = env.CODEX_REVIEW_REQUEST_TOKEN;
  // An absent owner-authorized credential is an expected setup state, not
  // a failed workflow or a claim that Codex has been requested.
  if (!token) return { status: 'skipped_requester_not_configured' };
  if (
    env.GITHUB_REF !== 'refs/heads/main' ||
    env.GITHUB_REPOSITORY !== `${OWNER}/${REPO}` ||
    !SHA_PATTERN.test(sha ?? '') ||
    !/^(agent|claude)\/[a-z0-9][a-z0-9/_-]{0,120}$/.test(head ?? '') ||
    typeof token !== 'string' ||
    token.length < 20
  ) {
    throw Error('codex_request_invalid_trusted_context');
  }

  const api = async (url, options = {}, stage = 'unknown') => {
    const response = await fetchImpl(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'nightlogue-agent-relay',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: AbortSignal.timeout(12000),
    });
    // Log only a fixed stage label and HTTP status, never response bodies or credentials.
    if (!response.ok) {
      throw Error(`github_request_failed_${stage}_${response.status}`);
    }
    return response.json();
  };

  const requester = await api('https://api.github.com/user', {}, 'identity');
  if (requester?.login !== REQUESTER) {
    return { status: 'skipped_wrong_requester' };
  }

  const search = new URLSearchParams({
    state: 'open',
    head: `${OWNER}:${head}`,
    base: 'main',
    per_page: '100',
  });
  const prs = await api(`${ROOT}/pulls?${search}`, {}, 'pr_lookup');
  if (!Array.isArray(prs) || prs.length !== 1 || !isEligiblePr(prs[0], sha, head)) {
    return { status: 'skipped_ineligible_pr' };
  }

  const number = prs[0].number;
  if (!Number.isSafeInteger(number) || number < 1) {
    return { status: 'skipped_invalid_pr' };
  }
  // Check all pages, not only the last comments. Fail closed if too many.
  const comments = [];
  let lastPageFull = false;
  for (let page = 1; page <= 5; page++) {
    const results = await api(
      `${ROOT}/issues/${number}/comments?per_page=100&page=${page}`,
      {},
      'comment_list',
    );
    if (!Array.isArray(results)) throw Error('invalid_comments_response');
    comments.push(...results);
    if (hasRequestForCommit(comments, sha)) {
      return { status: 'already_requested' };
    }
    lastPageFull = results.length === 100;
    if (!lastPageFull) break;
  }
  if (lastPageFull) return { status: 'skipped_comment_limit' };

  // Only Codex-authored inline comments provide severity evidence. An
  // incomplete page scan denies the request rather than resetting the budget.
  const inline = [];
  for (let page = 1; page <= 10; page++) {
    const chunk = await api(
      `${ROOT}/pulls/${number}/comments?per_page=100&page=${page}`,
      {},
      'inline_comments',
    );
    if (!Array.isArray(chunk)) throw Error('invalid_inline_comments_response');
    inline.push(...chunk);
    if (chunk.length < 100) break;
    if (page === 10) return { status: 'skipped_inline_limit' };
  }

  const budget = checkReviewBudget({ comments, inline, sha });
  if (!budget.allowed) {
    if (budget.reason === 'already_requested') return { status: 'already_requested' };
    if (budget.reason === 'previous_review_pending') {
      return { status: 'skipped_previous_review_pending' };
    }
    // The readiness gate rejects this hold. Confirm the current head first.
    const latest = await api(`${ROOT}/pulls/${number}`, {}, 'budget_hold_recheck');
    if (!isEligiblePr(latest, sha, head)) return { status: 'skipped_pr_changed' };
    const reason = budget.severity
      ? budget.reason + ', ' + budget.severity
      : budget.reason;
    const message =
      '**REVIEW HOLD:** automated Codex review budget stopped (' +
      reason +
      '). Owner must inspect remaining findings and authorize further work. No automatic merge.';
    await api(
      `${ROOT}/pulls/${number}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ body: latest.body + '\n\n' + message }),
      },
      'budget_hold',
    );
    return { status: 'review_hold', reason: budget.reason };
  }

  // PRs can receive new commits, close, or gain a review hold during comment
  // pagination. Check the live PR again before posting any request.
  const current = await api(`${ROOT}/pulls/${number}`, {}, 'pr_recheck');
  if (!isEligiblePr(current, sha, head)) {
    return { status: 'skipped_pr_changed' };
  }

  const marker = `${MARKER_PREFIX}${sha} -->`;
  const budgetMarker =
    '<!-- nightlogue-review-budget:v1 ' +
    JSON.stringify({ round: budget.round, severity: budget.severity }) +
    ' -->';
  const body = `@codex review\n\n${marker}\n${budgetMarker}\nOwner-authorized independent review requested after successful CI for the exact tested commit. Owner controls approval and merge.`;
  await api(
    `${ROOT}/issues/${number}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ body }),
    },
    'comment_post',
  );
  return { status: 'requested' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  requestCodexReview()
    .then((result) => console.log('codex_review_request', result.status))
    .catch((error) => {
      console.error('codex_review_request_failed', error.message);
      process.exitCode = 1;
    });
}
