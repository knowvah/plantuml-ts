# CLOSE-OUT — state-declared-size-fix (SI29), 2026-08-18

Final tree = branch `fix/state-declared-size`, tip `32ef2834` (29 commits off
main `285b7fd8`). Every number below is a command run at T20 on that tree, or
a cited `decision-journal.md` row.

## 1. The harness, vs SI28's ORIGINAL baseline

`npx jiti scripts/measure-composite-declared-size.ts --mismatched-only`
diffed with `scripts/harness-diff.py` against
`test-results/state-declared-size-baseline.si28.jsonl` (sha `b790fabc…505e0`).

| counter | SI28 baseline | now | Δ |
|---|---|---|---|
| fixtures | 272 | 272 | — |
| declarations | 2654 | 2654 | — |
| **exact** | **2481** | **2555** | **+74** |
| mismatched | 144 | 62 | −82 |
| last-digit-only | 29 | 37 | +8 |
| unmatched fixtures | 4 | 0 | −4 |
| dirty fixtures | 79 | 43 | −36 |

`harness-diff.py`: **74 rows went exact**, 74 of the 173 baseline keys are
absent from the run entirely, 99 rows remain, **2 rows grew** — both ruled and
journaled, nothing else appeared or grew.

**Rows now, by band.** 99 rows over 61 fixtures; **30 rows above 0.005 px**,
the other 69 are the G14 sub-pixel band SI28 deliberately left unscheduled.

### The two grown rows (ruled exceptions, not regressions)

1. **`juvagu-33-dupa212` scope 1 / width — 27.569 → 83.569 px.**
   Human ruling **(a)** at the batch-2 gate (journal). T6's tab-stop port is
   correct (jar's `in.svg` draws the superscript at x=68 = stop 56 + margins),
   but `<sup>`/`<sub>` are unported anywhere: `CommandCreoleBuilder.java:104-105,111`
   registers `CommandCreoleExposantChange`, which sets `FontPosition`
   EXPOSANT/INDICE on `FontConfiguration`; our `FontConfiguration.ts` has no
   `fontPosition`, so the literal `<sup>1</sup>` (89.69 px) now sits after a
   correct 56 px advance. 56 + 6.119 + 20 = 82.119 = jar's box exactly — the
   whole growth is that one gap. Ratchet loosened once, 0.489844 → 1.160677,
   with that account in `_doc`. Follow-on mission `creole-exposant-port`.
2. **`fovafu-44-mifu394` scope 2 / width — 7.714 → 7.820 px.**
   Two journaled steps: T5/G10's re-applied patch under ruling (a)
   (−4.18 px, height unmasked), then T8, where the same scope's **height went
   exact** (−11.00 → 0) and the width moved to +7.82. T8's mechanism: our
   cluster/leaf/anchor geometry now matches jar's `in.svg` exactly; the whole
   7.82 px is `@knowvah/dot-engine` ranking the `zaent0001` point anchor on
   its target's rank where graphviz pins it to the cluster border (jar edge
   leaves at y=88.19 = cluster top; ours y=112). Filed as
   `docs/graphviz-issues/15-cluster-anchor-point-ranked-with-target.md` +
   TRACKER line. Its DOT-parity ratchet **tightened** 0.1666 → 0.1086 — this
   is an engine delta, not a port regression. Orchestrator applied ruling (a)
   by extension and flagged it for veto.

Both are the one journaled exception to D4's shrink-only rule; the baselines
were re-pinned once with them.

## 2. The manifest

`npx jiti scripts/render-manifest.ts` (2014 fixtures) vs
`test-results/render-manifest-baseline.si28.json` through `manifest-diff.py`:

> **`OK: 63 expected moves, 0 unexpected`**

**Every moved fixture is attributable to a task** through
`expected-moves.txt`'s per-task sections (T2 ×4, T3 ×6, T4 ×1 + 5 general
note-on-link, T5 ×6 + 4 general dotted-leaf, T6 ×22 + 4 general `**bold**`,
T7 ×1, T8 ×9 + 3 general nested-cluster, T9 ×7 + dapunu-39, T10 ×1).
**No unattributed move.** Eleven slugs listed as expected did not move
(`fokudo-49`, `mocoda-55` — their only backslash is escaped `\\`; `corumi-91`,
`gupeto-19` — `<math>`, inherent exclusion; `pacami-67`, `tofezi-64`,
`xojudi-20`, `decede-10` — G5 deferred; `nimana-36`, `bunade-42`, `nimise-04`
— G13 did not close). Not-moving is not a failure of the gate.

## 3. Per task

