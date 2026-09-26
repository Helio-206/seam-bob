# Judge Demo — approximately 55 seconds

Start at the landing page. No technical setup or Bob session is required for
the recorded visual replay. Click **Play 55-second Judge Demo** once. It resets
to the parent context and advances through the recorded Bob handoff and result.

## 0–6 seconds · Bob knows the rules

“A developer asks Bob to rename a customer field during a rolling release.
Bob knows three rules that must survive the handoff.”

Point to the three plain-English requirements in **Parent Knows**.

## 6–13 seconds · Bob delegates

“Bob sends the migration task to a focused subagent. One critical rule does
not arrive.”

Point to **Old version still writes data** marked **Lost in handoff**. The
identifier `LIVE_N_WRITE_COMPAT` is available as the secondary label.

## 13–20 seconds · SEAM blocks

“SEAM checks Bob’s actual delegation call before the subagent starts. Only two
of three requirements survived, so SEAM blocks the call.”

Show the `spawn_subagent` boundary and **BLOCK · 1 critical requirement
missing**. This is the recorded Bob IDE event.

## 20–27 seconds · Bob repairs

“Bob receives the missing requirement, repairs the handoff, and retries.”

The demo changes to **Bob repairs and retries**. The replay depicts the
recorded repair; it does not call Bob or create a new runtime event.

## 27–34 seconds · The work continues

“All three requirements now arrive. SEAM allows the retry, and implementation
continues.”

Show **3 / 3 → ALLOW**.

## 34–41 seconds · The recorded result

“The completed run passed all eight normal tests and all five system
invariants.”

Show **8/8** and **5/5**.

## 41–48 seconds · Why that rule mattered

“During rollout, the old version still writes customer data. If the new
version stops reading it, new data can be missed. In the controlled
comparison, this requirement moved correctness from 4/5 to 5/5 in each of
three runs.”

The static page also shows the ablation and old-writer → new-reader
consequence chain for judges who want the details.

## 48–55 seconds · Close

Close with: “Coding agents review code. SEAM reviews what one agent tells
another.” Add: “This is evidence for one controlled workflow, not a universal
safety guarantee.”

## If asked why IBM Bob

“Bob Agent mode delegates focused work to subagents with isolated context.
SEAM uses Bob’s real `PreToolUse` hook to inspect and block `spawn_subagent`
before execution. Bob gets the repair feedback and can retry. Isolation keeps
the subagent focused; SEAM helps the required meaning survive.”
