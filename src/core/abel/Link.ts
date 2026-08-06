import type { CucaNote } from './CucaNote.js';
import type { Entity } from './Entity.js';
import type { LeafType } from './LeafType.js';
import type { NoteLinkStrategy } from './NoteLinkStrategy.js';
import type { LinkConstraint } from '../cucadiagram/LinkConstraint.js';
import type { UFont } from './ISkinParam.js';
import { reverse, type LinkArrow } from './LinkArrow.js';
import { EntityPosition } from './EntityPosition.js';
import { LinkBase } from './LinkBase.js';
import { Display } from '../klimt/creole/Display.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import type { ISkinSimple } from '../style/ISkinSimple.js';
import type { Url } from '../url/Url.js';
import type { LineLocation } from '../tim/LineLocation.js';

/**
 * Link — the edge of the cuca model: two entities, a mutable
 * `LinkType` (via `WithLinkType`), the `LinkArg` label bundle, and the
 * add-time state (`sameConnections` is ADR-3's dedup keystone). This
 * file carries `getInv` (:145-156) and members :328-579; `LinkBase.ts`
 * carries the fields, constructor, and members :67-326 (500-line-cap
 * split, `EntityBase.ts` precedent).
 *
 * SI1/T6 — full port replacing T5's 5-method forward stub (the stub's
 * five signatures are preserved verbatim across the two halves). TS
 * adaptations, each documented at its member: `undefined` for Java
 * `null`, `LinkArrow`'s free `reverse`, `EntityPosition`'s free
 * predicates, and the ADR-2-deferred render seam inside
 * `getQuantifierMargin`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java:65
 */
export class Link extends LinkBase {
  /** @see abel/Link.java:145-156 */
  getInv(): Link {
    const result = new Link(
      this.location,
      this.cucaDiagram,
      this.styleBuilder,
      this.cl2,
      this.cl1,
      this.getType().getInversed(),
      this.linkArg.getInv(),
    );
    result.inverted = !this.inverted;
    result.port1 = this.port2;
    result.port2 = this.port1;
    result.url = this.url;
    result.linkConstraint = this.linkConstraint;
    result.stereotype = this.stereotype;
    result.linkArg.setVisibilityModifier(this.linkArg.getVisibilityModifier());
    result.linkArrow = this.linkArrow;
    return result;
  }

  /** @see abel/Link.java:292-294 */
  getLabel(): Display {
    return this.getLinkArg().getLabel();
  }

  /** @see abel/Link.java:304-306 */
  getQuantifier1(): string | undefined {
    return this.getLinkArg().getQuantifier1();
  }

  /** @see abel/Link.java:308-310 */
  getQuantifier2(): string | undefined {
    return this.getLinkArg().getQuantifier2();
  }

  /** @see abel/Link.java:312-314 */
  getRole1(): string | undefined {
    return this.getLinkArg().getRole1();
  }

  /** @see abel/Link.java:316-318 */
  getRole2(): string | undefined {
    return this.getLinkArg().getRole2();
  }

  /** @see abel/Link.java:320-322 */
  getWeight(): number {
    return this.weight;
  }

  /** @see abel/Link.java:324-326 */
  setWeight(weight: number): void {
    this.weight = weight;
  }

  /** @see abel/Link.java:328-330 */
  getNote(): CucaNote | undefined {
    return this.note;
  }

  /** @see abel/Link.java:332-334 */
  addNote(note: CucaNote): void {
    this.note = note;
  }

  /** @see abel/Link.java:336-339 */
  addNoteFrom(other: Link, strategy: NoteLinkStrategy): void {
    if (other.note !== undefined) this.note = other.note.withStrategy(strategy);
  }

  /** @see abel/Link.java:341-352 */
  isAutoLinkOfAGroup(): boolean {
    if (this.getEntity1().isGroup() === false) return false;

    if (this.getEntity2().isGroup() === false) return false;

    if (this.getEntity1() === this.getEntity2()) return true;

    return false;
  }

  /** @see abel/Link.java:354-359 */
  containsType(type: LeafType): boolean {
    if (this.getEntity1().getLeafType() === type || this.getEntity2().getLeafType() === type) return true;

    return false;
  }

