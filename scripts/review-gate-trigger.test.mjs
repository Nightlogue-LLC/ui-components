import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/promote-reviewed-agent-pr.yml', import.meta.url),
  'utf8',
);

test('Codex-ready gate retries once CI completes', () => {
  assert.match(workflow, /workflow_run:\s*\n\s*workflows: \[CI\]\s*\n\s*types: \[completed\]/);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.match(
    workflow,
    /workflow_run\.head_repository\.full_name == 'Nightlogue-LLC\/ui-components'/,
  );
  assert.match(workflow, /ref: main/);
  assert.match(workflow, /scripts\/promote-reviewed-pr\.mjs/);
  assert.match(workflow, /select\(\.draft == true and \.user\.login ==/);
});

test('Retains Codex event trigger and scheduled recovery', () => {
  assert.match(workflow, /issue_comment:/);
  assert.match(workflow, /chatgpt-codex-connector\[bot\]/);
  assert.match(workflow, /cron: '0 \* \* \* \*'/);
  assert.match(workflow, /nightlogue-review-ready/);
});

// ---------------------------------------------------------------------------
// SHAE-13 F-3: concurrency. GitHub keeps ONE running and ONE pending run per
// group; a newer pending run cancels an older pending one, even with
// cancel-in-progress: false. These tests evaluate the real workflow files'
// group expressions and replay events through that rule.
// ---------------------------------------------------------------------------
const opener = readFileSync(
  new URL('../.github/workflows/open-agent-pr-after-ci.yml', import.meta.url),
  'utf8',
);

function jobBlock(text, job) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line === '  ' + job + ':');
  assert.ok(start >= 0, 'job ' + job + ' exists');
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^ {2}\S/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function concurrencyOf(text, job) {
  const block = jobBlock(text, job);
  const match = block.match(
    /\n {4}concurrency:\n {6}group: (>-\n(?: {8}.+\n?)+|.+)\n {6}cancel-in-progress: (true|false)/,
  );
  assert.ok(match, job + ' declares job-level concurrency');
  const group = match[1].replace(/^>-\n/, '').replace(/\n\s*/g, ' ').trim();
  return { group, cancelInProgress: match[2] === 'true' };
}

const format = (template, ...values) =>
  template.replace(/\{(\d+)\}/g, (_, index) => String(values[Number(index)]));

function resolveGroup(template, context) {
  return template.replace(/\$\{\{(.+?)\}\}/gs, (_, expression) =>
    String(new Function('github', 'format', 'return (' + expression + ');')(context, format)),
  );
}

class GitHubConcurrency {
  constructor() {
    this.groups = new Map();
    this.displaced = [];
  }
  submit(group, run) {
    const state = this.groups.get(group.toLowerCase()) ?? { running: null, pending: null };
    this.groups.set(group.toLowerCase(), state);
    if (!state.running) state.running = run;
    else {
      if (state.pending) this.displaced.push(state.pending);
      state.pending = run;
    }
  }
  finish(group) {
    const state = this.groups.get(group.toLowerCase());
    state.running = state.pending;
    state.pending = null;
  }
}

const promoteGroup = (github) => resolveGroup(concurrencyOf(workflow, 'promote').group, github);
const comment = (number) => ({
  event_name: 'issue_comment',
  event: { issue: { number } },
});
const sweepEvent = (event_name) => ({ event_name, event: {} });

test('F-3: workflows never cancel in-progress runs', () => {
  assert.equal(concurrencyOf(workflow, 'promote').cancelInProgress, false);
  assert.equal(concurrencyOf(opener, 'open').cancelInProgress, false);
});

test('F-3: Codex comments for different PRs get distinct groups and displace nothing', () => {
  const queue = new GitHubConcurrency();
  const events = [comment(10), comment(11), comment(12), comment(10)];
  // A sweep is running when four comment events arrive for three PRs.
  queue.submit(promoteGroup(sweepEvent('schedule')), 'sweep');
  for (const [index, event] of events.entries()) queue.submit(promoteGroup(event), 'c' + index);
  // PR 10's second comment waits behind its own first one; no run is displaced.
  assert.deepEqual(queue.displaced, []);
  assert.equal(new Set(events.slice(0, 3).map((event) => promoteGroup(event))).size, 3);
});

test('F-3: duplicate Codex events for one PR still collapse to a single pending run', () => {
  const queue = new GitHubConcurrency();
  const group = promoteGroup(comment(10));
  queue.submit(group, 'first');
  queue.submit(group, 'duplicate-a');
  queue.submit(group, 'duplicate-b');
  assert.equal(queue.groups.get(group.toLowerCase()).running, 'first');
  assert.equal(queue.groups.get(group.toLowerCase()).pending, 'duplicate-b');
  assert.deepEqual(queue.displaced, ['duplicate-a']);
});

test('F-3: CI-completion, hourly and manual sweeps share a group; a comment never joins it', () => {
  const sweeps = ['workflow_run', 'schedule', 'workflow_dispatch'].map((name) =>
    promoteGroup(sweepEvent(name)),
  );
  assert.equal(new Set(sweeps).size, 1);
  assert.notEqual(sweeps[0], promoteGroup(comment(10)));
  assert.match(promoteGroup(comment(10)), /^nightlogue-review-ready-pr-10$/);
});

test('F-3: an old pending sweep is replaced only by a newer sweep, which rescans every draft PR', () => {
  const queue = new GitHubConcurrency();
  const sweep = promoteGroup(sweepEvent('schedule'));
  queue.submit(sweep, 'running-sweep');
  queue.submit(sweep, 'older-sweep');
  queue.submit(promoteGroup(comment(10)), 'comment-10');
  queue.submit(sweep, 'newer-sweep');
  assert.deepEqual(queue.displaced, ['older-sweep']);
});

test('F-3: the previous shared group would have displaced unrelated PRs (model check)', () => {
  const queue = new GitHubConcurrency();
  for (const run of ['pr-10', 'pr-11', 'pr-12']) queue.submit('nightlogue-review-ready', run);
  assert.deepEqual(queue.displaced, ['pr-11']);
});

test('F-3: PR creation is serialized per branch, so competing branches never displace each other', () => {
  const { group } = concurrencyOf(opener, 'open');
  const run = (head_branch) => resolveGroup(group, { event: { workflow_run: { head_branch } } });
  const queue = new GitHubConcurrency();
  const branches = ['agent/shae-1-a', 'agent/shae-2-b', 'claude/c', 'agent/shae-3-d'];
  for (const branch of branches) {
    queue.submit(run(branch), 'running-' + branch);
    queue.submit(run(branch), 'pending-' + branch);
  }
  assert.deepEqual(queue.displaced, []);
  assert.equal(new Set(branches.map(run)).size, branches.length);
  // Two pushes to ONE branch: the newest pending handoff wins (older SHA is stale anyway).
  queue.submit(run('agent/shae-1-a'), 'newest-push');
  assert.deepEqual(queue.displaced, ['pending-agent/shae-1-a']);
});

test('F-3: only eligible push-CI handoffs can enter the PR-creation group', () => {
  const block = jobBlock(opener, 'open');
  assert.match(block, /workflow_run\.conclusion == 'success'/);
  assert.match(block, /workflow_run\.event == 'push'/);
  assert.match(block, /head_repository\.full_name == github\.repository/);
});

test('F-3: the readiness gate still loads the review classifier from trusted main only', () => {
  assert.match(workflow, /ref: main/);
  assert.match(workflow, /scripts\/promote-reviewed-pr\.mjs\n\s+scripts\/review-budget\.mjs/);
  assert.doesNotMatch(workflow, /pull_request_target/);
});
