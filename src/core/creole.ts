/**
 * Creole markup parser for PlantUML labels.
 *
 * Converts a subset of Creole wiki markup and HTML inline tags into a sequence
 * of styled span descriptors that can be serialised as SVG <tspan> elements.
 *
 * Supported markup:
 *   **text**          — bold
 *   //text//          — italic
 *   __text__          — underline
 *   --text--          — strikethrough
 *   <color:X>text</color>  — text colour
 *   <b>text</b>       — bold (HTML alias)
 *   <i>text</i>       — italic (HTML alias)
 *   <u>text</u>       — underline (HTML alias)
 *   <s>text</s>       — strikethrough (HTML alias)
 *
 * Markup may be nested. Unclosed markup is treated as literal text.
 *
 * Table syntax (Creole):
 *   |= Header 1 |= Header 2 |
 *   | Cell 1    | Cell 2    |
 *   |= prefix marks a header cell; trailing | is optional.
 *
 * This module is the public entry point; the implementation is split across
 * sibling files to stay under this repo's 500-line-per-file cap (see
 * `~/.claude/hooks/check-complexity.py`):
 *   - `creole-lexer.ts` — tokeniser + inline-style parser (`CreoleSpan`)
 *   - `creole-table.ts` — table row parsing, measurement, SVG rendering
 *   - `creole-svg.ts`   — span → `<tspan>` serialisation
 *   - `creole-atoms.ts` — `<img>`/`<$sprite>`/`<&openiconic>` inline atoms
 */

import { EMPTY_STATE, tokenise, parseTokens, mergeSpans } from './creole-lexer.js';
import type { CreoleSpan } from './creole-lexer.js';
import { isTableLine, parseTableRow } from './creole-table.js';
import type { TableCell, TableToken } from './creole-table.js';
import { spansToTspan } from './creole-svg.js';

export type { CreoleSpan } from './creole-lexer.js';
export type { TableCell, TableToken } from './creole-table.js';
export { measureTable, tableTokenToSvg } from './creole-table.js';
export { spansToTspan } from './creole-svg.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A token in the multi-line Creole token stream.
 *
 * - `spans` — a single inline line parsed into styled spans
 * - `table` — a block of consecutive table rows
 */
export type CreoleToken =
  | { kind: 'spans'; spans: CreoleSpan[] }
  | TableToken;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a Creole-marked string into a flat array of styled spans.
 *
 * The result has no zero-length spans. Adjacent spans with identical
 * formatting are merged. Unclosed markup is emitted as literal text including
 * the delimiter characters.
 */
export function parseCreole(input: string): CreoleSpan[] {
  if (input.length === 0) return [];
  const tokens = tokenise(input);
  const raw = parseTokens(tokens, { ...EMPTY_STATE });
  return mergeSpans(raw);
}

/**
 * Parse a multi-line Creole string into a sequence of `CreoleToken` values.
 *
 * Consecutive lines starting with `|` are grouped into a single `TableToken`.
 * All other lines are parsed as inline Creole markup and emitted as
 * `{ kind: 'spans', spans: CreoleSpan[] }` tokens.
 */
export function parseCreoleTokens(input: string): CreoleToken[] {
  const lines = input.split('\n');
  const result: CreoleToken[] = [];
  let tableRows: Array<Array<TableCell>> = [];

  const flushTable = (): void => {
    if (tableRows.length > 0) {
      result.push({ kind: 'table', rows: tableRows });
      tableRows = [];
    }
  };

  for (const line of lines) {
    if (isTableLine(line)) {
      tableRows.push(parseTableRow(line));
    } else {
      flushTable();
      result.push({ kind: 'spans', spans: parseCreole(line) });
    }
  }

  flushTable();
  return result;
}

/**
 * Convenience function: parse and serialise in one step.
 */
export function creoleToSvg(
  input: string,
  style?: { fill?: string },
): string {
  return spansToTspan(parseCreole(input), style);
}
