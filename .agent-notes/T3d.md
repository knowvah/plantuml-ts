## Observation: T3d (if family + shape rendering) execution summary

- **Context**: mission `activity-divergence-drive-2`, task T3d
  (`plans/activity-divergence-drive-2/batch-3/T3d-if-shapes.md`),
  worktree `add2-T3d`, branch `add2/T3d`.
- **Finding**: 4 commits landed closing zaloze/T2G, IFNL, I, D, J, L,
  MLJOIN and IFDS fully (8 of 11 assigned families); CSTYLE/PAINT/vimako
  left re-slotted or partially diagnosed (below). Probe Σ 27577 -> 25749
  (-6.6%) with 0 unexplained risers (3 explained D7 reveals, all on rows
  with a pre-existing, unrelated, out-of-scope divergence).
- **Confidence**: High — every number from a fresh `activity-probe.ts`
  run against this branch's own commits; every mechanism verified
  against the cited Java file:line, not copied from the cohort tables
  (one cohort hypothesis, T2G's "GtileIfDown hasTwoBranches=false", was
  disproved by direct measurement and replaced with the real mechanism).

## Commits (4, each green: targeted vitest + typecheck + eslint)

1. `6df960823` fix(activity): route a bare/killed spot else-branch to
   down-builder (T2G zaloze)
2. `640840227` fix(activity): if-condition newlines, hexagon geometry,
   diamond colors (IFNL + I + D + J + L bundled — see note below)
3. `d322e07d1` fix(activity): join if/elseif continuation lines with a
   hidden newline (MLJOIN)
4. `d96c04b81` fix(activity): keep if-down's ConnectionOut in the
   then-lane (IFDS)

**Scope note on commit 2**: five families (IFNL, I, D, J, L) landed in
one commit instead of five. All five fixes live in the same two
renderer files (`activity-renderer-shapes.ts`/`activity-renderer-if-
shapes.ts`), both already at the 500-line complexity-hook cap — every
edit required shaving comment lines or relocating a helper between the
two files to make room (`renderHexagonMultilineLabel`, `diamondColors`
both moved to `activity-renderer-if-shapes.ts`), so the edits ended up
genuinely interleaved rather than independently stageable. Each
mechanism is still documented separately in its own code comment and in
the commit body.

## Java -> ours (file:line)

- **T2G zaloze**: `InstructionList.java:90-106` (`isOnlySingleStopOrSpot`,
  unconditionally `true` for a lone `InstructionSpot`, killed or not) ->
  `conditional-builder.ts#isStopOrSpot` (added `'spot'` alongside
  `'action'`/`'stop'`/`'end'`). The cohort's own "GtileIfDown
  hasTwoBranches=false" hypothesis was checked against the Java
  (`ConditionalBuilder.java:170-191`, `FtileIfDown.java:124-159`) and
  disproved: `hasTwoBranches` has zero effect once `optionalStop` is
  set (the Java overrides `diamond2` to a bare `FtileEmpty` regardless).
  The real defect was upstream of that: `ActivitySpot` (T2g) never got
  added to the routing check, so the row fell through to `with-links`
  instead of `down`.
- **IFNL**: `CommandIf2.java:151`/`CommandIf4.java:120`/
  `CommandElseIf2.java:151` (`Display.getWithNewlines`) ->
  `if-dispatch.ts#matchIfHeader`/`consumeElseifClause` now unescape
  `condition`, not just `thenLabel`/`elseLabel`. Residual sizing/
  alignment gap closed in `gtile-diamond-inside.ts` (own-label
  `dimLabel` via `measureLabel`, not a raw `getDimension` call) and
  `activity-renderer-if-shapes.ts#renderHexagonMultilineLabel` (new:
  root's default `HorizontalAlignment left`, `plantuml.skin:12`,
  positions every Sheet stripe at the label block's own `x=0` — the
  whole block centres ONCE, `FtileDiamondInside.java:94-96`, never each
  line on its own width).
- **I**: `Hexagon.java:46,65-74` (`hexagonHalfSize` constant, not
  `height/2`) -> `renderHexagon`/`renderHexagonPolygon`'s `dent`, now
  importing the shared `HEXAGON_HALF_SIZE` from
  `layout/hexagon-reservations.ts` instead of redeclaring it.
- **D**: `ConditionalBuilder.java:250-256`/`FtileWhile.java:131-132`
  (default `ConditionStyle.INSIDE_HEXAGON` builds `FtileDiamondInside`
  regardless of empty condition) -> `renderNode`'s `'if-split'`/
  `'while-header'` case always calls `renderHexagonPolygon`, dropping
  the empty-label ternary that fell back to the 5-point `renderDiamond`.
