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
import { getFont } from '../../core/klimt/shape/UText.js';
import { FontPosition, fontPositionSpace } from '../../core/klimt/font/FontPosition.js';
import { resolveTextEscapes } from '../../core/text-escapes.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { buildMemberAtoms, resolveMemberAtoms, memberBaseFont, type MemberRenderAtom } from './class-member-creole.js';
import { atomTextLineHeight } from './class-stereotype-layout.js';
import { EmbeddedDiagram, type NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import { getClassNestedDiagramRenderer } from './class-nested-diagram-renderer.js';
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
  /** T10: present only for a block-separator "leading" row (the row whose
   *  `.height` is `BodyEnhancedAbstract#decorate`'s `contentTop` margin --
   *  see `note-layout-measure.ts#appendDecoratedBlock`'s own doc comment) --
   *  tells the renderer to draw a `<line>` at this row's OWN top (offset
   *  {@link NoteDividerDraw.dividerYOffset} down from it). */
  divider?: NoteDividerDraw;
  /** T10: present only for a creole-table grid row (`CreoleParser
   *  .isTableLine` run, {@link buildTableRow}) -- tells the renderer to
   *  draw the grid + every cell's own text atoms at this row's own top. */
  table?: NoteTableDraw;
}

/** T10: `UHorizontalLine#getStroke`'s draw parameters for a note block
 *  separator, mirrored from `class-body-enhanced-layout.ts#EnhancedDividerPart`
 *  (the class-body divider's OWN identical shape, already jar-verified for
 *  every one of these fields) -- duplicated rather than imported since that
 *  interface (and its three small `separatorStroke*` builders) are private
 *  to a file this module does not otherwise depend on, matching this file
 *  family's established "duplicate a small private helper rather than cross
 *  a module boundary for it" precedent (`renderer-note.ts#noteAtomDecoration`'s
 *  own doc comment cites the same convention).
 * @see ~/git/plantuml/.../klimt/shape/UHorizontalLine.java#getStroke,drawHLine
 */
export interface NoteDividerDraw {
  /** Offset from this row's own top where the `<line>` actually draws -- 0
   *  for an UNTITLED separator (`BodyEnhancedAbstract#decorate`'s
   *  `TextBlockLineBefore#drawU`: the line draws BEFORE any margin
   *  translate). Always 0: a note/legend TITLED separator (`--Header--`)
   *  is a NAMED, scoped-out remainder of this task -- zero corpus reach
   *  (grep-verified: every `class-divergence-drive` fixture with a
   *  non-empty-captured `--...--`/`==...==` line is a CLASS BODY separator,
   *  `class-body-enhanced-layout.ts`'s own existing mechanism, never a note
   *  or legend body) and its content-draws-before-divider/title-baseline
   *  draw order (`renderer-body-enhanced.ts`'s own module doc comment) is
   *  real extra complexity with nothing to jar-verify it against here --
   *  `appendDecoratedBlock` below leaves a titled note separator UNCHANGED
   *  from its pre-T10 behavior (reserved height only, no `<line>`, matching
   *  every OTHER unreached branch's "named, not built" convention) rather
   *  than guess the formula. */
  readonly dividerYOffset: number;
  readonly strokeWidth: number;
  readonly strokeDasharray?: string;
  readonly doubleLine?: boolean;
}

/** `note-layout-measure.ts#appendDecoratedBlock`'s own untitled-separator
 *  draw-metadata build -- kept here (not there) purely for that file's
 *  500-line cap. */
export function buildDividerDraw(char: string, dividerYOffset: number): NoteDividerDraw {
  return { dividerYOffset, strokeWidth: separatorStrokeWidth(char), ...separatorStrokeExtras(char) };
}

