# add3-T3f — PARSER-ELSE, STYLE-FONT, EMPH-STROKE(diamond), PADDING

## Correction received mid-task (from orchestrator)

`src/diagrams/activity/renderer.ts` is NOT in this task's write-set (T3i
owns it) — EMPH-STROKE's residual mechanism is named below with
file:line, not edited.

## Commits (branch `add3/T3f`)

1. `5b2736004` fix(add3-T3f): backtrack else-label past nested parens
2. `5948148b9` fix(add3-T3f): cascade defaultFontSize into activity text sizes
3. `f8cea7b80` fix(add3-T3f): cascade activity border thickness into diamond strokes
4. `bc761f2fb` feat(add3-T3f): wire bare skinparam padding into activity sizing

**Commit-message error, flagged per rule 13 (do not hide it):** commit 4's
message states `zivege-92-rise076: 273 -> 55` and `fukika-81-gite897: 248
-> 65`. Those numbers are **wrong** — written without re-measuring after
the commit 3 (diamond-thickness) rebase. The real, re-verified numbers
(measured twice, `/private/tmp/claude-501/T3f/padding-final.json` and
`final-rows.json`, byte-identical both times) are **zivege 273 -> 140**,
**fukika 248 -> 150**. Everything in this report below uses the verified
numbers; the commit message itself is not amended (global instruction:
new commits, not amends, absent explicit request).

## Java → ours (file:line)

**PARSER-ELSE** (`jufefu-66-josa392`):
- `CommandElse3.java:62-73` — `WHEN` is `RegexLeaf(1,"WHEN","(.*?)")`, lazy,
  plus a trailing `RegexLeaf(";?")`. `dispatch-support.ts`'s `RE_ELSE` used
  a negated class `[^)]*` (cannot backtrack past a `)` inside the label,
  e.g. `else (Bar::bar())`) and had no `;?`. Fixed to `.*?` + `;?`, matching
  `RE_IF`'s own already-documented precedent for the identical nested-paren
  case.

**STYLE-FONT** (`kepavi-26-sasu141`):
- `style/SkinParam.java:436-449` (`getFontSize`): per-param `"fontsize"`
  suffix first, else bare `"defaultfontsize"`, else the `FontParam`'s own
  hardcoded default. `FromSkinparamToStyle.java:91` registers
  `defaultFontSize` on `SName.element`, and every activity-family style
  signature chains through `SName.element` (`FtileBox.java:98`,
  `ConditionalBuilder.java:101-106`) — one bare `defaultFontSize` reaches
  activity/diamond/arrow text alike. `activityFontSize`
  (`activity-style-defaults.ts`) stopped at the bucket/arrow tier and the
  hardcoded defaults, skipping the middle tier even though
  `theme.defaultFontSize` already carries exactly this value (R2j, a prior
  mission). Added the missing tier.

**EMPH-STROKE (diamond half)** (`xovano-23-tazo278`):
- `StyleSignatureBasic.java:270-272` — `activityDiamond()` is `{root,
  element, activityDiagram, activity, diamond}`, same shape as
  `activityArrow()` one tier up. `ConditionalBuilder#getStyleSignatureDiamond`
  (`:101-106`) redeclares that tuple to resolve a condition diamond's own
  border stroke (`:244-246`). `activityLineThickness` only carried the
  activity-bucket fallback for `sname === 'arrow'`; added `'diamond'`.