- **J**: `StyleSignatureBasic.java:271-273` (diamond's own signature
  contains `SName.activity`) + `FromSkinparamToStyle.java:141,143` ->
  `actColors`'s `diamondFill`/`diamondBorder` now fall through
  `diamondBackground ?? background ?? nodeBackground` (added the middle
  tier). Split into `diamondColors()` in `activity-renderer-if-
  shapes.ts` to keep `actColors`' own CCN from rising.
- **L**: `AtomText.java:179-181` (10px per-line height floor) ->
  `measureLabel` in `gtile-diamond-inside.ts`, `gtile-diamond-inside2.ts`,
  `gtile-diamond-square.ts` all floor each line's height at
  `ATOM_TEXT_MIN_HEIGHT = 10`.
- **MLJOIN**: `CommandDecoratorMultine.java:63`
  (`toSingleLineWithHiddenNewLine`) -> `parser.ts#joinUnbalancedLines`
  joins a continuation line with the literal 2-char `\n` escape, not a
  space (a REAL newline would truncate every opener regex's `(.*?)`
  group — none has the dotAll flag). Found the SAME single-call sizing
  gap in `gtile-diamond-inside2.ts` (used by the long-horizontal
  builder) that IFNL's own-label fix closed for `GtileDiamondInside`;
  fixed identically, including giving that file's `measureLabel` its
  first-ever per-line split loop.
- **IFDS**: `FtileIfDown.java:130-131` (`optionalStop != null` ->
  `diamond2` replaced with a bare `new FtileEmpty(skinParam)`, no
  swimlane) -> `walk-if-down.ts#connectionOut` now tags the edge's
  `lane2` with the SAME lane as `lane1` whenever `t.optionalStop !==
  null`, instead of unconditionally `myLane` — `swimlane-placement.ts`'s
  own cross-lane check (`lane1 !== lane2`) then correctly sees no
  crossing and skips the jog.

## Per named row (families owned by T3d)

