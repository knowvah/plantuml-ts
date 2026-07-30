/**
 * Creole `<img>` / `<$sprite>` / `<&openiconic>` inline atoms.
 *
 * A sibling of `src/core/creole.ts` (kept in a separate module: creole.ts is
 * already 749 lines, over this repo's 500-line-per-file cap, so any edit to
 * it -- even an unrelated addition -- trips the complexity hook; see
 * `~/.claude/hooks/check-complexity.py`. This file is additive and
 * self-contained; creole.ts is untouched).
 *
 * Faithful ports (mission SI5b+E2r, T6):
 * - `Splitter.imgPatternNoSrcColon` (Splitter.java:58) -- `<img ...>` /
 *   `<img:...>` markup, `src=`-prefix and quote stripping
 *   (CommandCreoleImg.java:79-84).
 * - `Splitter.spritePattern` (Splitter.java:74) -- `<$name>`,
 *   `<$name{scale=N}>`, `<#RRGGBB$name>` forced-color markup
 *   (CommandCreoleSprite.java:81-86).
 * - `StripeSimple.addSprite` (java :228-236): an unknown sprite name
 *   contributes NOTHING -- the atom is silently not added.
 * - `AtomImg`/`AtomSprite` `calculateDimensionSlow` (java AtomImg.java:239,
 *   AtomSprite.java:66): both atoms' dimensions are their SCALED pixel
 *   dims -- `image.getWidth() * scale`, `sprite.width * scale`.
 *
 * G2 N41: `Splitter.openiconPattern` (Splitter.java:72) -- `<&name>`,
 * `<&name{scale=N,color=X}>`, `<#RRGGBB&name>` OpenIconic glyph markup
 * (`CommandCreoleOpenIcon.java`) -- the SAME `scaleOrColor` block shape as
 * `<$sprite>`, just `&` instead of `$` and a narrower `[-\w]+` name charset
 * (no `SpriteUtils.SPRITE_NAME`'s `/`/unicode-letter allowance). Dimension
 * formula (`AtomOpenIconic`) lives in `core/openiconic-glyphs.ts` (its own
 * file -- the path-parsing machinery is unrelated to this file's regex-scan
 * concern and would push it over the 500-line cap); this file only carries
 * the token model + regex recognizer, matching the img/sprite split above.
 *
 * D9 (plans/si5b-stdlib/decisions.md): these atoms contribute their scaled
 * pixel dims to label measurement -- width ADDS to the line's text width,
 * height MAXES with the line's text height -- while their raw markup text
 * stops contributing text width, the same precedent as I5's
 * `resolveInlineLinks` (parse-helpers.ts) for `[[url label]]`.
 */

import { parsePngIhdrFromDataUri } from './klimt/sprite/png-ihdr.js';
import { scanOpenIconSpans, matchOpenIconAt } from './creole-atoms-openicon.js';
import type { UShape } from './klimt/UShape.js';
import type { UTranslate } from './klimt/UTranslate.js';

// ---------------------------------------------------------------------------
// Token model
// ---------------------------------------------------------------------------

/** `width`/`height` are the NATIVE (unscaled) PNG pixel dims read from the
 *  IHDR chunk; `scale` is the markup's `{scale=N}` factor -- multiply at
 *  measurement/render time (AtomImg.calculateDimensionSlow). */
export interface ImgAtomToken {
  kind: 'img';
  dataUri: string;
  scale: number;
  width: number;
  height: number;
}

/** `name` resolves against a per-diagram sprite registry (T4/D8) at
 *  measurement/render time -- this token carries no dims of its own. */
export interface SpriteAtomToken {
  kind: 'sprite';
  name: string;
  scale: number;
  forcedColor?: string;
}

/** G2 N41: an OpenIconic glyph token -- `name` resolves against the fixed
 *  6-glyph table in `openiconic-glyphs.ts` (an unrecognized name contributes
 *  nothing, matching `SpriteAtomToken`'s own "unknown name" precedent).
 *  `forcedColor` is the markup's own `color=`/`#RRGGBB` prefix override;
 *  `undefined` means "use the ambient font color at this position" --
 *  resolved by the CALLER (this file's own whole-line scan has no font
 *  context), mirroring `AtomOpenIconic`'s ctor: `newColor == null ?
 *  fontConfiguration.getColor() : newColor`. */
