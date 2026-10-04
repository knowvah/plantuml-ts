# T3a — edge / canvas families (mission add2, batch 3)

## Commits (branch `add2/T3a`)

1. `9951a703a` — `fix(activity): normalise edge lines and emphasize anchor (B/C)`
   - `src/diagrams/activity/renderer.ts`
   - `src/diagrams/activity/activity-renderer-terminals.ts`
   - `src/diagrams/activity/layout/compress/compress-geometry.ts`
   - `src/diagrams/activity/activity-geometry.types.ts` (`emphasizeAt` only)
   - `tests/diagrams/activity/layout/compress/compress-geometry.test.ts`
   - `tests/unit/activity/renderer.test.ts`

2. `d4cc0a116` — `fix(activity): canvas ink for divider, split-bar, if-label, chrome (A/P/Q/E)`
   - `src/diagrams/activity/layout/canvas-origin.ts`
   - `src/diagrams/activity/layout/canvas-origin-text-ink.ts` (new — split out
     to keep `canvas-origin.ts` under the 500-line hook)
   - `src/diagrams/activity/layout/assign-coordinates-full.ts`
   - `src/diagrams/activity/activity-geometry.types.ts` (`rawWidth`/`rawHeight`)
   - `src/diagrams/activity/renderer.ts` (`preChromeDims` only)
   - `tests/diagrams/activity/layout/canvas-origin.test.ts` (new)

B and C are one commit, not two: both mechanisms live in the same
`renderEdgeSegments`/`renderEdge` lines (the emphasize-arrow branch and
its line draw are adjacent statements in the same loop iteration), so a
clean hunk-level split was not possible without hand-editing a patch.

## Java → ours (file:line)

| Family | Java | Ours |
|---|---|---|
| B/ORD | `UGraphicCompressOnXorY.java:142-146` (`drawLine` swaps `y1>y2`) | `activity-renderer-terminals.ts#orderedLine` (now exported, used by `renderer.ts#renderEdgeSegments` for every segment, not just the end-cross) |
| C/EMMID | `Worm.java:178-182` (mid-arrow anchored at the pre-compress midpoint, via `UTranslate((x2-x1)/2,(y2-y1)/2)`); `UGraphicCompressOnXorY.java:117-126` (`getTranslate` maps that one point through `ct()`) | `compress-geometry.ts#withEmphasizeAnchor` (computes it once, pre-X-pass) + `transformEdge` (carries `emphasizeAt` through both axes, mirroring `midArrowAt`); `renderer.ts#renderEdgeSegments` draws there when present |
| A | `LaneDivider.java:97` (`draw(ULine.vline(height))`); height `Swimlanes.java:422-423` | `canvas-origin-text-ink.ts#extendForLaneDivider`, called from `canvas-origin.ts#computeCanvasOrigin` with `baseY`/`contentMaxY` (= `bounds.maxY`, pre-shift) |
| P | `FtileThinSplit.java:88,95` (`ULine.hline`, `dy=0`); `height=1.5` field is layout-only, `:61,84` | `canvas-origin.ts#extendForNode`: `SPLIT_LINE_KINDS` (`split-bar`/`split-join-bar`) now contribute a single Y value, not `[y, y+height]` |
| Q | `klimt/drawing/LimitFinder.java:217-224` (`drawText`: far corner always `baseline+1.5`) | `canvas-origin-text-ink.ts#extendForIfLabelText` (per-line baseline via the same `TITLE_ASCENT_FRACTION` ratio `activity-renderer-if-shapes.ts#renderIfLabel` draws with) |
| E | `svek/DecorateEntityImage.java:144-150` (`getTextX` centres against the `Recentred`-only, pre-document-margin span); `Recentred.java:56` (`enlarge(15,15)`, i.e. `RECENTRED_ENLARGE`) | `canvas-origin.ts#computeCanvasOrigin` now returns `rawWidth`/`rawHeight` (`ink + RECENTRED_ENLARGE`, un-floored) → `ActivityGeometry.rawWidth`/`rawHeight` (threaded via `assign-coordinates-full.ts#assembleFromFinal`) → `renderer.ts#preChromeDims` reads it directly instead of reverse-subtracting a margin from the already-floored `totalWidth`/`totalHeight` |

