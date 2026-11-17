import test from 'node:test';
import assert from 'node:assert/strict';
import {
  identifyLinkedIssue,
  desiredState,
  syncLinearLifecycle,
} from './sync-linear-lifecycle.mjs';

const pr = {
  user: { login: 'nightlogue-conductor[bot]' },
  base: { repo: { full_name: 'Nightlogue-LLC/ui-components' }, ref: 'main' },
  head: {
    repo: { full_name: 'Nightlogue-LLC/ui-components' },
    ref: 'agent/uicomp-13-codex-ready-gate',
  },
  body:
    '<!-- nightlogue-auto-pr -->\n## Issue\n' +
    'https://linear.app/nightlogue-llc/issue/UICOMP-13/automate-codex-cleared-pr-readiness-and-linear-review-lifecycle\n',
  state: 'open',
  merged: false,
};
const issue = {
  id: '4fa6aa7e-7edd-4b66-abf1-7b3c64fd08e6',
  identifier: 'UICOMP-13',
  archivedAt: null,
  team: { id: '356a3a39-76a2-4026-b419-8930d0444f09' },
  state: { id: '8e27abcc-8917-4ea9-98fd-54160876617f', name: 'In Progress', type: 'started' },
  labels: { nodes: [{ name: 'agent-ok' }], pageInfo: { hasNextPage: false } },
};

function apiFixture(current = issue) {
  const calls = [];
  const fetchImpl = async (_url, init) => {
    const request = JSON.parse(init.body);
    calls.push(request);
    const data = request.query.startsWith('query')
      ? { issue: current }
      : {
          issueUpdate: {
            success: true,
            issue: {
              id: current.id,
              state: { id: request.variables.input.stateId },
            },
          },
        };
    return { ok: true, json: async () => ({ data }) };
  };
  return { calls, fetchImpl };
}

test('only exact linked issue and Conductor-authored PR are eligible', () => {
  assert.equal(identifyLinkedIssue(pr), 'UICOMP-13');
  assert.equal(identifyLinkedIssue({ ...pr, user: { login: 'other' } }), null);
  assert.equal(identifyLinkedIssue({ ...pr, body: pr.body + '**REVIEW HOLD:**' }), null);
  assert.equal(
    identifyLinkedIssue({ ...pr, head: { ...pr.head, ref: 'agent/uicomp-12-other' } }),
    null,
  );
  assert.equal(desiredState('opened', pr), 'In Review');
  assert.equal(desiredState('closed', { ...pr, merged: true, state: 'closed' }), 'Done');
  assert.equal(desiredState('closed', { ...pr, merged: false, state: 'closed' }), null);
});

test('moves authorized bot PR from In Progress to In Review', async () => {
  const f = apiFixture();
  const result = await syncLinearLifecycle({
    event: 'opened',
    pr,
    token: 'test-token',
    fetchImpl: f.fetchImpl,
  });
  assert.equal(result.status, 'updated');
  assert.equal(result.state, 'In Review');
  assert.equal(f.calls[1].variables.input.stateId, '36f5b650-7577-4f21-9d13-d96149c47753');
});

test('closed unmerged PR and missing token cause no mutation', async () => {
  const f = apiFixture();
  assert.equal(
    (
      await syncLinearLifecycle({
        event: 'closed',
        pr: { ...pr, state: 'closed' },
        token: 'test-token',
        fetchImpl: f.fetchImpl,
      })
    ).reason,
    'ineligible',
  );
  assert.equal(f.calls.length, 0);
});

test('refuses wrong team, removed approval, and status regressions', async () => {
  for (const changed of [
    { ...issue, team: { id: 'other' } },
    { ...issue, labels: { nodes: [], pageInfo: { hasNextPage: false } } },
    { ...issue, state: { name: 'Done', type: 'completed' } },
  ]) {
    const f = apiFixture(changed);
    const result = await syncLinearLifecycle({
      event: 'opened',
      pr,
      token: 'test-token',
      fetchImpl: f.fetchImpl,
    });
    assert.equal(result.status, 'skipped');
    assert.equal(f.calls.length, 1);
  }
});

test('merge sets Done only from In Review', async () => {
  const f = apiFixture({
    ...issue,
    state: {
      id: '36f5b650-7577-4f21-9d13-d96149c47753',
      name: 'In Review',
      type: 'started',
    },
  });
  const result = await syncLinearLifecycle({
    event: 'closed',
    pr: { ...pr, state: 'closed', merged: true },
    token: 'test-token',
    fetchImpl: f.fetchImpl,
  });
  assert.equal(result.state, 'Done');
  assert.equal(f.calls[1].variables.input.stateId, '95df83c2-2d63-42de-aa0e-aa4e9d251c8d');
});
