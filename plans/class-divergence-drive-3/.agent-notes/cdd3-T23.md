# cdd3-T23 — member-row sprites, badge glyph, lecelo

## Observation: C-3+C-4 closure needed a THIRD mechanism the diagnosis didn't name
- **Context**: after wiring `classPlugin.parse`'s `ParseOptions.assetStore`
  through to `createSpriteRegistry` (C-3) and adding an SVG-sprite branch to
  `class-member-atom-resolve.ts#resolveSpriteAtom` (C-4), bidusa/ruliki still
  measured `structural=1 numeric=188` (a `fill="#000"` vs `#AA0"` mismatch)
  and a large, perfectly CONSTANT (~7.538/7.539px) Y offset on every path
  coordinate.
- **Finding, fill**: the creole `<color:X>...</color>` WRAPPER sets
  `atom.ambientFont` (the font active when the markup was recognized), NOT
  `atom.forcedColor` (that field is only the inline `<$name,color=X>`
  override). `class-member-creole.ts#resolveOneAtom`'s `'inline'` branch
  already threads `atom.ambientFont` to `resolveOpenIconicAtom` but was
  passing the ROW's raw `baseFont` (never the ambient one) to
  `resolveInlineAtom` — so a color-wrapped `<$sprite>` (no forced color of
  its own) always tinted from the wrong font. Fixed by passing
  `atom.ambientFont ?? baseFont`, mirroring the openiconic branch's own
  precedent one line above it.
- **Finding, Y offset**: `resolveMemberAtoms`'s `seaEntries` filter
  (`heightEntries.filter((_, i) => rendered[i]!.kind !== 'image')`) excludes
  `'image'` atoms from the row's `Sea` `maxSpan` reduction, on the documented
  theory that an image's flat bottom-anchor formula "equals its Sea
  placement because its altitude is 0" — true ONLY when the image is
  no taller than the row's own text. bidusa's `<$Netw>` icon (21.538px
  declared box) is TALLER than its row's 14pt text, so the row's real
  height is icon-dominated, and the render-time flat formula
  (`lineBottomY - atom.height`) placed the icon's TOP 7.538px too high —
  `atom.height(21.538) - baseFont.size(14) = 7.538`, exactly the observed
  delta. The **new** `'drawable'` kind is a DIFFERENT kind from `'image'`
  (not filtered by that check), so it already participated in `maxSpan` —
  the fix was to also give it its own `dy` via `atomTopDy` (the SAME
  function `'vector'` already uses) in `resolveMemberAtoms`, and to draw it
  at `y + dy` (mirroring `renderRowOpenIconicAtom`'s dual-path pattern)
  instead of the flat formula. Analytically verified against the exact jar
  numbers: `dy_drawable = -reference = -(14 - 3.1111) = -10.8889`;
  `dy_text = 21.538 - 3.1111 - 10.8889 = 7.538` — matches the golden's
  `text/@y` shift (81.889 -> 89.427) to 3 decimals.
- **Impact**: this is a GENUINE, non-obvious extension of the T22 Sea
  mechanism, not visible from the diagnosis's own C-3/C-4 fix-shape text.
  `'image'` (raster sprite/img/latex) atoms remain on the flat bottom-anchor
  formula, unchanged — T22's own open item ("drop the bottom anchor and
  place images at their Sea top as well") is STILL open for `'image'`; only
  `'drawable'` (SVG sprite) was fixed here, because C-4's own target
  fixtures needed it. A future `'image'` row taller than its text would
  hit the SAME latent bug T22 already flagged.
- **Confidence**: High — 3/3 target fixtures (bidusa, ruliki, gamevo) close
  to `structural=0 numeric=0`; zero unrelated corpus rises (pre/post
  render-all pin-diff below).

## Observation: `b1.json` is a stale "previous close" pin for THIS worktree
- **Context**: `pin-diff.mts plans/class-divergence-drive-3/measurements/b1.json /tmp/cdd3-T23.json`
  reported 26 transitions, only 3 of which are this task's own fixtures.
- **Finding**: this worktree's base commit (`b48917de`) already has T21/T22/
  T24/T26/T27/T29 integrated, but `b1.json` predates some of that
  integration — the other 23 "transitions" are fixtures those already-landed
  tasks fixed, not anything T23 touched. Confirmed by measuring a REAL
  before/after pair instead: `git diff > patch`, `git checkout -- .`,
  `render-all.mts /tmp/cdd3-T23-pre.json`, `git apply patch`, then
  `pin-diff.mts /tmp/cdd3-T23-pre.json /tmp/cdd3-T23.json` — exactly 3
  transitions (bidusa, ruliki, gamevo), all `-> conformant`, zero rises.
- **Impact**: a task branching off an integration commit newer than the last
  committed `bN.json` pin cannot trust that pin as its own "before" baseline
  — measure the real before/after pair instead of diffing against the
  committed pin, exactly as `fix-task.md`'s own "measure before editing, or
  save a patch" fallback describes (used here for the SECOND half: an
  after-the-fact reconstructed "before", since a true pre-edit measurement
  was not taken at task start).
