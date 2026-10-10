/**
 * `json` classifier sizing — `kind:'json'` leaves in the class diagram layout
 * engine (./layout.ts), mission object-dot-sync Phase L.
 *
 * Faithful port of the dimension math:
 *   @see ~/git/plantuml/.../svek/image/EntityImageJson.java
 *   @see ~/git/plantuml/.../cucadiagram/TextBlockCucaJSon.java
 *   @see ~/git/plantuml/.../cucadiagram/BodierJSon.java
 *
 * The header (name + optional italic stereotype, margin 2,2, stacked) is
 * IDENTICAL to `object`/`map`'s own header formula (EntityImageJson.java's
 * ctor mirrors EntityImageObject/EntityImageMap's line for line) — reused
 * from class-object-map-sizing.ts (`titleDimension`/`measureStereo`/
 * `headerRows`) rather than duplicated a third time.
 *
 * The entries area (`TextBlockCucaJSon`) recurses through the parsed JSON
 * tree: an object member's key AND a scalar value both go through the SAME
 * margin-5,2 text-cell measurement `TextBlockCucaJSon#getTextBlock` uses (the
 * exact same 5,2 margin `TextBlockMap` uses for its own key/value cells —
 * coincidentally equal upstream literals, kept as this file's own named
 * constants rather than imported from class-object-map-sizing.ts, mirroring
 * that file's own MAP_NAME_MARGIN/OBJECT_NAME_PADDING precedent for two
 * independently-defined-but-equal upstream literals); a nested object/array
 * value recurses into its own sub-table instead of a single text cell.
 *
 * G3/O1 (data-row baseline+textLength): unlike `map`, EVERY entry cell here
 * (key AND scalar value, at every nesting depth) is drawn FLUSH-LEFT within
 * its own margin-5,2 box (`getTextBlock`'s `HorizontalAlignment.LEFT`,
 * `TextBlockCucaJSon#getTextBlock`'s own doc comment) — no CENTER-column
 * split like `map`'s key column. Every row's baseline is the SAME "ascent-
 * from-row-top" `rowTop + JSON_CELL_MARGIN_Y + baselineOffset` convention as
 * every other object/map/json row (`class-object-map-sizing.ts#headerRows`
 * / `#measureObjectFields`, `class-map-sizing.ts#buildOneMapRow`) — a
 * nested object/array member's key/first-row aligns to the TOP of its own
 * (possibly much taller) sub-table row, never its vertical center
 * (jar-verified: bepafe-03-teda035's "user" key row and its nested "age"
 * key/value share the exact same y, despite "user"'s row spanning the
 * height of TWO nested members). Every row also carries its OWN raw text
 * width for `textLength` (rounded at emission, `core/svg.ts`).
 *
 * M3(c) retired the previous RENDERING SIMPLIFICATION (every row boundary
 * emitted as a full-width `dividerYs` entry, every vertical divider dropped
 * for lack of schema room). {@link buildJsonBody} now walks
 * `TextBlockCucaJSon#drawU`'s own recursion and emits an ORDERED
 * {@link JsonBodyItem} list — `vline` first per object, then per member an
 * `hline` scoped to THAT table's `jsonTotalWidth`, the key text, and the
 * value subtree — which `renderer-classifier-box.ts` draws verbatim (the
 * same "this body owns its own draw order" dispatch `enhancedBody` already
 * uses, not the Y-sort merge: upstream's order is a pre-order traversal, so
 * a nested table's vline lands BETWEEN its parent's key text and its own
 * first hline, which no Y-sort can produce). `dividerYs` is still populated
 * (`dividerYs[0]` = the title height, which the header-background split and
 * the ink box both read) but is no longer what draws the lines.
 */

