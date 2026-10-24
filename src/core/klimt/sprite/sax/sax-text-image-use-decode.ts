import { parsePngIhdrFromDataUri } from '../png-ihdr.js';

/**
 * Decoding of the `data:image/...;base64,` hrefs of `<image>`: what
 * `SvgSaxParser.decodeDataImage` reads off `SImageIO.read` (split out of
 * `sax-text-image-use.ts` for the 500-line limit; plans/sequence-divergence-
 * drive-3 batch-4 T4d).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgSaxParser.java:754-800
 */

/** The two numbers upstream reads off the decoded `PortableImage`. */
export interface ImageSize {
  readonly width: number;
  readonly height: number;
}

const DATA_PNG_PREFIX = 'data:image/png;base64,';
const DATA_JPEG_PREFIX = 'data:image/jpeg;base64,';
const DATA_JPG_PREFIX = 'data:image/jpg;base64,';
const DATA_SVG_PREFIX = 'data:image/svg+xml;base64,';

/** @see SvgSaxParser.java:788-800 getDataImagePrefix */
function getDataImagePrefix(lowerHref: string): string | undefined {
  return [DATA_PNG_PREFIX, DATA_JPEG_PREFIX, DATA_JPG_PREFIX].find((prefix) => lowerHref.startsWith(prefix));
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_QUANTUM = 4;

/**
 * `Base64Coder.decode(String)`: strict, the length must be a multiple of 4,
 * no whitespace, trailing `=` stripped. `undefined` where upstream throws
 * `IllegalArgumentException` (caught at :771-775). Hand-rolled: no Node
 * `Buffer`/`atob` in `src/`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/Base64Coder.java:261-294
 */
function decodeBase64Strict(input: string): Uint8Array | undefined {
  if (input.length % BASE64_QUANTUM !== 0) return undefined;
  let end = input.length;
  while (end > 0 && input.charAt(end - 1) === '=') end--;
  const out: number[] = [];
  let accumulator = 0;
  let bits = 0;
  for (let i = 0; i < end; i++) {
    const value = BASE64_ALPHABET.indexOf(input.charAt(i));
    if (value === -1) return undefined;
    accumulator = accumulator * 64 + value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      const divisor = 2 ** bits;
      out.push(Math.floor(accumulator / divisor));
      accumulator %= divisor;
    }
  }
  return Uint8Array.from(out);
}

const JPEG_MARKER_PREFIX = 0xff;
const JPEG_SOI = 0xd8;
const JPEG_EOI = 0xd9;
const JPEG_SOS = 0xda;
const JPEG_TEM = 0x01;
const JPEG_RST_FIRST = 0xd0;
const JPEG_RST_LAST = 0xd7;
/** Huffman baseline, extended sequential, progressive (ITU T.81 table B.1). */
const JPEG_SOF_SUPPORTED: ReadonlySet<number> = new Set([0xc0, 0xc1, 0xc2]);
/**
 * Markers that end the search without a usable frame: EOI and SOS (no frame
 * header before them), and the lossless and arithmetic-coded frames
 * (libjpeg's `JERR_SOF_UNSUPPORTED`).
 */
const JPEG_NO_FRAME_MARKERS: ReadonlySet<number> = new Set([
  JPEG_EOI,
  JPEG_SOS,
  0xc3,
  0xc5,
  0xc6,
  0xc7,
  0xc9,
  0xca,
  0xcb,
  0xcd,
  0xce,
  0xcf,
]);
/** `JERR_BAD_PRECISION` accepts 8 bits here. */
const JPEG_PRECISION = 8;
/** Offsets from the 0xFF of a frame header: length(2) precision(1) height(2) width(2) (T.81 B.2.2). */
const SOF_PRECISION_AT = 4;
const SOF_HEIGHT_AT = 5;
const SOF_WIDTH_AT = 7;
const SOF_MIN_BYTES = 9;
const SEGMENT_LENGTH_AT = 2;
const SEGMENT_MIN_LENGTH = 2;

const u16 = (bytes: Uint8Array, at: number): number => bytes[at]! * 256 + bytes[at + 1]!;