## Probe Σ before/after

Baseline (branch head `9a6efd52a`, 253 rows): **Σ = 27577**.
After both commits: **Σ = 26805** (Δ **-772**).

66 rows reached **0** (eligible for pinning at close):
bazize-75-dedo568, becanu-19-diti597, begivo-34-sicu289, bideta-97-cezo697,
biguku-39-voxu233, bixefi-77-moki051, bizono-61-sasa740, boxoto-53-sifo232,
bumaca-51-kece901, caburo-70-buki284, cagoze-40-tete366, cifafo-49-jazi415,
cixave-47-milo698, cufega-65-beji958, dacuga-41-popo038, dixiku-28-guzo497,
doziki-93-rosi997, dupopo-44-deto131, felega-00-saxi785, firibi-00-puki721,
fivone-96-nalo453, foludi-80-gilo247, fomapa-90-bore251, gacaja-15-keko600,
gelono-70-zuce760, getene-72-dido571, gitoke-38-beme495, givanu-33-kire967,
guceja-66-tola192, gugala-11-suce270, jakuco-69-dari135, jamana-83-gige126,
kasadu-53-tuki533, katopo-68-xajo866, kudedo-31-pafi082, lacuci-13-nogo718,
livigo-47-negi605, mafete-03-rapa918, megara-21-rumi574, misiji-27-buje656,
movexa-27-rexe388, navene-45-cozo466, ninago-40-dalo726, noxasi-06-nejo322,
nusajo-97-bemo713, pakema-21-xema183, patagi-39-jone354, pedoco-30-mose082,
povoju-50-raxi136, pucinu-80-nopo009, pujozo-36-nino158, raruzu-62-giro837,
rerovo-62-nazo755, ribapo-84-xudu593, rosizo-69-mera514, secepo-00-febi326,
sikino-19-vuca111, sucice-41-pebi088, tamaxe-36-mono574, tefuga-86-xefe850,
vebala-15-tade547, vivate-04-guso306, xarumo-26-zinu467, xekame-27-geba281,
zaxati-90-xacu660, ziboco-73-kazu841.

