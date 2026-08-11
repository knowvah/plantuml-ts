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
import { titleDimension, measureStereo, headerRows, baselineOffsetFor } from './class-object-map-sizing.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import { buildMemberAtoms, memberBaseFont, resolveMemberAtoms } from './class-member-creole.js';
import { floorAtMinimumWidth } from './class-object-map-sizing.js';

interface Dim {
  width: number;
  height: number;
}

/** EntityImageJson: `withMargin(name, 2, 2)` — same numeric value as
 *  MAP_NAME_MARGIN, independently defined (see file doc). */
const JSON_NAME_MARGIN = 2;
/** TextBlockCucaJSon#getTextBlock: `withMargin(result, 5, 2)` — applied to
 *  BOTH a key and a scalar value cell. */
const JSON_CELL_MARGIN_X = 5;
const JSON_CELL_MARGIN_Y = 2;
/** EntityImageJson.xMarginCircle. */
const JSON_X_MARGIN_CIRCLE = 5;
/** BodierLikeClassOrObject#marginEmptyFieldsOrMethod, substituted by
 *  `getMethodOrFieldHeight` when the entries area is empty — UNLIKE `map`,
 *  this DOES fire for `json` (leafType JSON is not excluded, only MAP is). */
const JSON_EMPTY_HEIGHT_FALLBACK = 13;

/** `json Name {}` with no body, or a body that failed to parse (ast.ts's
 *  `Classifier.jsonValue` doc) — measured as an empty object, the closest
 *  stand-in for "no data" that still exercises the real empty-entries path. */
const EMPTY_OBJECT_NODE: JsonNode = { kind: 'object', entries: [] };

// ---------------------------------------------------------------------------
// Recursive dimension measurement (TextBlockCucaJSon#calculateDimension)
// ---------------------------------------------------------------------------

