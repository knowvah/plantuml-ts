/**
 * `PSystemCommandFactory#addOneSingleLineManageEmbedded2` (`:288-307`) for
 * `CommandCreateElementMultilines`' TYPE0/TYPE1 body (`class-multiline-
 * element.ts`'s `continueMultilineElement`): while an open multi-line
 * element block is accumulating body lines, a line that OPENS an embedded
 * diagram (`{{`, optionally `{{salt`/`{{json`/… — `EmbeddedDiagram
 * #getEmbeddedType`) swallows every following line up to its matching `}}`,
 * nesting-aware, WITHOUT any of those lines ever being tested against the
 * element block's own END regex (`ELEMENT_MULTILINE_END0_RE`/
 * `ELEMENT_MULTILINE_END1_RE`) — that is why an embedded region's own
 * interior `rectangle FailCase [ … ]`'s closing `]` never prematurely
 * closes the OUTER `rectangle A [ … ]` block (rozugu-82-pera583, T3.md M6,
 * mission unknown-bucket-routing-repair T7b).
 *
 * A class-local TWIN of `../description/element-embedded-block.ts`'s
 * `scanEmbeddedElementBlock` — the SAME algorithm, ported independently
 * per this mission's own write-set boundary (T7b's brief: no cross-engine
 * import from `class` into `src/diagrams/description/`), matching this
 * port's established per-engine duplication precedent for this exact
 * primitive (`EmbeddedDiagram.ts`'s own file doc, "On `getEmbeddedType`
 * and T9a"; `sequence/parser.ts#scanEmbeddedBlock` is a third independent
 * port of the same primitive for its own note-body accumulator).
 *
 * Mirrors the same two easy-to-miss upstream details the description twin
 * documents: the opening `{{` line is itself part of the block
 * (java:289-290), as is the closing `}}` (java:295 adds `s` BEFORE the
 * nesting check at `:296-302`); an unterminated block absorbs every
 * remaining line rather than failing (java's `while (it.hasNext())` simply
 * falls through to `return lines`).
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
