# Methodology

## Observation

The parent agent read the relevant client-support and rollout policies. Local
tests passed, but the system-level compatibility workflow could still fail
because a downstream handoff omitted a live-write dependency.

## Controlled intervention

The boundary experiment isolated the intervention at the actual delegation
payload. L0 and L1 started from the same clean baseline, used the same task,
budget, evaluator, and runner, and differed only by this sentence:

> During rolling deployment, version N may continue creating rows after the
> migration using only customer_name. N+1 must remain able to read those rows.

All six boundary runs were valid.

| Condition | repeat-01 | repeat-02 | repeat-03 |
|---|---:|---:|---:|
| L0, without `LIVE_N_WRITE_COMPAT` | 4/5 | 4/5 | 4/5 |
| L1, with `LIVE_N_WRITE_COMPAT` | 5/5 | 5/5 | 5/5 |

In this controlled workflow, adding `LIVE_N_WRITE_COMPAT` consistently changed
downstream system correctness from 4/5 to 5/5.

## Runtime validation

The final runtime demonstration exercised the real boundary:

1. The first delegation was blocked because L was missing.
2. Bob received exact remediation feedback.
3. Bob repaired the handoff independently.
4. The retry was allowed.
5. Implementation completed.
6. Normal tests passed 8/8.
7. The external five-invariant evaluator passed 5/5.

## Limitations

- This demonstrates one customer-field migration workflow.
- The runtime uses a compiled contract and deterministic marker groups.
- It does not claim universal AI safety or complete semantic understanding.
- It does not automatically discover all dependencies in arbitrary repositories.
- More workflows and contract-discovery methods are future work.