| Task | commit | targeted | rows exact | residual (mechanism) | ratchets | manifest |
|---|---|---|---|---|---|---|
| T0 | `99dc5616` | harness gates | — (baselines pinned identical to SI28) | — | — | baselines pinned |
| T1 | `99e87a10` | D1 seam `creole-text-lines.ts` | — (enabler) | — | — | 0 |
| T2 | `2b0233a8` | G7 (+G9) | bujuta-44 16/16, mimaga-15 16/16, nijugi-19 4/4, rinisi-79 16/16 | **bitaxo-18 1 row (9.9999 px)** — G9 reverted: our AST discards "declared with `{`", jar keeps a childless group at 50×50 (`GroupMakerState.java:113-114`); needs an explicit-composite marker on `State` | 4 size-backlog removed | 4 |
| T3 | `71d1ecd7` | G3 `ReadFilterMergeLines` | duzazu-41, vixobo-14, fibudu-53 | — | — | 6 |
| T4 | `2b00b675` | G12 note-on-link | tumaba-64 | — | 1 removed | 6 |
| T5 | `e0c9daaa` + `27fba715` | G24 guards, G10 dotted id | cagego/xacona/zecivu/fugedo refuse on both sides (unmatched 4 → 0); tubojo-49, fovafu-44 #a | fovafu-44 #b unmasked (see §1) | tubojo removed, fovafu pinned 0.166613 | 10 |
| T6 | `a022316a` | G1 + G8 + G23 (22 fixtures) | 18/22 exact | lokija-02 last-digit; **corumi-91, gupeto-19** unchanged (`<math>`, unported — inherent); mosigo-88 scope-2 propagation; juvagu-33 (see §1) | 16 removed, lokija/mosigo tightened, juvagu loosened once | 26 |
| T7 | `0647995f` | G2 note bodies | fatupo-62 (2 axes), xeziki-47 (4 axes) | — | 2 removed | 2 |
| T8 | `be193177` | G4 clusterPosMap | bajelo, cupesu, lojeju, nuvura, darime, lumamo, giniti closed (exact or last-digit) | **jetuse-93 width 5.000 px**, **fotuje-06 0.393 px** (push-forward, journaled) | 13 tightened, 3 deleted | 12 |
| T9 | `26fd56ce` | G5 + G6 ink extent | pebepi/taxile/tigibi 1.34 → 0.0025 px; dapunu-39 −2.03 → +0.0013 | **G5 deferred**: `RoundedSouth.drawU` early-returns on transparent `southBackcolor` (default skin, `plantuml.skin:266-271`); `StateNodeGeo` carries no resolved colour to gate it. pacami/tofezi/xojudi/decede unchanged (4 rows ≈1 px) | — | 8 |
| T10 | `86be3648` | G11 `\|\|` orientation | fimivu-15 12/12 | — | 1 removed | 1 |
| T11 | `a133cd0d` | G13 label position | none — record `unresolved` | nimana-36 / nimise-04 share a byte-identical −3.836 px, bunade-42 −0.164; a fixed content-independent jar term past `InnerStateAutonom.calculateDimensionSlow()` | — | 0 |
| T12–T19 | `0fb1852d` `2054fe9c` `2bc5fa81` `de183ae0` `156a3ac2` `9601e982` `9014c159` `2f1dfd49` | Batch 5 re-diagnosis (docs-only, D6) | — | see §4 | — | 0 |

Batch-close commits: `6fd971de` (batch 1), `9c2e7110` + `7bd2cbdd` (batch 2),
`62fc836e` (batch 3), `db392b1d` + `3d3b28f4` + `a14bce0b` + `32ef2834`
(batches 4/5).

## 4. Batch-5 groups (re-diagnosis, D6 — no `src/` edits)

| Group | fixtures | status | outcome |
|---|---|---|---|
| G15 cluster-header ink | rovese-43, zoriza-41, zizemo-86 | `already-conformant` | closed incidentally by **T8** |
| G22 dapunu residual | dapunu-39 | `already-conformant` | closed incidentally by **T9** |
| G19 nested-wrapper margin | fovafu-44 | `resolved` | engine-side — `docs/graphviz-issues/` issue 15 |
| G20 linetype routing | kejabo-83, pavuzo-79 | `resolved` | **two** ours-side mechanisms, each with a proposed fix: G20a pseudo-node declaration order (`state-composite-autonom.ts:215-216` vs `StateDiagram.java:92-107`); G20b `graph-layout-build-edges.ts:129-176` never forwards `xlabel` |
| G17 note-only region | joleju-94 | `resolved` | `regionInkGeometry` canvas fallback +12 vs jar's `.delta(15,15)` (`state-composite-concurrent.ts:139-140`) |
| G18 single-node autonom | gokife-89 | `resolved` | reclassified **into G5** (RoundedSouth south cap, opaque LightYellow) |
| G21 DOT-identical geometry | zacajo-09 | `unresolved` (mechanism named) | `state-composite-concurrent.ts:235` bare `newAccumulator()` → labels never get `inkBox`; likely also `jetuse-93` |
| G16 region leaf margin | jijuze-43 | `unresolved` | clean 1 px width term; nextStep `Cluster#drawU` / `UEmpty` |
| G13 label position | nimana-36, bunade-42, nimise-04 | `unresolved` | nextStep in the record; T11 ruled out self-loop, dot-engine, declaration order, measurer precision |

**Schema check.** SI28's `check-schema.py` copied beside the records and run:
**`14 records, 0 violations`** (9 files, `partition.json` covering 14 slugs).

