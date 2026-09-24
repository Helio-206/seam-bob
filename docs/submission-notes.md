# Submission notes

## Project title

SEAM — Semantic Boundary Guard for Agent Handoffs

## One-line description

SEAM prevents AI coding agents from losing critical requirements when they
delegate work to subagents.

## Short description

SEAM is a deterministic PreToolUse gate for IBM Bob handoffs. It checks a
compiled semantic boundary contract before `spawn_subagent` executes, blocks
missing dependencies, and gives Bob precise repair feedback. In the controlled
customer-field migration workflow, the isolated live-write dependency changed
the downstream evaluator from 4/5 to 5/5 in all three paired runs.

## Long description

Agentic coding systems can reason correctly at the parent level and still lose
one compatibility rule while delegating implementation. SEAM makes that hidden
boundary observable and enforceable. A compiled contract defines three
dependencies for a rolling customer-field migration: previous-client payload
compatibility, N/N+1 rollout compatibility, and live version-N write
compatibility. The PreToolUse gate inspects the actual `spawn_subagent`
description with deterministic marker groups. If L is missing, it blocks the
handoff before downstream execution; Bob repairs the handoff and retries.

The controlled experiment held the task, baseline, evaluator, and runner
constant. L0 scored 4/5 in repeat-01, repeat-02, and repeat-03. L1 scored 5/5
in all three. The final runtime demonstration completed with normal tests 7/7
and external invariants 5/5. This is evidence from one workflow, not a claim
of universal AI safety.

## Technologies

Next.js, TypeScript, Tailwind CSS, Framer Motion, Lucide, Python, IBM Bob
PreToolUse hooks, Node test runner, and a deterministic JSON contract.

## IBM Bob usage

IBM Bob is essential to the demonstration: it creates the parent/subagent
boundary, receives the hook feedback, repairs the handoff, and retries the
delegation. Replay mode is included so the project remains demoable without
Bob or network access.

## Problem

Critical system constraints can disappear when a parent agent compresses its
context into a subagent handoff.

## Solution

SEAM checks required semantic dependencies at the delegation boundary and
blocks before unsafe downstream work executes.

## Innovation

SEAM focuses on semantic continuity at the handoff itself, distinct from
observability, code review, generic context storage, or post-hoc testing.

## Business value

Engineering and AI platform teams can prevent a class of locally-correct but
system-unsafe delegated changes before execution.

## Limitations

The current prototype uses one compiled contract and one migration workflow.
It does not automatically discover every dependency or guarantee safe code.

## Links

- GitHub: `<GITHUB_REPOSITORY_URL>`
- Demo: `<VERCEL_DEMO_URL>`
- Video: `<DEMO_VIDEO_URL>`

## 100–150 word version

SEAM is a Semantic Boundary Guard for agent handoffs. AI coding agents often
delegate implementation to subagents; the parent may understand a deployment
constraint that disappears in the compressed handoff. SEAM adds a deterministic
PreToolUse gate before `spawn_subagent`. A compiled contract checks whether
critical compatibility dependencies survived. In the customer-field migration
workflow, the isolated `LIVE_N_WRITE_COMPAT` dependency was the only difference
between paired payloads. Without it, the external evaluator scored 4/5 in all
three runs. With it, the score was 5/5 in all three. In the final runtime demo,
SEAM blocked the first handoff, Bob repaired it, the retry was allowed, normal
tests passed 7/7, and the evaluator passed 5/5. SEAM demonstrates one workflow,
not universal AI safety.

