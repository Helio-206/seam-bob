# Runtime demonstration

## Previous Shell validation

The earlier shell validation established the deterministic gate, replay data,
and controlled L0/L1 evidence. Its historical controlled results remain
unchanged: `4/5 × 3` without L and `5/5 × 3` with L.

## IBM Bob IDE runtime verification

This is the official IBM Bob IDE validation performed during the hackathon in
`demo-workspace`.

First delegation:

- tool: `spawn_subagent`
- decision: `BLOCK`
- observed: `CLIENT_N_MINUS_ONE_PAYLOAD`, `ROLLING_N_N_PLUS_1_COMPAT`
- missing: `LIVE_N_WRITE_COMPAT`

Repair:

- Bob received the gate feedback.
- Bob repaired the handoff and retried delegation.

Second delegation:

- tool: `spawn_subagent`
- decision: `ALLOW`
- observed: `CLIENT_N_MINUS_ONE_PAYLOAD`, `ROLLING_N_N_PLUS_1_COMPAT`, `LIVE_N_WRITE_COMPAT`
- missing: none

Final implementation verification:

- normal tests: `8/8`
- external five-invariant system evaluator: `5/5`

The two sanitized decision records are preserved in
[`bob-ide-runtime-events.json`](bob-ide-runtime-events.json). The source log
is `demo-workspace/.semantic-boundary/events.ndjson`.

The release UI replays this verified sequence without requiring Bob or an API
connection. Live mode reads only sanitized decision records from
`.semantic-boundary/events.ndjson`.
