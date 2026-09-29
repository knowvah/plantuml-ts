/**
 * ColorOrder -- a channel permutation, used by `ColorMapper.reverse(order)`
 * (`ColorMapper.java:93-100`) for `skinparam reversecolor <order>`
 * (`TitledDiagram.java:308-312`). Upstream's `enum` becomes an as-const
 * object (the project's no-enum convention); its instance methods become
 * functions taking the order first.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorOrder.java
 */
import type { RgbTriple } from './ColorTrieNode.js';

/** `ColorOrder.java:42`: `RGB, RBG, GRB, GBR, BRG, BGR`. */
export const ColorOrder = {
  RGB: 'RGB',
  RBG: 'RBG',
  GRB: 'GRB',
  GBR: 'GBR',
  BRG: 'BRG',
  BGR: 'BGR',
} as const;
export type ColorOrder = (typeof ColorOrder)[keyof typeof ColorOrder];

/** `ColorOrder.java:44-64` -- the channels re-read in this order. */
export function getColor(order: ColorOrder, color: RgbTriple): RgbTriple {
  const { r, g, b } = color;
  switch (order) {
    case ColorOrder.RGB:
      return { r, g, b };
    case ColorOrder.RBG:
      return { r, g: b, b: g };
    case ColorOrder.GRB:
      return { r: g, g: r, b };
    case ColorOrder.GBR:
      return { r: g, g: b, b: r };
    case ColorOrder.BRG:
      return { r: b, g: r, b: g };
    case ColorOrder.BGR:
      return { r: b, g, b: r };
  }
}

/** `ColorOrder.java:66-69` -- permute, then 255-complement each channel. */
export function getReverse(order: ColorOrder, color: RgbTriple): RgbTriple {
  const c = getColor(order, color);
  return { r: 255 - c.r, g: 255 - c.g, b: 255 - c.b };
}

/** `ColorOrder.java:71-77` -- `valueOf(order.toUpperCase())`, `null` (here
 *  `undefined`) for anything that is not a constant name. */
export function fromString(order: string): ColorOrder | undefined {
  const upper = order.toUpperCase();
  return Object.values(ColorOrder).find((o) => o === upper);
}
