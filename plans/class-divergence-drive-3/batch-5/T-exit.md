# T-exit — batch-5 close and exit bar

**Agent:** orchestrator · **Depends on:** T-D3

1. [`../close-procedure.md`](../close-procedure.md) with `N=5`.
2. Exit bar (D1) from `measurements/b5.json`: conformant ≥ 670 (target
   712, ceiling ~695 pre-dot-engine-release); every row conformant or with
   mechanism + owner or an acceptance proposal; zero conformant losses and
   zero unexplained rises across the mission; DOT parity green;
   other-engine movers journaled. Write each clause, met or not, with its
   number under `## Status` in the README.
3. If the floor is missed: do NOT start new work — list the gap by
   workstream in the README and hand to close-out.

## Acceptance criteria

- Given `b5.json`, when evaluated, then the README states every clause with its number
- Given `fixtures.md`, when committed, then no row has an empty `final`

## Observability · Rollback

N/A. Reversible.
