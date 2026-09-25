/**
 * renderer-arrowhead-contact.ts — cdd3-T33 (C-11): the class engine's own
 * `nodeContact` resolution for `SvekEdge#getExtremitySimplier`'s `side`
 * lookup (`SvekEdge.java:544-546` — `if (nodeContact != null) side =
 * nodeContact.getRectangleArea().getClosestSide(center);`). Split out of
 * `renderer-arrowhead.ts` (500-line hook cap) purely to keep that file's
 * own line count under the cap; this module owns no diagram behavior of
 * its own beyond the one lookup.
 *
 * `contactRects` is a `classifierId -> rect` map built once per diagram
 * (`renderer.ts`, from `geo.leaves`'s own already-SCALED `x`/`y`/`width`/
 * `height` — `class-scale-geo.ts#scaleClassGeometry` scales `leaves` and
 * `edges` together, so this map and `EdgeGeo.points` share one coordinate
 * space, matching upstream's `SvekNode.getRectangleArea()`/`dotPath
 * .getStartPoint()` pair, which are likewise both post-layout jar units).
 * Absent for a contact id this diagram never laid out as a plain
 * classifier (a namespace/cluster endpoint, a `Class::member` port) —
 * `undefined` there reproduces upstream's `nodeContact == null` branch
 * (`bibliotekon.getNode(...)` returns `null` for anything that is not a
 * `SvekNode`), i.e. `side` stays `null`.
 */
import type { Point2D } from '../../core/klimt/UTranslate.js';
import { getClosestSide, type ContactRect } from '../../core/svek/extremity/closest-side.js';
import type { Side } from '../../core/svek/extremity/Side.js';

export type { ContactRect } from '../../core/svek/extremity/closest-side.js';

/**
 * `side = nodeContact != null ? nodeContact.getRectangleArea()
 * .getClosestSide(center) : null` (`SvekEdge.java:544-546`), with
 * `center` = the PRE-Kal contact point (`edge.points[0]`/`.at(-1)` — see
 * `buildEdgeArrowheads`'s own doc comment for why the Kal-translated point
 * is not used here).
 */
export function resolveContactSide(
  contactRects: ReadonlyMap<string, ContactRect> | undefined,
  contactId: string | undefined,
  point: Point2D | undefined,
): Side | null {
  if (contactRects === undefined || contactId === undefined || point === undefined) return null;
  const rect = contactRects.get(contactId);
  if (rect === undefined) return null;
  return getClosestSide(rect, point) ?? null;
}
