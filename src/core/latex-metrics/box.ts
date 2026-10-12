/**
 * The box algebra JLaTeXMath sizes a formula with: `Box`, `CharBox`,
 * `StrutBox`, `HorizontalBox` and `VerticalBox` (JLaTeXMath 1.0.7, the
 * version pinned at `~/git/plantuml/gradle/libs.versions.toml:12`).
 *
 * Only the METRICS are mirrored (width, height, depth, shift, italic and the
 * last font's x-height); nothing here draws. Every unit is an em of the
 * formula's font size, as in JLaTeXMath, whose `TeXIcon` multiplies by the
 * point size only at the end (`latex-metrics.ts`).
 *
 * Mutation contract: JLaTeXMath builds a box and then calls `setShift` on it
 * (`ScriptsAtom`, `FencedAtom`, `NthRoot`), so boxes here are mutable plain
 * objects too. A box is owned by the one atom that built it; nothing shares
 * a box between two parents.
 */

/** A JLaTeXMath box's metrics. `shift` is vertical inside a horizontal box
 *  and horizontal inside a vertical one, exactly as `Box.shift` is. */
export interface Box {
  width: number;
  height: number;
  depth: number;
  shift: number;
  /** `CharBox.italic`; 0 for every other box. */
  italic: number;
  /** The x-height of `Box#getLastFontId()`'s font, unscaled; `undefined`
   *  stands for `TeXFont.NO_FONT`. */
  lastXHeight: number | undefined;
}

/** `TeXConstants.ALIGN_*` values `HorizontalBox(Box, float, int)` reads. */
export const ALIGN_LEFT = 0;
export const ALIGN_RIGHT = 1;
export const ALIGN_CENTER = 2;
export type Align = typeof ALIGN_LEFT | typeof ALIGN_RIGHT | typeof ALIGN_CENTER;

/** `StrutBox(w, h, d, shift)`: an empty box with the given metrics. */
export function strutBox(width: number, height: number, depth: number, shift = 0): Box {
  return { width, height, depth, shift, italic: 0, lastXHeight: undefined };
}

/** `CharBox(Char)` (`CharBox.java:70-77`): a glyph's scaled metrics. */
export function charBox(width: number, height: number, depth: number, italic: number, xHeight: number): Box {
  return { width, height, depth, shift: 0, italic, lastXHeight: xHeight };
}

/** `CharBox#addItalicCorrectionToWidth` (`CharBox.java:79-82`). */
export function addItalicCorrectionToWidth(box: Box): void {
  box.width += box.italic;
  box.italic = 0;
}

/**
 * A `HorizontalBox` under construction. `add` is `HorizontalBox#recalculate`
 * (`HorizontalBox.java`): widths add, and the first child sets height and
 * depth outright (the `NEGATIVE_INFINITY` seed), shifts included.
 */
export class HBox {
  readonly box: Box = strutBox(0, 0, 0);
  private count = 0;

  add(b: Box): this {
    const first = this.count === 0;
    this.box.width += b.width;
    this.box.height = first ? b.height - b.shift : Math.max(this.box.height, b.height - b.shift);
    this.box.depth = first ? b.depth + b.shift : Math.max(this.box.depth, b.depth + b.shift);
    if (b.lastXHeight !== undefined) this.box.lastXHeight = b.lastXHeight;
    this.count++;
    return this;
  }
}

/** `new HorizontalBox(b)`. */
export function hbox(...children: Box[]): Box {
  const h = new HBox();
  for (const c of children) h.add(c);
  return h.box;
}

/**
 * `HorizontalBox(Box b, float w, int alignment)`: pads `b` with struts out
 * to width `w`. `ALIGN_NONE` behaves as `ALIGN_CENTER` upstream; it is not
 * reached here.
 */
export function hboxAligned(b: Box, w: number, align: Align): Box {
  const rest = w - b.width;
  if (rest <= 0) return hbox(b);
  if (align === ALIGN_CENTER) {
    const s = strutBox(rest / 2, 0, 0);
    return hbox(s, b, strutBox(rest / 2, 0, 0));
  }
  return align === ALIGN_LEFT ? hbox(b, strutBox(rest, 0, 0)) : hbox(strutBox(rest, 0, 0), b);
}

/**
 * A `VerticalBox` under construction (`VerticalBox.java`): the first child
 * sets height and depth, every later one adds its full height to the depth;
 * the width spans the children's horizontal shifts
 * (`leftMostPos`/`rightMostPos`, seeded at `Float.MAX_VALUE` and
 * `-Float.MAX_VALUE`, java:57-58).
 */
export class VBox {
  readonly box: Box = strutBox(0, 0, 0);
  private count = 0;
  private leftMost = Number.MAX_VALUE;
  private rightMost = -Number.MAX_VALUE;

  add(b: Box): this {
    if (this.count === 0) {
      this.box.height = b.height;
      this.box.depth = b.depth;
    } else {
      this.box.depth += b.height + b.depth;
    }
    this.leftMost = Math.min(this.leftMost, b.shift);
    this.rightMost = Math.max(this.rightMost, b.shift + (b.width > 0 ? b.width : 0));
    this.box.width = this.rightMost - this.leftMost;
    if (b.lastXHeight !== undefined) this.box.lastXHeight = b.lastXHeight;
    this.count++;
    return this;
  }
}
