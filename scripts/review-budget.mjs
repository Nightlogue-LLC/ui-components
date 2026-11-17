// Pure review-cycle accounting. The initial request is round zero; subsequent
// requests are repair reviews, counted across commits and workflow restarts.
export const MAX_REPAIRS = 5;
export const SEVERITY_BUDGET = Object.freeze({ P1: 5, P2: 3, P3: 1 });
const REQUEST = /<!-- nightlogue-codex-request:([a-f0-9]{40}) -->/;
const BUDGET = /<!-- nightlogue-review-budget:v1 (\{[^\n]*\}) -->/;
const STATUS = /<!-- codex-review-state:v1 (\{[^\n]*\}) -->/;
const CODEx = 'chatgpt-codex-connector[bot]';
const OWNER = 'shavonne-senpai';
const SHA = /^[a-f0-9]{40}$/;

export function reviewRequests(comments) {
  const requests = new Map();
  for (const c of comments ?? []) {
    if (c?.user?.login !== OWNER || typeof c.body !== 'string') continue;
    const m = c.body.match(REQUEST);
    if (!m || requests.has(m[1])) continue;
    let tag = null;
    try {
      const raw = c.body.match(BUDGET)?.[1];
      if (raw) tag = JSON.parse(raw);
    } catch { /* historical requests lack structured metadata */ }
    requests.set(m[1], { sha: m[1], severity: tag?.severity, time: c.created_at ?? '' });
  }
  return [...requests.values()].sort((a,b)=>a.time.localeCompare(b.time));
}

export function reviewState(comments, sha) {
  const summaries = (comments ?? []).filter(c=>c?.user?.login===CODEx && typeof c.body==='string')
    .sort((a,b)=>(a.updated_at??'').localeCompare(b.updated_at??''));
  for (const c of summaries.reverse()) {
    const m = c.body.match(STATUS);
    if (!m) continue;
    try {
      const state = JSON.parse(m[1])?.code_review;
      if (state?.commit_sha === sha) return state;
    } catch { return null; }
  }
  return null;
}

export function findingsForSha(inline, sha) {
  return (inline ?? []).filter(c=>c?.user?.login===CODEx &&
    (c.commit_id===sha || c.original_commit_id===sha) &&
    typeof c.body==='string')
    .map(c=>{
      const m = c.body.match(/\[P([123])\]/i);
      const severity = m ? 'P'+m[1] : 'P1'; // Unknown is never downgraded to P3.
      const title = c.body.replace(/^\s*\[P[123]\]\s*/i, '').split('\n')[0]
        .trim().replace(/\s+/g,' ').toLowerCase();
      return {severity, fingerprint: (c.path??'')+'|'+title };
    });
}

export function checkReviewBudget({ comments, inline, sha }) {
  if (!SHA.test(sha)) return { allowed:false, reason:'invalid_sha' };
  const requests = reviewRequests(comments);
  if (requests.some(r=>r.sha===sha)) return { allowed:false, reason:'already_requested' };
  if (!requests.length) return {allowed:true, round:0, severity:'initial'};
  if (requests.length-1 >= MAX_REPAIRS) return {allowed:false, reason:'global_limit'};
  const last = requests.at(-1);
  const previous = reviewState(comments,last.sha);
  if (!previous || previous.status!=='completed') return {allowed:false, reason:'previous_review_pending'};
  // A summary alone can arrive before the review receipt. Do not race it.
  if (!(comments??[]).some(c=>c?.user?.login===CODEx &&
     c.body?.includes('<!-- codex-review-receipt:v1 -->') &&
     c.body?.includes(last.sha.slice(0,10))))
    return {allowed:false,reason:'previous_review_pending'};
  const findings = findingsForSha(inline,last.sha);
  // If the review reports defects but inline details are absent, treat them as P1
  // for budget purposes and escalate any classification uncertainty to owner.
  const severity = findings.length
    ? (findings.some(f=>f.severity==='P1')?'P1':findings.some(f=>f.severity==='P2')?'P2':'P3')
    : 'P1';
  let sameSeverityRepairs=0;
  for(let i=1;i<requests.length;i++){
    const previousFindings=findingsForSha(inline,requests[i-1].sha);
    const inferred=previousFindings.some(f=>f.severity==='P1')?'P1':
      previousFindings.some(f=>f.severity==='P2')?'P2':
      previousFindings.some(f=>f.severity==='P3')?'P3':'P1';
    const actual=['P1','P2','P3'].includes(requests[i].severity)?requests[i].severity:inferred;
    if(actual===severity) sameSeverityRepairs++;
  }
  if (sameSeverityRepairs>=SEVERITY_BUDGET[severity]) {
    return {allowed:false,reason:'severity_limit',severity};
  }
  // Two completed repair rounds with exactly the same substantive findings.
  if(requests.length>=3){
    const last3=requests.slice(-3).map(r=>findingsForSha(inline,r.sha)
      .map(f=>f.fingerprint).filter(Boolean).sort().join('\n'));
    if(last3[0] && last3[0]===last3[1] && last3[1]===last3[2])
      return {allowed:false,reason:'no_progress',severity};
  }
  return {allowed:true,round:requests.length,severity};
}
