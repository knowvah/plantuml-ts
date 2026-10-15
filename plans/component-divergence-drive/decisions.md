# Architecture decisions (pre-made, approved 2026-10-14/15)

Do not re-argue these. A Java reading that contradicts one is stop 3.

## D1 — Exit bar

The mission is done when all five hold at the T11 re-measure:
1. Component conformant ≥ 100 (b0: 69).
2. Every row that sits at 1–3 census diffs at b0 (30) is either pinned in a ratchet or has a
   `fixtures.md` ledger line with a mechanism (Java + port `file:line`).
3. The component census Σ diffs (DeterministicMeasurer) is ≤ 60% of the b0 Σ.
4. 0 conformant losses in any of the 28 engines at every close.
5. 0 unexplained rises. A rise with a stated mechanism is allowed
   ([[weightedscore-can-rise-on-a-correct-fix]]).

If the bar is missed after T11, T12 still runs. The shortfall goes to next-missions with mechanisms,
not guesses.

## D2 — Measurement

Each close measures four things:
- the survey of all engines (`measurements/chain.sh`), diffed by `diff-eng.mjs`
- the census per-row diffCount (`npx tsx scripts/svg-conformance-census.ts component --json`, and
  `--families` for the family histogram)
- `layoutEqual` from the survey
- a render-diff (`npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`) for
  every named fixture in `fixtures.md`

Every census rise needs a mechanism. Before calling one a regression, check whether it comes from
pre-existing @id/childCount pairing: a fix that adds a jar element can re-pair siblings
([[comparesvg-count-not-monotonic]], [[census-away-from-jar-catches-hidden-regressions]]).

## D3 — Two parallel tracks

| Track | Order | Main write-set |
|---|---|---|
| Geometry | cluster box (T1b→T2) → canvas/margins/dpi (T4) → text x/y (T6→T7) | `renderer-cluster.ts`, `layout.ts`, renderer chrome |
| Colour | fill/stroke singletons (T1c), then stroke-width/rx-ry (T10) | `renderer-entity*.ts`, theme/stereotype resolution |

The colour track must never write `renderer-cluster.ts` or `layout.ts`. If a colour mechanism lives
there, re-slot it to the geometry track.

## D4 — Ratchet eligibility reads per-type survey files

- The description golden ratchet's eligibility (`description.golden.ratchet.test.ts:73,185-207`),
  `oracle/goldens/svg-description/README.md` (Add rule) and `measurements/pin-description.mts` read
  `tests/oracle/svg-conformance/parity-<type>.json` and its tightened `dotEqual`. They stop reading
  the legacy `parity.json` (2026-09-21, stale).
- The ratchet's types extend from component/usecase to the `unknown` rows whose routing-baseline
  `ourType` is `DESCRIPTION`, and to `c4`. dsw left 56 conformant unknown-DESCRIPTION rows and
  2 conformant c4 rows with no byte-exact home.
- The 10 rows dsw skipped (`plans/description-svek-wrappers/measurements/b4-pin-dryrun.txt`) are
  re-tried under the new eligibility. Each that still cannot be pinned is ledgered with its reason.

## D5 — Core edits are pre-authorized when the mechanism lives in core

A task may edit `src/core/**` only when its diagnosis artifact puts the origin `file:line` in core.
- **Guards** (all must stay green; a red one is stop 7):
  - `tests/oracle/svg-conformance/{class,object,state}.golden.ratchet.test.ts`
  - `tests/oracle/{class,object,state}-dot-parity.test.ts`
  - `tests/oracle/wrapper-parity*.test.ts`
  - `tests/oracle/svg-conformance/layout-parity.ratchet.test.ts` (469)
- Journal each core edit with its guard run.
- **Forbidden:** dot-engine (`node_modules/@knowvah/dot-engine`, `~/git/dot-engine`), the plantuml
  fork, the oracle jar, cached oracle bytes (`test-results/dot-cache/**`, `oracle/dist/**`).

## D6 — Diagnosis precedes every geometry fix

- Geometry families (cluster box, canvas, text x/y) get a **read-only diagnosis task**. Its output
  is the artifact from `~/.claude/rules/diagnosis.md`: mechanism, origin `file:line`, causal chain,
  ruled out. It also names the rows each mechanism explains.
- The fixer is briefed with the artifact, not with a conclusion of its own
  ([[agents-correct-the-orchestrator]]).
- Colour singletons go straight to a fixer. Each row still needs its mechanism stated before its edit.

## D7 — Mirror the jar

- What the jar draws, we draw, and nothing it doesn't ([[always-mirror-the-jar]]).
- deroxu's `skinparam dpi 60` scale and its missing title are in scope (T4).
- kermor group-note drawing is in scope (T5).
- Leftovers go to `planning/next-missions.md` with mechanisms, owned by the T12 exit.

## D8 — Verify the engine before any layout-side fix

Before any fix that touches layout geometry, edges, labels or cluster boxes:
1. Read `docs/graphviz-issues/TRACKER.md` and `measurements/tracker-ledger.md` (T0b) for the
   fixture's family.
2. Run native `dot -Tdot test-results/dot-cache/<tree>/<slug>/svek-1.dot` and compare it with our
   builder-graph dump (`.agent-notes/dot-engine-2.4.0-bump.md`, "dump our builder graph as DOT"),
   or with layoutParity.
3. If dot-engine is to blame, that is stop 11: file the issue per the TRACKER convention and halt
   that family.

Known reclassifications ("ours, not dot-engine", proven with native `dot -Tdot`): 09, 11, 12, 15,
18, 20 and 21.

- **#14 (the trap):** package titles draw at a fixed `USymbolFolder` local offset
  (`USymbolFolder.java:228`), not at the engine's `cluster.label` position. Wiring the engine label
  position once cost 333 shapes. Never consume `cluster.label` for drawing.
- **#16:** the xlabel consumer has landed; pavuzo is the residual.
