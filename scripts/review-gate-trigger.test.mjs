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
