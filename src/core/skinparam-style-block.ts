/**
 * `<style>` block parsing — parseStyleBlock and its internal helpers.
 *
 * Split out of skinparam.ts to keep that file under the project's 500-line
 * file-size cap — see skinparam.ts's own doc comment for the full module map.
 */

import type { StyleMap } from './skinparam-types.js';

/**
 * Normalize raw style block content so that braces appear on their own lines.
 *
 * This mirrors the upstream StyleParser's character-level tokenizer (StyleParser.java),
 * which treats '{' and '}' as token boundaries independent of line structure.
 * The normalization allows compact single-line syntax such as
 *   "actor { BackGroundColor: blue; }"
 * to parse identically to the equivalent multi-line form.
 *
 * Semicolons are also normalized to newlines so that declarations terminated
 * with ';' on the same line as a closing brace are correctly separated.
 */
function normalizeStyleInput(raw: string): string {
  // #lizard forgives — false positive: this is ~12 lines (CCN 1), but lizard
  // miscounts the function span because of the brace/quote regex literals below.
  // Keep '{' on the same line as the selector name (so selectorOpen matches),
  // but move any content after '{' to the next line.
  // Move '}' so it always starts on a fresh line.
  // Replace ';' with newline (acts as statement separator, matching upstream tokenizer).
  return raw
    .replace(/\{/g, '{\n')
    .replace(/\}/g, '\n}')
    // Replace bare semicolons with newlines, but preserve semicolons inside
    // double-quoted strings (e.g. LineStyle "1;5" must not be split).
    .replace(/"[^"]*"|;/g, (m) => (m === ';' ? '\n' : m));
}

/**
 * Alias-target mapping for {@link applyStateDiagramCascadeAliases}: each
 * entry is `[targetSelector, [[sourceKey, destKey], ...]]`. "LineColor" is
 * aliased under TWO different destination keys because its two consumers
 * expect different property names: `collectElementStyleBuckets` reads
 * "bordercolor" (mirroring the flat `<sname>BorderColor` skinparam suffix
 * convention, `matchElementColorKey`), while `applyStyleMap`'s
 * `statediagram.arrow` reader reads "linecolor" (the raw upstream style
 * property name, matching `style-cascade-class.ts`'s own `'linecolor'`
 * usage for the class engine's identical arrow selector).
 */
const STATE_DIAGRAM_CASCADE_TARGETS: ReadonlyArray<
  readonly [target: string, mapping: ReadonlyArray<readonly [srcKey: string, destKey: string]>]
> = [
  [
    'statediagram.state',
    [
      ['backgroundcolor', 'backgroundcolor'],
      ['linecolor', 'bordercolor'],
      ['fontcolor', 'fontcolor'],
    ],
  ],
  ['statediagram.arrow', [['linecolor', 'linecolor']]],
];

/**
 * Mutates `result` in place: propagates the bare "statediagram" selector's
 * cascadable properties (see {@link STATE_DIAGRAM_CASCADE_TARGETS}) into the
 * "statediagram.state"/"statediagram.arrow" entries, WITHOUT overwriting a
 * property either target already declares explicitly (`dest.has(destKey)`
 * guard below) — see {@link parseStyleBlock}'s own call-site doc comment for
 * the full mechanism and jar evidence.
 */
function applyStateDiagramCascadeAliases(result: StyleMap): void {
  const bare = result.get('statediagram');
  if (bare === undefined) return;
  for (const [target, mapping] of STATE_DIAGRAM_CASCADE_TARGETS) {
    for (const [srcKey, destKey] of mapping) {
      const value = bare.get(srcKey);
      if (value === undefined) continue;
      let dest = result.get(target);
      if (dest === undefined) {
        dest = new Map<string, string>();
        result.set(target, dest);
      }
      if (!dest.has(destKey)) dest.set(destKey, value);
    }
  }
}

