/**
 * class-body-enhanced-layout.ts — assembles a classifier's `EnhancedBodyBlock`
 * list (`class-body-enhanced.ts#splitEnhancedBlocks`) into absolute, LOCAL-
 * to-body draw geometry: `ClassifierGeo['rows']`-shaped text rows (reusing
 * the SAME `renderer-classifier-box.ts#renderRowText` render path every
 * OTHER member row uses) plus new divider/tree-connector primitives.
 *
 * G2 N42 (mission priority 1). Every offset formula below is jar-verified
 * byte-exact against `fecolo-08-gepu579` (labeled separator + 1 leading
 * field + tree), `jajebo-21-dada557` (tree only, no separator), and
 * `pacagu-24-nune023` (labeled separator + EMPTY leading content + tree) —
 * see `plans/g2-class-svg/ledger.md` N42 for the full byte-level derivation
 * (`decorate()`/`TextBlockLineBefore`/`UHorizontalLine` arithmetic).
 *
 * NOT verified against a jar sample: a titled OR untitled separator whose
 * OWN content-plus-margin width would exceed the header's width (every
 * target fixture's header dominates) — `rowsBlockWidth`'s own doc comment
 * flags the specific unverified edge case.
 *
 * @see ~/git/plantuml/.../cucadiagram/BodyEnhancedAbstract.java#decorate
 * @see ~/git/plantuml/.../klimt/shape/TextBlockLineBefore.java
 * @see ~/git/plantuml/.../klimt/shape/UHorizontalLine.java
 */
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ClassifierGeo } from './layout.js';
import type { Member } from './ast.js';
import { parseMemberLine } from './class-member-parser.js';
import { buildMemberRow, type MemberRowBuild } from './class-member-creole.js';
import { formatMemberText } from './class-layout-helpers.js';
import { sectionWidth, ROW_TEXT_LEFT_MARGIN } from './class-member-rows.js';
import { splitEnhancedBlocks, type EnhancedBodyBlock, type BlockSeparatorSpec } from './class-body-enhanced.js';
import { measureTreeCells, computeTreeConnectors, type TreeConnector } from './class-body-tree.js';
import {
  ClassifierBodyGeometry,
  ELEMENT_DEFAULT_LINE_THICKNESS,
  BODY_ENHANCED_MARGIN_X,
} from './class-body-enhanced-geometry.js';

const ROW_ICON_ZONE_WIDTH = 14;
const ROW_INDENT_WITH_ICON = ROW_TEXT_LEFT_MARGIN + ROW_ICON_ZONE_WIDTH;
/** `AtomWithMargin(tree, 2, 2)` — vertical-only top/bottom margin wrapping
 *  the WHOLE tree block (distinct from `AtomTree`'s own internal
 *  `CELL_TEXT_MARGIN`, see `class-body-tree.ts`'s module doc comment). */
const TREE_BLOCK_MARGIN = 2;
/** ADR-7: the ONE `src/core/` owner this file's plain/titled divider
 *  branches consume for their Y-axis geometry — see `class-body-enhanced-
 *  geometry.ts`'s own module doc comment. A single shared instance is
 *  safe: both constructor args are fixed constants for this diagram
 *  family, and `deriveHeightOffsets` carries no mutable state across calls. */
const CLASS_BODY_GEOMETRY = new ClassifierBodyGeometry(ELEMENT_DEFAULT_LINE_THICKNESS, BODY_ENHANCED_MARGIN_X);

/** Shared, per-classifier layout inputs -- bundled to stay inside this
 *  project's per-function param-count cap (mirrors `class-member-rows.ts
 *  #SectionRowContext`'s identical rationale). */
export interface EnhancedLayoutCtx {
  readonly fontSpec: { readonly family: string; readonly size: number };
  readonly measurer: StringMeasurer;
  readonly sprites: SpriteRegistry | undefined;
  readonly baselineOffset: number;
  /** The classifier's own `headerRowHeight` -- every emitted `row.y`/
   *  `part.y`/`title.y` below is relative to `geo.y` DIRECTLY (matching
   *  every other `ClassifierGeo.rows[].y` consumer's convention), so this
   *  offset is added to the internal 0-based `cursor` at the point each
   *  coordinate is EMITTED (not to the returned `EnhancedBodyGeo.height`,
   *  which stays body-only -- `class-layout-helpers.ts`'s own `height:
   *  headerRowHeight + enhancedBody.height` sum would otherwise double
   *  count it). */
  readonly bodyTop: number;
}

