/**
 * JSON diagram pre-layout: value display formatting, container tree
 * flattening, highlight-map construction, and string wrapping. Split out of
 * `layout.ts` (line cap). One-way dependency: the layout entry consumes these.
 */

import type { HighlightDirective } from './ast.js';
import type { JsonObject } from './JsonObject.js';
import { JsonNumber } from './JsonNumber.js';
import type {} from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';

export type ValueType = 'string' | 'number' | 'boolean' | 'null' | 'nested';

export interface DisplayValue {
  display: string;
  valueType: ValueType;
}

export function getDisplayValue(v: unknown): DisplayValue {
  if (v === null) {
    return { display: '␀', valueType: 'null' };
  }
  if (typeof v === 'boolean') {
    return {
      display: v ? '☑ true' : '☐ false',
      valueType: 'boolean',
    };
  }
  if (typeof v === 'number' || v instanceof JsonNumber) {
    // `getShortString` draws `JsonNumber#toString`, the literal text
    // (`JsonNumber.java:41-44`); `String(v)` of a `number` IS its literal
    // (`JsonParser.ts#numberValue`).
    return { display: String(v), valueType: 'number' };
  }
  if (typeof v === 'string') {
    return { display: v, valueType: 'string' };
  }
  // Object or array — the child node carries the content, but the cell is NOT
  // empty: `getShortString` falls through to `return "   ";`
  // (`TextBlockJson.java:194`), three literal spaces. They are drawn, and they
  // are measured — `getWidthColB` folds them in like any other cell, so a
  // nested row can be the widest in column B. This port returned `''`, which
  // both skipped the `<text>` element the jar emits and under-measured the
  // column by that string's width.
  //
  // On emission those spaces become NBSP: `core/svg-shapes.ts#text` carries
  // upstream's whitespace-only substitution rule.
  return { display: '   ', valueType: 'nested' };
}

// ---------------------------------------------------------------------------
// Tree walking
// ---------------------------------------------------------------------------

export type JsonContainer = JsonObject | unknown[];

export interface FlatNode {
  id: string;
  value: JsonContainer;
  parentId: string | null;
  parentKey: string | null;
}

/** Extract [key, value] entries from an object or array. */
export function containerEntries(v: JsonContainer): Array<[string, unknown]> {
  if (Array.isArray(v)) {
    return v.map((item, i) => [String(i), item]);
  }
  return v.members();
}

/**
 * Walk the JSON tree in DFS order, assigning each nested object/array a
 * unique id ("n0", "n1", ...). Returns a flat list of nodes in DFS order.
 */
