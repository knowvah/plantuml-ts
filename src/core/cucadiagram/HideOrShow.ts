import { Entity } from '../abel/Entity.js';
import { MAGIC_SEPARATOR } from '../plasma/Plasma.js';
import type { Stereotype } from '../stereo/Stereotype.js';

/**
 * HideOrShow — one recorded `hide`/`show`/`remove`/`restore` directive:
 * a `what` pattern (`$tag`, `<<stereotype>>`, `@unlinked`, or an entity
 * name with `*` wildcards) plus the show flag. `CucaDiagram` folds a
 * list of these over each leaf (`isHidden`/`isRemoved`) and stereotype
 * (`isStereotypeRemoved`).
 *
 * SI1/T10 closure pull — full port (10/10 members). Java's
 * `apply`/`isApplyable` overload pairs (`Entity` vs `Stereotype`)
 * merge into single members dispatched on `instanceof Entity` (both
 * are classes here, so the runtime discriminant exists — unlike T5's
 * LeafType/GroupType constructor case). `match` builds the same
 * unquoted regex as Java's `String#matches` (user `*` becomes `.*`;
 * any other regex metacharacters pass through, bug-compatibly).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/HideOrShow.java:44
 */
export class HideOrShow {
  /** @see cucadiagram/HideOrShow.java:46-47 */
  private readonly what: string;
  private readonly show: boolean;

  /** @see cucadiagram/HideOrShow.java:49-52 */
  toString(): string {
    return this.what + ' (' + String(this.show) + ')';
  }

  /** Both Java overloads (:54-69 for `Entity`, :71-75 for
   * `Stereotype`), instanceof-dispatched.
   * @see cucadiagram/HideOrShow.java:54-75 */
  private isApplyable(target: Entity | Stereotype): boolean {
    if (target instanceof Entity === false) {
      if (this.what.startsWith('<<') && this.what.endsWith('>>'))
        return this.isApplyableStereotype(target, this.what.substring(2, this.what.length - 2).trim());
      return false;
    }

    const leaf = target;
    if (leaf.isRoot()) throw new Error('IllegalArgumentException');

    if (this.what.startsWith('$')) return this.isApplyableTag(leaf, this.what.substring(1));

    if (this.what.startsWith('<<') && this.what.endsWith('>>'))
      return this.isApplyableStereotype(leaf.getStereotype(), this.what.substring(2, this.what.length - 2).trim());

    if (this.isAboutUnlinked()) return this.isApplyableUnlinked(leaf);

    const fullName = leaf.getQuark().getQualifiedName();
    return this.match(fullName, this.what);
  }

  /** @see cucadiagram/HideOrShow.java:77-79 */
  isAboutUnlinked(): boolean {
    return this.what.toLowerCase() === '@unlinked';
  }

  /** @see cucadiagram/HideOrShow.java:81-86 */
  private isApplyableUnlinked(leaf: Entity): boolean {
    if (leaf.isAloneAndUnlinked()) return true;

    return false;
  }

  /** @see cucadiagram/HideOrShow.java:88-97 */
  private isApplyableStereotype(stereotype: Stereotype | undefined, pattern: string): boolean {
    if (stereotype === undefined) return false;

    for (const label of stereotype.getMultipleLabels()) if (this.match(label, pattern)) return true;

    return false;
  }

  /** @see cucadiagram/HideOrShow.java:99-105 */
  private isApplyableTag(leaf: Entity, pattern: string): boolean {
    for (const tag of leaf.stereotags()) if (this.match(tag.getName(), pattern)) return true;

    return false;
  }

  /** @see cucadiagram/HideOrShow.java:107-121 */
  private match(name: string, pattern: string): boolean {
    const idx = name.lastIndexOf(MAGIC_SEPARATOR);
    if (idx !== -1) name = name.substring(idx + 1);

    if (pattern.includes('*')) {
      // Java String#replace replaces every occurrence, literally.
      const reg = '^' + pattern.split('*').join('.*') + '$';
      return new RegExp(reg).test(name);
    }

    return name === pattern;
  }

  /** @see cucadiagram/HideOrShow.java:123-126 */
  constructor(what: string, show: boolean) {
    this.what = what;
    this.show = show;
  }

  /** Both Java overloads (:128-133 for `Entity`, :135-140 for
   * `Stereotype`) — one instanceof-dispatched `isApplyable` serves
   * both.
   * @see cucadiagram/HideOrShow.java:128-140 */
  apply(hidden: boolean, target: Entity | Stereotype): boolean {
    if (this.isApplyable(target)) return !this.show;

    return hidden;
  }
}