export interface OpenIconicAtomToken {
  kind: 'openiconic';
  name: string;
  scale: number;
  forcedColor?: string;
}

export type InlineAtomToken = ImgAtomToken | SpriteAtomToken | OpenIconicAtomToken;

/** One ordered piece of a Creole line, for RENDER-time reconstruction (T7):
 *  unlike `textWithoutAtoms` (which concatenates every text run into one
 *  string, discarding position -- fine for measurement, where only the
 *  width SUM/height MAX matter, per `measureLineWithAtoms`), a renderer
 *  needs the interleaved order to draw "text, image, text, image, ..."
 *  left to right with the correct x-advance. */
export type RenderSegment = { kind: 'text'; text: string } | { kind: 'atom'; atom: InlineAtomToken };

/** Result of scanning one Creole line for embedded img/sprite atoms. */
export interface LineAtomScan {
  /** `line` with every recognised atom's raw markup removed, in source
   *  order -- has no on-diagram width of its own (see file doc). Malformed
   *  `<img>` markup is represented here as literal `(Cannot decode)` text
   *  rather than dropped -- see `buildImgSpan`. */
  textWithoutAtoms: string;
  /** Every recognised img/sprite atom, in source order. */
  atoms: InlineAtomToken[];
  /** `line`'s content as ordered text/atom segments (T7 render seam) --
   *  interleaving `textWithoutAtoms`'s text runs with `atoms` in their
   *  original source order; empty text runs are omitted. */
  segments: RenderSegment[];
}

/**
 * One decomposed `UShape` primitive plus the translate it must be drawn
 * under (svg-sprite-nanoparser T9 amendment to ADR-2, maintainer-approved
 * widening from `UPath[]` to a heterogeneous shape set once T8's
 * `drawCircle`/`drawText` were found to also reach a `drawable` sprite --
 * see `render-atoms.ts`'s `SpritePrimitiveCollector` doc comment for the
 * full mechanism).
 *
 * A wrapper is required, not a bare `UShape[]`, because only `UPath`
 * carries its own ABSOLUTE position (its segments' own coordinates,
 * `SvgNanoParser#drawPath` bakes the accumulated affine transform in at
 * PARSE time -- `translate` is `UTranslate.none()` for these). `UEllipse`/
 * `UText` carry no position of their own; upstream's `drawCircle`/
 * `drawText` instead position them via a live `UGraphic.apply(translate)
 * .draw(shape)` call pair (`SvgNanoParser.java:172-175,257`), which a
 * COLLECTING `UGraphic` (T9, not a live drawing backend) cannot bake into
 * the shape itself the way `UPath.translate` can -- so the collector
 * records the translate ALONGSIDE the shape instead, and every draw site
 * re-applies it: `ug.apply(translate).draw(shape)`, the SAME call shape
 * `SvgNanoParser.drawU` itself uses.
 */
export interface DrawablePrimitive {
  readonly shape: UShape;
  readonly translate: UTranslate;
}

