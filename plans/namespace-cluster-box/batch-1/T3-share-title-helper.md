# T3 — move `computeTitleTableHeight` to a shared module

## Context

Jar gives a cluster an HTML title table so graphviz reserves the title band:
`label=<TABLE FIXEDSIZE="TRUE" WIDTH="29" HEIGHT="9">` on `cidepu-54-bemo048`'s
`pack`. This port models it through `DotInputCluster.titleTableWidth` /
`titleTableHeight`, which `graph-layout-build.ts#addClusters` turns into that
markup, and `svek-dot-emit-clusters.ts` emits.

The height formula lives at
`src/diagrams/state/state-composite-header.ts:111#computeTitleTableHeight`.
T4 needs it for class clusters, and one diagram engine must not import from
another.

## Task

Move `computeTitleTableHeight` (and only it, plus whatever it directly needs)
to a new shared module under `src/core/`. Update the state engine to import
from the new location. Behaviour must not change anywhere.

Name the module for what it is, not for who moved it — e.g.
`src/core/cluster-title-table.ts`.

## Write-set

- `src/core/cluster-title-table.ts` (create)
- `src/diagrams/state/state-composite-header.ts` (remove the function,
  re-export or import as needed)
- Any state file importing it — `src/diagrams/state/state-composite-cluster.ts`
  is the known caller; grep for others before starting
- Its existing tests, if they import by path

## Read-set

- `src/diagrams/state/state-composite-header.ts:100-175` — the function and
  its own doc comment, which carries the jar derivation
- `src/diagrams/state/state-composite-cluster.ts:8,24` — the known importer
- `plans/namespace-cluster-box/decisions.md#2`

## Interface contracts

Signature is unchanged; only the module path moves:

```ts
export function computeTitleTableHeight(
  titleLines: number, stereoLines: number, attrLines: number, fontSize: number,
): number;
```

Consumed by T4.

## Acceptance criteria

- Given the state engine, when the full suite runs, then every state test
  passes unchanged — this is a pure relocation, so a moved expectation means
  the move was not pure.
- Given the moved function, when it is read, then its original doc comment
  and jar derivation moved with it. A citation left behind is a citation
  lost.
- Given `grep -rn "computeTitleTableHeight" src/`, when run after the move,
  then no importer still points at `src/diagrams/state/`.

## Observability requirements

N/A — pure relocation.

## Rollback

Reversible.

## Quality bar

All four gates green. Never pipe `npm test`.

## Boundaries

- **Always:** move the doc comment with the code.
- **Never:** "improve" the formula while moving it. Do not refactor while
  porting (CLAUDE.md).
- **Never:** run any git command.
