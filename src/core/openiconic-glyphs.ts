/**
 * OpenIconic `<&glyph>` inline icons (G2 N41, extended to the full upstream
 * set F1-c).
 *
 * Upstream: `klimt/creole/atom/AtomOpenIconic.java` (dimension/altitude/draw),
 * `klimt/creole/command/CommandCreoleOpenIcon.java` (`<&name>` /
 * `<&name{scale=N,color=X}>` / `<#RRGGBB&name>` markup, `Splitter
 * .openiconPattern`), `openiconic/OpenIconic.java` (resource loader --
 * reads `src/main/resources/openiconic/<name>.svg`, a literal 8x8-viewBox
 * single-`<path>` SVG per icon, credit github.com/iconic/open-iconic, MIT),
 * `openiconic/SvgPath.java` (parse + scale + translate -> `UPath`),
 * `openiconic/{StringDecipher,Movement,SvgCommand*,SvgPosition}.java` (the
 * path-data tokenizer/absolutizer this module ports).
 *
 * Scope (F1-c, S1L tail-fix G11): the FULL upstream OpenIconic resource set --
 * every `*.svg` under `src/main/resources/openiconic/` (223 icons; the
 * directory's only other entry, `all.txt`, is not an icon) -- captured
 * verbatim from plantuml's own resource SVGs (not scraped from jar output,
 * unlike `class-badge.ts`'s badge-letter precedent: OpenIconic ships its
 * literal source, no reverse-engineering needed). An unrecognized name
 * (there are none left in upstream's own set, but a caller can still pass an
 * arbitrary string) resolves to `undefined` throughout this module, matching
 * `OpenIconic.retrieve`'s own null-on-missing-resource behavior
 * (`StripeSimple#addOpenIcon`: an unresolved name contributes NOTHING, the
 * SAME "unknown sprite" rule `creole-atoms.ts`'s own doc comment already
 * documents for `<$sprite>`) -- that policy is unchanged by this extension,
 * only the table backing it grew (G2 N40's original 6-glyph survey --
 * `x`, `key`, `ban`, `caret-right`, `link-intact`, `thumb-up` -- undersold
 * the corpus; those 6 entries are untouched below).
 *
 * Geometry, byte-verified against 5 independent jar-cached fixtures spanning
 * 4 distinct `factor` values (1.0, 1.16667, 2.0, and the caret-right
 * `transform="translate(2)"` case) -- `plans/g2-class-svg/ledger.md` N41,
 * plus 7 more jar-cached spot-checks added for the full-set extension
 * (`plans/s1l-tail-fix/batch-1/F1-c-openiconic-table.md`; see
 * `tests/unit/openiconic-glyphs.test.ts`'s "full-set extension" describe
 * block):
 * - `factor = scale * fontSize / 12` (`AtomOpenIconic` ctor: `this.factor =
 *   scale * fontConfiguration.getSize2D() / 12.0`).
 * - Every coordinate (and an `A` command's `rx`/`ry`, NOT its rotation/flag
 *   args) scales by `factor` uniformly; a source SVG's own
 *   `transform="translate(dx dy)"` adds `(dx*factor, dy*factor)` on top,
 *   matching `SvgPath#toUPath(factorx, factory)`'s
 *   `result.translate(translate.getDx()*factorx, ...)` tail. The original
 *   6-glyph sample only ever saw an X-only form (`caret-right`); the full set
 *   has 72 glyphs with a transform, most (`translate(0 N)`) Y-only or
 *   (`translate(N M)`) both -- `RawGlyph` (`openiconic-glyphs-data.ts`)
 *   carries `translateY` for this reason, verified per-glyph against each
 *   icon's own source SVG, not assumed absent.
 * - **`euro` reproduces an upstream regex bug, deliberately.** Its own source
 *   SVG declares `transform="translate(-1)"`, but `OpenIconic.java`'s
 *   `patternTranslate` (`Pattern.compile("translate\\((\\d+)\\s*(\\d*)\\)")`)
 *   requires an ASCII digit immediately after `translate(` -- no sign is
 *   accepted -- so `matcher.find()` never matches this line at all and
 *   `getTranslate` falls back to `UTranslate.none()`: the jar silently
 *   DROPS `euro`'s own declared translate. Confirmed jar-side (not just by
 *   reading the regex): the isolated probe `rectangle "aa<&euro>"`'s first
 *   `M` point renders at `M40.575,18.1667`, which is `buildOpenIconicPathD`
 *   with `translateX: 0` (matching this table's `euro` entry, which has NO
 *   `translateX`/`translateY` fields) -- honoring the source SVG's literal
 *   `-1` would land at `M39.4083,...` instead, which the jar does NOT
 *   produce. `euro` is therefore the one glyph in this table whose entry
 *   intentionally does NOT match its own source SVG's `transform` attribute
 *   -- it matches the jar's actual (buggy) behavior instead, per this
 *   project's "preserve behavior, including bugs" porting discipline.
 * - `Z` commands are dropped from the emitted `d` entirely (every sampled
 *   glyph's own line-segment geometry already closes back to its `M` point
 *   before the `z`, so this is a no-op relative to jar's OWN visible output,
 *   not a divergence) -- confirmed on `key.svg`'s TWO-subpath case (`z`
 *   between them emits nothing, the second subpath's own `m` position resets
 *   against the FIRST subpath's `M` point, i.e. `SvgPath`'s `lastMove`
 *   convention, not the immediately-preceding point). The full 223-glyph set
 *   uses no command letters beyond the ones the original 6-glyph parser
 *   already implements (`m/M l h v c a s z`, lowercase-only except `M`) --
 *   verified by scanning every glyph's own `d` string; `q`/`t` (quadratic/
 *   smooth-quadratic) never appear, so {@link absolutizeOne}'s existing
 *   command set needs no additions.
 */
