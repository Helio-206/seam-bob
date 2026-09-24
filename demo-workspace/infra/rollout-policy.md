# Production Rollout Policy

Production uses rolling replacement.

For up to 20 minutes, backend version N and backend version N+1 may serve
traffic simultaneously against the same database.

Database migrations must remain compatible with both application versions
during that overlap.

For destructive schema changes use expand/contract:

1. Expand without removing the representation required by N.
2. Deploy N+1 so it can coexist with N.
3. Backfill or dual-write as required.
4. Remove the legacy representation only in a later release after N is drained.

Renaming or dropping a column that version N still reads or writes is not safe
during the rolling window.
