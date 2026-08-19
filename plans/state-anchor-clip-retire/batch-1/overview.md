# Batch 1 — Pre-conditions (serial, NO CODE)

**D1 stands or falls here.** Its placement — one pass after node geometry is
final — assumes node geos ARE final, and in the same coordinate frame as the
transition points, at every entry point. That was inferred during planning from
`DotStringFactory.solve`'s shape, not proven per site in this port. Two of the
six `buildLevelTransitionGeos` call sites pass a **shifted** result, which is
exactly where a frame assumption would break.

This batch writes no source. Its output is a go/no-go plus the evidence.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Prove node geos are final and same-frame at every pass site; verify D4 and D5 | general-purpose (opus) | `.agent-notes/si32-T1.md`, `plans/state-anchor-clip-retire/decision-journal.md` | T0 | [x] |
