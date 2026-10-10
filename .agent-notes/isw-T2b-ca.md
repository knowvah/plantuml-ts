# isw-T2b-ca — core + activity residuals (2026-10-09)

Branch `isw/T2b-ca`, worktree `.claude/worktrees/isw-T2b-ca`, base `fc1b997a7`.

## Commits
- `8c8c58990` M1: wrap swimlane titles on swimlaneWrapTitleWidth
- `5a1d8560d` M2: apply a bare activityDiagram style block to elements
- `7bd1770f3` M3a: box a wrapped edge label by its drawn lines (wrap-switch)
- `90fbb9e00` M3b: ink a hexagon label and wrapped edge label as drawn
- `98ed987bb` M4: print chrome-shifted coordinates at the jar precision

## Results
- Owed rows conformant: activity/sesodi-22-lupe361, activity/tirizu-79-niza262,
  unknown/cezeje-11-roxe484, unknown/febuci-08-zogi253. NOT kakitu-70-kuvi013 (see Not done).
  Also newly conformant (not owed): unknown/godixi-01-fizo921, unknown/nunema-69-degi058.
- Surveys before (`/private/tmp/claude-501/isw-T2b-ca/before/`) vs final (`.../final/`), all 8
  engines: activity 431->433, unknown 366->370, class/state/component/usecase/mindmap/sequence
  verdicts unchanged. 0 conformant losses. Every mover:
  - sesodi-22, tirizu-79 (M1), cezeje-11, nunema-69 (M2+M3a), godixi-01, febuci-08 (M2+M3a+M3b):
    -> conformant.
  - kakitu-70: diverged -> diverged, maxDelta 1365 -> 0 (only textLength 0.001 diffs left).
  - unknown toxeto-79-kile546, xapuji-91-dagu145: maxDelta 25.4752 -> 25.475 (M4: our raw
    float coordinate now 3dp).
  - sequence bozuru-10, fonope-49, gejeji-12, muvaxa-46: maxDelta 9.9999->10 / 10.0002->10 /
    16.0002->16 / 3.0002->3 (M4, same).
  - M4 diff counts (compareSvg, all fixtures) before/after equal on sequence 1141, unknown
    825, component 266, state 273, usecase 94.
- Tests: tests/unit/core, tests/unit/*.test.ts, tests/diagrams/activity, tests/unit/activity,
  tests/architecture/isw-measurer, plus tests/unit/class/class-cluster-header, tests/unit/mindmap,
  tests/integration/annotations.e2e: all green except 4 worktree-environment failures
  (stdlib-packages / stdlib-package-files / sprite-package-files: `packages/*/generated` is a
  symlink into the main checkout in this worktree, which `npm pack` drops; untouched by me).
  `npm run typecheck`, eslint on every touched file: clean.

## Per mechanism
### M1 — swimlaneWrapTitleWidth (`8c8c58990`)
- Java: `SkinParam.java:980-984` returns `new LineBreakStrategy(getValue(...))`;
  `Swimlanes#getWrap` `:296-302` (style fallback unreachable by reference test);
  `getTitle` `:285-293` (`auto` -> `(int) swimlane.getActualWidth()`, `:290-291`);
  widths set before any title is measured (`computeSizeInternal` `:407-411`);
  `getTitlesHeight` `:309-315`; content drawn `.apply(getTitleHeightTranslate)` `:342-343`,
  dividers not (`:346`); special lane `MinMax.getEmpty(true)` `:119-120`.
- Ours: `src/core/skinparam-key-handlers-table-c.ts` (handler), `skinparam-accumulator.ts`,
  `skinparam-theme-builder.ts`, `theme-merge.ts`, `theme-root-fields.ts#swimlaneWrapTitleWidth`
  (raw string). `layout/swimlane-title.ts#swimlaneTitleBlock(display, theme, actualWidth)` +
  `swimlaneTitleDimension`; `swimlane-placement.ts#measureLanes` measures titles after `min`;
  `SwimlaneGeo.actualWidth` (`swimlane-lane-origins.ts`); `swimlane-vertical.ts`
  `measureSwimlaneTitlesHeight` now measures the drawn title BLOCKS (display, not lane name;
  AtomText floor inside) and `placeSwimlanes` applies the title `dy` to content (walk now at
  `baseY`), never to divider reservations; `compress/shapes-of-swimlane-title.ts` (moved out of
  shapes-of.ts) boxes the drawn title block (all wrapped lines) for Y compression.
