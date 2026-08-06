import type { Entity } from './Entity.js';
import type { Link } from './Link.js';

/**
 * EntityUtils — the pure-inner-link predicates `Entity#overrideImage`
 * and `Entity#isAutarkic` filter the diagram's links with. Java's
 * `abstract class` of statics becomes free functions (project
 * convention — see `abel/EntityPosition.ts`).
 *
 * SI1/T5 — full port (3/3 members; `isParent` stays module-private,
 * matching upstream's `private static`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityUtils.java:41
 */

/** Walks `groupToBeTested`'s parent chain looking for `parentGroup`.
 * Upstream's duplicated non-group guard (an `if` returning false, then
 * an unreachable `if` throwing) is preserved as-is.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityUtils.java:43-61 */
function isParent(groupToBeTested: Entity, parentGroup: Entity): boolean {
  if (groupToBeTested.isGroup() === false)
    // Very strange!
    return false;

  if (groupToBeTested.isGroup() === false) throw new Error('IllegalArgumentException');

  while (groupToBeTested.isRoot() === false) {
    if (groupToBeTested === parentGroup) return true;

    const parent = groupToBeTested.getParentContainer();
    // Non-root ⇒ parent exists; Java would NPE here if it did not.
    if (parent === undefined) throw new Error('NullPointerException');
    groupToBeTested = parent;
    if (groupToBeTested.isGroup() === false) return false;
    // throw new IllegalStateException();
  }
  return false;
}

/** True when BOTH ends of `link` live (transitively) inside `group`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityUtils.java:63-75 */
export function isPureInnerLink12(group: Entity, link: Link): boolean {
  if (group.isGroup() === false) throw new Error('IllegalArgumentException');

  const e1 = link.getEntity1();
  const e2 = link.getEntity2();
  const group1 = e1.getParentContainer();
  const group2 = e2.getParentContainer();
  // Java dereferences these unconditionally; a root end would NPE there.
  if (group1 === undefined || group2 === undefined) throw new Error('NullPointerException');
  if (isParent(group1, group) && isParent(group2, group)) return true;

  return false;
}

/** True when both ends agree about being inside `group` (both in, or
 * both out).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityUtils.java:77-88 */
export function isPureInnerLink3(group: Entity, link: Link): boolean {
  if (group.isGroup() === false) throw new Error('IllegalArgumentException');

  const e1 = link.getEntity1();
  const e2 = link.getEntity2();
  const group1 = e1.getParentContainer();
  const group2 = e2.getParentContainer();
  if (group1 === undefined || group2 === undefined) throw new Error('NullPointerException');
  if (isParent(group2, group) === isParent(group1, group)) return true;

  return false;
}
