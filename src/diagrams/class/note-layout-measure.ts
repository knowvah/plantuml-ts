/**
 * Note text measurement — a clean leaf of the note-layout module family. No
 * dependency on grouping or tip/geo resolution; those modules import
 * `NoteMeasurement`/`measureNote` from here.
 */
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { javaRound4 } from '../../core/number-format.js';
import { resolveTextEscapes } from '../../core/text-escapes.js';
import {
  buildMemberAtoms,
  resolveMemberAtoms,
  memberBaseFont,
  buildWrappedMemberRows,
  atomsToPlainText,
  type MemberRenderAtom,
} from './class-member-creole.js';

/** `plantuml.skin`'s `note { FontSize 13 }` default — one point smaller
 *  than the diagram's normal text. G2 N39: the DEFAULT only -- a `<style>
 *  note { FontSize N }` block (or flat `skinparam noteFontSize N`) override
 *  is threaded via `theme.colors.elements['note'].fontSize` (`ELEMENT_
 *  BUCKET_SNAMES`'s pre-existing 'note' entry, G2 N34 -- the bucket was
 *  already populated, this constant just never consulted it, jar-verified
 *  `xokipa-29-rafu481`). */
const NOTE_FONT_SIZE = 13;
/** `Opale.java`'s `marginX1`/`marginX2`/`marginY` — the note text's own
 *  inset from the folded-corner box (asymmetric: more room on the right,
 *  where the fold lives). */
const NOTE_MARGIN_X1 = 6;
const NOTE_MARGIN_X2 = 15;
const NOTE_MARGIN_Y = 5;

export interface NoteMeasurement {
  width: number;
  height: number;
  lines: string[];
  lineWidths: number[];
  /** G2 N55: see `NoteGeo.lineAtoms`'s own doc comment -- ALWAYS populated
   *  here (this is the one production builder, unlike the geo's own optional
   *  field which also serves hand-built test literals). */
  lineAtoms: readonly (readonly MemberRenderAtom[])[];
  /** G2 N56: see `NoteGeo.lineHeights`'s own doc comment -- ALWAYS populated
   *  here, same "production builder always sets it" contract as `lineAtoms`
   *  above. */
  lineHeights: readonly number[];
}

/**
 * G2/N13: corrected to the real `Opale.java` formula — `getWidth`/
 * `getHeight` (`textWidth + marginX1 + marginX2`, `textBlockHeight +
 * 2*marginY`) at the note-specific font size 13, one line == `NOTE_FONT_
 * SIZE` tall (mirrors `class-layout-helpers.ts`'s own "row height ==
 * fontSize, not `*1.4`" convention, G2 N4). Jar-verified byte-exact against
 * `cajicu-52-cego765` (single line: width 7.2313+21=28.2313, height
 * 13+10=23) and `tenobo-24-liga464` (multi-line notes, same per-line
 * height). The PREVIOUS formula (`fontSize*1.4` line height, `+16+10`
 * margin, at the diagram's normal font size) was never jar-verified — no
 * fixture reached zero-diff through it (see ledger.md N6-N12's own
 * "diagnosed, not fixed" note-connector entries).
 */
export function measureNote(text: string, theme: Theme, measurer: StringMeasurer): NoteMeasurement {
  // G2/N21: `<U+XXXX>` unicode-codepoint / `&#NNN;` HTML entity escapes,
  // resolved BEFORE measuring/splitting -- shared with description's
  // identical AtomText-derived mechanism (`core/text-escapes.ts`),
  // jar-verified against `pacuve-18-gaso238`'s `<U+005C>` (a literal `\`).
  const rawLines = resolveTextEscapes(text).split('\n');
  const { fontSize, fontSpec, font, maxWidth } = resolveNoteFontContext(theme);
  const { lines, lineWidths, lineAtoms } = buildNoteLineRuns(rawLines, { font, fontSpec, measurer, maxWidth });
  // G2 N56: per-line height, see `NoteGeo.lineHeights`'s own doc comment.
  const lineHeights = lineAtoms.map((atoms) => noteLineHeight(atoms, fontSize));
  const maxW = Math.max(...lineWidths);
  return {
    lines,
    lineWidths,
    lineAtoms,
    lineHeights,
    width: maxW + NOTE_MARGIN_X1 + NOTE_MARGIN_X2,
    height: lineHeights.reduce((sum, h) => sum + h, 0) + NOTE_MARGIN_Y * 2,
  };
}

/**
 * `theme`-derived font + wrap-width context every note line shares. Split
 * out of `measureNote` for the complexity-hook NLOC cap.
 *
 * G2 N39: `fontSize` -- `<style> note { FontSize N }` block (or flat
 * `skinparam noteFontSize N`) override, see `NOTE_FONT_SIZE`'s own doc
 * comment. G2 N55: `font` -- each line routes through the SAME shared
 * creole atom engine `class-member-creole.ts` wires for classifier member
 * rows (`buildMemberAtoms`/`resolveMemberAtoms`, N22's own
 * `classifyStripeLine` -> `buildStripeAtoms`/`buildLiteralAtoms` dispatch)
 * -- `memberBaseFont(fontSpec, {})` with an EMPTY member object (a note
 * line has no `{abstract}`/`{static}` modifier concept) yields the exact
 * `{family, size, color: null, styles: new Set()}` base font, whose
 * `atomFontSpec` projection is BYTE-IDENTICAL to the pre-cutover `fontSpec`
 * (no `weight`/`style` keys) -- this is the mission's own
 * measurement-identity proof: for a line with NO creole markup,
 * `buildStripeAtoms` returns EXACTLY one `{kind:'text', text: line, font}`
 * atom (`StripeSimple.ts`'s own doc comment guarantee) and
 * `resolveMemberAtoms` measures it via `measurer.measure(line,
 * atomFontSpec(font))` -- the SAME call, SAME arguments, as the removed
 * direct `measurer.measure(ln, fontSpec).width` call this replaces (see
 * `class-member-creole.test.ts`'s identical proof for member rows, N22's
 * own precedent). G2 N66 (item 35's own named remainder, N65): `maxWidth`
 * -- `<style> note { MaximumWidth N } }` / `element { MaximumWidth N } }`
 * word-wrap (`EntityImageNote`'s OWN style signature,
 * `theme.ts#noteCascadeMaximumWidth`'s own doc comment); `maxWidth<=0` (the
 * overwhelming majority of notes) short-circuits every line to the SAME
 * single-build result the pre-N66 direct call produced, byte-identical.
 */
