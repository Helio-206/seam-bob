# Erasmo handoff

## Project

SEAM — Semantic Boundary Guard for Agent Handoffs

## One sentence

SEAM prevents AI coding agents from losing critical requirements when they
delegate work to subagents.

## Hook

“Bob knew the requirement. The first handoff did not.”

## Problem

Agentic coding increasingly uses delegation. A parent agent can know an
architectural constraint while failing to transmit it to a subagent. The
subagent may write locally correct code that is globally unsafe.

## Demo

1. Bob reads project context.
2. Bob tries `spawn_subagent`.
3. SEAM intercepts it via `PreToolUse`.
4. `LIVE_N_WRITE_COMPAT` is missing.
5. Delegation is blocked before execution.
6. Bob receives exact remediation feedback.
7. Bob repairs the handoff automatically.
8. Retry is allowed.
9. Implementation completes.
10. Normal tests pass 7/7.
11. External evaluator passes 5/5.

## Evidence

- Without L: 4/5 × 3 runs.
- With L: 5/5 × 3 runs.
- Valid boundary runs: 6/6.

## Why Bob is essential

- Agent Mode creates a real parent/subagent boundary.
- `PreToolUse` intercepts the actual tool call.
- Bob reacts to hook feedback.
- Bob retries the repaired delegation.

## Differentiation

- Observability asks: “What happened?”
- Evaluation asks: “Did it work?”
- SEAM asks: “Did the semantics required for downstream correctness survive the handoff?”

## Business user

Engineering platform teams and AI platform teams adopting agentic development
workflows.

## Value

Prevent locally-correct but system-unsafe delegated work before execution.

## Do not claim

Do not say: “SEAM guarantees safe AI code.”

Use: “In our controlled workflow, SEAM prevented a reproducible delegation
failure before downstream execution.”