/** `UHorizontalLine#getStroke`: `'-'`/`'='` -> thickness 1; `'.'` -> thickness
 *  1 dashed (`new UStroke(1, 2, 1)`); anything else (`'_'`, synthetic
 *  block0/trailing-empty sentinel) -> thickness 0.5 (`PName.LineThickness`'s
 *  default -- `note-layout-measure.ts`'s own `ELEMENT_DEFAULT_LINE_THICKNESS`
 *  import would cycle back here, so the literal is repeated, matching
 *  `class-body-enhanced-layout.ts`'s own identical literal). Duplicated from
 *  that file's private, byte-identical helper rather than imported -- see
 *  `NoteDividerDraw`'s own doc comment for the precedent. */
function separatorStrokeWidth(char: string): number {
  return char === '-' || char === '=' || char === '.' ? 1 : 0.5;
}

/** `UHorizontalLine#drawHLine`'s `'.'` dash pattern and `'='` double-line
 *  flag, bundled into ONE optional-spread object so the caller stays under
 *  this project's per-call-site param/NLOC cap. */
function separatorStrokeExtras(char: string): { strokeDasharray?: string; doubleLine?: true } {
  if (char === '.') return { strokeDasharray: '1,2' };
  if (char === '=') return { doubleLine: true };
  return {};
}

/** T10: one table cell's own drawable content, relative to the TABLE
 *  row's own origin (`colBounds[col]`/`rowBounds[row]` below already carry
 *  the absolute-within-row offset; a cell's atoms draw at exactly
 *  `(colBounds[col], rowBounds[row] + baselineOffset)` for its FIRST
 *  subline -- `AtomTable.ts#drawCell`'s LEFT-alignment default, the only
 *  alignment this corpus reaches, `<r>`-right-align stays a named,
 *  pre-existing, zero-reach gap in {@link tableRowCellDims} unchanged by
 *  this task). `lines` holds one entry per `\n`-split subline within the
 *  cell (`splitTableCellLines`) -- `y` is each subline's own cumulative
 *  offset from the cell's (and so the row's) own top. */
export interface NoteTableCell {
  readonly col: number;
  readonly row: number;
  readonly lines: readonly { readonly y: number; readonly atoms: readonly MemberRenderAtom[] }[];
}

/** T10: one creole-table grid's full draw geometry -- `AtomTable.ts`'s own
 *  `getStartingX`/`getStartingY` cumulative-sum convention (col/row N's
 *  start is the sum of every earlier col/row's own max width/height),
 *  computed ONCE at layout time (measurer-free at render time, matching
 *  every other `NoteGeo` field's "measured once, drawn many" contract).
 *  Bounds are relative to the TABLE's own origin: `colBounds[0] === 0`
 *  (flush with the row's left margin, `note.x + NOTE_MARGIN_X1`, same as
 *  plain text) and `rowBounds[0] === TABLE_MARGIN_Y` (the grid's own top
 *  margin, `StripeTable.java:85`'s `AtomWithMargin(table, 2, 2)`). */
