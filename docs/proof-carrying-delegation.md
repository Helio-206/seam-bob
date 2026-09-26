# Proof-Carrying Delegation

SEAM verifies the agent-to-agent handoff, not arbitrary natural language. The current discovery provider is deterministic and workflow-specific.

`DISCOVER → PROVE → COMPILE → CARRY → PRE-EXECUTION VERIFY → EXECUTE → OUTCOME WITNESS`

The manifest is strict JSON inside one `<SEAM_MANIFEST>` description block. It contains `schema` (`seam.handoff.v1`), `contract_id`, `contract_sha256`, and unique obligations with `id` and `evidence_status`. Its SHA-256 is an integrity/version digest of UTF-8 JSON serialized with sorted keys and compact stable separators. It is not a cryptographic signature or authentication mechanism.

For an applicable `spawn_subagent`, PreToolUse extracts exactly one manifest, parses it, validates schema, contract id, digest, unique known IDs, and the complete required set. Keywords alone do not pass. The legacy marker matcher remains only for applicability/routing and historical replay.

Outcome Witness runs the existing normal suite and external rolling evaluator, then associates their named real checks with the carried contract postconditions. It emits separate states: `HANDOFF PASS / OUTCOME PASS`, `HANDOFF PASS / OUTCOME FAIL`, or `HANDOFF FAIL / OUTCOME NOT RUN`. Pre-execution proves carriage, not correct implementation.

Threats addressed: keyword stuffing, malformed/stale manifests, missing or duplicate obligations, and valid handoffs with failed implementation. Not solved: a discovery provider can miss a dependency and a compiled contract can be incomplete. This prototype demonstrates one controlled migration workflow; production deployment would cap automated repair attempts and escalate unresolved violations to a developer.

AI generates delegated work. SEAM verifies the handoff deterministically: a probabilistic coding agent should not depend on another probabilistic decision for whether a required system obligation crossed the boundary.
