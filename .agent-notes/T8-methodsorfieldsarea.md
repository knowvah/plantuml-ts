# SI1/T8 — TextBlockLineBefore + MethodsOrFieldsArea

## Observation: parallel vitest coverage runs race on coverage/.tmp
- **Context**: SI1 batch 3 — T6/T7/T8 agents sharing one worktree; T8 ran
  `npm test` while sibling agents were active.
- **Finding**: a full run aborted with `Unhandled Rejection: ENOENT
  coverage/.tmp/coverage-364.json` (rc=1) with ZERO failing tests —
  istanbul's shared `coverage/.tmp` directory was cleaned by a concurrent
  vitest run. An earlier solo run of the identical tree was rc=0
  (535 files / 12104 tests).
- **Impact**: during parallel batches, a full-suite rc=1 whose log shows
  no failed test + a coverage/.tmp ENOENT is an infra race, not a
  regression. Only the orchestrator's serialized batch-close run is
  authoritative.
- **Confidence**: High (both runs captured, /tmp/npmtest.log vs
  /tmp/npmtest2.log).

## Observation: Member is structurally assignable to DisplayElement
- **Context**: passing T7's `Member` rows through `Display.create`.
- **Finding**: `Member` structurally satisfies the `MessageNumberLike`
  arm of `DisplayElement`, so NO cast is needed to place members in a
  `Display` (eslint `no-unnecessary-type-assertion` flags the cast).
  Runtime discrimination must therefore be by surface
  (`TextBlockTracer.ts#isMember` duck-guard), never by union narrowing.
- **Impact**: T9 (BodyEnhanced1) can build the members `Display`
  directly from `Bodier` output without casts; `Display`'s
  `[Symbol.iterator]` COERCES members to strings — always iterate
  `asList()` when member identity matters.
- **Confidence**: High (typecheck + 27 passing tests).

## Observation: TextBlockLineBefore already lives at its upstream home
- **Context**: T8's task spec names `cucadiagram/TextBlockLineBefore.ts`.
- **Finding**: upstream's file is `klimt/shape/TextBlockLineBefore.java`
  and the port already has a COMPLETE `src/core/klimt/shape/
  TextBlockLineBefore.ts` (all 3 ctor arities, calculateDimension,
  drawU, getInnerPosition, getPorts — reinstated by the bodyenhanced
  mission) with its own test file. No cucadiagram copy was created.
- **Impact**: future specs should reference the klimt/shape path.
- **Confidence**: High (read both files side by side).
