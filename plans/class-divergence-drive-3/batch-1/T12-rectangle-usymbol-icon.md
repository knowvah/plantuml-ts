# T12 — rectangle usymbol icon

**Agent:** typescript-pro (sonnet) · **Depends on:** T0 · wave 2 (after wave 1 merges).
Prompt = [`fix-task.md`](../fix-task.md) + this file.

## Fixtures

sijisi-94-ripu606

## Mechanisms

Read cdd2 `.agent-notes/cdd2-T17.md` (sijisi). Canvas is exact; the
title centring was closed by cdd2 T19b. Remaining: a `rectangle "foo3"`
leaf under `allow_mixing` is drawn as a class box with a badge because
`core/usymbol-shapes.ts:219-231` has icons only for database, component,
actor and usecase. Port the upstream USymbol leaf dispatch for `rectangle`
(`decoration/symbol/USymbolRectangle.java` and the leaf image the jar
uses — grep `EntityImageDescription`) whole.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/usymbol-shapes.ts`, the class leaf dispatch that calls it; tests beside each; `.agent-notes/cdd3-T12.md`.

## Interface contracts

- None.

## Acceptance criteria

- Given sijisi, when rendered, then its structural diffs are 0
- Given component/usecase/deployment fixtures with `rectangle` leaves, when surveyed vs the T0 baseline, then movers are explained

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
