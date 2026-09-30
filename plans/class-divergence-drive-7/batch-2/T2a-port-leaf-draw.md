# T2a: port leaf — frontier placement and `EntityImagePort` draw

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
**bonaco (`class-portin-unported`, cdd6 row 67).** cdd6 T3d (1019c3c1b) ported
the DOT half: `portin`/`portout` leaves emit as `RECTANGLE_PORT` nodes with the
cluster `hasPort` branch (`class-entity-port.ts`, `class-dot-graph.ts:474`), and
the DOT is structurally equal to the jar's. The render is unchanged (4/35): the
port is still laid out as a cluster member and drawn as a class box. Two halves,
in order:
1. **Placement.** `Cluster.java:344-345,410-436`: after layout, `FrontierCalculator`
   grows the cluster frontier to its members and the port nodes are moved onto
   that border (`EntityPosition` sides). `core/svek/FrontierCalculator.ts` is
   ported and consumed by state (`state-composite-frontier.ts`, the adapter
   precedent) and description; wire it into `buildNamespaceGeos`
   (`class-geo-builders.ts:258`) for a namespace that contains port leaves. The
   file is at 499 lines: the port branch goes in a helper module (push-forward
   file-cap move; name it, `class-geo-builders-port.ts` or as upstream's naming
   suggests).
2. **Draw.** `EntityImagePort.java:100-146`: a `UGroup` (`entity`, `entity_<name>`,
   data attributes), the description text drawn above (`upPosition()`) or below the
   symbol at `x = -(descWidth - 2*RADIUS)/2`, then `drawSymbol` with stroke
   thickness 1.5 and the entity's BACK/LINE colours falling back to the style's
   `LineColor`/`BackGroundColor` (`EntityPosition.RADIUS`, `EntityPosition.java`).
   Port it 1:1 as `renderer-entity-port.ts`; dispatch from `renderer.ts`'s classifier
   loop (`renderer.ts:351-356`, a port branch before the usymbol one) — NOT from
   `renderer-usymbol-entity.ts`, which T2b owns this batch (b1 close decision).

Consume T1c's `ClassifierGeo.stereotypeSprite` in `class-geo-builders.ts` only
if the spread through `stereotypeLabelFields` left a gap (report it either way).

## Rows
- `unknown/bonaco-71-xefu608` (4/35, dotEqual true since 1019c3c1b)

## Write-set
- `src/diagrams/class/class-entity-port.ts`
- `src/diagrams/class/class-geo-builders.ts` (+ the helper split module)
- new `src/diagrams/class/renderer-entity-port.ts`
- `src/diagrams/class/renderer.ts` (dispatch only; `renderer-usymbol-entity.ts` is T2b's)
- `docs/catalog.md` (new module)
- their unit tests under `tests/unit/class/`

## Read-set
`decisions.md#D4`; cdd6 journal row 67; `EntityImagePort.java` (whole file, 148
lines); `Cluster.java:330-350,400-440`; `FrontierCalculator.java` (whole file,
169 lines); `core/svek/FrontierCalculator.ts`; `state-composite-frontier.ts:1-40`;
`class-entity-port.ts` (whole file, 117 lines); `class-geo-builders.ts:230-300`.

## Interface contracts
In: `ClassifierGeo.stereotypeSprite` (T1c). Out: none.

## Acceptance
- Given a namespace with a `portin` leaf, when laid out, then the port sits on the
  cluster border at the side `EntityPosition` names (`Cluster.java:410-436`),
  asserted on specific coordinates from an oracle probe.
- Given the port is drawn, then the SVG carries `EntityImagePort.java:100-146`'s
  group, description offset and 1.5 stroke, not a class box.
- Given bonaco, when render-diff runs, then 4/35 → 0/0 and `dotEqual` stays true.
- Given class DOT parity and the class golden ratchet, then green.

## Architecture decisions (locked)
D4, D11. Upstream names (`EntityImagePort`, `FrontierCalculator`).
