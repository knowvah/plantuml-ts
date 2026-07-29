# Decision Journal

Append one row per non-trivial judgement call. "Non-trivial" = a
reasonable engineer might have chosen differently.

| # | Task | Decision | Why | Evidence (jar probe / file:line) |
|---|------|----------|-----|----------------------------------|

## Phase 8 pre-flight — 2026-07-28

Everything below was MEASURED on `main` @ 4e78b72, not carried over from
the previous session's reports.

| Check | Result |
|---|---|
| npm test | 398 files / 10380 tests passed |
| typecheck / lint / build | clean |
| `measure-description-size-deltas.ts` | 311/351 (88.6%), widened 0 |
| `measure-class-size-deltas.ts` | 219/708, widened 0 |
| `dot-sync-report.ts component usecase class` | 262 / 90 / 708, 100% EQUAL |
| oracle jar | runs |
| branch `feat/description-leaf-sizing-audit` | absent |
| write-set paths | all present |
| per-task Given/When/Then | 5 each across T1–T5 |
| per-task observability + rollback | present on all five |

**Decision — added `Bash(java *:*)` to `.claude/settings.autonomous.json`.**
The shared template does not allow `java`, and the jar probe is the
acceptance oracle for every task in this mission; without it an autonomous
run would either block on permission or, worse, fall back to inferring
constants — the precise failure ADR-5 and the method constraints exist to
prevent. The file is gitignored, so this is local-only.

**Decision — batches 4 and 5 ship as TEMPLATES, not enumerated tasks.**
A survey cannot name its findings in advance. Batch 4's tasks are derived
from T2's MISMATCH rows and T3/T4's GAP rows; batch 5 is gated on ADR-2's
two counting conditions. Writing speculative task names now would be the
same error as trusting a bucket label.

**Note for the executor.** The brief is committed to `plans/`, deviating
from the plan-mission skill's instruction to gitignore it. This repo tracks
mission briefs deliberately — ledgers and decision journals are cited from
commit messages, and `planning/mission-index.md` links them.

## Batch 1 launched — 2026-07-28

Branch `feat/description-leaf-sizing-audit` cut from `main` @ `a7191a6`
(brief pushed). T1/T2/T3 dispatched in parallel — disjoint write-sets
(`scripts/measure-description-size-deltas.ts` + its test /
`planning/usymbol-composition.md` / `planning/sizer-renderer-parity.md`),
no inter-task dependencies.

**Model routing.** T1 → Sonnet (`typescript-pro`): mechanical regex-table
repair with an exact acceptance oracle. T2/T3 → inherited model
(`general-purpose`): reading upstream Java correctly IS the mission, and a
misread row would propagate into every Batch-4 task derived from it. Per
`parallelism.md` the default is Sonnet for implementation; the exception is
taken deliberately for the two audits, not by omission.

**All three prompts forbid state-mutating git.** The three agents share one
worktree; the orchestrator commits after the batch. This is a standing
hazard in this repo, not a per-task precaution.

**ADR-5's `planning/mission-guide.md` pointer is the ORCHESTRATOR's, not a
task's.** Both audits would otherwise want to write it — one shared file
between two parallel agents is precisely the write-conflict
`parallelism.md` forbids. It lands with the batch commit, once the tables
exist and the pointer can name what is actually in them.

## T1 complete — 2026-07-28

`causes` 40 → 40 (labels only, as required): container-cluster 12→11,
other 10→7, **element-font 1→5**. `conformant` 311/351 and `widened` 0
both unmoved, re-verified by the orchestrator rather than taken from the
agent's report. All four gates green (10384 tests, +4).

Two structural changes, not four cosmetic ones:

1. The `element-font` regex required `skinparam` ADJACENT to the Font-word,
   so it matched exactly one of the three spellings that occur in the
   fixtures. Block form (`skinparam node { StereotypeFontSize 20 }`) and
   `<style>` selectors (`component { FontSize 19 }`) both missed.
2. `element-font` now runs BEFORE `container-cluster`. A `<style>`/skinparam
   selector for a container keyword is byte-identical to a real cluster
   opener, so the font signal was unconditionally shadowed. This is the
   mechanism behind the S1L-h bucket reading 2 when it was 9 — it was an
   ORDERING bug, not only a pattern bug, which the brief did not identify.

Reclassified, each verified by the orchestrator against the fixture source:
loroto-06 (nested `<style> node { stereotype { FontSize 20 } }`) from
container-cluster; revusu-28, tijexo-10, toxine-81 from `other` (they
previously matched nothing at all).

