# Batch 2 — the load-bearing wiring

One task. This is where output actually moves: T3 consumes T1's geometry and
T2's dispatch, drops every `<marker>` reference, and sets
`diagramType: 'SEQUENCE'`.

Every sequence fixture's rendered bytes change here. Do **not** re-pin any
baseline in this batch — that is T4's and T5's job, deliberately separated so
the re-pin is a reviewable commit of its own rather than noise inside the
change that caused it.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T3 | [Renderer wiring](T3-renderer-wiring.md) | typescript-pro | `src/diagrams/sequence/renderer.ts`, `src/diagrams/sequence/renderer-arrowhead.ts`, `tests/unit/sequence/renderer.test.ts`, `docs/catalog.md` | T1, T2 | code done, **BLOCKED** |
