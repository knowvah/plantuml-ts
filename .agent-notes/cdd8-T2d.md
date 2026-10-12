# cdd8 T2d: MyElkEdge

## Observation: the ELK EXTENDS head is not the svek one
- **Context**: porting `MyElkEdge#getDecors` (`MyElkEdge.java:229-239`).
- **Finding**: the ELK path draws `LinkDecor.EXTENDS` through
  `ExtremityFactoryExtends` -> `ExtremityExtends` (19/7 polygon, angle - PI/2,
  `manageround`, filled white), not the svek path's 18/6/18
  `ExtremityTriangle`. Ported in `src/core/svek/extremity/` (residual round);
  oracle probes `A <|-- B`, `A --|> B`, `A <|.. B` under `!pragma layout elk`
  match byte-for-byte. The dashed link's head is undashed (onlyThickness).
- **Impact**: only `MyElkEdge` imports these two classes; svek output is
  unaffected.
- **Confidence**: High (oracle-rendered)

## Observation: 3 dp jar widths are not enough to place ELK ports exactly
- **Context**: cadutu end-to-end through elkjs + MyElkEdge.
- **Finding**: with foo's width 51.425 (in.svg 3 dp) the second port of foo
  sits at 246.41067 and prints 246.411; the jar prints 246.41. With the
  full-precision width 19.424999237060547 + 32 (spike `text-widths.json`) the
  output matches exactly. ELK spreads ports at `x + k*w/(n+1)`, which
  multiplies the rounding error.
- **Impact**: ELK parity tests must size nodes from full-precision widths,
  not from the SVG's rect widths.
- **Confidence**: High (measured both ways)

## Observation: MyElkEdge asks magnetic borders in two coordinate spaces
- **Finding**: `drawSections` passes `translate.getTranslated(point)`
  (`:328-329`, `:341-342`); the extremity block passes the untranslated
  `(x, y)` (`:215`, `:222`). And for entity 2 a cluster border overrides the
  node image (`:195` is not an `else`). Both mirrored.
- **Impact**: only matters for edges inside clusters (non-zero translate) or
  links to a group; no cadutu coverage.
- **Confidence**: High (Java read)
