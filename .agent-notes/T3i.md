# T3i — wave-3 leftovers (add2)

## Commits (branch `add2/T3i`, worktree `.claude/worktrees/add2-T3i`)

1. `bfb176da7` feat(activity): draw elseif's incoming label on the diamond west side
2. `403935d18` fix(activity): unescape \n in repeat-while condition/side labels
3. `6251b2496` feat(activity): draw |#color|lane| swimlane background
4. `b3cbc081c` feat(activity): draw end fork {label} beside the join bar
5. `2f042a60c` feat(activity): capture and attach backward's incoming/outgoing labels
6. `421256a27` feat(activity): draw INSIDE_DIAMOND condition style on repeat loops

All six independently green (typecheck both tsconfigs, eslint, targeted
vitest, golden ratchet, harness-parity, diff-baseline ratchet) at the
commit they landed in, and again at final HEAD.

## Java → ours (file:line), per item

1. **ELSEIFIN**: `CommandElseIf2.java:70-76` captures an elseif's leading
   `(incoming)` into `ActivityElseIf.incomingLabel` (pre-existing, T3f) →
   `FtileIfLongHorizontal.java:178-186` (`diamond.withWest(tbInlabel)`) and
   `:182-187` (`inlabelSizes.add(tbInlabel.calculateDimension(...)
   .getWidth())`) → split `longHorizontalBranches`/`buildLongHorizontalDiamonds`/
   `buildIfLongHorizontal` out of `conditional-builder.ts` into a new
   `conditional-builder-long.ts` (hook-enforced 500-line cap); threads
   `incomingLabel` onto `labels.west`, and `inlabelSizes` is now each
   diamond's own `labelAt('west')?.width ?? 0` (was hardcoded `0`) — the
   horizontal margin `gtile-if-long-horizontal.ts#coupleGeometry` already
   folds in, unused until now.
2. **xabesu (unescape)**: `CommandRepeatWhile3.java:144-147` routes
   TEST/WHEN/OUT through `Display.getWithNewlines`, the same escape
   `if-dispatch.ts#unescapeLabelNewlines` already mirrors for `if`/`elseif`
   (IFNL, T3d) → exported `unescapeLabel`/`unescapeLabelNewlines` from
   `if-dispatch.ts`, applied in `node-dispatch.ts#parseRepeatClose`.
