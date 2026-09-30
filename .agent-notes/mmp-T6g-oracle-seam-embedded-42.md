## Observation: the oracle seam sizes every embedded {{ }} diagram as 42x42
- **Context**: mmp-T6g, `unknown/semutu-45-zeno907` canvas 240x112 vs jar 224x86.
- **Finding**: under `-DPLANTUML_DETERMINISTIC_TEXT` the fork's seam
  (`FileFormat.java:185-187`) swaps SVG's `StringBounderSvg` for
  `StringBounderFromWidthTable`, which inherits `matchesProperty` = false
  (`StringBounder.java:43-45`; `StringBounderSvg.java:67-69` returns true for
  "SVG"). `EmbeddedDiagram#calculateDimensionSlow` therefore takes the PNG
  branch (`EmbeddedDiagram.java:139`), `PortableImageAwt.getWidth` NPEs on a
  null image (stderr of `scripts/oracle-render.sh` shows the trace), and the
  catch returns `XDimension2D(42, 42)` (`:150-152`). `drawU` still draws the
  real 213x75 SVG image, which overflows its 42x42 slot; the SVG canvas then
  grows to the drawn extent (223+1, 85+1). The stock jar (no flag) reserves
  the real size: 241x114 canvas, 214x77 image, i.e. the port's behaviour.
- **Impact**: every oracle golden with an embedded `{{ }}` diagram carries a
  42x42 layout slot that stock PlantUML never produces. Matching it in the
  port would be fitting to an instrument artifact. Needs an orchestrator
  ruling: fix the seam (StringBounderFromWidthTable.matchesProperty("SVG"))
  and re-render, or record an accepted divergence.
- **Confidence**: High (stack trace + controlled flag on/off run).
