# T1a — connection census (diagnosis only, D3)

Agent: typescript-pro, worktree `add2-T1a`. Commit:
`docs(add2-T1a): connection census and merge cases`. NO `src/` edits.

## Context
99 activity rows draw an extra line + arrowhead and 22 an extra arrowhead where
the jar fuses touching connectors (`decisions.md#D1`, `#D2`). add1-T3b tried a
bare merge and reverted it on false positives because our edges carry no
`MergeStrategy` (`.agent-notes/T3b-walker-edges.md`, add1 journal row 44).

## Task
1. Enumerate every live `Snake` creation under
   `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/**`
   (skip `gtile/` — dead, `Gtile.USE_GTILE = false`): connection class, file:line,
   `MergeStrategy` (default FULL, `Snake.java:140-153`; `withMerge` overrides),
   start/end decoration, emphasize direction, texts.
2. For each, find our counterpart push site (`src/diagrams/activity/layout/
   tile-coordinates.ts`, `walk-*.ts`, `swimlane-*.ts`) — file:line — or mark
   MISSING (stop 12 for the orchestrator; report, do not invent).
3. Write minimal `.puml` merge cases (fusion of two FULL snakes; end-decoration
   drop via `removeEndDecorationIfTouches`; a LIMITED corner; a NONE boundary;
   a text-bearing snake that must not merge; a group boundary `FtileGroup`) into
   `measurements/merge-cases/`, render each with `scripts/oracle-render.sh`, and
   record the jar's polyline/arrowhead output beside our current output.
4. Name, for the 99 + 22 rows (`measurements/b0-elements.json`), which
   connection pair causes each extra element on 10 sampled rows (`--dump`).

## Write-set
`plans/activity-divergence-drive-2/measurements/connection-census.md` (NEW),
`plans/activity-divergence-drive-2/measurements/merge-cases/**` (NEW).

## Interface contract (consumed by T1b)
Table columns: `javaClass | file:line | strategy | startDeco | endDeco |
emphasize | texts | ourSite (file:line or MISSING)`.

## Acceptance
- Given all 24 `withMerge` sites + every default-FULL creation, then each has a row.
- Given each merge case, then the jar output and ours are both recorded.
- Given 10 sampled rows, then each extra element is attributed to a named pair.

Quality bar: none of `src/` changes; markdown + fixtures only. No Serena, no stash.
Observability: N/A. Rollback: Reversible.
