# cdd3-T34 — `scale` factor and dpi-scaled constants (C-10, E1-8)

## Observation: `resolveScaleFactor`'s width/height basis vs the truncated canvas
- **Context**: porting `TextBlockExporter#calculateFinalDimension`
  (`core/TextBlockExporter.java:199-201`) into `layout.ts#layoutClass`.
- **Finding**: `layoutClass` was calling `resolveScaleFactor(ast.scale,
  geo.totalWidth, geo.totalHeight, theme.dpi)` — but `geo.totalWidth`/
  `totalHeight` is ALREADY `SvgGraphics#ensureVisible`-truncated
  (`applyCucaDocumentMargin`'s `Math.floor(dim + 1)`). Upstream's
  `Scale#getScale` call (`TextBlockExporter.java:205-208`) reads the
  FRACTIONAL pre-truncation dimension. `geo.rawWidth`/`rawHeight`
  (pre-margin ink dims, already on `ClassGeometry`) plus the same
  `CucaDiagram` margins `computeClassDocumentDims` applies — before its
  own truncation — reproduces that fractional value exactly.
- **Impact**: every `scale max N width/height` / `scale N width/height`
  fixture whose pre-truncation dimension isn't already an integer computes
  a slightly wrong `k`, which then multiplies every scaled coordinate.
  Fixed in a new `class-layout-scale-resolve.ts#resolveClassScaleFactor`
  (split out to stay under the 500-line file cap) — `layoutMultiPage`'s
  stacked geometry has no `rawWidth`/`rawHeight` (not set by that
  combinator) and falls back to the pre-T34 `totalWidth`/`totalHeight`
  basis unchanged; no `newpage` + `scale` fixture exists in this mission's
  corpus to verify a multi-page fix, so that path is left as a named,
  not-yet-ported remainder rather than guessed at.
- **Confidence**: High — `cagace-55-libu760`/`nadaba-37-zaku242` close to
  0/0, `kujiji-68-cujo036` drops from 49 structural/824 numeric to a 14 S
  font-size residual (9.873 vs jar's 9.874 — D3 2-dp boundary, not this
  mechanism; probe-scale3.mts predicted exactly this before any edit).

## Observation: two pre-existing unit tests encoded the truncated-basis bug
- **Context**: `tests/unit/class/layout-scale.test.ts`'s `scale max N
  width`/`scale max N height`/`scale N width` tests derived their `target`
  from `unscaled.totalWidth`/`totalHeight` (the truncated canvas) and
  asserted the scaled output landed exactly on that target.
- **Finding**: once `k` is computed from the correct fractional basis,
  `k * totalWidth` no longer equals a target expressed in truncated units
  (the two differ by up to 1px) — the three tests failed after the fix,
  each for the SAME reason, not three separate regressions. Rewrote them
  to derive `target` from the same `rawWidth/rawHeight + CUCA margin`
  basis the source now uses, and assert on `scaled.scaleK` directly
  (the resolved factor) rather than reconstructing the truncated-width
  side effect.
- **Impact**: none beyond the test file itself — a pre-existing test
  fixture change, not a production behavior change.
- **Confidence**: High (all 3 rewritten assertions pass; `npm test` full
  suite confirms no other test depended on the old basis).

## Observation: E1-8's mechanism is "one ambient scale transform", not a
  size-only multiply
- **Context**: `class-visibility-icon.ts#drawSquare/drawCircle/drawDiamond/
  drawTriangle` already scaled `ctx.size` (`iconSizeOf(theme) * k`) but
  left the RAW local offset constants (`+2`, `-4`, `+1`, `-2`) unscaled;
  `core/svek/image/Opale.ts`'s `cornersize`(10)/`delta`(4) were likewise
  unscaled.
- **Finding**: `VisibilityModifier.java:179`/`Opale.java:53,173` draw
  these shapes inside ONE ambient scale-wrapped `UGraphic`
  (`TextBlockExporter.java:205-208`) — every local numeral scales
  uniformly with the outer position, not just the size. `(rawSize - 4) *
  k` ≠ `(rawSize * k) - 4`; the diagnosis's own arithmetic
  (`ziparo-17-joku307`: private rect 27.25 vs jar's 18.75 = `(10-4)*3.125`)
  confirms the SECOND form is correct. Also found the SAME `geo.x +
  ROW_TEXT_LEFT_MARGIN` unscaled-margin gap at a SECOND call site
  (`renderer-classifier-box.ts#pushIconRowPrimitives`, the enhanced-body
  icon path) that the diagnosis's `renderer-classifier-rows.ts:130`
  citation didn't separately name — same mechanism, same fix.
