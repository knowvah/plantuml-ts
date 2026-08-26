## Observation: the `o` arrow decoration is filled BLACK, not the diagram background

- **Context**: T17 of `sequence-command-coverage` verified the exo render path
  against the oracle jar. `[o-> Bob` renders a decoration circle in both
  engines, but with different fills.

- **Finding**: upstream fills the `o` circle with the ARROW STYLE's
  `BackGroundColor`, which the default skin pins to **black** — not with the
  document background.

  - **Mechanism**: `drawDressing1`/`drawDressing2` fill the circle with
    `getBackgroundColor().bg()`
    (`skin/rose/ComponentRoseArrow.java:201-204,236-241`).
    `getBackgroundColor()` is `getColorBackGround()`
    (`skin/rose/AbstractComponentRoseArrow.java:66,84-86`) =
    `getColor(PName.BackGroundColor)` (`skin/AbstractComponent.java:105-107`)
    on the arrow style — and `~/git/plantuml/skin/plantuml.skin:306-310` reads
    `arrow { FontSize 13 / LineThickness 1.0 / BackGroundColor black }`.
  - **Origin**: `src/diagrams/sequence/renderer-arrowhead-glyph.ts#paintOf` —
    `background: theme.colors.background`.
  - **Causal chain**: `paintOf` feeds `headCircleMarkup`, so every
    `o`-decorated arrow end emitted `fill="#FFF"` (a hollow dot) where the jar
    emits `fill="#000"` (a solid one).

- **Ruled out, with the evidence that ruled it out**:
  - *Not the diagram background.* 51 corpus goldens carry an `rx="4"`
    decoration circle; ALL 51 are `fill="#000"`, including
    `dakake-85-nemi992` and `labudu-49-fove649` (`background:#FF0000`) and
    `sufevi-44-xipa294` (`background:#D3D3D3`).
  - *Not `getColorLine()`.* `TeozTimelineIssues_0007_Test` has
    `<ellipse ... fill="#000" style="stroke:#F00;...">` — a red arrow keeps a
    black fill, so fill and stroke are different colours.
  - *Not geometry.* cx/cy/rx/stroke-width already matched the jar exactly on
    `[o->o Bob`, `Bob o<-o]` and `[o<->o Bob` (relative to each arrow's own
    frame), as did element ORDER.

- **Impact**: affects every `o`-decorated sequence message, exo and ordinary —
  `paintOf` is shared by `renderFlatMessageArrow` and `renderSelfMessageHead`.
  A per-message arrow colour (`-[#red]->`) must NOT be applied to this fill.

- **Confidence**: High. Java read end to end plus 51-golden census.