/** One rendered divider primitive — a plain horizontal line, optionally
 *  carrying a centered title label that splits the line in two (`class-
 *  body-enhanced.ts#BlockSeparatorSpec`'s own doc comment for `char`'s
 *  render-time meaning, resolved by `separatorStrokeWidth` below). */
export interface EnhancedDividerPart {
  readonly kind: 'divider';
  readonly y: number;
  readonly strokeWidth: number;
  /** G2 N44: `UHorizontalLine#getStroke`'s `'.'` case (`new UStroke(1, 2,
   *  1)` -- dashVisible=1, dashSpace=2) -- jar-verified `gojofu-46-xaci340`/
   *  `paroxa-83-lofa387`'s `..` separators (`<line ... stroke-width:1;
   *  stroke-dasharray:1,2;>`). Absent for every other separator char
   *  (`-`/`=`/the synthetic leading `_`), matching upstream's `else` branch
   *  (no dash array emitted at all). */
  readonly strokeDasharray?: string;
  /** G3/O4: `UHorizontalLine#drawHLine`'s `style == '='` branch -- draws
   *  EVERY line segment (the whole span, or each half either side of a
   *  title) TWICE: once at `y`, once at `y+2` (`linazi-45-gevo553`'s
   *  `Foo1` object, `== ` separator between "and group" and "things
   *  together." -- jar's own `<line y=132>`/`<line y=134>` pair, SAME
   *  x1/x2 span). Absent (single line) for every other separator char. */
  readonly doubleLine?: boolean;
  readonly title?: { readonly x: number; readonly y: number; readonly width: number; readonly text: string };
}

export interface EnhancedRowsPart {
  readonly kind: 'rows';
  readonly rows: ClassifierGeo['rows'];
}

export interface EnhancedTreePart {
  readonly kind: 'tree';
  readonly rows: ClassifierGeo['rows'];
  readonly connectors: readonly TreeConnector[];
}

export type EnhancedBodyPart = EnhancedDividerPart | EnhancedRowsPart | EnhancedTreePart;

export interface EnhancedBodyGeo {
  readonly parts: readonly EnhancedBodyPart[];
  /** Member-area width contribution (caller takes `Math.max(headerWidth,
   *  this)`, mirroring the classic path's `memberAreaWidth`). */
  readonly width: number;
  /** Total body height, local to the body's own top (caller adds
   *  `headerRowHeight`, mirroring the classic path's `height` sum). */
  readonly height: number;
}

/** `UHorizontalLine#getStroke`: `'-'`/`'='` -> `UStroke.simple()` (thickness
 *  1); `'.'` -> `new UStroke(1, 2, 1)` (thickness 1, dashed -- G2 N44, see
 *  {@link EnhancedDividerPart.strokeDasharray}'s own doc comment); anything
 *  else (`'_'`, the synthetic block0/trailing-empty sentinel) falls to
 *  `UStroke.withThickness(defaultThickness)` (0.5, `PName.LineThickness`'s
 *  default). `'='`'s OWN double-hline rendering (`UHorizontalLine
 *  #drawHLine`'s `if (style == '=') drawSimpleHline(..., y + 2)`) remains
 *  zero corpus reach in this iteration's newly-reached fixtures -- named,
 *  NOT ported (unchanged from N42's original scoping). */
function separatorStrokeWidth(char: string): number {
  return char === '-' || char === '=' || char === '.' ? 1 : ELEMENT_DEFAULT_LINE_THICKNESS;
}

function separatorStrokeDasharray(char: string): string | undefined {
  return char === '.' ? '1,2' : undefined;
}

/** `UHorizontalLine#isDouble` -- G3/O4, see `EnhancedDividerPart
 *  .doubleLine`'s own doc comment. */
function separatorIsDouble(char: string): boolean {
  return char === '=';
}

/** Shift a block's rows from the origin to their final `contentTop`. Row `y`
 *  is the only absolute field a build carries, so a translate is equivalent to
 *  rebuilding at that top -- and cheaper. */
function translateRows(rows: ClassifierGeo['rows'], contentTop: number): ClassifierGeo['rows'] {
  return contentTop === 0 ? rows : rows.map((r) => ({ ...r, y: r.y + contentTop }));
}

interface RowsBlockResult {
  readonly rows: ClassifierGeo['rows'];
  readonly width: number;
  readonly contentHeight: number;
}

/** Builds one rows-block's member rows (icon-column reservation scanned
 *  over the WHOLE block, mirroring `class-member-rows.ts#sectionWidth`'s
 *  established per-section — here per-block — gating) at a given LOCAL
 *  `contentTop`. */
