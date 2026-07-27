/**
 * JSON diagram pre-layout: value display formatting, container tree
 * flattening, highlight-map construction, and string wrapping. Split out of
 * `layout.ts` (line cap). One-way dependency: the layout entry consumes these.
 */

import type { HighlightDirective } from './ast.js';
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
  if (typeof v === 'number') {
    return { display: String(v), valueType: 'number' };
  }
  if (typeof v === 'string') {
    return { display: v, valueType: 'string' };
  }
  // object or array — child node handles it
  return { display: '', valueType: 'nested' };
}

// ---------------------------------------------------------------------------
// Tree walking
// ---------------------------------------------------------------------------

export type JsonContainer = Record<string, unknown> | unknown[];

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
  return Object.entries(v);
}

/**
 * Walk the JSON tree in DFS order, assigning each nested object/array a
 * unique id ("n0", "n1", ...). Returns a flat list of nodes in DFS order.
 */
export function walkTree(root: JsonContainer): FlatNode[] {
  const result: FlatNode[] = [];
  let counter = 0;

  const stack: FlatNode[] = [
    { id: `n${counter++}`, value: root, parentId: null, parentKey: null },
  ];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);

    const entries = containerEntries(current.value);

    // Push children in reverse order so they come off the stack in original order
    for (let i = entries.length - 1; i >= 0; i--) {
      const [k, v] = entries[i]!;
      if (v !== null && typeof v === 'object') {
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
 * Builds a map from nodeId → Map<key, styleClass> by following each highlight
 * path through the node tree.
 *
 * A path like ["address", "city"] starts at the root node, navigates to the
 * child whose parentKey is "address", then marks "city" as highlighted in
 * that child node with the given styleClass. Single-segment paths ["lastName"]
 * mark the key in the root node directly.
 *
 * Wildcard segments are supported:
 *   "*"  — matches all direct children of the current node
 *   "**" — matches the current node and all transitive descendants
 */
export function buildHighlightMap(
  flatNodes: FlatNode[],
  highlights: ReadonlyArray<HighlightDirective>,
): Map<string, Map<string, string>> {
  // Build lookup: `${parentId}/${parentKey}` → childNodeId (exact key navigation)
  const childLookup = new Map<string, string>();
  for (const fn of flatNodes) {
    if (fn.parentId !== null) {
      childLookup.set(`${fn.parentId}/${fn.parentKey ?? ''}`, fn.id);
    }
  }

  // Build childrenOf: parentId → childId[] (for * wildcard: all direct children)
  const childrenOf = new Map<string, string[]>();
  for (const fn of flatNodes) {
    if (fn.parentId !== null) {
      let arr = childrenOf.get(fn.parentId);
      if (arr === undefined) { arr = []; childrenOf.set(fn.parentId, arr); }
      arr.push(fn.id);
    }
  }

  // Returns nodeId plus all transitive descendants (for ** wildcard)
  function descendants(nodeId: string): string[] {
    const desc: string[] = [nodeId];
    const queue = [nodeId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const child of (childrenOf.get(id) ?? [])) {
        desc.push(child);
        queue.push(child);
      }
    }
    return desc;
  }

  const rootId = flatNodes[0]?.id;
  const result = new Map<string, Map<string, string>>();

  function navigate(nodeId: string, path: readonly string[], styleClass: string): void {
    if (path.length === 0) return;
    if (path.length === 1) {
      // Mark the last key on this node
      let map = result.get(nodeId);
      if (map === undefined) { map = new Map(); result.set(nodeId, map); }
      map.set(path[0]!, styleClass);
      return;
    }
    const seg = path[0]!;
    const rest = path.slice(1);
    if (seg === '**') {
      // ** = match at any depth from nodeId (inclusive)
      for (const desc of descendants(nodeId)) {
        navigate(desc, rest, styleClass);
      }
    } else if (seg === '*') {
      // * = match all direct children of nodeId
      for (const childId of (childrenOf.get(nodeId) ?? [])) {
        navigate(childId, rest, styleClass);
      }
    } else {
      // Exact match via childLookup
      const childId = childLookup.get(`${nodeId}/${seg}`);
      if (childId !== undefined) navigate(childId, rest, styleClass);
    }
  }

  for (const directive of highlights) {
    if (directive.path.length === 0 || rootId === undefined) continue;
    navigate(rootId, directive.path, directive.styleClass);
  }

  return result;
}

// ---------------------------------------------------------------------------
// String display processing
// ---------------------------------------------------------------------------

/**
 * Apply PlantUML's second-level escape interpretation to a JSON string value.
 *
 * After jsonc-parser decodes standard JSON escapes (\\n → newline, etc.),
 * PlantUML interprets the *literal two-character sequences* that remain in the
 * source text:
 *   \\  (two backslashes) → single backslash in display
 *   \n  (backslash + n)   → newline → row split
 *   \r  (backslash + r)   → empty string → row split to blank
 *   \t  (backslash + t)   → tab character → renders as blank
 *
 * The double-backslash must be protected before the other substitutions so
 * that a literal "\\n" in source becomes "\" + "n" (not a newline).
 */
export function processStringDisplay(s: string): string {
  return s
    .replace(/\\\\/g, '\x00') // protect \\ before other replacements
    .replace(/\\n/g, '\n')    // \n → newline (row split)
    .replace(/\\r/g, '')      // \r → empty (blank row)
    .replace(/\\t/g, '\t')    // \t → tab (renders blank)
    .replace(/\x00/g, '\\'); // restore protected \\ as single backslash
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
  maximumWidth?: number;
  fontFamily?: string;
  fontBold?: boolean;
  /** When true, measure key text with bold font (matches default renderer behaviour). */
  headerFontBold?: boolean;
}
