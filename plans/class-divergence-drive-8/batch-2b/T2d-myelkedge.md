# T2d: port `MyElkEdge`

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Port `~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java`
(354 lines) 1:1 to `src/core/elk/MyElkEdge.ts`. It covers:
- the constructor (`:100-147`) with `elkClusters` and `nodeImages` maps
- `drawU` (`:148`)
- extremity decorations through the existing `ExtremityFactory` ports
  (`src/core/svek/extremity/`), with `stroke.onlyThickness()` and the
  `MagneticBorder` force (`:200-225`)
- label, tail/head label and quantifier/role placement (`:255-316`)
- `drawSections`: straight `ULine` segments from the section start through each bend
  point to the end, with `MagneticBorder` forces at both ends and `magicY2`
  (`:319-347`)
- `drawLine` (`:349-352`)

**No splines.** The jar draws `<line>` elements here (cadutu's `in.svg` has zero cubic
path segments). Reuse the existing `MagneticBorder`/`ExtremityFactory` ports; if one is
missing, that is a stop (report the Java), not a re-implementation.

## Write-set
`src/core/elk/MyElkEdge.ts`, `tests/unit/elk/MyElkEdge.test.ts`.

## Read-set
`MyElkEdge.java` (all); `ElkDiagramAdapter.ts`; T2c's `MyElkCluster` contract (from
the brief: constructor + `drawSingleCluster`; type against it); `grep -rn
MagneticBorder src/core`; `src/core/svek/extremity/`; `src/core/svek/SvekEdge.ts`
(the shared `@DuplicateCode` sibling, `SvekEdge.java:119`, for label drawing idioms).

## Interface contract (output, consumed by T2b)
`class MyElkEdge { constructor(adapter, link, elkEdge, label, tailLabel, headLabel, elkClusters, nodeImages, ...Java's remaining args); drawU(ug: UGraphic): void; }`
The constructor argument order must equal `MyElkDrawing.java:202`'s call.

## Acceptance
- Given a section with two bend points, when drawn through a recording `UGraphic`, then
  three `ULine`s are emitted with the Java's coordinates, including the MagneticBorder
  forces.
- Given a link with a `<|--` decor, then the extremity is drawn at the section end with
  `onlyThickness` stroke.
- Given a labelled link, then the label's translate equals the Java's (`:255-262`).

## Architecture decisions (locked)
D13.
