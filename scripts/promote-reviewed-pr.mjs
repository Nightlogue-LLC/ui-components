import { pathToFileURL } from 'node:url';

const OWNER = 'Nightlogue-LLC';
const REPO = 'ui-components';
const API = 'https://api.github.com/repos/' + OWNER + '/' + REPO;
const BOT = 'nightlogue-conductor[bot]';
const CODEX = 'chatgpt-codex-connector[bot]';
const REVIEW_PREFIX = '<!-- codex-review-state:v1 ';
const RECEIPT_PREFIX = '<!-- codex-review-receipt:v1 -->';
const SHA = /^[a-f0-9]{40}$/;

export function eligiblePr(pr) {
  return (
    pr?.state === 'open' &&
    pr?.draft === true &&
    pr?.user?.login === BOT &&
    pr?.head?.repo?.full_name === OWNER + '/' + REPO &&
    pr?.base?.ref === 'main' &&
    SHA.test(pr?.head?.sha ?? '') &&
    typeof pr?.node_id === 'string' &&
    pr.node_id.length > 0 &&
    typeof pr?.body === 'string' &&
    pr.body.includes('<!-- nightlogue-auto-pr -->') &&
    !pr.body.includes('**REVIEW HOLD:**')
  );
}

export function cleanCodexReview(comments, sha) {
  if (!SHA.test(sha) || !Array.isArray(comments)) return false;
  const summaries = comments
    .filter((c) => c?.user?.login === CODEX && typeof c.body === 'string')
    .filter((c) => c.body.includes(REVIEW_PREFIX))
    .sort((a, b) => (a.updated_at ?? '').localeCompare(b.updated_at ?? ''));
  const last = summaries.at(-1);
  if (!last) return false;
  const match = last.body.match(/<!-- codex-review-state:v1 (\{[^\n]*\}) -->/);
  if (!match) return false;
  let state;
  try {
    state = JSON.parse(match[1]);
  } catch {
    return false;
  }
  const review = state?.code_review;
  const security = state?.security_review;
  if (
    review?.commit_sha !== sha ||
    review.status !== 'completed' ||
    review.has_any_findings !== false ||
    review.has_unresolved_findings !== false
  ) return false;
  if (
    security?.status != null &&
    (security.status !== 'completed' ||
      security.commit_sha !== sha ||
      security.has_any_findings !== false ||
      security.has_unresolved_findings !== false)
  ) return false;
  // The status summary alone is insufficient; require the independent final receipt.
  return comments.some(
    (c) =>
      c?.user?.login === CODEX &&
      typeof c.body === 'string' &&
      c.body.includes(RECEIPT_PREFIX) &&
      c.body.includes('Reviewed commit:') &&
      c.body.includes(sha.slice(0, 10)),
  );
}

export function successfulCi(runs, sha) {
  if (!SHA.test(sha) || !Array.isArray(runs)) return false;
  for (const event of ['push', 'pull_request']) {
    const eligible = runs
      .filter((r) => r?.name === 'CI' && r?.event === event && r?.head_sha === sha)
      .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
    const newest = eligible.at(-1);
    if (!newest || newest.status !== 'completed' || newest.conclusion !== 'success') {
      return false;
    }
  }
  return true;
}

export async function promoteReviewedPr({
  number,
  readToken,
  appToken,
  fetchImpl = fetch,
} = {}) {
  const skip = (reason) => ({ status: 'skipped', reason });
  if (!Number.isSafeInteger(number) || number < 1 || !readToken || !appToken) {
    return skip('not_configured');
  }
  const api = async (url, token, init = {}) => {
    const response = await fetchImpl(url, {
      ...init,
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'nightlogue-codex-ready-gate',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw Error('github_request_failed_' + response.status);
    return response.json();
  };
  const prUrl = API + '/pulls/' + number;
  const pr = await api(prUrl, readToken);
  if (!eligiblePr(pr)) return skip('ineligible_pr');
  const sha = pr.head.sha;

  const comments = [];
  for (let page = 1; page <= 5; page++) {
    const chunk = await api(
      API + '/issues/' + number + '/comments?per_page=100&page=' + page,
      readToken,
    );
    if (!Array.isArray(chunk)) return skip('bad_comments');
    comments.push(...chunk);
    if (chunk.length < 100) break;
    if (page === 5) return skip('comments_limit');
  }
  if (!cleanCodexReview(comments, sha)) return skip('codex_not_clear');

  const result = await api(
    API + '/actions/runs?head_sha=' + sha + '&per_page=100',
    readToken,
  );
  if (result.total_count > 100 || !successfulCi(result.workflow_runs, sha)) {
    return skip('ci_not_clear');
  }

  // Recheck the live PR immediately before mutation. GitHub's ready mutation
  // has no expected-head argument; branch protection must still guard merges.
  const latest = await api(prUrl, readToken);
  if (!eligiblePr(latest) || latest.head.sha !== sha || latest.node_id !== pr.node_id) {
    return skip('pr_changed');
  }

  const mutation = 'mutation($id:ID!){ markPullRequestReadyForReview(input:{pullRequestId:$id}) { pullRequest { id isDraft headRefOid } } }';
  const updated = await api('https://api.github.com/graphql', appToken, {
    method: 'POST',
    body: JSON.stringify({ query: mutation, variables: { id: pr.node_id } }),
  });
  if (
    updated.errors?.length ||
    updated.data?.markPullRequestReadyForReview?.pullRequest?.isDraft !== false ||
    updated.data?.markPullRequestReadyForReview?.pullRequest?.headRefOid !== sha
  ) throw Error('ready_transition_unconfirmed');
  return { status: 'ready', number };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const number = Number(process.env.PR_NUMBER);
  promoteReviewedPr({
    number,
    readToken: process.env.GITHUB_READ_TOKEN,
    appToken: process.env.NIGHTLOGUE_APP_TOKEN,
  })
    .then((result) => console.log('codex_ready_gate', result.status, result.reason ?? ''))
    .catch((error) => {
      console.error('codex_ready_gate_failed', error.message);
      process.exitCode = 1;
    });
}
