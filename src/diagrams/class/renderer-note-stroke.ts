/**
 * cdd3-T24 (E3-8): a class note's own stroke -- `EntityImageNote`'s
 * `borderColor` (`:108`, `style.value(PName.LineColor)`) and `style
 * .getStroke()` thickness (`:283-292` `applyStroke`), which the note
 * renderer used to hard-code as `theme.colors.border` / 0.5. Its own module
 * because `renderer-note.ts` is past the 500-line cap.
 *
 * Tiers, highest first: the `note` element bucket (`skinparam
 * NoteBorderColor`/`NoteBorderThickness`, or `<style> note { ... }`,
 * `skinparam-element-buckets.ts`), then the `{root,element,classDiagram,
 * note}` ancestor cascade (`noteCascadeBorder`/`noteCascadeLineThickness`
 * -- `skin rose`'s root 1.0, `<style> classDiagram { LineColor }`), then
 * `theme.colors.border` / the `plantuml.skin:325` `note { LineThickness
 * 0.5 }` default. `EntityImageTips#getOpale` (`:194,198`) reads the SAME
 * two values from the same note signature for a member-tip note.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageNote.java:108
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageTips.java:190-202
 */
import type { ScaledTheme } from './class-scale-geo.js';
import type { Paint } from '../../core/paint.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { resolveElementLineThickness } from '../../core/theme-element-resolve.js';

/** `plantuml.skin:322-326` `note { LineThickness 0.5 }`. */
export const NOTE_STROKE_WIDTH = 0.5;

/** The note's resolved `LineColor` and SCALED `LineThickness`. */
export interface NoteStroke {
  readonly stroke: Paint;
  readonly strokeWidth: number;
}

function noteBorder(theme: ScaledTheme): Paint {
  const bucket = theme.colors.elements?.['note']?.border;
  // A bucket value is a raw `parseColor` result: a colour NAME still needs
  // HColorSet resolution (same as `renderer-note.ts#resolveNoteBackground`).
  if (bucket !== undefined) return typeof bucket === 'string' ? resolveColorToSvgHex(bucket) : bucket;
  return theme.colors.graph.noteCascadeBorder ?? theme.colors.border;
}

export function resolveNoteStroke(theme: ScaledTheme): NoteStroke {
  const thickness =
    resolveElementLineThickness(theme, 'note') ?? theme.colors.graph.noteCascadeLineThickness ?? NOTE_STROKE_WIDTH;
  return { stroke: noteBorder(theme), strokeWidth: thickness * theme.scaleK };
}
