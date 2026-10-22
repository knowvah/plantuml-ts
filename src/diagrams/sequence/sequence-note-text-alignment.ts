/**
 * The post-parse `skinparam noteTextAlignment` pass: upstream's
 * `Rose.createComponentNote` reads the legacy params map ONLY
 * (`param.getHorizontalAlignment(AlignmentParam.noteTextAlignment, null,
 * false, null)`, `Rose.java:110`), when the tile builds its component -- i.e.
 * after the whole parse. A `<style> note { HorizontalAlignment }` value aligns
 * the lines inside the block (`AbstractComponent.java:133-134`) and nothing
 * else: it does not pick the 6/15 padding or the note's position.
 *
 * `SkinParam.java:682` reads `getValue("noteTextAlignment")`; a value that is
 * not an alignment falls back to `getDefaultTextAlignment(LEFT)`
 * (`:722-727`), which reads `getValue("defaulttextalignment")` (`:731-732`).
 */
import { horizontalAlignmentFromString, type HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { SequenceDiagramAST, SequenceEvent } from './ast.js';
import type { SequenceLegacyParams } from './sequence-skin-param.js';

/** The `params` keys, lower-case as `getValue` cleans them (`SkinParam.java:325-340`). */
const NOTE_TEXT_ALIGNMENT_KEY = 'notetextalignment';
const DEFAULT_TEXT_ALIGNMENT_KEY = 'defaulttextalignment';

/** The alignment the skin parameters name, or `undefined` where neither is
 *  written (upstream then takes LEFT, `SkinParam.java:722-727`). */
export function legacyNoteTextAlignment(params: SequenceLegacyParams): HorizontalAlignment | undefined {
  return (
    horizontalAlignmentFromString(params.getValue(NOTE_TEXT_ALIGNMENT_KEY)) ??
    horizontalAlignmentFromString(params.getValue(DEFAULT_TEXT_ALIGNMENT_KEY))
  );
}

function markNotes(events: readonly SequenceEvent[], align: HorizontalAlignment): void {
  for (const event of events) {
    if (event.kind === 'note') event.legacyTextAlignment = align;
    else if (event.kind === 'frame') for (const branch of event.branches) markNotes(branch, align);
  }
}

/** Stamp every note with the legacy alignment when one is written. */
export function applyNoteTextAlignment(ast: SequenceDiagramAST, params: SequenceLegacyParams): void {
  const align = legacyNoteTextAlignment(params);
  if (align !== undefined) markNotes(ast.events, align);
}
