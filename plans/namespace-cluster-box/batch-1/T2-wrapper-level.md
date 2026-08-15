# T2 — derive the cluster wrapper level

## Context

Upstream wraps each cluster in protection subgraphs before handing it to
graphviz. `ClusterDotString.java:85-120` emits, outermost first: `a` (when
`thereALinkFromOrToGroup1`), `p0` (when `protection0`), the base
`clusterN`, then `i` and `p1` on the way in. Each `subgraph cluster*` level
adds graphviz's own 8pt `CL_OFFSET` inside the box, so the level directly
determines how far the cluster polygon sits from its members.

This port already models that for STATE via `DotInputCluster.innerMarginLevels`
and `src/core/svek-dot-wrappers.ts#wrapperLevels`, which maps
`innerMarginLevels` to the four booleans. The class engine sets neither
field, so its clusters reach graphviz bare.

**The level is not uniform.** Verified against the cached DOTs during
planning:

| Fixture | Wrappers jar emitted | Level |
|---|---|---|
| `jinibe-02-tebi269`, `dopuzi-50-muxo994`, `sugifi-33-xefe083`, `mucuxi-36-beku683`, `repipi-06-dike782`, `cidepu-54-bemo048` | `p0` / base / `p1` | 1 |
| `bajotu-30-soku184`, `bejusa-95-gafo325` | `a` / `p0` / base / `i` / `p1` | 2 |
| `cocube-46-tusu692` | MIXED — 3 clusters at level 1, `cluster19` at level 2 | 1 and 2 |

## Task

Write a pure function that decides a class/object package's wrapper level
from the AST, and prove it against every cached oracle.

The upstream predicate (`ClusterDotString.java:91-98`):

```java
final boolean thereALinkFromOrToGroup2 = isThereALinkFromOrToGroup(lines);
boolean thereALinkFromOrToGroup1 = thereALinkFromOrToGroup2;
// useProtectionWhenThereALinkFromOrToGroup is true for modern graphviz
if (thereALinkFromOrToGroup1) subgraphClusterNoLabel(sb, "a");
```

and `isThereALinkFromOrToGroup` is "any line in this scope whose endpoint
IS the cluster's group" (`line.isLinkFromOrTo(cluster.getGroup())`).

`protection0`/`protection1` are unconditionally true here — the branch that
forces them false requires a non-empty `entityPositionsExceptNormal`, which
is state's border-point feature and never fires for a class package. So the
level is 2 when the group is a link endpoint in its own scope, 1 otherwise.

**Do not assume the `anchors` map is that predicate.** `buildDotClusters`
already tracks packages used as relationship endpoints, and it is the
obvious candidate — but `cocube-46-tusu692` has two endpoint packages and
only one level-2 cluster, so a naive reading is already contradicted.
Read the Java, derive the predicate, then check whether `anchors` happens to
agree. If it does, use it and say so; if it does not, implement the
predicate directly.

## Write-set

- `src/diagrams/class/class-cluster-levels.ts` (create)
- `tests/unit/class/class-cluster-levels.test.ts` (create)

Do NOT wire it into `class-dot-graph.ts` — that is T4.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:85-120`
  and `isThereALinkFromOrToGroup`
- `src/core/svek-dot-wrappers.ts:44-76` — `WrapperLevels` and `wrapperLevels`
- `src/diagrams/class/class-dot-graph.ts:84-104` — `buildDotClusters`, where
  the `anchors` map is built
- `plans/namespace-cluster-box/decisions.md#1`

## Interface contracts

Consumed by T4:

```ts
/** 1 = p0/base/p1, 2 = a/p0/base/i/p1. Never undefined for a real package. */
export function clusterWrapperLevel(nsId: string, ast: ClassDiagramAST): 1 | 2;
```

## Acceptance criteria

- Given `ClusterDotString.java:91-98`, when the level is derived, then the
  implementation is a function of the scope's edges and the group — with the
  upstream `file:line` cited in a JSDoc `@see`, per the port's convention.
- Given each of the 126 fixtures with a cluster in
  `test-results/dot-cache/{class,object}/*/svek-*.dot`, when the derived
  level is compared with the wrappers jar actually emitted, then **all 126
  agree**. The test drives this from the cached DOTs, not from a
  hand-written list.
- Given `cocube-46-tusu692`, when derived, then exactly one of its four
  clusters is level 2.
- Given `bajotu-30-soku184` (`p1 --> cl2`), when derived, then its single
  cluster is level 2.

Any disagreement among the 126 is a **STOP**: the oracle is exhaustive, so
disagreement means the predicate is wrong, not that a fixture is odd.

## Observability requirements

N/A — pure function, no observable operation.

## Rollback

Reversible. New files with no importer until T4.

## Quality bar

All four gates green. Never pipe `npm test`.

## Boundaries

- **Always:** cite the upstream `file:line` for the predicate. A constant or
  rule with no citation is unfinished (CLAUDE.md).
- **Never:** fit the predicate to make fixtures pass. If it needs a special
  case per fixture, it is wrong — STOP.
- **Never:** run any git command.
