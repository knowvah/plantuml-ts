# T4a: wbs plugin and wiring (D5, D8)

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
1. `src/diagrams/wbs/index.ts`: the `SyncPlugin` in the shape of `src/diagrams/salt/index.ts`
   AFTER sep T5a (read it and `src/diagrams/mindmap/index.ts`): `rawTextBlock`/`drawBodyAt`
   (the diagram's `drawU` once; `calculateDimension` = fork +20), `exportMargin =
   calculateMargin(diagram)` (style `Margin` else `getDefaultMargins()` = `same(10)`, D5),
   `muteColorMapper` seeding `SvgOption.colorMapper` (sep T5c), `calculateBackColor`, the
   `isHandwritten` option, the shared chrome (title/caption/legend/header/footer) through the
   `TitledDiagram` path. Parse via T3c's factory; refusals → the port's error page (D8).
2. `src/index.ts`: `registry.register(wbsPlugin)` beside `mindmapPlugin`/`saltPlugin`.
   `src/core/assemble-svg.ts#finalizeShellFragment`: `case DIAGRAM_TYPE_WBS` beside `MINDMAP`
   and `SALT`. (`block-extractor.ts`, `diagram-type-set.ts`, `TitledDiagram.ts` already carry
   `wbs`/`WBS`; a missing member there is a pure type widening — list it.)
3. Measure: `npm run svg:survey -- wbs --out <worktree>/plans/wbs-engine-port/measurements/T4a/
   parity-wbs.json`; `render-diff` on every non-conformant row and on `activity/bozido-07-geze049`
   (its wbs slot: 163×145 in the jar); a whole-corpus hash diff over `test-results/dot-cache/*/*`
   before/after (sep T4a's `hash-{before,after}.json` method, `.agent-notes/sep-T4a.md`) proving
   no non-wbs, non-bozido bytes changed.
4. Fix what shares a mechanism inside the write-set; group the rest into residual families
   with Java + port `file:line` (the close turns them into batch-5 specs).

## Write-set
`src/diagrams/wbs/index.ts`, the one line in `src/index.ts`, the one case in
`src/core/assemble-svg.ts`, `tests/unit/wbs/{index,render-plugin}.test.ts`, probe fixtures under
`tests/fixtures/wbs/` (flat `<slug>.puml` + `.svg` via `oracle-render.sh` only), `docs/catalog.md`,
`.agent-notes/wep-T4a.md`, `plans/wbs-engine-port/measurements/T4a/**`. Any OTHER file is a stop;
`oracle/goldens/**` and the ratchet tests are orchestrator-only (report the rows that would move).

## Acceptance
- Given each of the 204 fixtures, then it routes WBS and renders (no sentinel); per-row
  render-diff reported.
- Given bozido-07, then its wbs slot measures 163×145 and the hash diff names only wbs rows
  and bozido.
- Given a source no command accepts, then our error page renders (the 28 stock-error rows
  stay error pages on our side).
- Given every other engine's golden ratchet, then nothing changes.

**Observability:** N/A. **Rollback:** Reversible.