**The brief carried one stale premise, and T1 was right to reject it.**
Its context listed the sprite regex's missing `/` as a defect to repair;
`git show HEAD:scripts/measure-description-size-deltas.ts` shows the
pattern already reads `<\$[\w/-]+>` with a comment stating why it must.
S1L-f fixed it last session. Verified before accepting the correction —
`<$archimate/interface>` → `sprite` today. No action; recording it because
the brief is a durable artifact and the claim was mine.

The 7 residual `other` fixtures were left labelled `other` deliberately:
no ledger root cause and no regex-detectable signal. Inventing a pattern to
make the bucket look resolved is the exact failure T1 exists to fix.

## T3 complete — 2026-07-28

`planning/sizer-renderer-parity.md`: 20 rows — 5 `threaded` / 6 `GAP` /
9 `size-neutral`. Four verdicts jar-proven, not inferred.

**The audit found a variant the mission's own framing missed.** The brief
described the class as "the setting never REACHES the sizer." Two of the
six GAPs are the opposite: the setting reaches `BoxSizingOpts` and is then
never USED.

- `wrapWidth` and `guillemet` are threaded, but `measureTextBlock` has
  exactly ONE caller — `leaf-sizing.ts:311`, inside `measureBox`.
  `measureNote`, `measureSimpleSymbol`, `measureActor`, `measureUsecase`
  and `measureFolderLeaf` never route through it. Orchestrator-verified by
  grep + function-boundary check. So S1L-d fixed the generic box path and
  left five sibling paths measuring unwrapped text; the renderer applies
  `wrapWidth` symbol-agnostically at `renderer-entity.ts:218`.
- `inkSprites` is threaded through `ClassifyCtx` → `BoxSizingOpts` and read
  NOWHERE. Four grep hits in `src/`, all declaration or assignment
  (orchestrator-verified). `measureUsecase` fits its footprint from
  declared-dimension `sprites`, so S1L-k's ink-bounds intent is inert on
  that path.

This matters beyond bookkeeping: **a reachability guard cannot see either
of them.** It sharpens ADR-3's known limit rather than contradicting it.

**ADR-3's limit is now quantified: 1 of 4.** Only per-element `FontSize`
was resolver-shaped; `wrapWidth` was a plain field read, and the creole
lexer and use-case fit were algorithm divergences with no setting at all.
T3 recommends naming T5's guard "resolver-reachability" and putting the
1-of-4 figure in its assertion message. Accepted — a guard advertised as
proof of parity would be worse than no guard.

**`BoxSizingOpts` is NOT the only sizer channel.** `fixCircleLabelOverlapping`
reaches the sizer via `runLayout` (`layout.ts:473`). T5 must not assume one
channel or it will emit false positives.

Unknown unknowns worth keeping (none change a verdict):
`src/core/usymbol-shapes.ts:73-156` holds 10 more `resolveElementPaint`
call sites outside every read-set glob — colour-only, but a renderer
surface this audit's scope did not name. `skinparam actorStyle` has NO
`Theme` field; both paths independently hardcode `STICKMAN`, so they cannot
drift — an unimplemented feature, not a parity defect, and flagged so T5
does not allow-list it as settled. `skinparam roundCorner` is parsed into
the accumulator but never surfaced; size-neutral since the radius is drawn
inside the bbox.

## T2 complete — 2026-07-28

`planning/usymbol-composition.md`: 36 rows — 28 `match`, 6 `MISMATCH`,
2 `untested` (GROUP/PARTITION are `USymbolFrame` variants built only by
`CommandPartition3`, never a description leaf).

MISMATCHes: HEXAGON (width DOUBLES — `full.width * 2`), PERSON (head is
`sqrt(surface)*0.42`, area-derived), USECASE_BUSINESS (`withMargin(tmp,7,0)`
BEFORE the fit, so it changes alpha and refits — +19.8, not +14),
ACTOR_AWESOME (55×61) and ACTOR_HOLLOW (26×33) vs our hardcoded stickman
27×60, ARCHIMATE (absent from `KEYWORD_SYMBOL_ENTRIES`, so the line never
becomes a leaf at all). Each carries a jar probe.

**6 composition kinds counted — ADR-2's Batch-5 gate (≥4) is MET on the
first condition.** K5 (width-doubling) and K6 (area-derived head) are
structurally inexpressible as a `(marginH, marginV)` pair, the same class of
error as folder's width floor.

