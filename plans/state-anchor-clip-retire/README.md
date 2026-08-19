# Mission: state-anchor-clip-retire (SI32)

**Retire the composite-anchor spline-clip divergence SI31's T5 knowingly left
in.** Upstream clips a cluster-sourced edge once, before anything reads it, so
the ink walk and the drawn path see the same curve. This port clips only for
the ink fold, so the state renderer still draws the in-cluster segment the jar
discards — on a canvas the clip has already narrowed. Recorded at
`DIVERGENCES.md` "State diagrams — Composite-anchor transitions", which this
mission **deletes** rather than softens. Register row **SI32** at T4.

**Branch:** `fix/state-anchor-clip-retire` (from `main` at or after `90d79baf`)
· **Merge:** merge commit · **Agents run no git** — the orchestrator commits
each task by pathspec.

## The exit

State clips **once**, in a pass that mirrors `DotStringFactory.solve`'s own
edge loop, and both the ink walk and the renderer read that clipped path.

- `DIVERGENCES.md`'s entry is **deleted** (the divergence is gone, not smaller).
- `fovafu-44-mifu394` scope2 width **stays exact** — it is exact today; this
  mission must not regress it.
- Harness net shrink-only; no fixture outside `expected-moves.txt` moves.
- Arrowheads derive from the clipped path, per `SvekEdge.java:679-684`.

**This changes rendered SVG**, deliberately and more broadly than SI31 did:
SI31 moved 31 of 2017 fixtures by changing canvas size, and this changes the
drawn curve itself plus arrowhead placement wherever the head end clips.

## Why "option D", and why not the obvious one

The obvious shape is description's: clip during edge-geo construction
(`description/layout-geo-post.ts#clipEdgePoints`). **Upstream does not do that**,
and copying description here would have been the less faithful choice.
`DotStringFactory.solve` (`svek/DotStringFactory.java:441-467`) reads:

```java
   ... set node + cluster positions from the graphviz SVG ...
   for (SvekEdge line : getBibliotekon().allLines())
       line.solveLine(svgResult);              // <- the clip, one pass over ALL edges
   if (skinParam.getDotSplines() == DotSplines.ORTHO)
       alignEdgesAtLabelNodes();
   for (SvekEdge line : getBibliotekon().allLines())
       line.manageCollision(getBibliotekon().allNodes());
   -> then new SvekResult(...)                 // ink walk + drawU both come after
```

The clip is a **separate whole-collection pass**, after node/cluster geometry
is final and before any consumer — it has to be, because the loop directly
above it is what finalises the cluster positions the clip rectangles come from.
See [decisions.md#d1](decisions.md).

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Baselines (incl. a **tracked** copy — SI31's gap) | T0 | [x] |
| [1](batch-1/overview.md) | Pre-conditions, NO CODE — D1 stands or falls here | T1 | [ ] |
| [2](batch-2/overview.md) | Port `solve()`'s edge pass; clip once; consumers follow | T2 | [ ] |
| [3](batch-3/overview.md) | Delete the divergence; fix `overview.md`; file two gaps | T3 | [ ] |
| [4](batch-4/overview.md) | Close-out | T4 | [ ] |

Serial. Batch 1 is a real gate, not ceremony: if node geos are not final and
in the same frame at every pass site, D1 collapses and the mission needs
re-planning rather than patching.

**Batch numbering is load-bearing.** SI31's brief drifted — a decision said
"Batch 1/2" for what became 2/3, and two task files said "T2's" meaning T3's,
costing a correction in every agent prompt. If a batch is ever inserted,
renumber every reference.

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0 (coverage >= 90/90/90)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0 (both tsconfigs)
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0 (3 pre-existing [unplugin:dts] notes are NOT a failure)
  on_fail: fix_and_rerun
- command: npx jiti scripts/measure-composite-declared-size.ts --mismatched-only > /tmp/si32-now.jsonl && python3 plans/state-declared-size-fix/scripts/harness-diff.py test-results/state-declared-size-baseline.jsonl /tmp/si32-now.jsonl
  pass: "0 rows appeared or grew" — then re-pin: cp /tmp/si32-now.jsonl test-results/state-declared-size-baseline.jsonl
  on_fail: stop            # stop 3
- command: npx jiti scripts/render-manifest.ts --out /tmp/si32-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/si32-manifest.json plans/state-anchor-clip-retire/expected-moves.txt
  pass: "OK: N expected moves, 0 unexpected" — then re-pin the manifest baseline
  on_fail: stop            # stop 4
- command: npx vitest run tests/oracle/state-dot-parity.test.ts tests/oracle/class-dot-parity.test.ts tests/oracle/description-parity.ratchet.test.ts tests/oracle/object-dot-parity.test.ts tests/architecture/layering.test.ts tests/architecture/catalog.test.ts
  pass: state 270 · class 721 · description 357 · object 80; layering green with KNOWN_DEBT []; catalog not drifted
  on_fail: stop            # stop 5 / 6
- command: git diff --name-only <last-batch-commit>..HEAD
  pass: only the batch's declared write-set (+ shared files below)
  on_fail: stop
```
Wall-clock: report `npm test` each batch; **> 60.3 s is stop 11** (SI31 closed
at ~55 s).

## Stop conditions

1. A task must write a file outside its write-set that no task owns. Shared,
   pre-declared: both baselines, `expected-moves.txt`, `decision-journal.md`,
   this brief.
2. Two consecutive gate failures on the same check.
3. Harness: any row appears or grows.
4. `render-manifest` moves a fixture not on `expected-moves.txt`.
5. A DOT-parity ratchet falls or an svg-conformance golden count drops.
6. `layering.test.ts` needs an ALLOWLIST entry or `KNOWN_DEBT` becomes
   non-empty.
7. A numeric constant without a `~/git/plantuml` `file:line`.
8. A finding contradicts a locked decision (D1–D6).
9. **T1's premises fail** — node geos not final, or not in the same coordinate
   frame, at any pass site; or a consumer genuinely needs unclipped points.
   That collapses D1: re-plan, do not patch around it.
10. Same location changed 3× consecutively without the check clearing.
11. `npm test` wall-clock > 60.3 s.
12. The complexity hook blocks and the only way through is widening an
    exemption (forbidden — extract a helper).
13. **A second port of `simulateCompound` appears.** Copying instead of
    consuming `src/core/spline-clip.ts` is the exact condition SI27 and SI31's
    D9 exist to prevent.

## Push forward (journal the call)

Helper filenames/shape · extracting a helper to satisfy the complexity hook ·
tightening a ratchet a task made exact incidentally · regression tests authored
from a fixture's `in.puml` · probes under `scripts_scratch/T<N>/`, deleted
before commit · minor/patch dep bumps · **a fixture moving away from the jar
*with* a diagnosed `file:line` mechanism** — journal and continue (D6;
SI31's `sumiri-68-suvo696` precedent), do not halt and do not tune.

## Index

- [decisions.md](decisions.md) — D1…D6 (locked) ·
  [decision-journal.md](decision-journal.md) ·
  [expected-moves.txt](expected-moves.txt)
- [diagrams/component-map.md](diagrams/component-map.md) ·
  [diagrams/data-flow.md](diagrams/data-flow.md)
- **Source record:** `DIVERGENCES.md` "State diagrams" · SI31's close-out
  `plans/state-residual-fix-batch/README.md` · `planning/next-missions.md` §4
- Precedents: SI31 `plans/state-residual-fix-batch/` (harness/manifest gates,
  allow-list accounts, open-row rulings), SI27 `plans/shared-seam-extraction/`
  (one port of one upstream method).