  /** @see abel/Link.java:361-368 */
  contains(entity: Entity): boolean {
    if (this.getEntity1() === entity) return true;
    if (this.getEntity2() === entity) return true;

    return false;
  }

  /** @see abel/Link.java:370-378 */
  getOther(entity: Entity): Entity {
    if (this.getEntity1() === entity) return this.getEntity2();

    if (this.getEntity2() === entity) return this.getEntity1();

    throw new Error('IllegalArgumentException');
  }

  //	public double getMarginDecors1(StringBounder stringBounder, UFont fontQualif, ISkinSimple spriteContainer) {
  //		final double q = getQualifierMargin(stringBounder, fontQualif, linkArg.getQualifier1(), spriteContainer);
  //		final LinkDecor decor = getType().getDecor1();
  //		return decor.getMargin() + q;
  //	}
  //
  //	public double getMarginDecors2(StringBounder stringBounder, UFont fontQualif, ISkinSimple spriteContainer) {
  //		final double q = getQualifierMargin(stringBounder, fontQualif, linkArg.getQualifier2(), spriteContainer);
  //		final LinkDecor decor = getType().getDecor2();
  //		return decor.getMargin() + q;
  //	}

  /** Private and callerless upstream (its only callers, getMarginDecors1/2
   * :380-390, are commented out there — the comment block is preserved
   * above); preserved per ADR-1 with the terminal render call DEFERRED:
   * needs `FontConfiguration.blackBlueTrue` + the
   * `display.create(fontConfiguration, horizontalAlignment,
   * spriteContainer)` seam (this port's instance `create` takes a
   * `CreoleRenderContext` — `Entity#getStateDescription` precedent,
   * `.agent-notes/T5-entity-port.md`).
   * @see abel/Link.java:392-401 */
  private getQuantifierMargin(
    stringBounder: StringBounder,
    fontQualif: UFont,
    qualif: string | undefined,
    spriteContainer: ISkinSimple,
  ): number {
    void stringBounder;
    void fontQualif;
    void qualif;
    void spriteContainer;
    throw new Error(
      'deferred per SI1/ADR-2: Link.getQuantifierMargin needs FontConfiguration.blackBlueTrue and the Display render seam (display.create(fontConfiguration, horizontalAlignment, spriteContainer)) not yet ported',
    );
  }

  /** @see abel/Link.java:411-413 */
  setOpale(opale: boolean): void {
    this.opale = opale;
  }

  /** @see abel/Link.java:415-417 */
  setHorizontalSolitary(horizontalSolitary: boolean): void {
    this.horizontalSolitary = horizontalSolitary;
  }

  /** @see abel/Link.java:419-421 */
  isHorizontalSolitary(): boolean {
    return this.horizontalSolitary;
  }

  /** `LinkArrow#reverse()` is this port's free `reverse(arrow)`.
   * @see abel/Link.java:423-428 */
  getLinkArrow(): LinkArrow {
    if (this.inverted) return reverse(this.linkArrow);

    return this.linkArrow;
  }

  /** @see abel/Link.java:430-432 */
  setLinkArrow(linkArrow: LinkArrow): void {
    this.linkArrow = linkArrow;
  }

  /** @see abel/Link.java:434-436 */
  isInverted(): boolean {
    return this.inverted;
  }

  /** @see abel/Link.java:438-441 */
  hasEntryPoint(): boolean {
    return (
      (this.getEntity1().isGroup() === false && this.getEntity1().getEntityPosition() !== EntityPosition.NORMAL) ||
      (this.getEntity2().isGroup() === false && this.getEntity2().getEntityPosition() !== EntityPosition.NORMAL)
    );
  }

  /** @see abel/Link.java:443-448 */
  hasTwoEntryPointsSameContainer(): boolean {
    return (
      this.getEntity1().isGroup() === false &&
      this.getEntity2().isGroup() === false &&
      this.getEntity1().getEntityPosition() !== EntityPosition.NORMAL &&
      this.getEntity2().getEntityPosition() !== EntityPosition.NORMAL &&
      this.getEntity1().getParentContainer() === this.getEntity2().getParentContainer()
    );
  }

