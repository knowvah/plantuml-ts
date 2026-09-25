/**
 * cdd3-T24 (C-6, E3-8): the class box's and the class note's own stroke
 * reads -- `LineThickness` for both, `LineColor` for the note (the class
 * box's `LineColor` is `classCascadeBorder`, `style-cascade-class.ts`).
 * Split out of `style-cascade-class.ts` (500-line cap), same import shape
 * as `style-cascade-class-generic.ts`: `cascadeHex`/`GraphCascadeOverride`
 * come back from the parent module, safe because neither is read at the
 * other's module-init time.
 *
 * `EntityImageClass.java:215` -- `getStyle().getStroke(lineConfig
 * .getColors())`, style `{root,element,classDiagram,class_}`;
 * `BodyEnhancedAbstract.java:121-122` -- `style.value(PName.LineThickness)
 * .asDouble()` on the SAME style (`EntityImageClass.java:92-93` passes
 * `getStyle()` to the body); `EntityImageNote.java:108,283-292` --
 * `style.value(PName.LineColor)` and `style.getStroke()`, style
 * `{root,element,classDiagram,note}`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:215
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageNote.java:108
 */
import type { StyleMap } from './skinparam.js';
import { cascadeHex } from './style-cascade-class.js';
import type { GraphCascadeOverride } from './style-cascade-class.js';
import { resolveStyleCascade } from './style-map-element.js';
import { CLASS_SNAMES, NOTE_SNAMES } from './style-cascade-class-snames.js';

/** `ValueImpl#asDouble` -- `Double.parseDouble` of the raw value; a
 *  non-numeric declaration contributes nothing (the reader's default
 *  stands), matching `classCascadeRoundCorner`'s own guard. */
function cascadeNumber(styleMap: StyleMap, snames: readonly string[], property: string): number | undefined {
  const raw = resolveStyleCascade(styleMap, snames, property);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function applyLineCascadeOverrides(styleMap: StyleMap, override: Partial<GraphCascadeOverride>): void {
  const classThickness = cascadeNumber(styleMap, CLASS_SNAMES, 'linethickness');
  if (classThickness !== undefined) override.classCascadeLineThickness = classThickness;
  const noteThickness = cascadeNumber(styleMap, NOTE_SNAMES, 'linethickness');
  if (noteThickness !== undefined) override.noteCascadeLineThickness = noteThickness;
  const noteBorder = cascadeHex(styleMap, NOTE_SNAMES, 'linecolor');
  if (noteBorder !== undefined) override.noteCascadeBorder = noteBorder;
}
