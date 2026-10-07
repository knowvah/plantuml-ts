# add3-T3d — NOTE-CREOLE, EMPTY_DIAMOND shape, ALIGN-DIAMOND

## Commits (branch `add3/T3d`, on top of the merged `feat/activity-divergence-drive-3`)

1. `a114163d6` feat(add3-T3d): route note text through the real creole Sheet
2. `94a30670e` fix(add3-T3d): draw EMPTY_DIAMOND as a rhombus, not a hexagon
3. `73eb246f7` fix(add3-T3d): per-line centre/right a diamond's multiline label

Merge `8a68ee62c`: `feat/activity-divergence-drive-3` into `add3/T3d` (T3a/T3b/T3e/T3g),
done between commit 1 and commit 2 per the coordinator's mid-mission instruction. No conflicts.

## Java → ours

**NOTE-CREOLE** (commit 1):
- `FtileWithNoteOpale.java:147-150` / `FtileNoteAlone.java:114-117`
  (`skinParam.sheet(fc, align, CreoleMode.FULL).createSheet(note.getDisplay())`
  → `SheetBlock1` only, Opale draws the fold/border separately) →
  `activity-creole-sheet.ts#buildNoteTextBlock`/`renderNoteLabel`/
  `noteTextBlockDimension`, `tiles/gtile-note.ts#measureOpaleCreole`.
- `activityNoteHorizontalAlignment` (`activity-text-style.ts`) ports
  `SkinParam#getHorizontalAlignment(noteTextAlignment, null, false, null)`
  (`skin/SkinParam.java:671-727`): `note`-bucket override, else the same
  `root`-tier `defaultTextAlignment` action text already reads.
- `SheetBlock1`'s own `padding` ctor arg stays `none()` for notes (NOT
  `activityPadding('note')`, unlike the action-text precedent) — Java's
  `skinParam().getPadding()` there is the GLOBAL top-level `padding` key
  (`SkinParam.java:1147-1150`), always unset in this corpus, a DIFFERENT
  field from the per-element `style.getPadding()` the action box's own
  outer add uses. Verified against the pinned NOTEW family's own formula
  (no third padding term beyond Opale's marginX1/X2/Y).
- `CommandNote3.java:122`'s `Display.getWithNewlines` unescapes a
  one-line note's own `\n`/`\t`/`\\` — `node-dispatch.ts#tryNoteSingle`
  never applied `unescapeLabelNewlines` (write-set exception, flagged;
  same helper if/fork/repeat labels already use).
- `utils/CharHidder.java#hide`/`unhide` (called from
  `StripeSimple.java:150` and `AtomText.java:79`) escapes/restores a
  `~X` tilde-markup-escape around the creole tokenizer pass — this
  port's own `CharHidder` class existed but neither `StripeSimple.ts
  #buildLineAtoms`/`decodeAtomEscapes` nor `CreoleParser.ts
  #buildTextStripes`/`decodeTextAtoms` called it (`src/core/**`, rule
  11 survey below).
