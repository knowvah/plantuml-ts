# Batch 1 — the plumbing (all three INERT)

**Sequenced.** T2 and T3 both depend on T1's helper; they write different
files but the `npm test` gate is global, so they run in order.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `DotInputGraph.linetype` + shared `dotSplinesAttrs` helper | sonnet | `src/core/graph-layout.types.ts`, `src/core/dot-splines.ts` (new) + its test | T0 | [x] |
| T2 | `applyGraphAttrs` consumes the helper (layout side) | sonnet | `src/core/graph-layout-build.ts` + its test | T1 | [x] |
| T3 | `graphAttrLines` consumes the helper (emitter side) | sonnet | `src/core/svek-dot-emit.ts` + its test | T1 | [x] |

**These three are INERT and that is their acceptance criterion.** Nothing
sets `DotInputGraph.linetype` until Batch 2, so no fixture may move. A moved
fixture here means something consumes `linetype` that this mission did not
find — stop condition 2, and the premise is wrong.

Split into three commits rather than one because both emitters depend on the
shared contract ([D2](../decisions.md)); a standalone commit for T1 makes T2
and T3 independently revertible.
