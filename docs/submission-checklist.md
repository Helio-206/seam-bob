# IBM Bob 2.0 submission checklist

Use this checklist immediately before submitting. It separates repository
proof from the final portal deliverables.

## Repository

- [ ] Repository URL points to the final public commit/branch.
- [ ] `bob_sessions/` contains every relevant Bob IDE task summary screenshot.
- [ ] `evidence/bob-ide-runtime-events.json` is present for the primary judge run.
- [ ] `evidence/proof-carrying-bob-runtime-events.ndjson` is present for the additional proof run.
- [ ] `evidence/proof-carrying-outcome-witness.json` is present and states `7/7` and `5/5`.
- [ ] No DevTools, token, error, or diagnostic screenshots are submitted.
- [ ] No secrets, personal data, client data, or confidential data are committed.

## Product proof

- [ ] Demo URL loads without credentials.
- [ ] Judge replay shows `2/3 → BLOCK → repair → 3/3 → ALLOW`.
- [ ] Controlled evidence shows `4/5 × 3 → 5/5 × 3`.
- [ ] README and submission text distinguish the primary run from the additional `0/3` proof run.
- [ ] Claims remain scoped to the demonstrated migration workflow.

## Portal deliverables

- [ ] Project title.
- [ ] Short description.
- [ ] Long description.
- [ ] IBM Bob Usage Statement.
- [ ] Technology and category tags.
- [ ] Public code repository.
- [ ] Bob task session summary screenshots.
- [ ] Demo platform and application URL.
- [ ] Cover image.
- [ ] Video no longer than three minutes.
- [ ] Video contains at least 90 seconds of the solution in action and visibly demonstrates IBM Bob IDE.
- [ ] Slide presentation.

## Video handoff to Erasmo

The video should show the real Bob IDE task, the actual `spawn_subagent`
boundary, the `BLOCK`, Bob's repair, the retry `ALLOW`, and the resulting
tests. The local replay is supporting evidence, not a replacement for the
required Bob demonstration.