/** The size in a frame header at `pos` (the 0xFF), when it is a frame `javax.imageio` decodes. */
function readSofSize(bytes: Uint8Array, pos: number): ImageSize | undefined {
  if (pos + SOF_MIN_BYTES > bytes.length || bytes[pos + SOF_PRECISION_AT] !== JPEG_PRECISION) return undefined;
  const height = u16(bytes, pos + SOF_HEIGHT_AT);
  const width = u16(bytes, pos + SOF_WIDTH_AT);
  return width > 0 && height > 0 ? { width, height } : undefined;
}

/** Markers that carry no length (`TEM`, `RSTn`). */
const isStandalone = (marker: number): boolean =>
  marker === JPEG_TEM || (marker >= JPEG_RST_FIRST && marker <= JPEG_RST_LAST);

interface JpegMarker {
  /** Index of the marker's 0xFF prefix, after any fill bytes (T.81 B.1.1.2). */
  readonly at: number;
  readonly marker: number;
}

/** The marker at `pos`, `undefined` when the stream does not have one there. */
function findMarker(bytes: Uint8Array, pos: number): JpegMarker | undefined {
  if (bytes[pos] !== JPEG_MARKER_PREFIX) return undefined;
  let at = pos;
  while (bytes[at + 1] === JPEG_MARKER_PREFIX) at++;
  const marker = bytes[at + 1];
  return marker === undefined ? undefined : { at, marker };
}

/** Index just past the length-prefixed (or standalone) segment, `undefined` when malformed. */
function segmentEnd(bytes: Uint8Array, { at, marker }: JpegMarker): number | undefined {
  if (isStandalone(marker)) return at + 2;
  if (at + SEGMENT_LENGTH_AT + 1 >= bytes.length) return undefined;
  const length = u16(bytes, at + SEGMENT_LENGTH_AT);
  return length < SEGMENT_MIN_LENGTH ? undefined : at + 2 + length;
}

/**
 * The pixel size of a JPEG: the marker walk from SOI to the frame header.
 * `SImageIO.read(byte[])` (`ImageIO.read`, :777) decodes the whole image;
 * only its width and height are read at :696-700, and a pure `src/` has no
 * entropy decoder, so a stream whose scan data is corrupt reads here as an
 * image where the jar's decoder would reject it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/security/SImageIO.java:62-64
 */
function readJpegSize(bytes: Uint8Array): ImageSize | undefined {
  if (bytes[0] !== JPEG_MARKER_PREFIX || bytes[1] !== JPEG_SOI) return undefined;
  let pos = 2;
  while (pos + 1 < bytes.length) {
    const found = findMarker(bytes, pos);
    if (found === undefined || JPEG_NO_FRAME_MARKERS.has(found.marker)) return undefined;
    if (JPEG_SOF_SUPPORTED.has(found.marker)) return readSofSize(bytes, found.at);
    const next = segmentEnd(bytes, found);
    if (next === undefined) return undefined;
    pos = next;
  }
  return undefined;
}

/**
 * `SImageIO.read(bytes)` reduced to the size, `undefined` where it returns
 * `null`. PNG goes through the existing IHDR reader (`png-ihdr.ts`), which
 * validates signature, chunk type, dimensions, depth and colour type; the
 * IDAT stream is not inflated, so a PNG with a good header and a corrupt body
 * reads as an image here.
 *
 * @see SvgSaxParser.java:777-780
 */
function readImageSize(bytes: Uint8Array, base64Data: string): ImageSize | undefined {
  return parsePngIhdrFromDataUri(DATA_PNG_PREFIX + base64Data) ?? readJpegSize(bytes);
}

/**
 * @see SvgSaxParser.java:754-787 decodeDataImage
 */
export function decodeDataImage(href: string): ImageSize | undefined {
  const lowerHref = href.toLowerCase();
  if (lowerHref.startsWith(DATA_SVG_PREFIX)) return undefined; // :756-760
  const prefix = getDataImagePrefix(lowerHref);
  if (prefix === undefined) return undefined; // :761-765
  const data = href.substring(prefix.length);
  const bytes = decodeBase64Strict(data);
  return bytes === undefined ? undefined : readImageSize(bytes, data);
}