**T2's headline claim was WRONG and is corrected in the artifact.** It
reported "nothing outside `src/core/decoration/symbol/` imports any of it."
`grep -rn "^import.*decoration/symbol" src` refutes that: the RENDERER
imports the ported classes throughout — `EntityImageDescription.ts:90-93`,
`EntityImageDescriptionSupport.ts:49-51`, `PackageStyle.ts:25-32`,
`ClusterDecoration.ts:29-30`, `Cluster.ts:115`, `renderer-symbol.ts:14,16`,
plus the svek shapes.

The correction makes the finding STRONGER, not weaker. What is true is that
`leaf-sizing{,-consts,-text,-folder}.ts` import ZERO of it — they cite the
classes in JSDoc and re-derive the geometry as flat tables. So this is the
same lock-step gap T3 documents for individual settings, at the scale of the
whole symbol model — which is why it yielded six MISMATCHes at once rather
than one. Spot-verified that the port really does carry the missing
mechanisms: `USymbolHexagon.ts:102` has the `* 2`, `USymbolPerson.ts:51` has
`Math.sqrt(surface) * 0.42`.

**Consequence for Batch 4 — flagged, not decided.** Routing `measureLeafNode`
through the ported classes is upstream's own boundary
(`EntityImageDescription` → `symbol.asSmall(...)`) and would close all six
at once, versus patching three more table entries. CLAUDE.md's "upstream
architecture is authoritative" points the same way. Blocker to size first:
the measurer seam — the ported classes take a `StringBounder`, the sizer a
`StringMeasurer`. This also overlaps ADR-2's Batch 5; if the routing lands,
Batch 5's descriptor refactor may be moot. Decide when Batch 4 is built.

**Also resolved by T2, no longer a residual:** `FOLDER_SHOWN_TITLE_EXTRA_WIDTH
= 12` was shipped last session as "measured, documented as such." It is
`BodyEnhanced1.getMarginX()` = 6 applied via
`BodyEnhancedAbstract.decorate`'s `withMargin(block, 6, 0)` = +12 width. It
hits `name` only because `name` alone routes `create2`→`BodyEnhanced1`, while
`desc` routes `create3`→`BodyEnhanced2` whose `getMarginX()` is 0 — which is
exactly why a `folder` label takes no allowance and a `package` title does.
An untraced constant is now traced; comment chore for Batch 4.

**Open probe for Batch 4:** whether `Footprint` collects the marged block's
right-hand padding as ink for usecase-business. The closed form matched the
probe to 0.01px, but our port fits REAL points via `footprintBoxes`, so
confirm the padded box reaches the point set before assuming the closed form
transfers.

## Batch 1 closed — orchestrator actions

`planning/mission-guide.md` gained the ADR-5 pointer to both tables, framing
its own 14pt/12pt files-diagram bug as an instance of the class rather than a
one-off. Held back from both tasks deliberately: one shared file between two
parallel agents is the write-conflict `parallelism.md` forbids.

### Unplanned dividend — T1 also repaired CLASS triage

`scripts/measure-class-size-deltas.ts:33,37` imports `detectCause` from the
description script, so the pattern repair applied to the class ratchet at no
extra cost. Class buckets: element-font **10 → 32**, container-cluster
92 → 81, other 323 → 314, interface-shield 33 → 31. `conformant` stays
219/708 and `widened` stays 0 — labels only, as required.

That is 22 additional class fixtures now identified as per-element font,
which is direct input to **A2s** (class record-node sizing, 489
non-conformant). Nobody planned this; it is a consequence of the two scripts
sharing one classifier. Worth remembering: repairing shared instrumentation
pays out in every engine that imports it.

## Batch 2 — T4 RESCOPED before dispatch, 2026-07-28

T3 overtook most of T4, and one of T4's three premises was mine and wrong.
Verified against the code before rescoping rather than dispatching an agent
to rediscover it.

- Groups 1 and 2 (`resolveElementShadowing`, `resolveElementLineThickness`)
  are DONE — T3 jar-proved both, numbers in the Proofs section. Re-probing
  would have burned an agent to confirm what is already written down.
- Group 3's premise is FALSE. The brief said `HeaderFont`,
  `HeaderBackground`, `Background` and `BucketSelector` are "referenced by
  NO module at all," so each must be dead code or an unwired feature. All
  four are live with real call sites — `renderer-classifier-rows.ts:149`,
  `renderer-classifier-box.ts:257`, `renderer-classifier-colors.ts:124`,
  `style-map-element.ts:96`. They read 0/0 during planning because that
  grep was scoped to DESCRIPTION modules; these are CLASS-engine resolvers.
  The disposition T4 was written to make does not exist. T3 had already
  classified all four `size-neutral` with written reasons.

