## Observation: SpriteImage measures one pixel less than it draws
- **Context**: porting SpriteImage.java:60-100 for xucoma-93 (listsprite)
- **Finding**: `UImage#getWidth()` is `image.getWidth() - 1` (UImage.java:87-93), so a 16x16 internal PNG measures `15 * scale` (13.846 at font 12) while `SvgGraphics#svgImage` emits the resampled raster's own size, `round(16 * scale)` = 15 (SvgGraphics.java:973-974). The port's `UImage`/`driver-image-svg.ts` emits `Math.round(declared)`, which would give 14; the resolver therefore returns the atom as `'drawable'` (one collected `UImage` built at raster size) rather than `'image'`.
- **Impact**: any future raster sprite kind whose declared box is not `round(raster)` needs the same route, or a driver that emits `rasterWidth` (SvgGraphics semantics).
- **Confidence**: High (xucoma-93 0 diffs; 23 hrefs byte-identical to the jar)

## Observation: the jar's muted PNG carries alpha 0xFE, not 0xFF
- **Context**: deciding whether the jar tints internal PNG sprites
- **Finding**: `PixelImage#muteColor` writes `newColor.getRGB() + a` (PixelImage.java:109) — Java int addition of two 0xFF alpha bytes overflows to 0xFE. The jar's xucoma `<image>` hrefs equal the muted rendition byte for byte and differ from the raw one.
- **Impact**: muting must be done in Java int arithmetic (`(rgb + a) | 0`), not by channel assignment.
- **Confidence**: High

## Observation: listsprite lists 23 PNG sprites, not 24
- **Context**: T3a brief says "24 of 139 archimate entries are PNG"
- **Finding**: `archimate-sprite-names.ts` has 23 `format: 'png'` entries (a grep for `'png'` also counts the `format: 'png' | 'svg'` type line); the jar draws 23 `<image>`s; `assets/sprites/archimate/*.png` is 23 files.
- **Impact**: count PNG rows with the data, not a grep of the source.
- **Confidence**: High

## Observation: vendored PNGs use two encodings only
- **Context**: writing the `SImageIO.read` stand-in (`internal-sprite-store.ts#readPng`)
- **Finding**: 21 archimate PNGs are 8-bit RGBA (filters 0/1/2, zlib 78da); `assignment.png` and `association-unidirect.png` are 1-bit indexed with `PLTE` + `tRNS`. None is greyscale, 16-bit or interlaced. Greyscale is declined on purpose: Java's grey `ColorModel#getRGB` is a colour-space conversion, not the stored byte.
- **Impact**: a new vendored sprite in another encoding resolves to `undefined` (fromInternal's null) until the decoder grows.
- **Confidence**: High
