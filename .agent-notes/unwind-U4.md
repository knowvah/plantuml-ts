# unwind-U4 — default skin, sprite/img rasters, embedded {{ }} payloads

## Observation: default element skin was never a divergence
- **Context**: settling DIVERGENCES.md "Default element skin — grey".
- **Finding**: the pinned jar draws #F1F1F1/#181818 elements and a #FEFFDD
  note for class/object/usecase/component/state (plantuml.skin:2-3,16-17,324);
  ours equals it on every paint attribute. Fixtures:
  tests/fixtures/unwind-U4/skin/. component/usecase carry an unrelated 5 px
  package/rectangle cluster-label y residual (not paint).
- **Impact**: retire the entry; the cluster residual belongs to a cluster task.
- **Confidence**: High

## Observation: the jar's sprite tint starts from the UGraphic back colour
- **Context**: pixel-comparing sprite PNGs with the jar.
- **Finding**: SpriteMonochrome#asTextBlock.drawU (java:216-217) tints with
  `forcedColor ?? fontColor` over `ug.getParam().getBackcolor()` — the
  element fill (#FEFFDD note, #F1F1F1 class, #E2E2F0 participant). With
  those inputs the port's tint + scaleBilinear is pixel-identical to the jar
  on 9 real fixtures (unwind-u4-sprite.test.ts). The class/description
  creole resolvers resolve at LAYOUT time and have no back colour, so they
  still tint over white. (Corrected by unwind2-S6: the participant path is
  white end to end too; owned by unwind2-S7.) Fix needs the fill threaded to render time (class rows, notes,
  namespace titles, edge labels, description atoms).
- **Impact**: open follow-on; pixels only (hrefs are exempt from compare).
- **Confidence**: High

## Observation: AffineTransformOp bilinear, clean-room model
- **Context**: porting PortableImageAwt#scale.
- **Finding**: medialib source is GPL, so the model was derived by black-box
  measurement (tests/fixtures/unwind-U4/bilinear/Bl.java + cases.txt):
  pixels whose centre maps past the source stay 0; interior = 16.16 fixed,
  vertical-then-horizontal, round-half-up per stage, X accumulated from the
  first interior column with step floor(65536/s), Y computed per row;
  edge band = clamped coords, floored exact sum. 24/54248 channel values
  still off by one (downscale, vertical half-pixel ties) — unexplained.
- **Impact**: do not "fix" the residual by tuning; it needs the mechanism.
- **Confidence**: High for the model's fit, Low for why the 24 differ.

## Observation: jar PNG bytes are zlib 1.2.13 level 4
- **Context**: is sprite/img href byte equality reachable?
- **Finding**: the JDK's libzip bundles zlib 1.2.13 (strings), PNGImageWriter
  uses Deflater(DEFAULT_COMPRESSION_LEVEL=4) with 32768-byte IDAT chunks and
  filter 0 for every non-palette row (RowFilter). Jar IDATs are dynamic or
  stored DEFLATE blocks chosen by zlib; ours are fixed-Huffman. IHDR/chunk
  list/filters already match.
- **Impact**: byte equality needs a zlib-deflate port (or pako, MIT+Zlib);
  separable from everything else.
- **Confidence**: High

## Observation: sprites are not drawn at all in several engines
- **Context**: sprite fixtures across contexts (tests/fixtures/unwind-U4/sprite/ctx-*).
- **Finding**: `<$foo>` renders no <image> in sequence messages, description
  (usecase) notes, activity labels (no width reserved either) and state
  labels (width reserved, image missing). Class rows/notes/names and
  component labels are geometry-exact.
- **Impact**: port gaps, one per engine; jar renders are in place.
- **Confidence**: High

## Observation: nested {{ }} renders differ in the jar only via the fork's seam
- **Context**: decoding embedded payloads.
- **Finding**: the jar payload = SvgGraphics#svgImage wrapper around
  UImageSvg#getSvg of the nested export (byte-identical for a nested
  sequence). For a nested CLASS the jar draws the spot letter as <text
  monospace> because the deterministic bounder reports SVG_DETERMINISTIC
  (FileFormat.java:185-187), EmbeddedDiagram passes it to the nested export,
  and DriverCenteredCharacterSvg.java:65-70 switches on it; top-level renders
  draw a <path>. Same seam family as the 42x42 slot.
- **Impact**: instrument artefact; never mirror it.
- **Confidence**: High

## Observation: renderSync sequence output diverges from this jar
- **Context**: top-level `Alice -> Bob : hi` via renderSync vs oracle-render.
- **Finding**: 19 diffs (missing stroke-width 0.5, rx/ry 2.5, text fill
  #181818 vs #000). Not investigated; the sequence harness may render
  differently from renderSync.
- **Impact**: check before trusting renderSync-based sequence comparisons.
- **Confidence**: Medium

## Observation: unported nested engines now draw the unknown-type sentinel
- **Context**: activity style census moved on bozido-07-geze049 after the
  UImageSvg port.
- **Finding**: `{{wbs}}`/`{{salt}}`/`{{gantt}}` have no engine here, so the
  nested renderSync returns the dispatcher's 300x60 "unknown diagram type"
  sentinel, which has no viewBox. The old local guard threw on a missing
  viewBox and the slot fell back to EmbeddedDiagram's 42x42 catch, drawing
  nothing; UImageSvg#getData's own fallback (UImageSvg.java:139-144) reads the
  root width/height, so the sentinel is now drawn in a 300x60 slot.
- **Impact**: the census pin moves (width/height histograms); the real fix is
  porting those engines. Re-pin from a fresh measurement.
- **Confidence**: High