function buildRowsBlockRows(lines: readonly string[], ctx: EnhancedLayoutCtx, contentTop: number): RowsBlockResult {
  const { fontSpec, measurer, sprites, baselineOffset } = ctx;
  // A2s R2d (pejone-71-tige404/xonamo-50-podo529): a null parse is a blank
  // (or blank-equivalent) line, and upstream's enhanced path KEEPS it as one
  // empty row -- `rawBodyWithoutHidden()` wraps every raw line in a Member
  // (BodierLikeClassOrObject.java:191-205), `BodyEnhanced1#getArea` adds
  // each non-separator line to its block's display (BodyEnhanced1.java:
  // 159-166), and `MethodsOrFieldsArea#calculateDimensionOnlyMembers` sums
  // one row height per display line (MethodsOrFieldsArea.java:161-166). The
  // classic-body empties filtering (getFieldsToDisplay/getMethodsToDisplay,
  // java:114-172) never runs on this path. jar-verified: one 14px row per
  // blank, zero width contribution (scratch R2d probes p1/p3).
  const members = lines.map(
    (line): Member => parseMemberLine(line) ?? { visibility: '+', name: '', isStatic: false, isAbstract: false },
  );
  // NOT point-free: `formatMemberText` has an optional 2nd param (A13
  // `keepVisibilityChar`) that `.map`'s index argument would silently fill.
  const texts = members.map((m) => formatMemberText(m));
  const builds: MemberRowBuild[] = members.map((m, i) => buildMemberRow(texts[i]!, m, fontSpec, measurer, sprites));
  const hasIcon = members.some((m) => m.visibilityExplicit === true);
  const indent = hasIcon ? ROW_INDENT_WITH_ICON : ROW_TEXT_LEFT_MARGIN;
  // A2s R2i follow-up (rotisi-30-loge424 Toto): per-row heights come from
  // the atom-aware `MemberRowBuild.height` (sprite/img/emoji rows are taller
  // than the font size), summed row-by-row exactly like the classic path --
  // `MethodsOrFieldsArea#calculateDimensionOnlyMembers` sums per-member
  // TextBlock heights (@see MethodsOrFieldsArea.java:161-166); a plain text
  // row's build height equals the font size, so text-only bodies are
  // byte-identical to the previous flat `fontSpec.size` stepping.
  let rowTop = contentTop;
  const rows: ClassifierGeo['rows'] = members.map((m, i) => {
    const y = rowTop + baselineOffset;
    rowTop += builds[i]!.height;
    return {
      text: texts[i]!,
      y,
      indent,
      width: builds[i]!.width,
      atoms: builds[i]!.atoms,
      ...(m.visibilityExplicit === true
        ? { visibilityIcon: m.visibility, visibilityIsField: m.params === undefined }
        : {}),
      ...(m.ownUrl !== undefined ? { url: m.ownUrl } : {}),
    };
  });
  return { rows, width: sectionWidth(builds, hasIcon), contentHeight: rowTop - contentTop };
}

/**
 * `TextBlockLineBefore#calculateDimension`'s `dim.atLeast(dimTitle.width +
 * 8, ...)` floor — a titled separator's OWN label can widen the block past
 * its member content. Unverified against a jar sample where this floor
 * actually binds (see this file's own module doc comment); implemented
 * per the literal upstream formula rather than left out, since it is
 * directly part of the ported `decorate()` algorithm, not a speculative
 * extension.
 */
function rowsBlockWidth(memberAreaWidth: number, titleWidth: number | undefined): number {
  return titleWidth === undefined ? memberAreaWidth : Math.max(memberAreaWidth, titleWidth + 8);
}

interface BlockLayoutResult {
  readonly cursor: number;
  readonly width: number;
}

/** `decorate()`'s `separator === 0` branch: `withMargin(block, marginX, 0)`
 *  -- zero vertical margin, no divider drawn. */
function layoutUndividedRows(
  lines: readonly string[],
  ctx: EnhancedLayoutCtx,
  cursor: number,
  parts: EnhancedBodyPart[],
): BlockLayoutResult {
  const { rows, width, contentHeight } = buildRowsBlockRows(lines, ctx, cursor);
  parts.push({ kind: 'rows', rows });
  return { cursor: cursor + contentHeight, width };
}

/** `decorate()`'s no-title branch — divider/content Y offsets and the
 *  advanced cursor come from `CLASS_BODY_GEOMETRY` (ADR-7: the ONE
 *  `src/core/` owner of this arithmetic; see `class-body-enhanced-
 *  geometry.ts`'s own module doc comment), not a local re-derivation. */
