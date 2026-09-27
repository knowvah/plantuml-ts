# cdd3-T15 — opale single-bezier guard + freestanding scope removal

## Observation: the bezier-count gate reveals a second, undiagnosed ink gap
- **Context**: C-15/E3-19 fix (`Opale.ts#resolveOpaleConnector` rejects
  connectors routed as more than one bezier), verified on zepeki-75-pifo352.
- **Finding**: once the note correctly falls back to a plain box + drawn
  dashed connector, `class-ink-box.ts#buildInkBox` never walked
  `NoteGeo.connector`'s points for canvas sizing — only an ATTACHED note's
  synthetic `__noteedge_*` connector hits this (a freestanding note's
  connector is a real `EdgeGeo`, already walked). zepeki's canvas was
  49.21px short on every axis until `class-ink-note.ts#addNoteInk` added
  `for (const p of nt.connector) addPoint(box, p.x, p.y)` alongside the
  note's own box ink.
- **Impact**: any other non-strictuml, non-freestanding note whose Opale
  attempt fails (multi-bezier connector) has this same latent canvas-size
  gap. Worth a grep across the corpus if more multi-bezier attached notes
  surface later.
- **Confidence**: High (zepeki 0/109 -> 0/1 numeric after the ink fix,
  matching the exact Δ49.21 the diagnosis's causal chain named).

## Observation: `class-ink-box.ts` was already at the 500-line complexity cap
- **Context**: adding the connector-ink loop pushed the file to 505-514
  lines, blocked by the complexity hook.
- **Finding**: extracted the whole note-ink term (dropped-tip exclusion +
  plain-box rule + the new connector-ink addition) into a new
  `class-ink-note.ts#addNoteInk`, mirroring the file's own
  `class-ink-dot-path.ts` precedent ("purely for size, no behavior change
  to the split itself"). `class-ink-box.ts` is back to 481 lines.
- **Impact**: none functionally; `resolveTips`/`addPlainInk`/`addPoint`
  import ownership moved with the extracted code.
- **Confidence**: High.

## Observation: zepeki's remaining Δ7 residual is a DIFFERENT, undiagnosed mechanism
- **Context**: after both fixes, zepeki is 0 structural / 1 numeric — the
  ONE remaining diff is the tip vertex of the note's `test::member`
  member-tip note (`note left of test::member`), not the `note left`
  connector this task's mechanisms cover.
- **Finding**: jar's tip vertex y is 124.21, ours is 117.214 (Δ6.996) — a
  small, LOCAL discrepancy in `note-tips-resolve.ts`'s row-targeting
  math, unrelated to C-15/E3-19/E3-21. It was invisible before this task
  because the canvas-wide Δ49.21 translation dominated every diff line.
- **Impact**: not chased — outside this task's diagnosed mechanisms, not
  required by the acceptance criteria (only vudepo/lejoga need 0/0), and
  its likely home (`renderer-note.ts`/`note-tips-resolve.ts`) overlaps
  `renderer-note.ts`, a CONCURRENT T24 primary. Left as an open residual
  for a future task; zepeki moved from `diverged` (3/93) to
  `structural-match` (0/1), a strict improvement.
- **Confidence**: Medium (mechanism located to "the tip vertex y" but not
  traced to its Java origin).

## Final report (cdd3-T15)

### Fixtures (S/N, render-diff, before -> after)
- vudepo-27-cuvo793: 84/402 -> 0/0 (closed).
- lejoga-79-poji465: 90/410 -> 0/0 (closed).
- temise-16-neco018: 40/40 -> 0/0 (closed).
- zepeki-75-pifo352: 3/93 -> 0/1 (improved; residual above, separate
  mechanism).

### Mechanisms ported
- **C-15 = E3-19**: `SvekEdge.java:769-770` `if (isOpalisable() == false)
  setOpale(false);` + `:804-806` `return dotPath.getBeziers().size() <= 1;`
  — `resolveOpaleConnector` (`src/core/svek/image/Opale.ts`) now rejects a
  connector with more than 4 points (`DotPath#addCurve`,
  `klimt/shape/DotPath.java:112-124`: `points = 3*beziers + 1`, so
  `beziers <= 1` ⇔ `points <= 4`), falling back to the existing plain-note
  + dashed-connector path (`note-layout-tip.ts#singletonNoteGeo`, no
  change needed there — the fallback dispatch already existed).
- **E3-21**: `GraphvizImageBuilder.java:133-148` `isOpalisable`'s ONLY
  "other end" condition is `single.getOther(entity).getLeafType() !=
  LeafType.NOTE` — no synthetic-entity exclusion. Removed
  `note-freestanding.ts`'s `excludedEntityIds` scope guard (added against
  a pre-C-14/C-15 regression, per its own doc comment) and the
  now-unused `classifiers` parameter from both
  `findFreestandingNoteRelationshipIndices`/`findFreestandingNoteConnectors`
  — updated call sites `class-dot-edges.ts:230`, `layout.ts:344`.
- **Reveal (unnamed in diagnosis)**: connector ink for a non-opalised
  ATTACHED note was never added to `buildInkBox` — see the first
  observation above. `class-ink-note.ts#addNoteInk` (new file, split out
  of `class-ink-box.ts` for the line cap).

### Movers (render-all 723 rows, pre-edit vs post-edit; pin-diff)
- vudepo, lejoga, temise: `diverged -> conformant`.
- zepeki: `diverged -> structural-match`.
- 0 other class movers. 0 rises.

### Other engines (survey pre vs post, T0-baseline scope per task)
- object: 58/11/11 -> 58/11/11, no change.
- state: 71/14/188 -> 71/14/188, no change.
- component: 1/14/251 -> 1/14/251, no change.
- usecase: 2/2/89 (1 oracle-error) -> unchanged.
- unknown: 109/88/625 (3 errored) -> 109/90/623 (3 errored). 2 movers,
  both falls, same mechanism: `cisipo-98-dire511`, `pocoko-23-jupa184`
  (`diverged -> structural-match`) — both are single-link attached-note
  class sources also captured under the `unknown` corpus bucket (same
  underlying class-engine fix; not a new mechanism).

### Write-set
- Primaries: `Opale.ts`, `note-layout-tip.ts` (untouched — its existing
  `singletonNoteGeo`/`buildOpaleNoteGeo ?? plainNoteGeo` fallback needed
  no change), `note-freestanding.ts`.
- D4 extensions (named, no concurrent task owns them): `class-dot-edges.ts`
  and `layout.ts` (call-site signature updates for the dropped
  `classifiers` param), `class-ink-box.ts` + new `class-ink-note.ts` (the
  connector-ink reveal + the line-cap split it required).
- `docs/catalog.md` regenerated (`npm run catalog`) for the new module.

### Gates
- `npm test` (full): 830 passed | 1 skipped; 22800 tests passed | 2 skipped
  | 6 todo. No failures (the one catalog-drift failure on the first run was
  resolved by `npm run catalog` before the final run).
- `npm run typecheck`, `npm run lint`, `npm run build`: all pass.
- `tests/oracle/class-dot-parity.test.ts` + `declaration-order-parity`:
  991/991.
