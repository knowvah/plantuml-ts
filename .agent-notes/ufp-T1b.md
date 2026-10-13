# ufp-T1b — PSystemColors

## Observation: HColorSimple#opposite is unported (stop 10)
- **Context**: porting `eggs/PSystemColors.java#getTextName` (java:285-291), which builds every label's
  font colour as `color.opposite()` (java:286).
- **Finding**: `src/core/klimt/color/HColorSimple.ts` lists `opposite` as not ported (header doc, line 29).
  Upstream `HColorSimple.java:211-215`: `mono = ColorUtils.getGrayScaleColor(color); grayScale =
  255 - mono.getGreen() > 127 ? 255 : 0; return HColorSimple.create(new XColor(g, g, g))`.
  `ColorUtils.getGrayScaleColor` is already ported (`ColorUtils.ts:20`).
- **Impact**: both corpus rows (jigemu-90 `colors`, kenari-17 `colors Chocolate`) draw every label
  through it; PSystemColors cannot be ported without it. Pre-existing local copies of the same
  arithmetic exist in `src/diagrams/class/renderer-classifier-row-font-color.ts#isDarkHex`.
- **Confidence**: High

## Observation: `colors automatic` reaches unported HColorAutomagic
- **Context**: the "argument that is not a colour" acceptance row.
- **Finding**: `HColorSet.java:85-86` returns `new HColorAutomagic()` for `automatic`; the port's
  `HColorSet.ts#parseColor` throws `unported('HColorAutomagic')`. Jar probe (oracle-render.sh,
  1.2026.8beta1): `colors automatic` draws the FULL grid (1401x589) because HColorAutomagic is not an
  HColorSimple (PSystemColors.java:99,122); `colors foo` draws the PALETTE around White (581x482)
  because `getColorOrWhite` returns `HColors.WHITE`, an HColorSimple, for an unknown name.
- **Impact**: the `automatic` branch needs HColorAutomagic (or at least a non-throwing,
  non-HColorSimple result from getColorOrWhite) in core before PSystemColors can mirror it.
- **Confidence**: High (jar probe)

## Observation: no bold UFontFace / UFont#withFontFace in core
- **Context**: `UFontFactory.sansSerif(14).withFontFace(UFontFace.bold())` (java:177, :264).
- **Finding**: `UFont.ts` does not port `withFontFace` (UFont.java:89-93); there is no `UFontFace.bold()`
  constant — `style/ValueImpl.ts:197` spells it `{ cssWeight: 700, italic: false }`. Expressible through
  the public `UFont` constructor (`new UFont(font.getFontStack(), BOLD, font.getSize())`).
- **Impact**: not blocking; noted for whoever ports UFont fully.
- **Confidence**: High
