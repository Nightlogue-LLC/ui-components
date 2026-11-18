// The first Codex request is round zero. Later requests are repair rounds.
// Use trusted GitHub comments for counting so new commits never reset budgets.
export const MAX_REPAIRS = 5;
export const SEVERITY_BUDGET = Object.freeze({ P1: 5, P2: 3, P3: 1 });

const REQUEST = /<!-- nightlogue-codex-request:([a-f0-9]{40}) -->/;
const BUDGET = /<!-- nightlogue-review-budget:v1 (\{[^\n]*\}) -->/;
const STATUS = /<!-- codex-review-state:v1 (\{[^\n]*\}) -->/;
const STATUS_PREFIX = '<!-- codex-review-state:v1 ';
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

// ---------------------------------------------------------------------------
// Codex completion evidence (SHAE-13 F-1)
//
// Codex publishes its final receipt in one of two shapes, observed live:
//   * clean review:            an ISSUE COMMENT authored by the Codex bot;
//   * review with findings:    a PULL REQUEST REVIEW authored by the Codex bot
//                              (inline findings hang off that review).
// Both carry `<!-- codex-review-receipt:v1 -->` and a `Reviewed commit:` line.
// Evidence is accepted only from the exact Codex bot identity and only for the
// exact commit. Nothing here clears a hold or lowers any requirement.
// ---------------------------------------------------------------------------
const RECEIPT_MARKER = '<!-- codex-review-receipt:v1 -->';
// Matches "Reviewed commit: abc", "**Reviewed commit:** `abc`" and similar.
const REVIEWED_COMMIT = /Reviewed commit:(?:\*\*)?\s*`?([a-f0-9]{10,40})`?(?![a-f0-9])/i;
// PENDING reviews are unsubmitted drafts and DISMISSED reviews are withdrawn.
const SUBMITTED_REVIEW_STATES = new Set(['COMMENTED', 'APPROVED', 'CHANGES_REQUESTED']);

function isCodexBot(user) {
  // The `[bot]` login can only belong to a GitHub App. When GitHub reports a
  // type, it must agree.
  return user?.login === CODEX && (user.type === undefined || user.type === 'Bot');
}

function receiptNamesCommit(body, sha) {
  if (typeof body !== 'string' || !body.includes(RECEIPT_MARKER)) return false;
  const named = body.match(REVIEWED_COMMIT)?.[1]?.toLowerCase();
  return typeof named === 'string' && sha.startsWith(named);
}

// Returns { source } for the first valid receipt of this exact commit, else null.
export function codexReceipt({ comments, reviews, sha }) {
  if (!SHA.test(sha ?? '')) return null;
  for (const comment of Array.isArray(comments) ? comments : []) {
    if (isCodexBot(comment?.user) && receiptNamesCommit(comment.body, sha)) {
      return { source: 'issue_comment' };
    }
  }
  for (const review of Array.isArray(reviews) ? reviews : []) {
    if (
      isCodexBot(review?.user) &&
      SUBMITTED_REVIEW_STATES.has(review.state) &&
      // Full 40-character head the review was written for, not just the text.
      review.commit_id === sha &&
      receiptNamesCommit(review.body, sha)
    ) {
      return { source: 'pull_request_review' };
    }
  }
  return null;
}

// Classifies Codex's review of exactly `sha` as:
//   pending  - not provably finished for this commit (default; fails closed)
//   findings - finished, receipt verified, findings reported
//   clean    - finished, receipt verified, no findings of any kind
export function classifyCodexReview({ comments, reviews, sha }) {
  const pending = (reason) => ({ status: 'pending', reason });
  if (!SHA.test(sha ?? '') || !Array.isArray(comments)) return pending('invalid_input');
  const summary = comments
    .filter(
      (c) => isCodexBot(c?.user) && typeof c.body === 'string' && c.body.includes(STATUS_PREFIX),
    )
    .sort((a, b) => (a.updated_at ?? '').localeCompare(b.updated_at ?? ''))
    .at(-1);
  if (!summary) return pending('summary_missing');
  let state;
  try {
    state = JSON.parse(summary.body.match(STATUS)?.[1]);
  } catch {
    return pending('summary_unreadable');
  }
  const code = state?.code_review;
  const security = state?.security_review;
  if (code?.commit_sha !== sha) return pending('summary_for_other_commit');
  if (code.status !== 'completed') return pending('review_not_completed');
  const securityRan = security?.status != null;
  if (securityRan && (security.status !== 'completed' || security.commit_sha !== sha)) {
    return pending('security_review_not_completed');
  }
  const receipt = codexReceipt({ comments, reviews, sha });
  if (!receipt) return pending('receipt_missing');

  const flags = [code.has_any_findings, code.has_unresolved_findings];
  if (securityRan) flags.push(security.has_any_findings, security.has_unresolved_findings);
  if (flags.includes(true)) return { status: 'findings', receipt };
  // Anything other than an explicit "no findings" is uncertain, never clean.
  if (flags.some((flag) => flag !== false)) return pending('findings_state_unknown');
  return { status: 'clean', receipt };
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

export function checkReviewBudget({ comments, inline, reviews, sha }) {
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
  // The receipt may be an issue comment (clean review) or a PR review (review
  // with findings). Either must be Codex-authored and name the exact commit.
  if (!codexReceipt({ comments, reviews, sha: last.sha })) {
    return { allowed: false, reason: 'previous_review_pending' };
  }

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