**That is the second mission-authored premise falsified by execution** (the
first was T1's sprite regex). Both came from greps scoped narrowly during
planning. Recording the pattern, not just the instances: a grep used to
SIZE work must be scoped to the whole tree, or its zero results will be
mistaken for absence. CLAUDE.md already warns about this for
`net/sourceforge/plantuml/` vs `net/`; it applies to our own tree too.

Rescoped T4 to what is genuinely unanswered — the two verdicts T3 marked
inferred rather than proven, plus two collisions between the tables and the
unmet ledger criterion:

1. `guillemet` — GAP by inference only; prove or disprove by probe.
2. `inkSprites` — dead by grep, not by dimension; show the ink-vs-declared
   difference is real, using `<$bi-globe>` (inks 16×13.846 from a declared
   16×16).
3. `skinparam actorStyle` — T3 found no `Theme` field and both paths
   hardcoding STICKMAN; T2 independently found ACTOR_AWESOME/ACTOR_HOLLOW
   MISMATCHes. Same feature from two directions. Batch 4 needs to know
   whether it is one fix or two.
4. T2's open question — whether `Footprint` collects the marged block's
   right-hand padding for USECASE_BUSINESS. Blocks a Batch-4 row: T2's
   closed form matched to 0.01px, but our port fits REAL points.
5. The ledger entry, an unmet T4 acceptance criterion.

Single agent, as the batch overview already required: all five items
contend for `planning/sizer-renderer-parity.md`.

## T4 complete — 2026-07-28

Both inferred verdicts are now measured, and TWO changed. Totals coincide
(5 threaded / 6 GAP / 9 size-neutral) but membership swapped; the required-16
subset moved 5/7 → 4/8. T4 stated that in the Counts block so nobody reads
the unchanged totals as "nothing happened".

**`guillemet` — GAP upheld, promoted inferred → measured on both sides.**
Jar moves +0.240625in (+17.325px) for `«zz»` → `<<zz>>`. `component`
(via `measureBox`) tracks exactly; `entity` (via `measureSimpleSymbol`) is
flat. Exactly the five-path split T3 predicted, now with numbers.

**`inkSprites` — verdict CHANGED, GAP → size-neutral. This corrects T3's
consequence, and the summary I gave the user.** T3's grep was right that
the `inkSprites` FIELD is unread; its inference that S1L-k's ink-bounds
intent is therefore inert was wrong. Orchestrator-verified: sprite ink IS
consumed by the sizer — `inlineFootprintBox` (`leaf-sizing-text.ts:355-370`)
reads `inkX/inkY/inkWidth/inkHeight` off the `sprites` lookup built by
`spriteDimsLookupFor` (`sprite-commands.ts:94`). Probed with two sprites of
identical 40×40 declaration and ink 40×10 vs 40×40: jar and port agree
exactly on both usecase and rectangle. So the Batch-4 item is DELETE THE
DEAD FIELD, not fix a sizing gap.

Generalizable: "field X is unread" and "feature X is unimplemented" are
different claims, and the second does not follow from the first when a
second channel already carries the value.

**`actorStyle` — verdict CHANGED, size-neutral → GAP (fidelity), and it is
TWO fixes, not one.** Jar: awesome 0.763889×1.041667, hollow
0.444792×0.652778, against our stickman 0.444792×1.027778 for all three —
reproducing T2's ACTOR_AWESOME/ACTOR_HOLLOW numbers exactly, so the two
Batch-1 findings are one defect seen from two directions. The hoped-for
cheap fix ("wire `actorStyle` to the ported classes") is unavailable:
`src/core/skin/` holds only `ActorStickMan.ts`/`ActorStyle.ts`, and
`actorStyleGetTextBlock` throws for AWESOME/HOLLOW by deferral. So Batch 4
needs (a) port `ActorAwesome`/`ActorHollow` geometry AND (b) add the
`Theme`/skinparam accessor that does not exist. (b) alone changes nothing;
(a) alone is unreachable. Sequenced, not parallel.

**USECASE_BUSINESS — the closed form transfers, but not for free.** The pad
is NOT ink: `TextBlockMarged.drawU` (`TextBlockMarged.java:80-88`) draws
`UEmpty.create(dim)` at the full marged dimension and
`Footprint$MyUGraphic.drawEmpty` (`Footprint.java:163-166`) collects its
corners, while `drawText` contributes only the UText's own width. Our
`footprintBoxes` has NO `UEmpty` concept. Driven directly: widening the text
width alone gives 62.071×23.056 (wrong); adding the marged block's own box
gives 71.089×25.799 = the jar exactly. **Batch 4 must emit the marged
block's box or it lands 9.0px w / 2.7px h off** — precisely the
plausible-but-wrong outcome T2's open question was raised to prevent.

**Open, and worth probing before that Batch-4 row closes:** the same
`UEmpty` rule should apply to the stereotype block's `withMargin(…,1,0)`
(`EntityImageDescription.java:198-201`), but that is reasoned, not measured.
mopimi-10 and lunexo-59 are conformant today, so either the +2 does not
dominate the fit or it is masked. Probe a stereotyped use-case with a SHORT
label, where 2px would bite.

Ledger: 12 numbered lines (6 GAPs + 6 MISMATCHes) under a new
`## description-leaf-sizing-audit — carried findings (T4)` section, plus the
two corrected verdicts and the M-note-1 carry, so all of it survives the
mission.

## Batch 3 launched — T5 amended before dispatch, 2026-07-28

T5's spec was written before Batches 1–2 ran; three findings changed its
design, so it was amended rather than dispatched as written.

**1. A naive guard is RED FROM BIRTH, and that is a trap.**
`resolveElementShadowing` and `resolveElementLineThickness` are both proven
GAPs, both exactly the shape "renderer-referenced, sizer-unreferenced", and
both unfixed until Batch 4. A test that simply fails on that shape fails
immediately, and the obvious pressure is to allow-list them as
size-neutral — which relabels a known defect as a non-defect and LOSES it.
So T5 now ships two lists with different meanings: `SIZE_NEUTRAL` (with the
reason copied verbatim from the table row) and `KNOWN_GAPS` (ledgered,
expected until its Batch-4 task lands). `KNOWN_GAPS` is a shrink-only
ratchet mirroring `size-backlog.json`: it may not grow, entries are deleted
in the same commit as their fix, and moving an entry from `KNOWN_GAPS` to
`SIZE_NEUTRAL` to quiet a failure is called out in a comment as the
forbidden move — because it is the obvious one under time pressure.

**2. The allow-list seed MOVED, and the totals hid it.**
T4 left the counts at 5/6/9 while swapping membership: `actorStyle`
size-neutral → GAP, `inkSprites` GAP → size-neutral. T5 is instructed to
seed from the table as it stands, never from a summary. Allow-listing a row
that is now a GAP would encode the exact defect the guard exists to catch —
and reading a stale summary is how that would have happened.

**3. Reachability is not use.** T4 proved `inkSprites` reached
`BoxSizingOpts` and was read nowhere while its feature was already carried
by another channel. If T5 cannot cheaply distinguish assigned from read, the
doc comment must say a threaded-but-unread value passes — so nobody mistakes
green for wired.

Also carried in: name it `resolver-reachability`, not "parity" (T3), with
the 1-of-4 figure in the ASSERTION MESSAGE rather than only the doc comment;
and `BoxSizingOpts` is not the only sizer channel
(`fixCircleLabelOverlapping` arrives via `runLayout`), so a one-channel
assumption emits false positives.

**Red-phase evidence is a required deliverable, not a nicety.** This guard
exists because four defects passed code review; a guard that has never been
seen to fail is not known to work.

Routing: Sonnet (`typescript-pro`). One test file, an exactly-specified
contract, no upstream Java reading — the judgement was spent on the design
above, which is now written down rather than delegated.

## T5 complete — 2026-07-28. Mission's specified batches are done.

`tests/architecture/sizer-renderer-parity.test.ts`, 9 tests. Suite 398 →
399 files, 10384 → 10393 tests. All four gates green; all three ratchets
unmoved (description 311/351 widened 0, class 219/708 widened 0, DOT
262/90/708 EQUAL).

Classification came out smaller than expected and that is correct:
`SIZE_NEUTRAL` holds only `resolveElementPaint`, `KNOWN_GAPS` holds
`resolveElementShadowing` (covering both cascade tiers — one Batch-4 fix)
and `resolveElementLineThickness`. The other resolvers need no entry:
`resolveElementFontSize` is genuinely threaded via `layout.ts:432`,
`resolveElementMinimumWidth` is never renderer-referenced by design, and the
class-family resolvers are deliberately outside both globs.

**Red phase was exercised against the REAL gaps, not a synthetic dummy** —
stronger evidence than the spec asked for. Independently re-verified by the
orchestrator: removing `resolveElementShadowing` from `KNOWN_GAPS`
(syntactically cleanly — a first attempt by crude line-deletion produced a
transform error, which is a broken file, NOT a guard failure, and was
discarded as invalid evidence) makes the guard fail with

> resolver-reachability guard: resolveElementShadowing reaches a description
> renderer module and no description sizer module … only ONE (per-element
> FontSize) was resolver-shaped … Green here is not proof of parity. …
> NEVER move a KNOWN_GAPS entry into SIZE_NEUTRAL to quiet this failure.

The 1-of-4 figure and the forbidden move are in the ASSERTION, not just the
doc comment, as required.

**A false positive was fixed by tightening, not loosening** — the required
direction. A sizer glob of `leaf-sizing*.ts` alone flagged
`resolveElementFontSize` and `resolveElementMinimumWidth`, because their
call sites are in `layout.ts` (`ClassifyCtx.fontSizeFor`/`.minimumWidthFor`)
and `leaf-sizing.ts` only reads the derived `BoxSizingOpts` field. The glob
gained `layout.ts` rather than the pass condition being relaxed.

**Four things the guard cannot catch, stated in its own header** so green is
never mistaken for proof: non-resolver-shaped drift (3 of the 4 historical
instances); per-shape coverage inside an already-threaded resolver (the
`wrapWidth`/`guillemet` shape — threaded, but read by 1 of 6 paths); other
engines; and reachability vs actual use (the `inkSprites` precedent).

Batches 4 and 5 remain TEMPLATES by design and are unstarted. Batch 4's rows
are now fully determined: 6 MISMATCH + 6 GAP, minus `inkSprites` (dead-field
deletion, not a sizing fix), with `actorStyle` sequenced as two dependent
fixes and USECASE_BUSINESS blocked on emitting the marged block's `UEmpty`
box. Batch 5's ADR-2 gate is half-met — T2 counted 6 composition kinds
(≥4 ✓); the second condition, Batch 4 adding ≥2 new symbol tables, cannot be
evaluated until Batch 4 runs, and may be mooted if Batch 4 routes
`measureLeafNode` through the ported `decoration/symbol/` classes instead.

## T6 complete — 2026-07-28. ADR-6 half falsified; conformance 90.0%.

**311 → 316/351 (90.0%), widened 0, 5 pins deleted.** Orchestrator-verified
independently: 399 files / 10393 tests, typecheck + lint + build clean, DOT
262/90/708 EQUAL, class 219/708 widened 0. The IDE reported two type errors
in the new files; `npm run typecheck` is clean, so they were stale — the
standing rule that IDE diagnostics here are noise held again.

**The gain is real but it is not the predicted gain.** Two of six expected
wins closed: PERSON (jar-verified) and the `wrapWidth`/`guillemet` per-path
uniformity, which is where most of it came from — five of the five deleted
pins. HEXAGON, USECASE_BUSINESS, Shadowing and LineThickness are NOT
verified closed; no corpus fixture isolates them, so per ADR-4 they stay
filed with their probes rather than claimed. Resisting the claim matters more
than the number: four unverified wins reported as closed would have been a
plausible-but-wrong result that the next mission inherits.

**ADR-6's premise was half wrong, and this is the session's most useful
finding.** The two models are not faithful-vs-lossy; they are faithful in
DIFFERENT PLACES. Verified at `EntityImageDescription.ts:43`, which states
none of `BodyFactory`/`BodyEnhanced*` are ported — so the ported path has no
folder title margin, and T2 had already traced our flat table's +12 to
`BodyEnhanced1.getMarginX()`=6. Routing folder/package widened 8 fixtures.
Same shape for sprite ink offsets (no field on `AtomImageResolver`), the
`<img>` cannot-decode default font (no seam on `buildLine`), and our
deliberate `<latex>` divergence (the shared pipeline really renders KaTeX).

The ported classes hold SYMBOL-COMPOSITION facts read from Java; the flat
tables hold TEXT-BLOCK facts learned from fixtures — precisely the accreted
long tail `CLAUDE.md` names as the deliverable. Neither dominates, and
deleting either loses behaviour.

T6 narrowed the routing four times rather than forcing it, diagnosing each to
a mechanism at a `file:line` first and resolving it by NOT routing that case —
never by a fitted constant. That is the behaviour the brief asked for under
"if a pin widens": it found what the tables encoded and kept it.

**Plan changes recorded in the batch-4 overview:** T9's premise is void and it
is rescoped to delete only what T6 actually superseded plus the dead
`inkSprites` field; ADR-2 is live again rather than moot; and a new follow-on
is identified — port `BodyFactory`/`BodyEnhanced*` and add ink-offset and
default-font seams to the shared atom pipeline. That is the real ceiling on
widening the routing, and it is substantial and separable, so it becomes a
tracked mission rather than a Batch-4 patch. T7 and T8 are unaffected.

**Accepted write-set deviation:** `leaf-sizing-legacy-fallback.ts` is new and
undeclared. The 500-line cap made keeping the latex/img fallback beside the
routing impossible; it is a mechanical relocation of pre-existing
`measureBox`/`boxIcon` math. Flagged by the agent rather than absorbed
silently, which is the correct handling.

## T7 + T8 launched in parallel — 2026-07-28

Specs written at dispatch time (neither existed; only T6 was pre-specified,
since batch 4 was a template whose rows the audits had to determine first).
Disjoint write-sets, no dependency between them: T7 owns `src/core/skin/*`,
`theme.ts`, `skinparam.ts`, `leaf-sizing-consts.ts`, `renderer-symbol.ts`;
T8 owns `descriptive-keywords.ts`, `parser.ts`, and the ledger. Each prompt
names the other's files as off-limits, since they share one worktree.

**T7 preconditions verified before dispatch**, not assumed: `src/core/skin/`
holds only `ActorStickMan.ts` and `ActorStyle.ts`; `ActorStyle.ts:53` throws
for AWESOME/HOLLOW with a comment recording the deferral and its reason ("no
`actorStyle()` accessor at all… no caller anywhere"); all four upstream
`Actor*.java` sources exist. So the sequencing T4 derived holds — accessor
alone selects nothing, geometry alone is unreachable — and both halves ship
in one commit.

**T8 is bigger than its one-line title, and the spec says so.** Upstream has
THREE commands — `CommandArchimate`, `CommandArchimateMultilines`,
`CommandArchimatePackage`. The task implements the single-line form and is
instructed to FILE the others with a jar probe rather than half-implement
them (ADR-4). A half-implemented grammar is a silent divergence; a filed one
is a tracked finding.

Two criteria are flagged in the prompts as the ones most likely to catch a
mistake, so they are checked early rather than at the end: for T8, DOT
structure must stay 262/90/708 — a new keyword that moves existing structure
means the grammar is too greedy. For T7, both paths must read the SAME
accessor; a second independent read would recreate the exact
renderer/sizer divergence this mission exists to end.

Both prompts carry the upstream-grep warning (`net/`, not
`net/sourceforge/plantuml/`) — that scoping error has now falsified two
planning premises in this mission alone.

## T7 + T8 complete — 2026-07-29. Batch 4 at 317/351 (90.3%).

Orchestrator-verified independently: 400 files / 10419 tests, typecheck +
lint + build clean, description 317/351 widened 0 (improved 1), class
219/708 widened 0, DOT 262/90/708 EQUAL, resolver-reachability guard 9/9.

**T7 — actorStyle, and the single-accessor requirement held.** Geometry
verbatim from `ActorAwesome.java:50-55` and `ActorHollow.java:51-58`, the
default chain from `SkinParam.java:1209-1218`; jar-verified on all three
styles. Verified by the orchestrator rather than taken on report:
`resolveActorStyle` is defined once (`renderer-symbol.ts:35`) and consumed
at exactly three sites; the only remaining `STICKMAN` literal is the
default inside the accessor itself. Also confirmed the description actor
case routes to `measureEntityLeaf` (so the new geometry is actually
reached) and that `measureActor` survives only as the CLASS engine's
import — a legacy export, correctly documented as such.

It closed what T6 diagnosed: T6's own note had named mutere-78's residual
as "the unported ActorAwesome". That is the audit working as intended — a
filed, evidenced residual picked up by the next task instead of
rediscovered.

**T7 scope deviation, accepted.** The brief named `leaf-sizing-consts.ts`
and `renderer-symbol.ts` as "the hardcodes"; reading the code showed the
literal lines were in `leaf-sizing.ts:438` and `renderer-entity.ts:191`,
and closing the defect also needed the threading chain and the skinparam
accumulator/key-handler/theme-builder trio behind the `skinparam.ts`
facade. Deviation was reported, not absorbed. The brief's write-set was
wrong, not the agent — a write-set written from a grep rather than from
reading, which is the same root as this mission's two falsified premises.

It also declined to tighten revusu-28's pin, which shrank as a side effect
but stays non-conformant: tightening a still-failing pin is outside a
deletion-only write-set. Correct restraint.

**T8 — reproduced a bug before fixing it, which is why it found the real
one.** `archimate`'s mandatory `#color` PRECEDES code/display — the only
keyword where colour is required and leads. Routed through the generic
dispatch, that defeats `parseNameSection`'s `splitLeadingQuote` guard
(remainder starts `#`, not `"`), so a guillemet inside a quoted display is
read as a stereotype. **Fourth instance of the
decoration-extracted-from-inside-a-quoted-display class, via a fourth
distinct path.** Worth promoting from anecdote to expectation: any new
grammar whose prefix is not the quote must be checked against this.

Also found a genuine upstream inconsistency while reading the Java:
`CommandArchimateMultilines` creates its leaf with `USymbols.RECTANGLE`,
not `ARCHIMATE`, unlike its sibling command.

**Orchestrator correction to T8's ledger entry.** It filed the
`'rectangle'`-not-`'archimate'` SName mapping as "rendering-fidelity, not a
sizing gap." Traced and corrected: `layout-dot-tree.ts:180` passes
`ctx.fontSizeFor(node.symbol)` and `layout.ts:439` resolves that via
`resolveElementFontSize(theme, sname, …)`, so the sname IS the style bucket
— `<style> archimate { FontSize 20 }` moves the node in the jar and does
nothing here, and every sname-keyed resolver is affected, not just fonts.
Unmeasured, so still FILED per ADR-4 — but filed as a SIZING gap. T8's
substantive claims stood: geometry is byte-identical, and upstream's own
`fromString` genuinely does not resolve `archimate` either.

**Batch 4 status: T6/T7/T8 done, T9 remains** (rescoped — delete only what
T6 superseded plus the dead `inkSprites` field; NOT the tables, per the
ADR-6 amendment).

## T9 complete + BATCH 5 SKIPPED — 2026-07-29. Mission done.

**T9 was verified before it was executed, and that changed it.** Its original
scope ("delete the superseded tables") was already voided by the ADR-6
amendment, but rather than trust that, the orchestrator scanned every export
in `leaf-sizing-consts.ts` for references. **All 24 are still live** — T6's
routing covered only the box family, so folder, usecase, actor and note
still read the tables. Nothing there was superseded. (The first scan reported
every symbol dead; the glob had failed silently in zsh. Caught because
`LINE_HEIGHT_FACTOR` was visibly in use — a broken measurement that would
have deleted 24 live constants had it been trusted.)

So T9 collapsed to one genuinely dead chain: `inkSprites` on both structs,
its assignment, and `spriteInkDimsLookupFor` — whose only caller was that
dead assignment, and which is neither public API nor referenced by any test.
Small enough to do directly rather than delegate.

Safe to delete rather than wire up because T4 had already proved the feature
is delivered by a different channel: `inlineFootprintBox` reads the ink
fields off the `sprites` lookup. Deleting the redundant thread loses nothing.

### Batch 5 — SKIPPED, and by ADR-2's own terms rather than by default

ADR-2 gated its descriptor refactor on TWO conditions:

1. T2 finds ≥4 composition kinds — **MET** (6).
2. Batch 4 adds ≥2 new symbol tables — **NOT MET.** Batch 4 added **zero**
   and REMOVED one: `SIMPLE_SYMBOL_DRAWING` is gone, absorbed by T6's
   routing when control/entity/boundary moved to `measureEntityLeaf`. Net
   5 → 4 tables.

The pressure ADR-2 was written to relieve — tables proliferating as each new
MISMATCH got its own — never materialised, because routing reduced them
instead. **ADR-2 did its job by preventing a refactor, not by producing
one.** Designing the descriptor shape before counting the cases would have
been the error; the count came back saying don't.

This is recorded as a decision, not an omission. If a future task adds two
more per-symbol tables, ADR-2's gate reopens on its original terms.

### Mission close

All five batches resolved: 1–3 done, 4 done (T6–T9), 5 skipped on a met
gate condition. Description size-conformance **239/351 (68.1%) → 317/351
(90.3%)** across this session, zero widened at every step.

**The follow-on is the real ceiling and is NOT part of this mission:** port
`BodyFactory`/`BodyEnhanced*` and add ink-offset + default-font seams to the
shared atom pipeline. Until that lands, the routing cannot widen past the box
family — folder/package, use-case-with-sprites, and `<img>`/`<latex>` displays
all stay on their pre-T6 paths for reasons diagnosed and recorded, not
guessed.
