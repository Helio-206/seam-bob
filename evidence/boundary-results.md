# Controlled boundary evidence

The boundary experiment isolated one semantic dependency: `LIVE_N_WRITE_COMPAT`.
All six runs were valid. The L0 and L1 delegation payloads were byte-for-byte
identical except for the L requirement.

| Condition | repeat-01 | repeat-02 | repeat-03 |
|---|---:|---:|---:|
| Without `LIVE_N_WRITE_COMPAT` (BOUNDARY_L0) | 4/5 | 4/5 | 4/5 |
| With `LIVE_N_WRITE_COMPAT` (BOUNDARY_L1) | 5/5 | 5/5 | 5/5 |

In this controlled workflow, adding `LIVE_N_WRITE_COMPAT` consistently changed
downstream system correctness from 4/5 to 5/5. This is evidence about this
workflow, not a universal safety guarantee.