export function walkTree(root: JsonContainer): FlatNode[] {
  const result: FlatNode[] = [];
  let counter = 0;

  const stack: FlatNode[] = [{ id: `n${counter++}`, value: root, parentId: null, parentKey: null }];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);

    const entries = containerEntries(current.value);

    // Push children in reverse order so they come off the stack in original order
    for (let i = entries.length - 1; i >= 0; i--) {
      const [k, v] = entries[i]!;
      if (v !== null && typeof v === 'object' && !(v instanceof JsonNumber)) {
        stack.push({
          id: `n${counter++}`,
          value: v as JsonContainer,
          parentId: current.id,
          parentKey: k,
        });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Per-node highlight map
// ---------------------------------------------------------------------------

export const EMPTY_MAP: ReadonlyMap<string, string> = new Map();

/**
 * One `#highlight` path still to be matched below the current node.
 *
 * @see net/sourceforge/plantuml/yaml/Highlighted.java (class, `:44-103`)
 */
export class Highlighted {
  constructor(
    readonly paths: readonly string[],
    readonly styleClass: string,
  ) {}

  /**
   * The list handed to a child reached through `key`, or `null` when this
   * highlight does not follow that child. `**` is passed down UNCHANGED (it is
   * never stripped), `*` and an exact key match drop the first segment.
   *
   * @see net/sourceforge/plantuml/yaml/Highlighted.java:86-96
   */
  upOneLevel(key: string): Highlighted | null {
    if (this.paths.length <= 1) return null;
    const first = this.paths[0]!;
    if (first === '**') return new Highlighted(this.paths, this.styleClass);
    if (first === '*' || first === key) {
      return new Highlighted(this.paths.slice(1), this.styleClass);
    }
    return null;
  }

  /**
   * Whether the row `key` of the current node is highlighted: a lone segment
   * equal to the key, or `** / key`.
   *
   * @see net/sourceforge/plantuml/yaml/Highlighted.java:98-102
   */
  isKeyHighlight(key: string): boolean {
    if (this.paths.length === 2 && this.paths[0] === '**' && this.paths[1] === key) return true;
    return this.paths.length === 1 && this.paths[0] === key;
  }
}

/**
 * Every child receives the surviving highlights of its parent.
 *
 * @see net/sourceforge/plantuml/jsondiagram/SmetanaForJson.java:148-156
 */
export function upOneLevel(key: string, list: readonly Highlighted[]): Highlighted[] {
  const result: Highlighted[] = [];
  for (const tmp of list) {
    const parent = tmp.upOneLevel(key);
    if (parent !== null) result.push(parent);
  }
  return result;
}

/**
 * The FIRST highlight in `list` that marks row `key`, else `null`.
 *
 * @see net/sourceforge/plantuml/jsondiagram/TextBlockJson.java:155-161
 */
export function isHighlighted(key: string, list: readonly Highlighted[]): Highlighted | null {
  for (const tmp of list) {
    if (tmp.isKeyHighlight(key)) return tmp;
  }
  return null;
}

/**
 * Builds a map from nodeId → Map<key, styleClass> by passing the highlight
 * list down the tree exactly as the jar does: `SmetanaForJson.manageOneNode`
 * hands `upOneLevel(key)` of the parent's list to EVERY member (so duplicated
 * keys all receive it, `SmetanaForJson.java:136-142`), and each node marks the
 * rows for which `TextBlockJson.isHighlighted` finds a matching highlight
 * (first match wins, `TextBlockJson.java:122,155-161`).
 *
 * `flatNodes` lists parents before children (`walkTree`), so one pass suffices.
 */
export function buildHighlightMap(
  flatNodes: FlatNode[],
  highlights: ReadonlyArray<HighlightDirective>,
): Map<string, Map<string, string>> {
  const lists = new Map<string, Highlighted[]>();
  const result = new Map<string, Map<string, string>>();

  for (const fn of flatNodes) {
    const list =
      fn.parentId === null
        ? highlights.map((d) => new Highlighted(d.path, d.styleClass))
        : upOneLevel(fn.parentKey ?? '', lists.get(fn.parentId) ?? []);
    lists.set(fn.id, list);
    for (const [key] of containerEntries(fn.value)) {
      const found = isHighlighted(key, list);
      if (found === null) continue;
      let map = result.get(fn.id);
      if (map === undefined) {
        map = new Map();
        result.set(fn.id, map);
      }
      map.set(key, found.styleClass);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Word-wrap helper
// ---------------------------------------------------------------------------

/**
 * Wrap a single line of text to fit within `maxWidth` pixels, using greedy
 * line-breaking on space boundaries. Only applied to string-type values.
 *
 * Single words wider than `maxWidth` are kept on their own line rather than
 * broken mid-word.
 */
export function wordWrapLine(
  line: string,
  maxWidth: number,
  measurer: StringMeasurer,
  font: { family: string; size: number },
): string[] {
  const words = line.split(' ');
  if (words.length === 0) return [line];

  const wrapped: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    const w = measurer.measure(candidate, font).width;
    if (w > maxWidth && current.length > 0) {
      wrapped.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) wrapped.push(current);
  return wrapped;
}

// ---------------------------------------------------------------------------
// Row flattening and measurement
// ---------------------------------------------------------------------------

export interface BuildRowsOptions {
  /** `skinparam tabSize` — see `tab-stops.ts`. */
  tabSize?: number;
  maximumWidth?: number;
  fontFamily?: string;
  fontBold?: boolean;
  /** When true, measure key text with bold font (matches default renderer behaviour). */
  headerFontBold?: boolean;
}