/**
 * Resolves one atom to its drawable image geometry at RENDER time (T7):
 * a two-channel discriminated union (svg-sprite-nanoparser ADR-2), mirroring
 * upstream's own structural split between the DECLARED box and the DRAWN
 * ink -- two different objects, two different method calls, not one value
 * with an optional extra field:
 *
 * - `kind: 'image'` -- `href` is the `<image>` element's `xlink:href`
 *   (verbatim `dataUri` for an `img` atom per D7; a tinted PNG data URI for
 *   a `sprite` atom, built via `sprite-raster.ts#spriteToPngDataUri`).
 * - `kind: 'drawable'` -- `primitives` are the `UPath`/`UEllipse`/`UText`
 *   decomposition `SvgNanoParser.drawU` emits for an SVG sprite (T9), each
 *   paired with its own draw-time translate ({@link DrawablePrimitive});
 *   ink lives ONLY here, never on `width`/`height`.
 *
 * `width`/`height` are the DECLARED box in BOTH variants -- the SAME scaled
 * pixel dims `measureInlineAtom` already contributes to label measurement
 * (D9), mirroring upstream's `AtomSprite.calculateDimensionSlow` (declared)
 * versus `Footprint.drawPath` (observed): so drawing and measuring agree by
 * construction on the declared box regardless of which variant is drawn.
 * Returns `undefined` to mean "render nothing" -- matches
 * `StripeSimple.addSprite`'s unknown-sprite-name behavior (java :228-236):
 * the atom never becomes a drawable element at all, not a zero-size one.
 * See `src/diagrams/description/render-atoms.ts` for the concrete builder.
 *
 * `kind: 'drawable'` is produced by svg-sprite-nanoparser T9
 * (`render-atoms.ts#resolveSvgSpriteAtom`); every other producer
 * (`leaf-sizing.ts`) still emits only `kind: 'image'`.
 *
 * sizer-footprint-parity T2 (ADR-2): this type previously carried optional
 * `inkX`/`inkY`/`inkWidth`/`inkHeight` fields (bodyenhanced-atom-seams'
 * ADR-2). Removed there -- confirmed zero consumers anywhere in the
 * codebase. svg-sprite-nanoparser ADR-2 (this task) is a DIFFERENT, later
 * decision and explicitly does NOT reintroduce that shape: `primitives`
 * below are DRAW-TIME geometry, not a measurement side channel. Ink from
 * measurement (unrelated to this type) still flows through the SEPARATE
 * `SpriteDims.inkWidth`/`inkHeight` channel (unchanged by this task --
 * still consumed by `leaf-sizing.ts#sizingAtomImageResolverFor`'s
 * `fitToInk` branch and `leaf-sizing-text.ts#inlineFootprintBox`; see
 * `.agent-notes/T2-footprint-sizer.md` for why `usecase-footprint.ts`/
 * `footprintBoxes` themselves could NOT be retired in that task).
 */
export type AtomImageResolver = (
  atom: InlineAtomToken,
) =>
  | {
      readonly kind: 'image';
      readonly href: string;
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly kind: 'drawable';
      readonly primitives: readonly DrawablePrimitive[];
      readonly width: number;
      readonly height: number;
    }
  | undefined;

/**
 * Minimal structural view of T4's per-diagram sprite registry (batch-2
 * write-set: `src/core/klimt/sprite/Sprite.ts` exposes `{width, height}`;
 * the registry itself -- `src/core/sprite-commands.ts` -- had not landed
 * when this file was written, per the mission prompt's concurrent-write-set
 * note). Only width/height are needed for D9 measurement; T4's `Sprite`
 * additionally carries tint/pixel-level accessors (`SpriteMonochrome
 * .grayLevel`/`getGray`) that T7's renderer will consume separately.
 * FLAG for orchestrator reconciliation: confirm the real registry's
 * `get()` return type is structurally assignable here once T4 lands (it
 * should be -- `Sprite` is exactly `{width, height}` today).
 */
/** A sprite's declared box, plus its drawn-INK box when the two differ (only
 *  an SVG sprite can). Ink is reported in the SAME unscaled units as
 *  `width`/`height`; callers apply the creole scale to both. */
export interface SpriteDims {
  width: number;
  height: number;
  /** Ink offset inside the declared box; 0 when ink === box. */
  inkX?: number;
  inkY?: number;
  inkWidth?: number;
  inkHeight?: number;
}

export interface SpriteDimsLookup {
  get(name: string): SpriteDims | undefined;
}

// ---------------------------------------------------------------------------
// Regex sources (string-built, never `/regex/` literals: `<`/`>`/`{`/`}` in
// a regex literal desyncs lizard's brace-depth tracker and inflates
// unrelated functions' reported complexity -- see complexity-hook
// workarounds; same precedent as parse-helpers.ts#RE_TOOLTIP_BRACES).
// ---------------------------------------------------------------------------

/** Splitter.imgPatternNoSrcColon, java Splitter.java:58. Group 1: raw src
 *  content (may carry a `src=` prefix and/or quotes -- stripped by
 *  `stripImgSrc`). Group 2: the optional `{scale=N}` block. */
const IMG_PATTERN_SOURCE = '<img[\\s:]+([^>{}]+)(\\{scale=[0-9.]+\\})?>';

/** Splitter.spritePattern, java Splitter.java:74 (`SpriteUtils.SPRITE_NAME`
 *  = `[-\p{L}0-9_/]+`). Group 1: forced-color prefix `#RRGGBB` (incl. the
 *  `#`), or undefined. Group 2: sprite name. Group 3: the optional
 *  `{scale=N,color=X}`-shaped block. */
