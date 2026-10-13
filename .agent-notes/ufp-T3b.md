# ufp-T3b — `<qrcode:>` under the MIT edition + License MIT branches

## Observation: the MIT qrcode PNG is reproducible byte for byte from the jar's own classes
- **Context**: pinning `AtomImg.createQrcode`'s image when the GPL oracle jar draws real QR codes.
- **Finding**: a single-file Java probe on the 1.2026.8beta1 jar's classpath can run upstream's MIT path directly: `new FlashCodeUtilsNone().exportFlashcode(...)` -> `PortableImageFactory.build(10, 10, TYPE_INT_RGB)` -> `new UImage(new PixelImage(im, TYPE_NEAREST_NEIGHBOR)).scale(s).getImage(1)` -> `SImageIO.write(out, "png", baos)`. The port's `png-encoder.ts` output equals those bytes for every scale != 1 tested (3, 2.5, 1.05, 0.15).
- **Impact**: edition-dependent behaviour (D13) can still be measured against the JDK, not just against the Java source. Compile with `javac -cp <jar> X.java`, run with `java -cp <jar>:. X`.
- **Confidence**: High

## Observation: AffineTransformOp nearest-neighbour leaves edge pixels transparent at non-integer scales
- **Context**: `PortableImageAwt#scale` (java:113-128) for `{scale=N}`.
- **Finding**: the destination is `Math.round(size * s)` square `TYPE_INT_ARGB`, but medialib's `mlib_AffineEdges` (`mlib_ImageScanPoly.c`) writes only pixels whose centre maps inside the source, with its own double arithmetic (`(x + 0.5) * s >= srcSize * (s * s)` drops a column). At s = 1.05 the 11th row/column stays transparent; at 0.05 the single pixel is written and samples source (9,9). A naive `(i + 0.5) / s < 10` model is wrong at 7 of 596 scales (0.05, 0.45, 2.35, 2.45, 3.45, 3.85, 4.45). The ported `AtomImgPortableImage.ts` matched the JDK cell for cell over 396 scales on a 10x10 grid of distinct pixels.
- **Impact**: any future port of `PortableImageAwt#scale` (sprites, `<img>` scaling) should reuse `scalePortableImage`, not a centre-sampling shortcut. OpenJDK native sources: `raw.githubusercontent.com/openjdk/jdk21u/master/src/java.desktop/share/native/libmlib_image/`.
- **Confidence**: High (measured)

## Observation: at scale 1 the jar writes an RGB PNG the port cannot
- **Context**: `<qrcode:x{scale=1}>`.
- **Finding**: `PixelImage.getImage` returns the `TYPE_INT_RGB` source unchanged at scale 1 (PixelImage.java:72-73); ImageIO writes PNG colour type 2. `png-encoder.ts#encodePng` writes colour type 6 (RGBA) only, so the port embeds the same 10x10 opaque-black pixels with different bytes. `compareSvg` exempts href bytes, so no diff counts it.
- **Impact**: closing it needs an RGB path in `src/core/klimt/sprite/png-encoder.ts` (outside T3b's write-set).
- **Confidence**: High

## Observation: Parser.getScale returns NaN where Java throws
- **Context**: `{scale=.}` matches `[0-9.]+`.
- **Finding**: Java's `Double.parseDouble(".")` throws `NumberFormatException` (a crash page); the port's `Parser.ts#getScale` returns `Number.parseFloat('.')` = NaN. `scalePortableImage` then throws the `Width (NaN) ...` message instead of the jar's `NumberFormatException`.
- **Impact**: shared by every `getScale` caller (`<img>`, sprites, emoji); a fix belongs in `src/core/klimt/creole/Parser.ts`.
- **Confidence**: High (Java read; port behaviour read, not rendered)

## Observation: Pattern2 compiles every creole command CASE_INSENSITIVE
- **Context**: porting `CommandCreoleQrcode`'s pattern.
- **Finding**: `Pattern2.compileInternal` passes `Pattern.CASE_INSENSITIVE` (Pattern2.java:114). The starter lookup (`StripeSimple#searchCommand`) is exact, so `<qRCODE:x>` matches but `<QRCODE:x>` does not. `Parser.getScale`'s own `SCALE` pattern is case-sensitive, so `{SCALE=2}` is consumed as part of the tag but keeps the default scale.
- **Impact**: other ported commands that build a JS `RegExp` without the `i` flag may diverge on mixed-case input (not audited here).
- **Confidence**: High