/**
 * Cross-product every frame's comma-separated selector alternatives into the
 * concrete selector path(s) a declaration at the current nesting depth
 * targets. All-single-token frames collapse to one path (== the legacy
 * `stack.join('.')`); a comma frame multiplies the paths, mirroring
 * upstream's per-comma-token Style expansion. An empty stack yields the
 * single root path `''`.
 */
function computeSelectorPaths(stack: readonly string[][]): string[] {
  return stack.reduce<string[]>(
    (prefixes, frame) => prefixes.flatMap((p) => frame.map((tok) => (p === '' ? tok : `${p}.${tok}`))),
    [''],
  );
}

/**
 * Trims a raw declaration value, strips a trailing `;` left over from
 * normalization, then strips a surrounding double-quote pair (e.g.
 * `LineStyle "1;5"` stores as `1;5` in raw input but value is `1;5`).
 */
function normalizeDeclarationValue(raw: string): string {
  let value = raw.trim();
  // Strip trailing semicolon if present (may appear after normalization
  // when a semicolon immediately followed a closing brace or similar).
  if (value.endsWith(';')) {
    value = value.slice(0, -1).trimEnd();
  }
  // Strip surrounding double-quotes so callers receive the bare value.
  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
    value = value.slice(1, -1);
  }
  return value;
}

/** Writes `key`/`value` into `result` under every path in `selectorPaths`. */
function writeDeclaration(
  result: StyleMap,
  selectorPaths: readonly string[],
  key: string,
  value: string,
): void {
  for (const selectorPath of selectorPaths) {
    let inner = result.get(selectorPath);
    if (inner === undefined) {
      inner = new Map<string, string>();
      result.set(selectorPath, inner);
    }
    inner.set(key, value);
  }
}

