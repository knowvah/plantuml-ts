# T2 — group links by `sameConnections` before DOT/draw emission

**Agent:** typescript-pro (sonnet) · **Depends on:** —

## Context

Before building `DotData`, upstream re-orders the relationship list so
links sharing an endpoint pair sit adjacently, by STABLE insertion —
`svek/CucaDiagramFileMakerSvek.java:90-96 getOrderedLinks()` and `:98-113
addLinkNew(...)`, whose predicate is `abel/Link.java:462
sameConnections`. `svek/GraphvizImageBuilder.java:229` iterates the
RESULT, so this one reorder sets both DOT emission and SVG `<g
class="link">` draw order together. This port emits `ast.relationships`
in raw declaration order at `src/diagrams/class/class-dot-graph.ts:236,
245`; `sameConnections` already exists in the port
(`src/core/abel/Link.ts:249`, `src/core/cucadiagram/linkDedup.ts:45`) but
is wired ONLY to dedup, never to ordering — `getOrderedLinks`/`addLinkNew`
itself is not ported (confirmed by grep over `src/`). The report
(`diagnosis/A1-order.md` SB2, HIGH, 7/7 exact replay) is a lead: re-read
both Java methods before writing the port — `addLinkNew`'s insertion rule
is "insert right after the LAST link seen so far with the same
connections, else at the end", not a full stable sort by key.

**File-name note:** `src/diagrams/class/class-dot-edge-order.ts` already
exists (79 lines) — it holds the HIERARCHICAL-relationship direction-swap
rule (`entity1`/`entity2` vs `from`/`to`), an unrelated mechanism (B6/M7).
This task ADDS the `getOrderedLinks`/`addLinkNew` function to that same
file (both are "which order/direction does a class-diagram edge get
emitted in" concerns, and the file has room under the 500-line cap) rather
than creating a second file — confirm the existing file is still under
~420 lines after your addition; split further only if it would exceed 500.

## Task

TDD — tests first in a new `class-dot-edge-order.test.ts` (extend if a
test file for the existing direction rule already exists — check before
creating a duplicate):

1. Write a failing test replaying the report's worked case
   (`bicabi-42-coto932`: `lnk10` = (DrawOptionsBox, AddObjectWindow),
   `lnk12` = (AddObjectWindow, DrawOptionsBox) inserted right after
   `lnk10`, landing before `lnk11`) plus a case with three-way grouping.
2. Implement `getOrderedLinks(relationships: Relationship[]):
   Relationship[]` in `class-dot-edge-order.ts`: walk the input in
   declaration order; for each link, if an earlier-processed link shares
   its connection pair (`sameConnections`, either direction), insert
   immediately after the LAST such link already placed; otherwise append
   at the end of the output so far. Pure function — no mutation of the
   input array.
3. Wire it into `class-dot-graph.ts` at the single point both the DOT
   emission loop (`:236`) and the edge-order consumer (`:245`) read from —
   apply `getOrderedLinks` once, upstream of both, so they stay in lock
   step (this was the SB2 root cause: two independent iteration sites that
   must now share one ordered array).
4. Re-run `render-all.mts` against `measurements/base.json` (post-T1, if
   T1 has landed in this worktree) or against T0's `base.json` if run
   standalone; every verdict change must be one of the 7 SB2 slugs
   (`bicabi-42-coto932, cobumi-83-bapu892, delasa-80-jusu462,
   gujigi-63-roki030, kevoda-64-mije856, momoba-92-bole393,
   tedeba-19-lisi250`). `delasa` overlaps T1's SB1 set — expect it to need
   BOTH fixes to fully converge; don't chase its residual uid diff here.

## Read-set

`diagnosis/A1-order.md` SB2 section (whole, lines 104-146); Java:
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/
CucaDiagramFileMakerSvek.java:90-113`; `~/git/plantuml/src/main/java/net/
sourceforge/plantuml/abel/Link.java:455-470` (`sameConnections`);
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/
GraphvizImageBuilder.java:220-235`. TS: `src/diagrams/class/
class-dot-edge-order.ts` (whole, 79 lines — existing direction rule,
don't disturb it); `src/diagrams/class/class-dot-graph.ts:220-260` (both
iteration sites); `src/core/abel/Link.ts:240-260`
(`sameConnections` method); `src/core/cucadiagram/linkDedup.ts:35-65`
(free-function form, dedup-only usage).

## Write-set

`src/diagrams/class/class-dot-edge-order.ts`,
`src/diagrams/class/class-dot-graph.ts`, `class-dot-edge-order.test.ts`
(new or extended), `plans/class-divergence-drive/measurements/t2.json`,
`plans/class-divergence-drive/decision-journal.md`, `.agent-notes/
cdd-T2.md`.

## Interface out (consumed by T4 — SB8 fixtures share edges with SB2's set)

```ts
export function getOrderedLinks(relationships: Relationship[]): Relationship[];
```

## Acceptance criteria

- Given `bicabi-42-coto932`'s relationship list in declaration order, when
  `getOrderedLinks` runs, then `lnk12`'s twin lands immediately after
  `lnk10` and before `lnk11`, matching the jar's document order exactly
- Given all 7 SB2 fixtures, when replayed, then every one's DOT/draw order
  equals the jar's (report's `sb2.py` 7/7 result, reproduced here as a
  vitest case per fixture or one parameterized test)
- Given `render-all.mts`, then every verdict mover is one of the 7 named
  slugs and no previously-conformant fixture regresses
- Given `npx jiti scripts/dot-sync-report.ts class`, then the DOT-equal
  fraction is still ≥ 710/711 (this reorder changes DOT emission — a drop
  is stop 6, halt)

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the task's commit; no persisted state.

## Quality bar

Four gates green. `npx tsx ../tools/render-diff.mts bicabi-42-coto932`
before/after pasted into the commit body. `npx jiti scripts/
dot-sync-report.ts class` re-run and its fraction recorded. Complexity
hooks apply to `class-dot-edge-order.ts`'s post-addition size.

## Boundaries

Always: apply `getOrderedLinks` at the ONE point both consumers share
(class-dot-graph.ts) rather than duplicating the reorder in two places.
Ask first: renaming or splitting `class-dot-edge-order.ts` beyond adding
this one function. Never: touch the existing HIERARCHICAL direction-swap
logic in that file; touch `linkDedup.ts`'s dedup semantics; rebuild the
oracle cache (D12).

## Commit

`fix(cdd-T2): emit class links in sameConnections document order`

Body: cites `CucaDiagramFileMakerSvek.java:90-113`; notes DOT-equal
fraction before/after and the 7-fixture replay result.
