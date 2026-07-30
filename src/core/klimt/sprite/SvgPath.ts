import { UPath } from '../shape/UPath.js';
import type { Point2D } from '../UTranslate.js';
import type { UTranslate } from '../UTranslate.js';

/**
 * SvgPath -- the single `d` -> `UPath` parser for this port
 * (plans/svg-sprite-nanoparser/decisions.md#adr-1).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPath.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/StringDecipher.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/Movement.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgCommandLetter.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgCommandNumber.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/openiconic/SvgPosition.java
 *
 * `svg-path-bbox.ts` (a folded bbox-only reader) and `openiconic-glyphs.ts`
 * (emits a `d` string for a fixed 6-glyph OpenIconic table) are separate,
 * narrower parsers this task does not touch or replace -- see ADR-1's
 * rejected option C. T5 re-expresses `pathBBox` over this module's output.
 *
 * Overload choice, resolved deliberately (not stated by the interface
 * contract alone): upstream `SvgPath` has TWO `toUPath` methods --
 * `toUPath(double factorx, double factory)` and
 * `toUPath(XAffineTransform at)`. The double-factor overload never
 * reassigns its `previous` local inside the loop, so its `letter == 'T'`
 * branch always dereferences a `null` -- a real, latent, unexercised
 * upstream bug (OpenIconic's own 6-glyph table, the only caller of
 * `drawMe(ug, factor)` -> `toUPath(double, double)`, never emits a `T`).
 * `SvgNanoParser.drawPath` -- this mission's actual consumer -- calls the
 * OTHER overload, `drawMe(ug, at)` -> `toUPath(XAffineTransform)`, which
 * correctly tracks `previous` and is what this task's acceptance criteria
 * (T reflects the previous control point into the box) require. This
 * module ports that overload's control flow with an identity scale (no
 * `XAffineTransform` type exists in this port yet) instead of reproducing
 * the double-factor overload's dead branch.
 */

// ---------------------------------------------------------------------------
// Tokenizer -- StringDecipher.decipher.
// ---------------------------------------------------------------------------

type Token = { readonly kind: 'letter'; readonly letter: string } | { readonly kind: 'number'; readonly value: number };

function isPathWhitespace(c: string): boolean {
  return /\s/.test(c);
}

function isLetter(c: string): boolean {
  return /[A-Za-z]/.test(c);
}

/**
 * @see StringDecipher.java#decipher
 *
 * A malformed trailing fragment (no mantissa digit found) silently
 * truncates the token stream, matching upstream's `break` out of the
 * whole loop -- it does not throw.
 */
function decipher(path: string): Token[] {
  // #lizard forgives -- a single character-scan tokenizer (StringDecipher
  // port), not real branching complexity; see the module doc comment.
  const tokens: Token[] = [];
  const n = path.length;
  let i = 0;
  while (i < n) {
    while (i < n && (isPathWhitespace(path[i]!) || path[i] === ',')) i++;
    if (i >= n) break;

    const c0 = path[i]!;
    if (isLetter(c0)) {
      tokens.push({ kind: 'letter', letter: c0 });
      i++;
      continue;
    }

    let j = i;
    if (path[j] === '+' || path[j] === '-') j++;
    let seenDot = false;
    let seenDigit = false;
    while (j < n) {
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
    if (!seenDigit) break;

    if (j < n && (path[j] === 'e' || path[j] === 'E')) {
      const expStart = j;
      j++;
      if (j < n && (path[j] === '+' || path[j] === '-')) j++;
      let seenExpDigit = false;
      while (j < n && path[j]! >= '0' && path[j]! <= '9') {
        seenExpDigit = true;
        j++;
      }
      if (!seenExpDigit) j = expStart;
    }

    tokens.push({ kind: 'number', value: Number.parseFloat(path.slice(i, j)) });
    i = j;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Movement grouping -- SvgPath#insertMissingLetter + SvgCommandLetter
// #argumentNumber/#implicit, merged into a single tokens -> raw-movements
// pass (upstream's intermediate `List<SvgCommand>` flat list is not
// separately modeled -- `checkArguments` is subsumed by this function's own
// argument counting, which throws instead of upstream's ClassCastException
// on malformed input).
// ---------------------------------------------------------------------------

interface RawMovement {
  /** Original-case letter as encountered (or repeated implicitly). */
  readonly letter: string;
  readonly args: readonly number[];
}

/** @see SvgCommandLetter.java#argumentNumber */
function argumentNumber(letter: string): number {
  // #lizard forgives -- a fixed command-letter -> arg-count lookup table
  // (SvgCommandLetter#argumentNumber port), not real branching complexity.
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
    default:
      throw new Error(`SvgPath: unsupported command letter '${letter}'`);
  }
}

/** @see SvgCommandLetter.java#implicit */
function implicitLetter(letter: string): string {
  if (letter === 'm') return 'l';
  if (letter === 'M') return 'L';
  return letter;
}

/** @see SvgPath.java#insertMissingLetter */
function groupMovements(tokens: readonly Token[]): RawMovement[] {
  const result: RawMovement[] = [];
  let lastLetter: string | null = null;
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i]!;
    let letter: string;
    if (tok.kind === 'letter') {
      letter = tok.letter;
      i++;
      lastLetter = implicitLetter(letter);
    } else {
      if (lastLetter === null)
        throw new Error(`SvgPath: path data must start with a command letter, found number ${tok.value}`);
      letter = lastLetter;
    }
    const nb = argumentNumber(letter);
    const args: number[] = [];
    for (let k = 0; k < nb; k++) {
      const arg = tokens[i];
      if (arg === undefined || arg.kind !== 'number')
        throw new Error(`SvgPath: command '${letter}' expects ${nb} argument(s), ran out at token index ${i}`);
      args.push(arg.value);
      i++;
    }
    result.push({ letter, args });
  }
  // #lizard forgives -- upstream's insertMissingLetter (SvgPath.java) port:
  // one token->raw-movement grouping pass, not real branching complexity.
  return result;
}

