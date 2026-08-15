/**
 * The fuzzy member-line matcher and the class engine's own opalisable-note
 * geo builder — `cucadiagram/BodierAbstract.java#getBestMatch`/`matchScore`,
 * used to resolve a member-tip's `::member` against a classifier's rendered
 * row text.
 *
 * The Opale GEOMETRY that used to share this file moved to
 * `core/svek/image/Opale.ts`, mirroring `Opale.java`'s own package: it was
 * never class-specific, and the state engine was already reaching across an
 * engine boundary to import it from here. Re-exported below so this
 * module's existing importers are unaffected.
 */

import type { NoteGeo } from './note-layout.js';
import type { UrlInfo } from './ast.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import { resolveOpaleConnector } from '../../core/svek/image/Opale.js';

export {
  opalePolygonLeft,
  opalePolygonRight,
  opalePolygonUp,
  opalePolygonDown,
  opaleCorner,
  getOpaleStrategy,
  resolveOpaleConnector,
  type OpalePoint,
  type OpaleBox,
  type OpaleConnector,
  type OpaleDirection,
} from '../../core/svek/image/Opale.js';
export function buildOpaleNoteGeo(
  note: { id: string; target?: string; creationIndex?: number; phantomSlot?: true; color?: string; stereotype?: string; url?: UrlInfo },
  // G2 N55: `lineAtoms` added, threading `NoteGeo.lineAtoms`'s own doc
  // comment through this note-shape builder too (the general-opalisable
  // branch of `mapGroupNoteGeos`'s singleton-group dispatch) -- kept as a
  // plain structural field (not `NoteMeasurement` by name) per this
  // function's own pre-existing "erased at compile time" import-cycle note
  // below.
  m: {
    width: number;
    height: number;
    lines: string[];
    lineWidths: number[];
    lineAtoms: readonly (readonly MemberRenderAtom[])[];
    lineHeights: readonly number[];
  },
  origin: { x: number; y: number },
  points: ReadonlyArray<{ x: number; y: number }>,
): NoteGeo | undefined {
  const resolved = resolveOpaleConnector({ width: m.width, height: m.height }, origin, points);
  if (resolved === undefined) return undefined;
  return {
    id: note.id, kind: 'note', x: origin.x, y: origin.y, width: m.width, height: m.height, lines: m.lines,
    lineWidths: m.lineWidths,
    lineAtoms: m.lineAtoms,
    lineHeights: m.lineHeights,
    connector: [], opale: resolved,
    ...(note.target !== undefined ? { target: note.target } : {}),
    ...(note.creationIndex !== undefined ? { creationIndex: note.creationIndex } : {}),
    ...(note.phantomSlot !== undefined ? { phantomSlot: note.phantomSlot } : {}),
    ...(note.color !== undefined ? { color: note.color } : {}),
    ...(note.stereotype !== undefined ? { stereotype: note.stereotype } : {}),
    ...(note.url !== undefined ? { url: note.url } : {}),
  };
}

// ---------------------------------------------------------------------------
// Fuzzy member-line matcher (BodierAbstract#getBestMatch/matchScore)
// ---------------------------------------------------------------------------

const WEIGHT_BEFORE_MATCH_STEP = 1;
const WEIGHT_AFTER_SEPARATOR = 1_000;
const WEIGHT_TRAILING_LETTERS = 1_000_000;
const WEIGHT_BEFORE_MATCH_LETTER_STEP = 1_000_000_000;

function isAlphanum(ch: string): boolean {
  return /[\p{L}\p{N}_]/u.test(ch);
}

function isOnlyLetter(ch: string): boolean {
  return /\p{L}/u.test(ch);
}

/**
 * Lower is better; `Infinity` means `candidate` does not appear as a literal
 * substring of `fullString` at all (jar: `Long.MAX_VALUE`, "never matches").
 * Byte-exact port of `BodierAbstract.java#matchScore` -- penalizes how far
 * into `fullString` the match starts (letters cost far more than
 * punctuation) and how much trailing text follows the match (alphanumeric
 * trailing text costs far more than text after the first separator).
 * @see ~/git/plantuml/.../cucadiagram/BodierAbstract.java#matchScore
 */
export function matchScore(fullString: string, candidate: string): number {
  const lenFull = fullString.length;
  const lenCand = candidate.length;
  let score = 0;
  for (let i = 0; i <= lenFull - lenCand; i++) {
    if (fullString.slice(i, i + lenCand) === candidate) {
      let separatorSeen = false;
      for (let j = i + lenCand; j < lenFull; j++) {
        const ch = fullString[j]!;
        if (!separatorSeen && isAlphanum(ch)) {
          score += WEIGHT_TRAILING_LETTERS;
        } else {
          separatorSeen = true;
          score += WEIGHT_AFTER_SEPARATOR;
        }
      }
      return score;
    }
    const ch = fullString[i]!;
    score += isOnlyLetter(ch) ? WEIGHT_BEFORE_MATCH_LETTER_STEP : WEIGHT_BEFORE_MATCH_STEP;
  }
  return Infinity;
}

/**
 * Best-scoring row whose text contains `candidate` as a literal substring,
 * or `undefined` when no row matches at all -- `getBestMatch` returning
 * `null`, which makes `EntityImageTips#drawU` abort (this iteration's
 * `mapNoteGeos` marks the note `dropped` instead of throwing, matching this
 * port's established "unresolvable note command is a silent no-op" posture,
 * `class-notes.ts#finalizePendingNote`'s own doc comment).
 * @see ~/git/plantuml/.../cucadiagram/BodierAbstract.java#getBestMatch
 */
export function getBestMatchRow<T extends { text: string }>(rows: readonly T[], candidate: string): T | undefined {
  let best: T | undefined;
  let bestScore = Infinity;
  for (const row of rows) {
    const score = matchScore(row.text, candidate);
    if (score < bestScore) {
      best = row;
      bestScore = score;
      if (bestScore === 0) break;
    }
  }
  return best;
}

