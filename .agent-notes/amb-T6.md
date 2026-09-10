# amb-T6 — re-measure, re-pin, close out

Mission `activity-min-box-width`, batch 6, 2026-09-09, branch
`feat/activity-min-box-width`. Baseline `8aad71eb` (aggregate 48291).

## Headline

| quantity | before | after | change |
|---|---|---|---|
| aggregate `weightedScore` (268 fixtures) | 48291 | 43977 | −8.93% |
| `rect[]/@width` | 822 (README: 821, g-scoped) | 166 | −79.8% |
| `text[]/@text-anchor` | 1253 | 0 | −100% |
| `text[]/@fill` | 1288 | 8 | −99.4% |
| `rect[]/@stroke-width` | 846 | 53 | −93.7% |
| `text[]/@x` | 1449 (README: 1427) | 1447 | −0.1% |
| `polygon[]/@stroke-width` (not named by the brief) | 219 | 15 | −93.2% |
| `svg/g[][childCount]` | 19771 | 19655 | −0.6% |

Risers against the pin: ONE, `simuti-16-lece058` 217 → 219, mechanism
journaled before T2's commit. 263 fell, 4 unchanged. Every re-pinned
baseline was diffed; the jar side moved on no fixture in any of the five.

## Observation: `text[]/@x` did not fall because of the root margin, not placement

- **Context**: T5 removed every `text-anchor` and placed text by x
  (`FtileBox.java:220-233`), yet the `@x` family moved 1449 → 1447.
- **Finding**: every activity x is offset by the same 4 px as every rect x:
  ours `LAYOUT_MARGIN` 12, the jar 16 (`activity-canvas-margin`, filed by
  an earlier mission). `cizixu-00-koro700`: ours `x="22"` in a rect at
  `x="12"`, jar `x="26"` in a rect at `x="16"` — inset 10 on both sides.
  The inset census is what shows placement is right: OURS `10` on 906 of
  917 boxed texts (jar 914 of 930); `anchor` `(absent)` on all 1586.
- **Impact**: the x family is the canvas-margin mission's to collect, not
  a residual of this one.
- **Confidence**: High.

## Observation: the split-connector float equality reaches seven fixtures, two of them degenerate

- **Context**: the style census's `<line>` `stroke-width` histogram moved on
  7 fixtures — all line COUNT increases (`bepuku` 12→13, `biredi` 12→13,
  `firibi` 29→30, `gitoke` 21→22, `lufamo` 13→14, `simuti` 14→16,
  `xenofo` 13→15).
- **Finding**: only `simuti` carries zero-length segments (2) at HEAD;
  `xenofo` carried 2 at the T2 state (`from.x` `112.02500000000000568` vs
  `to.x` `112.02499999999999147`, instrumented then). The other five gained
  one real elbow each: with a 120-wide box the branch centre coincided with
  the diamond/bar centre and `gconnection-side-then-vertical-then-side.ts:6`
  collapsed the route to one vertical; text-fitted boxes no longer align,
  and the elbow is the correct route.
- **Impact**: the defect to file is narrow — an exact `===` where upstream
  dedupes consecutive equal points (`Worm.java:253-270`) — and its measured
  weight is `simuti`'s +2 plus two degenerate `<line>` elements.
- **Confidence**: High.

## Observation: named-theme root values were invisible to the activity cascades

- **Context**: `labala-74-juki864` (`!theme amiga`) rose under T3 (+2) and
  under T4 (+2).
- **Finding**: the theme's `root { FontColor $FGCOLOR; LineThickness 1 }`
  (`puml-theme-amiga.puml:22,35,39`) is merged after `plantuml.skin`
  (`StyleStorage.java:102-116`) and beats both the skin root and `element`.
  The port holds it as `theme.styleOverrides.root` (`skin-loader.ts:143`),
  which no activity resolver read. T4b inserted it as the tier between the
  bucket and the cited constant; D3/D4 amended, flagged for review.
- **Impact**: any other activity resolver that falls straight from bucket to
  constant (`activityRoundCorner`, `activityPadding`, the font sizes) has the
  same blind spot for a theme's root block; none is exercised by the corpus
  today.
- **Confidence**: High.

## Observation: the fork bar's merged style says 0.5 but the jar strokes it at 1

- **Finding**: `FtileBlackBlock#drawU` (`:101-110`) computes the merged
  style (signature `root, element, activityDiagram, activityBar`) and then
  applies only `colorBar` and `colorBar.bg()` — never `style.getStroke()` —
  so the rect is stroked at `UStroke` default 1.0 in the bar's own colour
  (`bixefi-77-moki051`: `stroke:#555;stroke-width:1`). Ours draws the bar
  with NO stroke at all.
- **Impact**: `activityLineThickness(theme, 'activityBar')` is 0.5 and
  correct as a resolver; `renderBar` must not consume it; the missing bar
  stroke is its own defect (filed).
- **Confidence**: High.

## Observation: the plain rhombus emits no stroke width

- **Finding**: `renderDiamond` never wrote a `stroke-width`; the jar's
  diamond polygons are 0.5 (`FtileDiamond.java:89`,
  `FtileDiamondInside.java:88`). T3 replaced literals only, so this site
  stayed absent. Weight at HEAD: `polygon[]/@stroke-width` 15 on 11
  fixtures.
- **Confidence**: High.

## Observation: `skinparam activity { DiamondFontColor }` has no handler

- **Finding**: upstream registers `addConFont("activityDiamond",
  SName.diamond)` (`FromSkinparamToStyle.java:147`); the port's skinparam
  handler tables carry `activityDiamondBackground/BorderColor` but no
  `activityDiamondFontColor`, so `dozaxu-98-xetu961`'s red condition text
  stays black. A `src/core` key; weight is inside the residual
  `text[]/@fill` 8.
- **Confidence**: High (agent finding, evidence checked against the jar's
  fill histogram `{#008000:2, #000:2, #F00:1}`).

## Observation: the coverage run under-collects on a loaded box

- **Finding**: three consecutive `npm test` runs at load 60–70 collected
  696 / 692 / 696 of 700 files and exited 0; `npx vitest run
  --coverage.enabled=false --reporter=json` collected all 700 (then 701)
  every time. A one-off 5 s timeout in `tests/unit/class/layout.test.ts`
  at load 71 did not recur alone.
- **Impact**: reinforces `coverage-tmp-silent-undercollect` and
  `confounded-wall-clock-readings`; the JSON reporter's file list is the
  check, not the summary line.
- **Confidence**: High.

## Sibling suites — unmoved

`tests/oracle/svg-conformance` minus `activity.*`, at `8aad71eb` (worktree)
and at HEAD: 23 files, 2167 passed + 1 skipped, identical per file —
`class.golden.ratchet` 316, `class-usecase-actor` 9,
`description.diff-baseline.ratchet` 24, `description.golden.ratchet` 54,
`json.golden.ratchet` 11, `json-family-structural` 94,
`sequence.diff-baseline.ratchet` 1151, `sequence.golden.ratchet` 2/3
(1 skipped), `sequence-diff-census` 39, `state.golden.ratchet` 62.
