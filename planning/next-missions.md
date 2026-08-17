# Next Missions (in order)

**Refreshed 2026-08-16 (evening, after SI24).** Treat this file as the *ordered, human-readable*
what-next; `planning/mission-index.md` is the executable grind queue with exit
bars and measurements, and `plans/<name>/README.md` is the brief for anything
with a name. **When they disagree, the brief and the tree win — verify before
repeating a status from here.**

This file has now gone stale twice in six weeks — the 2026-07-04 version listed
two shipped missions as "not started", and the 2026-08-15 version was out of
date within a day (both of its top two entries landed on main that same
evening). Verify against `git log` and the tree before acting on any line here.

Standing corpus signals, **measured at SI24's close-out 2026-08-16** on a clean
tree at `cb4de5c7` (not carried forward from a previous refresh):
`shape-match-report.ts` **785 doc-size-exact / 26,255 matched-shapes** of 1,074
fixtures. DOT EQUAL **class 705/711 · state 266/268 · component 259/263 ·
usecase 92/93 · object 78/80**. `label-size-backlog` totals **11** (class 5 ·
description 4 · state 2 · object 0). svg-state ratchet 59 pins; svg-class
ratchet 315 pins; **14,492 tests** across 595 files, coverage
95.37/90.35/96.93/96.46.

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

**Follow-ons it names (none started):**

1. **T4 step 3 — per-line magic-arrow SVG glyphs in class** (`gobuco`,
   `lapoma`): DOT boxes are exact at 29x54; the SVG draws no per-line glyph.
   Needs `EdgeGeo` in `src/diagrams/class/class-geo-types.ts` extended (a
   `labelLines` glyph slot or `arrowGlyphs[]`) plus `class/renderer-edge.ts`.
   Stopped on write-set, not difficulty — a one-task follow-on.
2. **Arrow-label font COLOUR** — `camuna` (`<style> arrow { FontColor Blue }`),
   `ticuxa` (`skinparam ClassArrowFontColor`) still draw `fill="#000000"`;
   D3's cascade carries family/size/style only. `resolveArrowLabelFont` is the
   seam. Not in any backlog (size-only).
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

## Unowned, and it is a live trap: `.claude/catalog.md` does not exist

`CLAUDE.md` tells every agent "**Check before implementing anything**; agents
routinely rebuild what exists" and points at `.claude/catalog.md`. **That file
is not in the repo** (verified 2026-08-16), and `.claude/` is gitignored, so
anything written there would never commit. A rule pointing at a nonexistent
file is exactly the stale-premise failure this mission line keeps paying for —
three premises went stale inside SI23 alone.

Either create a committed catalog somewhere that is not gitignored, or delete
the rule. SI23's own new public surface is recorded in its brief instead:
`computeQuantifierBox`, `computeMergedLabelBox`, `applyVisibilityIcon`,
`applyGuillemet`, `parseMagicArrowLabel` (all `src/core/edge-label-box.ts`),
`computeCardinalityFontOverride` (`src/core/style-cascade-class.ts`),
`class-edge-label-lines.ts`, `scripts/label-box-triage.ts`. SI24's is in its
README close-out (item 7): `roseNoteDim`, `resolveArrowLabelFont`,
`computeArrowFontOverride`, `hasSeveralGuideLines`, `measureLinkNoteDim`,
`DescriptiveLink.linkNote`.

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

## 2. `shared-seam-extraction` — NAMED 2026-08-16, needs `/plan-mission`

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

## 4. Named, briefed or diagnosed — pick from here after 1

Ordered by how ready they are, not by size.

- **A5 json/yaml/hcl** — `wip (substantial; NOT at bar)` in mission-index and
  that is the honest label. `plans/a5-json-family-conformance/ledger.md`: M1a
  is the accepted Smetana layout delta (ADR-2b), M1b–M5 closed, M6 element
  tally 17 → 1 fixture. Byte-conformance is not the target for this family;
  what is left is the M6 singleton and any readability items. Low priority
  unless a user-facing json defect surfaces.
- **S1L-i / S1L-j** (description; mission-index Phase B, `todo`) — two small,
  fully-scoped sizing gaps: creole *titled* separators (`--title--` sizes the
  title, not the markup; 3 fixtures) and multi-line quoted display
  (`CommandCreateElementMultilines`; 2 fixtures). Sizer and renderer move
  together. Each is a half-day, not a mission.
- **S1L-e** (`wip`) — the container-cluster bucket, 47 → 13; the residue is
  ~5 genuine `computeContainerBbox`, 4 sprite, 2 creole `{{ }}` embedded
  sub-diagram (unimplemented subsystem, ledgered), rest misc.
- **`state-composite-inner-canvas`** — HALTED 2026-08-15; premise false
  (composite size is already a faithful `SvekResult#calculateDimension`
  port). Its T1 harness `scripts/measure-composite-declared-size.ts` is real
  and stays (2469/2642 exact after `transition-label-ink`). The remaining
  173 inexact composites have no diagnosis yet — a survey with that harness
  is the next move there, not a fix.
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
  there is no DOT gate and no `svek-N.dot` oracle. Blocked on **E4** (spike:
  decide an SVG-structural oracle vs eyeball QA). E4 is the real next
  decision once the svek family's residue is named.
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