139 other rows fell (partial credit — e.g. a cohort-b row combining C/B
with a still-open WORD/EMPHB/XLANE family owned by T3b/T3f). cifafo
(family E's own census row, "UNK: every element 0.35px right under a
TITLE") also reached 0 as a side effect of the family-E fix.

## Risers (2) — element-census-backed mechanism, neither is mine to fix

Both pre-date this task (already flagged as accepted D7 reveals from
mission `activity-divergence-drive-2` journal row 24, b1) and sit at
`status: "baseline"` with Σ in the hundreds/thousands — correctly
applying my Java-verified families to them exposes a SEPARATE,
already-catalogued, not-yet-fixed defect in a DIFFERENT task's
write-set:

- **jupoxe-15-sugo110**: baseline=1238, now=1242 (Δ+4). Element census
  (`activity-probe-elements.ts`): `delta: {polygon:1, line:1}` — the
  "extra line+arrow" class: a pre-existing phantom emphasize arrowhead
  on a while/repeat backward connector (EMPHB family, `FtileWhile.java:
  354`/`FtileRepeat.java:451-452`, owned by T3b's `walk-*-backward.ts`,
  outside this task's write-set). My family-C fix correctly repositions
  WHERE that already-wrong phantom arrow draws (`ct(pre-compress mid)`
  instead of a post-compress recompute); the phantom itself still
  shouldn't exist at all. Once T3b removes the spurious `emphasize`,
  this interaction disappears.

- **ruzica-16-deli877**: baseline=697, now=699 (Δ+2). Element census:
  `delta: {}` — element counts already EXACT vs the jar (D7's own 4th
  reveal class: "an element count now EQUAL to the jar's switching
  `compareSvg` from LCS to positional"). Full diff dump: every diff
  except 4 is a `polygon`/`line`/`rect`/`text` TAG mismatch at a fixed
  positional index (weight 14 or 17 each) — a pre-existing structural
  reorder (WORD/snake-merge chaos: text labels are visibly scrambled,
  e.g. `"while2"` where the jar has `"foo3"`), unrelated to my families
  and unchanged by this commit. The +2 itself is 4 new diffs at weight
  0.5 each: `svg/@height` 608 vs jar 607 (and the matching `@width`/
  `viewBox`). Mechanism: family A's divider ink reads `bounds.maxY`
  (this row's own, already WORD/snake-merge-scrambled layout) as the
  divider's bottom — correct per `LaneDivider.java:97`'s formula, but on
  this ALREADY heavily-diverged fixture `bounds.maxY` is not the value a
  correctly-ordered layout would produce, so the previously-coincidental
  607 match breaks by 1px. Verified this is not a bug in the family-A
  port itself: the SAME mechanism takes 30 cohort-a fixtures to their
  correct height (several to 0), and the tag-reorder weight signature
  (32×14 + 4×17) is byte-identical before/after my change.

Per the overview's acceptance ("0 unexplained risers — D7 reveal classes
allowed, each shown from the element census"), both are explained. I
cannot re-pin `oracle/goldens/svg-activity/diff-baseline.json` (hard
rule, orchestrator-only) — `activity.diff-baseline.ratchet.test.ts`
itself still fails on these 2 rows and needs a fresh-measurement re-pin
at close (same procedure journal row 24 already used for ruzica once).
Every other quality gate is green: `activity.golden.ratchet` (97 pinned,
byte-equal), `activity.harness-parity`, `tests/diagrams/activity`,
`tests/unit/activity`, `npm run typecheck` (both tsconfigs), `eslint`
on every touched file.

## Re-slots / not done

- Nothing re-slotted within the stated write-set. Family U (lapura,
  mechanism unknown) and every family outside C/A/B/P/Q/E were out of
  scope per the task spec and untouched.
- `canvas-origin.ts` would have crossed the 500-line hook with all four
  families inline; split `extendForIfLabelText`/`extendForLaneDivider`/
  `SPLIT_LINE_KINDS` into a new sibling `canvas-origin-text-ink.ts`
  (same "sibling module" convention the file's own history already used
  twice). Not pre-authorised in the task's write-set list but is the
  CLAUDE.md-sanctioned mechanism for a hook violation ("split helpers
  into new files"); flagging per the task's own "anything else: stop and
  report" instruction.
- Fixed two pre-existing stale doc comments in files I was already
  editing (1-3 line fixes, per pr-workflow.md): `compress-geometry.ts`'s
  module doc said "not yet wired to any call site" (it has been, since
  T5); `renderer.ts#preChromeDims`'s own doc cited the wrong padding
  constant in its own replacement text (caught before commit, not a
  separate violation left behind).

## Diagnosis notes (mechanism-first, per diagnosis.md)

- First implementation of family E's `rawWidth`/`rawHeight` reused
  `CANVAS_PADDING_TOTAL` (35) instead of `RECENTRED_ENLARGE` (15) and
  ALSO (bug, now fixed) accidentally fed that same wrong value into
  `totalWidth`/`totalHeight` themselves, regressing ~60 unrelated
  fixtures by 20px. Caught by re-running the targeted diff-baseline
  suite after each change (61 failures appeared, traced to the single
  shared-variable mistake in `computeCanvasOrigin`'s return statement,
  fixed by separating the two padding terms) — never left discovered-by-
  luck in a later gate.
- Confirmed `render-fixture-activity.ts`'s own doc comment ("NO POST-
  CHROME DOCUMENT-MARGIN RE-APPLICATION ... never sets preChromeWidth")
  is stale relative to current `renderer.ts` (T3j already always sets
  it) — did not edit that file (outside write-set), noting it here per
  memory.md instead.
