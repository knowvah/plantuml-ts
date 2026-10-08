/**
 * class-sprite-back.ts — the `Back` a classifier's text is drawn on, so a
 * creole `<$sprite>` atom tints from it as upstream does at draw time
 * (`SpriteMonochrome.java:215-217`, `ug.getParam().getBackcolor()`;
 * unwind2-S7).
 *
 * `EntityImageClass#drawInternal` applies `backcolor.bg()` to the `ug` the
 * body is drawn with, and the header draws on `ugHeader`, which carries
 * `headerBackcolor.bg()` only when the header fill differs from the body's
 * (`EntityImageClass.java:213,216-238`):
 *
 * ```java
 * ug = ug.apply(backcolor.bg());
 * UGraphic ugHeader = ug;
 * if (roundCorner == 0 && headerBackcolor != null && backcolor.equals(headerBackcolor) == false) {
 *     ...
 *     ugHeader = ugHeader.apply(headerBackcolor.bg());
 * } else if (roundCorner != 0 && headerBackcolor != null && backcolor.equals(headerBackcolor) == false) {
 *     ...
 *     ugHeader = ugHeader.apply(headerBackcolor.bg()).apply(headerBackcolor);
 * ```
 *
 * Both arms apply the same header back, so the round-corner value does not
 * select it; `resolveClassHeaderFill` is the `headerBackcolor` that differs.
 */
import type { Paint } from '../../core/paint.js';
import type { Theme } from '../../core/theme.js';
import { spriteHrefOver } from '../../core/klimt/sprite/sprite-tint.js';
import type { ClassifierGeo } from './layout.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import { classifierFill } from './renderer-classifier-colors.js';
import { CLASS_HEADER_SPLIT_KINDS, resolveClassHeaderFill } from './renderer-classifier-header-split.js';

/** The back a row of `geo` is drawn on: the body fill, or for the header
 *  the differing header fill (`EntityImageClass.java:213,222,230,238`). */
export function classifierRowBack(geo: ClassifierGeo, theme: Theme, isHeader: boolean): Paint {
  const body = classifierFill(geo, theme);
  if (!isHeader || !CLASS_HEADER_SPLIT_KINDS.has(geo.kind)) return body;
  return resolveClassHeaderFill(geo, body, theme) ?? body;
}

/** Re-tints every monochrome sprite atom over `back`; other atoms pass. */
export function atomsOverBack(
  atoms: readonly MemberRenderAtom[],
  back: Paint | undefined,
): readonly MemberRenderAtom[] {
  return atoms.map((a) => (a.kind === 'image' && a.tint !== undefined ? { ...a, href: spriteHrefOver(a, back) } : a));
}