const SPRITE_PATTERN_SOURCE =
  '<(#[A-Za-z0-9_]+)?\\$([-\\p{L}0-9_/]+)' +
  '((?:[{,]?(?:(?:scale=|\\*)[0-9.]+)?(?:,?color[= :](?:#[0-9a-fA-F]{1,8}|[A-Za-z0-9_]+))?\\}?)?)>';

/** Parser.getScale's SCALE pattern, java Parser.java:67. */
const SCALE_BLOCK_SOURCE = '(?:scale=|\\*)([0-9.]+)';

/** Parser.getColor's COLOR pattern, java Parser.java:80. */
const COLOR_BLOCK_SOURCE = 'color[= :](#[0-9a-fA-F]{1,6}|[A-Za-z0-9_]+)';

/** StringUtils.isDoubleQuote: straight, curly, and guillemet double-quote
 *  glyphs. `\x22` is the straight double-quote hex escape -- this file
 *  avoids the raw `"` glyph per the lizard quote-desync workaround. */
const DOUBLE_QUOTE_CHARS: ReadonlySet<string> = new Set(['\x22', '“', '”', '«', '»']);

const SRC_PREFIX = 'src=';

/** Short cannot-decode text — used for the `<img>` src forms where upstream
 *  ALSO emits no source string: a file src that doesn't resolve under a
 *  non-INSECURE security profile (`AtomImg.java:176,190`), and — as a
 *  DELIBERATE, retained divergence — a data-URI whose bytes fail to decode.
 *  Upstream's `buildRasterFromData` embeds the FULL source there
 *  (`'(Cannot decode: ' + source + ')'`, `AtomImg.java:206`), but that source
 *  is the entire, potentially megabyte-long data URI (e.g. `fajira-11`'s
 *  inline data-SVG), which is not useful rendered text; this browser-safe
 *  port keeps the short form for the data-URI/file cases only. The URL cases
 *  are ported faithfully — see `cannotDecodeText` (creole-lexer-unification:
 *  the URL branch is what closed `nobiza-91`/`pebace-74`/`togeke-15`). */
const CANNOT_DECODE_TEXT = '(Cannot decode)';

/** Faithful port of `AtomImg.create`'s cannot-decode text for a `<img>` src
 *  this synchronous, browser-safe renderer cannot fetch or decode. Upstream
 *  routes an `http:`/`https:` src (which this port never fetches, so it
 *  ALWAYS lands on the fetch-failed branch) through `buildRasterFromUrl` /
 *  `buildSvgFromUrl`, both of which embed the FULL url in the fallback text:
 *  `(Cannot decode: <url>)` for a raster URL (`AtomImg.java:214,218`) and
 *  `(Cannot decode SVG: <url>)` for a `.svg` URL (`AtomImg.java:226,230`).
 *  A URL is bounded (unlike a data URI), so embedding it verbatim reproduces
 *  the jar's measured node width exactly (verified: `nobiza-91`'s image node
 *  = 9.66in, the long-form URL text — NOT the tiny short-form box). Scheme /
 *  `.svg` checks are case-sensitive, mirroring upstream's own `src.startsWith
 *  ("http:")` / `src.endsWith(".svg")`. Every other src form (data URI, file
 *  path) keeps the short `CANNOT_DECODE_TEXT`. */
function cannotDecodeText(src: string): string {
  if (src.startsWith('http:') || src.startsWith('https:')) {
    return src.endsWith('.svg') ? `(Cannot decode SVG: ${src})` : `(Cannot decode: ${src})`;
  }
  return CANNOT_DECODE_TEXT;
}

// ---------------------------------------------------------------------------
// Scale / color extraction (Parser.java ports)
// ---------------------------------------------------------------------------

export function parseScale(block: string | undefined, fallback: number): number {
  if (block === undefined) return fallback;
  const m = new RegExp(SCALE_BLOCK_SOURCE).exec(block);
  return m === null ? fallback : Number(m[1]!);
}

export function parseColorFromBlock(block: string | undefined): string | undefined {
  if (block === undefined) return undefined;
  const m = new RegExp(COLOR_BLOCK_SOURCE).exec(block);
  return m === null ? undefined : m[1];
}

function stripDoubleQuotes(s: string): string {
  const first = s.charAt(0);
  const last = s.charAt(s.length - 1);
  const isWrapped = s.length > 1 && DOUBLE_QUOTE_CHARS.has(first) && DOUBLE_QUOTE_CHARS.has(last);
  return isWrapped ? s.slice(1, -1) : s;
}

