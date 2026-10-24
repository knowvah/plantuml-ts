# T8g — the canvas is the shared graphic's `ensureVisible` fold; bridges deleted

Agent: `typescript-pro` (sonnet), worktree `sdd3-T8g`. Commit:
`fix(sequence): grow the canvas from the drawn extent`.
Read [../task-contract.md](../task-contract.md) first, then
[../diagnosis/drawn-extent.md](../diagnosis/drawn-extent.md) (T5a: the
mechanism, closed forms and counterfactual) and
[../diagnosis/handwritten.md](../diagnosis/handwritten.md) section
"T8g fold". Re-slotted here by journal row 69; runs after T8f (and T8h).

## Mechanism (T5a, HIGH)
The jar's canvas is a running max over every drawn primitive's
`ensureVisible`, seeded with the document dimension
(`SvgGraphics.java:129-135,142-143`); an arc counts endpoint + radius
(`:854`). Until batch 8 the port's sequence canvas was only the seed
`trunc(dim+1)` because the body was built from strings. After T8e the page
is ONE `UGraphicSvg` (`renderer-ug.ts#openSequenceGraphic`, seeded with
`minDim` = `(geo.totalWidth, geo.totalHeight)` — the jar's
`option.withMinDim(dim)`, `TextBlockExporter.java:284`), so the fold is the
graphic's own `maxX`/`maxY`, read from the root `viewBox`
(`extractViewBoxDims`, `document-shell-fragment.ts:40`; scale 1).

## Targets
kaluna-08-rubu301 (jar `trunc(252.894+110+1) = 363` vs ours 296) and
gebeki-18-muci858 (jar `trunc(209.625+20+1) = 230`, ×2 = 460 vs ours 229,
458): `ws` 2 → 0 each. No other row moves (T5a: the fold equals today's
canvas on the other 1141 rows; verified again by the hash gates).

## Outcome
1. `finish()` returns the fold; `renderPaginated` takes `width`/`height`
   from it instead of `canvasOf(geo)`; `finalizeSequenceFragment`
   (`assemble-svg-sequence.ts`) takes `max(seed composed from chrome and
   margin, drawn fold)`.
2. Two couplings (the page is shifted after it is drawn): the exporter
   margin — draw under `ug.apply(UTranslate(m.left - 5, m.top - 5))` so the
   fold sees final coordinates, `withExporterMargin` becomes dimension
   bookkeeping only; banner and chrome shift the body
   (`skinparam-warnings.ts:144`, `annotations/chrome*.ts`) — the fold
   travels as `RenderFragment.drawnMaxX/drawnMaxY` (`core/dispatcher-types.ts`,
   internal fields, not public API), shifted wherever `shiftFragmentBody`
   shifts.
3. Cleanup: every `drawToString` bridge and old `render*` wrapper
   deleted; `scaleSequenceGeometry`/`scaleSequenceTheme`/`scaleK` at the
   page (identity at `DRAW_SCALE = 1`, journal rows 56, 97) deleted with
   their tests re-expressed; `sequence-text.ts` remnants deleted.

## Write-set
`src/diagrams/sequence/renderer-ug.ts`, `renderer.ts`,
`renderer-document.ts`, every `renderer-*.ts` only to delete its bridge,
`scale-geo.ts` (deletion), `src/core/assemble-svg-sequence.ts`,
`src/core/dispatcher-types.ts` (the two internal fields),
`src/core/skinparam-warnings.ts` and `src/core/annotations/*` ONLY where
`shiftFragmentBody` must carry the fold (core ⇒ `--canon-all` and the
all-engine survey), tests, `docs/catalog.md`.

## Gates
- Tests first: the ARCTO case quoting `SvgGraphics.java:129-135,854`
  (gebeki's closed form), kaluna's closed form, the shift couplings.
- `classify` vs the previous merge: kaluna 2→0, gebeki 2→0, 0 rose, no
  other mover. Golden ratchet (1141 pins after T8f) green.
- `--canon` and `--canon-all` vs the pre-move snapshots: exactly kaluna and
  gebeki may move; raw `--all` movers all sequence output.
- Typecheck, eslint, prettier, `vitest run tests/unit/sequence tests/unit/core
  tests/oracle/svg-conformance/sequence.*`, build, catalog.

## Acceptance
- Given kaluna and gebeki, then zero diff with the closed-form tests.
- Given every other row in every engine, then canonically identical.
- Given the renderer modules, then no `drawToString` or `render*` string
  wrapper remains.

Observability: N/A. Rollback: Reversible.