import type { Classifier, JsonNode } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { JsonBodyItem } from './layout.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import {
  headerFontSpec,
  resolveHeaderFontOverride,
  resolveObjectBodyFont,
  type ObjectKindFont,
} from './object-kind-style.js';
import { resolveStyleStereotypeTags } from './class-stereotype.js';
import { titleDimension, measureStereo, headerRows, baselineOffsetFor } from './class-object-map-sizing.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import { buildMemberAtoms, memberBaseFont, resolveMemberAtoms, resolveOneAtom } from './class-member-creole.js';
import { floorAtMinimumWidth } from './class-object-map-sizing.js';
import { getSplitted } from '../../core/klimt/creole/Fission.js';
import { resolveElementMaximumWidth } from '../../core/theme-element-resolve.js';
import {
  JSON_CELL_MARGIN_X,
  JSON_CELL_MARGIN_Y,
  JSON_EMPTY_HEIGHT_FALLBACK,
  JSON_NAME_MARGIN,
  JSON_X_MARGIN_CIRCLE,
} from '../../core/svek/image/EntityImageJson.js';

interface Dim {
  width: number;
  height: number;
}

/** `json Name {}` with no body, or a body that failed to parse (ast.ts's
 *  `Classifier.jsonValue` doc) — measured as an empty object, the closest
 *  stand-in for "no data" that still exercises the real empty-entries path. */
const EMPTY_OBJECT_NODE: JsonNode = { kind: 'object', entries: [] };

// ---------------------------------------------------------------------------
// Recursive dimension measurement (TextBlockCucaJSon#calculateDimension)
// ---------------------------------------------------------------------------

/** One drawn line of a cell -- a `Fission` stripe (`Fission.java:62-94`)
 *  when `MaximumWidth` wraps, else the cell's single line. */
interface JsonCellLine {
  text: string;
  rawWidth: number;
  height: number;
  atoms: readonly MemberRenderAtom[];
}

/** What every cell build needs: the cell `FontConfiguration`, the measurer
 *  and the `wordWrap` width (`TextBlockCucaJSon.java:66`, `BodierJSon.java:85`
 *  `style.wrapWidth()`; 0 = no wrap). Bundled to stay under the 5-param cap. */
interface JsonCellContext {
  font: FontConfiguration;
  measurer: StringMeasurer;
  maxWidth: number;
}

type JsonDimNode =
  | {
      kind: 'scalar';
      width: number;
      height: number;
      lines: JsonCellLine[];
    }
  | { kind: 'array'; items: JsonDimNode[]; width: number; height: number }
  | {
      kind: 'object';
      members: {
        keyDim: Dim;
        keyLines: JsonCellLine[];
        value: JsonDimNode;
      }[];
      width1: number;
      width2: number;
      width: number;
      height: number;
    };

/**
 * `getTextBlock`'s shared margin-5,2 cell build — used for both a member's
 * key AND a scalar value (`TextBlockCucaJSon#getTextBlock` /
 * `#getTextBlockValue`'s scalar branch, `TextBlockCucaJSon.java:184-190`
 * and `:89-91`).
 *
 * M3(a): the cell is a `CreoleMode.FULL` line upstream, byte-identical to
 * `TextBlockMap#getTextBlock` (`class-map-sizing.ts#measureMapCell` cites
 * the same call), so `__…__`/`<font:…>` markup styles rather than measuring
 * as literal text. Markup-free text is measurement-identical to the
 * previous bare `measurer.measure` — see `class-member-creole.ts`'s own
 * "measurement-identity guarantee" module note.
 */
function measureJsonCell(text: string, ctx: JsonCellContext): { dim: Dim; lines: JsonCellLine[] } {
  const { font, measurer } = ctx;
  const lines = splitJsonCell(buildMemberAtoms(text, font), ctx).map((atoms) => {
    const build = resolveMemberAtoms(atoms, font, measurer);
    return { text: cellText(build.atoms, text), rawWidth: build.width, height: build.height, atoms: build.atoms };
  });
  const width = Math.max(...lines.map((l) => l.rawWidth));
  const height = lines.reduce((sum, l) => sum + l.height, 0);
  return {
    dim: { width: width + JSON_CELL_MARGIN_X * 2, height: height + JSON_CELL_MARGIN_Y * 2 },
    lines,
  };
}