- `measureIfOwnNote`/`measureOpaleText` (IFNOTE, `gtile-with-notes.ts`
  NOTE-MULTI) deliberately left on the OLD raw path: both share
  `renderNote`'s drawing with `GtileNote`, and `gtile-with-notes.ts`'s
  own constructor chain is threaded a bare `fontSize: number` by
  `layout/tile-layout-structural.ts` (outside this task's write-set) —
  upgrading only one half would size/draw mismatch (the exact class of
  bug `isActionSheetEligible`'s own doc reports for EMBED).
  `renderNoteLabel`'s own geometric eligibility check (recomputes the
  creole box, falls back to the old renderer on a mismatch) means this
  is safe to leave for that file's own owner, not a blocker here.

**EMPTY_DIAMOND shape** (commit 2):
- `FtileDiamond#drawU` (`vertical/FtileDiamond.java:85`) draws
  `Hexagon.asPolygon(shadowing)` — the NO-width/height overload
  (`Hexagon.java:46-62`): a fixed 24x24 FOUR-point rhombus, not the
  six-point dented hexagon the width/height overload draws (used by
  `FtileDiamondInside`/`renderHexagonPolygon`). `renderNode`'s
  `'if-split'`/`'repeat-cond'`/`'while-header'` cases had no
  `emptyDiamond` arm at all (add3-T3a's own "Not done" item 2,
  outside T3a's write-set). `renderDiamond` already ports this exact
  rhombus. Gated additionally on `node.label === ''`
  (`gtile-diamond-empty.ts`'s own invariant) because
  `conditional-builder.ts#buildIfWithLinks` hardcodes
  `GtileDiamondInside` regardless of `conditionStyle` (T3a's "Not
  done" item 1, `layout/**`, not this task's write-set) — one of its
  `'if-split'` nodes under `emptyDiamond` carries the real hexagon-
  sized condition text and must keep drawing the hexagon its box was
  sized for.

**ALIGN-DIAMOND** (commit 3):
- `ConditionalBuilder#getShape1` (`vcompact/cond/ConditionalBuilder
  .java:240-243`) builds the condition label through the real Sheet
  with `styleDiamond.getHorizontalAlignment()` — `SheetBlock1
  #initMap`'s own per-line `getCoef` post-pass
  (`klimt/creole/SheetBlock1.java:155-172`: CENTER `diff/2`, RIGHT
  `diff`, LEFT/null `0`) reaches a multi-line diamond label under
  `defaultTextAlignment center`/`right`. `renderHexagonMultilineLabel`
  drew every physical line at the SAME `x` (the LEFT/`coef=0`
  reduction of the formula) — fixed by computing each line's own
  `diff` against the shared `maxWidth` and offsetting by
  `activityHorizontalAlignment(theme)`'s coefficient.

## Rows (probe)

| slug | before | after | mechanism |
|---|---|---|---|
| digexe-63-zifu774 | 184 | **0** | NOTE-CREOLE |
| jageti-56-kume076 | 83 | **1** | NOTE-CREOLE |
| nuzugu-44-pega793 | 81 | **0** | NOTE-CREOLE |
| vimoxa-78-zucu656 | 39 | **0** | NOTE-CREOLE (CharHidder tilde escape) |
| pifoni-76-duxa505 | 100 | **5** | bonus — shares `\n`-unescape fix, not assigned |
| reluvi-59-pifi444 | 1 | **0** | EMPTY_DIAMOND shape |
| tepivu-88-reze603 | 1 | **0** | EMPTY_DIAMOND shape |
| vamazo-19-tufu812 | 2 | **0** | EMPTY_DIAMOND shape |
| mabuke-20-muco282 | 3 | **0** | ALIGN-DIAMOND |
| copisa-69-xisi273 | 2 | **0** | ALIGN-DIAMOND |
| zejuso-92-kexo870 | 148 | 148 | not reached — see "Not done" |
| letuke-04-poza319 | 138 | 138 | not reached — see "Not done" |
| bigide-91-bise382 | 35 | 35 | verified unchanged — see "Not done" |
| nesozi-09-zezu092 | 20 | 20 | diagnosed, not fixed — see "Not done" |
| tobajo-64-mipi810 | 552 | 552 | formatter sub-issue diagnosed, not a formatter bug — see "Not done" |
| xefalo-73-sabi101 | 279 (pre-existing, T3a's own) | 291 | comparator artifact, not a regression — see below |

"before" for the first 10 rows is the branch-head measurement at session start
(commit `a3a329812`, Σ 9220/76 rows). The merge of `feat/activity-divergence-
drive-3` (T3a/T3b/T3e/T3g) landed between commits 1 and 2, moving the corpus
baseline to Σ 7679 independent of this task; `xefalo`'s "before" above is
that merge's own value (T3a's own report already names it as a documented,
unfixed residual — see below for this task's own, separate interaction with it).

## Probe Σ per commit (76-row baseline)

| after | Σ | risers |
|---|---|---|
| commit 1 (a114163d6) | 8739 | 0 |
| merge (8a68ee62c) | 7679 | 0 (pre-existing from T3a/b/e/g, not mine) |
| commit 2 (94a30670e) | 7682 | 0 |
| commit 3 (73eb246f7, final) | 7682 | 0 |

Net this task: baseline-before (9220, pre-merge) minus this session's own
mechanisms = −481 (commit 1) before the merge; post-merge the corpus moved to
7679 from sibling tasks, and this task's own commits 2+3 net **+3** (five
rows improved by −9 total; `xefalo` moved +12, a comparator artifact, not a
real regression — see below). 0 unexplained risers at every step (the
probe's own gate, against the pinned `diff-baseline.json` manifest).

## Risers

None, at every commit, per the probe's own riser list (against the pinned
baseline manifest). One sub-threshold score MOVEMENT worth stating explicitly
since I caused it and it is not in that list only because `xefalo` is not
pinned:

- `xefalo-73-sabi101`: isolated to commit 2 alone (measured by temporarily
  reverting only `activity-renderer-shapes.ts` against the post-merge
  state) — 279 → 291 (+12). Mechanism: 3 of its 6 `if`s are `with-links`
  (`conditional-builder.ts#buildIfWithLinks`, hardcoded `GtileDiamondInside`
  regardless of `conditionStyle` — T3a's "Not done" item 1, confirmed by
  reading the Java jar SVG directly: ALL 10 of this fixture's small diamonds
  are 5-point rhombi, `points="167.988,364.833,179.988,376.833,167.988,388.833,
  155.988,376.833,167.988,364.833"`, matching `Hexagon.asPolygon(shadowing)`'s
  fixed-size shape even for the with-links ones — upstream's `FtileIfWithLinks`
  diamond1 DOES honour `conditionStyle`, confirming item 1 is a real,
  separate gap, not a jar-side exception). My own fix correctly leaves those
  3 drawing as hexagons (gated on `node.label === ''`, which is non-empty
  for them) — `--align` confirms element counts and positional pairing are
  EXACT both before and after (41 polygon/44 line/25 text/10 rect, 120/120
  aligned). The +12 is `compareSvg`'s own documented non-monotonic
  diff-count behaviour under a correct shape change for the OTHER 3
  diamonds (`.agent-notes/comparesvg-count-not-monotonic.md`), not a
  structural regression — ruled out via the element census above, not
  guessed.

## Census movers (`activity.{style,text,swimlane}-baseline.test.ts`, EQUALITY pins)

Re-pin needed from the orchestrator (rule 5). Movers attributable to THIS
task (all deliberate, all now draw MORE real elements matching the jar's own
per-atom SVG structure — never fewer, never dropping information):

- `digexe-63-zifu774`, `jageti-56-kume076`, `nuzugu-44-pega793`,
  `vimoxa-78-zucu656`, `pifoni-76-duxa505` (text + style census; commit 1 —
  more `<text>` runs per creole-parsed note line, matching the jar).
- `reluvi-59-pifi444`, `tepivu-88-reze603`, `vamazo-19-tufu812`,
  `xefalo-73-sabi101` (style census; commit 2 — these were ALREADY the
  5 documented movers in `add3-T3a`'s own final report, re-confirmed here,
  not newly caused by this task).

Every OTHER failure in the current `style`/`text`/`swimlane`-baseline run
(`demibe-40-moda439`, `giteso-65-mefo026`, `mojezi-43-gamu360`,
`nikivo-06-kaxa873`, `nipuxu-11-tefa314`, `pateca-54-lija084`,
`rekuxa-78-lidi292`, `rujixe-89-sumo552`, `ruzazu-94-meso880`,
`sojono-24-tufe806`, `vilecu-41-tete416`, `zaloze-31-jibo311`) comes from
the merged-in `T3a`/`T3b`/`T3e`/`T3g` work, already reported in their own
`.agent-notes/add3-T3{a,b,e,g}.md` — not touched or caused by this task.

## Engine survey (rule 11)

Commit 1 touched `src/core/klimt/creole/legacy/{StripeSimple,CreoleParser}.ts`.
Full 28-engine survey, sequential, foreground (per the coordinator's
correction — an earlier background attempt stalled and was redone):
`before/` from a disposable `git worktree add <tmp> a3a329812` (the commit
before this task's edits, with gitignored deps symlinked in — removed after
use via `git worktree remove`); `after/` from this worktree post-commit.
`engdiff.py before after`:

```
activity digexe-63-zifu774: ('diverged', True) -> ('conformant', True)
activity jageti-56-kume076: ('diverged', True) -> ('structural-match', True)
activity nuzugu-44-pega793: ('diverged', True) -> ('conformant', True)
activity vimoxa-78-zucu656: ('diverged', True) -> ('conformant', True)
timing <9 fixtures>: ('timeout', False) -> ('diverged', True)
unknown xidaxi-41-niti333: ('diverged', True) -> ('structural-match', True)
movers=14 conformant-losses=0
```

Zero conformant losses. The `timing` moves are `timeout` -> `diverged`
(never `conformant`/`structural-match` either side) — a flaky-timing
artifact (`.agent-notes/confounded-wall-clock-readings.md`), not caused by
this commit: `timing` fixtures render no activity/creole content at all.
Commits 2 and 3 touched no `src/core/**` file — no survey required for
either.

## Quality gates

`tsc --noEmit` (both tsconfigs): clean at every commit.
`npx eslint <every changed file>`: clean at every commit.
`npx vitest run tests/oracle/svg-conformance/activity.golden.ratchet.test.ts
tests/oracle/svg-conformance/activity.harness-parity.test.ts`: 337/337 green
at every commit (pins byte-equal).
`npx vitest run tests/unit/activity`: 579/579 green (final state).
`npx vitest run tests/unit/core/klimt/creole/legacy/{StripeSimple,
CreoleParser}.test.ts`: 68/68 green (commit 1).

## Not done — residuals, with mechanism (no guessing)

1. **CREOLE-ACT (`zejuso-92-kexo870` 148, `letuke-04-poza319` 138) — not
   reached.** Both rows' own residual is a `legend` block
   (`zejuso`)/table-grid path (`letuke`), per the prior pass's own
   finding (`.agent-notes/add3-T2b.md`) — neither is a note/empty-diamond/
   align-diamond mechanism this task's write-set covers; not
   investigated further this pass given the remaining budget went to
   the gates-retirement and ALIGN-DIAMOND work explicitly named ahead
   of them in the brief's "largest first" ordering by mechanism family,
   not by raw score.

2. **Gates retirement (task 2's full scope) — PARTIAL.** Landed: the
   EMPTY_DIAMOND shape arm (above). NOT landed: the `UHorizontalLine`
   SVG driver (`AbstractUGraphicHorizontalLine`/`UGraphicStencil`,
   `klimt/drawing/UGraphicStencil.java`) and the `[[url]]` hyperlink-
   theme threading into `activitySkinSimple` — deprioritized once
   `bigide-91-bise382` (STRIPE) was confirmed ALREADY byte-correct via
   the pre-existing per-line `drawHorizontalRule` fallback (verified
   below), making the driver port a pure code-structure win with zero
   remaining score, and `isActionSheetEligible`'s 3 blockers (non-LEFT
   alignment, HR, `[[url]]`) therefore NOT retired (no cohort row needs
   it after EMPTY_DIAMOND/ALIGN-DIAMOND land) — a real, bounded follow-on,
   not attempted this pass given the time spent on nesozi/tobajo's
   diagnosis below.

3. **STRIPE (`bigide-91-bise382`, Σ35) — VERIFIED, not changed.**
   `--align`/`--dump` against the real jar SVG: every element differs
   from the jar by EXACTLY `+0.5` on `x` (ellipse/rect/text/line/
   polygon alike, e.g. ours `86.288` vs jar `85.788`), except the
   FIRST text element (`x=20`, exact match both sides). This is the
   SAME pre-existing, unrelated global offset two prior passes already
   documented (`.agent-notes/add3-T2b.md`: "present since the very
   first before.json measurement") — confirmed again here, origin not
   re-traced (a `layout/**`-level box-width/dot-engine rounding
   question, outside this task's write-set and this fixture's own
   STRIPE mechanism, which the prior pass already fully fixed).

4. **SLURL-LINK (`nesozi-09-zezu092`, Σ20) — diagnosed, deliberately
   NOT fixed.** `--align` shows ours draws 20 elements vs the jar's 21
   — missing exactly one `<text>`. Root cause, verified against the
   jar's own golden SVG byte-for-byte (`grep` on the raw file, not a
   guess): the lane title `[[www.plantuml.com First actor]]` does
   **not** draw as a real hyperlink at all in the jar (`fill="#000"`,
   no `<a>`/`xlink:href` — unlike the SAME fixture's `:[[url]];` action
   text, which DOES get an `<a>` wrapper) — so this row's own
   `skinparam hyperlinkColor black`/`hyperlinkUnderline false` govern
   the ACTION text path only (already correct), not the swimlane
   title; "thread hyperlink colour into the activity `ISkinSimple`" is
   the WRONG framing for this row specifically. The REAL gap: the jar
   draws the lane title's `[[url label]]` token as its own atom, and
   the LITERAL space immediately following the closing `]]` (from the
   source's own `|[[... ]] |`) as a SEPARATE plain-text atom — TWO
   `<text>` elements, confirmed against the golden
   (`<text>First actor</text><text> </text><text>Other actors</text>`).
   I built and then **reverted** a render-side fix
   (`activity-renderer-swimlanes.ts#titleSegments`, splitting a lane
   title at `[[...]]` boundaries) once direct instrumentation showed
   it has ZERO effect: `node-dispatch.ts#trySwimlane`'s own
   `m[2]!.trim()` already strips that trailing space from `lane.name`
   before any renderer ever sees it, so the atom-boundary data the
   split needs is already gone by the time it reaches my write-set.
   `CommandSwimlane.java`'s own regex has no trim at all, but a SECOND
   fixture (`pezubu-98-niba240`, `| 1 |`/`| 2 |`/`|3|`) shows the jar's
   own lane title for THAT shape renders as plain `"1"`/`"2"`/`"3"`
   with NO extra surrounding space — meaning the real upstream rule is
   narrower than "the whole captured swimlane name is never trimmed"
   (otherwise pezubu's jar SVG would show `" 1 "`, which it does not).
   I did not trace which Java method narrows it (most likely something
   inside the creole Sheet's own per-physical-line handling that trims
   ordinary leading/trailing whitespace but not a run immediately
   following a link atom's close) within this pass's remaining budget,
   and I did not ship the untested `titleSegments` split as dead code
   per `testing.md` (no fixture currently exercises it). Not fitted;
   not guessed; reported for the next pass with the exact file/line to
   start from (`node-dispatch.ts#trySwimlane`'s `.trim()` call) and the
   exact counter-example (`pezubu`) any fix must not regress.

5. **tobajo-64-mipi810 formatter sub-issue — diagnosed as NOT a
   formatter bug.** The brief's own framing ("find our two number
   formatters... port the jar's rounding where they differ") does not
   hold up against the code: `core/svg-shapes.ts#rect` and
   `klimt/drawing/svg/svg-graphics-elements.ts#text` (via
   `svg-graphics-core.ts#format`) both call the SAME hoisted
   `svg-format.ts#formatDecimal`/`javaFixedN` — confirmed by reading
   both call chains, not assumed. Instrumented (temporarily, reverted
   after measuring) the raw pre-format `x` values at tobajo's own
   rect/text draw calls: rect's raw `x` is
   `71.387500000000002842` (the IEEE754 double for the literal
   `71.3875`, landing ABOVE the exact `.3875` cutoff — `javaFixedN`
   correctly rounds this UP to `.388`, matching what Java's own
   `%.3f` would ALSO do for this identical double); the adjacent
   text's raw `x` is `81.387499999999988631` (BELOW the cutoff,
   correctly rounding DOWN to `.387`). Both formatters are faithful and
   mutually consistent; the jar's own `.387` for BOTH elements means
   its OWN internal arithmetic must produce a double on the
   "round-down" side for the rect coordinate too — a genuine
   floating-point ACCUMULATION-ORDER difference in whatever `layout/**`
   formula computes this specific IFNOTE box's `x` (not this task's
   write-set, and part of the much larger 552-point IFNOTE row owned
   elsewhere per the batch table). Nudging that arithmetic to flip the
   rounding boundary would be fitting a value to one fixture, forbidden
   by CLAUDE.md — not attempted. No `src/core/svg*.ts`/klimt-driver
   edit was made or is warranted by this finding.

## Write-set discipline

Touched: `activity-creole-sheet.ts`, `activity-text-style.ts`,
`tiles/gtile-note.ts`, `activity-renderer-shapes.ts`,
`activity-renderer-if-shapes.ts` (all named in the write-set);
`activity-renderer-note-shapes.ts` (NEW sibling file, pure mechanical
extraction of 5 note-polygon helper functions out of
`activity-renderer-shapes.ts` to stay under the 500-line hook cap — zero
behavior change); `src/core/klimt/creole/legacy/{StripeSimple,
CreoleParser}.ts` ("named core klimt/svg files (survey-guarded)", rule
11 survey above). `tests/unit/activity/parser-ubrr-t10.test.ts` (one
test's own expectation updated to the new, correct `\n`-unescape
behaviour — the test's title/intent, the trailing-`;` literal check,
is unchanged).

**Write-set exception (flagged, not hidden), same precedent as add3-T2b's
harness-file touch**: `src/diagrams/activity/node-dispatch.ts`
(`tryNoteSingle`, one line: `unescapeLabelNewlines(...)` added) — the
ONLY place `CommandNote3.java:122`'s `Display.getWithNewlines` escape
could be fixed; required by 2 of this task's 4 named rows
(`digexe`/`jageti`); mechanically identical to the SAME helper already
used for if/elseif/fork/repeat labels in that file. No other
`node-dispatch.ts` line touched.

NOT touched, explicitly out of scope per the brief's own boundary
(`layout/**`): `layout/tile-layout-structural.ts`, `layout/conditional-
builder.ts`, `layout/walk-if-with-links.ts`, `tiles/gtile-with-notes.ts`
— all read during diagnosis, none written. `tiles/gtile-diamond*.ts`,
`tiles/gtile-switch*.ts`, `tiles/gtile-while.ts`, `tiles/gtile-repeat.ts`
— named as not-mine, not touched. No Serena MCP call made (rule 1,
re-verified by re-reading the rules file after the coordinator's
resume message). No `git stash` used. The merge used `git merge
--no-edit feat/activity-divergence-drive-3` (fast, clean, no conflicts),
per the coordinator's explicit "merge, no rebase" instruction. The
disposable `git worktree add` used for the rule-11 "before" survey was
removed via `git worktree remove` once the survey completed, per the
coordinator's instruction.
