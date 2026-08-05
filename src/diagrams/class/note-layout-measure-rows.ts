/**
 * Row builders split out of `note-layout-measure.ts` (500-line module cap):
 * the shared row/context types + per-row height rule, the A12 creole-table
 * grid row (`StripeTable`/`AtomTable` geometry), and the R2b `{{ ... }}`
 * embedded-diagram row (`EmbeddedDiagram` region collapse). Leaf module —
 * imports only shared creole primitives, never `note-layout-measure.ts`
 * itself (no cycle). All doc comments carried over verbatim from their
 * pre-split home; see `note-layout-measure.ts`'s module doc comment for
 * the overall `BodyEnhanced2` note-assembly picture.
 */
import type { StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { javaRound4 } from '../../core/number-format.js';
import { resolveTextEscapes } from '../../core/text-escapes.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import {
  buildMemberAtoms,
  resolveMemberAtoms,
  memberBaseFont,
  type MemberRenderAtom,
} from './class-member-creole.js';
import { EmbeddedDiagram, type NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';

/** `StripeTable.java:85` — `new AtomWithMargin(table, 2, 2)`: the whole
 *  table grid carries a 2px top + 2px bottom margin. */
const TABLE_MARGIN_Y = 2;
/** `StringUtils.PRIVATE_BLOCK` (`StripeTable.java:128`) — escaped `\|`
 *  cells hide the bar behind this sentinel during tokenization. */
const HIDDEN_BAR = '\u{e000}';

/** One assembled render row (post block/table/bullet resolution). */
export interface NoteRow {
  text: string;
  width: number;
  atoms: readonly MemberRenderAtom[];
  height: number;
}

/** Per-line build inputs the row builders need (one bundled param). */
export interface NoteLineBuildContext {
  fontSize: number;
  font: FontConfiguration;
  fontSpec: { readonly family: string; readonly size: number };
  measurer: StringMeasurer;
  maxWidth: number;
  /** A2s R2h (rotisi-30): the diagram's sprite registry -- threaded from
   *  the class layout so a `<$name>` atom in note text resolves exactly as
   *  it does in a member row (`resolveMemberAtoms`' own registry param).
   *  `undefined` (no `sprite` command in the diagram) drops sprite atoms,
   *  the same behavior as before the threading. */
  sprites?: SpriteRegistry | undefined;
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
 * A2s R2h: 'image' atoms (sprite/`<img:...>`) now contribute their OWN raw
 * height to the same max -- `AtomImg`/`AtomSprite` both have
 * `getStartingAltitude == 0` (AtomImg.java:242-244, AtomSprite.java:69-71),
 * so the identical "align bottoms to 0" derivation applies, and is
 * jar-confirmed by rotisi-30-loge424's `note left : <$printer4>` node:
 * 0.347222in = 15 (sprite height, no 10-floor -- that floor is
 * `AtomText`-specific) + 2*5 Opale margins. 'vector' (open-iconic) atoms
 * stay excluded: `AtomOpenIconic#getStartingAltitude` is `-3*factor`, NOT
 * 0, so the derivation does not transfer without independent verification
 * (see `renderer-note.ts#renderNoteLineAtoms`'s matching scope note). A
 * line with NO counted atom falls back to `fallbackFontSize`, matching
 * this function's pre-N56 flat behavior for that case.
 */
export function noteLineHeight(atoms: readonly MemberRenderAtom[], fallbackFontSize: number): number {
  let max = -Infinity;
  for (const atom of atoms) {
    const h = atom.kind === 'text' ? Math.max(atom.font.size, 10)
      : atom.kind === 'image' ? atom.height
      : undefined;
    if (h !== undefined && h > max) max = h;
  }
  return max === -Infinity ? Math.max(fallbackFontSize, 10) : max;
}

/**
 * A12: one creole-table grid row — the flat measurement-side port of
 * `StripeTable#analyzeAndAddInternal` (java:130-163) + `AtomTable
 * #calculateDimensionSlow` (java:91-96: width = sum of per-column max cell
 * widths, height = sum of per-row max cell heights) + the grid's own
 * `AtomWithMargin(table, 2, 2)` (java:85). NOT wired through the klimt
 * `StripeTable`/`SheetBlock1` object model: this file is class's flat
 * `MemberRenderAtom` adapter over the SAME shared creole primitives
 * (`class-member-creole.ts`'s own module doc comment precedent — a second,
 * structurally different adapter, not a re-port). Jar-verified against
 * `jovigo-38-tuni063` + F-C probe `table` (<0.01px). Cell text is NOT
 * trimmed (upstream tokenizes raw between `|`s), `=`-prefixed cells are
 * bold headers, `\|` escapes hide behind `StringUtils.PRIVATE_BLOCK`, and
 * `<#color>` prefixes strip through the first `>` (size-inert).
 */
export function buildTableRow(runLines: readonly string[], ctx: NoteLineBuildContext): NoteRow {
  const cellDims: { w: number; h: number }[][] = runLines.map((line) => tableRowCellDims(line, ctx));
  const nbCols = cellDims.reduce((max, row) => Math.max(max, row.length), 0);
  let width = 0;
  for (let c = 0; c < nbCols; c++) {
    width += cellDims.reduce((max, row) => Math.max(max, row[c]?.w ?? 0), 0);
  }
  const height = cellDims.reduce((sum, row) => sum + row.reduce((max, cell) => Math.max(max, cell.h), 0), 0);
  return {
    text: runLines.join('\n'),
    width: javaRound4(width),
    atoms: [],
    height: height + TABLE_MARGIN_Y * 2,
  };
}

/** One table line's cell dims — `StripeTable#analyzeAndAddInternal`'s
 *  tokenizer (`StringTokenizer(line, "|")` skips empty tokens) with the
 *  `\|`-hiding, line/cell `<#color>` strips, `=` header detection, and
 *  per-cell literal-`\n` split (`getWithNewlinesInternal`, java:166-197). */
function tableRowCellDims(line: string, ctx: NoteLineBuildContext): { w: number; h: number }[] {
  let l = line.split('\\|').join(HIDDEN_BAR);
  if (CreoleParser.doesStartByColor(l)) l = l.slice(l.indexOf('>') + 1);
  const tokens = l.split('|').filter((t) => t !== '');
  return tokens.map((token) => {
    let v = token.split(HIDDEN_BAR).join('|');
    const header = v.startsWith('=');
    if (header) v = v.slice(1);
    if (CreoleParser.doesStartByColor(v)) v = v.slice(v.indexOf('>') + 1);
    const cellFont = header ? memberBaseFont({ ...ctx.fontSpec, bold: true }, {}) : ctx.font;
    let w = 0;
    let h = 0;
    for (let s of splitTableCellLines(v)) {
      if (s.startsWith('<r>')) s = s.slice('<r>'.length);
      const build = resolveMemberAtoms(buildMemberAtoms(resolveTextEscapes(s), cellFont), cellFont, ctx.measurer, ctx.sprites);
      w = Math.max(w, build.width);
      h += noteLineHeight(build.atoms, ctx.fontSize);
    }
    return { w, h };
  });
}

/** `StripeTable#getWithNewlinesInternal` (java:166-197, legacy branch):
 *  `\n` breaks the cell into sub-lines, `\\` is a literal backslash, any
 *  other `\x` keeps both chars. */
function splitTableCellLines(s: string): string[] {
  const result: string[] = [];
  let current = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charAt(i);
    if (c === '\\' && i < s.length - 1) {
      const c2 = s.charAt(i + 1);
      i++;
      if (c2 === 'n') {
        result.push(current);
        current = '';
      } else if (c2 === '\\') {
        current += c2;
      } else {
        current += c + c2;
      }
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

/**
 * R2b: the nested-diagram seam left deliberately UNWIRED for measurement.
 * `EmbeddedDiagram#calculateDimensionSlow` (java:125-151) catches ANY
 * failure to produce the nested image/text-block and returns `new
 * XDimension2D(42, 42)` (java:150) — and that catch path is exactly what
 * the oracle jar itself takes in the deterministic DOT-dump environment
 * (jar-probe 2026-08-05: `PortableImageAwt.getWidth` NPEs from
 * `EmbeddedDiagram.calculateDimensionSlow`, and the resulting svek DOT is
 * byte-identical to the pinned `xadado-92-lazo250` golden: both embedded
 * notes 0.875in x 0.902778in == (42+6+15) x (42+13+2*5) px). Wiring a real
 * renderer here (full parse -> layout -> render recursion) is the
 * follow-up the seam exists for; when it lands, this constant stays as the
 * upstream-faithful failure fallback.
 */
const UNWIRED_NESTED_RENDERER: NestedDiagramRenderer = {
  render(): never {
    throw new Error(
      'note-layout-measure: no NestedDiagramRenderer wired for {{...}} embedded-diagram ' +
        'note regions yet (see EmbeddedDiagram.ts#NestedDiagramRenderer, the seam to implement)',
    );
  },
};

/** `StringBounder` adapter over this module family's `StringMeasurer`, for
 *  `EmbeddedDiagram#calculateDimension`. Height mirrors `noteLineHeight`'s
 *  per-line rule (`max(size, 10)`). Today the unwired renderer throws
 *  before any text is measured (the 42x42 catch path, above); this adapter
 *  exists so a future wired renderer measures through the SAME width
 *  tables the rest of the note pipeline uses. */
function embeddedStringBounder(measurer: StringMeasurer): StringBounder {
  return {
    calculateDimension: (font, text) =>
      new XDimension2D(measurer.measure(text, font).width, Math.max(font.size, 10)),
  };
}

/**
 * R2b: consume one `{{ ... }}` embedded-diagram region starting at
 * `blockLines[start]` (whose `getEmbeddedType` already matched) and build
 * its single row. Region collection delegates to the REAL ported
 * `EmbeddedDiagram.createAndSkip` (java:97-115 — nesting-aware: an inner
 * `{{` increments depth, a bare `}}` decrements, only the outermost `}}`
 * is swallowed) via a counting iterator, so measurement consumes exactly
 * the lines upstream's creole parser would. The row's dimensions come from
 * `EmbeddedDiagram#calculateDimension` itself — today always the java:150
 * `XDimension2D(42, 42)` catch fallback (see `UNWIRED_NESTED_RENDERER`).
 * `atoms: []` matches the table/separator-row convention: nothing for the
 * renderer to draw at the row's own x/y (drawing the nested diagram is the
 * same seam follow-up).
 */
export function consumeEmbeddedRow(
  blockLines: readonly string[],
  start: number,
  type: string,
  ctx: NoteLineBuildContext,
): { row: NoteRow; nextIndex: number } {
  let consumed = 0;
  const base = blockLines.slice(start + 1)[Symbol.iterator]();
  const counting: Iterator<string> = {
    next: (): IteratorResult<string> => {
      const step = base.next();
      if (step.done !== true) consumed++;
      return step;
    },
  };
  const embedded = EmbeddedDiagram.createAndSkip(type, counting, null, UNWIRED_NESTED_RENDERER);
  const dim = embedded.calculateDimension(embeddedStringBounder(ctx.measurer));
  const nextIndex = start + consumed;
  return {
    row: {
      text: blockLines.slice(start, nextIndex + 1).join('\n'),
      width: javaRound4(dim.getWidth()),
      atoms: [],
      height: dim.getHeight(),
    },
    nextIndex,
  };
}
