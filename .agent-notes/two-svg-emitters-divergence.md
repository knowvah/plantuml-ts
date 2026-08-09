# Two SVG emitters where upstream has one

## Observation: the port's deepest structural divergence, and the hidden cost behind several missions

- **Context**: found while executing the `svg-output-size-reduction`
  mission, which had to port six upstream emission rules into **both**
  emitters. Recorded per CLAUDE.md's "upstream architecture is
  authoritative — a structural divergence is itself the bug".

- **Finding**: upstream PlantUML has exactly **one** SVG emission seam:
  `klimt/drawing/svg/SvgGraphics.java`, with one method per shape —
  `svgRectangle`, `svgLine`, `svgPolygon`, `svgEllipse`, `svgArcEllipse`,
  `svgPath`, `svgImage`, `svgText`. Every diagram type reaches SVG only
  through it, via the `Driver*Svg` classes (`DriverRectangleSvg`,
  `DriverPolygonSvg`, `DriverPathSvg`, …). There is no per-diagram
  markup construction anywhere in the Java.

  This port has **two**:

  | emitter | engines | goldens |
  |---|---|---|
  | `src/core/klimt/drawing/svg/` — the faithful `SvgGraphics` port | description | 51 |
  | `src/core/svg.ts` + `src/core/svg-shapes.ts` — a hand-rolled string builder | class, state, object | ~394 |

  Plus a third tier that bypasses both: several class-engine files
  (`class-namespace-shape.ts`, `class-visibility-icon.ts`,
  `renderer-note.ts`, `note-opale.ts`) build `<polygon>`, `<rect>`,
  `<ellipse>` and path `d` strings by template-literal concatenation.
  `activity/`, `dot/`, `board/` and `chart/` do the same.

- **Impact — this is not cosmetic. It has cost real work repeatedly:**
  - Every upstream emitter change must be ported **twice**. The
    size-reduction mission implemented all six rules in both emitters.
  - ADR-3 of that mission exists *solely* to stop the two drifting — a
    shared rules module whose entire justification is the split.
  - Task T5b existed only because rule 3's root-`<g>` attributes landed
    in one emitter and not the other, which then broke
    `document-shell.ts#unwrapContentG` and silently disabled two splice
    sites in `class/renderer-shell.ts`.
  - The third tier has no formatting at all, so when the class engine's
    compensating `javaRound4` calls were removed it began emitting
    `d="M8.5,6 L28.925000000000004,6 …"`. Task T7b addresses that tier
    by routing it through the shared emitters.
  - Any future upstream emitter change inherits all of the above.

- **Not attempted here**: consolidating onto the klimt emitter is a
  multi-week mission touching ~394 goldens, and the port was mid-flight.
  The intermediate step T7b takes — routing hand-built markup through
  `core/svg-shapes.ts`'s emitters, which already map 1:1 onto
  `SvgGraphics`'s methods — reduces the tiers from three to two without
  a rewrite.

- **If this is ever taken on**: `core/svg-shapes.ts`'s exports already
  mirror the Java's method set (`rect`/`line`/`polygon`/`ellipse`/`path`/
  `image`/`text`), so the seam to converge on exists. The hard part is
  that the class/state/object engines pass geometry as plain records,
  whereas klimt drives `UGraphic` shape objects (`URectangle`, `UPolygon`,
  `UPath`) — so consolidation means porting those engines onto the
  `UGraphic` drawing model, which is what upstream actually does.

- **Confidence**: High — the Java's single seam and driver set were read
  directly; the port's two emitters and their golden ownership are
  measured, not estimated.
