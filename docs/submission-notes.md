# Submission notes

## Project title

SEAM — Semantic Integrity Layer for Agentic Software

## Opening

Imagine an AI developer knows three critical rules before starting a job.
When it delegates that job, only two rules reach the next agent. The code may
still look correct — but the system can break.

That is the problem SEAM catches.

Bob uses subagents to delegate focused work. SEAM verifies that critical
meaning survives that real Bob handoff.

## Hook

**Bob knew the requirement. The handoff lost it.**

**Coding agents review code. SEAM reviews what one agent tells another.**

## Short description

SEAM is the semantic integrity layer for AI agent handoffs. In a recorded IBM
Bob IDE run, SEAM checks the actual `spawn_subagent` call through Bob's
`PreToolUse` hook. It blocks the first handoff when a rollout requirement is
missing, gives Bob repair feedback, and allows the repaired retry. The
recorded implementation passed 8/8 normal tests and 5/5 system invariants.

## Product story

**Without SEAM:** Bob delegates → a critical rollout rule is lost → code looks
locally valid → a release regression can be found later.

**With SEAM:** Bob delegates → SEAM detects the missing meaning → the handoff
is blocked before subagent execution → Bob repairs and retries → work
continues.

This is developer infrastructure for AI-assisted application maintenance,
database and schema migration, rolling deployment, and release safety. Its
value is preventing agent-caused rework and release regressions from
incomplete handoffs.

## Why IBM Bob

Bob Agent mode can delegate focused work to subagents with isolated context.
Isolation helps keep each subagent focused; the parent explicitly passes the
context it needs. SEAM uses Bob's real `PreToolUse` lifecycle hook at the
`spawn_subagent` boundary, before the subagent executes. Bob receives precise
remediation feedback and can repair the handoff and retry.

Bob provides the real agent-to-agent boundary. SEAM makes that boundary
semantically verifiable.

## Discovery and evidence

SEAM Discover deterministically extracts candidate dependencies from the
demonstrated migration workflow. It connects repository provenance to
controlled evidence, then compiles the existing semantic boundary contract.
The isolated `LIVE_N_WRITE_COMPAT` ablation scored 4/5 in all three runs
without the requirement and 5/5 in all three runs with it. C and R are
source-supported; L is proven relevant in this controlled workflow. This is
not a claim that SEAM discovers or proves every requirement.

## Technical category

Semantic Integrity Layer for Agentic Software. “Semantic firewall” describes
the visual metaphor for the boundary check; it is not the formal category.

## Technologies

Next.js, TypeScript, CSS, Python, IBM Bob `PreToolUse` lifecycle hooks, and a
deterministic semantic contract.

## Limitations

The current prototype demonstrates deterministic discovery and
evidence-backed enforcement for one migration workflow. It does not guarantee
safe AI code, eliminate hallucinations, or solve agent context loss
universally. IBM Bob is not invoked by replay mode.

## Links

- GitHub: https://github.com/Helio-206/seam-bob
- Demo: https://demo-ui-woad.vercel.app
- Video: `<DEMO_VIDEO_URL>`

## 100–150 word version

SEAM is the semantic integrity layer for AI agent handoffs. Imagine an AI
developer knows three critical rules, but when it delegates a job, only two
reach the next agent. The code may look correct while the system breaks. Bob
uses subagents for focused work with isolated context. SEAM checks Bob’s real
`spawn_subagent` call through the `PreToolUse` hook before the subagent runs.
In the recorded IBM Bob IDE run, SEAM blocked a handoff missing the live-write
compatibility requirement. Bob received repair feedback, retried with all
three requirements, and the handoff was allowed. The completed implementation
passed 8/8 normal tests and 5/5 system invariants. A controlled ablation scored
4/5 in each of three runs without the requirement and 5/5 in each run with it.
SEAM demonstrates deterministic discovery and evidence-backed enforcement for
this migration workflow; it does not claim universal semantic discovery or
safe code guarantees.
