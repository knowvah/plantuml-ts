# unwind2-S6 — sprite/raster PNG bytes equal the jar's

## Observation: pako 3 needs `legacyHash: true` to match stock zlib
- **Context**: deflating sprite scanlines with pako 3.0.2 at level 4 to match
  the jar's IDAT.
- **Finding**: pako 3 (a port of zlib 1.3.2) defaults to Chromium zlib's
  multiplicative 4-byte insert hash (`Math.imul(value, 66521)`, and forces
  hash_bits >= 15). It finds different LZ77 matches: 12 of 23 jar streams
  differed (e.g. `ctx-activity`: pako emitted a stored block, zlib a fixed
  block with three length-3 matches at distance 21/45/67 that pako coded as
  literals). `legacyHash: true` restores zlib's rolling `UPDATE_HASH`; with it
  pako equals the jar on all 27 fixture PNGs and all 211 distinct RGBA PNGs
  in test-results/dot-cache + oracle/goldens. Real zlib 1.3.1, 1.3.2 (built
  from source) and Python's zlib 1.2.13 all equal the jar too, so no
  1.2.13-vs-1.3.x deflate difference exists on this input set.
- **Impact**: never drop `legacyHash` from `png-encoder.ts`; a pako upgrade
  must re-run tests/unit/core/klimt/sprite/png-encoder-jar.test.ts.
- **Confidence**: High

## Observation: JDK deflate parameters
- **Context**: provenance for windowBits/memLevel.
- **Finding**: `new Deflater(4)` -> `init(level, DEFAULT_STRATEGY, false)`
  (Deflater.java:203,211-213) -> `deflateInit2(strm, level, Z_DEFLATED,
  MAX_WBITS, DEF_MEM_LEVEL=8, strategy)` (OpenJDK libzip/Deflater.c:39,52-54,
  not in src.zip; fetched from openjdk/jdk21u). The JDK feeds rows with
  NO_FLUSH through a 512-byte output buffer; output equals a one-shot
  deflate (verified with java.util.zip directly).
- **Impact**: one-shot `deflate` is a faithful model of IDATOutputStream.
- **Confidence**: High

## Observation: end-to-end sprite bytes still differ — pixels, not encoder
- **Context**: renderSync on tests/fixtures/unwind-U4/sprite and unwind2-S6.
- **Finding**: every rendered sprite payload differs from the jar because the
  pixels differ: the tint starts from #FFFFFF where the jar uses the element
  fill (unwind-U4 note). This includes `s1-seq-participant` and the
  unwind2-S6 participant fixtures (first pixel jar 226,226,240,0 vs ours
  255,255,255,0), so the participant path does NOT currently pass the real
  fill end to end, contrary to the unwind-U4 note's wording.
- **Impact**: byte equality end to end waits on the back-colour follow-on.
- **Confidence**: High

## Observation: four corpus PNGs are not RGBA
- **Context**: corpus-wide encoder check.
- **Finding**: activity/ticoxo-71-jile893 (colour type 3, palette),
  activity/gabeme-89-tiko230, unknown/kavama-92-noro949,
  unknown/kicizi-84-lexu138 (colour type 2, RGB) — the jar keeps the source
  image's type. `encodePng` writes RGBA only; these come from `<img>`
  sources, which pass through verbatim here.
- **Impact**: only relevant if `<img>` re-encoding is ever ported.
- **Confidence**: High
