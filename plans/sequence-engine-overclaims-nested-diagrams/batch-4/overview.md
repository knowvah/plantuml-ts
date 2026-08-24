# Batch 4 — narrow the heuristics that remain

Four tasks, parallel: their write-sets are disjoint and none consumes
another's output.

**Every task in this batch is scoped by the residual T3 measured, not by the
original 86.** T2's reorder is expected to close most of the underclaim
buckets on its own. A task whose bucket is already empty **closes as a
measured no-op** — record the measurement in the journal and commit nothing.
That is a success, not a gap; inventing work to justify a planned task is the
failure mode this paragraph exists to prevent.

The shared rule for all four: **narrow, never widen.** Widening a pattern is
how the over-claim class arose. If closing a bucket appears to need a broader
match, the mechanism has been misread — stop and re-read it.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T4 | [Anchor the arrow patterns](T4-anchor-sequence-patterns.md) | typescript-pro | `src/diagrams/sequence/index.ts`, `tests/unit/sequence/accepts.test.ts` | T3 | [ ] |
| T5 | [Descriptive-signal over-decline](T5-descriptive-signal-overdecline.md) | typescript-pro | `src/core/descriptive-keywords.ts`, `tests/unit/core/descriptive-keywords.test.ts` | T3 | [ ] |
| T6 | [Prose braces claimed as JSON/YAML](T6-json-yaml-prose-braces.md) | typescript-pro | `src/diagrams/json/index.ts`, `src/diagrams/yaml/index.ts`, `tests/unit/json/accepts.test.ts` | T3 | [ ] |
| T7 | [Object `map` syntax](T7-class-map-syntax.md) | typescript-pro | `src/diagrams/class/class-dispatch.ts`, `tests/unit/class/class-dispatch.test.ts` | T3 | [ ] |
