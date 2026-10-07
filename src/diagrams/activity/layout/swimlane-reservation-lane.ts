/**
 * Lane tags for {@link Reservation}s (add4-T2f, LANE-RESERVATION).
 *
 * A connection's `UEmpty` is drawn inside the lane pass that draws the
 * connection, through that lane's translated `UGraphic`
 * (`Swimlanes.java:342-343`, `UGraphicInterceptorOneSwimlane.java:93-104`),
 * so the box moves with its lane exactly like the nodes around it. The walk
 * builds reservations in lane-local coordinates, so a lane-tagged
 * reservation must take its lane's placement delta.
 *
 * The tag rides a `WeakMap` keyed by the reservation object -- the same
 * side-channel shape as `swimlane-context.ts#MeasureSpec` -- so the shared
 * `Reservation` type and its untagged producers stay unchanged. An untagged
 * reservation keeps its walk coordinates (the pre-existing behaviour).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:342-343
 */
import type { Reservation } from './hexagon-reservations.js';

const RESERVATION_LANES = new WeakMap<Reservation, string>();

/** Pushes `r`, tagged with the lane whose pass draws it (none: untagged). */
export function pushLaneReservation(reservations: Reservation[], r: Reservation, lane: string | undefined): void {
  if (lane !== undefined) RESERVATION_LANES.set(r, lane);
  reservations.push(r);
}

/** Each lane-tagged reservation moved by its lane's delta; others as-is. */
export function shiftLaneReservations(
  reservations: readonly Reservation[],
  deltas: ReadonlyMap<string, number>,
): Reservation[] {
  return reservations.map((r) => {
    const lane = RESERVATION_LANES.get(r);
    const dx = lane === undefined ? 0 : (deltas.get(lane) ?? 0);
    return dx === 0 ? r : { ...r, x: r.x + dx };
  });
}
