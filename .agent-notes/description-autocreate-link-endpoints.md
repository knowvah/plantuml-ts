## Observation: descriptive parser does not auto-create link-only endpoints
- **Context**: Verifying T6 renderer with `(A) ..> (B) : <<include>>` (endpoints
  appear only in the link line, never declared on their own line).
- **Finding (STALE — see update below)**: `parseDescription` produces the link
  but ZERO nodes, so the edge is dropped (no endpoints) and nothing renders.
  This matched the OLD `parseUseCase`/`parseComponent` exactly — both also
  returned `nodes: []` for the same input. Upstream PlantUML auto-creates
  `(A)`/`(B)`/`[X]` referenced in a link as elements; at the time this note
  was written, neither old parser implemented it.
- **Impact**: Pre-existing upstream-fidelity gap, faithfully carried into the
  merged engine (T4). NOT a consolidation regression.
- **Confidence**: High (verified old + new parsers identically) — AT THE TIME.

### UPDATE 2026-07-10 (link-endpoint auto-create mission task)
This gap was closed by commit `ca67673` ("feat(description-dot): port
CommandLinkElement link grammar", 2026-07-04) — five days *before* this note
was acted on again. `parser.ts`'s `ensureEndpoint()` +
`link-grammar.ts`'s `classifyEndpointShape()` already implement
`CommandLinkElement.getDummy()` in full:
  - `[X]` → component (`descdiagram/command/CommandLinkElement.java:381-383`)
  - `()X` → interface (`:345-354`)
  - `(X)` / `(X)/` → usecase / usecase-business (`:367-372`)
  - `:X:` / `:X:/` → actor / actor-business (`:373-380`)
  - bare/quoted → `STILL_UNKNOWN`, resolved at parse-end via
    `resolveStillUnknown()` mirroring `DescriptionDiagram.makeDiagramReady`
    (`:81-88`) — actor if the diagram has any usecase/actor leaf, else
    interface.
The `remove <id>` guard (line ~332, `removeMatching`) never touches
`ensureEndpoint`/`nodesById.set`, so an undeclared id in a `remove` statement
correctly stays a no-op (test: "removing an unknown id is a silent no-op",
`tests/unit/description/parser.test.ts:434-437`).
Full test coverage already exists: `tests/unit/description/parser.test.ts`
describe block "link grammar — auto-created endpoints
(CommandLinkElement.getDummy)" (LG-11 through LG-17), covering: resolve to
interface (no usecase/actor context), resolve to actor (usecase context
present), paren/bracket/colon shorthand + business variants, container-scoped
auto-create ordering, and duplicate-declaration dedup.
- **Re-verified 2026-07-10**: manually parsed `(A) ..> (B)` → 2 usecase nodes
  + 1 link, matching upstream. `npm test` (4612 tests), `npm run typecheck`,
  `npm run lint` all green. `npx tsx scripts/dot-sync-report.ts class
  component usecase` unchanged from floor (357/234/59). `npm run svg:survey`:
  0 conformant / 354 diverged / 1 oracle-error — IDENTICAL to the T15 baseline
  recorded in `planning/mission-svg-conformance-2/decision-journal.md` (also
  354 diverged), which was measured *after* ca67673 landed. So the
  "childCount divergence bucket (~110 fixtures)" a later mission brief
  attributed to this gap is not attributable to it: the auto-create logic was
  already present when that baseline was taken. Whatever drives the
  `[childCount]` structural diffs in `tests/oracle/svg-conformance/compare.ts`
  is a separate, still-open issue (candidates seen in the same session:
  `buildDotPathFromSplinePoints: expected 1 + 3*n points` edge-draw failures
  in `renderDescription`/`SvekEdge.ts` — worth investigating for that mission
  next, not this one).
- **Confidence**: High (git-verified commit dates + fresh test run + fresh
  survey run in the same session).
