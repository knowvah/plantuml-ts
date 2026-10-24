/**
 * `<img>` source handling split out of `creole-atoms.ts` (500-line cap): the
 * src-string clean-up (`CommandCreoleImg.executeAndAdvance`), the
 * cannot-decode fallback texts (`AtomImg.create`), and the
 * `data:image/svg+xml;base64,` branch (`AtomImg.java:153-161`).
 *
 * Pure, dependency-free module: `creole-atoms.ts` imports it, never the
 * reverse.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java
 */

import { UImageSvg, svgImagePayload } from './klimt/shape/UImageSvg.js';
import { parsePngIhdrFromDataUri } from './klimt/sprite/png-ihdr.js';
import { toBase64 } from './klimt/sprite/png-encoder.js';

/** StringUtils.isDoubleQuote: straight, curly, and guillemet double-quote
 *  glyphs. `\x22` is the straight double-quote hex escape -- this file
 *  avoids the raw `"` glyph per the lizard quote-desync workaround. */
const DOUBLE_QUOTE_CHARS: ReadonlySet<string> = new Set(['\x22', '“', '”', '«', '»']);

const SRC_PREFIX = 'src=';

/** `AtomImg.java:77`. */
const DATA_IMAGE_SVG_BASE64 = 'data:image/svg+xml;base64,';

/** `AtomImg.java:75`. */
const DATA_IMAGE_PNG_BASE64 = 'data:image/png;base64,';

/** Short cannot-decode text — used for the `<img>` src forms where upstream
 *  ALSO emits no source string: a file src that doesn't resolve under a
 *  non-INSECURE security profile (`AtomImg.java:176,190`), and — as a
 *  DELIBERATE, retained divergence — a data-URI whose bytes fail to decode.
 *  Upstream's `buildRasterFromData` embeds the FULL source there
 *  (`'(Cannot decode: ' + source + ')'`, `AtomImg.java:206`), but that source
 *  is the entire, potentially megabyte-long data URI, which is not useful
 *  rendered text; this browser-safe port keeps the short form for the
 *  data-URI/file cases only. The URL cases are ported faithfully -- see
 *  `cannotDecodeText`. */
const CANNOT_DECODE_TEXT = '(Cannot decode)';

/** Faithful port of `AtomImg.create`'s cannot-decode text for a `<img>` src
 *  this synchronous, browser-safe renderer cannot fetch or decode. Upstream
 *  routes an `http:`/`https:` src (which this port never fetches, so it
 *  ALWAYS lands on the fetch-failed branch) through `buildRasterFromUrl` /
 *  `buildSvgFromUrl`, both of which embed the FULL url in the fallback text:
 *  `(Cannot decode: <url>)` for a raster URL (`AtomImg.java:214,218`) and
 *  `(Cannot decode SVG: <url>)` for a `.svg` URL (`AtomImg.java:226,230`).
 *  Scheme / `.svg` checks are case-sensitive, mirroring upstream's own
 *  `src.startsWith("http:")` / `src.endsWith(".svg")`. Every other src form
 *  keeps the short `CANNOT_DECODE_TEXT`. */
export function cannotDecodeText(src: string): string {
  if (src.startsWith('http:') || src.startsWith('https:')) {
    return src.endsWith('.svg') ? `(Cannot decode SVG: ${src})` : `(Cannot decode: ${src})`;
  }
  return CANNOT_DECODE_TEXT;
}

function stripDoubleQuotes(s: string): string {
  const first = s.charAt(0);
  const last = s.charAt(s.length - 1);
  const isWrapped = s.length > 1 && DOUBLE_QUOTE_CHARS.has(first) && DOUBLE_QUOTE_CHARS.has(last);
  return isWrapped ? s.slice(1, -1) : s;
}

/** CommandCreoleImg.executeAndAdvance, java :79-84: strip a leading
 *  (case-insensitive) `src=`, then strip surrounding double quotes. */
