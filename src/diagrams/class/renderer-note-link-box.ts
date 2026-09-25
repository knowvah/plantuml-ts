/**
 * `note on link`'s own box — `ComponentRoseNote`, split out of
 * `renderer-note.ts` (500-line hook cap, pre-authorised split re-export;
 * mirrors that file's own header precedent for `renderer-note-lines.ts`/
 * `renderer-note-connector.ts`/`renderer-note-dispatch.ts`).
 *
 * `ComponentRoseNote` (`skin/rose/Rose.java:95-113` ->
 * `skin/rose/ComponentRoseNote.java`) is a DIFFERENT upstream component
 * from every other note kind `renderer-note.ts` draws (`EntityImageNote`):
 * `ComponentRoseNote#drawInternalU` (`:104-107`) draws BOTH the body
 * polygon AND the fold through the SAME stroked `ug` —
 * `ug = symbolContext.apply(ug); ug.draw(polygon); ug.draw(Opale
 * .getCorner(...))` — never a separate unstroked `ug` for the fold the way
 * `EntityImageNote.java:275-289` does (`renderer-note.ts#NOTE_FOLD_STROKE_
 * WIDTH`'s own doc comment). Its fill/stroke resolve from the note's OWN
 * `#color` override first (`colors.getColor(BACK)`/`getColor(LINE)`,
 * `style/Style.java:270-282`), falling back to the SAME `<style> note {}`
 * bucket/default `renderer-note.ts#resolveNoteBackground` already resolves
 * for every other note kind — `ComponentType.NOTE`'s style signature is
 * shared (`svek/image/EntityImageNoteLink.java:64`). Never the note's own
 * TEXT colour: `ComponentRoseNote`'s text block draws through the
 * no-`colors` `getFontConfiguration()` overload (`skin/AbstractComponent
 * .java:129-130` -> `style/Style.java:255-257`, `colors == null`) — see
 * `class-notes.ts#parseNoteOnLinkColors`'s own doc comment for the
 * jar-verified proof (nuvake-96-gofe203's `text:white`/`text:purple`
 * sub-tokens draw plain `#000` body text).
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseNote.java:104-133
 * @see ~/git/plantuml/.../style/Style.java:270-282
 */
import type { NoteGeo } from './note-layout.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { parseColor, paintToSvg, type Paint } from '../../core/paint.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { path } from '../../core/svg.js';
import { opaleCorner } from './note-opale.js';
import { OPALE_CORNERSIZE as NOTE_FOLD } from '../../core/svek/image/Opale.js';
import { NOTE_STROKE_WIDTH, noteBodyPathData, renderNoteText } from './renderer-note.js';

/** G2 N34's `NOTE_FILL` default (`renderer-note.ts`'s own copy) — a
 *  note-on-link with no `#color` AND no `<style> note {}` bucket falls
 *  back to the SAME jar default every other note kind uses
 *  (`ColorParam.noteBackground`). Duplicated rather than imported: that
 *  constant is `renderer-note.ts`-private, and re-deriving one string
 *  literal is cheaper than widening its visibility for a single reader. */
const NOTE_FILL: Paint = '#FEFFDD';

/** {@link renderLinkNoteBox}'s colour input — the two slots
 *  `class-notes.ts#parseNoteOnLinkColors` extracts from a note-on-link's
 *  own `#color` spec (`class-relationship-ast.ts#Relationship.linkNoteBack`/
 *  `.linkNoteLine`'s own doc comments). */
export interface LinkNoteColors {
  readonly back?: string;
  readonly line?: string;
}

/**
 * The BACK (fill) resolution: an explicit override first (parsed through
 * {@link parseColor} so a gradient token, e.g. `aqua/aliceblue`
 * (`lozego-15-coci435`), resolves to a real `<linearGradient>` the same way
 * `paint.ts#paintToSvg`'s doc comment describes), else the `<style> note
 * {}` bucket the diagram may have set, else the jar default. Upstream's own
 * gradient scan (`klimt/color/HColorSet.java:109-116`) applies to EVERY
 * colour slot uniformly — note-on-link's BACK included — so this reuses the
 * SAME `paint.ts` machinery `class-badge.ts`'s classifier fill already does,
 * rather than re-deriving gradient support locally.
 */
function resolveLinkNoteFill(back: string | undefined, theme: ScaledTheme): { fill: string; def?: string } {
  if (back !== undefined) return paintToSvg(parseColor(back));
  const bucket = theme.colors.elements?.['note']?.background;
  return paintToSvg(bucket ?? NOTE_FILL);
}

/**
 * Draw a note-on-link's box (body + fold + text) and return its `extraDefs`
 * alongside the body — the SAME `{body, extraDefs}` contract
 * `renderer-edge.ts#renderEdge` already threads for arrowhead/middle-decor
 * defs, needed here so a gradient BACK override's `<linearGradient>` def
 * reaches the document's top-level `<defs>`.
 */
export function renderLinkNoteBox(note: NoteGeo, colors: LinkNoteColors, theme: ScaledTheme): { body: string; extraDefs: string } {
  const { fill, def } = resolveLinkNoteFill(colors.back, theme);
  // No fixture in this corpus needs a gradient LINE (stroke) override --
  // named remainder, `paint.ts`'s own `noGradient` doc comment surveys the
  // ONE jar driver (`DriverLineSvg`) that cannot paint one; a note's own
  // outline is a `<path>`, whose rectangle-sibling driver CAN, but nothing
  // here exercises it yet.
  const stroke = colors.line !== undefined ? resolveColorToSvgHex(colors.line) : theme.colors.border;
  const { x, y, width: w, height: h } = note;
  const f = NOTE_FOLD * theme.scaleK;
  const strokeWidth = NOTE_STROKE_WIDTH * theme.scaleK;
  const body =
    path(noteBodyPathData(x, y, w, h, f), { fill, stroke, strokeWidth }) +
    path(opaleCorner({ x, y }, w), { fill, stroke, strokeWidth }) +
    renderNoteText(note, theme);
  return { body, extraDefs: def ?? '' };
}
