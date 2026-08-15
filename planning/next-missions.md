# Next Missions (in order)

**Refreshed 2026-08-15.** The previous version of this file dated from
2026-07-04 and listed as "not started" two missions that shipped weeks ago
(scoped `<style>` blocks, LaTeX). Treat this file as the *ordered, human-
readable* what-next; `planning/mission-index.md` is the executable grind queue
with exit bars and measurements, and `plans/<name>/README.md` is the brief for
anything with a name. **When they disagree, the brief and the tree win — verify
before repeating a status from here.**

Standing corpus signals at refresh time (from the `transition-label-ink`
close-out, 2026-08-15): `shape-match-report.ts` **779 doc-size-exact /
25952 rigid-aligned shapes**; class DOT-parity 712/712; state 268/268;
svg-state ratchet 59 pins; svg-class ratchet 292+; ~14.3k tests.

---

## 1. Close out `edge-label-box-and-class-ports` — NOW

Brief: `plans/edge-label-box-and-class-ports/`. Dangling since 2026-08-14,
when its journal spun off `composite-state-dot` (→ `namespace-cluster-box` →
`transition-label-ink`, all since closed). Verified against the tree
2026-08-15, not just the README:

| Batch | README | Actual |
|---|---|---|
| 1 | `[x]` | done |
| 2 | T5/T6 `[x]`, T7 `[~]` | T7 blocked by a contradiction in the brief: exit-bar clause 1 wants `class-inheritance-interface-assoc` pinned in `oracle/goldens/svg-class/ratchet.json` (zero diffs), while batch 2's own watch-out predicts ~13 residual. Journal line 16 says "bar needs restating"; it never was. Fixture went 202 → 13. |
| 3 | T8/T9/T10 `[ ]` | **T8/T9 already landed** by SI17 / object-close (`class-port-rows.ts:210` sets `isPort`; `dot-sync-report --slug sokevu-87-toce485 class` shows the `:P` shields, the `sh0010->sh0011->sh0012 [arrowhead=none]` rank-chain and `constraint=false`; `structurallyEqual=true`, `maxSizeDeltaIn 0.0000`). But `sokevu` has **no `oracle/goldens/class/<slug>/` golden** — the batch's own watch-out says that leaves it unguarded. T10 (close-out) not done. |
| 4 | T11/T13 `[x]`, T12 `[~]` | Landed: `tobuka-93-jale775` 41 → 0 byte-exact (FIXEDSIZE tail/head reservation + node-dim precision). Checkbox never flipped. |

Remaining work, all small:

1. Pin `sokevu-87-toce485` as a class DOT-parity golden (`input.puml` +
   `svek-1.dot`, same shape as every other `oracle/goldens/class/<slug>/`).
2. **D7** (`decisions.md`): widen `tests/oracle/svek-dot.ts#parseEdges` from
   `hasLabel: boolean` (`:58,134`) to the label box dimensions, and *prove it
   discriminates* — disable emission, watch it fail — before trusting a pass.
3. Restate exit-bar clauses 1–2 honestly (13 residual on
   `class-inheritance-interface-assoc`, `jecici-56-bimu826` at 138 vs the 133
   target, unexplained) — name, do not fudge. Flip T7/T12 and the batch 3/4
   boxes.
4. Add the `planning/mission-index.md` row (the README says close-out creates
   it; none exists).
5. Journal summary; merge with a merge commit.

## 2. `note-leaf-model` — next new mission

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

## 3. Named, briefed or diagnosed — pick from here after 1–2

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

## 4. Mission-index rows still open (no brief yet)

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

## Done since this file was last written (2026-07-04 → 2026-08-15)

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