- **Impact**: `ziparo-17-joku307` (`skinparam dpi 300`) falls from 58
  numeric diffs to 21, ALL of which are the diagnosed 0.02px/0.015px D3
  2-dp-quantisation residual (not this mechanism — confirmed by matching
  every remaining diff's magnitude against the diagnosis's own D3
  attribution before stopping).
- **Confidence**: High (every non-D3 diff line from the pre-fix render-diff
  disappeared; zero new diff lines appeared).

## Observation: the plain-note fold flap (`opaleCorner`) had the SAME gap,
  previously left out only because Opale.ts was a different task's write-set
- **Context**: `renderer-note.ts#renderPlainNote`'s doc comment explicitly
  said the `opaleCorner` call was "left unscaled -- out of this class-only
  task's write-set" (a prior task, before Opale.ts was unblocked for T34).
- **Finding**: `opaleCorner`/`opalePolygonLeft/Right/Up/Down` now take an
  optional `k = 1` param (default preserves the state engine's existing
  unscaled calls, `state/renderer-note.ts` unchanged). Passed `theme.scaleK`
  from all THREE class-engine call sites: `renderPlainNote`,
  `renderTipNote`, `renderOpaleNote` (`renderer-note.ts`), plus
  `renderLinkNoteBox` (`renderer-note-link-box.ts`, `note on link`'s own
  box) — same upstream constant, same mechanism, no fixture exercises the
  plain/link-note forms under `dpi`/`scale` in this corpus, but leaving
  them inconsistent with the tip/opale forms (now fixed) would be a latent
  bug of the identical kind, and the module was already in this task's
  write-set.
- **Impact**: no fixture regression risk — default `k=1` is a no-op for
  every existing conformant/structural-match fixture; verified via the
  full `render-all` sweep below (zero unexpected movers).
- **Confidence**: Medium (code-read correct by the same VisibilityModifier/
  Opale ambient-transform mechanism as E1-8; no fixture in this corpus
  exercises a plain or link note under `dpi`/`scale` to verify numerically).

## Observation: a mid-run `git checkout` corrupted one `npm test` pass
- **Context**: recovering from a stream stall, I ran a clean "before"
  object-engine survey via the sanctioned patch round-trip (`git diff >
  patch`, `git checkout --` the 7 modified tracked files, survey, `git
  apply` to restore) while an EARLIER `npm test` background run (started
  before the checkout) was still executing.
- **Finding**: the checkout/reapply happened ~2 minutes into that test
  run; `layout-scale.test.ts` showed a spurious `249.10004017677784` vs
  `249` mismatch that didn't reproduce on a clean rerun after the
  checkout+reapply had both fully completed. Vitest re-transforms source
  files lazily per-file, so a file swap mid-run can be read mid-flight by
  a worker that started importing it just as the checkout landed.
- **Impact**: none on the delivered code — the corrupted run was
  discarded; two subsequent clean full-suite runs (`npm test`) after the
  patch round-trip both show identical results (5 expected-red stdlib/
  sprite files, nothing else).
- **Confidence**: High (reproduced the anomaly once, gone on rerun with
  no file swap during the run).