  /** @see abel/Link.java:450-452 */
  getUrl(): Url | undefined {
    return this.url;
  }

  /** @see abel/Link.java:454-456 */
  setUrl(url: Url | undefined): void {
    this.url = url;
  }

  /** @see abel/Link.java:458-460 */
  isHidden(): boolean {
    return this.hidden || this.cl1.isHidden() || this.cl2.isHidden();
  }

  /** ADR-3's dedup keystone — VERBATIM semantics: reference identity on
   * both entities, in either direction. The T11 shared-dedup contract.
   * @see abel/Link.java:462-470 */
  sameConnections(other: Link): boolean {
    if (this.cl1 === other.cl1 && this.cl2 === other.cl2) return true;

    if (this.cl1 === other.cl2 && this.cl2 === other.cl1) return true;

    return false;
  }

  /** @see abel/Link.java:472-486 */
  doesTouch(other: Link): boolean {
    if (this.cl1 === other.cl1) return true;

    if (this.cl1 === other.cl2) return true;

    if (this.cl2 === other.cl1) return true;

    if (this.cl2 === other.cl2) return true;

    return false;
  }

  /** @see abel/Link.java:488-490 */
  isAutolink(): boolean {
    return this.cl1 === this.cl2;
  }

  /** @see abel/Link.java:492-498 */
  isRemoved(): boolean {
    const stereotype = this.getStereotype();
    if (stereotype !== undefined && this.cucaDiagram.isStereotypeRemoved(stereotype)) return true;

    return this.cl1.isRemoved() || this.cl2.isRemoved();
  }

  /** NOTE: `Display#hasUrl` is a pre-existing ADR-8 deferral (throws) —
   * the non-null-label branch throws until it lands
   * (`.agent-notes/T5-entity-port.md`).
   * @see abel/Link.java:500-505 */
  hasUrl(): boolean {
    if (Display.isNull(this.linkArg.getLabel()) === false && this.linkArg.getLabel().hasUrl()) return true;

    return this.getUrl() !== undefined;
  }

  /** @see abel/Link.java:515-524 */
  setPortMembers(port1: string | undefined, port2: string | undefined): void {
    this.port1 = port1;
    this.port2 = port2;
    if (port1 != null) this.cl1.addPortShortName(port1);

    if (port2 != null) this.cl2.addPortShortName(port2);
  }

  /** Declared mid-file upstream (:526) — position preserved. */
  private linkConstraint: LinkConstraint | undefined;

  /** @see abel/Link.java:528-530 */
  setLinkConstraint(linkConstraint: LinkConstraint): void {
    this.linkConstraint = linkConstraint;
  }

  /** @see abel/Link.java:532-534 */
  getLinkConstraint(): LinkConstraint | undefined {
    return this.linkConstraint;
  }

  /** Declared mid-file upstream (:536) — position preserved. */
  private codeLine: LineLocation | undefined;

  /** @see abel/Link.java:538-543 */
  getCodeLine(): string | undefined {
    if (this.codeLine === undefined) return undefined;

    return String(this.codeLine.getPosition());
  }

  /** @see abel/Link.java:545-547 */
  setCodeLine(location: LineLocation): void {
    this.codeLine = location;
  }

  /** @see abel/Link.java:549-551 */
  setStereotype(stereotype: Stereotype | undefined): void {
    this.stereotype = stereotype;
  }

  /** @see abel/Link.java:553-555 */
  getStereotype(): Stereotype | undefined {
    return this.stereotype;
  }

  /** @see abel/Link.java:561-563 */
  getVisibilityModifier(): VisibilityModifier | undefined {
    return this.getLinkArg().getVisibilityModifier();
  }

  /** @see abel/Link.java:565-567 */
  isOpale(): boolean {
    return this.opale;
  }

  /** @see abel/Link.java:569-571 */
  hasKal1(): boolean {
    return this.linkArg.getKal1() != null && this.linkArg.getKal1() !== '';
  }

  /** @see abel/Link.java:573-575 */
  hasKal2(): boolean {
    return this.linkArg.getKal2() != null && this.linkArg.getKal2() !== '';
  }

  /** @see abel/Link.java:577-579 */
  getLocation(): LineLocation | undefined {
    return this.location;
  }
}