- **Confidence**: High.

## Observation: E1-7 (badge `Q`) had a second, non-catching test
- **Context**: `class-badge-t21.test.ts`'s `renderFixtureClass` assertion
  for each T21 letter compares the rendered SVG against
  `badgeGlyphPath(...)`'s OWN return value.
- **Finding**: that assertion is a tautology for a WRONG table entry — it
  can never catch a bad `BADGE_GLYPH_D` value, only a threading bug between
  the table and the renderer. The ONLY test that pinned `Q`'s actual bytes
  was the hardcoded literal a few lines above it (now updated to the
  gamevo-scraped size-17 value, `class-badge-t21.test.ts`).
- **Impact**: `W`'s LATENT defect (same size-12-vs-17 bug, zero corpus
  reach) has no hardcoded literal test either — regenerating it needs a new
  `scripts/oracle-render.sh` capture from an authored fixture, out of this
  task's scope (no corpus fixture reaches it).
- **Confidence**: High.

## Observation: lecelo's residual is STILL untraced (recorded per task instructions)
- **Context**: lecelo-92-loma110 measures `structural=6 numeric=5`,
  UNCHANGED by this task (matches T7's own prior measurement exactly).
- **Finding**: lecelo's third classifier is a quoted multi-line NAME (no
  member rows/braces at all) containing creole `<:label:>`/`<:wrench:>`/
  `<:hammer_and_wrench:>` emoji-shortcode markup. The jar DROPS this markup
  entirely for a classifier NAME (leaving only the trailing plain word,
  e.g. `<:label:> label` renders as literal text `"label"`), while this
  port's `class-layout-header-creole.ts` reuses the SAME `resolveOneAtom`
  pipeline member rows use (a DELIBERATE pre-R2i design choice, per that
  file's own B7FU-R2 doc comment) — which DOES resolve the shortcode to an
  emoji glyph (`🏷`).
- **Ruled out**: `CreoleMode` gating. Read
  `CommandCreoleBuilder.java:67-125`: `CommandCreoleEmoji.create()` is
  registered UNCONDITIONALLY in the constructor, in BOTH the `FULL` and
  `OTHER` (`modeSimpleLine != FULL`) builder instances — unlike `UNDERLINE`
  (java:85-86, gated `if (modeSimpleLine == CreoleMode.FULL)`). So whichever
  `CreoleMode` a classifier NAME parses under, `CommandCreoleEmoji` is
  present in the command table either way — mode alone cannot explain a
  dropped shortcode.
- **Not yet found**: the ACTUAL Java call site that builds a classifier's
  quoted multi-line NAME into a `Display`/`StripeSimple` — did not locate
  it within this task's budget. It is very plausible classifier NAMES never
  go through `StripeSimple` at all (a different, narrower splitter), which
  would mean this port's OWN choice to route header text through the full
  member-row atom pipeline is the actual divergence, not a Sea/mode
  mechanism — but this is unconfirmed, not a finding.
- **Impact**: left untraced, as T7's own note already flagged
  ("out of this task's R-VP scope") and as this task's own brief allows
  ("diagnose, fix if reachable, else record the artifact"). No source
  change attempted — a guess here risks silently regressing whichever
  header/emoji cases DO already work correctly.
- **Confidence**: Medium (ruled out one hypothesis with primary-source
  evidence; the real mechanism remains open).

## Report

**Fixtures closed** (0/0, `structural=0 numeric=0`):
- bidusa-22-jutu505 (S14→0, N188→0 during the task's own progression)
- ruliki-78-biji661 (same shape as bidusa)
- gamevo-26-runo973 (S0→0, N450→0)

**Fixture unmoved** (recorded, not fixed):
- lecelo-92-loma110 — structural=6, numeric=5 (unchanged); see the
  untraced-residual observation above.

**Movers** (pin-diff, real pre/post pair — `/tmp/cdd3-T23-pre.json` vs
`/tmp/cdd3-T23.json`):
- bidusa-22-jutu505: diverged -> conformant (C-3 + C-4 + the Sea-`dy`
  extension + the ambientFont-color fix, all four together)
- ruliki-78-biji661: diverged -> conformant (same, identical source shape)
- gamevo-26-runo973: structural-match -> conformant (E1-7, `Q` badge glyph
  regenerated from a real size-17 jar scrape)
- Zero other transitions, zero rises.

**Java `file:line`s ported/cited**:
- `command/CommandSpriteFile.java:108-112` — C-3, internal store threading.
- `klimt/creole/atom/AtomSprite.java` / `SvgNanoParser#drawU` (reused via
  `core/creole-atoms-image-resolver.ts#resolveSvgSpriteAtom`, not
  re-ported) — C-4.
- `klimt/drawing/svg/DriverPathSvg.java` (fast-path `fore===back` branch,
  `styleMe`'s `strokeWidth==='0'` early return) — `class-member-sprite-
  render.ts`'s primitive-to-`<path>` conversion.
- `klimt/drawing/svg/DriverEllipseSvg.java` — same file's ellipse branch
  (untested, zero corpus reach for `'drawable'` today).
- `klimt/creole/Sea.java:72-89` (`doAlign`) — the `dy` extension's own
  citation, already used by `atomTopDy`/T22's `'vector'` precedent; reused
  verbatim, not re-derived.
- `klimt/creole/legacy/AtomText.java:321-323` — confirms NORMAL text
  altitude 0, matching `AtomSprite`'s own 0 (the shared Sea reference the
  `dy` fix relies on).
- `klimt/creole/legacy/CommandCreoleBuilder.java:67-125` — the lecelo
  ruled-out check (emoji command registration).

**Extensions (D4)** beyond the task's named primaries, none owned by a
concurrent task (T25/T18/T33's lists checked):
- `src/diagrams/class/class-namespace-title-runs.ts` — widened
  `NamespaceTitleRun`'s union + `renderNamespaceTitleRuns` for the new
  `'drawable'` kind (type-exhaustiveness; untested, zero corpus reach —
  `resolveInlineAtom`'s own doc comment already flagged this as untested
  even for `'image'`).
- `src/diagrams/class/renderer-note.ts` — same widening for note-line
  atoms (same untested-but-correct-by-construction status).
- `src/diagrams/class/class-scale-geo-row.ts` — `scaleAtom`'s `'drawable'`
  case (`skinparam scale` support: scales every primitive's own geometry +
  `dy`); zero corpus reach combining `scale` with an SVG sprite, but a
  REAL, reachable code path (not dead code) once one exists.
- `src/diagrams/class/class-parse-state.ts` — two new optional `ParseState`
  fields (`internalSprites`/`internalEmoji`) so `startNewPage` rebuilds
  every page's `SpriteRegistry` with the SAME internal store (C-3).

**New file**: `src/diagrams/class/class-member-sprite-render.ts` (the
`renderMemberRowDrawable` primitive-to-SVG converter — pure port of
`DriverPathSvg`/`DriverEllipseSvg`'s fill/stroke logic + a local `d`-string
builder mirroring `svg-graphics-elements.ts#renderPathSegment`, minus the
DOM/shadow half this lightweight (non-`UGraphic`) renderer has no
equivalent for).

**Tests added**:
- `tests/unit/class/class-member-svg-sprite.test.ts` — C-4's new
  `'drawable'` resolution, the fast-path fill-only render, and the Sea `dy`
  mechanism (exact analytical values, cross-checked against bidusa's jar
  numbers).
- `tests/unit/class/class-parser-asset-store.test.ts` — C-3's
  `ParseOptions.assetStore` threading, including `startNewPage`'s carry-
  through.
- `tests/unit/class/class-badge-t21.test.ts` — `Q`'s hardcoded literal
  updated to the size-17 gamevo scrape (was a wrong size-12 befasi scrape);
  provenance comment corrected; `W`'s latent defect flagged inline in
  `class-badge-glyph-data.ts`.

**Open artifacts**:
- lecelo-92-loma110's `<:name:>`-in-classifier-NAME residual (see above) —
  needs the real Java `Display`-building call site for a classifier's
  quoted multi-line name, not yet located.
- `W` badge glyph (`class-badge-glyph-data.ts`) — same size-12-vs-17 defect
  as pre-fix `Q`, zero corpus reach, needs a fresh `scripts/oracle-render.sh`
  capture from an authored fixture.
- `'image'` (raster) atoms taller than their row's text still use the flat
  bottom-anchor formula (T22's own pre-existing open item) — only
  `'drawable'` was fixed here, scoped to this task's own target fixtures.

**Gates**: `npm test` green except the 5 always-red symlinked-worktree
stdlib/sprite files (stdlib-packages, stdlib-all-exports,
stdlib-package-files, sprite-package-files, stdlib-remote-e2e — unrelated,
pre-existing); `npm run typecheck` clean (both tsconfigs); `npm run lint`
clean; `npm run build` clean; `tests/oracle/class-dot-parity.test.ts` 721/721
green; `npm run catalog` re-run (public API surface changed) and
`tests/architecture/catalog.test.ts` green.

**Commit**: see `git log -1` on `wt/cdd3-T23` (this note is committed in the
same commit as the code).