function layoutPlainDividerRows(
  lines: readonly string[],
  char: string,
  ctx: EnhancedLayoutCtx,
  cursor: number,
): { rows: EnhancedBodyPart[]; result: BlockLayoutResult } {
  // A2s R2d: EVERY line in a rows-block is one row now (blanks included --
  // see buildRowsBlockRows), so the row count is simply `lines.length`; the
  // former `memberLineCount` null-parse filter would undercount blank rows.
  // A2s (rotisi-30-loge424): the block's content height is the SUM OF ITS
  // ROWS' OWN heights, not `lines.length * fontSize`. A sprite row is as tall
  // as its scaled sprite (`MethodsOrFieldsArea#calculateDimensionOnlyMembers`
  // sums per-member TextBlock heights, java:161-166) -- 15px at `fontSize/13`
  // is 16.154, and the 2x2 `$point` sprite is 2.154, so a flat 14 was wrong in
  // BOTH directions. `class-member-rows.ts` got this in R2i; the enhanced path
  // kept the flat stepping and its errors happened to nearly cancel, leaving
  // the 1.0769px net that made the residual look like a single scale bug.
  //
  // Built at the origin first because `deriveHeightOffsets` needs the height
  // to place `contentTop`, while the height itself does not depend on it; the
  // rows are then translated rather than rebuilt.
  const probe = buildRowsBlockRows(lines, ctx, 0);
  const offsets = CLASS_BODY_GEOMETRY.deriveHeightOffsets(probe.contentHeight, char);
  const dividerY = cursor + offsets.dividerY;
  const contentTop = cursor + offsets.contentTop;
  const rows = translateRows(probe.rows, contentTop);
  const width = probe.width;
  const dasharrayField = separatorStrokeDasharray(char);
  const partsOut: EnhancedBodyPart[] = [
    {
      kind: 'divider', y: dividerY, strokeWidth: separatorStrokeWidth(char),
      ...(dasharrayField !== undefined ? { strokeDasharray: dasharrayField } : {}),
      ...(separatorIsDouble(char) ? { doubleLine: true as const } : {}),
    },
    { kind: 'rows', rows },
  ];
  return {
    rows: partsOut,
    result: { cursor: cursor + offsets.totalHeight, width: rowsBlockWidth(width, undefined) },
  };
}

/** `decorate()`'s title branch: content draws FIRST (at local top =
 *  `dimTitleHeight`, both the outer AND inner top margins stacking to
 *  exactly one title-height), THEN the divider+label AFTER (jar-verified
 *  DOM order — see this file's own module doc comment). Y offsets and the
 *  advanced cursor come from `CLASS_BODY_GEOMETRY` (ADR-7), not a local
 *  re-derivation — only the title's own baseline (`UHorizontalLine
 *  #drawTitleInternal`'s formula, a DIFFERENT, already-ported class outside
 *  this task's write-set) is applied analytically, per `class-body-
 *  enhanced-geometry.ts#ClassifierBodyGeometry`'s own doc comment. */
function layoutTitledDividerRows(
  lines: readonly string[],
  separator: BlockSeparatorSpec,
  ctx: EnhancedLayoutCtx,
  cursor: number,
): { rows: EnhancedBodyPart[]; result: BlockLayoutResult } {
  const { fontSpec, measurer, sprites, baselineOffset } = ctx;
  const titleBuild = buildMemberRow(separator.title!, {}, fontSpec, measurer, sprites);
  const dimTitleHeight = fontSpec.size; // a title is always a single creole line
  // Row-height sum, not `lines.length * fontSize` -- see layoutPlainDividerRows.
  const probe = buildRowsBlockRows(lines, ctx, 0);
  const offsets = CLASS_BODY_GEOMETRY.deriveHeightOffsets(probe.contentHeight, separator.char, dimTitleHeight);
  const contentTop = cursor + offsets.contentTop;
  const rows = translateRows(probe.rows, contentTop);
  const width = probe.width;
  const dividerY = cursor + offsets.dividerY;
  const titleBaselineY = dividerY - dimTitleHeight / 2 - 0.5 + baselineOffset;
  const titledDasharrayField = separatorStrokeDasharray(separator.char);
  const partsOut: EnhancedBodyPart[] = [
    { kind: 'rows', rows },
    {
      kind: 'divider',
      y: dividerY,
      strokeWidth: separatorStrokeWidth(separator.char),
      ...(titledDasharrayField !== undefined ? { strokeDasharray: titledDasharrayField } : {}),
      ...(separatorIsDouble(separator.char) ? { doubleLine: true as const } : {}),
      title: { x: 0, y: titleBaselineY, width: titleBuild.width, text: separator.title! },
    },
  ];
  return {
    rows: partsOut,
    result: { cursor: cursor + offsets.totalHeight, width: rowsBlockWidth(width, titleBuild.width) },
  };
}