/** CommandCreoleImg.executeAndAdvance, java :79-84: strip a leading
 *  (case-insensitive) `src=`, then strip surrounding double quotes. */
function stripImgSrc(raw: string): string {
  const trimmed = raw.trim();
  const hasSrcPrefix = trimmed.slice(0, SRC_PREFIX.length).toLowerCase() === SRC_PREFIX;
  const withoutPrefix = hasSrcPrefix ? trimmed.slice(SRC_PREFIX.length) : trimmed;
  return stripDoubleQuotes(withoutPrefix);
}

// ---------------------------------------------------------------------------
// Line scanning
// ---------------------------------------------------------------------------

export interface AtomSpan {
  start: number;
  end: number;
  atom?: InlineAtomToken;
  fallbackText?: string;
}

/** AtomImg.create's `data:image/png;base64,` branch renders the image (java
 *  :123-131); every other src form degrades to a cannot-decode text atom
 *  (an unresolvable image → text, matching upstream's shape) without the
 *  file/network I/O this browser-safe, synchronous renderer cannot perform
 *  (project CLAUDE.md Architecture Notes: no blocking I/O in `src/`). The
 *  fallback TEXT now mirrors upstream's per-src-form branching via
 *  `cannotDecodeText`: an `http:`/`https:` URL embeds the full url
 *  (`(Cannot decode[ SVG]: <url>)`), while data-URI/file forms keep the short
 *  `(Cannot decode)` — see each function's own doc comment. */
function buildImgSpan(m: RegExpExecArray): AtomSpan {
  const start = m.index;
  const end = m.index + m[0].length;
  const src = stripImgSrc(m[1]!);
  const scale = parseScale(m[2], 1);
  const ihdr = parsePngIhdrFromDataUri(src);
  if (ihdr === undefined) return { start, end, fallbackText: cannotDecodeText(src) };
  return { start, end, atom: { kind: 'img', dataUri: src, scale, width: ihdr.width, height: ihdr.height } };
}

function scanImgSpans(line: string): AtomSpan[] {
  const spans: AtomSpan[] = [];
  const re = new RegExp(IMG_PATTERN_SOURCE, 'g');
  let m = re.exec(line);
  while (m !== null) {
    spans.push(buildImgSpan(m));
    if (m[0].length === 0) re.lastIndex += 1;
    m = re.exec(line);
  }
  return spans;
}

/** CommandCreoleSprite.executeAndAdvance, java :81-86: the forced-color
 *  prefix (`<#RRGGBB$name>`) wins over an in-block `color=` when both are
 *  present; scale multiplies against the caller's font-size ratio at
 *  render time (T7's concern), not here. */
function buildSpriteSpan(m: RegExpExecArray): AtomSpan {
  const start = m.index;
  const end = m.index + m[0].length;
  const forcedPrefix = m[1];
  const name = m[2]!;
  const scale = parseScale(m[3], 1);
  const forcedColor = forcedPrefix !== undefined ? forcedPrefix.slice(1) : parseColorFromBlock(m[3]);
  const atom: SpriteAtomToken =
    forcedColor === undefined ? { kind: 'sprite', name, scale } : { kind: 'sprite', name, scale, forcedColor };
  return { start, end, atom };
}

function scanSpriteSpans(line: string): AtomSpan[] {
  const spans: AtomSpan[] = [];
  const re = new RegExp(SPRITE_PATTERN_SOURCE, 'gu');
  let m = re.exec(line);
  while (m !== null) {
    spans.push(buildSpriteSpan(m));
    if (m[0].length === 0) re.lastIndex += 1;
    m = re.exec(line);
  }
  return spans;
}

/**
 * Scan a single Creole line for `<img ...>`, `<$sprite ...>`, and
 * `<&openiconic ...>` atoms.
 *
 * Non-atom text is preserved in source order in `textWithoutAtoms` (a
 * malformed `<img>` atom's markup is replaced by literal `(Cannot decode)`
 * text rather than removed -- see `buildImgSpan`; an unrecognized `<&name>`
 * glyph's markup is removed with NO fallback text -- see `buildOpenIconSpan`);
 * atom markup itself is removed, matching the `resolveInlineLinks`/I5
 * precedent that raw markup has no on-diagram width, only the resolved
 * content does.
 */
