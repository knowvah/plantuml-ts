# Next Missions (in order)

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

## 4. Named, briefed or diagnosed — pick from here after 1

Ordered by how ready they are, not by size.

- **`dispatch-by-parse-attempt`** — NEW 2026-08-23, deferred out of
  `sequence-engine-overclaims-nested-diagrams` by maintainer ruling (that
  brief's D2). Upstream decides diagram ownership by **attempting the parse**
  and taking the first factory that succeeds (`PSystemBuilder.java:258-266`);
  this port decides by regex `accepts()` heuristics. That is the structural
  divergence behind the whole misroute class. Blocked on a prerequisite, which
  is why it is separate: **our parsers are permissive**. Fed the object-diagram
  source that triggered the original bug, `parseSequence` returned a populated
  AST (2 participants, 1 event) rather than failing, because it skips
  unrecognised lines; upstream's equivalent fails because every line must match
  a registered `Command`. So this mission must first give ≥13 engines strict
  unrecognised-line handling, which changes error behaviour everywhere. Large,
  and worth doing — it would delete the heuristics rather than tune them.
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

## 5. Mission-index rows still open (no brief yet)

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
