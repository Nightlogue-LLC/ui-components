import { pathToFileURL } from 'node:url';

const OWNER = 'Nightlogue-LLC';
const REPO = 'ui-components';
const ROOT = `https://api.github.com/repos/${OWNER}/${REPO}`;
const BOT = 'nightlogue-conductor[bot]';
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
        comment?.user?.login === BOT &&
        typeof comment.body === 'string' &&
        comment.body.includes(marker),
    )
  );
}

export async function requestCodexReview({ env = process.env, fetchImpl = fetch } = {}) {
  const sha = env.PR_EXPECTED_HEAD_SHA;
  const head = env.PR_HEAD;
  const token = env.NIGHTLOGUE_APP_TOKEN;
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

  const api = async (url, options = {}) => {
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
    if (!response.ok) throw Error(`github_request_failed_${response.status}`);
    return response.json();
  };

  const search = new URLSearchParams({
    state: 'open',
    head: `${OWNER}:${head}`,
    base: 'main',
    per_page: '100',
  });
  const prs = await api(`${ROOT}/pulls?${search}`);
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
    const results = await api(`${ROOT}/issues/${number}/comments?per_page=100&page=${page}`);
    if (!Array.isArray(results)) throw Error('invalid_comments_response');
    comments.push(...results);
    if (hasRequestForCommit(comments, sha)) {
      return { status: 'already_requested' };
    }
    lastPageFull = results.length === 100;
    if (!lastPageFull) break;
  }
  if (lastPageFull) return { status: 'skipped_comment_limit' };

  const marker = `${MARKER_PREFIX}${sha} -->`;
  const body = `@codex review\n\n${marker}\nIndependent review requested after successful CI for the exact tested commit. Owner controls approval and merge.`;
  await api(`${ROOT}/issues/${number}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
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
