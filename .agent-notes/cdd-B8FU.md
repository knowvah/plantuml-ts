# cdd-B8FU — batch-8 residual round, scaleK literal-grep completion

Worktree `cdd-b8fu`, branch `cdd/b8fu`, based on `b89b90c8a` (T30 tip).
Journal rows 185-187.

## Task

Finish the "audit named as unreached" from T29/T30 (row 183): thread
`theme.scaleK` into every remaining class-diagram render-time pixel-literal
constant, targeting ziparo-17-joku307's 8 structural diffs and
kicuna-39-riki626's 2 structural diffs.

## Fixed (named targets)

- `class-visibility-icon.ts:165` `STROKE_WIDTH=1` — member visibility
  glyphs (ellipse/triangle/square/diamond). `IconShapeCtx.k` already
  existed from a prior round but was never multiplied into
  `styleAttr(stroke, STROKE_WIDTH, ...)` — one-line fix at the two
  draw-shape call sites.
- `renderer-note.ts` `NOTE_STROKE_WIDTH=0.5`, `NOTE_FOLD`/`NOTE_MARGIN_X1`/
  `NOTE_MARGIN_Y`, `renderer-note-lines.ts` table-grid `0.5`,
  `renderer-note-connector.ts` `'7,7'` dasharray + `strokeWidth:1` — all
  multiplied by `theme.scaleK` (or run through `scaleDashArrayString`).
- `renderer-arrowhead.ts#drawMiddleDecorShape` `MIDDLE_STROKE_WIDTH=1.5`
  (kicuna's `E *-- F` aggregation diamond) — refactored to a
  `MiddleDecorCtx` and reuses the "unscale position, `basicSvgOption({
  scale: k })` rescales everything including the un-multiplied literal"
  pattern T29 round 2 already established for extremity markers.

## Fixed (found via literal grep, not named in the brief)

- `renderer-usymbol-entity.ts` `ENTITY_STROKE_WIDTH=0.5`/
  `COMPONENT_ROUND_CORNER=5.0` — multiplied directly (this file's
  `renderDrawableToFragment` call never passes a `scale` option, so
  literals are emitted verbatim at scale=1 and must be pre-multiplied,
  unlike the middleDecor klimt-rescale pattern).
- `renderer-classifier-map-dividers.ts` `MAP_CELL_MARGIN_X=5`.
- `class-namespace-usymbol-shape.ts` `GROUP_STROKE_WIDTH=1` (the
  `<<Node>>`/`<<Database>>`-style cluster path).
- **`class-namespace-shape.ts`'s folder-family package-tab renderers**
  (`renderNamespaceFolder`/`renderNamespaceRect`/`renderEmptyPackageIcon`)
  — a SECOND, previously unnamed mechanism on kicuna: its own
  `package A { class B {} }` has no `<<usymbol>>` keyword, so it takes
  this OTHER cluster path (not `class-namespace-usymbol-shape.ts`). These
  functions were typed `theme: Theme` and never read `.scaleK` at all —
  TS structural typing let a `ScaledTheme` argument flow in silently.
  Fixed `PACKAGE_STROKE_WIDTH`(1.5)/`EMPTY_PACKAGE_STROKE_WIDTH`(0.5)
  (both tiers), `PACKAGE_ROUND_CORNER`(5)/`MARGIN_TITLE_X3`(7 — also
  baked in as an inline `wtitle + 7` inside `folderPathD`/
  `folderPolygonPoints`, now a `FolderTabGeo.marginX3` field), and the
  title's local `(4, 2)` translate (named `TITLE_X_OFFSET`/
  `TITLE_LOCAL_TOP_OFFSET`, was three inline `geo.x + 4` sites).
- `renderer.ts#renderNamespace`'s own `roundCorner: PACKAGE_ROUND_CORNER`
  fed unscaled into `renderNamespaceUSymbol`'s paint — third sibling
  instance of the identical class of bug.

## Re-verified, NOT fixed (documented residuals)

- **`core/usymbol-shapes.ts`** — grep-confirmed the only real importer is
  `class/renderer.ts#tryRenderUSymbol`, and every kind it handles
  (database/component/actor/usecase) is intercepted earlier by
  `usesClassUSymbolEntity` whenever a real `StringMeasurer` is present —
  i.e. on every production render. Its four icon renderers are reachable
  ONLY from hand-built `ClassifierGeo` test fixtures that skip
  `layoutClass` entirely, so no `scale ...` fixture can ever exercise
  their literals. Documented in the module's own header rather than
  threaded (would be an unverifiable no-op against any jar oracle).
  `description`/`state` do not import this module at all (grep-verified).

## File-length pre-authorised split

`class-namespace-shape.ts` hit 509 lines after the scaleK threading
(cap 500). `renderFolderTabShape` + its new `FolderTabPaint` interface
moved to `class-namespace-folder-outline.ts` (already the file split out
at T7b for the SAME reason). Kept the import direction one-way:
folder-outline.ts knows nothing about `Theme`/`scaleK` — the caller
(`class-namespace-shape.ts`, which owns the constants) pre-multiplies
`PACKAGE_ROUND_CORNER`/`MARGIN_TITLE_X3` and passes plain numbers. This
avoided a would-be import cycle (folder-outline.ts exports
`renderFolderTabShape`, which class-namespace-shape.ts imports).

## Measurements (before → after, structural+numeric)

| fixture | before | after |
|---|---|---|
| cagace-55-libu760 | 3+37 | 3+37 (unchanged, pre-existing) |
| corine-48-pemu761 | 0+0 | 0+0 |
| jiramo-39-xuze087 | 0+0 | 0+0 |
| kujiji-68-cujo036 | 49+824 | 49+824 (unchanged, pre-existing) |
| nadaba-37-zaku242 | 12+178 | 12+178 (unchanged, pre-existing) |
| koxoco-29-moke425 | 0+0 | 0+0 |
| vebini-34-gapu710 | 0+7 | 0+7 (unchanged, pre-existing) |
| paluca-39-desa696 | 0+1 | 0+1 (unchanged, T30's own residual) |
| **ziparo-17-joku307** | **8+72** | **0+58** (target: structural gone) |
| fuxoju-95-xuko052 | 0+0 | 0+0 |
| bavoxa-34-keje375 | 0+0 | 0+0 |
| **kicuna-39-riki626** | **2+129** | **0+114** (target: structural gone) |

Verified the five unchanged non-target fixtures (cagace/kujiji/nadaba/
vebini/paluca) via a `git stash`/`stash pop` bracket: identical counts
with and without this round's diff — confirmed pre-existing, not
regressions introduced or missed by this round.

## Gates

`npm test` 802 passed/1 skipped (22393 tests, 803 test files == on-disk
`find tests -name '*.test.ts' -not -path 'tests/e2e/*' | wc -l`), coverage
96.4/91.89/97.42/97.41 (all ≥90); `npm run typecheck` (both tsconfigs)/
`npm run lint`/`npm run build` all clean; `npm run catalog` re-run (drift
from the new `class-namespace-folder-outline.ts` exports); `npx jiti
scripts/dot-sync-report.ts class` 711/712 (unchanged from T30). `git
status --short` on the main checkout confirmed empty before commit.

## Residual (unfixed, out of scope this round)

ziparo (0+58) and kicuna (0+114) still carry NUMERIC (non-structural)
residuals after this round — sub-pixel deltas outside this task's
mechanism, not investigated further here. cagace/kujiji/nadaba/vebini
carry pre-existing `scale max N width|height`/`scale N width` DOT-layout
residuals (T29's own named mechanism, row 177) untouched by this round.