- Fixtures: `tests/fixtures/isw-T2b-ca/swimlane-title-wrap-{px,auto,none}` (+ jar svg), test
  `tests/diagrams/activity/isw-T2b-ca-swimlane-title-wrap.test.ts`.
- Production-visible: diagrams with `skinparam swimlaneWrapTitleWidth` wrap titles (band
  taller, content lower, dividers/canvas narrower). Title band height now follows a
  `|name| LABEL` display (multi-line labels) instead of the lane name.

### M2 — bare `activityDiagram { ... }` (`5a1d8560d`)
- Java: `style/parser/Context.java:68-100,127-139` (bare block -> Style signed
  `{activityDiagram}`), `StyleStorage.java:102-116` (`computeMergedStyle` merges every style
  whose `matchAll` holds), `StyleSignatureBasic.java:194-220` (`containsAll`), priority by
  declaration counter (`DarkString.java:50-65`).
- Ours: `src/core/style-map-element.ts#isDiagramTypeSelector` -> bare diagram selector is its
  own bucket keyed by the diagram SName; `activity-text-style.ts#activityWrapWidth` reads own
  bucket -> `activitydiagram` bucket -> skinparam wrapWidth.
- Fixtures `tests/fixtures/isw-T2b-ca/diagram-maximum-width{,-nested}`, test
  `tests/diagrams/activity/isw-T2b-ca-diagram-maximum-width.test.ts`; unit test in
  `tests/unit/core/style-map-buckets-t3g.test.ts`.
- Production-visible: `<style> activityDiagram { MaximumWidth N }` wraps every activity text
  that upstream wraps. Other bare-diagram props are collected but not yet read (see Not done).

### M3a — wrap-switch (`7bd1770f3`), `it.fails` flipped to `it`
- Diagnosis: instrumented a scratch copy of `FtileSwitchWithManyLinks` (compiled against the
  oracle jar, `/private/tmp/claude-501/isw-T2b-ca/jinst/`): jar `getYdelta1a` reads branch
  label h=22, SMALL_DIAMOND, diamond1 h=44 — identical to ours. getYdelta1a, BIG/SMALL, and
  the bounder were RULED OUT. Uncompressed our boxes are 22.944 lower than the jar's,
  compressed 11 higher: `compress/shapes-of.ts#edgeLabelShape` boxed a label by its `\n`
  lines (`label.split('\n')`), so a case label wrapped by `style.wrapWidth()`
  (`Branch.java:248-258`) occupied one line and Y compression removed the space under the
  second.
- Fix: the box is the drawn block's LimitFinder text extent (`LimitFinder.java:216-224`,
  `TextBlockUtils.getMinMax`). Equal to the old envelope for unwrapped labels (0 other movers).
- Production-visible: switches with wrapped case labels (wrapWidth / MaximumWidth) keep the
  vertical space under the label (+11 px per extra wrapped line).

### M3b — canvas ink (`90fbb9e00`)
- Java: `FtileDiamondInside.java:94-96` draws the label at `((dimTotal - dimLabel) / 2)`;
  `LimitFinder#drawText` `:216-224` puts the first line's ink 0.944 px above the polygon at
  11pt.
- Ours: `layout/canvas-origin-text-ink.ts#extendForIfOwnLabelText` (was: the hexagon box);
  `extendForEdgeLabelText` now the drawn block's LimitFinder extent (was: last `\n` line).