## Observation: `class-parser-asset-store.test.ts` fails `npm run
  typecheck` on this worktree's own HEAD, before any T34 edit
- **Context**: `npm run typecheck` reports 9 errors in
  `tests/unit/class/class-parser-asset-store.test.ts` (a `UmlSource`
  shape mismatch + several `possibly undefined` narrowing errors).
- **Finding**: `git log` shows the last commit touching that test file is
  `f45288701 fix(cdd3-T23)` — already merged into THIS worktree's base
  (`wt/cdd3-T34`'s HEAD) but not yet reconciled with `main` (main's last
  touch is an older Prettier-only commit). Confirmed present with `git
  diff --stat HEAD -- tests/unit/class/class-parser-asset-store.test.ts
  src/core/block-extractor.ts` returning nothing (T34 never touched
  either file) and confirmed absent from `main`'s own `npm run
  typecheck` (0 matches). Pre-existing, inherited from batch-3
  integration, unrelated to C-10/E1-8.
- **Impact**: `npm run typecheck` cannot exit clean on this branch until
  a separate task reconciles T23's test fixture with whatever changed
  `UmlSource`'s required `type` field. Not fixed here — outside this
  task's write-set and mechanism (pr-workflow.md: log, don't fold into an
  unrelated commit).
- **Confidence**: High (git log + diff evidence, not merely observed).

---

# Final report (cdd3-T34)

## Fixtures (S/N, render-diff, before -> after)
- `cagace-55-libu760`: 3 S / 37 N -> 0 S / 0 N (conformant). Closed.
- `nadaba-37-zaku242`: 12 S / 178 N -> 0 S / 0 N (conformant). Closed.
- `kujiji-68-cujo036`: 49 S / 824 N -> 14 S / 0 N (diverged, improved).
  Residual is the D3 2-dp font-size boundary (9.873 vs jar 9.874),
  diagnosed and explicitly out of scope (C-13/D3).
- `ziparo-17-joku307`: 0 S / 58 N -> 0 S / 21 N (structural-match,
  improved). Residual is the diagnosed 0.02px/0.015px D3 2-dp
  quantisation (every remaining diff line matches that magnitude).

## Mechanisms ported
- **C-10**: `TextBlockExporter.java:199-201,205-208` — `Scale#getScale`
  reads the FRACTIONAL pre-`ensureVisible` document dimension, not the
  truncated canvas. New `class-layout-scale-resolve.ts
  #resolveClassScaleFactor` (split out of `layout.ts`, 500-line cap)
  computes `geo.rawWidth/rawHeight + CUCA_DOCUMENT_MARGIN_*` and passes
  that into the existing `resolveScaleFactor`; falls back to
  `totalWidth`/`totalHeight` when `rawWidth` is absent (empty-diagram
  sentinel, `layoutMultiPage` stacked geometry — no `newpage`+`scale`
  fixture exists to port that path against, named as a remainder).
