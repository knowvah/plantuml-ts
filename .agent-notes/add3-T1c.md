# add3-T1c — XLANE: cross-lane loop/if-with-links connectors

Worktree: `.claude/worktrees/add3-T1c`, branch `add3/T1c`.

## Commits

1. `122c4c841` feat(add3-T1c): port repeat backward1/2 cross-lane connectors
2. `212fb0a4b` feat(add3-T1c): port if-with-links cross-lane connectors

## Java -> ours (file:line)

- **repeat-backward1/2**: `FtileRepeat.ConnectionBackBackward1#drawTranslate`
  (`vcompact/FtileRepeat.java:432-459`) / `ConnectionBackBackward2#drawTranslate`
  (`:482-511`). Both recompute their own left/right side (Backward1) or
  wraparound (Backward2) decision from the POST-translate coordinates,
  never the untranslated ones `walk-repeat-backward.ts#backward1Points`/
  `backward2Points` use for the same-lane `drawU` shape — the exact gap
  T1a's census flagged. New `RepeatBackward1Loop`/`RepeatBackward2Loop`
  kinds in `swimlane-loop-translate.ts`, point math in
  `swimlane-loop-translate-repeat.ts#routeRepeatBackward1/2`, loop tags
  wired at `walk-repeat-backward.ts#pushRepeatBackwardConnections`'s two
  `pushEdge` call sites (new `buildBackwardLoops` helper, kept under the
  file's NLOC cap). No `label` field on either loop record — unlike
  `repeat-out`'s elbow+drop split, each shape is exactly one edge, so
  `{...edge, points}` already carries the base edge's own
  `label`/`labelAlign` (set by `applyBackwardLabel` at the same push site)
  through unchanged.
- **if-links-h-then-v / if-links-v-then-h / if-links-v-then-h-direct**:
  `FtileIfWithLinks.ConnectionHorizontalThenVertical#drawTranslate`
  (`vcompact/cond/FtileIfWithLinks.java:148-173`),
  `ConnectionVerticalThenHorizontal#drawTranslate` (`:237-285`),
  `ConnectionVerticalThenHorizontalDirect#drawTranslate` (`:327-354`).
  New sibling module `swimlane-loop-translate-if-links.ts` (point math),
  three new `LoopTranslate` kinds in `swimlane-loop-translate.ts`
  (dispatcher split into `routeLoopTranslateRepeat`/`routeLoopTranslate`
  to stay under the file's CCN-10 cap once 12 kinds existed), loop tags
  wired at `walk-if-with-links.ts`'s three `pushDecoratedEdge` call sites
  (`pushInConnectors`, `pushOutConnectorsBoth`, `pushDirectConnector`),
  `pushDecoratedEdge` widened to accept `loop?: LoopTranslate` and thread
  it into `pushEdge`'s routing param.
  - `ConnectionHorizontalThenVertical#drawTranslate`: when
    `Direction.leftOrRight` flips between the untranslated and translated
    pair, an extra unarrowed detour snake draws first
    (`p1 -> p1+delta -> p1+delta,y+diamond1.height*.75`), and the main
    (always `MergeStrategy.LIMITED`) snake starts from the detour's last
    point instead of `p1`.
  - `ConnectionVerticalThenHorizontal#drawTranslate`: ALWAYS splits into
    an unarrowed `LIMITED` elbow + a short arrowed `LIMITED` drop; the
    elbow's `delta` sign is read from the UNTRANSLATED `p1.x`/`p2.x`
    (`:248-249`, read before either point is translated), never the
    translated pair, regardless of which of the two branches (same- vs
    flipped-direction) fires.
  - `ConnectionVerticalThenHorizontalDirect#drawTranslate`: single
    always-`LIMITED`, never-arrowed 4-point path; the elbow Y drops
    `Hexagon.hexagonHalfSize` below the if-tile's own untranslated
    bottom, but the path's FINAL point returns to that untranslated
    bottom unchanged.
  - All three Java methods never call `emphasizeDirection` (confirmed by
    reading every method body in the file) — `withoutEmphasize` strips
    the base edge's own `branchEmpty`-conditioned `emphasize` before the
    two v-then-h kinds rebuild their edges, matching that omission.
  - `Direction.leftOrRight` (`utils/Direction.java:107-112`) throws on
    equal x; mirrored with a thrown `Error`, same upstream assumption
    (never hit by a laned fixture — tested directly for coverage).

## Rows before -> after (probe `Σ`, 125-row baseline set)

Branch head baseline: Σ 16770, 0 risers.

- After commit 1 (repeat backward): **Σ 16770 -> 16635** (-135).
  `sadovu-51-fata536`, `xidamu-85-xoti640`, `xizola-97-sizu458`: 18 -> 0
  each. `luxido-91-covi016`: 22 -> 0. `delide-30-teva601`: 28 -> 0.
  `citire-32-mive114`: 31 -> 0. 0 risers.
- After commit 2 (if-with-links): **Σ 16635 -> 16362** (-273).
  `decudi-92-bisu741`, `maketa-43-juja264`, `rujuxa-07-neco067`,
  `zinelo-77-losu727`: 10 -> 0 each. `jevoce-05-mumi686`,
  `maduja-30-xiri319`, `samavi-13-fuku339`: 28 -> 0 each. Also fell
  (not fully resolved — other mechanisms remain, see Residuals):
  `pezubu-98-niba240` 62 -> 55, `ruzica-16-deli877` 594 -> 522,
  `tuneta-22-mega154` 302 -> 232. 0 risers.
- **Final: Σ 16770 -> 16362 (-408, -2.4%), 0 unexplained risers at any
  stage.** `boxefe-81-situ725` (55 vs pinned 58, delta -3) is a
  pre-existing faller, present in the very first baseline probe run
  before any T1c edit — unrelated to this task.

All 13 named census rows (XLANE-REPEAT's 6, XLANE-IF's 7) reach exact
(score 0).

## Element census

`activity-probe-elements.ts` after commit 1: 125 rows, Σ 16635,
0 missing-line+arrow, 0 extra-arrow-only (no new element-count risers).
Re-ran after commit 2 with the same clean shape. Every riser check
across both commits reported `risers (0)` from `activity-probe.ts`
itself (the authoritative check per this task's own rule 10).

## Pinned census (equality) drift — correct, verified, needs re-pin

Two `swimlane-baseline.json` entries moved, both confirmed to now
EXACTLY MATCH the already-pinned jar value (not fitted, not guessed —
read directly from the committed baseline JSON):

- `luxido-91-covi016` (after commit 1): `ours.width` 279 -> 274. Jar's
  own pinned width is already 274.
- `ruzica-16-deli877` (after commit 2): `ours.height` 608 -> 607. Jar's
  own pinned height is already 607.

Both are the correct effect of fixing the connector geometry (the old
generic 4-point jog overshot the canvas extent in each case). Per
`repin-activity-baselines.ts`'s own doc ("ORCHESTRATOR-ONLY... never
per task") and this task's rule 5 ("never edit oracle/goldens/** or
baseline JSONs"), these were **left for the orchestrator to re-pin at
mission close-out**, not touched here. `activity.golden.ratchet.test.ts`
(224 pins) and `activity.harness-parity.test.ts` are fully green at
both commits — only the two `swimlane-baseline.json` (EQUALITY, not
ratchet) entries above are stale.

## Verified NOT a gap (census "Also verify" items)

- **`FtileWhile$ConnectionBackBackward1/2`** (`vcompact/FtileWhile.java:
  313,367`): confirmed by direct read — neither `extends ... implements
  ConnectionTranslatable` (only `ConnectionBackSimple` at `:217` does,
  already ported as the `while-back` kind). `ConnectionCross.drawU`
  (`ftile/ConnectionCross.java:47-63`) only calls `drawTranslate` when
  `instanceof ConnectionTranslatable`, with no same-lane fallback — so
  upstream draws literally NOTHING for these two cross-lane. Grepped the
  full 125-row corpus for `while`+`backward`+`|lane|` co-occurrence:
  zero matching rows (every `backward`+swimlane fixture in the corpus is
  a `repeat`, not a `while`). `walk-while-backward.ts#pushBackward1/2`
  pushes with no `loop` tag today, which — IF a cross-lane `while`+
  `backward` fixture existed — would incorrectly fall through to the
  generic jog instead of drawing nothing. Unobservable in this corpus;
  not fixed (would need a new "draws nothing cross-lane" sentinel the
  `LoopTranslate`/`EdgeShape` union has no case for today — a real
  follow-on, but zero-weight against the current corpus).
- **`FtileIfLongHorizontal`'s `ConnectionVerticalOut`/`ConnectionHline`**
  and **`FtileIfWithLinks`'s own HLINE-style copies** (`:369-418,
  421-529`): neither implements `ConnectionTranslatable` either — both
  are drawn through the PER-LANE narrowing pass (`Swimlanes.java:342`'s
  `UGraphicInterceptorOneSwimlane`), never through `ConnectionCross`'s
  `Cross` class (`Swimlanes.java:191-197`: `Cross.draw`'s `Connection`
  branch returns immediately when either endpoint tile is `null`, which
  both these classes' constructors always pass as `getFtile2()`). This
  is the PRE-EXISTING, already-ported `hline`/`routeHline` seam (mission
  `activity-divergence-drive-2`/`-3` T1p-a/T1p-g), confirmed used
  identically by both `walk-if-with-links.ts#connectionHlineLinks`/
  `connectionVerticalOut` and `walk-if-long-horizontal.ts` (same
  `{ hline: ... }` tag). **Not a missing `LoopTranslate` kind** — no
  action needed here.

## Residual: XLANE-HLINE lane-width-off-by-10 (verified mechanism, not fixed)

`pezubu-98-niba240` (55, down from 62) and `jucidi-98-zato093`
(unchanged at 81) both show the SAME symptom: every divider/element at
or past the second lane boundary is shifted by exactly 10px versus the
jar (confirmed by direct SVG line-list diff: ours second divider at
333.2, jar's at 343.2; everything right of it carries the same +10
offset). This is a **lane-width measurement bug**, not a connector
drawing/`LoopTranslate` gap — both fixtures' `ConnectionVerticalOut`/
`ConnectionHline` connectors are already confirmed correctly-ported
above. Root cause not isolated (would need to trace
`swimlane-context.ts#measureLaneExtents`/`computeLaneWidths`, which is
OUTSIDE this task's write-set, or `swimlane-hline.ts`'s own
`HlinePayload` candidate math, which IS in-write-set but not yet
diagnosed to a `file:line` mechanism) — reporting per CLAUDE.md's
"hard is a trigger to verify, not skip," verified-but-separable, not a
LoopTranslate defect, left as a named follow-on rather than guessed at.

## Residual: XLANE mixed rows (not fully resolved, correctly out of scope)

`kijazo-83-kipu485` (220, unchanged), `nikivo-06-kaxa873` (330,
unchanged), `ruzica-16-deli877` (522, down from 594) — census's own
caveat ("if detours into diamond2 W/E, FtileWhile back edge") already
flagged these as likely NOT a `LoopTranslate` gap; consistent with the
verified-NOT-a-gap finding above for `FtileWhile`'s two Backward
connectors. Not investigated further than that — these rows' remaining
residual is a mix of several mechanisms (D1b's own census), only a
fraction of which (the if-with-links portion, now fixed) belonged to
this task.

## Not done and why

- XLANE-HLINE 10px lane-width bug: verified NOT a `LoopTranslate`/
  connector-drawing defect; root cause not isolated to a `file:line`
  within this task's time budget. Follow-on.
- `FtileWhile$ConnectionBackBackward1/2` cross-lane "draw nothing":
  verified correct-as-is against the current 125-row corpus (zero
  affected rows); a real architectural gap (no "draws nothing"
  sentinel) but zero-weight today. Follow-on, not fixed.
- XLANE mixed rows (kijazo/nikivo/ruzica residual): multi-mechanism,
  only the if-with-links slice was this task's scope; the rest is
  unclaimed.
- Two `swimlane-baseline.json` census-pin drifts (luxido, ruzica), both
  verified-correct (now exactly match the jar's own pin), left for
  orchestrator re-pin per the re-pin tool's own "orchestrator-only"
  rule and this task's ban on editing `oracle/goldens/**`.

## Quality gates

`npx tsc --noEmit` (both `tsconfig.json`/`tsconfig.node.json`): clean
after every commit. `npx eslint` on every changed file: clean. Targeted
vitest after each commit:
`tests/oracle/svg-conformance/activity.golden.ratchet.test.ts`
(224 pins, byte-equal both times),
`tests/oracle/svg-conformance/activity.harness-parity.test.ts` (green
both times), `tests/oracle/svg-conformance/activity.swimlane-baseline
.test.ts` (2 expected census-drift failures, both verified-correct,
see above). Full `tests/diagrams/activity tests/unit/activity`
(92 files / 1868 tests) green after commit 2. No Serena MCP tools used
(Read/Edit/Write/Bash only, per the hard rule — this task's own brief
prohibits Serena in this worktree). One accidental
`mcp__serena__replace_symbol_body` call was made early on; it failed
immediately with "no symbol found" (Serena resolves the MAIN checkout,
not this worktree) and made no edit — the same edit was then applied
correctly via the `Edit` tool.