// ---------------------------------------------------------------------------
// Absolutization + S->C mutation -- Movement.java's ctor-loop collaborators.
// ---------------------------------------------------------------------------

/** Absolute-uppercase movement: letter is one of M L C Q T Z A (H/V folded
 *  into L, lowercase absolutized, S already mutated to C by the time it
 *  reaches {@link toUPath}). */
interface AbsMovement {
  readonly letter: string;
  readonly args: readonly number[];
}

function getSvgPosition(m: AbsMovement, index: number): Point2D {
  return { x: m.args[index]!, y: m.args[index + 1]! };
}

/** @see Movement.java#lastPosition */
function lastPositionOf(m: AbsMovement): Point2D | null {
  if (m.args.length === 0) return null;
  return getSvgPosition(m, m.args.length - 2);
}

/** @see SvgPosition.java#getMirror */
function mirrorPoint(center: Point2D, toMirror: Point2D): Point2D {
  return { x: 2 * center.x - toMirror.x, y: 2 * center.y - toMirror.y };
}

/** @see Movement.java#toAbsoluteUpperCase */
function toAbsoluteUpperCase(letter: string, args: readonly number[], last: Point2D): AbsMovement {
  // #lizard forgives -- a fixed command-letter dispatch (Movement
  // #toAbsoluteUpperCase port), not real branching complexity; see the
  // module doc comment for the upstream algorithm this mirrors.
  if (letter === 'H') return { letter: 'L', args: [args[0]!, last.y] };
  if (letter === 'V') return { letter: 'L', args: [last.x, args[0]!] };
  if (letter === 'h') return { letter: 'L', args: [last.x + args[0]!, last.y] };
  if (letter === 'v') return { letter: 'L', args: [last.x, last.y + args[0]!] };
  if (letter.toUpperCase() === letter) return { letter, args };
  if (letter === 'm') return { letter: 'M', args: [last.x + args[0]!, last.y + args[1]!] };
  if (letter === 'l') return { letter: 'L', args: [last.x + args[0]!, last.y + args[1]!] };
  if (letter === 't') return { letter: 'T', args: [last.x + args[0]!, last.y + args[1]!] };
  if (letter === 'z') return { letter: 'Z', args: [] };
  if (letter === 'c')
    return {
      letter: 'C',
      args: [
        last.x + args[0]!, last.y + args[1]!,
        last.x + args[2]!, last.y + args[3]!,
        last.x + args[4]!, last.y + args[5]!,
      ],
    };
  if (letter === 'q')
    return { letter: 'Q', args: [last.x + args[0]!, last.y + args[1]!, last.x + args[2]!, last.y + args[3]!] };
  if (letter === 's')
    return { letter: 'S', args: [last.x + args[0]!, last.y + args[1]!, last.x + args[2]!, last.y + args[3]!] };
  if (letter === 'a')
    return {
      letter: 'A',
      args: [args[0]!, args[1]!, args[2]!, args[3]!, args[4]!, last.x + args[5]!, last.y + args[6]!],
    };
  // Unreachable: argumentNumber() above already rejects any letter outside
  // M/L/H/V/C/S/Q/T/A/Z (both cases), so every letter reaching this branch
  // was already handled above.
  /* v8 ignore next 2 */
  throw new Error(`SvgPath: unsupported command letter '${letter}'`);
}

/**
 * @see Movement.java#mutoToC
 *
 * When no mirror control point is available (this `S` was not immediately
 * preceded by a `C`/`S`), upstream reuses THIS command's own explicit
 * control point as both cubic control points -- NOT the current point.
 * Awkward, but faithful: preserved verbatim.
 */
function mutoToC(s: AbsMovement, mirrorControlPoint: Point2D | null): AbsMovement {
  const ctl2 = getSvgPosition(s, 0);
  const endpoint = getSvgPosition(s, 2);
  const ctl1 = mirrorControlPoint ?? ctl2;
  return { letter: 'C', args: [ctl1.x, ctl1.y, ctl2.x, ctl2.y, endpoint.x, endpoint.y] };
}

