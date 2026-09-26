# Future candidate-generation prompt (not executed)

Inspect the repository for semantic dependencies that may need to survive an
agent handoff. Do not edit files and do not claim that a candidate is proven.

Return only JSON with this shape:

```json
{
  "workflow": "short-workflow-name",
  "candidates": [
    {
      "id": "STABLE_UPPER_SNAKE_CASE_ID",
      "statement": "One concise, testable semantic dependency.",
      "sources": [
        {"path": "repository/relative/path", "evidence": "Short exact source excerpt"}
      ],
      "discovery_rationale": "Explain how the source facts imply the candidate.",
      "provenance": {"facts": ["fact names"], "derivation": "Fact combination and reasoning"},
      "confidence": "HIGH",
      "status": "CANDIDATE"
    }
  ]
}
```

Use only `HIGH` or `MEDIUM` confidence categories. Every source path must exist
and every excerpt must be present in that file. Distinguish an explicit source
constraint from an inference, include the facts and reasoning for inferences,
and omit candidates that cannot be tied to repository evidence. Never use
`SUPPORTED` or `PROVEN`; a separate verifier assigns those classifications
from source constraints and controlled evidence.