/**
 * cdd6 T3g: `Display#create0(..., wordWrap, ...)` (`TextBlockCucaJSon.java
 * :184-190`) runs each stripe through `Fission#getSplitted`
 * (`Fission.java:62-94`) -- a no-op for `getMaxWidth() == 0`, otherwise a
 * neutron-level split even when the line fits (jar `nadedo-37-nesa665`
 * draws `a`, ` `, `min.`, ` `, `test` as five texts). The width callback is
 * the same per-atom measure `buildWrappedMemberRows` hands to Fission.
 */
function splitJsonCell(
  atoms: ReturnType<typeof buildMemberAtoms>,
  ctx: JsonCellContext,
): readonly ReturnType<typeof buildMemberAtoms>[] {
  if (ctx.maxWidth === 0) return [atoms];
  return getSplitted(
    atoms,
    ctx.maxWidth,
    (a) => resolveOneAtom(a, ctx.font, ctx.measurer, undefined, undefined)?.width ?? 0,
  );
}

/** `getTextBlockValue`'s scalar display text: a JSON string shows unquoted
 *  (`value.asString()`); every other scalar shows its literal form
 *  (`value.toString()`). */
function scalarText(node: { kind: 'scalar'; value: string | number | boolean | null }): string {
  const v = node.value;
  if (v === null) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return v;
}

function measureScalarNode(node: JsonNode & { kind: 'scalar' }, ctx: JsonCellContext): JsonDimNode {
  const cell = measureJsonCell(scalarText(node), ctx);
  return { kind: 'scalar', width: cell.dim.width, height: cell.dim.height, lines: cell.lines };
}

/** The DRAWN label of a built cell — the creole-stripped run text, falling
 *  back to the source string for a cell whose atoms carry no text at all
 *  (an image-only cell). */
function cellText(atoms: readonly MemberRenderAtom[], fallback: string): string {
  const joined = atoms.map((a) => (a.kind === 'text' ? a.text : '')).join('');
  return joined === '' ? fallback : joined;
}

/** `TextBlockArray#calculateDimensionSlow`: `mergeTB` per element — width =
 *  max, height = sum (stacked top-to-bottom, no column split). */
function measureArrayNode(node: JsonNode & { kind: 'array' }, ctx: JsonCellContext): JsonDimNode {
  const items = node.items.map((i) => measureJsonNode(i, ctx));
  const width = items.length === 0 ? 0 : Math.max(...items.map((i) => i.width));
  const height = items.reduce((sum, i) => sum + i.height, 0);
  return { kind: 'array', items, width, height };
}

/** `TextBlockJson#calculateDimensionSlow`: width = width1 (max key cell
 *  width) + width2 (max value cell/sub-table width); height = sum of
 *  per-member `max(keyDim.height, valueDim.height)`. */
function measureObjectNode(node: JsonNode & { kind: 'object' }, ctx: JsonCellContext): JsonDimNode {
  const members = node.entries.map((e) => {
    const key = measureJsonCell(e.key, ctx);
    return { keyDim: key.dim, keyLines: key.lines, value: measureJsonNode(e.value, ctx) };
  });
  const width1 = members.length === 0 ? 0 : Math.max(...members.map((m) => m.keyDim.width));
  const width2 = members.length === 0 ? 0 : Math.max(...members.map((m) => m.value.width));
  const height = members.reduce((sum, m) => sum + Math.max(m.keyDim.height, m.value.height), 0);
  return { kind: 'object', members, width1, width2, width: width1 + width2, height };
}

function measureJsonNode(node: JsonNode, ctx: JsonCellContext): JsonDimNode {
  if (node.kind === 'scalar') return measureScalarNode(node, ctx);
  if (node.kind === 'array') return measureArrayNode(node, ctx);
  return measureObjectNode(node, ctx);
}

// ---------------------------------------------------------------------------
// Recursive row/divider geometry (TextBlockCucaJSon#drawU)
// ---------------------------------------------------------------------------

