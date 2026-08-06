import type { CucaDiagram } from '../cucadiagram/CucaDiagram.js';
import type { Entity } from './Entity.js';
import type { LinkArg } from './LinkArg.js';
import type { CucaNote } from './CucaNote.js';
import type { Hideable } from './Hideable.js';
import type { Removeable } from './Removeable.js';
import type { Bibliotekon } from './Bibliotekon.js';
import type { StyleBuilder } from './ISkinParam.js';
import { LinkArrow } from './LinkArrow.js';
import { LinkStrategy } from './LinkStrategy.js';
import { isNormal, usePortP } from './EntityPosition.js';
import { EntityPort } from './EntityPort.js';
import { LinkType } from '../decoration/LinkType.js';
import { LinkDecor } from '../decoration/LinkDecor.js';
import { WithLinkType } from '../decoration/WithLinkType.js';
import { USymbolInterface } from '../decoration/symbol/USymbolInterface.js';
import { UComment } from '../klimt/shape/UComment.js';
import { PragmaKey } from '../skin/PragmaKey.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import type { Url } from '../url/Url.js';
import type { LineLocation } from '../tim/LineLocation.js';

/** `cli/GlobalConfig.java:45` — a compile-time `false` constant
 * (`LinkDecor.ts` precedent); typed `boolean` so the guarded branch in
 * `getType` stays compiled, as upstream. */
export const USE_INTERFACE_EYE1: boolean = false;

/**
 * LinkBase — the first half of `abel/Link.java` (fields :67-99,
 * constructor :123-143, members :101-121 and :158-326 plus the
 * `constraint`/`sametail` accessors its own methods call), split from
 * `Link.ts` for the 500-line file cap exactly as `EntityBase.ts`/
 * `Entity.ts` split `Entity.java`. Fields are `protected` so the
 * `Link.ts` half (getInv, sameConnections, …) reaches them; upstream
 * they are private on the single class.
 *
 * SI1/T6.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Link.java:65
 */
export abstract class LinkBase extends WithLinkType implements Hideable, Removeable {
  /** Implemented in the `Link.ts` half (:458-460) — abstract here so the
   * split base still satisfies `Hideable`. */
  abstract isHidden(): boolean;

  /** Implemented in the `Link.ts` half (:492-498) — abstract here so the
   * split base still satisfies `Removeable`. */
  abstract isRemoved(): boolean;

  /** @see abel/Link.java:67-69 */
  getStyleBuilder(): StyleBuilder {
    return this.styleBuilder;
  }

  /** @see abel/Link.java:71-99 (fields) */
  protected readonly cl1: Entity;
  protected readonly cl2: Entity;

  protected port1: string | undefined;
  protected port2: string | undefined;

  protected readonly linkArg: LinkArg;

  protected readonly uid: string;

  protected note: CucaNote | undefined;

  protected invis = false;
  protected weight = 1.0;

  protected constraint = true;
  protected inverted = false;
  protected linkArrow: LinkArrow = LinkArrow.NONE_OR_SEVERAL;

  protected opale = false;
  protected horizontalSolitary = false;
  protected sametail: string | undefined;
  protected readonly styleBuilder: StyleBuilder;
  protected stereotype: Stereotype | undefined;
  protected readonly cucaDiagram: CucaDiagram;

  protected readonly location: LineLocation | undefined;

  protected url: Url | undefined;

  /** @see abel/Link.java:101-104 */
  getLinkStrategy(): LinkStrategy {
    // return LinkStrategy.LEGACY;
    return LinkStrategy.SIMPLEST;
  }

  /** Reads the raw `type` field, not `getType()` — as upstream.
   * @see abel/Link.java:106-114 */
  idCommentForSvg(): string {
    if (this.type.looksLikeRevertedForSvg())
      return this.getEntity1().getName() + '-backto-' + this.getEntity2().getName();

    if (this.type.looksLikeNoDecorAtAllSvg())
      return this.getEntity1().getName() + '-' + this.getEntity2().getName();

    return this.getEntity1().getName() + '-to-' + this.getEntity2().getName();
  }

  /** @see abel/Link.java:116-121 */
  commentForSvg(): UComment {
    if (this.type.looksLikeRevertedForSvg())
      return new UComment('reverse link ' + this.getEntity1().getName() + ' to ' + this.getEntity2().getName());

    return new UComment('link ' + this.getEntity1().getName() + ' to ' + this.getEntity2().getName());
  }

  /** `Objects.requireNonNull` → explicit throws; boolean `^` → `!==`.
   * @see abel/Link.java:123-143 */
  constructor(
    location: LineLocation | undefined,
    cucaDiagram: CucaDiagram,
    styleBuilder: StyleBuilder,
    cl1: Entity,
    cl2: Entity,
    type: LinkType,
    linkArg: LinkArg,
  ) {
    super();
    if (linkArg.getLength() < 1) throw new Error('IllegalArgumentException');

    this.location = location;
    this.cucaDiagram = cucaDiagram;
    this.styleBuilder = styleBuilder;
    if (cl1 == null || cl2 == null) throw new Error('NullPointerException');
    this.cl1 = cl1;
    this.cl2 = cl2;

    this.type = type;
    this.uid = cucaDiagram.getUniqueSequence('lnk');

    this.linkArg = linkArg;

    if (cucaDiagram.getPragma().isTrue(PragmaKey.KERMOR))
      if ((isNormal(cl1.getEntityPosition()) === false) !== (isNormal(cl2.getEntityPosition()) === false))
        this.setConstraint(false);
    // #lizard forgives -- 7 PARAM mirror upstream's constructor verbatim
    // (Link.java:123-143); do-not-refactor-while-porting.
  }

  /** @see abel/Link.java:158-161 */
  goNorank(): void {
    this.setConstraint(false);
  }

