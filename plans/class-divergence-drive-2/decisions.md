# Architecture decisions — `class-divergence-drive-2`

Confirmed 2026-09-24. **Locked**; amend and halt on contradiction (stop 3).
Java paths are under `~/git/plantuml/src/main/java/net/`.

## D1 — Diagnose first; groups are re-assigned from the diagnosis

**Context.** The five groups come from diff signatures and source features
(`measurements/b-plan.json`), not from Java traces; the prior ledger's
mechanism column predates that mission's fixes. Memory: agents briefed on a
conclusion inherit it; brief the measurement.
**Decision.** Batch 0 runs one read-only diagnosis agent per group (T1–T5,
parallel). Each writes a diagnosis artifact per fixture — mechanism, Java
`file:line`, TS `file:line`, ruled out, probe run. T6 re-groups
`fixtures.md` and writes the concrete write-sets of batches 1–4.
**Consequences.** Batch 1–4 task files carry a provisional write-set until
T6; T6 may split or merge fix tasks (planning, not an amendment).

## D2 — Structure before links before glyph before canvas

**Context.** `compare.ts` pairs elements positionally, so an id/order fix
must land before paint is measurable; canvas size is a function of every
drawn element's ink.
**Decision.** B1 (S singletons + D namespaces) → B2 (Q) → B3 (C) → B4 (R).
**Consequences.** R is measured last, on a tree where its neighbours are
already exact; an early canvas fix cannot be re-broken later.

## D3 — The survey verdict is the score; the ratchet is the lock (carried)

Pin into `oracle/goldens/svg-class/ratchet.json` only a fixture that is
survey-conformant AND census 0-diff. A fixture credited by one path only is
journaled, not pinned.

## D4 — One re-pin per batch; every riser needs a mechanism (carried)

Re-pin `parity-class.json` and `ratchet.json` only in the batch's close
task, after `pin-diff.mts` against the previous close. Every rise,
`dotEqual true→false`, or conformant loss gets a journal row with its
mechanism before adoption (stop 5). New this mission: each close first runs
**one residual round** on the merged tree — re-render the batch's fixtures,
and fix any residual whose mechanism is already stated in `diagnosis/`
(prior mission: B6/B7 residual rounds each closed 9–20 more).

## D5 — The oracle stays pinned; the cache is not rebuilt (carried)

No `--rebuild` of `test-results/dot-cache/class`. T0 records the
`oracle/dist` symlink target and version. Repointing it versus `pin.json`
stays a maintainer step (`planning/next-missions.md`, "Oracle pin (D12)").

## D6 — R: fix the canvas at its origin; no epsilon

**Context.** Prior mission T35 found the canvas rule (`SvgGraphics
#ensureVisible`, `SvekResult#calculateDimension`'s `LimitFinder`,
`TextBlockExporter` margins) already ported in `layout-ink-extent.ts`; the
residual 1 px sits in a per-shape ink term.
**Decision.** Fix the ink term that is short, mirroring upstream's double
arithmetic. If the origin is dot-engine coordinate drift, file a
`docs/graphviz-issues/` entry and leave the fixture structural. No epsilon,
no rounding tie-break (stop 12).

## D7 — Q builds on the faithful `Kal` port

**Context.** Prior D6 ported `class-kal.ts` from `svek/SvekEdge.java:242-246,
540-562,1015-1019,1069-1077` and verified node sizes against `svek-N.dot`.
**Decision.** Every Q change cites the `SvekEdge`/`Kal` (or `Link`/
`LinkArg`) line it corrects. A structural rewrite of `class-kal.ts` is stop
11.

## D8 — Exit bar

All 62 core fixtures conformant or `mechanism + owner`; conformant ≥ 600;
diverged ≤ 61; zero unexplained rises; class DOT parity 711/712; other
engines unmoved or journaled. The 600 floor needs ~40 of 62 to close — some
groups may land in dot-engine.

## D9 — Stretch is batch 5, gated on the floor

Batch 5 (22 fixtures in identical-signature pairs) runs only if T18
measures conformant ≥ 600. T18 then writes its task files from a quick
per-pair diagnosis; otherwise T18 files the pairs in `next-missions.md`.

## D10 — Execution mechanics

Worktrees for parallel tasks; prior tools reused in place (not copied);
`fixtures.md` records mechanism + final per row, not per-batch verdict
columns; task prefix `cdd2`; merge commit at the end.

## Push-forward

Decide alone, journal, continue:

- Re-assign a fixture to another group/task when its diagnosis says so,
  provided write-sets in a batch stay disjoint
- Split or merge fix tasks at T6 or within a batch; reorder tasks inside a
  batch for a dependency
- Pin a fixture when survey and census both say exact (D3)
- File an out-of-mission mechanism in `planning/next-missions.md` once its
  artifact is complete and the fix is separable
- Split a task to stay under the complexity hooks without growing its
  write-set; extend a task's test-file list
- Write `.agent-notes/cdd2-Tn.md`
- Run batch 5 once conformant ≥ 600 (D9)
