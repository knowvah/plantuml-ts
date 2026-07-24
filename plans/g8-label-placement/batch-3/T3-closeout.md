# T3 — Close-out: ratchets, pins, docs, G7 unblock

## Context

plantuml-ts, post-T2 (placement + stack landed, harness clean).
Vitest; Serena MCP; no git mutations (orchestrator commits).

## Locked inputs

T2's final harness output (widened=0, improved list). D4
(decisions.md): tighten-only, never loosen; pins additions only.

## Task

1. **Backlog tighten.** For every improved entry in T2's harness
   output, re-measure fresh (don't trust the pasted numbers) and
   tighten `oracle/goldens/state/size-backlog.json` to the new
   measured delta. Entries that reach zero delta: remove from
   backlog entirely. Never loosen anything.
2. **Pin candidates.** Sweep the corpus fixtures with labeled
   transitions (59 known) + backlog-removed fixtures for byte-exact
   SVG vs jar oracle. Verify stability (two consecutive identical
   renders), then add each to
   `oracle/goldens/svg-state/ratchet.json`. Report the new pin
   count (57 + N).
3. **Docs.** Update `docs/svg-conformance.md` census numbers if the
   sweep moves them (floors never shrink). Append the G8 summary to
   `plans/g8-label-placement/README.md` (tasks, decisions count,
   gate results, follow-ups). Flip
   `plans/g7-borderpoint-rank/README.md` Status from PAUSED to
   `UNBLOCKED — resume at T19 (paper gate v5)`.
4. Full gates green after every file change.

## Write-set

`oracle/goldens/state/size-backlog.json` (tighten/remove only),
`oracle/goldens/svg-state/ratchet.json` (additions only),
`docs/svg-conformance.md`, `plans/g8-label-placement/README.md`,
`plans/g7-borderpoint-rank/README.md` (status block only).

## Acceptance criteria

- Given an improved entry, when re-measured, then the backlog value
  equals the fresh measurement (tighter, never looser).
- Given a byte-exact stable fixture, then it is pinned; count
  reported.
- Given mission end, then G7 reads UNBLOCKED and the G8 summary is
  written.

## Observability requirements

N/A — this task records the SLI outcomes; it adds no operations.

## Rollback notes

Reversible (JSON + docs; plain git revert).
