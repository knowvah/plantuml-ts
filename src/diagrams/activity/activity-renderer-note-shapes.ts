/**
 * Note-body polygon primitives -- split out of `activity-renderer-
 * shapes.ts` (500-line cap, add3-T3d) purely mechanically: no behavior
 * change, every function moved verbatim. `renderNote` (that file) is the
 * only caller. add4-T1c added {@link noteFillOf} (the Opale's fill).
 */
import { NOTE_CORNER_SIZE, NOTE_SPIKE_DELTA } from './activity-layout-constants.js';
import type { ActivityNodeGeo } from './activity-geometry.types.js';
import type { Theme } from '../../core/theme.js';
import { parseColor, type Paint } from '../../core/paint.js';

/** add4-T1c: the Opale's own `BackGroundColor` -- the note's `#color` when
 *  its wrap overrode the style with it (`Style#eventuallyOverride(Colors)`,
 *  `style/Style.java:195-200`, called by `FtileWithNoteOpale.java:137-139`
 *  and `FtileWithNotes.java:109-111`; `walk-with-notes.ts` sets
 *  `node.color` only on those wraps), else the theme's note background.
 *  `parseColor` keeps a `#a-b` gradient whole, as `HColorSet` splits it
 *  (`core/paint.ts#parseColor`). */
export function noteFillOf(node: ActivityNodeGeo, theme: Theme): Paint {
  return node.color !== undefined ? parseColor(node.color) : theme.colors.noteBackground;
}

/** `Opale#getCorner` (`:134-147`, `roundCorner=0`): the fold triangle,
 *  identical for every body variant (`getPolygonNormal`/`Left`/`Right`) --
 *  `Opale#drawU` (`:126`) draws it unconditionally, as its own filled
 *  `<path>`, never as unfilled border lines. */
export function noteFoldPath(x: number, y: number, w: number): string {
  const d = NOTE_CORNER_SIZE;
  return `M${x + w - d},${y} L${x + w - d},${y + d} L${x + w},${y + d} L${x + w - d},${y}`;
}

/** `Opale#getPolygonNormal` (`:149-157`, no link, `roundCorner=0`): top-left
 *  -> bottom-left -> bottom-right -> right-edge-below-fold -> fold-top ->
 *  close. Was top-left -> fold-top -> right-edge-below-fold -> bottom-right
 *  -> bottom-left -> close, the opposite traversal (T2f mechanism 3). */
export function noteBodyNormal(x: number, y: number, w: number, h: number): string {
  const d = NOTE_CORNER_SIZE;
  return `M${x},${y} L${x},${y + h} L${x + w},${y + h} L${x + w},${y + d} L${x + w - d},${y} L${x},${y}`;
}

/** A degenerate `arcTo(point, roundCorner/2=0, 0, 0)` -- `Opale
 *  #getPolygonLeft`/`Right` ALWAYS emit an `A` command there, even at
 *  radius 0 (T2f mechanism 3, verified byte-exact against `cubida-55-
 *  meku256`'s jar SVG: `A0,0 0 0 0 <samepoint>` immediately follows the
 *  `L` that already reached that point). */
export function zeroArc(x: number, y: number): string {
  return `A0,0 0 0 0 ${x},${y}`;
}

/** `Opale#getPolygonRight` (`:198-219`): spike on the RIGHT edge (the
 *  note sits LEFT of its target). `y1`'s floor is `cornersize` (`:208`)
 *  -- the spike may not rise into the fold's own corner. */
export function noteBodySpikeRight(
  x: number,
  y: number,
  w: number,
  h: number,
  spike: { x: number; y: number },
): string {
  const d = NOTE_CORNER_SIZE;
  const y1 = Math.max(d, Math.min(spike.y - y - NOTE_SPIKE_DELTA, h - 2 * NOTE_SPIKE_DELTA));
  return (
    `M${x},${y} L${x},${y + h} ${zeroArc(x, y + h)} L${x + w},${y + h} ${zeroArc(x + w, y + h)} ` +
    `L${x + w},${y + y1 + 2 * NOTE_SPIKE_DELTA} L${spike.x},${spike.y} L${x + w},${y + y1} ` +
    `L${x + w},${y + d} L${x + w - d},${y} L${x},${y} ${zeroArc(x, y)}`
  );
}

/** `Opale#getPolygonLeft` (`:175-196`): spike on the LEFT edge (the note
 *  sits RIGHT of its target). `y1`'s floor is `0` (`:180`), not
 *  `cornersize` -- the fold is on the OPPOSITE (right) edge here. */
export function noteBodySpikeLeft(x: number, y: number, w: number, h: number, spike: { x: number; y: number }): string {
  const d = NOTE_CORNER_SIZE;
  const y1 = Math.max(0, Math.min(spike.y - y - NOTE_SPIKE_DELTA, h - 2 * NOTE_SPIKE_DELTA));
  return (
    `M${x},${y} L${x},${y + y1} L${spike.x},${spike.y} L${x},${y + y1 + 2 * NOTE_SPIKE_DELTA} ` +
    `L${x},${y + h} ${zeroArc(x, y + h)} L${x + w},${y + h} ${zeroArc(x + w, y + h)} ` +
    `L${x + w},${y + d} L${x + w - d},${y} L${x},${y} ${zeroArc(x, y)}`
  );
}
