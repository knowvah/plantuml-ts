# Next Missions (in order)

> **Sequence engine, 2026-09-01:** see `planning/sequence-next-missions.md`
> for the post-`sequence-coordinate-convergence` analysis — freshly measured
> at `7fd45458`, and it argues for text-convention and element-deficit work
> BEFORE the Y axis despite Y being 63.9% of the remaining error.

**Refreshed 2026-08-17 (after SI26).** Treat this file as the *ordered, human-readable*
what-next; `planning/mission-index.md` is the executable grind queue with exit
bars and measurements, and `plans/<name>/README.md` is the brief for anything
with a name. **When they disagree, the brief and the tree win — verify before
repeating a status from here.**

This file has now gone stale twice in six weeks — the 2026-07-04 version listed
two shipped missions as "not started", and the 2026-08-15 version was out of
date within a day (both of its top two entries landed on main that same
evening). Verify against `git log` and the tree before acting on any line here.

Standing corpus signals, **measured at SI26's close-out 2026-08-17** on a clean
tree at `756ae57c` (not carried forward from a previous refresh):
`shape-match-report.ts` **785 doc-size-exact / 26,256 matched-shapes** of 1,074
fixtures. DOT EQUAL **class 705/711 · state 266/268 · component 259/263 ·
usecase 92/93 · object 78/80**. `label-size-backlog` totals **11** (class 5 ·
description 4 · state 2 · object 0 — untouched by SI25/SI26). svg-state ratchet
**60** pins; svg-class ratchet **314** pins (`ratchet.json` entries); **14,533**
tests across 595 files (+2 ratchet cases from the SI26 pins), coverage
95.37/90.36/96.93/96.47.

Two corrections to what this block used to say. The long-standing
"**25952 rigid-aligned shapes**" figure **matches no metric the report emits** —
the two it prints are `doc-size-exact` and `matched-shapes`. And the
"class DOT-parity 712/712 · state 268/268" line predated SI22's D7, which
re-baselined every count by asserting label BOX size; the numbers above are the
post-D7 measurements.

---

## `activity-oracle-harness` — DONE 2026-09-02, 8 of 8 (T0b added mid-mission)

Branch `feat/activity-oracle-harness`, 14 commits, all four gates green at
head. Activity was the **last engine still on the bare-`svgRoot` fallback**;
it now routes through `core/klimt/document-shell.ts` like class, state,
description, json and sequence. Full scored bar, retired premises and the
three flagged decisions in
`plans/activity-oracle-harness/README.md#close-out--2026-09-02`.

**Headline: Σ`weightedScore` over the 268 numerically-comparable fixtures
154722 → 108447, −29.9%. 268 fell, 0 rose, 0 held.** `diffCount` rose on 57
and fell on 211 — the D2 short-circuit artefact, predicted in advance.
Population 373 dispatcher-typed activity fixtures = **268 `baseline` + 82
`error` + 23 `jar-error`**. Routing re-pinned 3133/367/31 → **3401/99/31**
with non-activity **exactly** unchanged at 3133/17/8. Suite 682 files /
18198 tests, 70 s (load-confounded, see the brief).

**Three of the brief's own premises were measured false and retired** — the
uniform 12-diff floor (T2), "+2 extra `g` children on every fixture" (T4),
and the `g[1][childCount]` exit clause (D13). **T6 refused an orchestrator
instruction to re-pin all 350 misroutes and was right**: only 268 flip, the
other 82 misroute for a different mechanism. Read those rows before sizing
any of the follow-ons below; they are why the numbers here are the measured
ones and not the planned ones.

**Follow-ons, ordered by measured weight** (all from
`oracle/goldens/svg-activity/diff-census.json`, measured at `0cf15e23`):

1. **`activity-child-count-deficit` — 91.6% of ALL remaining weight.**
   `svg/g[][childCount]` carries **99321 of 108447** across **209 fixtures**.
   Direction post-T5: **190 fewer / 59 equal / 19 more**. This is **missing
   ink, not chrome** — our root group draws fewer children than the jar's,
   i.e. unported activity content. The delta histogram has a long negative
   tail (`-200`×1, `-81`×1, `-59`×1, … `-2`×20). A childCount mismatch
   short-circuits the whole subtree (`compare.ts:398-404` charges
   `sumUnits(actual) + sumUnits(expected)`), so closing this is worth more
   than **every other path family combined** — the next four together are
   under 4.2%. Highest-leverage activity work available; size it against
   `src/diagrams/activity/renderer.ts` and the ftile/gtile system before
   starting.

2. **`activity-parser-gaps` — the 82 `status:"error"` fixtures (D8).** Our
   parser emits a Syntax Error SVG where the jar renders; verified on a
   10-fixture sample, the jar rendered 9. **They are set-identical to the 82
   activity `known-misroute` entries in
   `oracle/goldens/svg-conformance/routing-baseline.json`** (proved by set
   equality at close-out, not by matching counts) — so fixing them closes
   the routing gate and the diff-baseline gate at once, and each fixture
   that stops erroring converts from `error` to a real number. They still
   route `ACTIVITY → NONE` after T5 for a *different* mechanism than the 268
   that T5 fixed: our parser refuses the source, so `renderSync` returns a
   `PSystemError` page carrying no root attribute at all, and the document
   shell cannot reach a document the activity renderer never draws. **The
   largest tracked queue in the activity engine by fixture count.**

3. **`activity-geometry-residual` — real layout divergence, both ways.**
   `svg/@width` 268 records, `svg/@height` 259, `svg/@viewBox[]` 527 (the
   same measurement reported twice — viewBox[2]/[3] are byte-identical to
   width/height on our side across all 268, verified). Direction: **width
   195 wider / 73 narrower**; **height 105 taller / 154 shorter / 9 equal**.
   **No constant margin explains it** — `numalo-91-pole243` is 52 wide
   against the jar's 64, `darote-51-kuta407` is 144 against 129. Only ~1%
   of residual weight, so it ranks *below* the child-count deficit despite
   touching every fixture; much of it is likely downstream of (1). Do not
   start here.

4. **Three single-fixture families, each with the mechanism already stated:**
   - **`levuma-67-cego489` — theme resolution.** `skinparam mode dark`
     resolves `theme.colors.background` to `#FFFFFF` here where the jar
     resolves `#1B1B1B`, so the root `style` carries the wrong colour and
     the background rect the jar paints under its own guard
     (`SvgGraphics.java:186-192`) is correctly declined on our resolved
     white. **The guard is faithful; its INPUT is wrong.** Exactly ONE
     fixture corpus-wide carries `skinparam mode dark`. *Correction worth
     not re-deriving:* `velodu-59-sada437` was named as a second instance
     and is **not** one — its golden is the jar's own `PSystemError` page,
     pinned `jar-error`, contributing no number; its black ground is the
     error page's, not a theme.
   - **`setecu-78-cuko533` — unported `skinparam preserveAspectRatio`.** The
     source sets `xMinYMid slice`; the jar emits it verbatim on the root, we
     emit the hardcoded default `none`. Not a missing attribute — the shell
     emits all 7 root attributes on all 268 fixtures — an unported skinparam
     surfacing as a root-attribute *value* diff.
   - **`dakesa-98-mano758` — gradient fill in `defs`.** The inverse of the
     pre-mission `defs` diff: **ours is empty (0), the jar's holds 1**. The
     jar expands `skinparam activity { BackgroundColor red-green }` into a
     `<linearGradient>` child of `defs`; we resolve no gradient.

**No `docs/graphviz-issues/` filing is owed, and no DOT-parity row exists.**
Verified 0 `svek-*.dot` across all 373 cached activity fixtures; upstream
`activitydiagram3` never uses dot (D9). `docs/parity-report.md` is
byte-identical to `main` and activity's row stays `not yet measured` —
`EXPECTED_TAG` (`scripts/dot-sync-report.ts:68-74`) has no `activity` key,
so `markdownRowForType` cannot produce a count for it whatever the cache
holds. **Do not add an activity DOT gate.**

---

## 1. `edge-label-box-followups` — DONE 2026-08-16 (mission-index SI24), 5 of 5

Executed the same day it was planned. Branch `feat/edge-label-box-followups`,
all four gates green at head; **merge with a merge commit** (per-task ids are
cited in its journal). Backlogs 22 → **11**, DOT EQUAL class 699 → **705**,
component 257 → **259**, usecase 89 → **92**, state/object held; zero fixtures
regressed, six improved. Full scored bar, residue table and corrections in
`plans/edge-label-box-followups/README.md#close-out-2026-08-16`.

**The brief was wrong once and under-read once, and both were caught by
reading the Java:** the quantifier strip is `CharHidder`'s creole escape
(`utils/CharHidder.java:59-90`), not `Display`'s visibility strip — same
number for `focaci`, wrong for `+`/`-`/`#` prefixes; and `hasSeveralGuideLines`
has four conditions, not two. Both recorded in the brief's `decisions.md`.

**Follow-ons it names:**

1. ~~**T4 step 3 — per-line magic-arrow SVG glyphs in class**~~ — **DONE
   2026-08-17 as `class-guide-line-glyphs` (mission-index SI25, 4 of 4).**
   Branch `feat/class-guide-line-glyphs`, merge with a merge commit.
   `gobuco`/`lapoma` draw four glyphs each (`EdgeGeo.labelLines[i].glyph`,
   D1); class main-label ink now follows `resolveArrowLabelFont(theme)` (D2),
   landing `ticuxa`'s `toto` and `camuna`'s `foo1`/`foo2` on jar's numbers.
   Full scored bar and follow-ons in
   `plans/class-guide-line-glyphs/README.md#close-out-2026-08-17`. It names
   in turn: description/state per-line glyphs; tail/head cardinality ink font
   vs the `theme.cardinalityFont*` DOT box; `class-ink-box.ts#addEdgeTextInk`'s
   constant-13 ascent; `lapoma` doc 70 vs 72; and it fixed a latent defect
   on the way (`magicArrowGlyphPoints` ink radius now `(int)(size*.80)` of the
   resolved font, `TextBlockArrow2.java:64-65` — `fix(T1)` `722c2bee`, flagged
   for review in its journal).
2. ~~**Arrow-label font COLOUR**~~ — **DONE 2026-08-17 as
   `arrow-label-font-colour` (mission-index SI26, 3 of 4 as written; clause 2
   not met literally and left so).** Branch `feat/arrow-label-font-colour`,
   merge with a merge commit. `resolveArrowLabelFont(theme).color` +
   `resolveCardinalityFontColor(theme)` (D2/D3/D5) drive class label/glyph/
   cardinality, description label and state transition ink; skinparam
   (`arrowFontColor`, `defaultFontColor`) and `<style>` (`arrow { FontColor }`,
   `arrow { cardinality { FontColor } }`) paths land in
   `colors.graph.arrowFontColor`/`theme.cardinalityFontColor`. **97 fixtures
   moved, all `<text fill>` only** — the 12 named plus `lurevi`/`banatu`/
   `golati`/`kokodo`/`koxeca` (in scope, uncensused) and **80 state fixtures
   whose transition labels went `#181818 → #000` = jar** (state was never
   byte-identical; the brief's premise was wrong). Full scored bar, moved
   table and named gaps in
   `plans/arrow-label-font-colour/README.md#close-out-2026-08-17`. It names in
   turn: per-tag arrow FontColor in three unported forms (skinparam
   `Color<<tag>> text:Red`; description `<style> arrow { .tag { FontColor } }`
   — description reads no `arrowTagCascade` at all; positional `<style>`
   blocks in description); `skin-loader.ts` expanding no `!define`
   (`reddress`); description quantifier labels never drawn; 236/266 component
   oracle SVGs of an older jar generation; `!theme` arrow FontColor
   unverified; and `fix(T1)` `756ae57c` (unresolvable colour tokens → unset,
   where the jar draws white — flagged for review).
3. **Note-on-link SVG note shape** (`svek/image/EntityImageNoteLink` draw) for
   class, state and description — D2's other mission. Description now draws
   the note *text* inside the merged box; class/state still drop it.
4. **`shared-seam-extraction`** (section 2 below) now has **four** Rose-note
   copies to collapse: `src/core/rose-note-dim.ts` (SI24 T3) +
   `state-dot-graph.ts:178`, `state-composite-edge-label.ts:49`,
   `class-note-link-box.ts:70`.
5. **Description `computeLinkDzeta`** flat-measures the main label where
   upstream eats the merged note+label block (`SvekEdge.java:1169-1171,
   1193-1194`) — inert on the corpus today (all four fixtures sit at the
   nodesep/ranksep floors); a real gap the moment one does not.
6. **`component/ruciga-77-ruja233`** fails `labelSizeOk`, is in no backlog and
   has no arrow-font override — pre-existing (verified at the pre-mission
   baseline). Shrink-only forbids adding it; diagnose it in the next
   edge-label mission.

**Still out of scope, each owned elsewhere (unchanged from SI23):** `xamule` and
`lurage` (creole `TextBlock`, Phase 4h); `xetase` (`EmbeddedDiagram`);
`nagega` (`!define`); `nuvake` (`NOTE_COLOR` regex); `tunelu`/`vonago`
(`AssociationClass` label route); `gevozu`/`sunuju` (`<latex>`); `kafexo`
(`maxMessageSize`); `berelu` (`**x**` creole, deltas do not fit the literal-`**`
story).

## ~~Unowned, and it is a live trap: `.claude/catalog.md` does not exist~~ — FIXED 2026-08-19

**Closed.** The rule now points at **`docs/catalog.md`**, which exists, is
committed, and is generated from `src/` by `scripts/generate-catalog.ts`
(`npm run catalog`). `tests/architecture/catalog.test.ts` fails if it drifts,
so it cannot quietly become the same stale premise a hand-written file would
have. 1009 modules, one row each: exported surface plus the first sentence of
the module's own header docblock (731 of 1009 have one; the rest show blank
rather than borrowing an unrelated symbol's comment, since a catalog that
misdescribes a module is worse than one that says nothing).

