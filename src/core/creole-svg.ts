/**
 * Creole span → SVG `<tspan>` serialisation.
 *
 * A sibling of `src/core/creole.ts` (kept in a separate module: creole.ts
 * exceeded this repo's 500-line-per-file cap; see
 * `~/.claude/hooks/check-complexity.py`). `creole.ts` composes this module's
 * `spansToTspan` with `parseCreole` into the public `creoleToSvg` entry
 * point, and re-exports `spansToTspan` directly.
 */

import type { CreoleSpan } from './creole-lexer.js';
import { tspan } from './svg.js';
import type { TextStyle } from './svg.js';

/** underline and strikethrough both map to text-decoration; combine if both */
function decorationOf(span: CreoleSpan): string | undefined {
  if (span.underline && span.strikethrough) return 'underline line-through';
  if (span.underline) return 'underline';
  if (span.strikethrough) return 'line-through';
  return undefined;
}

/**
 * Map a creole span to the shared {@link TextStyle}. Attribute ORDER is the
 * emitter's (fill, font-weight, font-style, text-decoration) -- the same
 * order the hand-built string produced, so only the VALUES change: the fill
 * now shortens, and the content is escaped.
 */
function styleOf(span: CreoleSpan, inheritFill?: string): TextStyle {
  const fill = span.color ?? inheritFill;
  const decoration = decorationOf(span);
  return {
    ...(fill === undefined ? {} : { fill }),
    ...(span.bold ? { fontWeight: 'bold' as const } : {}),
    ...(span.italic ? { fontStyle: 'italic' as const } : {}),
    ...(decoration === undefined ? {} : { textDecoration: decoration }),
  };
}

/**
 * Serialise an array of spans to a string of concatenated SVG `<tspan>`
 * elements.
 *
 * `style.fill` is the inherited text color; it is applied to spans that do
 * not carry their own color override.
 */
export function spansToTspan(
  spans: CreoleSpan[],
  style?: { fill?: string },
): string {
  if (spans.length === 0) return '';

  return spans.map(span => tspan(span.text, styleOf(span, style?.fill))).join('');
}
