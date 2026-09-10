/**
 * `collectSlots` -- `klimt/compress/SlotFinder.java:70-140`'s `draw`
 * dispatch, ported line for line over the flat `CompressShape[]`
 * `shapesOf` (`shapes-of.ts`) produces (D2).
 *
 * @see net/sourceforge/plantuml/klimt/compress/SlotFinder.java:70-140
 * @see net/sourceforge/plantuml/klimt/shape/URectangle.java:107-113,193-217
 * @see net/sourceforge/plantuml/klimt/drawing/TextLimitFinder.java:82-90
 */

import type { CompressionMode } from './slot.js';
import { SlotSet } from './slot.js';
import type { CompressShape } from './shapes-of.js';

/**
 * `URectangle#drawWhenCompressed` (`klimt/shape/URectangle.java:193-199`):
 * ON_X reserves `UEmpty(2, h)` at each end; ON_Y (`:200-206`) reserves
 * `UEmpty(w, 2)` at top and bottom. The `2` is this exact citation -- never
 * fitted.
 */
function addIgnoredRectSlot(slots: SlotSet, mode: CompressionMode, shape: CompressShape): void {
  const RESERVED = 2;
  if (mode === 'x') {
    slots.addSlot(shape.x, shape.x + RESERVED);
    slots.addSlot(shape.x + shape.width - RESERVED, shape.x + shape.width);
  } else {
    slots.addSlot(shape.y, shape.y + RESERVED);
    slots.addSlot(shape.y + shape.height - RESERVED, shape.y + shape.height);
  }
}

/** `SlotFinder#drawRectangle`/`drawEllipse`/`drawEmpty`
 *  (`SlotFinder.java:138-161`) -- byte-identical `[x, x+w]`/`[y, y+h]`
 *  dispatch, shared by every box-shaped kind. */
function addBoxSlot(slots: SlotSet, mode: CompressionMode, shape: CompressShape): void {
  if (mode === 'x') slots.addSlot(shape.x, shape.x + shape.width);
  else slots.addSlot(shape.y, shape.y + shape.height);
}

/** `TextLimitFinder#drawText` (`klimt/drawing/TextLimitFinder.java:82-90`):
 *  `y -= dim.height - 1.5`, then the box is `[x, x+w] x [y', y'+h]` --
 *  i.e. `[y - h + 1.5, y + 1.5]` in the ORIGINAL `y`. */
function addTextSlot(slots: SlotSet, mode: CompressionMode, shape: CompressShape): void {
  if (mode === 'x') slots.addSlot(shape.x, shape.x + shape.width);
  else slots.addSlot(shape.y - shape.height + 1.5, shape.y + 1.5);
}

/**
 * One shape's contribution to the `SlotSet`, mirroring `SlotFinder#draw`'s
 * own dispatch (`SlotFinder.java:78-100`) including the
 * `UShapeIgnorableForCompression`/`drawWhenCompressed` branch and the
 * `UPolygon#getCompressionMode()` skip.
 */
function addShape(slots: SlotSet, mode: CompressionMode, shape: CompressShape): void {
  const ignored = (mode === 'x' && shape.ignoreX === true) || (mode === 'y' && shape.ignoreY === true);
  if (shape.kind === 'rect' && ignored) {
    addIgnoredRectSlot(slots, mode, shape);
    return;
  }
  switch (shape.kind) {
    case 'rect':
    case 'ellipse':
    case 'empty':
      addBoxSlot(slots, mode, shape);
      return;
    case 'polygon':
      if (shape.polygonSkipMode === mode) return;
      addBoxSlot(slots, mode, shape);
      return;
    case 'text':
      addTextSlot(slots, mode, shape);
      return;
  }
}

/**
 * `SlotFinder#draw`, ported over the flat `CompressShape[]` `shapesOf`
 * produces instead of a live `UGraphic` draw call per shape (D2).
 */
export function collectSlots(shapes: readonly CompressShape[], mode: CompressionMode): SlotSet {
  const slots = new SlotSet();
  for (const shape of shapes) addShape(slots, mode, shape);
  return slots;
}

/**
 * Every index pair `[i, j]` (`i < j`) whose FULL boxes (`[x, x+width] x
 * [y, y+height]`, ignoring any `ignoreX`/`ignoreY`/`polygonSkipMode` --
 * this is a real-geometry overlap check, not a compression-slot query)
 * intersect on both axes. Not a port of any upstream class: T5's own
 * invariant that compression must never introduce a NEW overlap needs a
 * ground-truth "did these two shapes already overlap" answer this mission
 * defines itself.
 */
export function overlaps(shapes: readonly CompressShape[]): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  for (let i = 0; i < shapes.length; i++) {
    const a = shapes[i]!;
    for (let j = i + 1; j < shapes.length; j++) {
      const b = shapes[j]!;
      const xOverlap = a.x < b.x + b.width && b.x < a.x + a.width;
      const yOverlap = a.y < b.y + b.height && b.y < a.y + a.height;
      if (xOverlap && yOverlap) result.push([i, j]);
    }
  }
  return result;
}
