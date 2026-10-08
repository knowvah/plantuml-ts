/**
 * Deterministic PNG writer, browser-safe, synchronous: the byte stream the
 * jar's `javax.imageio` PNG writer produces for a sprite raster.
 *
 * The jar writes every raster through `SvgGraphics#toBase64` ->
 * `SImageIO.write(image, "png", baos)` (`SvgGraphics.java:1055-1059`,
 * `SImageIO.java:75-77`) -> `ImageIO.write` with NO write param, so the
 * JDK's `com.sun.imageio.plugins.png.PNGImageWriter` emits, in order
 * (`PNGImageWriter.java:1262-1292`): the signature, IHDR, the IDAT run,
 * IEND -- no ancillary chunks for a metadata-less `BufferedImage`.
 *
 * - Filter: `RowFilter#filterRow` returns 0 for every non-palette row
 *   (`RowFilter.java:93-98`), so each scanline is `0x00` + the raw RGBA row.
 * - Compression: `new Deflater(deflaterLevel)` (`PNGImageWriter.java:182`)
 *   with `deflaterLevel = DEFAULT_COMPRESSION_LEVEL = 4`
 *   (`PNGImageWriter.java:364,1213`). `Deflater(int)` is
 *   `this(level, false)` -> `init(level, DEFAULT_STRATEGY, nowrap=false)`
 *   (`Deflater.java:203,211-213`), and the native side calls
 *   `deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL=8,
 *   strategy)` (OpenJDK `libzip/Deflater.c:39,52-54`): a zlib-wrapped stream,
 *   windowBits 15, memLevel 8, strategy 0. The JDK bundles zlib 1.2.13.
 * - Chunking: `new IDATOutputStream(stream, 32768, deflaterLevel)`
 *   (`PNGImageWriter.java:1035`) cuts the deflate output into IDAT chunks of
 *   exactly 32768 bytes, the last one short (`IDATOutputStream#deflate`,
 *   `PNGImageWriter.java:246-264`; `finish`, :272-283). The input is fed
 *   row by row with `Z_NO_FLUSH`, which leaves the stream identical to a
 *   one-shot deflate of the whole scanline buffer.
 *
 * Deflate is `pako` (MIT AND Zlib). `legacyHash: true` is load-bearing:
 * pako 3 defaults to Chromium zlib's multiplicative 4-byte insert hash,
 * which finds different LZ77 matches; `legacyHash` restores stock zlib's
 * rolling `UPDATE_HASH` (`((h << hash_shift) ^ c) & hash_mask`, zlib
 * `deflate.c`). With it the output equals the jar's IDAT byte for byte on
 * every fixture in `tests/fixtures/unwind-U4/` and `tests/fixtures/unwind2-S6/`.
 *
 * @see https://www.rfc-editor.org/rfc/rfc2083 (PNG)
 */

import { deflate } from 'pako';

/** 8-byte PNG file signature (`PNGImageWriter#write_magic`, RFC 2083 section 3.1). */
const PNG_SIGNATURE: readonly number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** `PNGImageWriter.DEFAULT_COMPRESSION_LEVEL` (`PNGImageWriter.java:364`). */
const DEFLATER_LEVEL = 4;
/** `MAX_WBITS` passed by OpenJDK `libzip/Deflater.c:53` when `nowrap` is false. */
const ZLIB_WINDOW_BITS = 15;
/** `DEF_MEM_LEVEL` (OpenJDK `libzip/Deflater.c:39`). */
const ZLIB_MEM_LEVEL = 8;
/** `Deflater.DEFAULT_STRATEGY` (`Deflater.java:152`) = zlib `Z_DEFAULT_STRATEGY`. */
const ZLIB_DEFAULT_STRATEGY = 0;
/** IDAT chunk length (`PNGImageWriter.java:1035`). */
const IDAT_CHUNK_LENGTH = 32768;

const CRC32_POLYNOMIAL = 0xedb88320;
const CRC32_SEED = 0xffffffff;

const PNG_BIT_DEPTH_8 = 8;
/** PNG color type 6 = truecolor with alpha (RGBA). */
const PNG_COLOR_TYPE_RGBA = 6;
const PNG_COMPRESSION_METHOD_DEFLATE = 0;
const PNG_FILTER_METHOD_ADAPTIVE = 0;
const PNG_INTERLACE_METHOD_NONE = 0;
/** Per-scanline filter type 0 (None) -- `RowFilter.java:93-98`. */
const SCANLINE_FILTER_NONE = 0;

/** Bytes per pixel for 8-bit RGBA. */
export const RGBA_BYTES_PER_PIXEL = 4;

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

let crc32TableCache: Uint32Array | undefined;

function getCrc32Table(): Uint32Array {
  if (crc32TableCache !== undefined) return crc32TableCache;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? CRC32_POLYNOMIAL ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  crc32TableCache = table;
  return table;
}

