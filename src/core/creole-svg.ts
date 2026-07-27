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

/**
 * Build the attributes string for a single tspan element.
 */
function buildAttrs(span: CreoleSpan, inheritFill?: string): string {
  const parts: string[] = [];

  const fill = span.color ?? inheritFill;
  if (fill !== undefined) parts.push(`fill="${fill}"`);
  if (span.bold) parts.push('font-weight="bold"');
  if (span.italic) parts.push('font-style="italic"');

  // underline and strikethrough both map to text-decoration; combine if both
  if (span.underline && span.strikethrough) {
    parts.push('text-decoration="underline line-through"');
  } else if (span.underline) {
    parts.push('text-decoration="underline"');
  } else if (span.strikethrough) {
    parts.push('text-decoration="line-through"');
  }

  return parts.join(' ');
}

/**
 * Serialise an array of spans to a string of concatenated SVG `<tspan>`
 * elements.
 *
 * `style.fill` is the inherited text colour; it is applied to spans that do
 * not carry their own colour override.
 */
export function spansToTspan(
  spans: CreoleSpan[],
  style?: { fill?: string },
): string {
  if (spans.length === 0) return '';

  return spans
    .map(span => {
      const attrs = buildAttrs(span, style?.fill);
      return attrs.length > 0
        ? `<tspan ${attrs}>${span.text}</tspan>`
        : `<tspan>${span.text}</tspan>`;
    })
    .join('');
}