Scope, deliberately: it answers *does a module for X already exist?* — the
question SI31's T5 had to answer to obey "move the `simulateCompound` port,
never copy it". For *where is symbol Y defined*, Serena's `find_symbol` and
`ast-grep` are better and the rule now says so.

The pre-existing surface lists below were the stopgap while no catalog
existed; they are now redundant with the generated file but left as a record.
SI23's: `computeQuantifierBox`, `computeMergedLabelBox`, `applyVisibilityIcon`,
`applyGuillemet`, `parseMagicArrowLabel` (all `src/core/edge-label-box.ts`),
`computeCardinalityFontOverride` (`src/core/style-cascade-class.ts`),
`class-edge-label-lines.ts`, `scripts/label-box-triage.ts`. SI24's:
`roseNoteDim`, `resolveArrowLabelFont`, `computeArrowFontOverride`,
`hasSeveralGuideLines`, `measureLinkNoteDim`, `DescriptiveLink.linkNote`.

Note for anyone reading an older mission's task file: several closed briefs
still name `.claude/catalog.md` in their read-sets. Those are historical
records, deliberately not rewritten — the live pointer is `CLAUDE.md`'s.

## Done since the 2026-08-15 refresh

Verified against the tree 2026-08-16, not against these READMEs.

- **`edge-label-box-and-class-ports` (SI22) — CLOSED and merged.** Branch
  `feat/edge-label-box-closeout` is an ancestor of `main`; T8 pinned `sokevu`
  (`225107c0`), D7 landed (`d3ff29be`), T10 closed it (`77056cdf`). Scored
  honestly: clauses 3/4/5 met, 1/2 unmet and named. The `mission-index.md` row
  exists (SI22). Every "remaining work, all small" item the previous version of
  this file listed is done.
- **`leaf-draw-order` — MERGED** via PR #27 (`50c5f313`), not merely "ready to
  merge". Final `note-order-report --vs-jar`: same 719, order-only 6, other 77,
  err 0. The six order-only remainders are EDGE order, below.
- **`fix/description-size-gate-backlog` — MERGED** via PR #28 (`09c461e9`):
  size-delta gates now honour the label-size and direction backlogs.

Follow-on candidates surfaced by `leaf-draw-order` (not started):

- **Edge draw order** — the 6 fixtures above (bicabi-42, cobumi-83, gujigi-63,
  kevoda-64, momoba-92, tedeba-19) have byte-identical classifier/note order to
  jar but wrong `<g class="link">` order. Mechanism traced: jar's
  `CucaDiagramFileMakerSvek#getOrderedLinks` groups relationships sharing an
  entity pair adjacent (`Link#sameConnections`) BEFORE DOT emission, so a fix
  may touch `class-dot-graph.ts`'s emission order, not just `class-edge-geo.ts`'s
  draw order, and needs its own shape-match/dot-sync gate run.
  **`edge-label-box-backlog`'s M3 may hand its mechanism to this mission** — see
  that brief's D5.
- **OTHER=77 uid-set divergences** — a 5-fixture sample (begico-70, famizo-04,
  mocoda-55, sabaku-38, xakatu-11) all classify as uid-NUMBERING/phantom-slot
  -burn divergences (extra or missing `creationIndex` ticks), not sequence
  order. A separate mission from leaf order; needs a fuller survey before
  scoping.

## `note-leaf-model` — batches 1–2 DONE (merged to main), batch 3 retired into `leaf-draw-order`

2026-08-15: T1–T3 landed byte-identically (draw-time TIPS resolution;
`mapNoteGeos` reads no classifier) and merged to main via a merge commit
(`82bbdda3`). Batch 3 stopped before T4: the faithful fold (state's shape,
one creation-ordered collection) cannot be byte-identical because jar's leaf
document order is `bibliotekon` insertion order (packaged first, then
unpackaged, creation order within) and this port's declaration order +
host-interleave differed on 19 note fixtures (ORDER-ONLY) and on any
package/unpackaged mix. The fold was completed instead as `leaf-draw-order` (merged, above) —
this brief's own Batch 3 is retired, not pending. Details:
`plans/note-leaf-model/decision-journal.md` (Batch 3 rows) and the README's
session summary.

### Original entry

Brief: `plans/note-leaf-model/` (3 batches, 0 started; branch
`feat/note-leaf-model`). The class engine carries `NoteGeo[]` *parallel to*
`ClassifierGeo[]`; upstream has one entity collection and dispatches
`LeafType.NOTE` / `LeafType.TIPS` alongside every other leaf. State already has
the target shape and is the reference implementation. 96 references, 14 files,
all in `src/diagrams/class/`. **Moves no fixture by design** — every batch's
bar is byte-identical output (`shape-match-report` exactly unchanged, DOT
parity unmoved, all pins hold). Batch 2 (Opale resolution at draw time) is the
load-bearing one; if it cannot be done byte-identically, stop there with the
mechanism recorded rather than force batch 3.

## 2. `shared-seam-extraction` — DONE 2026-08-17 (mission-index SI27), 11 of 11

Planned and executed the same day. Branch `refactor/shared-seam-extraction`,
commits `28d18ee8` (T0) … `87bc23e6` (last debt retirement) + T10 close-out;
all four gates green at head; **merge with a merge commit** (per-task ids are
cited in `plans/shared-seam-extraction/decision-journal.md`). Scored bar,
numbers and flags in `plans/shared-seam-extraction/README.md#close-out-2026-08-17`.
Result: `src/core/**` imports nothing from `src/diagrams/**`; no engine imports
another except hcl/yaml → json; `tests/architecture/layering.test.ts` pins it
with an empty `KNOWN_DEBT`; ONE port each of `Display.getWithNewlines`,
`FrontierCalculator`, `measureLinkNoteDim`, `Command<S>` (state keeps its own
3-arg `execute`, upstream-faithful — flagged), `CommandCreateJson`/`JsonNode`,
the leaf-sizing family (`LeafSizingSubject`), `resolveBareOrBackColor`, the
USymbol/atom helpers. Output byte-identical on 2010 of 2014 corpus fixtures;
the 4 movers are T1's `\t` fix, jar-ward (`DIVERGENCES.md` "`\t` in labels").

**Follow-on queue it names (deferred families, verbatim from the brief — NOT
done here):** notes command family (`command/note/CommandFactoryNote*`),
remove/restore + hide/show (`classdiagram/command/CommandRemoveRestore`,
`CommandHideShow2`), DOT graph builders (`svek/DotStringFactory`),
`renderer-group` `<g>` wrappers, cluster header/levels (`svek/ClusterHeader`),
description JSON wiring (`CommandCreateJson` sink for description),
`LeafSizingSubject` → `abel/Entity` convergence (SI-1). Also surfaced:
`skinparam tabSize` tab-stop indentation; state-parser trailing-backslash line
continuation; `tests/architecture/sizer-renderer-parity.test.ts` glob scans
zero files after the leaf-sizing move.

<details><summary>Original brief-request text (2026-08-16), kept for the record</summary>


**Pull code that upstream puts in a shared package, and this port put in a
diagram engine, back into the shared area.** Queued by the maintainer during
`edge-label-box-backlog` execution, after T5 had to import *upward* from
`src/core/` into `src/diagrams/class/` to reuse a line splitter.

### The finding that named it

`Display.getWithNewlines` — one upstream method,
`klimt/creole/Display.java:410-420` — has **three independent ports here**:

| # | where | what it is |
|---|---|---|
| 1 | `src/core/klimt/creole/DisplayNewlines.ts:281` (`parseWithNewlines`) + `Display.ts:193-213` | the faithful port, in the faithful location, mirroring upstream's package |
| 2 | `src/diagrams/class/class-layout-edge-labels.ts:110` (`splitEdgeLabelLines` + `resolveLabelEscape:101`) | an independent re-derivation of the same escape scan, in a diagram engine |
| 3 | `src/core/edge-label-box.ts:35` (`splitCreoleLines`) | a third, simpler one — `split(/\\n|\n/)` |

T5 (`ca60cd0f`) then imported **#2** from `src/core/edge-label-box.ts`, because
#2 was the one the class engine already used. So `src/core/` now depends on
`src/diagrams/class/` to do something `src/core/klimt/creole/` already does
faithfully. That is the divergence, not the import.

### Why this is in scope, given "do not refactor while porting"

`CLAUDE.md` forbids refactoring *while porting* — that rule protects upstream's
design from being tidied away by a porter who thinks a branch looks redundant.
This mission is its complement, and the same paragraph authorises it:
**"Upstream architecture is authoritative — engine boundaries, dispatch, parser
seams. A structural divergence IS the bug: re-mirror rather than patch with
special cases."** Moving `Display`-derived code out of `diagrams/class/` and
into `core/klimt/creole/` *restores* upstream's package layout; it does not
impose a new one. Any move that cannot be justified by pointing at the upstream
package the code belongs in is out of scope for this mission.

### Measured starting state (2026-08-16, verify before trusting)

`src/core/` importing from `src/diagrams/` — 5 lines, 2 files:

- `src/core/edge-label-box.ts:23` → `../diagrams/class/class-layout-edge-labels.js`
  (the one above; the clear defect)
- `src/core/assemble-svg.ts:10-13` → `description/renderer`, `class/renderer-shell`,
  `state/renderer-shell`, `json/renderer-shell`
  (**probably legitimate** — a dispatcher naming its engines mirrors upstream's
  own `*DiagramFactory` dispatch. Confirm against upstream before touching it;
  it may be the one that should stay.)

Cross-engine `diagrams/X` → `diagrams/Y`:

- `class` → `description` ×7 — `leaf-sizing.js` (×4), `ast.js`,
  `renderer-symbol.js`, `render-atoms.js`. **The largest real candidate**:
  leaf sizing is `svek/image/EntityImage*` territory upstream, i.e. shared, not
  description-owned.
- `state` → `class` ×1 — `class-color-override.js`
- `hcl` → `json` ×5, `yaml` → `json` ×5 — **not violations.** `CLAUDE.md`'s
  layout-engine ruling records that `@starthcl`/`@startyaml` render *via*
  `JsonDiagram`; this mirrors upstream and stays.
- `activity` → `routing`, `tiles` — shared activity infrastructure, already
  siblings rather than an engine reaching into another engine. Check, don't
  assume.

### The template already exists

`src/core/edge-label-box.ts`'s own doc comment records the pattern: it was
relocated out of `diagrams/state/` in `edge-label-box-and-class-ports` T1, and
the move was proved safe by the state engine's DOT output staying
**byte-identical** across it. That is the exit bar for every move in this
mission — a pure move, evidenced, not a rewrite with a move inside it.

### Sketch of an exit bar (for `/plan-mission` to sharpen)

1. Every retained `src/core/` → `src/diagrams/` import is justified in writing
   against the upstream package that sanctions it, or removed.
2. `Display.getWithNewlines` has **one** port. Ports #2 and #3 above are
   retired into `core/klimt/creole/`, with their callers rewired.
3. DOT output byte-identical for every engine touched — that is what makes a
   move provably a move.
4. `shape-match-report`: no fixture rises. All four quality gates green.
5. A fitness function (`rules/architecture.md`) so the layering cannot silently
   re-invert: a test asserting no `src/core/**` file imports `src/diagrams/**`,
   with an explicit allowlist for whatever step 1 justified.

### Sizing caveat, honestly