/**
 * @see Movement.java#getMirrorControlPoint
 *
 * Only the 'C' case is ported: by the time a movement reaches this call it
 * has already been through the S -> C mutation above, so upstream's
 * 'c'/'s'/'S' branches (each throwing or unreachable at this call site in
 * the Java too) do not apply here.
 */
function mirrorControlPointOf(c: AbsMovement): Point2D {
  const center = lastPositionOf(c)!;
  const controlPoint = getSvgPosition(c, 2);
  return mirrorPoint(center, controlPoint);
}

/** @see SvgPath.java constructor loop (movements build, lines ~73-96) */
function buildAbsoluteMovements(rawMovements: readonly RawMovement[]): AbsMovement[] {
  const movements: AbsMovement[] = [];
  let last: Point2D = { x: 0, y: 0 };
  let lastMove: Point2D = { x: 0, y: 0 };
  let mirrorControlPoint: Point2D | null = null;

  for (const raw of rawMovements) {
    let mv = toAbsoluteUpperCase(raw.letter, raw.args, last);
    if (mv.letter === 'Z') last = lastMove;
    if (mv.letter === 'S') mv = mutoToC(mv, mirrorControlPoint);
    movements.push(mv);
    if (mv.letter === 'M') lastMove = lastPositionOf(mv)!;
    const lp = lastPositionOf(mv);
    if (lp !== null) last = lp;
    mirrorControlPoint = mv.letter === 'C' ? mirrorControlPointOf(mv) : null;
  }
  return movements;
}

// ---------------------------------------------------------------------------
// Emission -- SvgPath#toUPath.
// ---------------------------------------------------------------------------

/** @see SvgPath.java#toUPath(XAffineTransform) -- see module doc comment for
 *  why this overload (not the double-factor one) is the port target. */
function toUPath(movements: readonly AbsMovement[], translate: UTranslate): UPath {
  // #lizard forgives -- a fixed command-letter dispatch (SvgPath#toUPath
  // port), not real branching complexity; see the module doc comment.
  const result = UPath.none();
  let previous: AbsMovement | null = null;
  for (const move of movements) {
    const letter = move.letter;
    if (letter === 'M') {
      const p = lastPositionOf(move)!;
      result.moveTo(p.x, p.y);
    } else if (letter === 'C') {
      const ctl1 = getSvgPosition(move, 0);
      const ctl2 = getSvgPosition(move, 2);
      const p = lastPositionOf(move)!;
      result.cubicTo(ctl1.x, ctl1.y, ctl2.x, ctl2.y, p.x, p.y);
    } else if (letter === 'Q') {
      const ctl = getSvgPosition(move, 0);
      const p = lastPositionOf(move)!;
      result.cubicTo(ctl.x, ctl.y, ctl.x, ctl.y, p.x, p.y);
    } else if (letter === 'T') {
      if (previous === null || (previous.letter !== 'Q' && previous.letter !== 'T'))
        throw new Error(
          `SvgPath: 'T' must follow 'Q' or 'T', found '${previous === null ? 'nothing' : previous.letter}'`,
        );
      const lastCtl = getSvgPosition(previous, 0);
      const lastP = lastPositionOf(previous)!;
      const ctl = mirrorPoint(lastP, lastCtl);
      const p = lastPositionOf(move)!;
      result.cubicTo(ctl.x, ctl.y, ctl.x, ctl.y, p.x, p.y);
    } else if (letter === 'L') {
      const p = lastPositionOf(move)!;
      result.lineTo(p.x, p.y);
    } else if (letter === 'A') {
      const p = lastPositionOf(move)!;
      result.arcTo(move.args[0]!, move.args[1]!, move.args[2]!, move.args[3]!, move.args[4]!, p.x, p.y);
    } else if (letter === 'Z') {
      result.closePath();
    } else {
      // Unreachable: buildAbsoluteMovements only ever produces
      // M/L/C/Q/T/Z/A (H/V folded into L, S mutated into C).
      /* v8 ignore next 2 */
      throw new Error(`SvgPath: unsupported letter '${letter}'`);
    }
    previous = move;
  }
  return result.translate(translate.getDx(), translate.getDy());
}

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

/**
 * Parses an SVG path `d` attribute into a `UPath`, mirroring
 * `SvgNanoParser.drawPath`'s `new SvgPath(d, translate)` +
 * `svgPath.drawMe(ug, at)` pipeline with an identity scale/rotation --
 * only the translate component is modeled (see the module doc comment for
 * why, and for the two-overload ambiguity this resolves).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java#drawPath
 */
export function parseSvgPath(d: string, translate: UTranslate): UPath {
  const tokens = decipher(d);
  const rawMovements = groupMovements(tokens);
  const movements = buildAbsoluteMovements(rawMovements);
  return toUPath(movements, translate);
}