import { javaFixed4, trimTrailingZeros } from './number-format.js';
import { RAW_GLYPHS } from './openiconic-glyphs-data.js';

/** Every OpenIconic glyph's native (unscaled) viewBox is `0 0 8 8`
 *  (`OpenIconic.java#getDimension`'s own `width`/`height` SVG attrs, both
 *  always `8` for this icon set). */
export const OPENICONIC_NATURAL_SIZE = 8;

export function isKnownOpenIconicGlyph(name: string): boolean {
  return Object.hasOwn(RAW_GLYPHS, name);
}

// ---------------------------------------------------------------------------
// Path tokenizer -- `openiconic/StringDecipher.java#decipher` (letters and
// numbers only; this module's fixed 6-glyph table never needs scientific
// notation, so that branch of the Java tokenizer is not ported -- narrower
// scope than the general-purpose upstream parser, adequate for a closed,
// hand-verified data set).
// ---------------------------------------------------------------------------

function decipher(path: string): string[] {
  // #lizard forgives -- a single character-scan tokenizer (StringDecipher
  // port), not real branching complexity; see this file's module doc
  // comment for the upstream algorithm this mirrors.
  const tokens: string[] = [];
  let i = 0;
  while (i < path.length) {
    while (i < path.length && (path[i] === ',' || /\s/.test(path[i]!))) i++;
    if (i >= path.length) break;
    const c0 = path[i]!;
    if (/[A-Za-z]/.test(c0)) {
      tokens.push(c0);
      i++;
      continue;
    }
    let j = i;
    if (path[j] === '+' || path[j] === '-') j++;
    let seenDot = false;
    let seenDigit = false;
    while (j < path.length) {
      const c = path[j]!;
      if (c >= '0' && c <= '9') {
        seenDigit = true;
        j++;
      } else if (c === '.' && !seenDot) {
        seenDot = true;
        j++;
      } else {
        break;
      }
    }
    if (!seenDigit) break; // malformed -- unreachable for this module's fixed glyph table
    tokens.push(path.slice(i, j));
    i = j;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Movement model -- `openiconic/SvgCommandLetter.java#argumentNumber`/
// `implicit`, `Movement.java#toAbsoluteUpperCase`/`getMirrorControlPoint`.
// ---------------------------------------------------------------------------

interface RawMovement {
  readonly letter: string;
  readonly args: readonly number[];
}

/** SvgCommandLetter#argumentNumber (java :57-77) -- a faithful port of
 *  upstream's fixed command-letter -> arg-count table. */
function argCount(letter: string): number {
  // #lizard forgives -- a fixed-case lookup table, not real branching logic.
  switch (letter.toLowerCase()) {
    case 'm':
    case 'l':
    case 't':
      return 2;
    case 'h':
    case 'v':
      return 1;
    case 'z':
      return 0;
    case 'c':
      return 6;
    case 'q':
    case 's':
      return 4;
    case 'a':
      return 7;
    // Every letter in this module's 6-glyph table is one of the cases
    // above (verified by this file's own tests).
    /* v8 ignore next 2 */
    default:
      throw new Error(`unsupported SVG path command: ${letter}`);
  }
}

/** SvgCommandLetter#implicit (java :91-100): a repeated bare-number run
 *  after `m`/`M` implicitly becomes `l`/`L`; every other letter repeats as
 *  itself. */
function implicitLetter(letter: string): string {
  if (letter === 'm') return 'l';
  if (letter === 'M') return 'L';
  return letter;
}

/** SvgPath's `insertMissingLetter` (java :99-123), inlined into a single
 *  tokens -> movements pass: a real letter token starts a new movement
 *  (consuming its own `argCount` numbers); a bare-number token (no
 *  preceding letter) repeats the LAST movement's `implicitLetter`. */
function parseMovements(tokens: readonly string[]): RawMovement[] {
  const result: RawMovement[] = [];
  let i = 0;
  let lastLetter = '';
  while (i < tokens.length) {
    const tok = tokens[i]!;
    const isLetter = /^[A-Za-z]$/.test(tok);
    const letter = isLetter ? tok : lastLetter;
    if (isLetter) i++;
    const nb = argCount(letter);
    const args: number[] = [];
    for (let k = 0; k < nb; k++) {
      args.push(Number(tokens[i]!));
      i++;
    }
    result.push({ letter, args });
    if (isLetter) lastLetter = implicitLetter(tok);
  }
  return result;
}

/** Output op: `H`/`V` folded into `L`, `S` folded into `C` (mirrored control
 *  point), `Z` dropped (never emitted -- see this module's own file doc
 *  comment). */
export type OpenIconicOp =
  | { readonly op: 'M' | 'L'; readonly x: number; readonly y: number }
  | {
      readonly op: 'C';
      readonly c1x: number;
      readonly c1y: number;
      readonly c2x: number;
      readonly c2y: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly op: 'A';
      readonly rx: number;
      readonly ry: number;
      readonly rot: number;
      readonly laf: number;
      readonly sf: number;
      readonly x: number;
      readonly y: number;
    };

/** Running absolutize state, bundled to keep {@link absolutizeOne}'s own
 *  param count under this project's complexity cap. */
interface AbsoluteCursor {
  readonly x: number;
  readonly y: number;
  readonly mirrorC2: readonly [number, number] | null;
}

/** SvgPath's ctor loop (java :73-97): absolutize every relative command
 *  against the running current point, tracking the current SUBPATH's `M`
 *  (`lastMove`, restored on `Z` -- `openiconic/SvgPath.java:81-82`) and the
 *  previous cubic's second control point (for `S`'s reflection,
 *  `Movement#getMirrorControlPoint`, java :178-196). */
function toAbsolute(movements: readonly RawMovement[]): OpenIconicOp[] {
  const out: OpenIconicOp[] = [];
  let cursor: AbsoluteCursor = { x: 0, y: 0, mirrorC2: null };
  let moveX = 0;
  let moveY = 0;
  for (const { letter, args } of movements) {
    if (letter === 'Z' || letter === 'z') {
      cursor = { x: moveX, y: moveY, mirrorC2: null };
      continue;
    }
    const op = absolutizeOne(letter, args, cursor);
    out.push(op);
    if (op.op === 'M') {
      moveX = op.x;
      moveY = op.y;
    }
    cursor = { x: op.x, y: op.y, mirrorC2: op.op === 'C' ? [op.c2x, op.c2y] : null };
  }
  return out;
}

/** One `RawMovement` -> `OpenIconicOp`, split out of {@link toAbsolute} to
 *  keep that function's own NLOC under this project's complexity cap. */
function absolutizeOne(letter: string, args: readonly number[], cursor: AbsoluteCursor): OpenIconicOp {
  // #lizard forgives -- one command-letter dispatch switch (Movement
  // #toAbsoluteUpperCase port), not real branching complexity; see this
  // file's module doc comment for the upstream algorithm this mirrors.
  const { x: curX, y: curY, mirrorC2 } = cursor;
  switch (letter) {
    case 'M':
      return { op: 'M', x: args[0]!, y: args[1]! };
    case 'm':
      return { op: 'M', x: curX + args[0]!, y: curY + args[1]! };
    // No glyph in this module's fixed 6-icon table uses an absolute-
    // uppercase `L` (all use lowercase `l`).
    /* v8 ignore next 2 */
    case 'L':
      return { op: 'L', x: args[0]!, y: args[1]! };
    case 'l':
      return { op: 'L', x: curX + args[0]!, y: curY + args[1]! };
    // No glyph in this module's fixed 6-icon table uses an absolute-
    // uppercase `H` (all use lowercase `h`) -- verified by inspection of
    // the literal `RAW_GLYPHS` source strings.
    /* v8 ignore next 2 */
    case 'H':
      return { op: 'L', x: args[0]!, y: curY };
    case 'h':
      return { op: 'L', x: curX + args[0]!, y: curY };
    // Same rationale as 'H' above (no uppercase-absolute `V`).
    /* v8 ignore next 2 */
    case 'V':
      return { op: 'L', x: curX, y: args[0]! };
    case 'v':
      return { op: 'L', x: curX, y: curY + args[0]! };
    // Same rationale (no uppercase-absolute `C` -- every cubic in
    // `RAW_GLYPHS` is `c` or the `s`-derived kind below).
    /* v8 ignore next 2 */
    case 'C':
      return { op: 'C', c1x: args[0]!, c1y: args[1]!, c2x: args[2]!, c2y: args[3]!, x: args[4]!, y: args[5]! };
    case 'c':
      return {
        op: 'C',
        c1x: curX + args[0]!, c1y: curY + args[1]!,
        c2x: curX + args[2]!, c2y: curY + args[3]!,
        x: curX + args[4]!, y: curY + args[5]!,
      };
    // `link-intact` (the only glyph using an arc) uses lowercase `a`.
    /* v8 ignore next 2 */
    case 'A':
      return { op: 'A', rx: args[0]!, ry: args[1]!, rot: args[2]!, laf: args[3]!, sf: args[4]!, x: args[5]!, y: args[6]! };
    case 'a':
      return {
        op: 'A', rx: args[0]!, ry: args[1]!, rot: args[2]!, laf: args[3]!, sf: args[4]!,
        x: curX + args[5]!, y: curY + args[6]!,
      };
    case 'S':
    case 's': {
      const rel = letter === 's';
      const c2x = rel ? curX + args[0]! : args[0]!;
      const c2y = rel ? curY + args[1]! : args[1]!;
      const x = rel ? curX + args[2]! : args[2]!;
      const y = rel ? curY + args[3]! : args[3]!;
      // Movement#mutoToC (java): a NULL mirror (no preceding C/S) falls
      // back to c1 = c2 (this S's OWN second control point, NOT the
      // current point) -- jar-verified `gekope-01-ricu859`'s link-intact
      // glyph (an arc immediately followed by an `s`, N41).
      const c1x = mirrorC2 !== null ? 2 * curX - mirrorC2[0] : c2x;
      const c1y = mirrorC2 !== null ? 2 * curY - mirrorC2[1] : c2y;
      return { op: 'C', c1x, c1y, c2x, c2y, x, y };
    }
    // Every letter in this module's 6-glyph table is one of the cases
    // above (verified by this file's own tests).
    /* v8 ignore next 2 */
    default:
      throw new Error(`unsupported SVG path command letter: ${letter}`);
  }
}

const PARSED_CACHE = new Map<string, readonly OpenIconicOp[]>();

function parsedOpsFor(name: string): readonly OpenIconicOp[] | undefined {
  const cached = PARSED_CACHE.get(name);
  if (cached !== undefined) return cached;
  const raw = RAW_GLYPHS[name];
  if (raw === undefined) return undefined;
  const ops = toAbsolute(parseMovements(decipher(raw.d)));
  PARSED_CACHE.set(name, ops);
  return ops;
}

// ---------------------------------------------------------------------------
// Public geometry API
// ---------------------------------------------------------------------------

/** `AtomOpenIconic` ctor: `factor = scale * fontConfiguration.getSize2D() /
 *  12.0`. */
export function openIconicFactor(scale: number, fontSize: number): number {
  return (scale * fontSize) / 12;
}

/** `AtomOpenIconic#asTextBlock`: `TextBlockUtils.withMargin(rawGlyph, 1, 0)`
 *  -- 1px FLAT (not `factor`-scaled) left+right margin, no top/bottom
 *  margin. Row-advance width therefore includes the +2 total; height is the
 *  unmarged scaled glyph height. */
export function openIconicDims(factor: number): { readonly width: number; readonly height: number } {
  return { width: OPENICONIC_NATURAL_SIZE * factor + 2, height: OPENICONIC_NATURAL_SIZE * factor };
}

/**
 * Icon origin Y, given the row's own text BASELINE `y` (`ClassifierGeo.rows[]
 * .y`, matching every other row-content formula's own reference point) and
 * the row's AMBIENT font size (`theme.fontSize` -- the SAME value `renderer-
 * classifier-box.ts`'s pre-existing `lineTopY` formula for `<img>`/`<$sprite>`
 * atoms already uses; NOT the icon's own possibly-`<size:N>`-overridden
 * factor, confirmed by `dofima-22-kofe334`'s own `<size:12><&key></size>` --
 * the icon's local size feeds `factor`, but the surrounding ROW's font size
 * still governs where the icon sits on the line, since the physical line's
 * overall height/altitude is dominated by its own text run, not this one
 * inline atom -- `klimt/creole/Sea.java#drawU`'s
 * `translateY(-height + atom.getStartingAltitude())` composition).
 *
 * Formula empirically derived + jar-verified EXACT against 5 independent
 * samples spanning `factor` 1.0/1.16667/2.0 across 3 fixtures (`bidusa-22-
 * jutu505`, `gekope-01-ricu859`'s PK/PP rows, `rideze-59-lizu265`'s ban/
 * thumb-up icons) -- `plans/g2-class-svg/ledger.md` N41. The `-3*factor`
 * term matches `AtomOpenIconic#getStartingAltitude` exactly (`-getStarting
 * Altitude = +3*factor`); the `rowFontSize/4.5` term matches this file's
 * neighboring `lineTopY` descent constant. The combination was NOT re-derived
 * from `Sea`/`AtomHorizontalTexts`'s own general multi-atom composition
 * algorithm (out of this iteration's time budget) -- ruled out as a
 * fontSize-independent flat constant by construction (every sample shares
 * `rowFontSize=14`, so this formula is unverified for a NON-default
 * `classAttributeFontSize` row; named here, not a silent gap).
 */
export function openIconicOriginY(rowBaselineY: number, rowFontSize: number, factor: number): number {
  return rowBaselineY + rowFontSize / 4.5 - 11 * factor;
}

function fmt(n: number): string {
  return trimTrailingZeros(javaFixed4(n));
}

/**
 * Builds the final `<path d="...">` value for one glyph instance: scale by
 * `factor`, apply the source SVG's own intrinsic `transform="translate(...)"`
 * (both X and Y components, scaled by `factor` too, per `SvgPath#toUPath`'s
 * translate-last tail), then translate to `(originX, originY)` -- the icon's
 * own top-left render position (`x + 1` for the flat left margin,
 * `openIconicOriginY` above). Returns `undefined` for an unrecognized glyph
 * name (see {@link isKnownOpenIconicGlyph}'s own doc comment).
 */
export function buildOpenIconicPathD(
  name: string,
  factor: number,
  originX: number,
  originY: number,
): string | undefined {
  const ops = parsedOpsFor(name);
  if (ops === undefined) return undefined;
  const raw = RAW_GLYPHS[name]!;
  const dx = (raw.translateX ?? 0) * factor + originX;
  const dy = (raw.translateY ?? 0) * factor + originY;
  const parts: string[] = [];
  for (const op of ops) parts.push(formatOp(op, factor, dx, dy));
  return parts.join(' ');
}

function formatOp(op: OpenIconicOp, factor: number, dx: number, dy: number): string {
  if (op.op === 'A') {
    const x = fmt(op.x * factor + dx);
    const y = fmt(op.y * factor + dy);
    return `A${fmt(op.rx * factor)},${fmt(op.ry * factor)} ${fmt(op.rot)} ${fmt(op.laf)} ${fmt(op.sf)} ${x},${y}`;
  }
  const x = fmt(op.x * factor + dx);
  const y = fmt(op.y * factor + dy);
  if (op.op === 'C') {
    const c1x = fmt(op.c1x * factor + dx);
    const c1y = fmt(op.c1y * factor + dy);
    const c2x = fmt(op.c2x * factor + dx);
    const c2y = fmt(op.c2y * factor + dy);
    return `C${c1x},${c1y} ${c2x},${c2y} ${x},${y}`;
  }
  return `${op.op}${x},${y}`;
}