export function stripImgSrc(raw: string): string {
  const trimmed = raw.trim();
  const hasSrcPrefix = trimmed.slice(0, SRC_PREFIX.length).toLowerCase() === SRC_PREFIX;
  const withoutPrefix = hasSrcPrefix ? trimmed.slice(SRC_PREFIX.length) : trimmed;
  return stripDoubleQuotes(withoutPrefix);
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_BAD_LENGTH = 'Length of Base64 encoded input string is not a multiple of 4.';
const BASE64_BAD_CHAR = 'Illegal character in Base64 encoded data.';
const ILLEGAL_ARGUMENT = 'java.lang.IllegalArgumentException';

/** Thrown for a decode failure; `message` is the Java `Exception#toString`. */
class JavaStyleError extends Error {}

/**
 * `Base64Coder.decode(String)` (`utils/Base64Coder.java:261-297`): strict
 * RFC 4648 -- length must be a multiple of 4, no whitespace, trailing `=`
 * stripped. Hand-rolled: no Node `Buffer`/`atob` in `src/`.
 */
function decodeBase64Strict(input: string): Uint8Array {
  if (input.length % 4 !== 0) throw new JavaStyleError(`${ILLEGAL_ARGUMENT}: ${BASE64_BAD_LENGTH}`);
  let end = input.length;
  while (end > 0 && input.charAt(end - 1) === '=') end--;
  const out: number[] = [];
  let accumulator = 0;
  let bits = 0;
  for (let i = 0; i < end; i++) {
    const value = BASE64_ALPHABET.indexOf(input.charAt(i));
    if (value === -1) throw new JavaStyleError(`${ILLEGAL_ARGUMENT}: ${BASE64_BAD_CHAR}`);
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

/** What `AtomImg.create` builds for a `data:image/svg+xml;base64,` source: an
 *  `AtomImgSvg(TileImageSvg(svg, scale))`, here as the token fields the
 *  existing `img` atom already carries. */
export interface SvgImgDecoded {
  /** `<image>` href: the `SvgGraphics#svgImage` payload, re-encoded. */
  readonly dataUri: string;
  /** `UImageSvg#getData` -- native (unscaled) extent; the caller scales. */
  readonly width: number;
  readonly height: number;
}

export function isSvgDataImage(src: string): boolean {
  return src.startsWith(DATA_IMAGE_SVG_BASE64);
}

/**
 * `AtomImg.java:153-161`: decode the base64 body to a string, wrap it in a
 * `UImageSvg(svg, scale)`. Dimensions are `TileImageSvg#calculateDimension`
 * (`UImageSvg#getWidth/getHeight`, the viewBox/width extent x scale) and the
 * emitted href is `SvgGraphics#svgImage`'s re-rooted payload.
 *
 * A failure returns the `AtomTextUtils.createLegacy("ERROR " + e)` text
 * (`AtomImg.java:159`). Upstream decodes lazily, so an SVG with no
 * width/viewBox throws during layout there; here it degrades to the same
 * `ERROR` text -- the one place this port cannot be lazy.
 */
export function decodeSvgDataImage(src: string, scale: number): SvgImgDecoded | string {
  try {
    const bytes = decodeBase64Strict(src.slice(DATA_IMAGE_SVG_BASE64.length));
    const image = new UImageSvg(new TextDecoder('utf-8').decode(bytes), scale);
    const payload = toBase64(new TextEncoder().encode(svgImagePayload(image)));
    return {
      dataUri: DATA_IMAGE_SVG_BASE64 + payload,
      width: image.getData('width'),
      height: image.getData('height'),
    };
  } catch (e) {
    return `ERROR ${e instanceof Error ? e.message : String(e)}`;
  }
}

/**
 * The data URI a retrieved remote image takes into the existing decode paths.
 * `AtomImg.create` sends an `http(s):` src ending `.svg` to `buildSvgFromUrl`
 * (`AtomImg.java:166-167`, `:223-233`: the bytes as UTF-8 text into
 * `AtomImgSvg(TileImageSvg)`, the same construction as the base64 branch
 * `:153-161`), and every other one to `buildRasterFromUrl` (`:169`,
 * `:211-221`). The only raster this port decodes is PNG (`png-ihdr.ts`), so
 * any other format returns `undefined` and the caller keeps the jar's
 * `(Cannot decode: <url>)` text (`:214,218`) -- the jar's ImageIO would draw
 * it. The suffix test is the jar's own and case-sensitive; the mime type
 * plays no part in it.
 */
export function remoteImageToDataUri(url: string, bytes: Uint8Array): string | undefined {
  if (url.endsWith('.svg')) return DATA_IMAGE_SVG_BASE64 + toBase64(bytes);
  const uri = DATA_IMAGE_PNG_BASE64 + toBase64(bytes);
  return parsePngIhdrFromDataUri(uri) === undefined ? undefined : uri;
}
