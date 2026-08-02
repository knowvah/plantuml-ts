# Component Map — After Tile Rewrite

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[ast.ts\nActivityDiagramAST\n(extended for Switch/Group/Spot/Goto/Label)] as AST
[parser.ts\n(unchanged)] as PARSER
[tiles/\nGtileStart, GtileStop, GtileEnd\nGtileBreak, GtileKill\nGtileAction, GtileNote\nGtileDiamond, GtileSpot, GtileLabel\nGtileTopDown, GtileIf\nGtileWhile, GtileRepeat\nGtileFork, GtileSplit\nGtileSwitch, GtileGroup, GtilePartition] as TILES
[routing/\nGConnectionVerticalDown\nGConnectionHorizontal\nGConnectionVerticalDownThenBack\nGConnectionDownThenUp\nGConnectionSideThenVerticalThenSide] as ROUTING
[tiles/tile.ts\nTile, TileLeaf, TileComposite\nStringBounder] as TILEBASE
[tiles/points.ts\nGPoint, HookName\nNORTH_HOOK, SOUTH_HOOK\nEAST_HOOK, WEST_HOOK] as POINTS
[layout/tile-layout.ts\nlayoutActivity()\ntileNode dispatcher\ntileIf, tileWhile, tileFork ...] as TILELAYOUT
[layout/tile-coordinates.ts\nassignCoordinates()\n→ ActivityNodeGeo[]\n→ ActivityEdgeGeo[]\n→ SwimlaneGeo[]] as COORDS
[layout/swimlane-context.ts\nSwimlaneContext\nbuildSwimlaneContexts()] as SWIMCTX
[renderer.ts\n(import path change only)] as RENDERER
[src/core/skinparam.ts\n+ activity keys\n(add only)] as SKIN
[src/core/theme.ts\n+ colors.graph.activity\n(add only)] as THEME
[layout.old.ts\n(renamed; kept as reference)] as OLD

PARSER --> AST
AST --> TILELAYOUT
TILELAYOUT --> TILES
TILES --> TILEBASE
TILES --> POINTS
TILELAYOUT --> COORDS
COORDS --> ROUTING
COORDS --> SWIMCTX
COORDS --> RENDERER
SKIN --> THEME
THEME ..> TILELAYOUT : colors fed to
OLD ..> TILELAYOUT : reference only
@enduml
```

## Key Invariants

- `tiles/` files carry no canvas-absolute coordinates — tile-relative only
- `tile-coordinates.ts` is the only file that converts tile-relative → canvas-absolute
- `renderer.ts` is unchanged except for a single import path update (T14)
- `layout.old.ts` is never imported after T14 lands
