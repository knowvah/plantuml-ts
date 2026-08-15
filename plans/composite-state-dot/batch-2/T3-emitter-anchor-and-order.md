# T3 — Emitter: `za` identity, anchor position, `lines0` ordering

## Context

`src/core/svek-dot-emit.ts` serializes a `DotInputGraph` into Svek's DOT text.
Jar's own DOT differs from ours in two ways at the same site: where the group
anchor is declared and what it is called, and whether `minlen==0` edges precede
node declarations.

## Task

1. Name the group anchor `za<groupUid>`, not `sh####`, and stop consuming an `sh`
   number for it.
2. Emit it INSIDE the base cluster block, gated on the same condition jar uses
   (`thereALinkFromOrToGroup2`).
3. Emit the `minlen==0` (`lines0`) edge batch BEFORE any node declaration, and the
   remaining edges last, matching `DotStringFactory#createDotString`.

## Write-set

- `src/core/svek-dot-emit.ts`
- `src/core/svek-dot-sequence.ts`
- `tests/unit/core/svek-dot-emit.test.ts`

## Read-set

- `~/git/plantuml/.../svek/Cluster.java:104,653` — `CENTER_ID` / `getSpecialPointId`
- `~/git/plantuml/.../svek/ClusterDotString.java:148-152` — where the anchor is emitted
- `~/git/plantuml/.../svek/DotStringFactory.java:187-198` — the `lines0`/`lines1` batches
- `src/core/graph-layout-build.ts:57-110` — `reorderNodes`, which already documents this mechanism
- `test-results/dot-cache/state/temuxi-28-cega322/svek-1.dot` — the oracle (anchor at line 53)
- [decisions.md](../decisions.md) ADR-3, ADR-4

## Architecture decisions (locked)

- `za` identity and position ship together with the ordering change, not standalone
  (ADR-4). Renaming alone is cosmetic.
- Gate on the SVG census, not the DOT text (ADR-5).

## Interface contracts

Produces, consumed by T4 — the ordering rule T4 must mirror on the layout path:

```ts
interface SvekEmitOrder {
  /** "za" + group uid; never an sh id. */
  anchorId: string;
  /** Declaration order jar uses. */
  order: ['lines0-edges', 'nodes-and-clusters', 'lines1-edges'];
}
```

## Acceptance criteria

- Given a group targeted by an edge, when emitting, then the anchor is `za<uid>`.
- Given the same graph, when assigning sh ids, then no `sh` number is consumed by
  the anchor and every other node keeps jar's numbering.
- Given a `minlen=0` edge, when emitting, then it precedes all node declarations.
- Given `temuxi-28-cega322`, when emitting, then the anchor appears inside the base
  cluster block, not at the top of the file.

## Observability requirements

N/A — no new observable operations.

## Rollback

Reversible — single commit.

## Quality bar

All four gates green. Census on all five diagram types; no fixture may rise.

## Commit

`feat(T3): emit jar's za group anchor and lines0-first ordering`
