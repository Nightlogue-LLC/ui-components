import { pathToFileURL } from 'node:url';

const TEAM_ID = '356a3a39-76a2-4026-b419-8930d0444f09';
const STATES = {
  'In Progress': '8e27abcc-8917-4ea9-98fd-54160876617f',
  'In Review': '36f5b650-7577-4f21-9d13-d96149c47753',
  Done: '95df83c2-2d63-42de-aa0e-aa4e9d251c8d',
};
const BOT = 'nightlogue-conductor[bot]';
const UUID = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i;

export function identifyLinkedIssue(pr) {
  if (
    pr?.user?.login !== BOT ||
    pr?.base?.repo?.full_name !== 'Nightlogue-LLC/ui-components' ||
    pr?.head?.repo?.full_name !== 'Nightlogue-LLC/ui-components' ||
    pr?.base?.ref !== 'main' ||
    typeof pr?.body !== 'string' ||
    !pr.body.includes('<!-- nightlogue-auto-pr -->') ||
    pr.body.includes('**REVIEW HOLD:**')
  ) return null;
  const url = pr.body.match(
    /^## Issue\s*\n(https:\/\/linear\.app\/nightlogue-llc\/issue\/UICOMP-(\d+)\/[a-z0-9-]+)\s*$/m,
  );
  if (!url) return null;
  const branch = pr.head?.ref;
  if (typeof branch !== 'string' || !branch.startsWith('agent/uicomp-' + url[2] + '-')) {
    return null;
  }
  return 'UICOMP-' + url[2];
}

export function desiredState(event, pr) {
  if (!identifyLinkedIssue(pr)) return null;
  if (event === 'closed' && pr.merged === true) return 'Done';
  if (['opened', 'ready_for_review', 'reopened'].includes(event) && pr.state === 'open') {
    return 'In Review';
  }
  return null;
}

export async function syncLinearLifecycle({
  event,
  pr,
  token,
  fetchImpl = fetch,
} = {}) {
  const issueId = identifyLinkedIssue(pr);
  const target = desiredState(event, pr);
  const skip = (reason) => ({ status: 'skipped', reason });
  if (!issueId || !target) return skip('ineligible');
  if (typeof token !== 'string' || !token) return skip('token_not_configured');

  const api = async (query, variables) => {
    const response = await fetchImpl('https://api.linear.app/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw Error('linear_unavailable');
    const json = await response.json();
    if (json.errors?.length || !json.data) throw Error('linear_request_failed');
    return json.data;
  };
  const result = await api(
    'query($id:String!){issue(id:$id){id identifier archivedAt team{id} state{id name type} labels{nodes{name} pageInfo{hasNextPage}}}}',
    { id: issueId },
  );
  const issue = result.issue;
  if (
    !issue ||
    !UUID.test(issue.id) ||
    issue.identifier !== issueId ||
    issue.team?.id !== TEAM_ID ||
    issue.archivedAt != null ||
    issue.labels?.pageInfo?.hasNextPage !== false ||
    !issue.labels?.nodes?.some((label) => label.name === 'agent-ok')
  ) return skip('issue_not_authorized');
  if (issue.state?.id === STATES[target]) return skip('already_synced');
  if (
    target === 'In Review' &&
    !['backlog', 'unstarted', 'started'].includes(issue.state?.type)
  ) return skip('status_not_eligible');
  if (target === 'Done' && issue.state?.name !== 'In Review') {
    return skip('not_in_review');
  }
  const updated = await api(
    'mutation($id:String!,$input:IssueUpdateInput!){issueUpdate(id:$id,input:$input){success issue{id state{id}}}}',
    { id: issue.id, input: { stateId: STATES[target] } },
  );
  if (
    updated.issueUpdate?.success !== true ||
    updated.issueUpdate?.issue?.id !== issue.id ||
    updated.issueUpdate?.issue?.state?.id !== STATES[target]
  ) throw Error('linear_transition_unconfirmed');
  return { status: 'updated', issue: issueId, state: target };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pr = JSON.parse(process.env.PR_SNAPSHOT ?? '{}');
  syncLinearLifecycle({
    event: process.env.PR_EVENT,
    pr,
    token: process.env.LINEAR_LIFECYCLE_API_KEY,
  })
    .then((result) => console.log('linear_lifecycle', result.status, result.reason ?? result.state ?? ''))
    .catch((error) => {
      console.error('linear_lifecycle_failed', error.message);
      process.exitCode = 1;
    });
}
