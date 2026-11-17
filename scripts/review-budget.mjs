// The first Codex request is round zero. Later requests are repair rounds.
// Use trusted GitHub comments for counting so new commits never reset budgets.
export const MAX_REPAIRS = 5;
export const SEVERITY_BUDGET = Object.freeze({ P1: 5, P2: 3, P3: 1 });

const REQUEST = /<!-- nightlogue-codex-request:([a-f0-9]{40}) -->/;
const BUDGET = /<!-- nightlogue-review-budget:v1 (\{[^\n]*\}) -->/;
const STATUS = /<!-- codex-review-state:v1 (\{[^\n]*\}) -->/;
const CODEX = 'chatgpt-codex-connector[bot]';
const OWNER = 'shavonne-senpai';
const SHA = /^[a-f0-9]{40}$/;

export function reviewRequests(comments) {
  const requests = new Map();
  for (const comment of comments ?? []) {
    if (comment?.user?.login !== OWNER || typeof comment.body !== 'string') continue;
    const match = comment.body.match(REQUEST);
    if (!match || requests.has(match[1])) continue;
    let tag = null;
    try {
      const raw = comment.body.match(BUDGET)?.[1];
      if (raw) tag = JSON.parse(raw);
    } catch {
      // Historical review requests have no structured budget metadata.
    }
    requests.set(match[1], {
      sha: match[1],
      severity: tag?.severity,
      time: comment.created_at ?? '',
    });
  }
  return [...requests.values()].sort((a, b) => a.time.localeCompare(b.time));
}

export function reviewState(comments, sha) {
  const summaries = (comments ?? [])
    .filter((c) => c?.user?.login === CODEX && typeof c.body === 'string')
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
  for (const comment of summaries) {
    const match = comment.body.match(STATUS);
    if (!match) continue;
    try {
      const state = JSON.parse(match[1])?.code_review;
      if (state?.commit_sha === sha) return state;
    } catch {
      return null;
    }
  }
  return null;
}

export function findingsForSha(inlineComments, sha) {
  return (inlineComments ?? [])
    .filter(
      (comment) =>
        comment?.user?.login === CODEX &&
        (comment.commit_id === sha || comment.original_commit_id === sha) &&
        typeof comment.body === 'string',
    )
    .map((comment) => {
      const match = comment.body.match(/\[P([0123])\]/i);
      const severity = match ? 'P' + match[1] : 'P1';
      const title = comment.body
        .replace(/^\s*\[P[0123]\]\s*/i, '')
        .split('\n')[0]
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
      return { severity, fingerprint: (comment.path ?? '') + '|' + title };
    });
}

function highestSeverity(findings) {
  if (findings.some((f) => f.severity === 'P0')) return 'P0';
  if (findings.some((f) => f.severity === 'P1')) return 'P1';
  if (findings.some((f) => f.severity === 'P2')) return 'P2';
  if (findings.some((f) => f.severity === 'P3')) return 'P3';
  // Missing classification is never treated as a minor issue.
  return 'P1';
}

export function checkReviewBudget({ comments, inline, sha }) {
  if (!SHA.test(sha)) return { allowed: false, reason: 'invalid_sha' };

  const requests = reviewRequests(comments);
  if (requests.some((request) => request.sha === sha)) {
    return { allowed: false, reason: 'already_requested' };
  }
  if (!requests.length) return { allowed: true, round: 0, severity: 'initial' };
  if (requests.length - 1 >= MAX_REPAIRS) {
    return { allowed: false, reason: 'global_limit' };
  }

  const last = requests.at(-1);
  const previous = reviewState(comments, last.sha);
  if (!previous || previous.status !== 'completed') {
    return { allowed: false, reason: 'previous_review_pending' };
  }
  const hasReceipt = (comments ?? []).some(
    (comment) =>
      comment?.user?.login === CODEX &&
      comment.body?.includes('<!-- codex-review-receipt:v1 -->') &&
      comment.body?.includes(last.sha.slice(0, 10)),
  );
  if (!hasReceipt) return { allowed: false, reason: 'previous_review_pending' };

  const findings = findingsForSha(inline, last.sha);
  const severity = highestSeverity(findings);
  if (severity === 'P0') return { allowed: false, reason: 'critical_finding', severity };

  let sameSeverityRepairs = 0;
  for (let i = 1; i < requests.length; i++) {
    const priorFindings = findingsForSha(inline, requests[i - 1].sha);
    const inferred = highestSeverity(priorFindings);
    const tagged = requests[i].severity;
    const actual = ['P1', 'P2', 'P3'].includes(tagged) ? tagged : inferred;
    if (actual === severity) sameSeverityRepairs++;
  }
  if (sameSeverityRepairs >= SEVERITY_BUDGET[severity]) {
    return { allowed: false, reason: 'severity_limit', severity };
  }

  // After two repair attempts, unchanged identifiable findings require the owner.
  if (requests.length >= 3) {
    const latestThree = requests.slice(-3).map((request) =>
      findingsForSha(inline, request.sha)
        .map((finding) => finding.fingerprint)
        .filter(Boolean)
        .sort()
        .join('\n'),
    );
    if (latestThree[0] && latestThree[0] === latestThree[1] && latestThree[1] === latestThree[2]) {
      return { allowed: false, reason: 'no_progress', severity };
    }
  }
  return { allowed: true, round: requests.length, severity };
}
