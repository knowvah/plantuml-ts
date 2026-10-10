/**
 * A sequence note's drop shadow and the geometry it costs (unwind2-S9b).
 * Split out of `sequence-layout-events.ts`, which is past the line cap.
 *
 * `Note#getUsedStyles` (`sequencediagram/Note.java:75-82`) merges the note
 * keyword's signature (`NoteStyle.java:66-74`) with its stereotype's styles;
 * the component turns that style's `getShadowing()` into its delta shadow.
 *
 * - `ComponentRoseNote` (`note`) RESERVES it: `getPreferredWidth` and
 *   `getPreferredHeight` add it (`ComponentRoseNote.java:83-91`), while the
 *   polygon is `x2` x `getTextHeight` (`:104-119`), `x2` being
 *   `getTextWidth` whenever the area is no wider than the preferred width.
 * - `ComponentRoseNoteBox` (`rnote`) and `ComponentRoseNoteHexagonal`
 *   (`hnote`) only DRAW it (`ComponentRoseNoteBox.java:101`,
 *   `ComponentRoseNoteHexagonal.java:109`).
 *
 * Jar-verified: `tests/fixtures/unwind2-S9b/n3.svg` against `n0.svg` -- each
 * `note` tile is 3 taller and a one-participant note's box sits half the
 * reserve further left of its lifeline, the same width; the `hnote`/`rnote`
 * tiles do not grow; the note over two participants keeps its x and width.
 */
import type { Theme } from '../../core/theme.js';
import type { NoteEvent } from './ast.js';

/** A note's shadow and the width/height it reserves. */
export interface NoteShadowGeometry {
  readonly shadow: number;
  readonly reserve: number;
}

/** See the module header. */
export function noteShadowGeometry(event: NoteEvent, theme: Theme): NoteShadowGeometry {
  const style = event.style ?? 'note';
  const shadow = theme.colors.graph.sequenceShadowing?.note(style, event.stereotype) ?? 0;
  const reserve = style === 'note' ? shadow : 0;
  return { shadow, reserve };
}
