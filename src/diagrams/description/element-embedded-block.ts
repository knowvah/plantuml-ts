/**
 * `PSystemCommandFactory#addOneSingleLineManageEmbedded2` (`:288-307`) for
 * `CommandCreateElementMultilines`' TYPE1 element body (`parser.ts`'s
 * `continueElementBlock`): while an open element block is accumulating body
 * lines, a line that OPENS an embedded diagram (`{{`, optionally
 * `{{salt`/`{{json`/… — `EmbeddedDiagram#getEmbeddedType`) swallows every
 * following line up to its matching `}}`, nesting-aware, WITHOUT any of
 * those lines ever being tested against the element block's own END regex
 * (`ELEMENT_MULTILINE_END1_RE`) — that is why an embedded region's own
 * interior `rectangle FailCase [ … ]`'s closing `]` never prematurely
 * closes the OUTER `rectangle A [ … ]` block (rozugu-82-pera583, T3.md M6,
 * mission unknown-bucket-routing-repair T8).
 *
 * Split out of `parser.ts` (500-line file cap) as its own module rather
 * than folded into `parse-helpers.ts` (also at the cap) — same reasoning
 * `command-table-helpers.ts`'s own file doc already states for this
 * engine's other single-purpose helper modules.
 *
 * `sequence/parser.ts#scanEmbeddedBlock` is the SAME algorithm, ported
 * independently for its own multi-line note body (a different
 * `PendingElementState`-shaped accumulator) — not imported from here or
 * vice versa, matching this port's established per-engine duplication
 * precedent for this exact primitive (`EmbeddedDiagram.ts`'s own file doc,
 * "On `getEmbeddedType` and T9a").
 *
 * Mirrors `scanEmbeddedBlock`'s two easy-to-miss upstream details: the
 * opening `{{` line is itself part of the block (java:289-290), as is the
 * closing `}}` (java:295 adds `s` BEFORE the nesting check at `:296-302`);
 * an unterminated block absorbs every remaining line rather than failing
 * (java's `while (it.hasNext())` simply falls through to `return lines`).
 *
 * @see ~/git/plantuml/.../command/PSystemCommandFactory.java:267-307
 * @see ~/git/plantuml/.../EmbeddedDiagram.java:78,257-354
 */

import { EmbeddedDiagram, getEmbeddedType } from '../../core/EmbeddedDiagram.js';

export interface EmbeddedElementBlock {
  readonly block: readonly string[];
  readonly consumed: number;
}

/** `lines[i]` is already known to open an embedded region (its caller
 *  checked `getEmbeddedType`) — this scans forward from `i + 1` for the
 *  matching close, returning the WHOLE region (opener through closer,
 *  inclusive) and how many lines it consumed. */
export function scanEmbeddedElementBlock(lines: readonly string[], i: number): EmbeddedElementBlock {
  let nested = 1;
  for (let j = i + 1; j < lines.length; j++) {
    const s = lines[j] ?? '';
    if (getEmbeddedType(s) !== null) {
      nested++;
    } else if (s.trim() === EmbeddedDiagram.EMBEDDED_END) {
      nested--;
      if (nested === 0) return { block: lines.slice(i, j + 1), consumed: j - i + 1 };
    }
  }
  return { block: lines.slice(i), consumed: lines.length - i };
}
