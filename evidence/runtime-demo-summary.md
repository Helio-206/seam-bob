# Runtime demonstration

The final runtime demonstration used the real PreToolUse boundary:

1. Bob read project context.
2. The first `spawn_subagent` handoff contained C and R but missed L.
3. SEAM intercepted it before subagent execution and returned `BLOCK`.
4. Bob received the missing-dependency feedback.
5. Bob independently repaired the handoff and retried.
6. The repaired handoff contained C, R, and L and was allowed.
7. The subagent completed implementation.
8. Normal tests passed 7/7.
9. The external system evaluator passed 5/5.

The release UI replays this verified sequence without requiring Bob or an API
connection. Live mode reads only sanitized decision records from
`.semantic-boundary/events.ndjson`.
