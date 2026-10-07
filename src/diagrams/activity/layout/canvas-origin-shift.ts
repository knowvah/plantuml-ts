/**
 * The canvas-origin translate `canvas-origin.ts#finalizeGeometry` applies
 * once it has the shift -- split out of `canvas-origin.ts` (add4-T2e) only
 * to keep that file under the 500-line hook. Pure move; see that module's
 * doc for the mechanism (`Recentred.java:47-59` + the document margin).
 */

import type { ActivityEdgeGeo, ActivityNodeGeo, SwimlaneGeo } from '../activity-geometry.types.js';
import type { Reservation } from './hexagon-reservations.js';

/** The four collections the translate moves. */
export interface ShiftableGeometry {
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  swimlanes: SwimlaneGeo[];
  reservations: Reservation[];
}

function shiftNodeGeo(node: ActivityNodeGeo, dx: number, dy: number): ActivityNodeGeo {
  const next: ActivityNodeGeo = { ...node, x: node.x + dx, y: node.y + dy };
  if (node.spikeTip !== undefined) next.spikeTip = { x: node.spikeTip.x + dx, y: node.spikeTip.y + dy };
  return next;
}

function shiftEdgeGeo(edge: ActivityEdgeGeo, dx: number, dy: number): ActivityEdgeGeo {
  const next: ActivityEdgeGeo = { ...edge, points: edge.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
  if (edge.midArrowAt !== undefined) {
    next.midArrowAt = { ...edge.midArrowAt, x: edge.midArrowAt.x + dx, y: edge.midArrowAt.y + dy };
  }
  // b3/T3a (family C/EMMID): `emphasizeAt` is the same kind of absolute
  // anchor point as `midArrowAt` -- see `activity-geometry.types.ts`'s doc.
  if (edge.emphasizeAt !== undefined) {
    next.emphasizeAt = { x: edge.emphasizeAt.x + dx, y: edge.emphasizeAt.y + dy };
  }
  return next;
}

/** `contentMinX` is deliberately NOT shifted here, for the same reason
 *  `compress-geometry.ts#transformLane`'s own doc gives: it is measured
 *  lane-LOCAL, before the lane's own absolute translate is applied
 *  (`Swimlanes.java:416-431`) -- this canvas-origin shift is simply a
 *  further layer of the same kind of absolute translate `contentMinX`
 *  already excludes. */
function shiftSwimlaneGeo(lane: SwimlaneGeo, dx: number): SwimlaneGeo {
  const next: SwimlaneGeo = { ...lane, x: lane.x + dx };
  if (lane.contentX !== undefined) next.contentX = lane.contentX + dx;
  return next;
}

function shiftReservation(r: Reservation, dx: number, dy: number): Reservation {
  return { ...r, x: r.x + dx, y: r.y + dy };
}

/** {@link finalizeGeometry}'s own middle step (`canvas-origin.ts`): shifts
 *  every node/edge/swimlane/reservation by the one canvas-origin translate. */
export function shiftAll(input: ShiftableGeometry, dx: number, dy: number): ShiftableGeometry {
  return {
    nodes: input.nodes.map((n) => shiftNodeGeo(n, dx, dy)),
    edges: input.edges.map((e) => shiftEdgeGeo(e, dx, dy)),
    swimlanes: input.swimlanes.map((s) => shiftSwimlaneGeo(s, dx)),
    reservations: input.reservations.map((r) => shiftReservation(r, dx, dy)),
  };
}
