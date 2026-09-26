# Erasmo handoff

## The opening

Imagine an AI developer knows three critical rules before starting a job.
When it delegates that job, only two rules reach the next agent. The code may
still look correct — but the system can break.

That is the problem SEAM catches.

Bob uses subagents to delegate focused work. SEAM verifies that critical
meaning survives that real Bob handoff.

## Product

SEAM is the semantic integrity layer for AI agent handoffs. It catches critical
context that disappears when AI coding agents delegate work, before the
subagent executes.

**Hook:** “Bob knew the requirement. The handoff lost it.”

**Memorable line:** “Coding agents review code. SEAM reviews what one agent
tells another.”

## Judge demo

1. A developer asks Bob to rename a customer field during a rolling release.
2. Bob's parent agent has three important rules: old mobile clients still
   work, old and new service versions overlap, and the old version still
   writes customer data.
3. Bob delegates focused implementation work. One rule is missing from the
   handoff.
4. SEAM blocks the actual `spawn_subagent` call before the subagent executes.
5. Bob receives specific remediation, repairs the handoff, and retries.
6. All three semantics arrive; SEAM allows the retry and work continues.
7. The recorded run finishes with 8/8 normal tests and 5/5 system invariants.

Replay mode shows the verified Bob IDE sequence. It is a visual replay of the
recorded BLOCK and ALLOW events, not a new Bob run.

## Why IBM Bob

Bob Agent mode can delegate work to subagents with isolated context. Isolation
keeps each subagent focused; the parent explicitly passes the information its
subagent needs. Bob's `PreToolUse` lifecycle hook gives SEAM a real point to
inspect and block the `spawn_subagent` call before execution. Bob receives the
repair feedback and can retry the handoff.

**Sponsor line:** “Bob provides the real agent-to-agent boundary. SEAM makes
that boundary semantically verifiable.”

## Why the lost requirement matters

During rollout, the old service version can still write the legacy customer
field. The new version must keep reading those writes. If it does not, code
that looks correct in isolation can make new customer data unreadable.

## Discovery and evidence

SEAM Discover extracts candidates from repository facts. Controlled evidence
then classifies only the isolated live-write dependency as `PROVEN` in this
workflow. The curated ablation was 4/5 × 3 without
`LIVE_N_WRITE_COMPAT`, compared with 5/5 × 3 with it. The gate checks the
compiled contract at Bob's delegation boundary.

## Technical references

- Bob IDE decisions: [`evidence/bob-ide-runtime-events.json`](../evidence/bob-ide-runtime-events.json)
- Runtime summary: [`evidence/runtime-demo-summary.md`](../evidence/runtime-demo-summary.md)
- Discovery implementation: [`docs/semantic-discovery.md`](semantic-discovery.md)
- Session screenshots: [`bob_sessions/`](../bob_sessions/)
- One-command discovery demo: `npm run seam:discover`

## Claims and limits

Say: “In our controlled workflow, SEAM identified and enforced a dependency
whose presence changed downstream correctness.”

Do not say that SEAM guarantees safe AI code, discovers every repository
requirement automatically, or proves every semantic dependency. The current
prototype demonstrates deterministic discovery and evidence-backed
enforcement for this migration workflow.