- **E1-8**: `VisibilityModifier.java:179` (`drawSquare`/`drawCircle`/
  `drawDiamond`/`drawTriangle`, `skin/VisibilityModifier.java:192-210`)
  and `Opale.java:53,173` (`cornersize`/`delta`) — both draw inside ONE
  ambient scale-wrapped `UGraphic`, so their RAW local numerals scale by
  `k` exactly like the outer position does. Fixed in
  `class-visibility-icon.ts` (all four `draw*` helpers) and
  `core/svek/image/Opale.ts` (`opalePolygonLeft/Right/Up/Down`,
  `opaleCorner`, new optional `k = 1` param, default preserves the state
  engine's unscaled calls). Also fixed the `geo.x + ROW_TEXT_LEFT_MARGIN`
  unscaled-margin gap at BOTH its call sites (`renderer-classifier-rows.ts
  #renderRow`, `renderer-classifier-box.ts#pushIconRowPrimitives` — the
  second wasn't separately named in the diagnosis but is the same
  mechanism at the enhanced-body icon path).

## Movers (render-all 723 rows, pre-edit vs post-edit; pin-diff)
- `cagace-55-libu760`, `nadaba-37-zaku242`: `diverged -> conformant`.
- `kujiji-68-cujo036`: `diverged -> diverged` (49 S/824 N -> 14 S/0 N,
  same verdict bucket so `pin-diff.mts`'s transition report doesn't
  surface it — confirmed via direct pre/post JSON diff instead).
- `ziparo-17-joku307`: `structural-match -> structural-match` (58 N -> 21
  N, same reason as kujiji above).
- 0 other class movers across all 723 rows. 0 rises.

## Other engines (survey pre vs post, T0-baseline scope per task)
- object: T0 baseline 57/12/11 (`/tmp/cdd3-b0-eng/parity-object.json`);
  a clean pre-edit re-measure (post patch-revert round-trip, see
  observation above) gives 58/11/11; post-edit gives 58/11/11 — IDENTICAL,
  0 movers. (The 57/12/11 T0 vs 58/11/11 pre/post delta predates this
  task — accumulated from other merged tasks between T0 and now, e.g.
  T15's own note records 58/11/11 already "unchanged".)
- state: pre-edit 71/14/188, post-edit 71/14/188 — IDENTICAL, 0 movers.

## Write-set
- Primaries (task file): `layout.ts`, `class-visibility-icon.ts`,
  `renderer-classifier-rows.ts`, `renderer-note.ts`; `Opale.ts`
  (explicitly permitted once T15 merged, confirmed via `git log`).
- D4 extensions (named): `class-layout-scale-resolve.ts` (new file, pure
  split of `layout.ts`'s scale-resolution arithmetic to satisfy the
  500-line hook cap); `renderer-classifier-box.ts` (the SAME
  `ROW_TEXT_LEFT_MARGIN` scaling gap at its enhanced-body icon call
  site); `renderer-note-link-box.ts` (the SAME `opaleCorner` scaling gap
  at `note on link`'s own box); `tests/unit/class/layout-scale.test.ts`
  (rewrote 3 pre-existing tests that encoded the pre-fix truncated-basis
  bug); new `tests/unit/class/class-layout-scale-resolve.test.ts`.
- Untouched: every T31 primary (`class-ink-box.ts`, `class-ink-shapes.ts`,
  `class-geo-builders.ts`, `class-layout-leaf-shapes.ts`,
  `class-geo-geometry-types.ts`, `class-ink-note.ts`) and every T19
  primary (`graph-layout-build*.ts`, `svek-dot-emit.ts`,
  `svek-dot-order.ts`, `class-dot-edges.ts`) — confirmed via `git status
  --short` on both this worktree and the main checkout before committing;
  main checkout shows only T19's own legitimate edits (3 `plans/` docs),
  no leak.

## Gates
- `npx tsc --noEmit -p tsconfig.json`: clean except
  `tests/unit/class/class-parser-asset-store.test.ts` (9 errors,
  pre-existing on this worktree's HEAD before any T34 edit — see
  observation above; not fixed, logged for a separate cleanup).
- `npm run lint`: clean.
- `npm run build`: clean (`vite build`, both ESM/CJS bundles + `.d.ts`).
- `npm test` (full, 2 clean runs post-fix): 838 passed | 1 skipped (of
  844 files); 22857 passed | 16 skipped | 6 todo (of 22897 tests). The
  18 remaining test failures are exactly the 5 always-red stdlib/sprite
  files this worktree's symlinking is documented to fail
  (`stdlib-packages`, `stdlib-all-exports`, `stdlib-package-files`,
  `sprite-package-files`, `stdlib-remote-e2e`) — nothing else red.
- `tests/oracle/class-dot-parity.test.ts`: 721/721 passed.
- `tests/architecture/catalog.test.ts`: passed (`npm run catalog` run
  after adding `class-layout-scale-resolve.ts`).

## Open artifacts
- kujiji's 14 S font-size residual (9.873 vs jar 9.874) — D3 (2-dp
  layout-precision task, batch 5), not this mechanism.
- ziparo's 21 N residual — all 0.02px/0.015px, the diagnosed D3 2-dp
  quantisation (`foo2 x` = 1172.875/3.125 = 375.32 exactly vs ours
  375.3152), not this mechanism.
- `layoutMultiPage`'s stacked-geometry fractional dimension for C-10 is
  not ported (no `newpage`+`scale` fixture in this mission's corpus to
  verify against) — falls back to the pre-T34 truncated basis unchanged.
- `class-parser-asset-store.test.ts`'s `npm run typecheck` failures are
  pre-existing (T23-inherited, not yet reconciled with `main`) — flagged
  for a separate cleanup task, not fixed here.

## Commit
- `fix(cdd3-T34): fractional scale basis, dpi-scaled icon/opale offsets`
