# Decision Journal — class edge-spline conformance

Append one row per non-trivial judgment call. "Non-trivial" means a
reasonable engineer might have chosen differently. Append during
execution; never rewrite an existing row.

Log here in particular:

- **The mechanism, once isolated** — `file:line`, the causal chain, and
  what was ruled out to get there. Per `~/.claude/rules/diagnosis.md` this
  mission is diagnosis mode from the first observed discrepancy: no fix
  before a stated mechanism.
- **Every other fixture whose output moves** when the fix lands. The
  spline code is shared, so a change here is not fixture-local — the
  class ratchet's other 312 pinned fixtures are the blast radius.
- **The disposition if the cause is in `@knowvah/dot-engine`** — the
  `docs/graphviz-issues/` entry and its `TRACKER.md` line, per CLAUDE.md.

| Date | Decision | Why | Flagged for review |
|---|---|---|---|
| 2026-08-08 | Mission opened. `bipudo-23-xavu432` un-pinned from `oracle/goldens/svg-class/ratchet.json` (313 → 312) by maintainer decision, so the size-reduction mission could land green. Documented in `oracle/goldens/svg-class/README.md`'s "Removed fixtures" table with the full measurement. | The gap is pre-existing (proven at `1d913189`) and unrelated to the size-reduction port, which only changed what the comparator could see. Blocking that mission on an unrelated sub-pixel layout gap would have been the wrong trade. **Deliberately NOT an accepted divergence** — no `oracle/accepted-divergences.json` entry — because this is a deferral with an exit condition, not a won't-fix. | no |
| 2026-08-08 | **T1 diagnosis: the jar's spline control points are 2-decimal; ours are full precision, and clipping amplifies the difference.** Origin is inside Smetana's layout — `SmetanaEdge#getPoint` reads `ST_pointf` straight through, `ST_pointf.x` is `double` (not float), and the jar's own node centre (31.575) disagrees with its own vertical-edge x (31.58). Our raw layout matches real graphviz 15.1.1 exactly. Proof: quantizing our points to 2dp reproduces all four of the fixture's splines byte-for-byte. Full artifact: `.agent-notes/class-edge-spline-2dp-quantization.md`. | The brief's leading hypothesis — `spline-clip.ts#simulateCompound`'s 1/256 granularity — is **wrong** and is ruled out: the divergence is already present in the UNCLIPPED control points 3 and 4, which clipping never touches. Worth recording because that hypothesis was mine and it was plausible. | no |
| 2026-08-08 | **No fix proposed, deliberately.** Blanket 2dp quantization at `graph-layout.ts:81` takes the oracle suites from 1969/1969 to **1961/1969** — it fixes this fixture and breaks eight other things, because that seam feeds node geometry as well as splines (`state-dot-parity` fails on node-size drift; seven fixtures regress across class/component/usecase). | 2 decimals may be the right quantity at the wrong place. Shipping it would trade one gap for eight regressions — the same trade already refused for the realization-edge gap. The blast radius was measured, not estimated. | no |
| 2026-08-08 | **Escalating the next question rather than drilling further.** Why Smetana quantizes at all is unresolved; the strongest candidate is vintage (CLAUDE.md records Smetana as a graphviz **2.38** transpile, our engine targets modern — local reference 15.1.1). If that is confirmed, the choice between matching the oracle's vintage and accepting a documented sub-pixel divergence is a product decision. | T1's contract was the mechanism plus the origin narrowed, and both are delivered. Continuing into a graphviz-version archaeology dig would exceed the task and pre-empt a call that is the maintainer's. | **yes — 2.38-vs-modern is the open question** |
| 2026-08-08 | **MISSION CLOSED by maintainer decision: no fix.** "We don't want compatibility with the Java port of graphviz. That port is years out of date with graphviz." The fixture is reclassified from a gap to an **accepted divergence** — filed in `oracle/accepted-divergences.json` (its first entry ever), `DIVERGENCES.md`, and the svg-class README. It stays un-pinned permanently; re-pinning is now explicitly wrong. | The ruling makes T1's open question moot: it no longer matters *why* Smetana quantizes, only that we are not matching it. This is the "incidental rendering — may improve, deliberately" case in CLAUDE.md, and following modern graphviz over a 2.38 transpile is the port doing its job rather than diverging by accident. | no — decided |
| 2026-08-08 | Recorded the harness's 0.01pt tolerance as **load-bearing**, in DIVERGENCES.md and in this mission's banner. | It is what absorbs the Smetana-vs-modern-graphviz gap for every other fixture. Left unstated, a future maintainer would read a hair-over-tolerance edge-geometry failure as a regression and go looking for a defect that is not there — which is exactly what happened at the start of this mission. | yes — expect more fixtures to cross it |
