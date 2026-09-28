# cdd5-T4d — `{{ }}` in a description label

## Observation: the 42x42 embed size is an oracle-seam artifact
- **Context**: wiring the draw path for `rectangle r [ {{ ... }} ]`.
- **Finding**: `EmbeddedDiagram#calculateDimensionSlow` takes the SVG arm only
  when `stringBounder.matchesProperty("SVG")` (`EmbeddedDiagram.java:129`).
  Under `-DPLANTUML_DETERMINISTIC_TEXT` the bounder is
  `StringBounderFromWidthTable` (`FileFormat.java:185-187`), which inherits
  `StringBounder.java:43-45`'s `false`, so the raster arm runs, fails, and
  returns `(42, 42)`. `drawU` asks the `UGraphicSvg` (true), so the real image
  draws. A stock jar would size from the real image.
- **Impact**: description-label embeds size 42x42 but draw full size; the
  canvas still grows to the drawn image through `SvgGraphics#ensureVisible`.
  The class engine's canvas (`class-ink-box.ts:161-168`) only adds ink for
  class-BODY embeds, so class-routed description leaves with a large embed
  keep a canvas that is too small (gubeca, jixibu, josebu, rojida, tefeco).
- **Confidence**: High (Java read; kelefe/komuvi went conformant).

## Observation: class parser merges every standalone `{`
- **Context**: jixibu-01-xave465 (`{{json` followed by a `{` line).
- **Finding**: `class-line-merge.ts:62-70` appends ` {` to the previous line
  for EVERY standalone `{`; upstream `CommandMultilines2.java:92,115` calls
  `BlocLines#eventuallyMoveBracket` (java:358-369), which merges only line 2
  into line 1. So `{{json` + `{` becomes `{{json {`, which is not an embed type.
- **Impact**: any `[ ... ]` body with a standalone `{` line is mis-parsed.
- **Confidence**: High