  /** @see abel/Link.java:163-166 */
  getLabeldistance(): string | undefined {
    // Default in dot 1.0
    return this.getLinkArg().getLabeldistance();
  }

  /** @see abel/Link.java:168-171 */
  getLabelangle(): string | undefined {
    // Default in dot -25
    return this.getLinkArg().getLabelangle();
  }

  /** @see abel/Link.java:173-175 */
  getUid(): string {
    return this.uid;
  }

  /** @see abel/Link.java:177-182 */
  isInvis(): boolean {
    if (this.type.isInvisible()) return true;

    return this.invis;
  }

  /** @see abel/Link.java:184-186 */
  setInvis(invis: boolean): void {
    this.invis = invis;
  }

  /** @see abel/Link.java:188-196 */
  isBetween(cl1: Entity, cl2: Entity): boolean {
    if (cl1 === this.cl1 && cl2 === this.cl2) return true;

    if (cl1 === this.cl2 && cl2 === this.cl1) return true;

    return false;
  }

  /** Java's `super.toString()` reaches `Object#toString` (`class@hash`)
   * — diagnostic-only; the class name stands in.
   * @see abel/Link.java:198-201 */
  toString(): string {
    return `${this.constructor.name} {${this.linkArg.getLength()}} ${String(this.cl1)}-->${String(this.cl2)}`;
  }

  /** @see abel/Link.java:203-205 */
  getEntity1(): Entity {
    return this.cl1;
  }

  /** @see abel/Link.java:207-209 */
  getEntity2(): Entity {
    return this.cl2;
  }

  /** @see abel/Link.java:211-213 */
  getPortName1(): string | undefined {
    return this.port1;
  }

  /** @see abel/Link.java:215-217 */
  getPortName2(): string | undefined {
    return this.port2;
  }

  /** @see abel/Link.java:219-221 */
  getEntityPort1(bibliotekon: Bibliotekon): EntityPort {
    return this.getEntityPort(this.cl1, this.port1, bibliotekon);
  }

  /** @see abel/Link.java:223-225 */
  getEntityPort2(bibliotekon: Bibliotekon): EntityPort {
    return this.getEntityPort(this.cl2, this.port2, bibliotekon);
  }

  /** @see abel/Link.java:227-231 */
  private getEntityPort(leaf: Entity, port: string | undefined, bibliotekon: Bibliotekon): EntityPort {
    if (usePortP(leaf.getEntityPosition())) return EntityPort.forPort(bibliotekon.getNodeUid(leaf));
    return EntityPort.create(bibliotekon.getNodeUid(leaf), port);
  }

  /** Note the upstream subtlety, preserved: under `USE_INTERFACE_EYE1`
   * the lollipop rewrite mutates `this.type` but RETURNS the value read
   * before the mutation.
   * @see abel/Link.java:233-251 */
  getType(): LinkType {
    if (this.opale) return new LinkType(LinkDecor.NONE, LinkDecor.NONE);

    if (this.getSametail() != null) return new LinkType(LinkDecor.NONE, LinkDecor.NONE);

    const result = this.type;
    if (USE_INTERFACE_EYE1) {
      if (this.isLollipopInterfaceEye(this.cl1)) this.type = this.type.withLollipopInterfaceEye1();

      if (this.isLollipopInterfaceEye(this.cl2)) this.type = this.type.withLollipopInterfaceEye2();
    }
    return result;
  }

  /** @see abel/Link.java:253-259 */
  private isReallyGroup(ent: Entity): boolean {
    if (ent.isGroup() === false) return false;

    const group = ent;
    return group.groups().length + group.leafs().length > 0;
  }

  /** @see abel/Link.java:261-270 */
  getTypePatchCluster(): LinkType {
    let result = this.getType();
    if (this.isReallyGroup(this.getEntity1())) result = result.withoutDecors2();

    if (this.isReallyGroup(this.getEntity2())) result = result.withoutDecors1();

    return result;
  }

  /** Private and callerless upstream — preserved per ADR-1.
   * @see abel/Link.java:272-286 */
  private getTypeSpecialForPrinting(): LinkType {
    if (this.opale) return new LinkType(LinkDecor.NONE, LinkDecor.NONE);

    const result = this.type;
    if (USE_INTERFACE_EYE1) {
      if (this.isLollipopInterfaceEye(this.cl1)) this.type = this.type.withLollipopInterfaceEye1();

      if (this.isLollipopInterfaceEye(this.cl2)) this.type = this.type.withLollipopInterfaceEye2();
    }
    return result;
  }

  /** @see abel/Link.java:288-290 */
  private isLollipopInterfaceEye(ent: Entity): boolean {
    return ent.getUSymbol() instanceof USymbolInterface;
  }

  /** @see abel/Link.java:296-298 */
  getLength(): number {
    return this.getLinkArg().getLength();
  }

  /** @see abel/Link.java:300-302 */
  setLength(length: number): void {
    this.getLinkArg().setLength(length);
  }

  /** Lives in this half because {@link goNorank} and the constructor
   * call it (upstream position :403-409).
   * @see abel/Link.java:403-405 */
  isConstraint(): boolean {
    return this.constraint;
  }

  /** @see abel/Link.java:407-409 */
  setConstraint(constraint: boolean): void {
    this.constraint = constraint;
  }

  /** Lives in this half because {@link getType} calls it (upstream
   * position :507-513).
   * @see abel/Link.java:507-509 */
  getSametail(): string | undefined {
    return this.sametail;
  }

  /** @see abel/Link.java:511-513 */
  setSametail(sametail: string | undefined): void {
    this.sametail = sametail;
  }

  /** @see abel/Link.java:557-559 */
  getLinkArg(): LinkArg {
    return this.linkArg;
  }
}