- Fixture `tests/fixtures/isw-T2b-ca/switch-first-wrapped`, test
  `tests/diagrams/activity/isw-T2b-ca-switch-wrap.test.ts`. `group-inner-ink.test.ts` now
  attaches a measurer to its theme (the while's hexagon label inks through it).
- Production-visible: a diagram whose top-most ink is a hexagon/switch label (switch or if
  first, no start) sits 0.944 px lower (11pt), canvas taller by the same.

### M4 — chrome-shift float formatting (`98ed987bb`)
- Java: `SvgGraphics#format` `SvgGraphics.java:468-475` formats the translated double once.
- Ours: `annotations/coord-shift.ts#shiftFragmentBody` keeps full precision (rounding per
  shift double-rounds: class cluster header 208.398 -> 208.397, caught by
  `class-cluster-header.test.ts`); new `formatShiftedCoordinates` runs once in
  `assemble-svg.ts#assembleDocument` after `finalizeShellFragment` (the last translate), on
  x/y/cx/cy/x1/y1/x2/y2/points/d tokens with >3 decimals, outside inline defs.
- Tests: `tests/unit/annotations-coord-shift.test.ts` (S: fractional-shift case now `47.488`;
  source: SvgGraphics format rule + jar `bedaja-09-gezu912` header `y="12.778"`, re-captured
  `test-results/dot-cache/sequence/bedaja-09-gezu912/in.svg`; ours now equal).
- Production-visible: every engine with title/header/footer/legend/caption chrome or a
  document-margin shift: coordinates print at 3 decimals instead of 13-15. No compareSvg diff
  count changed.

## Tests updated (S/P) with new-value source
- `swimlane-placement.test.ts`: title-height tests rewritten for the block measure
  (AtomText floor 10 still asserted); routing/reservation/spikeTip y expectations `+ dy`
  (`result.vertical.dy`, `Swimlanes.java:342-343`) — contract change, not a jar value.
- `compress/shapes-of.test.ts`: title tests use a bounder whose height == font size
  (`StringBounderFromWidthTable.java:71`); + wrapped-title test.
- `annotations-coord-shift.test.ts`: see M4.
- `isw-T2-act-wrap-width.test.ts`: `it.fails` wrap-switch -> `it` (jar svg unchanged).

## Not done / open
- kakitu-70-kuvi013 (owed): remaining 36 diffs are all `textLength` +-0.001 under `scale 1.5`.
  Mechanism: `src/core/assemble-svg-activity.ts#scaleActivityBody` multiplies the
  ALREADY-3dp-serialized body (`scaleFragmentBody`, TextBlockExporter.ts:133) — double
  rounding: `20.831 * 1.5 = 31.246499999999997` -> 31.246; the jar formats
  `fround(20.83125) * 1.5 = 31.24687...` once (`SvgGraphics.java:468-469`) -> 31.247. Fix needs
  the activity body emitted unrounded (or drawn with `SvgOption.scale`) when scale != 1 —
  renderer-wide precision threading (svg.ts helpers + klimt text), not a local edit. Same
  class affects every scaled activity/mindmap diagram at rounding boundaries. Proposed follow-on.
- Bare diagram-type buckets: only `MaximumWidth` is read (activity). Upstream applies every
  property of `activityDiagram { ... }` to all activity elements (e.g. rose skin's bare
  `activityDiagram { Shadowing 3.0 }`, `src/core/skins-builtin-rose-2.ts:104-106`). Other
  activity resolvers (`activity-style-defaults.ts`, `activity-text-style.ts`) do not consult
  the `activitydiagram` bucket yet. No corpus row needs it (corpus scan: all 7 bare blocks
  carry only `MaximumWidth`). Ordering limit: upstream picks by declaration counter; the flat
  map uses own-bucket > diagram bucket > skinparam.
- `compress/shapes-of-hexagon-label.ts#ifOwnLabelShapes` still splits a wrapped hexagon label
  by `\n` (one slot for all wrapped lines, first-line height). Inert today (the hexagon
  polygon covers the label), not changed.

## Orchestrator actions
- `docs/catalog.md`: regenerate (`npm run catalog`) — new module
  `src/diagrams/activity/layout/compress/shapes-of-swimlane-title.ts`, new exports
  (`swimlaneTitleDimension`, `translateContentY`, `extendForIfOwnLabelText`,
  `formatShiftedCoordinates`, ...). Outside my write-set.
- Ratchet/pin candidates: activity sesodi-22-lupe361, tirizu-79-niza262; unknown
  cezeje-11-roxe484, febuci-08-zogi253, godixi-01-fizo921, nunema-69-degi058 (now conformant).
- Baselines: no score rose on any surveyed engine. DIVERGENCES.md: nothing.

## Observations
- Observation: "getYdelta1a exceeds ours" was a compression artefact. Context: M3. Finding:
  the instrumented jar matched our getYdelta1a exactly; the gap was the Y-slot box of a
  wrapped edge label. Impact: a pre-compression delta must be measured with compression off
  (an env toggle on `assignCoordinatesFull`'s `compress`) before naming a layout formula.
  Confidence: High.
- Observation: `\n`-split line counts appear wherever a label is boxed (compress slots,
  canvas ink, hexagon slots); wrapped text breaks all of them. `TextBlockUtils.getMinMax`
  over the drawn block is the faithful replacement. Confidence: High.
- Observation: per-step formatting in string-composed SVG double-rounds; format once at the
  final assembly (M4) — the scale post-pass still double-rounds (kakitu). Confidence: High.
- Observation: running a jiti render scan concurrently with `svg:survey` produced 5 survey
  timeouts (unknown, activity-legacy1-*); a solo rerun was clean. Confidence: High.
- Observation: the worktree's `packages/*/generated` symlinks fail the npm-pack tests.
  Confidence: High.
