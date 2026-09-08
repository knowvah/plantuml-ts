/**
 * Coordinate-shifting helpers (`shiftGeo`/`resliceRegions`/`shiftTransition`)
 * and the flat-bounding-box fallback (`boundingBox`) -- split out of
 * `state-composite-geo.ts` purely to keep that file under this project's
 * 500-line cap (a pure move, zero behavior change). This family is
 * self-contained (pure functions over `StateNodeGeo`/`TransitionGeo`/
 * `StateRegionGeo`, no other module dependency), so it moves as one
 * cohesive unit; `state-composite-geo.ts` imports it back, unchanged for
 * its own callers.
 */

import type { StateNodeGeo, TransitionGeo, StateRegionGeo } from './state-geo-types.js';

const BOX_PAD = 12;

export function shiftGeo(g: StateNodeGeo, dx: number, dy: number): StateNodeGeo {
  const children = g.children.map((c) => shiftGeo(c, dx, dy));
  const transitions = g.transitions.map((t) => shiftTransition(t, dx, dy));
  return {
    ...g,
    x: g.x + dx,
    y: g.y + dy,
    children,
    transitions,
    // mission G4 S6, mechanism 13: an ANCESTOR's own shift (e.g. this node
    // is a nested composite reached via a grandparent's `spec.localStates`)
    // must ALSO shift `concurrentRegions`/`separators` if this node itself
    // owns concurrent regions -- otherwise a nested concurrent composite's
    // separator lines would retain their PRE-ancestor-shift coordinates.
    // `concurrentRegions` is rebuilt from the ALREADY-shifted `children`/
    // `transitions` above (by slicing on original per-region lengths) so
    // object identity with the flat arrays is preserved, matching
    // `materializeAutonom`'s own identity-sharing contract.
    ...(g.concurrentRegions !== undefined
      ? { concurrentRegions: resliceRegions(g.concurrentRegions, children, transitions) }
      : {}),
    ...(g.separators !== undefined
      ? {
          separators: g.separators.map((sep) => ({
            x1: sep.x1 + dx,
            y1: sep.y1 + dy,
            x2: sep.x2 + dx,
            y2: sep.y2 + dy,
          })),
        }
      : {}),
  };
}

/** Re-groups already-shifted flat `children`/`transitions` back into their
 *  original per-region boundaries (lengths preserved 1:1 by `shiftGeo`'s own
 *  `.map` above, which never adds/removes entries) -- see `shiftGeo`'s own
 *  doc comment for why this must reuse the SAME shifted objects rather than
 *  re-deriving them. */
function resliceRegions(
  original: readonly StateRegionGeo[],
  shiftedChildren: readonly StateNodeGeo[],
  shiftedTransitions: readonly TransitionGeo[],
): StateRegionGeo[] {
  const out: StateRegionGeo[] = [];
  let childCursor = 0;
  let transitionCursor = 0;
  for (const region of original) {
    out.push({
      children: shiftedChildren.slice(childCursor, childCursor + region.children.length),
      transitions: shiftedTransitions.slice(transitionCursor, transitionCursor + region.transitions.length),
    });
    childCursor += region.children.length;
    transitionCursor += region.transitions.length;
  }
  return out;
}

export function shiftTransition(t: TransitionGeo, dx: number, dy: number): TransitionGeo {
  return {
    ...t,
    points: t.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    ...(t.label !== undefined ? { label: { ...t.label, x: t.label.x + dx, y: t.label.y + dy } } : {}),
  };
}

export function boundingBox(children: readonly StateNodeGeo[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of children) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + c.width);
    maxY = Math.max(maxY, c.y + c.height);
  }
  if (!isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: minX - BOX_PAD,
    y: minY - BOX_PAD,
    width: maxX - minX + BOX_PAD * 2,
    height: maxY - minY + BOX_PAD * 2,
  };
}