/** One rows-block (`EnhancedBodyBlock` with `kind: 'rows'`) — dispatches to
 *  one of `decorate()`'s three branches (undivided / plain divider /
 *  titled divider), pushing its part(s) and returning the advanced
 *  cursor. Height formulas are jar-verified byte-exact — see this file's
 *  own module doc comment. */
function layoutRowsBlock(
  lines: readonly string[],
  separator: BlockSeparatorSpec | undefined,
  ctx: EnhancedLayoutCtx,
  cursor: number,
  parts: EnhancedBodyPart[],
): BlockLayoutResult {
  if (separator === undefined) return layoutUndividedRows(lines, ctx, cursor, parts);
  if (separator.title === undefined) {
    const { rows, result } = layoutPlainDividerRows(lines, separator.char, ctx, cursor);
    parts.push(...rows);
    return result;
  }
  const { rows, result } = layoutTitledDividerRows(lines, separator, ctx, cursor);
  parts.push(...rows);
  return result;
}

/** One tree-block (`EnhancedBodyBlock` with `kind: 'tree'`) — the
 *  `AtomTree`/`Skeleton2` geometry (`class-body-tree.ts`), offset by
 *  `TREE_BLOCK_MARGIN` (`AtomWithMargin(tree, 2, 2)`'s top half) and
 *  `cursor`. Text `indent` is `level*8 + 10` (`xEndForLevel(level) +
 *  CELL_TEXT_MARGIN`, `class-body-tree.ts`'s own formula), baked per-row
 *  since level varies cell to cell. */
function layoutTreeBlock(
  block: Extract<EnhancedBodyBlock, { kind: 'tree' }>,
  ctx: EnhancedLayoutCtx,
  cursor: number,
  parts: EnhancedBodyPart[],
): BlockLayoutResult {
  const { fontSpec, measurer, sprites, baselineOffset } = ctx;
  const tree = measureTreeCells(block.cells, fontSpec, measurer, sprites);
  const contentTop = cursor + TREE_BLOCK_MARGIN;
  const rows: ClassifierGeo['rows'] = tree.rows.map((r) => ({
    text: r.build.atoms.length === 1 && r.build.atoms[0]!.kind === 'text' ? r.build.atoms[0]!.text : '',
    y: contentTop + r.localTop + baselineOffset,
    indent: r.level * 8 + 10,
    width: r.build.width,
    atoms: r.build.atoms,
  }));
  const connectors = computeTreeConnectors(tree.rows).map((c) => ({
    bulletX: c.bulletX,
    bulletY: contentTop + c.bulletY,
    hx1: c.hx1,
    hx2: c.hx2,
    hy: contentTop + c.hy,
    vx: c.vx,
    vy1: contentTop + c.vy1,
    vy2: contentTop + c.vy2,
  }));
  parts.push({ kind: 'tree', rows, connectors });
  return { cursor: contentTop + tree.height + TREE_BLOCK_MARGIN, width: tree.width };
}

/**
 * Assembles the full enhanced-body geometry for a classifier's raw member
 * lines. Mirrors `measureGenericClassifier`'s classic-path signature
 * closely enough that `class-layout-helpers.ts` can branch cleanly between
 * the two.
 */
export function measureEnhancedBody(rawLines: readonly string[], ctx: EnhancedLayoutCtx): EnhancedBodyGeo {
  const blocks = splitEnhancedBlocks(rawLines);
  const parts: EnhancedBodyPart[] = [];
  // `cursor` starts at `ctx.bodyTop` (`headerRowHeight`) so every emitted
  // row/divider/title y IS `geo.y`-relative directly -- see `EnhancedLayoutCtx
  // .bodyTop`'s own doc comment for why the returned `height` below
  // subtracts it back out.
  let cursor = ctx.bodyTop;
  let width = 0;
  for (const block of blocks) {
    const result =
      block.kind === 'tree'
        ? layoutTreeBlock(block, ctx, cursor, parts)
        : layoutRowsBlock(block.lines, block.separator, ctx, cursor, parts);
    cursor = result.cursor;
    width = Math.max(width, result.width);
  }
  return { parts, width, height: cursor - ctx.bodyTop };
}
