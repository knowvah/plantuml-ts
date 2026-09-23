# Batch 10 — B10 numeric residuals + close-out

The mission's last batch: canvas `minDim` (24 fixtures, A5 M7), the
`Class::member` port-row sizing family (53-fixture corpus reach, A5
Unclassified), the mid-path marker offset + eight named singletons (A5
M8 + Unclassified, plus A3's two flagged backgrounds folded in as
T32/T34 residuals), and the mission close-out. T35/T36 write disjoint
files (`layout-ink-extent.ts` vs. `class-map-port-rows.ts`/
`class-port-rows.ts`) and run in parallel worktrees. T37 depends on T35:
A5 M8's own note says "do not touch this before M1/M5 land" for the
EARLIER batches' link-geometry fixes, but within THIS batch it also
warns the marker-anchor array is the same one `minDim`'s ink walk reads
— sequencing T37 after T35 avoids two agents touching overlapping
canvas-dimension math in the same batch. T38 depends on everything: it
IS the mission close-out, and its own steps supersede batch-10's
`close.md` (kept only as a pointer). This batch moves layout: `minDim`
and port-row sizing are canvas/node-dimension fixes by definition.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T35 | Canvas `minDim` off by 1-9 px, zero ink diffs (A5 M7) | debugger | `layout-ink-extent.ts`, tests | — | [x] |
| T36 | `Class::member` port-row sizing, 53-fixture corpus reach (A5 Unclassified) | typescript-pro (opus) | `class-map-port-rows.ts`, `class-port-rows.ts`, tests | — | [x] |
| T37 | Mid-path marker offset + eight named singletons (A5 M8 + Unclassified) | debugger | `class-edge-label-anchor.ts`, `class-magic-arrow.ts`, + whichever file each diagnosed item names (journal a stop-1 pre-authorisation request if outside the batch's write-sets), tests | T35 | [x] |
| T38 | Mission close-out | orchestrator | `README.md`, `fixtures.md`, `measurements/final.json`, `DIVERGENCES.md`, `oracle/accepted-divergences.json` (only if missing), `planning/next-missions.md`, `planning/mission-index.md`, `docs/parity-report.md` | T35, T36, T37 | [x] |

Specs: [`T35-canvas-mindim.md`](T35-canvas-mindim.md),
[`T36-port-row-sizing.md`](T36-port-row-sizing.md),
[`T37-marker-and-singletons.md`](T37-marker-and-singletons.md),
[`T38-mission-close-out.md`](T38-mission-close-out.md).
Batch close: [`close.md`](close.md) — superseded by T38; T38 performs
and extends the close procedure itself and is self-contained.
