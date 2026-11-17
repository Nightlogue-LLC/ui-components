# UICOMP-18 — merge webhook observation smoke test

This documentation-only marker checks that a successful `agent/**` push CI run creates a Nightlogue Conductor-authored draft pull request. After independent review, the owner may merge the PR to test delivery of a signed GitHub `pull_request` merge event to the Agent Relay `POST /api/merge-unblock` endpoint.

Expected relay response with `AGENT_RELAY_SUCCESSOR_ENABLED=false`:

```json
{"accepted":true,"action":"observed","mode":"observe_only"}
```

No Linear `agent-ok` approval is needed for this manual branch-push test; no Claude routine or successor dispatch should start. Keep the feature flag disabled throughout the test. This marker contains no credentials, production code, or changes to any component behavior.