3. **O (lane background)**: `CommandSwimlane.java:60-68` (`ColorParser
   .exp6()`'s `COLOR` group, previously matched but not captured) →
   `Swimlanes.java:160-161` (`setSpecificColorTOBEREMOVED(BACK, color)`,
   stored per lane, last-color-wins) → `Swimlanes.java:332-340` (the
   per-lane background rect, drawn before that lane's own nodes). Captured
   into a new `ParseContext.swimlaneColors: Map<string,string>`, exposed as
   `ActivityDiagramAST.swimlaneColors`, attached onto each `SwimlaneGeo`
   right after `placeSwimlanes` returns (`assign-coordinates-full.ts`'s new
   `withLaneBackgrounds`). `SwimlaneGeo.x`/`width` already match the jar's
   background-rect bounds exactly — verified directly against
   `cejupe-34-muti621`'s oracle SVG (both divider lines land on this
   lane's own `x`/`x+width`), so no new geometry was computed, only the
   colour threaded through and drawn in `activity-renderer-swimlanes.ts`'s
   new `renderSwimlaneBackground`.
4. **N (end fork {label})**: `CommandForkEnd3.java:72-74` (the `(\{.+\})?`
   LABEL group, matched but dropped) → `InstructionFork.java:193-196`
   (`setStyle` stores it unconditionally) → `ParallelBuilderFork.java:
   114-115` (`doStep2`'s own `((FtileBlackBlock) out).setLabel(...)` — the
   JOIN bar only, never the opening bar, never for `end merge`) →
   `FtileBlackBlock.java:84-92` (`calculateDimensionFtile`'s `width + supp`,
   `supp = labelWidth + labelMargin(5)` when non-empty) and `:110-112`
   (`drawU`'s label draw at `(width+labelMargin, -dimLabel.height/2)`).
   `ActivityFork.label` added; `GtileFork` gains optional `theme`/
   `joinLabel` constructor params, a new `left` field (`barWidth/2`,
   independent of the label supplement so `getCoord`'s NORTH/SOUTH hooks
   never shift — verified against `FtileGeometryMerger.java:40-46`'s own
   `left = max(geo1.left, geo2.left)`, which resolves to the SAME value
   either side here). `walk-fork-branches.ts`'s new `pushForkJoinBar`
   attaches the label onto the `join-bar` node and pushes a compression
   `Reservation` covering the label's own reach (`t.width - t.barWidth`) —
   without it X-compression collapsed the space back down (canvas width
   261 vs the jar's 284, caught via a direct jar-vs-ours SVG diff, not
   inferred). `activity-renderer-bars.ts#renderBar` draws the label via a
   new `renderJoinBarLabel`, reusing `centeredFirstBaselineY` (already
   exported from `activity-renderer-shapes.ts`).
5. **BACKLBL**: `CommandBackward3.java:64-89` (`(INCOMING)? backward :
   LABEL ; <<stereo>>* (OUTCOMING)?`, both decoration groups matched but
   dropped) → `InstructionWhile.java:198-211` / `InstructionRepeat`
   (`setBackward` stores `incoming1`/`incoming2`) →
   `FtileWhile.java:146,158-161` and `FtileRepeat.java:170-178,182-187`
   (both builders replace `ConnectionBackSimple*` with
   `ConnectionBackBackward1`/`Backward2` when `backward != null`, each
   carrying one of the two labels) → `FtileWhile.java:341-364` /
   `FtileRepeat.java:440-459` (`ConnectionBackBackward1`, `withLabel(back,
   BOTTOM)` for while / `withLabel(tbback, arrowHorizontalAlignment())`
   for repeat) and `FtileWhile.java:386-407` / `FtileRepeat.java:513-535`
   (`ConnectionBackBackward2`). `RE_BACKWARD`/`RE_BACKWARD_HEAD` now
   capture both groups (raw paren contents, `unescapeLabelNewlines`
   applied); `ActivityBackward.incoming`/`.outgoing` added; threaded
   through `GtileWhileContext`/`GtileRepeatContext` (new `withBackLabels`
   helper in `tile-layout-backward.ts`) → `GtileWhile`/`GtileRepeat` →
   `WhileFrame`/the repeat back-dispatch call → `walk-while-backward.ts`/
   `walk-repeat-backward.ts` attach `.label` onto the pushed edge right
   after each `pushEdge` call (precedent: `walk-switch.ts#applyLastEdgeLabel`).
   Single-line `backward:label;(outgoing)` only — the multiline closer
   reuses the generic `RE_ACTION_CLOSE` shape (shared with plain multiline
   actions), which has no trailing-paren group; not touched.
6. **CSTYLE (repeat)**: `ConditionalBuilder.getShape1`-equivalent for
   repeat is `FtileRepeat.create`'s own 3-way branch
   (`FtileRepeat.java:141-164`): INSIDE_HEXAGON (default, unchanged),
   EMPTY_DIAMOND (`:156-159`, not attempted — see below), INSIDE_DIAMOND
   (`:159-161`, `new FtileDiamondSquare(tbTest,...).withEast(yesTb)
   .withSouth(outTb)` — ALWAYS east+south, no `backwardExitsOnLeft` read
   in this branch at all, unlike the hexagon's own west/east choice).
   `RepeatConditionTile` widened to admit `GtileDiamondSquare`;
   `diamond-labels.ts`'s `emitDiamondLabels`/`emitDiamondOwnLabel` widened
   from the concrete `GtileDiamondInside` to the shared
   `DiamondConditionTile` interface (both already satisfied it, T3h's own
   widening for `buildIfDown`/`carapo-31-bisi880`) — `walk-repeat.ts`
   needed zero changes. `tile-layout.ts#tileRepeatCondition`/`tileRepeat`
   dispatch on `theme.conditionStyle`, mirroring `conditional-builder.ts
   #createConditionDiamond`'s own if-side dispatch exactly.
   `activity-renderer-shapes.ts`'s `'repeat-cond'` case merged into
   `'if-split'`'s existing `insideDiamond` ternary (identical computation,
   literal duplication removed).

## Rows reaching 0

dulate-94-bupu593 (65→0, item 1), nolubo-93-rula384 (65→0, item 1),
xabesu-51-dimi831 (124→0, item 2), cejupe-34-muti621 (8→0, item 3),
zafoxu-20-xofe568 (9→0, item 4, confirmed byte-identical to the jar oracle
SVG — element-for-element diff showed zero differences besides the
`style="..."` vs inline-attrs serialization and the jar's trailing
`<?plantuml-src?>` comment), novata-87-muti352 (17→0, item 6),
perate-09-gale335 (34→0, item 6).

## Probe Σ, per commit (full un-pinned baseline corpus)

| point | Σ | Δ | risers |
|---|---|---|---|
| baseline (branch head `7b9a6526d`) | 17272 | — | — |
| after item 1 (ELSEIFIN) | 17142 | −130 | 0 |
| after item 2 (xabesu unescape) | 17018 | −124 | 0 |
| after item 3 (O lane background) | 17008 | −10 | 0 |
| after item 4 (N end fork label) | 17001 | −7 | 0 |
| after item 5 (BACKLBL) | 16988 | −13 | 0 |
| after item 6 (CSTYLE repeat) | **16937** | −51 | 0 |

**Final: Σ 17272 → 16937 (−335, −1.9%), 0 risers at every single commit**
(each measured individually via `activity-probe.ts`, not just at final
HEAD). 206 pinned goldens byte-equal throughout
(`activity.golden.ratchet.test.ts`, 450 tests green across the three
oracle test files at final HEAD); `activity.harness-parity`/
`activity.diff-baseline.ratchet` green throughout.

## Risers

None, at any commit. Every probe run reported `risers (0):`.

## Per-item status vs the brief's 7 items

1. ELSEIFIN — **landed**. Field was dead (captured, never drawn); now
   drawn and the field is no longer dead.
2. BACKLBL (boxefe-81-situ725) — **partially landed**. Data wiring
   (capture, correct edge attachment, correct label text) is complete and
   verified: 69→58 (−11). Residual: a direct jar-vs-ours SVG diff on
   boxefe showed the label TEXT matches exactly but the (x,y) differs.
   `Snake.java:244-267` (`getTextBlockPosition`) is a distinct,
   multi-branch placement algorithm (`BOTTOM`/`CENTER`/zigzag/
   direction-code cases keyed off the Worm's own point list and
   `directionsCode`) that this port's generic `renderEdgeLabel` does not
   implement — it positions near the edge's own corner/endpoint instead.
   This is a cross-cutting renderer mechanism (every `withLabel` call
   site in the jar goes through it, not just `backward`'s), confirmed by
   reading the Java directly, not guessed; re-slotted rather than
   hand-tuning this one connector's position to match by coincidence.
3. CSTYLE — **partially landed**. Repeat's INSIDE_DIAMOND branch landed
   (novata, perate: both →0). NOT attempted: reluvi-59-pifi444
   (EMPTY_DIAMOND, `FtileRepeat.java:156-159`) draws a BARE diamond
   (`FtileDiamond`, no inside label at all) with its condition text drawn
   OUTSIDE as an east label, and the `FtileRepeat` constructor's 4th arg
   carries `tbTest` itself instead of an empty block — a genuinely
   different shape AND a different height contribution, not a
   label-routing variant of the two styles already modeled. No `Gtile`
   class for a bare (text-outside) diamond exists anywhere in this port
   today; building one plus its height/placement formula is new work, not
   a dispatch add. `buildIfWithLinks` CSTYLE: no cohort fixture exercises
   it (checked — no row in the b3 cohort combines `ConditionStyle
   InsideDiamond` with an if/else-with-links shape), so there is nothing
   to measure; the mechanism T3h already identified still holds exactly:
   `walk-if-with-links.ts`'s own local `pushDiamondLabel`/
   `pushDiamondOwnLabel` type `diamond1` concretely as `GtileDiamondInside`
   (confirmed by reading the file, not assumed) and would need the SAME
   `DiamondConditionTile` widening this task applied to `diamond-labels.ts`
   — cheap in isolation, but with no fixture to verify against, attempting
   it would be unmeasured and risked a regression with no detector.
4. xabesu-51-dimi831 — **landed**, 124→0.
5. N (zafoxu-20-xofe568) — **landed**, 9→0, confirmed byte-identical to
   the jar oracle SVG.
6. O (cejupe-34-muti621) — **landed**, 8→0.
7. levuma-67-cego489 (circle ink) — **not attempted, re-slotted**. See
   below — the fix genuinely requires a `src/core/**` change, which this
   task's hard rules forbid ("nothing under src/core/**").

## levuma-67-cego489 — diagnosis (re-slot, no code change)

**Context**: `start`/`stop` circle ink hardcoded to `CIRCLE_INK` (`#222`)
in `activity-renderer-terminals.ts`, flagged by T3h as needing the
dark-mode seed. Current residual: 4 (started at 47 before T3f/T3h; row
also carries an unrelated T3b component, already resolved).

**Mechanism** (read directly, not inferred from the ledger): `plantuml.
skin:379-380` sets `circle{start,stop,end{LineColor #2;BackgroundColor
#2}}` (both properties, SAME literal); the dark `@media` block
(`:687-692`) overrides BOTH to `#d` for the SAME three circles,
independently of `circle,start`'s own skinparam-convert targets
(`FromSkinparamToStyle.java:137`: `ActivityStartColor` converts ONLY
`BackGroundColor`; there is no `LineColor` convert for `start`/`end` at
all — only `stop` has one, via `ActivityStopColor`, also unported).
Verified against the jar's own SVG for `levuma-67-cego489`
(`skinparam mode dark`, no `ActivityStartColor`/`ActivityStopColor` set):
every circle's fill AND stroke are `#DDD` (ellipse 1, cx=124.397: `fill=
"#DDD" stroke="#DDD"`; stop's outer+inner ellipses: same). Our render
(`npx tsx` scratch render, not inferred): fill correctly resolves to
`#DDD` (via `actColors(theme).startFill`, dark-seeded by T3h's
`activityStartColor`/`activityEndColor` -> `DARK_MODE_DEFAULTS
.activityCircleInk`), but stroke stays the light-mode-only module
constant `CIRCLE_INK` (`#222`) — 3 of the 4 residual diffs are exactly
these stroke attributes; the 4th is `stop`'s own fill (same mechanism,
`stop` has no theme field at all yet).

**Why this needs a `src/core/**` change**: `act.startColor`/`act
.endColor` (the fields `activity-renderer-shapes.ts#actColors` already
reads) are written by BOTH a real user `skinparam ActivityStartColor`
override AND the dark-mode seed, through the SAME `SkinparamAccumulator`
slot (`skinparam-theme-builder.ts`'s `??=` seed-if-undefined pattern,
T3h's own precedent for `arrowFontColor`/`activityBackground`). Reusing
that field for STROKE too would be WRONG in general: `renderStart`'s own
code comment documents a real, jar-verified regression (T2f mechanism 7,
`poraji-17-goke817`: `skinparam ActivityStartColor red` with NO dark
mode) where stroke incorrectly followed fill to red — confirmed this
fixture is still in the corpus (`test-results/dot-cache/activity/
poraji-17-goke817/in.puml`) and the existing code's own comment describes
exactly this fix. The circle's own `LineColor` default (`#2` light / `#d`
dark) has NO skinparam-override path at all for `start`/`end` (confirmed
via `FromSkinparamToStyle.java` grep — only `stop` has one, also
unported) — it needs its OWN dark-seeded field, independent of
`activityStartColor`/`activityEndColor`, which means a new
`SkinparamAccumulator`/`Theme`/`theme-graph-colors-b.ts` field (all under
`src/core/**`). This is the SAME conclusion T3h already reached for
`stop`'s own residual ("would need a `core/theme-graph-colors-b.ts`
addition, out of this task's write-set"); this session's own reading
confirms it extends to `start`'s stroke too, and that no `src/core/**`-free
workaround exists without reusing the user-override-shared field (which
would regress `poraji-17-goke817`). **Not attempted**, per this task's
explicit hard rule ("no tolerances, no fitted constants, nothing under
`src/core/**`").

## Quality gates

`npx tsc --noEmit -p tsconfig.json` and `npx tsc --project tsconfig.node.
json --noEmit`: clean, after every commit and at final HEAD. `npx eslint`
on every touched/new file: clean. Targeted vitest at final HEAD:
`tests/diagrams/activity`, `tests/unit/activity`, the three activity
oracle tests (`activity.golden.ratchet`/`activity.diff-baseline.ratchet`/
`activity.harness-parity`): **89 files, 1973 passed, 0 failed**. 206
pinned goldens byte-equal throughout. No `npm test` (forbidden by this
task's rules — only targeted vitest). No Serena MCP tool used in any
edit (Read/Edit/Write/Bash only, per the hard rule). No `git stash`. No
raw `&` background jobs.

New/updated tests (TDD-after-the-fact for items 1-6, since each fix was
discovered via direct Java reading + oracle diffing, then verified with a
fresh test asserting the new behavior before the probe/oracle confirmed
it): `conditional-builder.test.ts` (2 new — west-label threading, width
growth), `repeat-while-semicolon.test.ts` (1 new — `\n` unescape),
`renderer-swimlanes.test.ts` (2 new — lane background rect), `parser.test.ts`
(3 new — swimlane colour capture), `gtile-fork.test.ts` (4 new — joinLabel
geometry), `renderer-shapes.test.ts` (2 new — join-bar label draw),
`parser.test.ts` (fork-end-label, 5 new), `walk-while-backward.test.ts`
(2 new), `walk-repeat-backward.test.ts` (3 new), `parser-ubrr-t10.test.ts`
(6 new — backward incoming/outgoing capture), `tile-layout.test.ts` (3
new — repeat INSIDE_DIAMOND dispatch).

## Anything not done and why

- **BACKLBL's label position** (item 2): re-slotted above — needs
  `Snake.java:244-267`'s full placement algorithm ported into the generic
  edge-label renderer, a cross-cutting change affecting every `withLabel`
  call site, not scoped to `backward`.
- **CSTYLE EMPTY_DIAMOND** (reluvi-59-pifi444, item 3): re-slotted
  above — a new bare-diamond-with-external-label `Gtile` class and its own
  height formula, not a dispatch addition to the existing two styles.
- **CSTYLE on `buildIfWithLinks`** (item 3): re-slotted — mechanism
  unchanged from T3h's own finding (`walk-if-with-links.ts`'s two local
  helpers type `diamond1` concretely); no cohort fixture exercises it, so
  there is nothing to measure against.
- **levuma-67-cego489** (item 7): re-slotted with full mechanism above —
  requires a `src/core/**` field this task's hard rules forbid adding.
- `tiles/{gtile-while,gtile-repeat}.ts` (listed in the write-set): touched
  for items 5/6 (backIncoming/backOutgoing fields, CSTYLE's
  `RepeatConditionTile` widening) — not for anything else.
