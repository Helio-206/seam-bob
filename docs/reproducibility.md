# Reproducibility

The public release contains the demo workspace, the five-invariant evaluator,
and the curated results. No IBM Bob run is needed to reproduce the final local
checks.

```bash
cd seam-bob
npm run install:all
npm test
npm run typecheck
npm run lint
npm run build
bash scripts/run_system_evaluator.sh
```

For a local Bob session, export the contract path before entering the
Bob-visible workspace:

```bash
export SEMANTIC_BOUNDARY_CONTRACT_PATH="$PWD/runtime-contracts/customer-field-migration.json"
cd demo-workspace
```

The hook writes sanitized decisions to
`demo-workspace/.semantic-boundary/events.ndjson`. The replay UI does not read
Bob or require an API key.