/** CRC-32 (zlib/PNG polynomial 0xEDB88320), matching a PNG chunk's trailing CRC. */
export function crc32(data: Uint8Array): number {
  const table = getCrc32Table();
  let crc = CRC32_SEED;
  for (let i = 0; i < data.length; i++) {
    const index = (crc ^ data[i]!) & 0xff;
    crc = table[index]! ^ (crc >>> 8);
  }
  return (crc ^ CRC32_SEED) >>> 0;
}

function writeUint32BE(value: number): Uint8Array {
  return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const part of parts) total += part.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Wraps `type` (a 4-char ASCII chunk tag) + `data` into a length-prefixed, CRC-suffixed PNG chunk. */
function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array(type.length);
  for (let i = 0; i < type.length; i++) typeBytes[i] = type.charCodeAt(i);
  const crc = writeUint32BE(crc32(concatBytes([typeBytes, data])));
  return concatBytes([writeUint32BE(data.length), typeBytes, data, crc]);
}

/**
 * The zlib stream `new Deflater(4)` produces for `raw` (see the file header
 * for the parameter provenance).
 */
function deflateLikeJdk(raw: Uint8Array): Uint8Array {
  return deflate(raw, {
    level: DEFLATER_LEVEL,
    windowBits: ZLIB_WINDOW_BITS,
    memLevel: ZLIB_MEM_LEVEL,
    strategy: ZLIB_DEFAULT_STRATEGY,
    legacyHash: true,
  });
}

/**
 * Cuts `zlibStream` into IDAT chunks of `IDAT_CHUNK_LENGTH` bytes, the last
 * one short -- `IDATOutputStream#deflate` starts a new chunk only when the
 * current one is full AND more output remains (`PNGImageWriter.java:250-254`),
 * so a stream that is an exact multiple never gets a trailing empty IDAT.
 */
function idatChunks(zlibStream: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < zlibStream.length; offset += IDAT_CHUNK_LENGTH) {
    chunks.push(pngChunk('IDAT', zlibStream.subarray(offset, offset + IDAT_CHUNK_LENGTH)));
  }
  return chunks;
}

/** Prepends filter-type-0 (None) to every scanline (`RowFilter.java:93-98`). */
function buildScanlines(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const rowStride = width * RGBA_BYTES_PER_PIXEL;
  const rowBytes = 1 + rowStride;
  const out = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    out[rowStart] = SCANLINE_FILTER_NONE;
    out.set(rgba.subarray(y * rowStride, (y + 1) * rowStride), rowStart + 1);
  }
  return out;
}

/** IHDR payload (`PNGImageWriter#write_IHDR`, `PNGImageWriter.java:468-492`). */
function buildIhdrData(width: number, height: number): Uint8Array {
  return concatBytes([
    writeUint32BE(width),
    writeUint32BE(height),
    new Uint8Array([
      PNG_BIT_DEPTH_8,
      PNG_COLOR_TYPE_RGBA,
      PNG_COMPRESSION_METHOD_DEFLATE,
      PNG_FILTER_METHOD_ADAPTIVE,
      PNG_INTERLACE_METHOD_NONE,
    ]),
  ]);
}

/**
 * Encodes `rgba` (row-major, 4 bytes/pixel, `width * height * 4` bytes
 * total) into the 8-bit RGBA PNG the jar's `PNGImageWriter` writes for the
 * same pixels: signature, IHDR, IDAT run, IEND. Deterministic.
 */
export function encodePng(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const expectedLength = width * height * RGBA_BYTES_PER_PIXEL;
  if (width <= 0 || height <= 0) {
    throw new Error(`encodePng: invalid dimensions ${width}x${height}`);
  }
  if (rgba.length !== expectedLength) {
    throw new Error(`encodePng: rgba.length ${rgba.length} does not match ${width}x${height}x4 (${expectedLength})`);
  }

  const signature = new Uint8Array(PNG_SIGNATURE);
  const ihdr = pngChunk('IHDR', buildIhdrData(width, height));
  const idats = idatChunks(deflateLikeJdk(buildScanlines(rgba, width, height)));
  const iend = pngChunk('IEND', new Uint8Array(0));
  return concatBytes([signature, ihdr, ...idats, iend]);
}

/** Standard (RFC 4648) base64 encoding -- NOT PlantUML's 6-bit sprite alphabet. */
export function toBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]!;
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : undefined;

    result += BASE64_ALPHABET[b1 >> 2];
    result += BASE64_ALPHABET[((b1 & 0x03) << 4) | (b2 === undefined ? 0 : b2 >> 4)];
    result += b2 === undefined ? '=' : BASE64_ALPHABET[((b2 & 0x0f) << 2) | (b3 === undefined ? 0 : b3 >> 6)];
    result += b3 === undefined ? '=' : BASE64_ALPHABET[b3 & 0x3f];
  }
  return result;
}

/** `data:image/png;base64,...` URI for `pngBytes` (a PNG produced by `encodePng`). */
export function toBase64DataUri(pngBytes: Uint8Array): string {
  return `data:image/png;base64,${toBase64(pngBytes)}`;
}