export interface NoteTableDraw {
  readonly colBounds: readonly number[];
  readonly rowBounds: readonly number[];
  readonly lineColor: string;
  readonly cells: readonly NoteTableCell[];
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
 * getMinY()`), algebraically closed-formed as `max(altitude) + max(height -
 * altitude)` (same reduction as `class-member-creole-sea.ts
 * #seaLineHeightAndSpan`, this function's row-height sibling for member
 * text -- kept as an independent formula here because this function only
 * ever sees the ALREADY-RESOLVED `MemberRenderAtom[]`, not the raw
 * `CreoleAtom[]` `resolveMemberAtoms` builds `dy` from). For every NORMAL
 * (non-superscript/subscript, `FontPosition.getSpace() == 0`) atom every
 * altitude is 0 and this collapses to the PRE-SI30 flat MAX over each
 * atom's own `AtomText#calculateDimensionSlow` height (floored at 10) --
 * NOT an ascent/descent-weighted SUM (confirmed algebraically: every atom's
 * measured-rect BOTTOM edge aligns to the SAME shared y=0, so the stripe's
 * total span is exactly the tallest atom's own height; re-derivation
 * cross-checked against `fogexa-30-zupo141`'s real per-run baselines --
 * "In java," @ y=26.1111 (13pt), "every" @ y=25 (18pt, `<size:18>`) on the
 * SAME physical line, delta 1.1111 == the two sizes' own `size/4.5` descent
 * difference, and the NEXT line's baseline sits EXACTLY 18 (not 13) below
 * this line's own top, proving the cumulative stack advances by each
 * line's own MAX height). SI30 D2/D3: a `<sup>`/`<sub>` run's own non-zero
 * altitude (`FontPosition.getSpace()`, `AtomText.java:321-323`) now grows
 * the line correctly instead of being floor-clipped away -- jar-verified
 * against `exposant-01-class`'s `**bold <sub>sub</sub> and <sup>sup</sup>
 * text**` note line (0.402778in target note height, only reachable via this
 * reduction, not the flat MAX).
 * A2s R2h: 'image' atoms (sprite/`<img:...>`) contribute their OWN raw
 * height at altitude 0 -- `AtomImg`/`AtomSprite` both have
 * `getStartingAltitude == 0` (AtomImg.java:242-244, AtomSprite.java:69-71),
 * jar-confirmed by rotisi-30-loge424's `note left : <$printer4>` node:
 * 0.347222in = 15 (sprite height, no 10-floor -- that floor is
 * `AtomText`-specific) + 2*5 Opale margins. 'vector' (open-iconic) atoms
 * stay excluded from the reduction entirely (not merely altitude-0): `Atom
 * OpenIconic#getStartingAltitude` is `-3*factor`, NOT 0, so the derivation
 * does not transfer without independent verification (see `renderer-note.ts
 * #renderNoteLineAtoms`'s matching scope note) -- {@link noteLineHeightEntry}
 * returns `undefined` for it, same as before this task. A line with NO
 * counted atom falls back to `fallbackFontSize`, matching this function's
 * pre-N56 flat behavior for that case.
 */
export function noteLineHeight(atoms: readonly MemberRenderAtom[], fallbackFontSize: number): number {
  let maxAltitude = -Infinity;
  let maxSpan = -Infinity;
  let counted = false;
  for (const atom of atoms) {
    const entry = noteLineHeightEntry(atom);
    if (entry === undefined) continue;
    counted = true;
    if (entry.altitude > maxAltitude) maxAltitude = entry.altitude;
    const span = entry.height - entry.altitude;
    if (span > maxSpan) maxSpan = span;
  }
  return counted ? maxAltitude + maxSpan : Math.max(fallbackFontSize, 10);
}

/** One atom's `{altitude, height}` contribution to {@link noteLineHeight}'s
 *  `Sea` reduction -- `undefined` for a kind that does not count (matches
 *  the pre-SI30 exclusion of 'vector'/'bullet', see {@link noteLineHeight}'s
 *  own doc comment). Factored out to keep that function's own CCN from
 *  growing (mirrors `class-member-creole-sea.ts`'s identical split). */
function noteLineHeightEntry(atom: MemberRenderAtom): { altitude: number; height: number } | undefined {
  if (atom.kind === 'text') {
    return {
      altitude: fontPositionSpace(atom.font.fontPosition ?? FontPosition.NORMAL),
      height: atomTextLineHeight(getFont(atom.font).size),
    };
  }
  if (atom.kind === 'image') return { altitude: 0, height: atom.height };
  return undefined;
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
  const cellDims: TableCellDims[][] = runLines.map((line) => tableRowCellDims(line, ctx));
  const { colBounds, rowBounds, cells } = tableGridBounds(cellDims);
  const width = colBounds[colBounds.length - 1]!;
  const height = rowBounds[rowBounds.length - 1]! - TABLE_MARGIN_Y;
  // `StripeTable.java:79-82`'s `getBackOrFrontColor(line, 1)` per-table
  // `<#color>` override (checked against the FIRST run line only) is a
  // named, zero-corpus-reach gap (`jovigo-38-tuni063` carries none) -- the
  // grid always falls back to `fontConfiguration.getColor()`, i.e. this
  // row's own resolved font color, mirroring the SAME `?? '#000000'`
  // fallback `renderNoteLineAtoms`'s text fill already applies.
  const lineColor = ctx.font.color ?? '#000000';
  return {
    text: runLines.join('\n'),
    width,
    atoms: [],
    height: height + TABLE_MARGIN_Y * 2,
    table: { colBounds, rowBounds, lineColor, cells },
  };
}

/** {@link buildTableRow}'s own `AtomTable.ts#getStartingX`/`getStartingY`
 *  cumulative-sum + cell-flattening pass, split out purely to keep that
 *  function's own NLOC under this project's complexity cap. */
function tableGridBounds(cellDims: readonly (readonly TableCellDims[])[]): {
  colBounds: number[];
  rowBounds: number[];
  cells: NoteTableCell[];
} {
  const nbCols = cellDims.reduce((max, row) => Math.max(max, row.length), 0);
  const colBounds = [0];
  for (let c = 0; c < nbCols; c++) {
    const colW = cellDims.reduce((max, row) => Math.max(max, row[c]?.w ?? 0), 0);
    colBounds.push(colBounds[c]! + colW);
  }
  const rowBounds = [TABLE_MARGIN_Y];
  for (const row of cellDims) {
    const rowH = row.reduce((max, cell) => Math.max(max, cell.h), 0);
    rowBounds.push(rowBounds[rowBounds.length - 1]! + rowH);
  }
  const cells: NoteTableCell[] = [];
  cellDims.forEach((row, r) => row.forEach((cell, c) => cells.push({ col: c, row: r, lines: cell.lines })));
  return { colBounds, rowBounds, cells };
}

interface TableCellDims {
  readonly w: number;
  readonly h: number;
  readonly lines: readonly { readonly y: number; readonly atoms: readonly MemberRenderAtom[] }[];
}

/** One table line's cell dims — `StripeTable#analyzeAndAddInternal`'s
 *  tokenizer (`StringTokenizer(line, "|")` skips empty tokens) with the
 *  `\|`-hiding, line/cell `<#color>` strips, `=` header detection, and
 *  per-cell literal-`\n` split (`getWithNewlinesInternal`, java:166-197).
 *  T10: now also captures each subline's own resolved `atoms` (`build
 *  .atoms`, already computed by the SAME `resolveMemberAtoms` call this
 *  function always made -- previously discarded, keeping only its `width`/
 *  `noteLineHeight`) so {@link buildTableRow} can hand the renderer
 *  something to actually draw, not just a cell's reserved box. */
function tableRowCellDims(line: string, ctx: NoteLineBuildContext): TableCellDims[] {
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
    const lines: { y: number; atoms: readonly MemberRenderAtom[] }[] = [];
    for (let s of splitTableCellLines(v)) {
      // `<r>`-right-alignment stays UNAPPLIED at draw time (pre-existing gap,
      // unchanged by this task -- see `NoteTableCell`'s own doc comment);
      // the marker is still stripped so it never leaks into the drawn text.
      if (s.startsWith('<r>')) s = s.slice('<r>'.length);
      const build = resolveMemberAtoms(
        buildMemberAtoms(resolveTextEscapes(s), cellFont),
        cellFont,
        ctx.measurer,
        ctx.sprites,
      );
      lines.push({ y: h, atoms: build.atoms });
      w = Math.max(w, build.width);
      h += noteLineHeight(build.atoms, ctx.fontSize);
    }
    return { w, h, lines };
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
    calculateDimension: (font, text) => new XDimension2D(measurer.measure(text, font).width, Math.max(font.size, 10)),
  };
}

/**
 * CDD B7FU-R2: reconstructs the `@start<type>` / ... / `@end<type>` source
 * `EmbeddedDiagram.createAndSkip` (java:97-115) would hand a real renderer
 * — the SAME wrap `class-body-enhanced-embeds.ts#wrapEmbeddedSource`
 * builds for the class-body embed path, duplicated (not imported) per that
 * file's own module doc comment on cross-module-family duplication of a
 * small private helper (`renderer-note.ts#noteAtomDecoration`'s
 * precedent). `consumed` counts every line the counting iterator in
 * {@link consumeEmbeddedRow} yielded, INCLUDING the outermost closing
 * `}}` (the iterator must read it to detect the close) — so the body-only
 * slice drops it when present, matching `createAndSkip`'s own "consumed
 * but NOT appended to the collected block" rule for that one line.
 */
function wrapEmbeddedNoteSource(type: string, blockLines: readonly string[], start: number, consumed: number): string[] {
  const body = blockLines.slice(start + 1, start + 1 + consumed);
  const last = body.at(-1);
  const hasCloser = last !== undefined && last.trim() === EmbeddedDiagram.EMBEDDED_END;
  const inner = hasCloser ? body.slice(0, -1) : body;
  return [`@start${type}`, ...inner, `@end${type}`];
}

/**
 * R2b/CDD B7FU-R2: consume one `{{ ... }}` embedded-diagram region starting
 * at `blockLines[start]` (whose `getEmbeddedType` already matched) and
 * build its single row. Region collection delegates to the REAL ported
 * `EmbeddedDiagram.createAndSkip` (java:97-115 — nesting-aware: an inner
 * `{{` increments depth, a bare `}}` decrements, only the outermost `}}`
 * is swallowed) via a counting iterator, so measurement consumes exactly
 * the lines upstream's creole parser would.
 *
 * The row's SIZING (`width`/`height`, i.e. the note box's own geometry
 * contribution) stays the java:150 `XDimension2D(42, 42)` catch fallback
 * (`UNWIRED_NESTED_RENDERER`, unconditionally) — jar-verified: xadado-92-
 * lazo250's own two note boxes (63x65, matching `(42+6+15) x (42+13+2*5)`
 * exactly) size THIS way even though their DRAWN images are real 122x124/
 * 105x96 renders, the identical sizing/drawing asymmetry `class-body-
 * enhanced-embeds.ts#renderEmbed`'s own doc comment documents for class
 * bodies (`EmbeddedDiagram.java:126-152`'s two independent `isSvg`-gated
 * branches: the LAYOUT pass's `StringBounder` never carries the SVG hint
 * in this port's deterministic oracle-render environment and always takes
 * the catch; the SEPARATE draw pass's real `UGraphic` does and always
 * succeeds). `atoms` carries ONE `'image'` atom when the registered
 * renderer (`class-nested-diagram-renderer.ts#getClassNestedDiagramRenderer`)
 * produces a real image — a render failure (no renderer registered, an
 * unsupported diagram type, e.g. no salt engine) leaves `atoms: []`,
 * matching the table/separator-row convention (nothing to draw) and
 * `EmbeddedDiagram.java:191-193`'s own independent `drawU` catch (draws
 * nothing on failure, logged not swallowed).
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
  const atoms: readonly MemberRenderAtom[] = buildEmbeddedNoteImageAtom(
    wrapEmbeddedNoteSource(type, blockLines, start, consumed),
  );
  return {
    row: {
      text: blockLines.slice(start, nextIndex + 1).join('\n'),
      width: dim.getWidth(),
      atoms,
      height: dim.getHeight(),
    },
    nextIndex,
  };
}

/** Renders the embedded diagram's REAL `<image>`, independent of {@link
 *  consumeEmbeddedRow}'s own SIZING (which stays the fallback -- see that
 *  function's own doc comment). Logged-not-swallowed on failure, mirroring
 *  `class-body-enhanced-embeds.ts#renderEmbed`'s identical catch. */
function buildEmbeddedNoteImageAtom(source: readonly string[]): readonly MemberRenderAtom[] {
  const renderer = getClassNestedDiagramRenderer();
  if (renderer === undefined) return [];
  try {
    const img = renderer.renderImage(source);
    return [{ kind: 'image', href: img.href, width: img.width, height: img.height }];
  } catch (err) {
    console.error('consumeEmbeddedRow: nested-diagram render failed', err);
    return [];
  }
}
