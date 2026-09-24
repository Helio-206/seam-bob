# Demo script — 60–90 seconds

## 0–10 seconds

“This migration looks simple: rename `customerName` to `fullName`.”

Show the task title and the three dependency cards.

## 10–20 seconds

“But during rollout, old mobile clients and version N are still active.”

Point to C, R, and L. Emphasize that L is about live writes after migration.

## 20–35 seconds

Click **Replay verified run**.

The center panel shows `spawn_subagent`, then:

```text
C ✓   R ✓   L ✕
SEMANTIC BOUNDARY BLOCKED
```

Say: “SEAM intercepts the handoff before the subagent runs.”

## 35–45 seconds

“Bob understood most of the system, but this critical requirement did not
survive the handoff.”

Show the missing `LIVE_N_WRITE_COMPAT` message and the evidence card.

## 45–60 seconds

The replay advances to repair and retry:

```text
C ✓   R ✓   L ✓
DELEGATION ALLOWED
```

“Bob receives the feedback, repairs the delegation, and retries.”

## 60–75 seconds

Show the downstream result:

```text
Normal tests       7 / 7
System invariants  5 / 5
```

## 75–90 seconds

Show the controlled evidence:

```text
Without L: 4/5 × 3
With L:    5/5 × 3
```

Close with: “SEAM verifies the boundary before delegated work executes.”