The import counts are small (5 + 8 lines), but the *work* is not the imports —
it is proving each move is behaviour-preserving across engines whose DOT feeds
`@knowvah/dot-engine`. Item 2 alone means reconciling three escape scanners
that may not agree on edge cases (#3 handles a literal newline; #2 handles
alignment escapes; #1 handles tabs, guide lines and Jaws sentinels). **Their
disagreements are the mission's real content** — and any one of them may be a
latent bug in a caller today. Do not scope this by the import count.

</details>

## 3. `sequence-oracle-harness` — DONE 2026-08-20 (mission-index SI33), G-1 prerequisite

**The sequence-harness item is done.** `planning/sequence-deepdive.md`'s
Prerequisites section named the blocker for G-1 (Sequence Diagram Greenfield
Rebuild) precisely: sequence emits no DOT, so none of the state/class family's
`svek-N.dot` / `render-manifest` / `harness-diff` / `manifest-diff` gates
transfer, and a rebuild with no oracle is unscoreable. `plans/sequence-oracle-
harness/` (branch `feat/sequence-oracle-harness`, merge commit) built the
missing surface by **extending**, not replacing, the existing DOT-less
`svg-conformance` family that `json`/`yaml`/`hcl` already prove out (D1) —
`compare.ts`/`normalize.ts` consumed unchanged, no second comparator written.

**What it built, and what the rebuild now inherits:**
- **The gate**: `test-results/dot-cache/sequence/` — a committed, 1141-fixture
  jar-SVG oracle corpus, admitted by the jar's own `data-diagram-type=
  "SEQUENCE"` stamp (not the corpus classifier, which over-selects 3× —
  `populate-corpus.py:20`'s `sequence` pattern is a first-match `A -> B` rule
  that also claims usecase/class/state/timing fixtures containing a plain
  arrow; D3 was amended mid-mission to make the jar's own stamp the admission
  rule instead). One structurally unrepresentable fixture excluded
  (`xobebi-29-jilu859`, multi-page `newpage` — the single-`in.svg` cache slot
  cannot hold two pages; multi-page sequence has no oracle entry, a gap the
  rebuild inherits, not a defect this mission could close).
- **The baseline**: `oracle/goldens/svg-sequence/diff-baseline.json` — a
  monotone-improvement diff-count ratchet, pinned per fixture (1140
  measurable, 1 error), that FAILS on any rise. Its failure message names the
  mechanism behind the corpus's headline finding rather than just asserting a
  number: **1012 of 1140 fixtures (88.8%) sit at exactly 12 diffs because
  `compare.ts:353` stops recursing at the first structural mismatch
  (`svg/g[1][childCount]`), so the diagram BODY is never compared for 88.8%
  of the corpus.**

  **CORRECTION 2026-08-23** (re-measured on a clean tree at `fc499de2`; the
  original sentence is preserved below this file's amend-don't-rewrite
  convention). This bullet used to continue: "Closing that root-chrome gap
  will raise those 1012 counts together — the ratchet distinguishes that
  mass-rise signature (progress, re-pin deliberately) from an isolated rise
  (the regression it exists to catch)." **The premise is false.** The 12
  diffs, identical across three plateau fixtures spot-checked, are six absent
  root attributes + four root geometry values + `svg/defs[1][childCount]`
  (12 vs 0) + `svg/g[1][childCount]`. Closing the chrome half removes seven
  and drops the plateau to **~5**; it does not raise anything, because
  `svg/g[1][childCount]` (94 vs 630 on `SequenceArrows_0001_Test`) still
  short-circuits at the same `compare.ts:353`. Bodies become reachable when
  child counts MATCH — rebuild-scale work. The mass-rise signature the
  ratchet describes is real, but it belongs to whichever mission first makes
  bodies structurally correct, NOT to the chrome fix. Expect a mass FALL from
  the first sequence mission and re-pin for that.
- **The census**: `oracle/goldens/svg-sequence/diff-census.json` — every diff
  classified into six fixed, mechanically-derived buckets (`missing-element`
  873, `extra-element` 1317, `geometry` 5124, `text-metrics` 536,
  `format-units` 0, `other` 8636), computed by committed, unit-tested code —
  a ranked work queue, not 1140 opaque numbers.
- **The ranked bucket queue** the rebuild should work in order: (1) the
  `compare.ts:353` root-chrome short-circuit — six absent root SVG
  attributes, four root geometry values, two child counts. **Amended
  2026-08-23:** only the attributes and `defs[1][childCount]` are chrome and
  closable here; the four geometry values and `g[1][childCount]` are
  body-driven, so this item does NOT unblock body comparison (see the
  correction above). (2) `geometry` (5124, once bodies are
  reachable); (3) `other`'s two named components (6824 absent-attribute
  records, 1420 tag substitutions) rather than the bucket as a whole, which is
  honest-large by design (D5) and not a single fix target.
- **The golden ratchet** (`oracle/goldens/svg-sequence/ratchet.json`) ships
  empty — `{"fixtures": []}` — built and tested, admitting nothing; promotion
  is the rebuild's to earn, not this mission's to grant.

**Explicitly did not happen**: no rendering defect fixed, no fixture promoted,
zero `src/` lines touched — the port's measured divergences (including the
unitless-fractional-`width` normalization D1 names) are recorded, not
repaired. Full scoring, all numbers re-measured at close-out:
`plans/sequence-oracle-harness/README.md` "Close-out (2026-08-20)".

**Follow-ons.** ~~export `render-fixture.ts#fixtureIncludeStore` once~~ —
**DONE 2026-08-21, `62e6c1f7`.** Extracted to
`tests/oracle/svg-conformance/fixture-include-store.ts`; all four surfaces
(render-fixture, the cross-type census script, the diff-baseline ratchet, the
cause census) now import it. The copies had already drifted two ways — the
ratchet had no store at all, and the census's had gone eager while the rest
deferred the ~888 ms `assets/stdlib/` walk. Both properties are now pinned by
tests. No artifact moved: `diff-baseline.json` untouched, `diff-census.json`
regenerates to the same sha256 `9950e499`.

Then folded in too (`126d8bc8`): `render-manifest.ts`,
`shape-match-report.ts` and `note-order-report.ts` built the same shape
eagerly under the same local name. **Seven consumers now share one seam and
no local copy remains anywhere.** Verified rather than assumed, since two of
those scripts have no gate that would catch a silent change: `render-manifest`
regenerates all 3158 entries byte-identically (`manifest-diff.py`: 0
unexpected), and the other two produce identical report data (815 / 1089
lines). Their stack traces print 20 frames instead of 38 — jiti resolves the
upper frames differently once the import graph changes — but the underlying
warning fires 4 times in both.

**CLOSED 2026-08-21** (`stdlib-build-race` mission,
`plans/stdlib-build-race/README.md#close-out-2026-08-21`): the
`stdlib-remote-e2e.test.ts` 1-in-7 intermittent was diagnosed and fixed.
Mechanism: `freshGeneratedDir` (`scripts/build-stdlib-packages.ts:42-47`)
unconditionally `rmSync`s a fixed, repo-absolute, gitignored path with no
cross-process coordination; a second concurrently-running `vitest`
process's `globalSetup` could `rmSync`+rewrite that same path while the
first process's worker was mid-`import()` of it. Fixed by a content-hashed
up-to-date skip (never a count or mtime, D4) plus a cross-process lock
with dead-PID and corrupt-lock stale recovery, re-checked *inside* the
lock so the second holder skips instead of deleting (D3). Guarded repro
5/5 green this session (Durations 127.49/123.38/124.61/124.64/126.41s);
concurrent-builder and stale-recovery evidence in the mission close-out.
**Known remaining limit at the time — now CLOSED, see below:** if a second
run's source genuinely changes mid-run, it still rebuilds (and `rmSync`s)
once it holds the lock, while the first run's workers may still be
importing — the per-run isolated output directory that would close this
fully was explicitly declined by the user, citing two fixed-path imports
and packaging blast radius on `generated/` across every stdlib package's
`prepack`/imports. Should now be far rarer than the original 1-in-7 (needs
concurrency AND a straddling source change) but is not structurally
impossible; symptom would be the same `Cannot find module` signature or a
mismatched mid-rewrite import.

**CLOSED 2026-08-21** (`stdlib-run-isolation` mission,
`plans/stdlib-run-isolation/README.md#close-out-2026-08-21`): the "two
import sites" figure above was an under-count — an independent census
found **21 total consumers / 8 concurrent readers** of
`packages/<pkg>/generated/`, and `npm pack --dry-run`'s real-directory
resolution means the tree could only ever be *supplemented*, never
relocated, regardless of the count. Re-opened with that measurement, the
user chose **option D** — extend the existing build lock to cover all 8
in-worker readers (including the 2 `npm pack` tests A/B could not reach) —
over the ADR's own recommendation of a lock-scoped snapshot copy. Verified
end to end: T0's synthetic harness re-run showed `FAIL at attempt 2897`
unlocked vs. 500/500 clean with the lock held (17 measured lock waits);
two real concurrent full `npm test` runs straddling one genuine
`stdlib-tupadr3` rebuild produced zero `generated/`-tree failures in
either. Cost: suite ~7% slower, ~37 per-test timeouts raised to 120s (no
assertion weakened). No `src/` touched, no package publish surface
changed (`git diff --stat main..HEAD -- packages/` empty).

**Separate concurrency defect found while verifying the above — ROOT-CAUSED
AND FIXED 2026-08-21.** Closing the `generated/` residual did not make two
concurrent `npm test` runs safe. Two distinct blockers were found; one is
fixed, one is open.

**(a) `coverage/.tmp` shard race — FIXED.** Vitest derives its raw-coverage
scratch dir from `reportsDirectory`
(`coverage.DM_a_rWm.js:654-655`), `rm -rf`s it at run start (`:719-724`), and
names shards `coverage-${uniqueId++}.json` from a per-process counter
(`:740`). Two runs sharing `reportsDirectory` therefore both delete each
other's shards *and* collide on filenames. Vitest ships a dedicated error for
this exact case (`:729`) — it is a **documented usage constraint, not an
upstream defect**, so there is nothing to report upstream. Two failure modes,
not the one originally hypothesised: the reported `ENOENT`, and the worse
`SyntaxError: Unexpected non-whitespace character after JSON` from
interleaved writes to the same filename. Fixed by resolving
`coverage.reportsDirectory` through `tests/helpers/coverage-reports-directory.ts`:
off by default (ordinary runs and CI write to `coverage/` exactly as before,
thresholds unchanged), with `COVERAGE_ISOLATE=1` opting a run into
`<os-tmpdir>/plantuml-ts-coverage-<pid>`. Measured: 2 of 6 shared runs hit the
race, 0 of 6 isolated runs did. Full diagnosis in
`.agent-notes/coverage-tmp-race.md`.

**(b) stdlib build-lock timeout under two concurrent suites — CLOSED
2026-08-22** (`stdlib-lock-sharing` mission,
`plans/stdlib-lock-sharing/README.md#close-out-2026-08-22`, branch
`fix/stdlib-lock-sharing`). The target signature —

```
Error: Timed out after 30000ms waiting for the stdlib build lock at
  /var/folders/.../plantuml-ts-stdlib-build-<hash>.lock
```

thrown from `acquireBuildLock` (`scripts/build-stdlib-packages/build-lock.ts`)
— occurred **zero times across 16 post-fix process runs** (10 from the
mission's own trials, 6 from an independent controlled-load re-check), against
a pre-mission reference of 2 of 6 shared-coverage and 1 of 6 isolated runs
failing with that exact signature.

**What shipped, exactly as recommended below.** `acquireBuildLock` gained
`mode: 'shared' | 'exclusive'` (default `exclusive`, unchanged for the
builder); the 8 in-worker readers now acquire in `shared` mode and hold
concurrently; the builder still acquires `exclusive`, draining readers and
blocking new ones behind a writer-intent marker before it `rmSync`s the
tree — the exact safety property SI35's option D bought, preserved. Total
**waiting** collapsed from 319,190 ms to a re-measured range of
**3,737–49,804 ms across 5 concurrent-pair trials** (a ~13x spread; even the
worst trial is 84.4% below baseline, the median 92.8% below); max single-wait
fell from grazing the 30 s budget (29,500 ms) to a 785–12,818 ms range.
Full before/after table, all 5 trials, and the reader/exclusive design (D1–D4)
in the close-out linked above.

**What is NOT closed, named honestly rather than folded into "done".** A
second, unrelated failure mode was surfaced while re-measuring: vitest's
**default 5,000 ms per-test timeout** (no `testTimeout` override in
`vitest.config.ts`) on two pre-existing, CPU-bound tests
(`tests/architecture/catalog.test.ts:20`, `tests/unit/stdlib-packages.test.ts:
429`) fired in 4 of 5 trials. A controlled experiment separated cause from
load: at starting 1-minute load 4.37 and 28.15, 0 timeouts (4/4 processes
clean); at load 57.07, 2 of 2 processes hit the 5,000 ms default. **This
tracks machine load, not the lock redesign** — no lock-timeout signature
appeared in any of the failing runs — but the redesign's own mechanism
(removing `Atomics.wait` queueing so two suites' CPU-bound work now competes
instead of one sleeping behind the other's mutex) is a plausible contributor
under load, not disproven.

**Follow-on — CLOSED 2026-08-22** (`test-budget-invariant` mission,
`plans/test-budget-invariant/README.md#close-out-2026-08-22`, branch
`fix/test-budget-invariant`). The "either/or" framed above is resolved as
**both, differently, per test** — not a single choice:

- `tests/unit/stdlib-packages.test.ts:429` — **given an explicit, larger
  budget** (T1): `LOCK_PRESSURE_BUDGET_MS` (120,000 ms), the same named
  constant now shared by all 41 genuine lock-pressure call sites. This was
  the mission's root defect — an *omitted* per-test budget on a
  lock-holding test, not a load phenomenon — and closing it means the
  `:429` failure signature can no longer arise from that omission.
- `tests/architecture/catalog.test.ts:20` — **declined, deliberately, with
  a diagnosed operating limit** (T2/T4, `no-change`). `catalog.test.ts`
  holds no lock (0 references); its ~400–600 ms CPU-bound tree-walk-and-
  parse only trips the unconfigured 5,000 ms default under a narrow,
  timing-dependent collision between two `npm test` processes' own
  startup-fork CPU bursts — not a smooth function of aggregate load
  (sampled to load1 71.09, above this mission's own 57.07 failure point,
  without exceeding 1,544 ms). No number was set because no measured
  worst-case exists for the colliding case; setting one anyway would have
  been "raise it until green." Documented in place as a comment, not
  fixed — see `.agent-notes/tbi-T2.md` for the full diagnosis.

**The other half of this item — lowering SI35's ~37 per-test 120 s lock
timeouts — is corrected, not merely closed: do not do this.** The
"provably over-provisioned" framing above double-counted nothing and
omitted hold time. A lock-using test's budget must cover **wait + hold**:
`maxWaitMs` (30,000 ms) plus the max measured **hold** of 20,029 ms
(`.agent-notes/lsh-T4.md`) ≈ 50,000 ms legitimate worst case, so 120,000 ms
is ~2.4x margin, not the ~9x this entry claimed from wait alone. See the
correction inline in `plans/stdlib-lock-sharing/README.md`'s close-out and
`plans/test-budget-invariant/decisions.md` D3.

**(c) NEW, opened 2026-08-22 by `test-budget-invariant` T5 — a third test
racing the unconfigured 5,000 ms default.**
`tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:226`
(fixture `sequence/zudize-61-vomi445`) failed in **3 of 8** processes across
that mission's concurrency trials, always the same fixture:
```
sequence/zudize-61-vomi445: diff count never rises above its baseline (12)
Error: Test timed out in 5000ms.
```
It holds no lock and declares no per-test timeout, so it inherits vitest's
unconfigured default across 1,141 per-fixture `it()` blocks — structurally
the same class D5 named for `catalog.test.ts`, but at a file that mission
never scoped. **DIAGNOSED AND FIXED 2026-08-23** (`.agent-notes/ratchet-zudize-timeout.md`;
fix keyed on golden size, `LARGE_GOLDEN_BYTES`/`LARGE_GOLDEN_BUDGET_MS`).
Closed — kept here for the reasoning. T5's guess that this is "the same class as `catalog.test.ts`"
is **wrong**, and the difference decides the fix. `zudize-61-vomi445` is the
only fixture in the 1,141-case corpus with a large *stable* cost — ~650 ms
every call (`read~8 render~232 cmp~407`), against a next-slowest real
fixture of ~16 ms. `nereka-67-deco609`, which *reports* slower in vitest
(1,178 ms), measures 2-4 ms steady state; its number is one-time warmup
landing on whichever fixture renders first. That is why the failure always
names this one fixture.

It degrades **super-linearly with concurrent worker count**, and that IS
reproducible: 682 ms at 1 copy → 1,374 ms at 12 → **3,711 ms at 22**, where
CPU share alone predicts 1.83x. Two full suites put exactly 22 forks on 12
cores. Aggregate load is ruled out (a single copy at load1 32.7 measured
1.0x). Unlike `catalog.test.ts` — which ended `no-change` because no
measured worst case existed — **this one has one**, so a budget derived from
3,711 ms is derived, not fitted. Apply it to this fixture's case only, never
to all 1,141 (D4's argument, at file scope).

The cheaper lead was priced and **does not exist**: the 8.26 MB golden is not
bloat but a genuinely enormous diagram (57,729 `<text>`, 1,741 `<title>`)
faithfully captured from a 1.19 MB `in.puml`. Nothing to shrink. The budget is
keyed on golden size rather than slug — the largest fixture is 47x the second
and 2,600x the median, so the threshold is unambiguous and a future giant
capture gets headroom automatically.

## 4. `sequence-command-coverage` — DONE 2026-08-26, 20 of 20 tasks

Branch `feat/sequence-command-coverage`, 45 commits, merge commit to `main`.
Full report: **`plans/sequence-command-coverage/findings/CLOSE-OUT.md`**.

**Scoreboard.** `svg-sequence/diff-baseline` `status:"error"` **195 → 17**;
`routing-baseline` `known-misroute` **196 → 17** (the 196th was
`kokebo-27-vafi688`, a non-sequence row, now `agree`); `refusal-baseline`
`known-gap` **163 → 9**. Reconciled exactly: 178 closures + `nuvoja-46-dezu541`
+ 16 still-refusing = 195. **178/195 = 91.3 %.** Whole-corpus adjudication over
1141 fixtures: **0 regressions**, 7 artefact, 7 improved, 932 unchanged, 195
inconclusive (all `baseScore: null` closures, all carrying a mechanism).

**READ THIS BEFORE QUOTING ANY SEQUENCE SCORE.** The sequence comparator
reaches **zero** of the golden's arrowhead polygons on **984 of 1141 fixtures
(86.2 %)**; median fraction of the golden's elements reached is **16 %**; on
**557** the comparison never enters the diagram body at all. Of the mission's
178 closures, exactly **one** is arrow-measurable. Those scores are real
measurements of the instrument and are **largely insensitive to arrow
correctness** — they are not fidelity evidence, and a zero-movement score on a
blocked fixture is not evidence in either direction. `sequence-participant-g-wrapper`
below is the repair.

**Every per-bucket estimate in the brief was wrong while the total held**
(measured, by bisecting the mission's own 15 refs): T7 **40** (est. ~12), T8
**26** (~24), T9 **19** (~20), T10 **8** (~9), T11 **3** (~6), T12 **0**
(~45), T13 **82** (~77). One cause for the two big ones — D1's composed named
groups arrived *with* T7's `CommandArrow` rebuild, so T7 absorbed T12's entire
bucket. T12's work is what makes those forms *correct*, not what makes them
*parse*. **Do not size a follow-on from the brief's bucket estimates.**

**Sizing facts, so a follow-on need not re-measure.** Remaining
`weightedScore` over the 178 closures: min 101, p25 223, median 384, p75 668.
28 score ≥1000, 115 <500, 67 <300. **One fixture is 86 % of the total** —
`zudize-61-vomi445` at 799 811; the other 177 sum to 127 043. Any "total
score" over this population is a statement about `zudize` unless stated
excluding it. Per-family distributions and the measurability cross-tab are in
the close-out §4.

**Two census counting traps this mission hit, both worth inheriting.** (a)
**Any corpus census over sequence events must recurse into `frame.branches`** —
two bucket counts were wrong because a top-level-only walk over `events`
missed nested ones. (b) **Pinned `reason` strings drift**; four separate
confirmations. Re-probe at HEAD, never repeat a pin.

**Tooling defect found and fixed.** `scripts/repin-sequence-baselines.ts:112`
derived `weErrored` from `renderFixtureSequence` (which forces the sequence
engine) rather than the dispatched `renderSync` the refusal gate actually
defines it as, mis-pinning 7 fixtures `ok → known-gap`. Corrected; the script
now reads the dispatched render, and re-running reports `REPINNED 0`. It also
never cleared `reason` on a routing flip (`:93-99`) — 222 stale fields cleared.

## 5. Named, briefed or diagnosed — pick from here after 1

Ordered by how ready they are, not by size.

- **`sequence-fidelity-residuals`** (NEW, unbriefed) — FILED 2026-08-26 as
  `sequence-command-coverage`'s D6 census. **The work queue is the ten items
  below plus the ten still-refusing command gaps**; this row exists so the
  queue has one name. Sequence it strictly after
  `sequence-participant-g-wrapper` — until that lands the instrument cannot
  score the difference, and a task told to make blocked fixtures fall is given
  an unreachable target, which is precisely the pressure that produces a
  fitted value. Sized: 178 fixtures carry a measured score (median 384), of
  which 1 is arrow-measurable today.
  **The ten coverage gaps still refusing, with upstream mechanisms** (close-out
  §5 has the refusing line for each): `CommandLinkAnchor` `{a} <-> {b}` — 3
  fixtures, `CommandLinkAnchor.java:55-64`, `SequenceDiagramFactory.java:155`;
  `factorySequenceNoteOnArrowCommand.createMultiLine` — 3,
  `FactorySequenceNoteOnArrowCommand.java:77-88`, `:136`; `CommandUrl` — 2,
  `sequencediagram/command/CommandUrl.java:61-72`, `:154`; `CommandActivate2`
  (bare `NAME++`) — 1, `CommandActivate2.java:29-37`, `:128`; `CommandReturn`'s
  PARALLEL group — 1, `CommandReturn.java:68`, `:129`;
  `CommandHideShowByGender` GENDER — 1,
  `classdiagram/command/CommandHideShowByGender.java:72-83`,
  `CommonCommands.java:106`; `CommandStyleImport` — 1,
  `style/CommandStyleImport.java:68-77`, `CommonCommands.java:90`;
  `factorySequenceNoteCommand.createMultiLine`'s `UrlBuilder.OPTIONAL` tail — 1,
  `FactorySequenceNoteCommand.java:76-90`, `:134`; `RE_SKINPARAM_LINE`
  (`preprocessor.ts:107`) lacks the `i` flag where upstream's
  `CommandSkinParam` is case-insensitive (`CommandSkinParam.java:57-63`) — 1;
  YAML front matter, a PREPROCESSOR strip
  (`preproc/ReadLineWithYamlHeader.java:91`) — 1. The first two groups are
  three fixtures each and are the cheapest coverage work left.

- **Global participant sizing** (NEW) — FILED 2026-08-26 by
  `sequence-command-coverage` T17, measured. `Bob -> Carol : hello` renders
  240×147 here against **117×124** in the jar: this port uses fixed 80 px
  participant boxes at a 30 px margin where upstream text-fits at 5.
  **Every remaining exo dimension delta reduces to this plus `BORDER1 = 0`
  hardcoded at `src/diagrams/sequence/sequence-layout-exo.ts:76`**, where
  upstream computes `min(xOrigin, dolls.getMinX, every tile.getMinX)`
  (`PlayingSpace.java:75-104,318-320`). Measured knock-on: `[-> Carol` with a
  Bob to its left starts at x=0, 30 px left of everything else, which makes
  `Area#textDeltaX` spuriously **positive** (+10.337 where the jar has −6) and
  pushes the label right. **Stated explicitly because otherwise those numbers
  read as exo defects: the exo arithmetic is correct against upstream** — the
  gap is a global sizing divergence that predates that mission. Likely the
  largest single fidelity item after the `<g>` wrapper.

- **`[hidden]` arrow bodies draw** (NEW) — FILED 2026-08-26 by
  `sequence-command-coverage` T17/T18, measured on 3 fixtures:
  `vogegu-91-mave762` (2 arrowhead polygons against a golden with **0**),
  `TeozTimelineIssues_0004_Test` (5 vs 4), `koneju-77-vode355` (9 vs 8).
  Upstream sets `ArrowBody.HIDDEN` (`CommandArrow.java:495-496`) and **both**
  `ComponentRoseArrow.drawInternalU` (`:85-86`) **and**
  `ComponentRoseSelfArrow.drawInternalU` (`:71-73`) `return` before drawing;
  this port's `applyStyle` (`src/diagrams/sequence/command-arrow.ts:274`) keeps
  only `dashed`/`dotted` and has no field to carry HIDDEN. **~15 lines across
  three files plus one `ArrowConfiguration` field.** Good control: the five
  `[hidden]` lines in `zogane-85-raja214` are all comment-prefixed and it shows
  no overshoot.

- **Per-message arrow colour is parsed and discarded** (NEW) — FILED
  2026-08-26 by `sequence-command-coverage` T17. `applyStyle`
  (`command-arrow.ts:274`) handles only `dashed`/`dotted`; upstream's chain
  ends `else { config = config.withColor(…) }`
  (`CommandArrow.java:487-500`). Neither `ArrowConfiguration` nor `MessageGeo`
  carries a colour, so `-[#red]->` renders `#181818`. **`bold` is a genuine
  no-op upstream — `CommandArrow.java:492` is an empty branch. Do not "fix"
  it.** `config.reverseDefine()` (`:389-390`) likewise has no field here.

- **Part-anchored messages draw** (NEW) — FILED 2026-08-26 by
  `sequence-command-coverage` T18, measured: `nivaje-50-tido759` emits 4
  arrowhead polygons against a golden with **2**.
  `teoz/CommunicationTile.java:316-319` returns from `drawU` when
  `PART1ANCHOR` or `PART2ANCHOR` is set; this port stores no such AST field
  (`command-arrow.ts:455`). **Do not confuse it with the leading
  `{start}`/`{end}` ANCHOR group** — that is a *different* field
  (`msg.setAnchor`, `CommandArrow.java:420`) which `drawU` never tests, which
  is why the golden has exactly 2 polygons for 4 messages, 2 of them
  part-anchored.

- **`**` / `!!` CREATE/DESTROY semantics** (NEW) — FILED 2026-08-26 by
  `sequence-command-coverage` T12 with a measured cost: **5 corpus fixtures**
  (`comelo-49-lefi793`, `nepica-26-pali815`, `nofola-68-nobe068`,
  `pixima-27-nita000`, `telizo-11-pilo439`). All five already parse, route
  SEQUENCE and render create/destroy as an ordinary activation bar.
  `ActivationEvent.kind` (`src/diagrams/sequence/ast.ts:186`) is
  `'activate' | 'deactivate'`, so closing it needs `ast.ts` + layout +
  renderer.

- **Message STEREOTYPE is a style-lookup key, not drawn text** (NEW) — FILED
  2026-08-26 by `sequence-command-coverage` T16, verified against goldens.
  `AbstractMessage.java:60-65,74-77` feeds `getStereotype(stereotype)` only
  into `getStyleSignature().withTOBECHANGED(stereotype)`; golden
  `terapo-81-puzi168` turns the arrow LINE `stroke:#F00` while the label stays
  plain black with no guillemet run. Wiring it to the arrow's line style is
  real unported behaviour. **Message URL is NOT** — nothing upstream reads
  `getUrl` on a message and two goldens confirm plain black text; do not
  file it as a gap.

- **`preprocessor-newline-literal-passthrough`** (NEW) — FILED 2026-08-26 by
  `sequence-command-coverage` T11, **mechanism corrected by T20 after two
  wrong attributions**. `%newline()` **IS ported and is correct**:
  `src/core/tim/builtin/Newline.ts:31` returns `BLOCK_E1_NEWLINE` (`U+E100`)
  under `USE_BLOCK_E1_IN_NEWLINE_FUNCTION = true`
  (`jaws-constants.ts:36`), mirroring `tim/builtin/Newline.java:63-67` under
  `JawsFlags.java:40`. **Do not go hunting a builtin that already exists, and
  do not go hunting a real newline that is never produced.**
  The defect: inside a TIM double-quoted **string literal** the call is never
  evaluated — `Eater.eatAndGetQuotedString` (`src/core/tim/Eater.ts:142-150`)
  copies the interior verbatim — so the literal text `%newline()` survives
  substitution into the output line, and `flatten` splits that line on
  `RE_NEWLINE_CALL_ANY_CASE` (`src/core/preprocessor.ts:370`, regex at `:184`),
  turning one label into two source lines. Measured directly:
  `context.getResultList()` for `!$mixed0 = "XXX + %newline() + XXX"` holds
  **one** line containing the literal text and no `U+000A`, so
  `TContext.ts:362`'s real-newline split never fires; a bare `%newline()` and
  `"XXX" + %newline() + "XXX"` both correctly yield `U+E100`. This also
  disproves `preprocessor.ts:350-355`'s own doc comment ("only the case-folded
  alias reaches this far"). Upstream never post-splits; the jar emits ONE text
  node. Cost: **1 pinned fixture** (`licole-34-vejo527`); blast radius **18
  corpus fixtures** across 3 engines plus an explicit preprocessor pin.

- **`sprite-image-raster-kind`** (NEW) — FILED 2026-08-26 by
  `sequence-command-coverage` T11. `CommandSpriteBase64`'s multi-line encoded
  form parses; registration is deferred because `SpriteImage.asTextBlock`
  (`SpriteImage.java:70-99`) recolours decoded raster pixels and this port has
  no such sprite kind — `getSpriteMonochrome`'s unchecked cast
  (`src/core/sprite-registry.ts:184-190`) means a `{width,height}`-only entry
  does not degrade, it throws `TypeError` on first reference. Needs a PNG
  **decoder** (only the fixed-block encoder exists) plus a third resolver
  branch, both in `src/core/`. Cost: **1 fixture**, corpus-wide.

- **`nested-diagram-renderer`** (NEW) — FILED 2026-08-26 by
  `sequence-command-coverage` T11. `EmbeddedDiagram` `{{ … }}` blocks are
  swallowed at parse via `PSystemCommandFactory#addOneSingleLineManageEmbedded2`
  (`:288-307`) — which is precisely why upstream's inner `end note` does not
  close the outer note — but nothing renders them: no `NestedDiagramRenderer`
  is wired anywhere in `src/`, and the sequence engine never calls
  `CreoleParser` (zero hits under `src/diagrams/sequence/`). Cost: **2 pinned
  fixtures**, corpus reach **47** (22 class, 12 sequence, 8 activity, 5
  component).

- **`sprite-base64-command-to-core`** (NEW) — FILED 2026-08-26 by
  `sequence-command-coverage` T11, a **structural** divergence, not a defect.
  `src/diagrams/sequence/command-sprite.ts` lives under the sequence engine,
  but upstream's `CommandSpriteBase64` is a `CommonCommands` command shared by
  every engine (`CommonCommands.java:79`), so class/state/description still
  lack it. Built move-ready as a pure function with `matchSpriteCommand`'s
  exact shape. Small.

- **`nuvoja-46-dezu541` is a HARNESS item, not a command gap** (NEW) — FILED
  2026-08-26 by `sequence-command-coverage` T19/T20. It is the single
  non-gapped defect the refusal SLI reports (SLI 2 = 1) and it is pinned `ok`
  deliberately. Its source uses `!includedef macro`, and the macro is **absent
  from `tests/helpers/fixture-include-store.ts`**; the preprocessor stops at
  `src/core/tim/IncludeExecutor.ts:127`. **Filing it as a command gap would
  send a mission hunting a `Command` that does not exist.** Fix is to seed the
  fixture include store.

- **`hnote` draws a rectangle where upstream draws a hexagon** (NEW) — FILED
  2026-08-26 by `sequence-command-coverage` T20, **overturning that mission's
  own working assumption.** T8 measured that `getNoteComponentType()` has call
  sites only in `NoteStyle.java` and six `teoz/` files, and the mission read
  that as "teoz-only, therefore not drawn". **That inference is the disproved
  classic-renderer premise** (see the standing note in this section): teoz is
  the *only* renderer, so a `teoz/` call site is live code.
  T20 read the method body: `teoz/NoteTile.java:108-115` maps
  `NoteStyle.HEXAGONAL → ComponentType.NOTE_HEXAGONAL` and
  `NoteStyle.BOX → ComponentType.NOTE_BOX`, and `:103` passes that straight to
  `skin.createComponentNote`. Four more live call sites do the same
  (`teoz/NotesTile.java:109,114`, `teoz/GroupingTile.java:750`,
  `teoz/CommunicationTileNoteLeft.java:106`,
  `teoz/CommunicationTileNoteRight.java:113`). **Upstream draws all three
  shapes.**
  Half of it is already right here: `rnote` → BOX → plain rectangle matches,
  and `src/diagrams/sequence/renderer.ts:226-232` draws
  `NoteEvent.shape === 'rect'` as a rectangle. **`hnote` is the gap** — it maps
  to the same `'rect'` (`ast.ts:126-139`, an explicitly documented T13 scope
  cut) instead of a hexagon path. Cost: **23 corpus fixtures use `hnote`**, 20
  use `rnote`, 29 use either. Needs a hexagon path in the note renderer plus a
  third `NoteEvent.shape` value.


- **`sequence-parallel-anchor-draw`** — FILED 2026-08-26 by
  `sequence-command-coverage` batch 5, maintainer-approved as a residual.
  The `&` (parallel) prefix and `{name}` anchors are parsed and stored on the
  AST but **not drawn**. That mission's D4 originally justified this as
  matching upstream; **the justification was disproved** (see below) and D4 is
  amended. Drawing them is real, unported behaviour.
  Upstream consumers, all live: `isParallel()` selects
  `YGauge.createParallel` over `createWithContact`
  (`teoz/CommunicationTile.java:113-116`), changing vertical position so
  parallel messages share a contact line; `GroupingTile.java:145` uses it for
  group chaining; a non-null anchor forces an early `return` from `drawU`
  (`teoz/CommunicationTile.java:316-319`).
  13 fixtures (10 grouping-`&`, 3 anchor). They already parse and route
  SEQUENCE, so this is fidelity, not coverage.
  **Sequence this AFTER `sequence-participant-g-wrapper`** — until that lands
  the comparator cannot see the difference, so the work would be
  unverifiable.
  **Confirmed at that mission's close (2026-08-26):** no `DIVERGENCES.md`
  entry was written for `&`/anchor, and none should be. Not because upstream
  behaves this way — it does not — but because this is tracked, planned work,
  not a settled product divergence. Two doc comments still asserting the
  disproved premise were corrected at `c3a24c9d`.

- **`sequence-newpage-pagination`** — FILED 2026-08-26 by
  `sequence-command-coverage` T14, mechanism measured. This port ignores
  `newpage` (`src/diagrams/sequence/command-page.ts:26-31`, pre-existing and
  documented) and renders every page into ONE document; the jar emits page 1
  only. Invisible until exo arrows started drawing, which made
  `dolefo-13-kovu702` overshoot: its source splits 8 exo messages across two
  pages, the golden has 4 polygons, and the port now draws 8 (measured: base
  0, live 8, golden 4). Re-pinned at the higher score with this mechanism
  recorded. Any fixture using `newpage` carries the same overshoot.
  **Also the mechanism behind two of `sequence-frame-background-pass`'s
  adjudicated-benign rises** (`fobube-11-nifo424`, and — a further layer,
  `luzapi-49-rati107`'s bare `stroke-dasharray:1,4` delay line between
  lifeline groups per `Rose.java:210`'s `PARTICIPANT_LINE`-only branch); see
  `DIVERGENCES.md` "Background-pass rollout".

- **`sequence-participant-symbols`** — **DONE 2026-08-29**, branch
  `feat/sequence-participant-symbols`, 7 tasks (T1–T7) plus one `fix(T4)`.
  **Merge with a merge commit** — the journal cites per-task commit ids.
  Full close-out in `plans/sequence-participant-symbols/findings/
  adjudication.md`; the numbers below are from that run, not carried forward.

  **`junaxa-14-biko373` CLOSED**: 725 → **333**, body-group child count 41
  with the golden's histogram (`g 7, rect 6, ellipse 2, path 7, text 13,
  line 3, polygon 3`) and its tag sequence matching at all 41 positions.
  `fobube-11-nifo424` (402) and `rugeco-70-muro754` (543) untouched.

  Adjudicated against `main` over all 1141 fixtures, **skipped 0**:
  **regression 0**, artefact 10, improved **80**, inconclusive 19 (17 of them
  NULL at both refs — fixtures that do not render, unchanged), unchanged 1032.
  Complementary structural census, body-group child tag sequence against the
  golden: exact sequences **506 → 576**, matched positions **48159 → 49014**
  of ~105.9k.

  What landed, and what the scoping above got wrong:

  1. **database** — the hand-rolled `rect + line + line + ellipse` cylinder is
     gone, replaced by `USymbolDatabase#drawDatabase`'s two `UPath`s through a
     new sequence-local seam (`renderer-participant-symbol.ts`). The fitted
     `DB_MIN_WIDTH = 40` and `DB_HEIGHT = 80` are gone with it, replaced by
     `ComponentRoseDatabase#getPreferredWidth/Height` (:96-105).
     **Correction to the scoping:** it proposed reusing
     `src/core/usymbol-shapes.ts#renderDatabaseIcon` as "the faithful
     version". That is the SIMPLIFIED emitter the class engine already
     migrated AWAY from (SI14 T4); D1 routes through
     `USymbol.asSmall(...).drawU(ug)` and `UGraphicSvg` instead.
  2. **the five missing kinds** — `collections`, `queue`, `entity`,
     `boundary`, `control` now dispatch. **Correction to the scoping, and to
     this file's claim that "all five are already ported under
     `src/core/decoration/symbol/`": only TWO of the six kinds are
     USymbol-backed.** Read from `Rose.java:137-190` and all five
     `ComponentRose*` bodies: `database` and `queue` use
     `USymbols.*.asSmall`; `boundary`/`control`/`entity` construct the
     `svek/` drawing classes DIRECTLY (`new Boundary(biColor)` and siblings,
     ported at `src/core/svek/`); and `collections` has no symbol at all — it
     is `ComponentRoseParticipant(collections=true)`, a second `URectangle`
     offset by `getDeltaCollection() = 4`.
  3. **actor** — routed through `ActorStyle.getTextBlock` (D4: an
     `ActorStyle` case, not a `USymbol` one). `skinparam actorStyle
     awesome|hollow` now works in sequence diagrams; it was silently ignored.
     Head radius 10 → 8 and `stroke-width` 1.5 → 0.5, both now the golden's.
     The uncited `SEQUENCE_ACTOR_HEIGHT = 90` floor is gone.
  4. **`fix(T4)`, found at the Batch-4 gate** — the label is drawn BEFORE its
     glyph, at head and tail, per `ComponentRoseDatabase.java:81-88`. This
     port had it backwards for every kind. That single change is most of the
     `+65` exact tag sequences.

  **Open, filed by this mission (see below): the sequence `==` divider emits
  nothing.**

  **Re-pinned 2026-08-29 at `f8ad4386`**: the 10 `artefact` rows plus
  `gucare-93-petu502`, 11 entries in
  `oracle/goldens/svg-sequence/diff-baseline.json`. `tukobo-89-zebi935`
  (457 → 734) deliberately excluded — its rise is the divider gap below, which
  this mission neither caused nor fixed, and which was invisible at `main`
  only because the database glyph's over-emission cancelled it. **Sequence
  ratchet is 3 red: `fobube`, `rugeco`, `tukobo`** — the same count as before
  this mission, `junaxa` closed and `tukobo` opened. **The 80 IMPROVED pins
  were tightened 2026-08-31**, each guarded to be strictly below its previous
  value (80 down, 0 up); `junaxa` is now pinned at **333**, down from 673.

- **`sequence-divider-separator` — DONE 2026-08-31**, branch
  `feat/sequence-divider-separator`, executed directly (three tasks against
  one upstream component, no `plans/` brief). Close-out:
  `plans/sequence-divider-separator/findings/adjudication.md`.

  `renderDivider` drew TWO elements where `ComponentRoseDivider
  #drawInternalU` draws five, and sized itself with a fitted `cursor.y += 30`.
  Now: `drawSep`'s 3px band plus its two rules, the label box and the text,
  with the empty `====` form drawing the band alone; height from
  `getPreferredHeight = getTextHeight + 20`; and
  `getPreferredWidth = getTextWidth + 30` widening the diagram through
  `DividerTile#getMaxX`. Label-box dimensions are EXACT against three separate
  goldens.

  **`tukobo-89-zebi935` closed**: 734 → 369, and its histogram is the
  golden's (44 children, `rect 10`, `line 8`). Adjudicated vs `main` over 1141
  fixtures, skipped 0: regression 3, artefact 19, improved 14, inconclusive 17
  (all NULL at both refs), unchanged 1088. Exact body-group tag sequences
  **574 → 589**, matched positions 48987 → **49909**.

  **The three `regression` verdicts are the adjudicator's known blind spot,
  diagnosed in §3 of the findings**: all three documents were already larger
  than their golden before this change, so adding correct nodes raises the
  child distance and `classify` has no rule that can fire. Δ is exactly
  `+3 × dividers` in each. `digula-66-dipe776` and `xedomi-77-libu804` are
  `newpage` fixtures (the gap below); `vogegu-91-mave762`'s residual is the
  `[hidden]`-arrow gap, filed below as `sequence-hidden-arrow`.

  **Re-pinned 2026-08-31 at `58dc5092`: the 19 `artefact` rows** (they move
  UP — the sanctioned case, every one with a falling child distance). The
  three `regression` rows are deliberately left red: `digula`/`xedomi` would
  pin over the unfixed `newpage` gap and `vogegu` over the `[hidden]`-arrow gap
  (`sequence-hidden-arrow`). **Sequence ratchet is 5 red** — `fobube`, `rugeco`,
  `digula`, `vogegu`, `xedomi`. **The 14 IMPROVED pins were tightened the same
  day** (14 down, 0 up, guarded strictly-below-pin), so `tukobo` is now pinned
  at **369** and this mission's result is held by the gate.

- **`sequence-hidden-arrow` — DONE 2026-08-31**, branch
  `feat/sequence-hidden-arrow`, executed directly (one behaviour, three
  files). Close-out:
  `plans/sequence-hidden-arrow/findings/adjudication.md`.

  `-[hidden]->` drew a full arrow; upstream draws nothing.
  `ComponentRoseArrow#drawInternalU:85-87` and
  `ComponentRoseSelfArrow#drawInternalU:71-73` both return on `isHidden()`
  BEFORE the line, both arrowheads and the label. `ArrowConfiguration` gained
  an optional `hidden`, `applyStyle` sets it, and `renderMessage` returns
  `''`. **Layout is untouched on purpose** — only `drawInternalU` is guarded
  upstream, so a hidden arrow still reserves its full tile
  (`ComponentRoseArrow.java:342-349`).

  Adjudicated vs `main` over 1141 fixtures, skipped 0: **regression 0,
  artefact 0, improved 3, inconclusive 17 (all NULL at both refs), unchanged
  1121. No rises at all.** `vogegu-91-mave762` 553 → **193** and
  `TeozTimelineIssues_0004_Test` 590 → **240**, both now matching their
  goldens' histograms EXACTLY. **Sequence ratchet 5 red → 4**: `fobube`,
  `rugeco`, `digula`, `xedomi`.

  **Correction to this entry's own filing:** it claimed 7 fixtures use
  `[hidden]`. Grep over-counted — `zogane-85-raja214`'s five are all inside
  `'` comments. Three of the remaining six do not render at all, leaving three
  measurable, two of which closed completely (the filing predicted one).
  `koneju-77-vode355` improved 1165 → 1144 but its child distance rose 1 → 4:
  it was already SHORT, and removing its hidden arrow exposes a six-line
  shortfall that is present at both refs and unrelated.

  **The three moved fixtures were tightened 2026-09-01** (3 down, 0 up):
  `vogegu` 529 → 193, `TeozTimelineIssues_0004_Test` 590 → 240, `koneju`
  1165 → 1144. Nothing rose, so no re-pin was required — this holds the gains.
  The arrow COLOUR fallback
  (`CommandArrow.java:497-498`) is still parsed and dropped: a colour gap that
  moves no child counts.

- **`sequence-frame-header-newlines` — NEW, filed 2026-08-31.** A frame
  header's label does not split on `\n`. `pigifu-13-kele137`'s
  `group foo\ndummy` draws ONE `<text>` in this port and TWO in the jar. Same
  `Display.getWithNewlines` mechanism the divider now honours
  (`CommandDivider.java:83`), in `ComponentRoseGroupingHeader`. Narrow;
  corpus reach not measured.

- **Sequence text escapes `\t`, `\\`, `\r`, `\l` are unhandled** in every
  label in the engine. `Display.getWithNewlines` (`Display.java:288-313`) maps
  `\t` to a tab, `\\` to a backslash, and `\r`/`\l` to a break that also sets
  the block's natural horizontal alignment. Only `\n` is unescaped here, and
  only in notes and dividers. Engine-wide; deliberately not made a
  divider-only special case.

- **`sequence-activation-double-box`** — SCOPED 2026-08-28. Closes
  `rugeco-70-muro754`, whose surplus is exactly ONE node: participant `a`
  gets two activation `<g>` where the jar gives one (ours 32 vs golden 31;
  histograms otherwise identical, `g` 7 vs 6). Source is `&opt test` with
  `activate a` then `a ->> b --++`, i.e. a `--` that deactivates `a` at the
  message followed by a trailing `deactivate a` after `end` on an
  already-inactive lifeline. **Candidate mechanism, NOT yet confirmed — the
  mission must diagnose it against the Java before changing anything.**
  Corpus reach: 8 fixtures use `--++`, 59 use a `&` parallel marker.

- **`fobube-11-nifo424` is NOT its own mission** — its surplus 7 is the
  `newpage` pagination gap already filed above (`command-page.ts:19-31`: "no
  engine in this port implements pagination"; upstream clips per page via
  `UClip`, `PlayingSpaceWithParticipants:213-216`, `PlayingSpace
  #getNbPages:348`). Implementing multi-page output to clear one ratchet row
  is not proportionate. **Note for whoever decides:** the sequence ratchet
  has no parking mechanism — `checkNoRise`
  (`tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:206-232`)
  compares `live <= baseline` and nothing else, with no known-gap status like
  the refusal baseline has. So `fobube` passes only by being fixed or
  re-pinned, and `dolefo-13-kovu702` (above) already set the precedent of
  re-pinning this exact cause with the mechanism recorded. Until one of those
  happens, `main`'s CI stays red on it.

- **NOTE FOR ANY SEQUENCE MISSION — the `sequencediagram/graphic/` package is
  DEAD.** Established 2026-08-26 by three independent
  `sequence-command-coverage` tasks and verified leg by leg:
  `SequenceDiagram.java:306-309` returns `SequenceDiagramFileMakerTeoz`
  unconditionally (both the `modeTeoz()` guard and the `Puma2` line are
  commented out); `Step1MessageExo.java` and `DrawableSet.java` do not exist;
  and nothing constructs `MessageExoArrow`, `MessageArrow` or
  `MessageSelfArrow`. **Sequence pixels come from
  `net/sourceforge/plantuml/sequencediagram/teoz/`.** Reading `graphic/` to
  answer "what does upstream draw?" gives confidently wrong answers — it cost
  one mission a wrong constant (caught), one throwaway commit (caught by the
  ratchet), and one locked decision's premise.
  **The corollary is the trap that outlived the correction, so state it
  directly: "every call site is under `teoz/`" means "every call site is LIVE",
  never "this is optional/teoz-only behaviour".** That inference survived the
  D4 amendment inside the same mission and produced a second wrong conclusion
  (`hnote` shapes, above) which T20 caught only by opening
  `teoz/NoteTile.java` and reading the method. **A call-site census is not
  evidence about what upstream draws. Only the method body is.**

- **`sequence-frame-background-pass`** — DONE 2026-08-28, branch
  `feat/sequence-frame-background-pass`, 8 tasks (T1–T8). Ported the missing
  first of teoz's five passes, `PlayingSpace#drawBackground`
  (`teoz/PlayingSpace.java:109-117`). T9 (merge to
  `feat/sequence-participant-g-wrapper`, then to `main`) is the orchestrator's,
  not yet run as of this entry.

  **Correction to this entry's own original mechanism claim.** The filing
  below said the outline duplicates because `GroupingTile#drawU:267` calls
  `comp.drawU` OUTSIDE the `isBackground()` guard at `:262` — true, but not
  why a duplicate rect appears rather than nothing. Verified against the Java
  at T8 close-out: **`AbstractComponent#drawU:142-149`** dispatches to
  exactly ONE of two halves per call — `drawBackgroundInternalU` when
  `context.isBackground()`, `drawInternalU` otherwise, never both, with an
  EMPTY default at `:139-140`. `GroupingTile:267`'s unconditional
  `comp.drawU` call is therefore safe on its own — every other component
  silently no-ops on its off-pass through that empty default. What makes a
  grouping frame draw twice is that `ComponentRoseGroupingHeader` OVERRIDES
  BOTH halves (`:126-133` background, `:135-159` foreground) and draws the
  same `URectangle` in each. The fix this mission built is therefore a
  two-half component (D4), not a guard removed from one call site.

  **Verdict, measured** (`sequence-ratchet-adjudicate.ts`, 1141 fixtures,
  skip 17 — identical parser-refusal set at every ref, see below): vs
  `1aa15960` (the predecessor's tip) — artefact=63 substructure=13
  regression=2 inconclusive=18 improved=97 unchanged=948, Σ weightedScore
  1 241 626 → 1 219 837 (−21 789). Vs `main` (`e10c88e9`): Σ 1 291 577 →
  1 219 837 (−71 740). The 2 `regression` and the 1 score-rising
  `inconclusive` that survive the classifier are all three adjudicated
  **benign** — correct nodes added to documents already larger than their
  goldens, a shape the classifier's own rules cannot recognise as anything
  but a rise. See `DIVERGENCES.md` "Background-pass rollout" for the
  mechanism. No unadjudicated rise remains anywhere in the 1141.

  **All 10 of the predecessor's blocking fixtures are now `improved`**:
  `bifuzu-54-gefo004` 549→254, `murori-42-pabo946` 333→150, `panopa-36-
  muti317` 792→385, `pixopo-04-zitu732` 305→133, `rotila-89-juri637`
  256→116, `tusoga-11-gabe405` 615→292, `vesaze-51-ceji187` 381→194,
  `xegufe-25-paji965` 305→133, `xujoga-62-lacu610` 289→135, `xupozu-13-
  numi050` 305→133. `pixopo-04-zitu732` matches its golden 20/20 and
  `kejoke-76-curu931` matches 102/102, closing the mission's own README
  scope measurement exactly.

  **What the mission itself found and fixed before close-out.** The first
  cut routed `ref` frames through the same `ComponentRoseGroupingHeader`
  two-half port as `group`/`alt`/…, drawing a background outline and a
  `[label]` comment box the jar never draws for a `ref`. Wrong: upstream
  builds a `ref` as a `ReferenceTile` (`TileBuilder.java:174-176`), not a
  `GroupingTile`, whose component is `ComponentRoseReference` — a different
  class with no background half at all. `fix(T7)` corrected the 8 fixtures
  this caused and 11 of 12 score-rising `inconclusive`s. Full diagnosis:
  `plans/sequence-frame-background-pass/findings/adjudication.md` §3a/§4.

  **The 17 permanent skips — corrected, not `!include` failures.** Measured:
  every one is a parser refusal (`sequence refused this source at line N
  (syntax)`), identical at `main`, `1aa15960` and here; only
  `nuvoja-46-dezu541` contains an `!include` (already filed above as the
  harness item). Example: `dolice-60-copi767`'s
  `Alice -> Bob [[http://www.google.fr]] : ok` — an inline link on a
  message, unported sequence syntax, filed below as part of
  `sequence-fidelity-residuals`'s command-gap queue, not a preprocessor
  defect.

  **Spin-offs filed, each verified against the Java at T8 close-out (not
  carried over from the original filing unverified):**
  - **`sequence-reference-tile`** (NEW, highest value). `ReferenceTile`
    (`teoz/ReferenceTile.java:70-136`) draws through `ComponentRoseReference`
    (`skin/rose/ComponentRoseReference.java:57`), a distinct class with its
    own `xMargin = 2` / `heightFooter = 5` geometry (`:61-62`) and exactly
    one draw method — `drawInternalU` (`:82-138`) — no
    `drawBackgroundInternalU` override anywhere in the class, and
    `ReferenceTile.drawU:127-136` calls `comp.drawU` unguarded, with no
    `isBackground()` test and no `Blotter`. `fix(T7)` routes
    `frameType === 'ref'` through a branch inside the shared
    `renderer-frame-header.ts` port instead of a separate module; the
    faithful structure is its own `renderer-frame-reference.ts` mirroring
    the separate Java class. Deferred as a structural cleanup, not a
    fidelity gap — T7's branch is already measured correct on every
    affected fixture.
  - **`sequence-group-bracket-comment`** (NEW). `group Alpha [beta]` stores
    the title, drops the comment. `TRAILING_BRACKET_CONTENT_PATTERN`
    (`CommandGrouping.java:76-77`, applied `:144-148`) captures the header
    into `m.group(1)` and the bracket body into `m.group(2)`; this port's own
    mirror (`command-grouping.ts:52-55`, applied `:78-79`) already documents
    the gap in its own comment — the bracket body "has nowhere to go"
    (`:72`) — because `FrameEvent` (`ast.ts:154-194`) has one `label` slot
    and no title/comment pair. Measured: **2 of 1427** corpus fixtures use
    the bracket form (`durapi-97-jupo864`, `pizupi-41-logi068`).
  - **`sequence-partition-keyword`** — `partition` is in upstream's
    `CommandGrouping` TYPE alternation (`CommandGrouping.java:67`) and
    absent from this port's grouping regex (`command-grouping.ts:103`,
    `(loop|alt|opt|par2|par|break|critical|group)`).
  - **`sequence-partition-tile`** — `PartitionTile extends GroupingTile`
    (`teoz/PartitionTile.java:58`) overrides `getComponent()` with an
    anonymous `Component` (not `AbstractComponent`) whose
    `drawU(ug, area, context)` never reads `context` (`:66-114`) — so it
    draws its full body on every call, background and foreground alike,
    since `GroupingTile:267`'s call is unconditional and this component
    bypasses `AbstractComponent`'s `isBackground()` dispatch entirely. It
    also overrides `drawCompBackground` (`:206-209`) to span the whole
    diagram width rather than the group's own frame.
  - **`sequence-group-style-cascade`** — `sequenceDiagram.group` /
    `groupHeader` have no SName style bucket: confirmed absent from
    `ELEMENT_BUCKET_SNAMES`
    (`src/core/skinparam-element-buckets.ts:26-*`), so `skinparam`/`<style>`
    cannot override the constants D3 hard-codes in
    `src/diagrams/sequence/frame-style.ts` (whose own doc comment already
    flags the gap, `:6-7`).
  - **`sequence-frame-geometry`** — unchanged from this mission's own D6
    non-goal, restated for the record: frame `x`/`width` derive from
    participant centres plus a flat 20/40; this port's participant heads are
    80px wide against the jar's 38.9 — already filed above as "Global
    participant sizing" (`sequence-command-coverage` T17).

## `sequence-participant-g-wrapper` — EXECUTED 2026-08-27, MERGED via T9 pending

Branch `feat/sequence-participant-g-wrapper` (5 commits).
**Objective met**: fixtures reporting `polygon/@points` diffs went **42 →
487**, records **721 → 7 922** (same 1124 measured fixtures, same 17 skips).
`celego-19-laji937` matches the golden's root-group child sequence tag for
tag. Σ weightedScore 1 291 577 → 1 241 546. Adjudicated vs `main`:
artefact=0 **substructure=557 regression=0** improved=557 inconclusive=27.
Three divergences fixed, all from `teoz/PlayingSpaceWithParticipants
#drawU:218-227`: the lifeline `<g><title>` + hover-rect group
(`ComponentRoseLine.java:74-108`), activations wrapped and moved into the
lifeline pass interleaved per participant
(`LivingSpace#drawLineAndLiveboxes`), and the footbox drawn before the
foreground tiles. **T3 carries essentially all the value** — reverting it
alone drops the win to 45 fixtures / 857 records, so this does not split.

**UNBLOCKED 2026-08-28** — `sequence-frame-background-pass` (above) closed
the gap that halted this mission before merge: all 10 blocking fixtures are
now `improved` and the classifier's remaining 2 `regression` + 1 rising
`inconclusive` are adjudicated benign (`DIVERGENCES.md` "Background-pass
rollout"). The re-pin (`repin-sequence-baselines.ts`) is still not run as of
this entry — it is orchestrator-only (D8) and is T9's job, not either
mission's own.

**Correction to the filing below**: T15's "not one `polygon/@points` record
exists" was true of `celego`, not of the corpus — 42 fixtures already
reported arrow geometry on main. The gain is 11.6x, not zero-to-some.
Also delivered: a `substructure` verdict for
`scripts/sequence-ratchet-adjudicate.ts`. Its `artefact` rule only
recognised a rise that CLOSES the child-count distance; a change that adds
correct substructure INSIDE existing children grows our node mass without
touching the count, and all 552 such rises were mis-called `regression`.

### `sequence-participant-g-wrapper` (original filing)

FILED 2026-08-26 by
`sequence-command-coverage` T15, mechanism measured and verified twice.
**The sequence comparator cannot measure arrow fidelity at all today.** The
jar wraps each participant in `<g><title>A</title><rect/><line/></g>`; this
port emits the bare primitives, so child 0 under `svg/g[1]` is a TAG
mismatch and `compare.ts:222-231` returns — `// structural mismatch — stop
here`. The wrapper also shifts every following child index, so the whole
sibling run mismatches by tag.
Verified by dumping all 30 diffs of `celego-19-laji937`: 4 root dimensions,
the rest tag mismatches (`line vs g`, `rect vs g`, `text vs rect`, `polygon
vs text`), and **not one `polygon/@points` record**.
**Why it matters beyond tidiness**: correct arrow work produces no ratchet
movement — and neither does incorrect arrow work. The whole dressing bucket
is invisible, `diff-census.json`'s sequence buckets describe the tag cascade
rather than arrow quality, and any task told to "make the dressing fixtures
fall" is given an unreachable target, which is precisely the pressure that
produces a fitted value.
Emitting the wrapper should unblock descent for the entire sequence corpus
at once, so this is likely the highest-leverage single change available to
sequence fidelity. Size it against the participant renderer before starting.
See `.agent-notes/T15-comparator-blocks-arrow-descent.md`, and note it
supersedes the conclusion in
`.agent-notes/T13-sequence-ratchet-rise-diagnosis.md:167-172`.

- **`sequence-arrow-background-colour`** — FILED 2026-08-26 by
  `sequence-command-coverage` T15, **NARROWED at that mission's close: the `o`
  fill half is already FIXED.** T15 diagnosed the `o` circle decoration
  filling `#FFF` here against `#000` in the jar, and concluded it needed an
  arrow-background field on `Theme` (`src/core/theme.ts`). T17 found the
  narrower, correct answer inside the sequence renderer and shipped it
  (`43b59774`): `paintOf` (`renderer-arrowhead-glyph.ts`) was mapping
  `getBackgroundColor()` to `theme.colors.background`, where upstream reads
  `getColorBackGround()` (`skin/rose/AbstractComponentRoseArrow.java:66,84-86`)
  → `getColor(PName.BackGroundColor)` (`skin/AbstractComponent.java:105-107`)
  on the **arrow** style. The constant is upstream's own pinned value, not one
  fitted to goldens: `src/main/resources/skin/plantuml.skin` carries
  `arrow { … BackGroundColor black }`.
  **What remains is only the `<style> arrow { BackGroundColor }` hook** — i.e.
  letting a user stylesheet override that value, which T17 deliberately did not
  invent. Verified by probe: `<style> arrow { BackGroundColor #00FF00 }`
  changes the jar's fill to `#0F0`, while `skinparam backgroundColor #FFAA00`
  does not change it at all. Ruled out at the same time and worth not
  re-deriving: it is NOT the page colour (51/51 corpus goldens with an `rx="4"`
  circle are `fill="#000"`, including three on non-white backgrounds) and NOT
  the line colour (`TeozTimelineIssues_0007_Test` pairs `stroke:#F00` with
  `fill="#000"`, because `-[#red]->` overrides `PName.LineColor` only —
  `AbstractMessage.java:69-70`). Small, and it crosses the shared theme seam.

- **`sequence-multiline-command-seam`** — FILED 2026-08-26 by
  `sequence-command-coverage` T5, with the mechanism already measured.
  **The port has no equivalent of upstream's `OK_PARTIAL` dispatch seam.**
  Upstream's `getCandidate` (`PSystemCommandFactory.java:225-246`) lets a
  command claim a multi-line block by returning `OK_PARTIAL`, after which
  `isMultilineCommandOk` (`:238`) consumes the whole block **including its
  closing line** from the iterator — so the closer never re-enters dispatch.
  This port instead re-dispatches the closer through the flat command list
  (`parser.ts:44`'s `handlePendingNote`, which takes the FIRST `.find()`
  match).
  **Consequence, and why it is worth a mission:** the port's sequence command
  order *cannot* mirror `SequenceDiagramFactory#initCommandsList:99-155`.
  Upstream registers `CommandGrouping` at `:126` and the multi-line note
  closers at `:134-137`; because the port's `endCommand`
  (`/^end(?:\s+.+)?\s*$/i`, `command-grouping.ts:103`) also matches
  `end note`, mirroring that order would make a multi-line note pop a
  grouping frame instead of closing. The port's order is therefore
  load-bearing compensation, and `sequence-command-registry.ts` diverges from
  upstream's registration order at **13 seams**, each pinned by
  `tests/unit/sequence/command-registry-order.test.ts`.
  Porting the seam would let the registry be re-mirrored exactly and would
  retire those 13 divergences. Scope is the shared dispatch loop, so it likely
  touches more than the sequence engine — size it before starting.
  See `plans/sequence-command-coverage/decisions.md` D2 (amended 2026-08-26).

- **`sequence-participant-badge-glyph`** — DONE 2026-08-25, same day it was
  filed. Both forms draw: the sprite badge as a rasterised `<image>` and the
  circled character as the filled circle the jar actually emits (three
  goldens confirm no glyph `<text>` accompanies it). The filing's stated
  blocker — "the shared plugin seam carries no `SpriteRegistry`" — **was
  wrong**: registries are not threaded through that seam at all. The parser
  builds one onto the AST (`dot/parser.ts:42`, `board/parser.ts`), and the
  sequence parser was **already** doing it (`sequence/parser.ts:121`). No
  interface change was needed. Recorded because the wrong reason nearly
  bought a deferral the work did not need.
  **Residual — FIXED same day.** The PNG data URI was ~21x the jar's for the
  same sprite. Cause was not detail: both encoders emit 8-bit RGBA, filter 0,
  16448 raw bytes, identical alpha. `png-encoder.ts` emitted DEFLATE STORED
  blocks by design, reasoning the size cost was "negligible" for 64x64
  sprites — backwards, since sprite scanlines are exactly the long identical
  runs LZ77 removes. `deflate-fixed.ts` (fixed Huffman + LZ77, deterministic
  by construction) takes birocu's sprite 16516 -> 679 bytes, now 0.87x the
  jar's own, with pixels byte-identical. Whole-SVG output over the 8 sprite
  fixtures is 0.77x the jar.
- **`sequence-element-style-buckets`** — DONE 2026-08-25. The sequence engine
  read no per-element `<style>`/skinparam buckets and no inline participant
  `#color` either; both now resolve in layout onto `ParticipantGeo`
  (`background`/`border`) in `Participant#getUsedStyles`' own precedence
  (inline over cascade, `Participant.java:88`). Root cause of the bucket half
  was one missing entry: `ELEMENT_BUCKET_SNAMES` carried every OTHER sequence
  participant kind (actor, database, boundary, control, entity, queue,
  collections) but not `participant` itself, so `<style> participant {}`
  resolved to no bucket at all.
- **`gradient-paint-goes-in-defs`** — DONE 2026-08-25, same day it was filed.
  `extractGradientDefs` (`core/svg.ts`) lifts every inline
  `<linearGradient>` out of the drawing body and into the document `<defs>`,
  deduped by id, on BOTH assembly paths (`svgRoot` and
  `klimt/document-shell.ts`). Dedup is exact rather than heuristic:
  `paintToSvg`'s id is a content hash of the resolved
  `color1|color2|policy`, so equal ids mean byte-identical defs — the design
  already anticipated this ("so the def can be deduplicated by the caller").
  The two fixtures that regressed when participants started honouring
  gradient backgrounds (`fadage-04-xoxe727`, `netuvi-29-jiti924`) came back
  301 -> 242, below their pre-bucket 253. Shared emission code, so all
  engines were re-run: no failing-test change anywhere.
- **`dispatch-by-parse-attempt`** — **DONE 2026-08-25**, summary at
  `plans/dispatch-by-parse-attempt/README.md`. `accepts()` is deleted; dispatch
  is `PSystemBuilder#createPSystem`'s parse attempt. All four gates green.
  **This entry's own sizing was wrong and is corrected here**: it said the
  mission "must first give ≥13 engines strict unrecognised-line handling". It
  is 8 — the command-loop engines (batch 3a's T4–T11); the rest are
  single-candidate or not command-loop at all, and chart/packetdiag measured
  empty buckets for exactly that reason. The blocker it named was real, but
  smaller than filed.
  **Residual → `sequence-command-coverage`** (NEW, unbriefed): 163 refusal
  gaps and 194 routing entries share ONE root — sequence commands this port
  does not implement. 62 exo arrows (`CommandExoArrowLeft`/`Right`), 23
  note-factory groups, 13 `CommandGrouping` PARALLEL, and the `CommandArrow`
  named groups (dressing, inclination, lifecolor, url, style, multicast,
  anchor, stereotype). Closing them closes BOTH conformance gates together.
  The work-list already exists per fixture: every pin in
  `refusal-baseline.json` and `routing-baseline.json` carries its refusing
  LINE and the upstream `File.java:line`. **Filter by the LINE, not by the
  gates' `engine` field** — that field is the merged refusal's assumed type
  and D2 keeps the highest-scoring refusal, so 17 sequence gaps read as
  `state` (`DIVERGENCES.md`).
- **`routing-heuristic-repair`** — BRIEFED 2026-08-23 at
  `plans/routing-heuristic-repair/README.md`, not started. **Start here of
  the three**: its prerequisite already landed, and it is the only one of
  them that can proceed today. Re-scoped out of
  `sequence-engine-overclaims-nested-diagrams` batch 4 after that mission
  halted, with **every bucket re-measured** against the live tree rather than
  carried over. Baseline **79 disagreements of 3158**, of which **75 are real
  defects** and 4 are fixtures where the *jar* produced an error page. Nine
  tasks in six batches, ordered by blast radius; **registration order is
  frozen** (its D1). Each bucket carries the file and mechanism it was traced
  to, and — the lesson from the halt — a measurement of *where each fixture
  lands* once its over-claimer declines, which turned up three cross-task
  dependencies that would otherwise have scored as failures.
- **`sequence-engine-overclaims-nested-diagrams`** — **HALTED 2026-08-23 at
  T2**, after batch 1 landed. Do not restart it as written. Its T1 routing
  gate shipped (`ef62ef74`) and is this repo's measuring instrument for
  routing; its D1 is **disproven**. Mirroring `PSystemBuilder.java`'s factory
  order moves the gate **79 → 469** — 25 fixed, **415 newly misrouted** — via
  two measured mechanisms: `sequencePlugin.accepts()` is true for 1351 of
  3158 fixtures, 270 of which are not sequence diagrams; and description
  (`:138`) before state (`:139`) moves 153 fixtures the jar calls STATE. The
  order is **load-bearing**, compensating for heuristic over-claim, not
  merely inverted. Batches 2–5 are superseded by the two entries around this
  one. Full diagnosis: `.agent-notes/T2-registration-order-halt.md`. Original
  filing text follows.
- ~~**`sequence-engine-overclaims-nested-diagrams`**~~ — original filing,
  superseded by the brief above. Found by
  `sequence-root-chrome`'s cross-engine manifest guard. `test-results/
  dot-cache/object/zuvila-56-nuda425/in.puml` is an OBJECT diagram (a `map`
  with a legend containing a nested `{{ }}` sub-diagram) and it renders as a
  document whose **only** `data-diagram-type` is `"SEQUENCE"` — the sequence
  plugin claims the whole source. Symmetrically, **70** of the 1141 fixtures
  filed under `dot-cache/sequence/` do **not** route to the sequence engine
  at all (sampled: two render `CLASS`, one `YAML`). So corpus classification
  and actual routing disagree in **both** directions, and the sequence
  engine's `accepts` (`src/diagrams/sequence/index.ts:36`) is the thing to
  read first. Same defect class as the fixed activity-vs-sequence
  registry-order bug in `.agent-notes/plantuml-sequence-group-empty.md`,
  where `activityPlugin` being registered first let it claim any sequence
  diagram containing a group. Not a rendering bug: every affected fixture
  renders, just through the wrong engine, so no gate catches it. Sized as
  small-to-medium; the risk is that fixing `accepts` moves fixtures between
  engines and therefore moves several diff baselines at once.

- **A5 json/yaml/hcl** — `wip (substantial; NOT at bar)` in mission-index and
  that is the honest label. `plans/a5-json-family-conformance/ledger.md`: M1a
  is the accepted Smetana layout delta (ADR-2b), M1b–M5 closed, M6 element
  tally 17 → 1 fixture. Byte-conformance is not the target for this family;
  what is left is the M6 singleton and any readability items. Low priority
  unless a user-facing json defect surfaces.
- ~~**S1L-i / S1L-j / S1L-e**~~ — **already DONE, rows corrected 2026-08-18.**
  All three closed inside `s1l-tail-fix` (F1-b `7e8d101c` for the multi-line
  display; codabo/nixura/xufexu conformant; description at 352/356 with only
  the 4 permanent exclusions). Their mission-index rows had never been
  flipped from `todo`/`wip`; nothing to plan here.
- ~~**`state-composite-inner-canvas`** / **`state-declared-size-fix`**~~ —
  **DONE 2026-08-18 (mission-index SI28 diagnosis, SI29 fix).**
  The halt stands (its premise was false); the survey it asked for is
  `plans/state-declared-size-diagnosis/` (**SI28**, closed), which gave each of
  the **94 mismatched fixtures** a `file:line` mechanism and re-partitioned
  them into **24 true-cause groups**. The fix mission it named,
  `plans/state-declared-size-fix/` (**SI29**, closed, branch
  `fix/state-declared-size`), executed all 5 batches: **74 harness rows went
  exact**, corpus **2481 → 2555 exact** declarations, mismatched 144 → 62,
  unmatched fixtures 4 → 0, `size-backlog.json` 91 → 63 entries, DOT EQUAL
  state 268/268. Two rows grew, both ruled and journaled. Full scoring:
  **`plans/state-declared-size-fix/findings/CLOSE-OUT.md`**.
  **What is left here, in the order to pick it up:**
  - ~~**`creole-exposant-port`**~~ — **DONE 2026-08-19 (mission-index SI30,
    branch `feat/creole-exposant-port`).** `CommandCreoleExposantChange` +
    `FontPosition` ported through klimt core and the description, class and
    state text emitters; `juvagu-33`'s ruled grown row (`s1 width idx1`,
    83.57 px) is **exact**, and the three authored fixtures
    (`exposant-01-class`, `exposant-02-usecase`, `exposant-03-state`) match
    their oracles. Close-out: `plans/creole-exposant-port/README.md`.
    **What it did not cover:** sequence/activity/WBS creole (`<sup>` stays
    literal there — no creole pipeline, D6), `TileText` (unported, no
    consumer), `<math>`/KaTeX (D6), and T5's documented ~0.667 px sup/sub
    baseline residual (`renderer-box.ts#runBaseline`).
  - ~~**the follow-on fix batch**~~ — **DONE 2026-08-19 (mission-index SI31,
    branch `fix/state-residual-fix-batch`).** All five diagnosed fixes
    landed (G20a, G20b, G21, G17, G5) plus G15 (joined mid-mission,
    reclassified out of `docs/graphviz-issues/15-*`). **13 of 16 target rows
    exact**; 3 stayed open with a jar-cited or hypothesis mechanism
    (`pavuzo-79-zodu430` — dot-engine defect, filed
    `docs/graphviz-issues/17-ortho-xlabel-canvas-reservation-short.md`;
    `jetuse-93-gopi146` — G21 structurally inert, hypothesis journaled;
    `kejabo-83-vinu490` — dot-engine order-invariant on this graph,
    hypothesis journaled, G20a's fix kept anyway per D5's flat-net rule).
    Full scoring: `plans/state-residual-fix-batch/README.md`'s "Close-out
    (2026-08-19)" section. **What it spun out, in the order to pick it up:**
    - ~~**retire the T5 ink-only-clip divergence**~~ — **DONE 2026-08-19
      (mission-index SI32, branch `fix/state-anchor-clip-retire`).** T2
      ported `DotStringFactory.solve`'s edge loop at its true scope — per
      graphviz layout result, clipping at construction
      (`state-composite-pass.ts:370`, `layout.ts:178`) — so the ink walk and
      the renderer now read the same clipped `TransitionGeo.points`; the old
      `DIVERGENCES.md` entry was deleted (T3) because its premise (renderer
      draws unclipped, ink walk clips) is now false. T3 filed a NEW, narrower
      divergence in its place: `DIVERGENCES.md` under "State diagrams" —
      this port always clips against the raw `result.clusters` box, but
      upstream adjusts that box first for composites with a direct
      border-point child (`SvekEdge.java:660-663` →
      `Cluster.java:410-430`'s `FrontierCalculator`); reachable on exactly
      2 of the 41 moved fixtures (`pesita-10-dene726`/`AA`,
      `viroxo-69-fito663`/`comp1`), both still moving toward the jar under
      T2's clip, `pesita` retaining the largest residual spot-checked this
      mission. Porting `FrontierCalculator` is unscoped (candidate below).
    - **port `FrontierCalculator`'s border-point clip-rect adjustment** —
      `Cluster.java:410-430` (`manageEntryExitPoint`, called from
      `SvekEdge.java:660-663` before the `:671` clip). This port's state
      clip (`state-transition-clip.ts`) always uses the raw graphviz cluster
      box; upstream reassigns it for composites with border-point children,
      gated by `ClusterDotString.java:101-105`
      (`entityPositionsExceptNormal().size() > 0`). Reachable on 2 fixtures
      today (`pesita-10-dene726`, `viroxo-69-fito663`); see the
      `DIVERGENCES.md` "State diagrams" entry filed by SI32 T3 for measured
      rect deltas. Unmeasured: what the adjusted rect would do to the clip
      *result*, not just what the rects are. Second port of upstream
      arithmetic (`FrontierCalculator` itself, not just its call site) —
      scope it as its own task before starting.
    - **port `alignEdgesAtLabelNodes`** — `svek/DotStringFactory.java:461-463`
      runs it between the clip loop and `manageCollision`, gated on
      `DotSplines.ORTHO`; it collects nodes whose entity name starts with
      `transition_` and aligns edges through them
      (`DotStringFactory.java:475-508`). Unported anywhere in this repo.
      Relevant because state's `linetype ortho`/`polyline` path is where
      SI31 left `pavuzo-79-zodu430` open — **but SI31 attributed that
      residual to a dot-engine canvas-reservation gap
      (`docs/graphviz-issues/17`), and the relationship between the two is
      UNEXAMINED — do not assume they are the same mechanism.**
    - **port `manageCollision` for the state engine** — ported for the class
      engine only, at `class-edge-label-anchor.ts:199` (from
      `SvekEdge.java:1205-1216`). State has no equivalent pass. Whether
      state needs it is not assessed here.
    - **`pavuzo-79-zodu430`** — consume the dot-engine fix for
      `docs/graphviz-issues/17-*` once the engine ships a corrected ortho
      `xlabel` canvas reservation (currently ~1.58pt short of native
      graphviz on byte-identical input).
    - **`jetuse-93-gopi146`** — verify T3's nested-cluster sizing hypothesis
      against a controlled native-`dot` A/B before filing as a dot-engine
      issue (D6: journaled, not chased, until then).
    - **`kejabo-83-vinu490`** — verify T6's order-invariance hypothesis with
      a clean, non-confounded A/B (same label-emission mode — `xlabel` vs
      `label` — on both sides) before filing.
    - **`oracle/goldens/state/size-backlog.json`'s five G5 ceilings**
      (`pacami-67-dafe414`, `tofezi-64-koda860`, `xojudi-20-keco020`,
      `decede-10-buvu414`, `gokife-89-boja382`), still pinned at ~0.013888
      each though the declared-size row they bounded closed — tighten or
      delete, never loosen.
    - **T3's two stale doc comments** (`state-composite-pass-types.ts:46`,
      `state-transition-label.ts:207,372`) still describe the pre-G21 world
      ("outside this task's write-set") — correct or hand on in a dedicated
      pass.
  - **DOT emission-order divergence** — un-filed. Our DOT declares
    nested-cluster siblings in a different relative order than the jar
    (`bemena-23-zebu249/svek-2.dot:10-11`); this is what forced D4's amendment
    to sorted pairing. SI31/T6 fixed the SAME class of divergence for the
    two composite passes only (`state-composite-pass.ts`,
    `state-composite-autonom.ts`, matching jar's `[*]`-on-first-reference
    creation-tick order) and confirmed it did NOT close `kejabo-83-vinu490`
    for an unrelated reason (dot-engine order-invariance). The **top-level**
    pass is still untouched: jar's outer `svek-2.dot` declares
    `NotShooting, [*], Shooting`; this port still emits
    `NotShooting, Shooting, __initial__`. A real candidate mission, not a
    nicety.
  - **small, unowned** — G9 explicit-composite marker on `State`
    (`state-parse-state.ts`), state note table-grid drawing,
    `Transition.linkNoteColor`, state parser line tracking for
    `DiagramRefusal.line`, the dead `insideAutonomPass` flag.
  - **unresolved with a nextStep** — G16 (`jijuze-43`), G13 (`nimana-36`,
    `bunade-42`, `nimise-04`).
  - **G14 stays deliberately unscheduled** — 30 records / 27 fixtures, every
    row ≤ 0.005 px (`graph-layout.ts:189-194`); 69 of SI29's 99 remaining
    rows are this band. Blast radius is every graph diagram type.
- **`usymbol-ink-rule` residual** — `cacoma-43-poxu615` exact on height and
  every shape, 1px wide. Named in the mission's Outcome; unowned.
- **`class-edge-spline-conformance`** — CLOSED 2026-08-08 by maintainer
  decision, no fix (jar's 2dp control-point quantization,
  `.agent-notes/class-edge-spline-2dp-quantization.md`). Do not reopen.
- **`plans/future/theme-through-dot.md`** — collapse the layout/style two-pass
  split. Explicitly gated on "the port is faithful first". Not now.

## 6. Mission-index rows still open (no brief yet)

From `planning/mission-index.md`; each warrants `/plan-mission` when picked:

- **G5 (sequence / activity SVG conformance)** — the next *depth* pass, and
  the largest unowned tranche: neither type routes through dot-engine, so
  there is no DOT gate and no `svek-N.dot` oracle. **Sequence's half of E4 is
  now answered, not open**: `sequence-oracle-harness` (§3 above, mission-index
  SI33) built and committed the SVG-structural oracle — corpus, diff-baseline
  ratchet, cause census — by extending the existing DOT-less `svg-conformance`
  family (D1), the same decision the json/yaml/hcl family already made.
  Activity's half of E4 is still genuinely open. G5 itself (driving those
  ratchets toward conformance) is unstarted work, distinct from the harness
  that now exists to measure it.
- **E1** full skinparam → theme wiring (`plans/skinparam/` exists as an older
  brief; re-scope against what S1L-h/S1L-g/G-series already wired).
- **E3** CSS class names on SVG (`puml-*`).
- **F1** Markdown integration; **F2** dot-engine npm cutover (pinned tarball
  → published release; `1.5.0` shipped `ClusterGeometry.label` 2026-08-15).
- **Phase C/D** shared infra + new diagram types: SI2 `datetime` (→ Timing D1,
  Gantt D4), SI3 railroad (→ EBNF/Regex), SI4 golem grid (→ Flow; eval
  Salt/Wire); D2/D3 mind-map/WBS (S3 spike first), D5 nwdiag, D6 gitgraph
  (Smetana consumer — dot-engine + named delta, per the 2026-08-09 ruling),
  D8 DITAA, D9 Chen EER. Breadth only after the depth passes above.
- **S3** stub-engine authenticity audit (spike; gates D2).

---

## Done since 2026-07-04 (older)

Recorded so nobody re-plans them from the old text.

- **Text measurement** — `WidthTableMeasurer` + deterministic oracle
  (S1/S1i, ADR-001); G5 measurer calibration proved 0.000% mean error.
- **Preprocessor** — complete (`!include`, `!define`, `<style>` extraction).
- **Skinparam / theming** — global wiring complete; per-element font/min-width
  cascades (S1L-h, S1L-g); stereotype-scoped and `<style>` cascades landed
  in G2/G4.
- **Scoped `<style>` blocks + business variants** (the old "Mission 5") —
  shipped: hierarchical `parseStyleBlock` in `src/core/skinparam-style-block.ts`
  (mirrors `StyleParser.java`'s tokenizer), per-element `resolveElement*`
  lookups threaded through the description sizer and renderer; business
  actor/usecase `:x:/` and `(x)/` parsed by
  `description/command-table-shorthand.ts` (`actor-business`,
  `usecase-business`).
- **LaTeX** (the old "Mission 4") — E2r L2 (2026-07-15): `<latex>` renders via
  KaTeX, **structural-only, permanent `DIVERGENCES.md` entry, maintainer-
  approved**. `phases.md`'s "out of scope" is superseded.
- Everything in `plans/` dated after 2026-07-04 — the G-series (G0–G8), the
  A/S1L family, `si*` shared-infra, `a2s`, `object-close`, `composite-state-dot`,
  `namespace-cluster-box`, `transition-label-ink`, `usymbol-ink-rule`,
  `constant-single-owner`, `svg-output-size-reduction`. Their READMEs carry the
  outcomes; `mission-index.md` carries the row flips.
