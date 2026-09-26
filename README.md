# SEAM

## Semantic Boundary Guard for Agent Handoffs

> Bob understood the system. The first handoff did not.

**Discover → Prove → Compile → Enforce**

> Discover what must survive delegation. Prove it. Enforce it.

Repository context → candidate semantic dependencies → controlled counterfactual evidence → compiled contract → Bob `PreToolUse` → **BLOCK / REPAIR / ALLOW**

SEAM prevents AI coding agents from losing critical system requirements when
they delegate work to subagents.

## The problem

AI coding agents increasingly delegate implementation work. A parent agent may
understand architecture, compatibility constraints, and deployment rules, but
the downstream handoff is a compressed representation of that context. A
subagent can therefore produce locally correct code that is globally unsafe.

SEAM places a deterministic semantic gate at the `spawn_subagent` boundary.
It checks a compiled contract before the delegated work executes and returns
precise repair feedback when a dependency is missing.

Traditional contract enforcement starts after a policy is known. SEAM adds an
earlier evidence layer: identify candidate semantics, connect them to
correctness evidence, then compile evidence-backed dependencies into the
enforceable boundary contract. Discovery proposes what might matter;
counterfactual evidence determines what actually mattered.

## Why not just a policy engine?

A policy engine assumes the policy is already known. SEAM separates three
questions: what semantic dependency may matter, what evidence shows that it
affects downstream correctness, and how to enforce it at delegation time. In
the demonstrated workflow, `LIVE_N_WRITE_COMPAT` was isolated through
controlled boundary ablation before it was enforced.

## Result

| Workflow | System evaluator |
|---|---:|
| Without `LIVE_N_WRITE_COMPAT` | 4/5 × 3 runs |
| With `LIVE_N_WRITE_COMPAT` | 5/5 × 3 runs |

The official IBM Bob IDE runtime demonstration is:

`BLOCK → Bob repairs handoff → ALLOW → normal tests 8/8 → system evaluator 5/5`

These are verified results from one controlled workflow. SEAM does not claim a
universal guarantee of safe AI code.

## See it first

The release includes a cinematic replay UI designed for a 16:9 demo:

```bash
npm run install:all
npm run dev
```

Open `http://localhost:3000`. Replay mode is the default and works without Bob,
network access, or credentials. The `LIVE` tab reads sanitized decisions from
`demo-workspace/.semantic-boundary/events.ndjson` when available.

## Architecture

```text
Repository context
      ↓
Deterministic fact extraction → candidate dependencies
      ↓
Controlled evidence verification → SUPPORTED / PROVEN
      ↓
Contract compiler
      ↓
Developer task
      ↓
IBM Bob parent agent
      ↓
spawn_subagent
      ↓
PreToolUse hook
      ↓
SEAM semantic boundary gate
      ↓
ALLOW / BLOCK → repair and retry
```

The current discovery rules inspect the migration's client support policy,
rollout policy, migration, and customer service. They derive C and R from
source constraints, and derive L from the composition of N/N+1 coexistence,
the N write path, the new column migration, and the legacy reader fallback.
The existing controlled ablation is the only evidence that classifies a
candidate as `PROVEN`; C and R remain `SUPPORTED`.

Try the deterministic end-to-end demo:

```bash
npm run seam:discover
```

Or run its stages independently with `python3 scripts/seam.py discover`,
`verify`, `compile`, and `inspect`. Details and limitations are in
[`docs/semantic-discovery.md`](docs/semantic-discovery.md).

The runtime contract lives in `runtime-contracts/`, outside
`demo-workspace/`. Bob's normal repository tools cannot discover it by browsing
the project. The hook receives the proven Bob input schema and resolves the
contract through `SEMANTIC_BOUNDARY_CONTRACT_PATH`.

The current prototype uses deterministic marker groups for three dependencies:

- `CLIENT_N_MINUS_ONE_PAYLOAD`: the previous mobile client may still send `customerName`.
- `ROLLING_N_N_PLUS_1_COMPAT`: N and N+1 coexist; preserve `customer_name`, add/backfill `full_name`, and defer destructive removal.
- `LIVE_N_WRITE_COMPAT`: version N may still write only `customer_name`; N+1 must read those live legacy rows.

## IBM Bob integration

The public `demo-workspace/.bob/settings.json` keeps the existing `PreToolUse`
protocol. It runs the existing trace logger and then
`semantic_boundary_gate.py --hook`. For a local Bob session:

```bash
export SEMANTIC_BOUNDARY_CONTRACT_PATH="$PWD/runtime-contracts/customer-field-migration.json"
cd demo-workspace
bob run --format stream-json "<your task prompt>"
```

The settings file also contains a workspace-relative development value for the
same variable. Do not place `BOB_API_KEY` in the repository; provide it only in
your shell environment.

## Evidence and method

The curated evidence is in [`evidence/`](evidence/):

- [`boundary-results.md`](evidence/boundary-results.md) — controlled L0/L1 table.
- [`final-evaluator.txt`](evidence/final-evaluator.txt) — five external invariants.
- [`final-normal-tests.txt`](evidence/final-normal-tests.txt) — 8/8 final local tests.
- [`runtime-demo-summary.md`](evidence/runtime-demo-summary.md) — blocked and repaired handoff.

The full explanation is in [`docs/methodology.md`](docs/methodology.md).

## Project structure

```text
seam-bob/
├── demo-ui/                 # Next.js replay/live visualization
├── demo-workspace/          # Bob-visible customer migration demo
├── runtime-contracts/       # compiled contract, outside demo-workspace
├── scripts/                 # local gate entrypoint
├── evidence/                # small, verified public evidence set
└── docs/                    # architecture, method, demo, submission handoff
```

## Limitations

SEAM currently demonstrates one migration workflow and relies on a compiled
semantic contract with deterministic marker groups. It does not automatically
discover every dependency in arbitrary software systems, and it does not
guarantee safe AI-generated code. Broader contract discovery and more workflows
are future work.

## License

MIT. See [`LICENSE`](LICENSE).
