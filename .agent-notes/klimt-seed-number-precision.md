# Observation: JS number cannot hold jar gradient/shadow id seeds

## Observation: klimt SvgGraphics seed ids limited by JS number precision
- **Context**: T6 (svg-conformance Brief 1) — authoring goldens for
  gradient-fill and delta-shadow cases against real jar output.
- **Finding**: upstream derives gradient/shadow `id`s from
  `UmlSource.seed()`, a Java `long` hash that is typically ~19 digits —
  outside `Number.MAX_SAFE_INTEGER`. `SvgGraphics#getSeed`
  (src/core/klimt/drawing/svg/svg-graphics-core.ts) takes a JS `number`,
  so ids for typical diagrams cannot be reproduced byte-for-byte. T6
  worked around it by selecting golden sources whose seed happens to fit
  in a safe integer. Also: the class-icon glyph (`M...Q...Z`) is emitted
  via SvgGraphics' legacy `newpath/moveto/quadto/.../fill` builder, not
  `UPath`/`svgPath` (see oracle/goldens/svg-conformance/_shared/class-box.ts).
- **Impact**: Brief 2 (description engine drawing through klimt) will hit
  arbitrary seeds. Either port the seed to `bigint` in getSeed/base36
  derivation, or normalize gradient/shadow ids in the harness before
  comparison. Decide before the first Brief 2 fixture ratchet lands.
- **Confidence**: High (verified against ~7000 corpus sources during T6).