function resolveNoteFontContext(
  theme: Theme,
): { fontSize: number; fontSpec: { family: string; size: number }; font: FontConfiguration; maxWidth: number } {
  const fontSize = theme.colors.elements?.['note']?.fontSize ?? NOTE_FONT_SIZE;
  const fontSpec = { family: theme.fontFamily, size: fontSize };
  const font = memberBaseFont(fontSpec, {});
  const maxWidth = theme.colors.graph.noteCascadeMaximumWidth ?? 0;
  return { fontSize, fontSpec, font, maxWidth };
}

/** Per-line build inputs `buildNoteLineRuns` needs -- bundled into one
 *  parameter (complexity-hook param cap). */
interface NoteLineBuildContext {
  font: FontConfiguration;
  fontSpec: { readonly family: string; readonly size: number };
  measurer: StringMeasurer;
  maxWidth: number;
}

/**
 * Build each raw (already `\n`-split) source line's own render row(s) --
 * one row per line normally, 2+ when `ctx.maxWidth` wraps it (G2 N66). See
 * `measureNote`'s own doc comment for the creole-atom-engine rationale and
 * the wrapped-vs-single `lines` text-rebuild convention.
 */
function buildNoteLineRuns(
  rawLines: string[],
  ctx: NoteLineBuildContext,
): { lines: string[]; lineWidths: number[]; lineAtoms: (readonly MemberRenderAtom[])[] } {
  const { font, fontSpec, measurer, maxWidth } = ctx;
  const lines: string[] = [];
  const lineWidths: number[] = [];
  const lineAtoms: (readonly MemberRenderAtom[])[] = [];
  for (const ln of rawLines) {
    const builds = maxWidth > 0
      ? buildWrappedMemberRows(ln, {}, fontSpec, measurer, maxWidth)
      : [resolveMemberAtoms(buildMemberAtoms(ln, font), font, measurer)];
    // G2 N66: mirrors `buildWrappedSectionRowBuilds`'s own convention --
    // the SINGLE-row case (the overwhelming majority) keeps the source
    // line's ORIGINAL text verbatim; only a GENUINELY wrapped (2+ row)
    // line rebuilds each row's own text from its wrapped atoms
    // (`atomsToPlainText`, `class-member-rows.ts#buildWrappedSectionRowBuilds`'s
    // own doc comment for why `row.text` is otherwise unconsumed whenever
    // `row.atoms`/`lineAtoms` is set).
    for (const build of builds) {
      lines.push(builds.length === 1 ? ln : atomsToPlainText(build.atoms));
      lineWidths.push(javaRound4(build.width));
      lineAtoms.push(build.atoms);
    }
  }
  return { lines, lineWidths, lineAtoms };
}

/**
 * G2 N56: one note line's own height -- jar's real `Sea`/`Position` math
 * (`SheetBlock1#initMap`'s `sea.doAlign()` + `getHeight() == getMaxY() -
 * getMinY()`) reduces, for every NORMAL (non-superscript/subscript,
 * `FontPosition.getSpace() == 0`) atom, to a flat MAX over each atom's OWN
 * `AtomText#calculateDimensionSlow` height (`stringBounder.calculateDimension
 * (...).getHeight()`, floored at 10) -- NOT an ascent/descent-weighted SUM
 * (confirmed algebraically: every atom's measured-rect BOTTOM edge aligns to
 * the SAME shared y=0, so the stripe's total span is exactly the tallest
 * atom's own height; re-derivation cross-checked against `fogexa-30-
 * zupo141`'s real per-run baselines -- "In java," @ y=26.1111 (13pt),
 * "every" @ y=25 (18pt, `<size:18>`) on the SAME physical line, delta
 * 1.1111 == the two sizes' own `size/4.5` descent difference, and the NEXT
 * line's baseline sits EXACTLY 18 (not 13) below this line's own top,
 * proving the cumulative stack advances by each line's own MAX height).
 * Scoped to 'text' atoms only -- an 'image'/'vector' atom's own height
 * contribution is UNCONFIRMED by any corpus fixture (`AtomOpenIconic`'s own
 * `getStartingAltitude` is `-3*factor`, NOT the 0 every 'text'/'image' atom
 * uses, so the same "align bottoms to 0" derivation would need independent
 * verification before extending to it -- deliberately NOT guessed here, see
 * `renderer-note.ts#renderNoteLineAtoms`'s matching scope note). A line with
 * no 'text' atom at all (an image-only line, zero corpus reach) falls back
 * to `fallbackFontSize`, matching this function's pre-N56 flat behavior for
 * that unconfirmed case.
 */
function noteLineHeight(atoms: readonly MemberRenderAtom[], fallbackFontSize: number): number {
  let max = -Infinity;
  for (const atom of atoms) {
    if (atom.kind !== 'text') continue;
    const h = Math.max(atom.font.size, 10);
    if (h > max) max = h;
  }
  return max === -Infinity ? Math.max(fallbackFontSize, 10) : max;
}
