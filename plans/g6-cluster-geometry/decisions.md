# G6 Architecture Decisions (locked 2026-07-21, maintainer-approved)

## D1 — Vertical rank-sep fix location: encode the diagnosis rule, not a location

**Context:** The ~1-6px cluster height residual plausibly maps to
graphviz's cluster rank-separation (`~/git/graphviz/lib/dotgen/
position.c:780`, `d1 = rank[r+1].ht2 + rank[r].ht1 + CL_OFFSET`), a
per-adjacent-rank-pair computation that runs inside the layout engine.
**Decision:** T1 first localizes where behavior diverges: (a)
dot-engine vs the C source → fix upstream in dot-engine (file under
`docs/graphviz-issues/` + TRACKER.md line, fix, adopt new pinned .tgz,
re-measure); (b) dot-engine matches C but jar adds vertical margin
outside layout → fix at the seam (`src/core/graph-layout-build.ts`),
mirroring how C7's side margins landed. Both paths pre-authorized.
**Consequences:** T2's write-set is conditional on T1's verdict; a
library finding that exists only in this plan is not filed — the issue
file is part of T2's definition of done.

## D2 — Title-table height: derived jar formula, not a recalibrated constant

`CLUSTER_TITLE_TABLE_HEIGHT = 3` (state-composite-cluster.ts:96) is a
single-line-only calibration. Replace it with jar's real computation
(the `svek` Cluster/ClusterHeader path; jar's real HEIGHT for
title+action-zone `Track_FSM.Run` is 42; C5's gap=47 data point),
passed per-cluster via the existing `DotInputCluster.titleTableHeight`
seam field. No table-driven calibration constants. Regression bar: the
formula must reduce to the current behavior on the 132/134
already-verified single-line set (byte-identical).

## D3 — `class="cluster"` emission is classification-driven

Emit `class="cluster"` exactly where `classifyDiagram` yields
`'cluster'` (classification already jar-verified correct, G5 C8 probe
on pesita's `nasreq_auth`); keep `class="entity"` elsewhere. Gate:
zero byte changes on any currently-pinned golden whose jar oracle says
`entity`.

## D4 — decede's `<style>stateDiagram{}</style>` goes through existing style machinery

Extend `parseStyleBlock`/`resolveSkinparam` (`src/core/skinparam.ts`)
plus `state-render-colors.ts` consumption. No state-renderer
special-case parser. Do NOT touch the `cleanForKeySlow` key
normalization (mission-guide watch-out).

## D5 — Entry/exit WithLabel sizing is a jar port, not a formula

Port jar's actual code path (the `portRanksLabelOnEe`/WithLabel branch
+ border-point entity sizing), preserving upstream names. Three
geometric approximations already failed (G4 S13 ×3); a fourth is
forbidden. If the jar path cannot be cleanly isolated within budget,
stop and journal (README stop condition 8).

## Operational readiness (confirmed)

- Gates-as-SLIs: census floors, size-backlog monotone shrink, DOT gate
  frozen, 10,150-test suite, typecheck/lint/build.
- Rollback: everything Reversible (git revert; G5 full-revert protocol
  for failed attempts; .tgz bump reverts via package pin + lockfile).
  **No irreversible changes in this mission.**
- Backwards compat: the ratchet system is the contract. Deliberate
  divergences (if any arise) go to `DIVERGENCES.md`, never silent.