type JsonDimNode =
  | {
      kind: 'scalar';
      text: string;
      width: number;
      height: number;
      rawWidth: number;
      atoms: readonly MemberRenderAtom[];
    }
  | { kind: 'array'; items: JsonDimNode[]; width: number; height: number }
  | {
      kind: 'object';
      members: {
        key: string;
        keyDim: Dim;
        keyRawWidth: number;
        keyAtoms: readonly MemberRenderAtom[];
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
function measureJsonCell(
  text: string,
  font: FontConfiguration,
  measurer: StringMeasurer,
): { dim: Dim; rawWidth: number; atoms: readonly MemberRenderAtom[] } {
  const build = resolveMemberAtoms(buildMemberAtoms(text, font), font, measurer);
  return {
    dim: { width: build.width + JSON_CELL_MARGIN_X * 2, height: build.height + JSON_CELL_MARGIN_Y * 2 },
    rawWidth: build.width,
    atoms: build.atoms,
  };
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

function measureScalarNode(
  node: JsonNode & { kind: 'scalar' },
  font: FontConfiguration,
  measurer: StringMeasurer,
): JsonDimNode {
  const cell = measureJsonCell(scalarText(node), font, measurer);
  return {
    kind: 'scalar',
    text: cellText(cell.atoms, scalarText(node)),
    width: cell.dim.width,
    height: cell.dim.height,
    rawWidth: cell.rawWidth,
    atoms: cell.atoms,
  };
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
function measureArrayNode(
  node: JsonNode & { kind: 'array' },
  font: FontConfiguration,
  measurer: StringMeasurer,
): JsonDimNode {
  const items = node.items.map((i) => measureJsonNode(i, font, measurer));
  const width = items.length === 0 ? 0 : Math.max(...items.map((i) => i.width));
  const height = items.reduce((sum, i) => sum + i.height, 0);
  return { kind: 'array', items, width, height };
}

/** `TextBlockJson#calculateDimensionSlow`: width = width1 (max key cell
 *  width) + width2 (max value cell/sub-table width); height = sum of
 *  per-member `max(keyDim.height, valueDim.height)`. */
function measureObjectNode(
  node: JsonNode & { kind: 'object' },
  font: FontConfiguration,
  measurer: StringMeasurer,
): JsonDimNode {
  const members = node.entries.map((e) => {
    const key = measureJsonCell(e.key, font, measurer);
    return {
      key: cellText(key.atoms, e.key),
      keyDim: key.dim,
      keyRawWidth: key.rawWidth,
      keyAtoms: key.atoms,
      value: measureJsonNode(e.value, font, measurer),
    };
  });
  const width1 = members.length === 0 ? 0 : Math.max(...members.map((m) => m.keyDim.width));
  const width2 = members.length === 0 ? 0 : Math.max(...members.map((m) => m.value.width));
  const height = members.reduce((sum, m) => sum + Math.max(m.keyDim.height, m.value.height), 0);
  return { kind: 'object', members, width1, width2, width: width1 + width2, height };
}

function measureJsonNode(node: JsonNode, font: FontConfiguration, measurer: StringMeasurer): JsonDimNode {
  if (node.kind === 'scalar') return measureScalarNode(node, font, measurer);
  if (node.kind === 'array') return measureArrayNode(node, font, measurer);
  return measureObjectNode(node, font, measurer);
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
  return [{
    kind: 'text',
    row: {
      text: node.text,
      y: cur.y + JSON_CELL_MARGIN_Y + cur.baselineOffset,
      indent: cur.x + JSON_CELL_MARGIN_X,
      width: node.rawWidth,
      atoms: node.atoms,
    },
  }];
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
  const out: JsonBodyItem[] = [
    { kind: 'vline', x: cur.x + node.width1, y: cur.y, height: node.height },
  ];
  let curY = cur.y;
  for (const m of node.members) {
    out.push({ kind: 'hline', x: cur.x, y: curY, width: cur.totalWidth });
    out.push({
      kind: 'text',
      row: {
        text: m.key,
        y: curY + JSON_CELL_MARGIN_Y + cur.baselineOffset,
        indent: cur.x + JSON_CELL_MARGIN_X,
        width: m.keyRawWidth,
        atoms: m.keyAtoms,
      },
    });
    out.push(...buildJsonItems(m.value, {
      ...cur,
      x: cur.x + node.width1,
      y: curY,
      totalWidth: cur.totalWidth - node.width1,
    }));
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
  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  const nameM = measurer.measure(classifier.display, fontSpec);
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
  const cellFont = memberBaseFont(fontSpec, {});
  const dimNode = measureJsonNode(classifier.jsonValue ?? EMPTY_OBJECT_NODE, cellFont, measurer);
  const fieldsHeight = dimNode.height === 0 ? JSON_EMPTY_HEIGHT_FALLBACK : dimNode.height;

  // B25/M27: `EntityImageJson.java:127-132` clamps here, identically to
  // object/map/class -- see `floorAtMinimumWidth`'s own doc comment.
  const width = floorAtMinimumWidth(
    Math.max(dimNode.width, title.width + JSON_X_MARGIN_CIRCLE * 2), theme, 'json');
  const height = title.height + fieldsHeight;

  const headerGeo = headerRows(classifier, theme, measurer, { boxWidth: width, namePadding: JSON_NAME_MARGIN });
  const baselineOffset = baselineOffsetFor(fontSpec, measurer);
  // `EntityImageJson#drawU` seeds the ROOT block's own `jsonTotalWidth` with
  // the finished box width (`setTotalWidth(dimTotal.getWidth())`,
  // `svek/image/EntityImageJson.java:207`), then draws the entries area
  // translated down by the title height (`:208`).
  const jsonBody = buildJsonItems(dimNode, {
    x: 0, y: title.height, totalWidth: width, baselineOffset,
  });
  const entryRows = jsonBody.flatMap((i) => (i.kind === 'text' ? [i.row] : []));
  const dividerYs = jsonBody.flatMap((i) => (i.kind === 'hline' ? [i.y] : []));

  return { width, height, rows: [...headerGeo, ...entryRows], dividerYs, jsonBody };
}