- **Residual (reported, not mine to fix):** `Worm.java:126-139` sets the
  ambient `ug` stroke to `style.getStroke()` (the LINE's own resolved
  stroke, from `activityBorderThickness`) before drawing segments;
  `Worm.java:177-181`'s `drawLine` draws the mid-segment EMPHASIZE
  arrowhead (`arrows.asTo(direction)`) with that SAME ambient stroke —
  but the START/END arrow tips explicitly override to `UStroke.simple()`
  (fixed 1.0, `:155,:168`). Our port draws every arrow tip (including the
  mid-segment emphasize one) with a hardcoded `strokeWidth 1` in
  `renderer.ts#renderEdgeSegments`/`arrowTip` — NOT in this task's
  write-set (orchestrator's correction). `xovano`'s residual **2** (down
  from 3) is this exact gap.

**PADDING** (`zivege-92-rise076`, `fukika-81-gite897`):
- `skin/SkinParam.java:1147-1150` (`getPadding`): bare `skinparam padding
  N` → `ClockwiseTopRightBottomLeft.same(N)`, always `none()` when unset.
  Fed into EVERY activity `SheetBlock1` alongside (not instead of) that
  element's own bucket Padding: `FtileBox.java:180`, `ConditionalBuilder
  .java:244`, `FtileWithNoteOpale.java:149`, `FtileIfWithDiamonds.java
  :126`, `GtileBox.java:148`, `GtileWithNoteOpale.java:120`, `Gtiles.java
  :73` (grepped exhaustively, all 11 ctor sites use the SAME bare key).
  `SheetBlock1.calculateDimensionSlow` (`SheetBlock1.java:194-197`,
  mirrored faithfully pre-existing in this port's own `SheetBlock1.ts`)
  adds it to BOTH width and height via `XDimension2D#delta`'s single-arg
  overload (`delta(d) == delta(d,d)`).
- `CommandSkinParam.java:96-99`: setting the bare `padding` key ALSO emits
  a deprecation `Warning` ("Please use CSS style instead of skinparam
  padding"), drawn by `DiagramChromeFactory.create`'s first step
  (`addWarnings`, `WarningBannerBlock`) as a yellow banner ABOVE the whole
  diagram, shifting everything else down by the banner's own height.

Core wiring added (new `theme.padding` field + its full plumbing — none
of this existed before, confirmed by grep):
- `src/core/theme-root-fields.ts` — new `padding?: number` field (root-tier
  Theme fields with no existing home; this file's own stated purpose).
- `src/core/skinparam-accumulator.ts` — new `padding` scalar field +
  `SCALAR_FIELD_NAMES` entry.
- `src/core/skinparam-key-handlers-table-c.ts` — new `['padding']` key
  handler (`parseFiniteNumber`, mirrors the `defaultfontsize` entry's own
  numeric-guard convention).
- `src/core/skinparam-theme-builder.ts` — new `ROOT_SCALAR_FIELDS` entry.
- `src/core/theme-merge.ts` — new `OPTIONAL_SCALAR_KEYS` entry. **This was
  the actual bug that cost the most diagnosis time**: `deepMergeTheme`
  only copies a field if it is named in this allowlist, REGARDLESS of
  whether `buildThemePartial` set it correctly on the partial object —
  `theme.padding` resolved to `undefined` end-to-end until this one-line
  addition, even though every other piece of the pipeline was already
  correct. Verified with an isolated `resolveSkinparam(new Map([['padding',
  '10']]), base)` call before AND after this specific line, not guessed.

Consumers (my write-set):
- `src/diagrams/activity/activity-creole-sheet.ts#buildActionTextBlock` —
  sums `activityPadding('activity') + (theme.padding ?? 0)` into the ONE
  `SheetBlock1` ctor arg this port already uses as a shortcut for Java's
  two independent, both-symmetric additions (outer `FtileBox`'s own
  bucket Padding delta + the SAME SheetBlock1's own inner bare-padding
  delta) — valid because both terms are symmetric `same(N)` values added
  via the identical mechanism, so their sum reproduces the same total.
- `src/diagrams/activity/tiles/gtile-action.ts#actionWidth`/`actionHeight`
  — the `<code>`/table-row fallback branch (never reaches `sheetDimension`)
  gets the same `+ 2 * (ctx.theme.padding ?? 0)` term directly, since it
  still passes through the real `FtileBox`/`SheetBlock1` upstream even
  though this port's own fallback path does not build a literal
  `SheetBlock1` object. Not exercised by either assigned row (neither has
  a `<code>` block or an all-table-row label) — added anyway for
  faithfulness, not fixture-driven; flagged as untested-by-corpus per
  `testing.md`.
- `src/diagrams/activity/tiles/gtile-diamond-inside.ts` (padding-only edit
  per this task's write-set) — new `withGlobalPadding` helper adds the
  SAME `2 * (theme.padding ?? 0)` term to the condition label's measured
  dimension BEFORE `hexagonAlone` sizes the hexagon around it, mirroring
  `ConditionalBuilder.java:244`'s `tbTest` (the hexagon's own inner Sheet).
  **Worked out algebraically, not guessed, why no drawing-side change was
  needed**: Java's own centering formula `lx = (dimTotal.width -
  dimLabel.width)/2` simplifies to a CONSTANT `Hexagon.hexagonHalfSize`
  once `dimTotal.width = max(dimLabel.width,24)+24` is substituted in —
  independent of `dimLabel.width` (and therefore of padding) entirely —
  so this port's existing box-center-based text positioning needed no
  change to stay correct once the SIZE term was added.

## Rows (before → after, probe)

| slug | mechanism | before | after | note |
|---|---|---|---|---|
| jufefu-66-josa392 | PARSER-ELSE | 175 | **0** | exact |
| kepavi-26-sasu141 | STYLE-FONT | 168 | **0** | exact |
| xovano-23-tazo278 | EMPH-STROKE (diamond half) | 3 | **2** | residual is renderer.ts, reported above |
| zivege-92-rise076 | PADDING | 273 | **140** | residual below |
| fukika-81-gite897 | PADDING | 248 | **150** | residual below |
| zejuso-92-kexo870 | CREOLE-ACT | 148 | 148 | not reached — see "Not done" |
| letuke-04-poza319 | CREOLE-ACT | 138 | 138 | not reached — see "Not done" |
| labala-74-juki864 | THEME-MARGIN | 120 | 120 | not reached — see "Not done" |
| bigide-91-bise382 | STRIPE | 35 | 35 | unchanged, pre-existing +0.5 global offset (prior passes' own finding, re-confirmed, not this task's mechanism) |
| nesozi-09-zezu092 | SLURL-LINK | 20 | 20 | diagnosed further, still not fixed — see "Not done" |
| loxija-71-joku558 | KLIMT-FLOOR (brief's label — WRONG, see below) | 4 | 4 | real mechanism found, outside write-set — see "Not done" |
| zepima-96-peco612 | KLIMT-FLOOR (brief's label — WRONG, see below) | 3 | 3 | same |

**PADDING residual (both rows), named with mechanism, not fitted:**
1. ~20px of each row's residual is the still-missing yellow deprecation
   banner itself (`addWarnings`/`WarningBannerBlock` exists in
   `src/core/annotations/WarningBannerBlock.ts` and is wired for
   mindmap's klimt-`TextBlock` pipeline, `src/diagrams/mindmap/index.ts
   :95-102` — `exportedTextBlock`/`addWarnings(diagram.getTextBlock(), …)`).
   Activity's own chrome pipeline is `RenderFragment`-shaped (strings +
   width/height numbers, composed in `src/index.ts`/`core/annotations/
   chrome.ts`), not klimt-`TextBlock`-shaped — `core/annotations/chrome.ts`
   own doc comment already says so explicitly ("minus warnings — no
   caller in this port — `Collection<Warning>` has no producer yet").
   Building a RenderFragment-shaped equivalent (a new SVG-string banner
   that shifts the body down and grows width/height) is a real, bounded,
   SEPARATE feature — not attempted this pass (budget), named precisely so
   the next pass does not have to re-discover the architecture gap. It
   ALSO needs a Warning PRODUCER at parse time (`skinparam padding N` must
   push a `Warning`, matching `CommandSkinParam.java:96-99` — this port's
   activity AST has no warnings-collection field at all yet, confirmed by
   grep).
2. `zivege` ALSO carries a smaller, separate +4-per-branch cascading
   vertical offset that starts exactly at its NESTED `if`'s own
   merge-diamond (`ConditionalBuilder#getShape2`'s `FtileDiamond`, a fixed
   24×24 shape with no text/padding of its own). Ruled out, with evidence,
   NOT the cause: every individual element's own `@height`/`@width`/hexagon
   `points[]` spread is byte-identical to the jar (checked via a raw
   `<polygon>`/`<rect>` diff of ours vs. golden, not the compareSvg score)
   — so no box or hexagon is the wrong SIZE. The delta is a pure Y-shift
   that starts at one specific merge point and then holds constant below
   it, consistent with a fixed vertical-gap constant in the nested-if's
   own merge-point placement that I have not isolated. That placement
   formula lives in `layout/**` (outside this task's write-set) regardless
   of its root cause, so not pursued further.

**KLIMT-FLOOR mislabeled — real mechanism found, is a DIFFERENT bug than
the brief's text, and is outside this task's write-set:**
Both `loxija-71-joku558`/`zepima-96-peco612`'s `ACTION_TEXT_MIN_HEIGHT`
floor (the brief's named mechanism) is **already fully ported** —
`gtile-action.ts#ACTION_TEXT_MIN_HEIGHT`/`floorActionLineHeight`, landed
in a PRIOR pass (add3-T2b), cited `AtomText.java:179-181` already. I
re-verified this by dumping both fixtures' real diffs
(`compareSvg`), not by trusting the brief: there are ZERO `@height`/
`@width` diffs on either row. The actual 2 remaining diffs per row are
BOTH `@fill` (`#000` vs expected `#F00`) on the diamond CONDITION text
(`"some"`/`"data to treat"`, both `skinparam activityFontColor red`
fixtures) plus a matching `@y` diff (the SheetBlock1-vs-plain-line
baseline formula, downstream of the fill bug, not independent). Root
cause: `activityFontColor(theme, sname)` (`activity-text-style.ts`,
**not in this task's write-set** — not named, not excluded, genuinely
ambiguous, treated conservatively as off-limits) resolves a bucket
override for `sname` only, then (for `'arrow'` only) a middle tier, then
falls straight to the root override/default — it has NO fallback from
`'diamond'` to the `'activity'` bucket. Upstream's
`getStyleSignatureDiamond()` (`ConditionalBuilder.java:101-106`,
`{root,element,activityDiagram,activity,diamond}` — the SAME tuple this
task's own EMPH-STROKE fix above already cites for LineThickness) governs
FontColor too, via the identical merge chain, so a bare `skinparam
activityFontColor red` (no diamond-specific override) reaches the
diamond's own condition text. The fix is a 2-line addition to
`activityFontColor` (add a `sname === 'diamond'` branch reading
`theme.colors.elements?.[bucketKey('activity')]?.font`, same shape as
the existing `'arrow'` branch at that function's own lines 122-124) — NOT
attempted here since the file is outside this task's write-set. Flagged
for the file's owner or the orchestrator's permission.

**CREOLE-ACT (`zejuso`/`letuke`) — not reached, verified still accurate.**
Re-read both fixtures' own `.puml` (legend block + table cells with `\n`
for `zejuso`; a `**creole**` diamond label + table cell `\n` for
`letuke`). `activity-renderer-legend*`/annotation chrome IS in this
task's write-set, but the real blocker for BOTH rows is upstream of the
legend renderer itself — the diamond/legend LABEL text never runs through
real creole for a `**bold**` diamond condition (gated by the SAME
`gtile-diamond-inside.ts`'s plain `bounder.getDimension` measurement this
task's own PADDING fix touched, but widening it to real creole is a
different, much larger change outside "padding only") and table cells
with embedded `\n` (an `AtomTable` cell-split concern, `activity-text-
placement.ts`/`tiles/gtile-diamond-inside.ts` territory, not this row's
own write-set). Confirmed unchanged (148/138) by this pass's own
measurement, matching add3-T3d's prior finding exactly — not stale.

**THEME-MARGIN (`labala`) — verified NOT reachable from this task's
write-set, with evidence, not a guess.** `theme.diagramMargin` ALREADY
resolves correctly end-to-end for `!theme amiga` — `core/build-theme.ts
#withDocumentStyle` (cdd4-T7b, a prior mission) already parses the
theme's own `root { Margin 5 }` `<style>` block into `theme.diagramMargin`
generically, for every diagram type. The missing piece is activity's OWN
CONSUMPTION of it, and `render-fixture-activity.ts`'s own doc comment
(point 2, "NO POST-CHROME DOCUMENT-MARGIN RE-APPLICATION") confirms
`applyActivityChrome`/`document-margin.ts` (the chrome path my write-set
note anticipated) is invoked ONLY for a chrome-bearing fragment (title/
legend/etc. present) — `labala`'s own fixture (`!theme amiga` + three bare
actions, no title/legend) has NO annotations at all, so it takes the
OTHER, DOMINANT path: `layout/canvas-origin.ts#finalizeGeometry` bakes
the hardcoded `ACTIVITY_DOCUMENT_MARGIN = 10` constant
(`activity-layout-constants.ts`) directly into node/edge/swimlane
coordinates at LAYOUT time, before `src/index.ts`/the renderer ever runs.
`layout/**` is explicitly NOT this task's write-set. The fix (read
`theme.diagramMargin` instead of the hardcoded constant) is small and
bounded, but it is in `canvas-origin.ts` AND `document-margin.ts`
(both-path coverage needed), neither reachable here — flagged for
`layout/**`'s owner.

**SLURL-LINK (`nesozi`) — further diagnosed, root cause STILL not
isolated, not fitted.** Re-verified add3-T3d's own finding byte-for-byte
against the jar's raw SVG (`grep` on the file, not assumed): the lane
title `[[www.plantuml.com First actor]] ` draws as `<a>…<text>First
actor</text></a><text> </text>` — link atom + a SEPARATE plain-text atom
holding exactly one space. Traced the counter-example
(`pezubu-98-niba240`'s `| 1 |` → jar draws bare `1`, no spaces) all the
way through: `CommandSwimlane.java`'s regex captures the raw, untrimmed
name; `Swimlane`'s constructor (`Swimlane.java:58-60`) builds
`Display.getWithNewlines(pragma, name)` with NO trim; `Display
.getWithNewlines` itself has no trim for plain content; `Swimlanes
.java:285-293`'s `getTitle` calls `create9` (`CreoleMode` = the
Display's OWN `defaultCreoleMode`, not `FULL`); and neither
`CreoleParser.createStripes` nor `StripeSimple#modifyStripe`/
`CreoleStripeSimpleParser` call `.trim()` anywhere (grepped both files
directly, zero hits) — `modifyStripe`'s char-by-char `pending` accumulator
would, by this reading, preserve " 1 " verbatim. This means my own
reading does NOT yet explain pezubu's trimmed golden — the trim must
happen somewhere I have not yet located (ruled out: `CommandSwimlane`'s
regex, `Swimlane`'s constructor, `Display.getWithNewlines`,
`CreoleParser`, `StripeSimple`'s plain-run accumulator). Per diagnosis.md,
not shipping a fix without the mechanism — `node-dispatch.ts#trySwimlane`'s
`.trim()` call remains the right place to START the next pass (same
pointer the brief already gave), now with FOUR Java files ruled out of
owning the trim, narrowing where to look next (candidates not yet read:
`CreoleStripeSimpleParser`'s own per-atom dispatch beyond what I checked,
or something in `AtomText`'s own construction).

## Probe Σ per commit (284-pin baseline)

| commit | Σ | risers |
|---|---|---|
| start (`af9dbc63b`) | 6710 | — |
| 1 `5b2736004` (PARSER-ELSE) | 6535 | 0 |
| 2 `5948148b9` (STYLE-FONT) | 6367 | 0 |
| 3 `f8cea7b80` (diamond LineThickness) | 6366 | 0 |
| 4 `bc761f2fb` (PADDING), final | **6135** | 0 |

Net this task: **−575** (6710 → 6135), 0 risers at every commit, verified
against the pinned `diff-baseline.json` manifest at every step, not just
the final state.

## Census movers (equality pins — `activity.{style,text,swimlane}-
baseline.test.ts`)

Re-pin needed from the orchestrator (rule 5 — never hand-edited).
Checked all three suites after the final commit:

- **style census**: `jufefu-66-josa392` (fontSize 11/12→13 histogram
  shift, strokeWidth/rx/textCount/width/height all moved — the recovered
  else branch draws real elements), `kepavi-26-sasu141` (fontSize
  11/12→0, 19→5 — `defaultFontSize` now resolved; width/height grow to
  match), `zivege-92-rise076` and `fukika-81-gite897` (width/height grow
  — PADDING). All four are the DIRECT, intended effect of this task's own
  commits; none is a regression (each pin's own `jar` column already
  expects the new values this change produces).
- **text census**: `jufefu-66-josa392` (fill/anchor/inset/textCount —
  same else-branch recovery), `fukika-81-gite897` and `zivege-92-rise076`
  (inset histogram 10→20/25 — PADDING's own box-inset growth).
- **swimlane census**: no movers.

No OTHER fixture's census moved (checked the full failing-test list each
time; every failure not named above and in this report is a pre-existing
unrelated failure from other merged-in tasks, not re-investigated here).

## Rule-11 all-engine survey (src/core/** touched: theme-root-fields.ts,
skinparam-accumulator.ts, skinparam-key-handlers-table-c.ts,
skinparam-theme-builder.ts, theme-merge.ts)

Before: disposable `git worktree add /private/tmp/claude-501/T3f/before-wt
5948148b9` (the commit immediately before any `src/core/**` edit), with
this worktree's own `node_modules` symlinked in (add3-T3d's own
precedent), removed after use. After: this worktree's own working tree.
27 engines, sequential, foreground (backgrounded automatically past the
120s tool timeout both times; monitored to completion, never polled with
`sleep`).

`engdiff.py before after`: **movers=33, conformant-losses=0.**

Every `activity` mover in this diff is `diverged → conformant`/
`structural-match` from a PRIOR merged pass's own mechanism (T3d's merge,
already reported in `add3-T3d.md`), not this commit's — none of this
task's own 5 fixed rows crossed a verdict bucket (all stayed `diverged`,
just with a lower score, which this coarser verdict/dotEqual survey
cannot see). The remaining movers are `dotEqual`-only flips WITHIN the
same `diverged` bucket on `class`/`c4`/`usecase`/`component`/`unknown`
fixtures. Verified, not assumed: grepped all four of the first `unknown`
movers' own `.puml` sources for `padding`/`defaultFontSize` — zero hits,
ruling out this commit's own keys as the cause. Consistent with this
project's own documented dot-engine/timing nondeterminism
(`.agent-notes/confounded-wall-clock-readings.md`).

## Quality gates

`npm run typecheck` (both tsconfigs): clean at every commit.
`npx eslint <every changed file>`: clean at every commit.
`npx vitest run tests/oracle/svg-conformance/activity.golden.ratchet.test.ts
tests/oracle/svg-conformance/activity.harness-parity.test.ts`: 348/348
green at the final commit (pins byte-equal).
`npx vitest run tests/unit/activity`: 582/582 green (final state).
`npx vitest run tests/unit/core`: 5470 passed, 1 skipped (pre-existing
skip, unrelated) — full core suite, run because this task touched
shared theme/skinparam files.

## Write-set discipline

Touched, all named in the brief's write-set: `dispatch-support.ts`,
`activity-style-defaults.ts`, `activity-creole-sheet.ts`,
`tiles/gtile-action.ts`, `tiles/gtile-diamond-inside.ts` (padding only,
as required), the five named-core files above (rule 11 survey done).

**Not touched, despite being named or implied in the brief, each with the
mechanism + exact blocking reason recorded above (not silently
dropped):**
- `renderer.ts` (EMPH-STROKE's arrow-tip-stroke half) — orchestrator's
  own mid-task correction: not my write-set, T3i's.
- `activity-text-style.ts` (KLIMT-FLOOR's REAL mechanism, a diamond
  FontColor cascade) — not named in the write-set, ambiguous, treated as
  off-limits per rule 7.
- `layout/canvas-origin.ts` + `layout/document-margin.ts`
  (THEME-MARGIN) — explicitly `layout/**`, not mine.
- `activity-renderer-legend*`, diamond creole widening, `AtomTable`
  cell-`\n` splitting (CREOLE-ACT) — read during diagnosis, not written;
  the real blocker in every case sits outside "legend rendering" itself.
- `node-dispatch.ts#trySwimlane` (SLURL-LINK) — read, not edited; root
  cause not yet isolated (four Java files ruled out, see above), and
  CLAUDE.md forbids shipping a guess.
- `src/core/annotations/WarningBannerBlock.ts` / a new RenderFragment
  chrome primitive (PADDING's banner residual) — read (to confirm it
  exists and is wired for mindmap only), not written; a new feature, not
  a one-line gap, correctly out of this pass's scope per CLAUDE.md's
  "genuinely large AND separable" bar.

No Serena MCP tool call was used for any edit (one accidental
`replace_symbol_body` call against a nonexistent `dummy` path was made
early in the session by mistake; it errored with `FileNotFoundError`
before touching any file — re-verified by `git status` immediately after,
clean; re-read the rules file and used only Read/Edit/Bash/grep for every
subsequent change). No `git stash` used. No raw `&` background job was
started deliberately — both all-engine surveys exceeded the tool's 120s
foreground timeout and were moved to the background automatically by the
harness itself; both were allowed to run to completion and their results
read from the completed output, never killed or worked around.

## Not done — summary

1. **CREOLE-ACT** (`zejuso-92-kexo870` 148, `letuke-04-poza319` 138) —
   not reached; blocker is diamond-label/table-cell creole widening,
   outside "padding only".
2. **THEME-MARGIN** (`labala-74-juki864` 120) — verified unreachable from
   this write-set; fix lives in `layout/**`.
3. **STRIPE** (`bigide-91-bise382` 35) — unchanged, pre-existing
   `layout/**`-level +0.5 global offset, already fully diagnosed by prior
   passes, not re-traced here.
4. **SLURL-LINK** (`nesozi-09-zezu092` 20) — diagnosed further (4 Java
   files ruled out), real trim site not yet found.
5. **KLIMT-FLOOR mislabel** (`loxija-71-joku558` 4, `zepima-96-peco612`
   3) — real mechanism found (diamond FontColor cascade), fix is a 2-line
   addition to `activityFontColor` in a file outside this write-set.
6. **PADDING's warning-banner residual** (~20px on both rows) — a new
   chrome primitive, not attempted.
7. **PADDING's +4 cascading offset** (`zivege` only) — isolated to NOT be
   a box/hexagon size bug; root site not found, lives in `layout/**`
   regardless.
8. **EMPH-STROKE's arrow-tip-stroke half** (`xovano-23-tazo278`,
   residual 2) — `renderer.ts`, not my write-set (orchestrator's own
   correction).
