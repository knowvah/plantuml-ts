# T2c: port `MyElkCluster`

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port `~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkCluster.java`
(172 lines) 1:1 to `src/core/elk/MyElkCluster.ts`:
- the constructor `(diagram→adapter, entity→groupId, ElkNode)`
- `drawSingleCluster(ug)`: the corner from `CucaDiagramFileMakerElk.getPosition`, then the
  decoration `drawU` with backColor/borderColor/shadowing/roundCorner (`:100-125`)
- the title and stereotype blocks
- every getter `MyElkEdge` reads, such as the cluster's position and size for
  `MagneticBorder`

Draw through klimt `UGraphic` and the existing `ClusterDecoration`/`USymbol` ports
(`src/core/svek/ClusterDecoration.ts`, `src/core/decoration/symbol/`); do not
re-implement them. Read colours and styles through `ElkDiagramAdapter` exactly where
the Java reads `diagram.getSkinParam()` or the style.

## Write-set
`src/core/elk/MyElkCluster.ts`, `tests/unit/elk/MyElkCluster.test.ts`.

## Read-set
`MyElkCluster.java` (all); `ElkDiagramAdapter.ts` (frozen in T2a);
`src/core/svek/ClusterDecoration.ts` (its `drawU` signature);
`src/core/svek/Cluster.ts` (how svek draws the same cluster, for its title block).

## Interface contract (output, consumed by T2b, T2d)
`class MyElkCluster { constructor(adapter, groupId, elkNode); drawSingleCluster(ug: UGraphic): void; }`
plus the members `MyElkEdge.java` calls on it. List them in your report.

## Acceptance
- Given a group with a title, stereotype and `#color`, when drawn through a recording
  `UGraphic`, then the decoration call carries the Java's corner, dimension, colours
  and round corner, asserted per value.
- Given cadutu's clusters (if any) through elkjs, then the drawn rectangle equals the
  jar's `in.svg` cluster path.

## Architecture decisions (locked)
D13.