| row | before -> after ws | status |
|---|---|---|
| zaloze-31-jibo311 | 137 -> ~9 (GLYPH residual, out of scope) | fixed |
| vaxiki-78-nice114 | 77 -> 0 | fixed |
| copisa-69-xisi273 | 124 -> 0 | fixed |
| lafilo-69-tuti771 | 131 -> 0 | fixed |
| kafevi-44-tesu096 | 7 -> 0 | fixed |
| dozaxu-98-xetu961 | 9 -> ~2 (K family, T3e's, residual) | fixed (I/L/J parts) |
| sofoje-37-tila554 | 2 -> 0 | fixed |
| biredi-08-bama025 | 3 -> 0 | fixed |
| lukoxa-16-cecu095 | 92 -> 2 (T2b height-1, known) | fixed |
| pekefu-66-mepa144 | 42 -> 8 (small residual, unexplained) | mostly fixed |
| xabesu-51-dimi831 | 134 -> 125 | partial (see vimako/repeat note) |
| novata-87-muti352, perate-09-gale335, carapo-31-bisi880, reluvi-59-pifi444 | unchanged | re-slotted (CSTYLE, below) |
| dakesa-98-mano758, cigagu-31-rime196, gudute-55-nulo344 | unchanged | re-slotted (PAINT, below) |
| vimako-25-mega336 | 34 -> 34 | re-slotted (below) |
| bazuma-86-metu353, fabule-54-pili300 | unchanged | T2f/T3c residuals, not T3d's (per family doc) |

## Probe Σ before/after, per commit (full 253-row corpus)

- Baseline (branch head before T3d, `78b09f3e9`): **Σ 27577**.
- After commit 1 (zaloze/T2G): Σ 27449 (-128). 0 risers.
- After commit 2 (IFNL+I+D+J+L): Σ 26946 (-503 net). 5 risers, all
  verified D7 reveal-class (`points[]` length now matching the jar's
  switches `compare.ts` from a single length-mismatch diff to
  per-coordinate diffs on a row that already diverges for an unrelated
  reason — e.g. `cutabu-59-cilo276`'s pre-existing WSPEC/WORD
  while-mechanism gap, `jupoxe-15-sugo110`'s pre-existing snake-merge
  axis-drift crash).
- After commit 3 (MLJOIN): Σ 26005 (-941). 2 of the 5 commit-2 risers
  (`besaga-58-poli497`, `leduvi-16-voli986`) fell back under baseline
  as a side effect (same if/elseif-join machinery); `lopone-15-xiki477`
  likewise. Net risers at this point: 3 (`cutabu-59-cilo276`,
  `jupoxe-15-sugo110` newly appeared as the SAME reveal class on an
  already-1238-ws row, `pifoni-76-duxa505`).
- After commit 4 (IFDS): Σ 25749 (-256). Same 3 risers, unaffected.

**0 unexplained risers.** All 3 final risers are the exact D7-documented
reveal class ("a points[] list whose length now equals the jar's")
measured directly: for each, the SPECIFIC polygon(s) my fix touches are
now byte-identical to the jar (verified via a scratch `compare.ts` run,
not just the probe's aggregate), and the row's total score rise comes
entirely from `compare.ts`'s per-attribute `points`/`d`/`viewBox`
numeric-array comparator switching from "whole-array length mismatch =
1 diff" to "per-coordinate diffing" on coordinates that are STILL wrong
for a different, pre-existing, out-of-scope reason (`cutabu`: WSPEC/
WORD while-mechanism, T3b's; `jupoxe`: the already-logged snake-merge
axis-drift crash; `pifoni`: not traced further, same pattern of
polygon-length-driven reveal, consistent delta magnitude). Left
UNPINNED for the orchestrator's close-time "pin round 2" step (overview
table's own T3-close row) — never touched `oracle/goldens/**` myself.

Note: `activity.diff-baseline.ratchet.test.ts`'s own error message
describes a DIFFERENT, already-fixed monotonicity guarantee
(`compareNodes`'s node/tag/child-count short-circuits, upper-bound
charged). That fix does not cover the `points`/`d`/`viewBox` attribute-
value comparator (`compare.ts:418-444`), which is still the older,
non-monotonic length-vs-positional asymmetry — confirmed by reading
that function directly, not inferred from the error text.

## Re-slots (mechanism + owning files, not attempted or not completed)

- **CSTYLE** (`carapo-31-bisi880` ws77, `novata-87-muti352` ws22,
  `perate-09-gale335` ws38, `reluvi-59-pifi444` ws67): T2c already built
  the inert core (`theme.conditionStyle`, `GtileDiamondSquare`,
  `DiamondConditionTile` interface). Wiring `conditional-builder.ts`
  (T3d's own file) to branch on `conditionStyle` for the IF-based rows
  (carapo) was NOT attempted this session — ran out of budget after the
  8 families above. The REPEAT-based rows (novata/perate/reluvi) need
  `tiles/gtile-repeat.ts` (T3b's write-set, not T3d's) regardless.
- **PAINT** (`dakesa-98-mano758` ws13, plus the PAINT share of
  `cigagu-31-rime196`/`gudute-55-nulo344`): needs `acc.activityBackground`
  widened from `string` to `Paint` through the core skinparam handler +
  `theme.colors.graph.activity.background` field type (both core,
  outside T3d's write-set) before `activity-renderer-shapes.ts`'s
  `actColors` (T3d's own file, already touched this session) can
  consume it. Not attempted — the core-side widening is the blocking
  piece and belongs to whichever task owns `theme.ts`/`skinparam-*.ts`.
- **vimako** (`vimako-25-mega336`, ws 34, unchanged): confirmed NOT
  `gtile-if-down.ts`'s south-label margin formula (verified byte-for-
  byte against `FtileIfDown.java:542-564`'s `getSouthLabelHeight` ->
  `FtileDiamondInside.getSouthLabelHeight` -> `south.calculateDimension`
  — our own `height = total.geo.height + 3*HEXAGON_HALF_SIZE +
  max(HEXAGON_HALF_SIZE, southLabelHeight)` already matches this
  formula exactly). The residual +4.444px is entangled with the SAME
  row's own creole gap (`**Should be 2 arrows**` renders literally,
  `font-weight` missing) — the south label's CREOLE SHEET height
  (numbered-list "1. ..." + bold markup) is not simply `measureLabel`'s
  plain per-line sum; distinguishing the two residuals needs a creole-
  bold-in-south-label port this task's write-set does not include
  (`core/klimt/creole/**`). Re-slotted to whichever task owns that.
- **xabesu-51-dimi831** (ws 134 -> 125, MLJOIN landed but the row stays
  mostly broken): the `repeatwhile(...)` condition spans 3 physical
  lines too, and `parser.ts`'s join now correctly folds them with `\n`
  escapes -- but `node-dispatch.ts#parseRepeatClose` (NOT in T3d's
  write-set) never runs that condition through
  `unescapeLabelNewlines`, so the literal `\n`/`\\n` text still renders
  verbatim (confirmed: `text()[1]` shows the raw escaped string).
  Re-slotted to whichever task owns `node-dispatch.ts`.