// Selector-open: a dot-led class selector may contain internal spaces
// (upstream `StyleParser.readString`: `if (ch == ' ' && result.charAt(0)
// != '.') break;` — a token starting with '.' does NOT stop at spaces,
// unlike every other token). `.static lib { ... }` is therefore ONE
// selector, `.static lib`, not two. The dot-branch consumes everything up
// to the opening brace (trimmed below); the non-dot branch is unchanged
// (stops at the first space, exactly as before).
// Non-dot branch additionally accepts a COMMA-separated selector list
// (`node, rectangle { ... }`) -- upstream `StyleParser.readWithComma`
// reads STRING+COMMA tokens into one `full` selector string, pushed as a
// single context that `StyleContext.toStyles()` later expands into one
// Style per comma token (cross-producted with the parent context). See the
// stack cross-product below for the port's equivalent expansion.
const SELECTOR_OPEN_RE = /^\s*(\.[^{]+|[\w.-]+(?:\s*,\s*[\w.-]+)*)\s*\{/;
const BLOCK_CLOSE_RE = /^\s*\}\s*$/;
const DECLARATION_RE = /^\s*([\w-]+)(?:\s*:\s*|\s+)(.+)$/;

/**
 * Processes one (already `\r`-stripped) normalized line: opens a selector
 * frame, closes one, or records a declaration into `result` at the current
 * stack depth. Lines matching none of the three shapes are silently
 * skipped. `stack` holds, per nesting depth, the list of comma-separated
 * selector alternatives (usually one) — see {@link computeSelectorPaths}.
 */
function processStyleLine(line: string, stack: string[][], result: StyleMap): void {
  const openMatch = SELECTOR_OPEN_RE.exec(line);
  if (openMatch !== null) {
    const alternatives = openMatch[1]!
      .trim()
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    stack.push(alternatives);
    return;
  }

  if (BLOCK_CLOSE_RE.test(line)) {
    stack.pop();
    return;
  }

  const m = DECLARATION_RE.exec(line);
  if (m === null) return;
  // Cross-product every frame's comma alternatives into the concrete
  // selector path(s) this declaration targets. All-single-token frames
  // collapse to one path (== the legacy `stack.join('.')`); a comma frame
  // multiplies the paths, mirroring upstream's per-comma-token Style
  // expansion. An empty stack yields the single root path `''`.
  const selectorPaths = computeSelectorPaths(stack);
  const key = m[1]!.toLowerCase();
  const value = normalizeDeclarationValue(m[2]!);
  writeDeclaration(result, selectorPaths, key, value);
}

/**
 * Parse the raw string content of a single `<style>` block into a
 * hierarchical selector-path → declarations map.
 *
 * The input must NOT include the surrounding `<style>` / `</style>` tags —
 * those are stripped by the preprocessor before calling this function.
 *
 * Algorithm (matches upstream StyleParser context-stack behaviour):
 *  0. Normalize braces and semicolons onto their own lines (handles compact
 *     single-line syntax like "actor { BackGroundColor: blue; }").
 *  1. Split on newlines; strip any trailing \r from each line (CRLF support).
 *  2. A line matching /^\s*([\w.-]+)\s*\{/ opens a selector — push the
 *     lowercased selector name onto the stack. Nesting depth > 2 throws.
 *  3. A line matching /^\s*\}\s*$/ closes a block — pop the stack.
 *  4. A line matching /^\s*([\w-]+)\s*:\s*(.+)$/ is a declaration:
 *       - selector path = stack joined with "." (empty string if stack empty)
 *       - key = match[1].toLowerCase()
 *       - value = match[2].trim(), with trailing ";" stripped
 *     The (path, key, value) triple is stored in the StyleMap.
 *  5. All other lines are silently skipped.
 *
 * Returns a StyleMap that maps selector paths to their declaration maps.
 */
export function parseStyleBlock(raw: string): StyleMap {
  const result: StyleMap = new Map();
  if (raw.length === 0) return result;

  // Normalize to ensure braces appear on their own lines (token boundary
  // normalization matching upstream's character-level tokenizer).
  const normalized = normalizeStyleInput(raw);

  // Each frame is the list of comma-separated selector alternatives at that
  // nesting depth (usually one). A declaration writes to the cross-product of
  // every frame's alternatives -- for all-single-token frames this is exactly
  // the old `stack.join('.')`, so non-comma input is byte-identical.
  const stack: string[][] = [];

  for (const rawLine of normalized.split('\n')) {
    // Strip trailing \r so that CRLF line endings are handled cleanly.
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    processStyleLine(line, stack, result);
  }

  // mission G6 T4: bare `<style> stateDiagram { BackgroundColor/LineColor/
  // FontColor ... } }` (NO nested selector) cascades to EVERY element
  // reachable from a state diagram -- boxes, composite/cluster boxes, AND
  // edges -- per upstream's compound StyleSignature (`StyleSignatureBasic.of
  // (root, element, stateDiagram, state)` for a box, `(root, arrow,
  // stateDiagram)` for an edge: the bare "stateDiagram" selector token alone
  // satisfies both chains). Jar-verified `decede-10-buvu414`: a lone
  // `stateDiagram { RoundCorner 2; Shadowing 0; BackgroundColor cyan;
  // LineColor green; FontColor red }` tints every box's fill/stroke/text AND
  // the transition's own path+arrowhead stroke, while the SAME properties
  // scoped to a bare `state { ... }` selector (no diagram-type wrapper)
  // reach ONLY the element bucket, never the edge (verified against the jar
  // oracle directly -- see the T4 diagnosis artifact).
  //
  // Alias the bare "statediagram" declarations into the two selector keys
  // the REST of the style machinery already reads directly and unmodified:
  // "statediagram.state" (the generic per-element bucket,
  // `style-map-element.ts#collectElementStyleBuckets`'s own
  // `<diagramType>.<bucket>` nesting rule) and "statediagram.arrow"
  // (`style-map-theme.ts#applyStyleMap`'s pre-existing `stateArrowLineColor`
  // reader, mission G4 S16). A property is only ALIASED when the target
  // selector does not already declare it explicitly — a real, more-specific
  // `state { ... }`/`arrow { ... }` sub-block (or a same-named selector from
  // a SEPARATE `<style>` block merged later) always wins, matching upstream's
  // more-specific-overrides-less-specific cascade rule.
  applyStateDiagramCascadeAliases(result);

  return result;
}