## 5. Ratchets and gates on the final tree

| gate | result |
|---|---|
| `npm test` | **608 files / 14670 pass** (1 todo), **54.8 s** wall-clock |
| coverage | 95.41 / 90.34 / 96.93 / 96.50 — ≥ 90/90/90 |
| `npm run typecheck` / `lint` / `build` | green at the batch-4/5 gate (journal); tree unchanged since |
| state DOT-parity | **268/268 EQUAL** (269 tests incl. the meta assertion) — README stop 5 wants ≥ 266 |
| class DOT-parity | 720 tests pass — unchanged |
| description parity ratchet | 356 tests pass — unchanged |
| object DOT-parity | 80 tests pass — unchanged |
| svg-conformance state goldens | **60** fixtures, 62 tests pass — same as main (rise-only, D5: no rise this mission) |
| `oracle/goldens/state/size-backlog.json` | **91 → 63 entries** (−28) |
| `tests/architecture/layering.test.ts` | green, `KNOWN_DEBT = []` (batch gates) |

SI28's close-out recorded 601 files / 14,599 pass at 95.41/90.40/96.93/96.50
but **no wall-clock figure**, so there is no prior number to compare 54.8 s
against. +7 test files / +71 tests this mission; branch coverage −0.06 pp.

## 6. Follow-ups (all from the journal)

**Named missions**
- **`creole-exposant-port`** — `<sup>`/`<sub>`: register
  `CommandCreoleExposantChange` in `CommandCreoleBuilder.ts`, add
  `FontPosition` to `FontConfiguration.ts`, mute font in `AtomText`, baseline
  shift in each engine's text emitter. Closes juvagu-33. Core + multi-engine:
  the reason it was not done in-mission.

**Follow-on fix batch (Batch 5's resolved records carry the write-sets)**
- **G20a** pseudo-node declaration order — `state-composite-autonom.ts:215-216`
- **G20b** `xlabel` never forwarded — `graph-layout-build-edges.ts:129-176`
- **G21** accumulator without a measurer — `state-composite-concurrent.ts:235`
  (likely also closes `jetuse-93`)
- **G17** region canvas margin 12 vs 15 — `state-composite-concurrent.ts:139-140`
- **G5** RoundedSouth south cap — needs a resolved-colour signal on
  `StateNodeGeo` to gate the +1 on non-transparent `southBackcolor`; now
  **5 fixtures** (pacami-67, tofezi-64, xojudi-20, decede-10 + gokife-89
  reclassified by T18)

**Smaller, unowned files**
- **G9 explicit-composite marker** on `State`
  (`state-parse-state.ts` / `state-commands-declarations.ts`) — closes bitaxo-18
- **state note table-grid drawing** (T7) — rows size exactly but draw as cells
  joined by two spaces; needs a per-cell slot on `StateTextLine`
- **`Transition.linkNoteColor`** (T4) — `fotigo-12`'s `#red`/`#blue` link notes
  still draw default-filled
- **state parser line tracking** (T5) — `DiagramRefusal.line` is `undefined`,
  so the banner lands on the last line, not D2's "real line"
- **`insideAutonomPass` dead flag** (T8) — field in
  `state-composite-pass-types.ts`, no reader

**Unresolved, with a nextStep in the record**
- **G16** (jijuze-43) and **G13** (nimana-36, bunade-42, nimise-04)

**Deliberately unscheduled**
- **G14** — 30 records / 27 fixtures, every row ≤ 0.005 px
  (`graph-layout.ts:189-194`); 69 of the 99 remaining rows are this band.
  SI28's reasoning stands: its blast radius is every graph diagram type.

**Filed**
- `docs/graphviz-issues/15-cluster-anchor-point-ranked-with-target.md`
  + TRACKER line (T8).

## 7. Flags for the maintainer

1. **Three grown-row rulings.** Two by the human at the batch-2 gate
   (`juvagu-33`, `fovafu-44` #b), one applied **by the orchestrator by
   extension** at T8 (`fovafu-44` scope-2 width, engine-side, ratchet
   tightened) — flagged in the journal for veto.
2. **D4 was amended in-mission** (T0, README stop 8, human option (a)):
   pairing stays SORTED. Candidate B's declaration-order pairing swaps sizes
   between real nodes because our DOT declares nested-cluster siblings in a
   different relative order than the jar
   (`bemena-23-zebu249/svek-2.dot:10-11`). **That emission-order divergence is
   itself an un-filed candidate mission.**
3. **T4 wrote one field outside every write-set** —
   `TransitionGeo.label.noteLines?` in `state-geo-types.ts` (additive
   optional; alternative was an `as` cast). Journaled push-forward.
4. **T4's agent claimed byte-identical jar SVG** for the note-on-link
   fixtures; the orchestrator verified only that note-fill counts equal the
   jar's for 4 of 5. The whole-file claim is **not true** (lengths differ
   ~8 %).
5. **`measureNotePureText`** (T7) is exported but **not wired** — wiring it
   needs `state-dot-graph.ts`, outside T7's write-set. No fixture carries
   creole in a note-on-link today.