/** The traversal cursor every `drawU` mirror below shares — bundled (rather
 *  than 4 positional numbers) to stay under this repo's 5-parameter cap.
 *  `totalWidth` is upstream's `jsonTotalWidth`/`arrayTotalWidth`: a
 *  DRAW-time-only value (no `calculateDimensionSlow` reads it) that sets
 *  how far this table's own hlines run, handed down as
 *  `this.jsonTotalWidth - width1` at `TextBlockCucaJSon.java:171`. */
interface JsonDrawCursor {
  x: number;
  y: number;
  totalWidth: number;
  baselineOffset: number;
}

/** G3/O1: `rowTop + JSON_CELL_MARGIN_Y + baselineOffset` — the SAME
 *  "ascent-from-row-top" baseline every other object/map/json row uses (see
 *  file doc); every cell also carries its OWN `rawWidth` for `textLength`,
 *  never a shared column width. */
function buildScalarItems(node: JsonDimNode & { kind: 'scalar' }, cur: JsonDrawCursor): JsonBodyItem[] {
  return buildCellItems(node.lines, cur);
}

/** One text row per cell line, each line stacked under the previous one by
 *  its own height (the `Sheet`'s stripes, `TextBlockCucaJSon.java:184-190`);
 *  a single-line cell yields exactly the pre-T3g row. */
function buildCellItems(lines: readonly JsonCellLine[], cur: JsonDrawCursor): JsonBodyItem[] {
  let lineTop = cur.y;
  return lines.map((line) => {
    const item: JsonBodyItem = {
      kind: 'text',
      row: {
        text: line.text,
        y: lineTop + JSON_CELL_MARGIN_Y + cur.baselineOffset,
        indent: cur.x + JSON_CELL_MARGIN_X,
        width: line.rawWidth,
        atoms: line.atoms,
      },
    };
    lineTop += line.height;
    return item;
  });
}

/** `TextBlockArray#drawU` (`TextBlockCucaJSon.java:213-224`): an hline
 *  BETWEEN elements only (`if (nb > 0)`) — the first element has no leading
 *  boundary of its own — each spanning this array's own `arrayTotalWidth`.
 *  No vline: an array has no key column. */
function buildArrayItems(node: JsonDimNode & { kind: 'array' }, cur: JsonDrawCursor): JsonBodyItem[] {
  const out: JsonBodyItem[] = [];
  let curY = cur.y;
  node.items.forEach((item, i) => {
    if (i > 0) out.push({ kind: 'hline', x: cur.x, y: curY, width: cur.totalWidth });
    out.push(...buildJsonItems(item, { ...cur, y: curY }));
    curY += item.height;
  });
  return out;
}

/**
 * `TextBlockJson#drawU` (`TextBlockCucaJSon.java:162-180`), in ITS order:
 * ONE `ULine.vline(height)` at `dx = width1` for the whole object first,
 * then, per member, `hline(jsonTotalWidth)` -> key -> value subtree. The
 * key row's baseline uses the SAME `rowTop + JSON_CELL_MARGIN_Y +
 * baselineOffset` formula regardless of `rowHeight` -- for a nested
 * object/array VALUE, `rowHeight` can far exceed one text line, so the key
 * aligns to the row's TOP, not its center (G3/O1, jar-verified against
 * bepafe-03-teda035's "user").
 */
function buildObjectItems(node: JsonDimNode & { kind: 'object' }, cur: JsonDrawCursor): JsonBodyItem[] {
  const out: JsonBodyItem[] = [{ kind: 'vline', x: cur.x + node.width1, y: cur.y, height: node.height }];
  let curY = cur.y;
  for (const m of node.members) {
    out.push({ kind: 'hline', x: cur.x, y: curY, width: cur.totalWidth });
    out.push(...buildCellItems(m.keyLines, { ...cur, y: curY }));
    out.push(
      ...buildJsonItems(m.value, {
        ...cur,
        x: cur.x + node.width1,
        y: curY,
        totalWidth: cur.totalWidth - node.width1,
      }),
    );
    curY += Math.max(m.keyDim.height, m.value.height);
  }
  return out;
}

