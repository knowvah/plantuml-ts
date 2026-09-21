/**
 * The DOUBLE association-class couple `(A,B) <arrow> (C,D)` -- upstream
 * `AbstractClassOrObjectDiagram#associationClass`'s FOUR-entity overload
 * (`objectdiagram/AbstractClassOrObjectDiagram.java:114-141`) plus the
 * `insertPointBetween` helper it calls twice (`:143-176`).
 *
 * Split out of `class-assoc-couple.ts` (which sat near the 500-line module
 * cap) and re-exported from it, so existing
 * `import { applyDoubleCouple } from './class-assoc-couple.js'` sites are
 * unchanged. The SINGLE-couple path (`Association`'s inner class, `:200+`)
 * stays there: it is a different upstream construct with a different
 * shared-counter burn order, and cdd-T3 deliberately does not merge them.
 */

import type { ClassDiagramAST, Classifier, Relationship } from './ast.js';
import {
  ASSOC_DOUBLE_COUPLE_RE,
  type AssocCoupleCounter,
  type CoupleCircle,
  makeCoupleCircle,
} from './class-assoc-couple.js';

/**
 * cdd-T3 (A1 SB3): one `insertPointBetween` call's shared-counter burns --
 * the `new Link(LinkDecor.NONE, LinkDecor.NONE, ...)` default that stands in
 * for a missing explicit A-B association (`AbstractClassOrObjectDiagram
 * .java:145-148`, burned purely to supply type/length values and then
 * discarded), then `entity1ToPoint` and `pointToEntity2` (`:154-172`).
 */
function stampInsertPointBetween(counter: AssocCoupleCounter, r: CoupleCircle): void {
  if (!r.subsumedExisted) counter.value += 1;
  counter.value += 1;
  r.aEdge.creationIndex = counter.value;
  if (!r.subsumedExisted) r.aEdge.phantomSlot = true;
  counter.value += 1;
  r.bEdge.creationIndex = counter.value;
}

/**
 * cdd-T3 (A1 SB3): `AbstractClassOrObjectDiagram#associationClass`'s
 * FOUR-entity overload (`:114-141`) burns jar's `cpt1` in an order the
 * single-couple `Association` ctor path does NOT reproduce:
 *
 * ```java
 * final String tmp1 = this.getUniqueSequence("apoint");   // :120
 * final String tmp2 = this.getUniqueSequence("apoint");   // :121
 * final Entity point1 = reallyCreateLeaf(location, code1, ...);  // :123-124
 * final Entity point2 = reallyCreateLeaf(location, code2, ...);  // :126-127
 * insertPointBetween(location, entity1A, entity1B, point1);      // :129
 * insertPointBetween(location, entity2A, entity2B, point2);      // :130
 * final Link point1ToPoint2 = new Link(...);                     // :134-135
 * ```
 *
 * Both NAME ticks land before either point `Entity`, so neither circle's
 * name rank is `creationIndex - 1` and `Classifier.phantomSlot` cannot carry
 * it -- `Classifier.apointNameCreationIndex` does (its own doc comment).
 * Both points are `LeafType.POINT_FOR_ASSOCIATION`, drawn by
 * `EntityImageAssociationPoint#drawU` with no `<g id=...>` wrapper, hence
 * `noUidSlot` on both (G2 N19's existing rule).
 */
function stampDoubleCouple(counter: AssocCoupleCounter, r1: CoupleCircle, r2: CoupleCircle, join: Relationship): void {
  counter.value += 1;
  r1.circle.apointNameCreationIndex = counter.value;
  r1.circle.syntheticIdName = `apoint${counter.value}`;
  counter.value += 1;
  r2.circle.apointNameCreationIndex = counter.value;
  r2.circle.syntheticIdName = `apoint${counter.value}`;
  counter.value += 1;
  r1.circle.creationIndex = counter.value;
  r1.circle.noUidSlot = true;
  counter.value += 1;
  r2.circle.creationIndex = counter.value;
  r2.circle.noUidSlot = true;
  // `insertPointBetween`'s `removeLink(existingLink1)` (`:149`) deletes an
  // explicit A-B association that ALREADY burned a `lnk` rank -- preserve it,
  // exactly as the single-couple path does (`Classifier
  // .subsumedLinkCreationIndex`'s doc comment, ast.ts).
  if (r1.subsumedCreationIndex !== undefined) r1.circle.subsumedLinkCreationIndex = r1.subsumedCreationIndex;
  if (r2.subsumedCreationIndex !== undefined) r2.circle.subsumedLinkCreationIndex = r2.subsumedCreationIndex;
  stampInsertPointBetween(counter, r1);
  stampInsertPointBetween(counter, r2);
  counter.value += 1;
  join.creationIndex = counter.value;
}

/**
 * Double couple `(A,B) . (C,D)`: a circle per couple, joined by a VISIBLE
 * minlen-0 edge (pibifa/begico). Distinct from the same-pair invis sibling
 * link. Mirrors `associationClass`'s 4-entity overload + `insertPointBetween`
 * — no note-on-link split here (that strategy only exists on the one-sided
 * `Association#createNew` path, i.e. `applyAssocCouple` above).
 */
export function applyDoubleCouple(
  ast: ClassDiagramAST,
  ensure: (id: string) => Classifier,
  line: string,
  counter?: AssocCoupleCounter,
): boolean {
  const m = ASSOC_DOUBLE_COUPLE_RE.exec(line);
  if (m === null) return false;
  // No `counter` is passed DOWN into `makeCoupleCircle`: its single-couple
  // interleaving (name, entity, links, per circle) is not this overload's
  // order -- `stampDoubleCouple` below replays the real one over both
  // results at once.
  const r1 = makeCoupleCircle(ast, ensure, m[1]!, m[2]!);
  const r2 = makeCoupleCircle(ast, ensure, m[3]!, m[4]!);
  const join: Relationship = { from: r1.circleId, to: r2.circleId, type: 'association', length: 1 };
  ast.relationships.push(join);
  if (counter !== undefined) stampDoubleCouple(counter, r1, r2, join);
  return true;
}