export function scanLineForAtoms(line: string): LineAtomScan {
  const spans = [...scanImgSpans(line), ...scanSpriteSpans(line), ...scanOpenIconSpans(line)].sort(
    (a, b) => a.start - b.start,
  );
  let cursor = 0;
  const textParts: string[] = [];
  const atoms: InlineAtomToken[] = [];
  const segments: RenderSegment[] = [];
  for (const span of spans) {
    const before = line.slice(cursor, span.start);
    textParts.push(before);
    if (before.length > 0) segments.push({ kind: 'text', text: before });
    if (span.atom !== undefined) {
      atoms.push(span.atom);
      segments.push({ kind: 'atom', atom: span.atom });
    } else if (span.fallbackText !== undefined) {
      textParts.push(span.fallbackText);
      segments.push({ kind: 'text', text: span.fallbackText });
    }
    cursor = span.end;
  }
  const tail = line.slice(cursor);
  textParts.push(tail);
  if (tail.length > 0) segments.push({ kind: 'text', text: tail });
  return { textWithoutAtoms: textParts.join(''), atoms, segments };
}

/**
 * Result of trying to match ONE `<img>`/`<$sprite>`/`<&openiconic>` atom
 * starting EXACTLY at `pos` (sticky-anchored, upstream: `Command
 * #matchingSize`/`executeAndAdvance` called at a fixed scan position) -- the
 * per-position counterpart to {@link scanLineForAtoms}'s whole-line scan,
 * needed by E2r/L2's unified creole command dispatch (`klimt/creole/legacy/
 * StripeSimple.ts#modifyStripe`): upstream registers `CommandCreoleImg`/
 * `CommandCreoleSprite`/`CommandCreoleOpenIcon` in the SAME `searchCommand`
 * starter map as the style/size/color commands (`<i`/`<#`/`<$`/`<&`,
 * `CommandCreoleBuilder.java:106,114,...`), so an atom can appear INSIDE a
 * style/color/size command's captured inner text (`<color:red><$Batch>
 * </color>`, `usecase/nenedo-78-fiva569` -- jar-verified 2026-07-15: the
 * jar tints the sprite AND treats the whole span as one recognized unit, not
 * three independent segments) -- reusing this file's existing regex sources
 * rather than re-deriving them, per this project's "don't duplicate an
 * already-tested primitive" rule.
 */
export interface AtomMatchAt {
  readonly length: number;
  readonly atom?: InlineAtomToken;
  readonly fallbackText?: string;
}

export function spanToMatch(span: AtomSpan): AtomMatchAt {
  const length = span.end - span.start;
  if (span.atom !== undefined) return { length, atom: span.atom };
  if (span.fallbackText !== undefined) return { length, fallbackText: span.fallbackText };
  return { length };
}

function matchImgAt(line: string, pos: number): AtomMatchAt | null {
  const re = new RegExp(IMG_PATTERN_SOURCE, 'y');
  re.lastIndex = pos;
  const m = re.exec(line);
  return m === null ? null : spanToMatch(buildImgSpan(m));
}

function matchSpriteAt(line: string, pos: number): AtomMatchAt | null {
  const re = new RegExp(SPRITE_PATTERN_SOURCE, 'yu');
  re.lastIndex = pos;
  const m = re.exec(line);
  return m === null ? null : spanToMatch(buildSpriteSpan(m));
}

/** Upstream: `searchCommand`'s per-position dispatch, restricted to the
 *  three atom commands (`CommandCreoleImg`'s `<i` starter is tried by the
 *  CALLER before this -- see `StripeSimple.ts#searchCommand`'s own doc
 *  comment -- since it collides with ITALIC's legacy `<i`/`<I` starter and
 *  upstream's own registration order tries style commands first). Img,
 *  sprite, then openicon, matching `CommandCreoleBuilder.java`'s own
 *  registration order (:106 img, :114 sprite, openicon registered in
 *  `klimt/creole/command`'s own builder set) -- immaterial here since their
 *  starters never collide (`<i` vs `<$` vs `<&`), but ported for parity. */
export function matchAtomAt(line: string, pos: number): AtomMatchAt | null {
  return matchImgAt(line, pos) ?? matchSpriteAt(line, pos) ?? matchOpenIconAt(line, pos);
}
