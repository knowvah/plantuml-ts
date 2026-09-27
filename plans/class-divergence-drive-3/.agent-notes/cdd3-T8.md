# cdd3-T8 — leaf ink (R-LEAF)

## Observation: `tryMeasureDescriptionLeaf` needed a general ink walk, not a
## second actor-only one
- **Context**: cacoma (`component comp3`) canvas 260 vs jar 259; daxeno's
  `<<Database>>` empty-package leaf carried 91 of its 92 diffs from the
  same mechanism (both diagnosed by cdd2-T17, `.agent-notes/cdd2-T17.md`).
- **Finding**: `tryMeasureDescriptionLeaf` set no `symbolInk`, so a
  `component`/`database` leaf fell through to `addRectInk`'s
  `EntityImageClass` box-corner rule instead of the corners its OWN drawn
  shape (`USymbolComponent2#drawComponent2`,
  `decoration/symbol/USymbolComponent2.java:62,68`, one `URectangle`) would
  produce under `LimitFinder#drawRectangle`'s `(x-1,y-1)`/`(x+w-1,y+h-1)`
  rule (`klimt/drawing/LimitFinder.ts:184-188`, faithful port of
  `LimitFinder.java:184-188`).
- **Fix**: generalized `measureUsecaseOrActorLeafInk`
  (`core/svek/image/leaf-sizing-entity.ts`) into `measureEntityLeafInk(node,
  fontSpec, {opts, sprites, measurer})` — the actor/usecase wrapper now
  delegates to it with `opts: undefined` (byte-identical to its pre-T8
  behavior, zero-diff on every actor fixture: same `buildSizingEntityParams`
  call, same params). A new `class-layout-description-leaf-ink.ts` (split
  out to keep `class-layout-generic-classifier.ts` under the 500-line cap)
  gates the new call to EXACTLY `component`/`database` — the two USymbols
  `renderer-usymbol-entity.ts#usesClassUSymbolEntity` ALSO draws through
  `EntityImageDescription.drawU` at render time for a `descriptive`
  classifier (`actor` is already excluded by `tryMeasureDescriptionLeaf`'s
  own early return; `usecase`/`circle` never reach that function — they
  carry a different `classifier.kind`). Every other symbol
  (`folder`/`package`/`note`/...) keeps the untouched `addRectInk` fallback.
  `fontSpec` for the ink call reproduces `measureLeafNode`'s own
  `opts?.fontSize === undefined ? baseFont : {...baseFont, size:
  opts.fontSize}` collapse (`leaf-sizing.ts:117`) so ink and box always
  measure the SAME font.
- **Confidence**: High — `cacoma-43-poxu615`/`daxeno-00-kasu166` both now
  `structural=0 numeric=0` (were `numeric=2`/`92`); `gujigi-63-roki030`
  (cdd2-T17's own named regression risk for walking WITHOUT `opts`)
  measures unchanged at `numeric=576`, confirming the `opts`-threaded walk
  does not repeat that probe's mistake.

## Observation: daxeno's residual title-y diff was a per-run descent bug in
## `buildTextBlock`, unrelated to R-LEAF
- **Context**: after the R-LEAF fix, daxeno's ONE remaining diff was
  `svg/g[1]/g[1]/text[1]/@y  exp=42 | act=42.889` — the FIRST line of a
  two-line, mixed-font-size namespace-cluster title
  (`"<size:18>styled2</size>\nshould be styled"`, 14px bold base, `<<size:
  18>>` override on line 1 only). Line 2 (no override) already matched
  exactly.
- **Finding**: instrumented `measureBuiltLine`
  (`core/svek/image/EntityImageDescriptionTextBlock.ts`) directly (temporary
  `console.error`, removed before commit) and confirmed: line 1's `height`
  correctly used the run's OWN 18px font (`measureAtomsWidthHeight`'s
  existing per-atom max), but its `descent` came from `lineDescent(built
  .lineFont)` — the LINE's BASE font (14px) unconditionally, NEVER the
  run's own overridden font. `14/4.5=3.111` vs the run's own `18/4.5=4.0` —
  an 0.889px baseline error, exactly daxeno's Δ (`drawAtoms`'s `baselineDy
  = height - descent`; too-small descent -> too-large `baselineDy` -> text
  drawn 0.889px too LOW, matching the observed `act > exp`). The entity
  leaf's OWN title (byte-perfect, same markup) does NOT go through this
  code path at all — `EntityImageDescription`'s drawn content for that leaf
  is `desc`/`buildDesc` (a different, richer creole engine), not `name`
  (only `name` calls `buildTextBlock` here); the daxeno CLUSTER title (a
  `NamespaceGeo`, `class-namespace-usymbol-shape.ts#buildDecoration`) is
  what calls `buildTextBlock` directly for its title, so only that path hit
  the bug.