function buildJsonItems(node: JsonDimNode, cur: JsonDrawCursor): JsonBodyItem[] {
  if (node.kind === 'scalar') return buildScalarItems(node, cur);
  if (node.kind === 'array') return buildArrayItems(node, cur);
  return buildObjectItems(node, cur);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/** The cell context for {@link measureJsonNode}: the base cell font
 *  (`memberBaseFont`, no member modifiers on a json entry) and cdd6 T3g's
 *  wrap width -- `BodierJSon.java:85` passes `style.wrapWidth()`
 *  (`resolveElementMaximumWidth`; absent = 0 = no wrap). */
function jsonCellContext(theme: Theme, bodyFont: ObjectKindFont, measurer: StringMeasurer): JsonCellContext {
  return { font: memberBaseFont(bodyFont, {}), measurer, maxWidth: resolveElementMaximumWidth(theme, 'json') ?? 0 };
}

/**
 * Measure a `json` leaf (EntityImageJson#calculateDimensionSlow). Unlike
 * `object`, there is no `showFields`/suppress parameter — `hide members`/
 * `hide empty members` have no BodierJSon-side effect upstream (matching
 * `map`'s own "showFields is irrelevant" precedent).
 */
export function measureJsonClassifier(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
): MeasuredClassifier {
  const tags = resolveStyleStereotypeTags(classifier);
  const bodyFont = resolveObjectBodyFont(theme, 'json', tags);
  const fontSpec = { family: bodyFont.family, size: bodyFont.size };
  const nameFont = resolveHeaderFontOverride(theme, 'json', tags);
  const nameM = measurer.measure(classifier.display, headerFontSpec(theme, nameFont));
  const nameDim: Dim = {
    width: nameM.width + JSON_NAME_MARGIN * 2,
    height: nameM.height + JSON_NAME_MARGIN * 2,
  };
  const stereoDim = measureStereo(classifier, theme, measurer);
  const title = titleDimension(nameDim, stereoDim);

  // M3(a): every entry cell is a creole line upstream, so the recursion
  // carries the base `FontConfiguration` rather than the bare `FontSpec`
  // the header still uses. A json entry has no `{abstract}`/`{static}`
  // member modifiers, hence the empty member.
  const cellCtx = jsonCellContext(theme, bodyFont, measurer);
  const dimNode = measureJsonNode(classifier.jsonValue ?? EMPTY_OBJECT_NODE, cellCtx);
  const fieldsHeight = dimNode.height === 0 ? JSON_EMPTY_HEIGHT_FALLBACK : dimNode.height;

  // B25/M27: `EntityImageJson.java:127-132` clamps here, identically to
  // object/map/class -- see `floorAtMinimumWidth`'s own doc comment.
  const width = floorAtMinimumWidth(Math.max(dimNode.width, title.width + JSON_X_MARGIN_CIRCLE * 2), theme, 'json');
  const height = title.height + fieldsHeight;

  const headerGeo = headerRows(classifier, theme, measurer, {
    nameFont,
    boxWidth: width,
    namePadding: JSON_NAME_MARGIN,
  });
  const baselineOffset = baselineOffsetFor(fontSpec, measurer);
  // `EntityImageJson#drawU` seeds the ROOT block's own `jsonTotalWidth` with
  // the finished box width (`setTotalWidth(dimTotal.getWidth())`,
  // `svek/image/EntityImageJson.java:207`), then draws the entries area
  // translated down by the title height (`:208`).
  const jsonBody = buildJsonItems(dimNode, {
    x: 0,
    y: title.height,
    totalWidth: width,
    baselineOffset,
  });
  const entryRows = jsonBody.flatMap((i) => (i.kind === 'text' ? [i.row] : []));
  const dividerYs = jsonBody.flatMap((i) => (i.kind === 'hline' ? [i.y] : []));

  // The renderer draws `rows[0..headerRowCount)` as the header and takes the
  // entries from `jsonBody`, so a stacked stereotype row + name row must be
  // counted or the name is never drawn (jar: stereotype row, then name).
  const headerRowCountField = headerGeo.length > 1 ? { headerRowCount: headerGeo.length } : {};
  return { width, height, rows: [...headerGeo, ...entryRows], dividerYs, jsonBody, ...headerRowCountField };
}