- **Fix**: `measureAtomsWidthHeight` now tracks `descent` as the MAX across
  TEXT atoms' own per-atom `measureLine(...).descent` (mirroring its
  pre-existing width-ADD/height-MAX per-atom composition, one term
  further) instead of a single line-wide `lineDescent(built.lineFont)`
  call — deleted (dead after the change; grepped for other call sites,
  none). A line whose only run keeps the base font (the common,
  previously-only-exercised case) is unaffected: that one atom's own font
  IS the base font, so `descent` is identical either way.
- **Impact beyond daxeno**: this is a SHARED module (`buildTextBlock`
  underlies `EntityImageDescription.name`/`desc`/`stereo` in BOTH the class
  and description engines). Surveyed component/usecase/object/unknown
  against `b0-eng`'s pins — `component/kokebo-27-vafi688`
  (structural-match -> conformant) and four unknown-bucket fixtures
  (`lazuxa-86-dizu716`, `pocube-36-teja768`, `vajaru-64-loni744`,
  `vozubi-21-seto654`, all structural-match -> conformant) moved; zero
  regressions in any surveyed engine (`usecase`/`object`: 0 transitions).
- **Confidence**: High — reproduced via direct instrumentation (not
  guessed), the derived formula (`Δ = run.size/4.5 - base.size/4.5`)
  matches daxeno's `0.889` to full float precision, and a new unit test
  (`tests/unit/core/svek/image/EntityImageDescriptionTextBlock.test.ts`)
  pins both the fixed and the unaffected-common-case behavior against
  `DeterministicMeasurer`'s real `getDescent = font.size / 4.5` formula.

## Observation: `unknown`-bucket movers overlap with T9's own (unmerged at
## b0-eng capture time) fix
- **Context**: pin-diff against `b0-eng/parity-unknown.json` showed 7
  transitions, including `xadudi-62-pupa491`/`gemepu-46-dido441`/
  `kupofu-67-cupo145`.
- **Finding**: those three are named in `cdd3-T9`'s own agent note
  (`.agent-notes/cdd3-T9.md`) as T9's mechanism (namespace-pack /
  two-phase-endpoint fixes), already merged to main before this task ran —
  `b0-eng`'s unknown pin simply predates that merge. Per this task's own
  brief, excluded from this task's reported movers. This task's real
  unknown-bucket movers are the other four (descent-fix mechanism above).
- **Confidence**: High (fixture names match T9's note verbatim).

## Observation: accidentally used a forbidden Serena edit tool once
- **Context**: mid-task, used `replace_symbol_body` for
  `measureUsecaseOrActorLeafInk` before re-reading this task's explicit
  "Never call Serena edit tools" instruction.
- **Finding**: the resulting file content was correct (verified by
  `npm run typecheck`/tests passing), so no revert was needed, but every
  edit after that point used `Edit`/`Bash` only, per instruction.
- **Impact**: none observed; flagged here for the record per this
  project's diagnosis/transparency norms.
- **Confidence**: High.
