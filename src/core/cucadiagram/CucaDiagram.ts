import { CucaDiagramBase2 } from './CucaDiagramBase2.js';
import { Entity } from '../abel/Entity.js';
import type { EntityFactory } from '../abel/EntityFactory.js';
import type { GroupType } from '../abel/GroupType.js';
import { LeafType } from '../abel/LeafType.js';
import type { Link } from '../abel/Link.js';
import type { ISkinParam } from '../abel/ISkinParam.js';
import type { Quark } from '../plasma/Quark.js';
import type { Bodier } from './Bodier.js';
import { BodierJSon } from './BodierJSon.js';
import { BodierMap } from './BodierMap.js';
import { BodyFactory } from './BodyFactory.js';
import type { GroupHierarchy } from './GroupHierarchy.js';
import type { PortionShower } from './PortionShower.js';
import { LinkConstraint } from './LinkConstraint.js';
import { Magma } from './Magma.js';
import { MagmaList } from './MagmaList.js';
import type { Display } from '../klimt/creole/Display.js';
import { ClockwiseTopRightBottomLeft } from '../klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import type { LineLocation } from '../tim/LineLocation.js';
import { CommandExecutionResult } from '../command/CommandExecutionResult.js';

export type { DiagramType, Previous, UmlSource } from '../TitledDiagram.js';

/**
 * InstallationRequirement — what a diagram needs installed to render.
 * SI1/T10 consumed-slice LOCAL declaration of the 3-value
 * `core/InstallationRequirement.java` enum (the T5 `DiagramType`
 * precedent — the `core/` package port should move it).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/InstallationRequirement.java:38-42
 */
export const InstallationRequirement = {
  NONE: 'NONE',
  ELK_LIBRARY_REQUIRED: 'ELK_LIBRARY_REQUIRED',
  GRAPHVIZ_ENGINE_REQUIRED: 'GRAPHVIZ_ENGINE_REQUIRED',
} as const;
export type InstallationRequirement = (typeof InstallationRequirement)[keyof typeof InstallationRequirement];

/**
 * CucaDiagram — the shared base of the whole cuca diagram family
 * (class/object/description/state), owning the quark namespace, the
 * entity factory, the group stack, the link list with its `-[single]->`
 * dedup (ADR-3), and the hide/show/remove machinery.
 *
 * SI1/T10 — full port of `net/atmp/CucaDiagram.java` (953 ln; NOTE the
 * net/atmp home, outside net/sourceforge/plantuml), replacing the
 * T5/T6 consumed-interface stub `abel/CucaDiagram.ts` (every stub
 * signature is preserved across the segments). The class body is split
 * across THREE files solely for this repo's 500-line cap
 * (`CucaDiagramBase.ts` carries :111-395 and the split rationale;
 * `CucaDiagramBase2.ts` carries :397-644); this file carries
 * :646-953. Supertype boundary per ADR-2: extends the minimal consumed
 * `TitledDiagram` slice (`src/core/TitledDiagram.ts`, boundary
 * journaled there); implements the three DotData bridge contracts
 * (`GroupHierarchy`/`PortionShower`/`EntityFactory`) IN FULL.
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:109
 */
export abstract class CucaDiagram extends CucaDiagramBase2 implements GroupHierarchy, PortionShower, EntityFactory {
  /** @see net/atmp/CucaDiagram.java:646-652 */
  isStandalone(ent: Entity): boolean {
    for (const link of this.getLinks()) if (link.getEntity1() === ent || link.getEntity2() === ent) return false;

    return true;
  }

  /** @see net/atmp/CucaDiagram.java:654-663 */
  isStandaloneForArgo(ent: Entity): boolean {
    for (const link of this.getLinks()) {
      if (link.isHidden() || link.isInvis()) continue;
      if (link.getEntity1() === ent || link.getEntity2() === ent) return false;
    }

    return true;
  }

  /** @see net/atmp/CucaDiagram.java:665-674 */
  getLastLink(): Link | undefined {
    const links = this.getLinks();
    for (let i = links.length - 1; i >= 0; i--) {
      const link = links[i] as Link;
      if (link.getEntity1().getLeafType() !== LeafType.NOTE && link.getEntity2().getLeafType() !== LeafType.NOTE)
        return link;
    }
    return undefined;
  }

  /** Java returns `Collections.unmodifiableList` when two are found,
   * `null` otherwise → `readonly Link[] | undefined`.
   * @see net/atmp/CucaDiagram.java:676-689 */
  getTwoLastLinks(): readonly Link[] | undefined {
    const result: Link[] = [];
    const links = this.getLinks();
    for (let i = links.length - 1; i >= 0; i--) {
      const link = links[i] as Link;
      if (link.getEntity1().getLeafType() !== LeafType.NOTE && link.getEntity2().getLeafType() !== LeafType.NOTE) {
        result.push(link);
        if (result.length === 2) return result;
      }
    }
    return undefined;
  }

  /** @see net/atmp/CucaDiagram.java:691-693 */
  getLastEntity(): Entity | undefined {
    return this.lastEntity;
  }

  /** @see net/atmp/CucaDiagram.java:695-722 */
  applySingleStrategy(): void {
    const magmaList = new MagmaList();

    const groups = this.groupsAndRoot();
    for (const g of groups) {
      const standalones: Entity[] = [];

      for (const ent of g.leafs()) if (this.isStandalone(ent)) standalones.push(ent);

      if (standalones.length < 3) continue;

      const magma = new Magma(this, standalones);
      magma.putInSquare();
      magmaList.add(magma);
    }

    for (const g of groups) {
      const magmas = magmaList.getMagmas(g);
      if (magmas.size() < 3) continue;

      magmas.putInSquare();
    }
  }

  /** @see net/atmp/CucaDiagram.java:724-726 */
  isHideEmptyDescriptionForState(): boolean {
    return false;
  }

  /** @see net/atmp/CucaDiagram.java:728-733 */
  constraintOnLinks(link1: Link, link2: Link, display: Display): CommandExecutionResult {
    const linkConstraint = new LinkConstraint(link1, link2, display);
    link1.setLinkConstraint(linkConstraint);
    link2.setLinkConstraint(linkConstraint);
    return CommandExecutionResult.ok();
  }

  /** @see net/atmp/CucaDiagram.java:735-739 */
  override getDefaultMargins(): ClockwiseTopRightBottomLeft {
    // Strange numbers here for backwards compatibility
    return ClockwiseTopRightBottomLeft.topRightBottomLeft(0, 5, 5, 0);
  }

  /** `cpt1.addAndGet(1)` — the same counter feeds `getUniqueSequence`.
   * @see net/atmp/CucaDiagram.java:741-743 */
  getUniqueSequenceValue(): number {
    return ++this.cpt1;
  }

  /** @see net/atmp/CucaDiagram.java:745-747 */
  getUniqueSequence(prefix: string): string {
    return prefix + String(++this.cpt1);
  }

  /** @see net/atmp/CucaDiagram.java:749-751 */
  getUniqueSequence2(prefix: string): string {
    return prefix + String(++this.cpt2);
  }

  // Coming from EntityFactory

  /** @see net/atmp/CucaDiagram.java:755-761 */
  isStereotypeRemoved(stereotype: Stereotype): boolean {
    let result = false;
    for (const hide of this.removed) result = hide.apply(result, stereotype);

    return result;
  }

  /** @see net/atmp/CucaDiagram.java:763-776 */
  isHidden(leaf: Entity): boolean {
    if (leaf.isRoot()) return false;

    const other = this.isNoteWithSingleLinkAttachedTo(leaf);
    if (other !== undefined && other !== leaf) return this.isHidden(other);

    let hidden = false;
    for (const hide of this.hides2) hidden = hide.apply(hidden, leaf);

    return hidden;
  }

  /** @see net/atmp/CucaDiagram.java:778-791 */
  isRemoved(leaf: Entity): boolean {
    if (leaf.isRoot()) return false;

    const other = this.isNoteWithSingleLinkAttachedTo(leaf);
    if (other !== undefined) return this.isRemoved(other);

    let result = false;
    for (const hide of this.removed) result = hide.apply(result, leaf);

    return result;
  }

  /** The `TeaVM.a()`-gated assert is dropped (T5 precedent).
   * @see net/atmp/CucaDiagram.java:793-813 */
  private isNoteWithSingleLinkAttachedTo(note: Entity): Entity | undefined {
    if (note.getLeafType() !== LeafType.NOTE) return undefined;
    let other: Entity | undefined = undefined;
    for (const link of this.getLinks()) {
      if (link.getType().isInvisible()) continue;
      if (link.contains(note) === false) continue;
      if (other !== undefined) return undefined;
      other = link.getOther(note);
      if (other.getLeafType() === LeafType.NOTE) return undefined;
    }
    return other;
  }

  /** @see net/atmp/CucaDiagram.java:815-822 */
  isRemovedIgnoreUnlinked(leaf: Entity): boolean {
    let result = false;
    for (const hide of this.removed) if (hide.isAboutUnlinked() === false) result = hide.apply(result, leaf);

    return result;
  }

  /** `Objects.requireNonNull(entityType)` → one explicit throw (T6's
   * Link-constructor convention); the MAP/JSON branches construct
   * their dedicated bodiers, everything else goes through
   * `BodyFactory.createLeaf` (the T9 seam, `bodyFactoryCreateLeaf`
   * below). The `Entity` constructor call is T5's merged 8-param form
   * with `undefined` in the groupType slot (T5 note).
   * @see net/atmp/CucaDiagram.java:824-838 */
  createLeaf(
    location: LineLocation | undefined,
    quark: Quark<Entity>,
    diagram: CucaDiagram,
    entityType: LeafType,
    hideVisibilityModifier: ReadonlySet<VisibilityModifier>,
  ): Entity {
    if (entityType == null) throw new Error('NullPointerException');
    let bodier: Bodier;
    if (entityType === LeafType.MAP) bodier = new BodierMap();
    else if (entityType === LeafType.JSON) bodier = new BodierJSon();
    else bodier = bodyFactoryCreateLeaf(this.getSkinParam(), entityType, hideVisibilityModifier);

    const result = new Entity(
      this.getSkinParam().getCurrentStyleBuilder(),
      location,
      quark,
      this,
      bodier,
      entityType,
      undefined,
      diagram.rawLayout,
    );
    bodier.setLeaf(result);
    return result;
  }

  /** @see net/atmp/CucaDiagram.java:840-850 */
  createGroup(location: LineLocation | undefined, quark: Quark<Entity>, groupType: GroupType): Entity {
    if (groupType == null) throw new Error('NullPointerException');
    if (quark.getData() !== undefined) return quark.getData() as Entity;

    const bodier = bodyFactoryCreateGroup(this.getSkinParam());
    const result = new Entity(
      this.getSkinParam().getCurrentStyleBuilder(),
      location,
      quark,
      this,
      bodier,
      undefined,
      groupType,
      this.rawLayout,
    );

    return result;
  }

  /** @see net/atmp/CucaDiagram.java:852-863 */
  leafs(): readonly Entity[] {
    const result: Entity[] = [];
    for (const quark of this.quarks()) {
      if (quark.isRoot()) continue;
      const data = quark.getData();
      if (data !== undefined && data.isGroup() === false) result.push(data);
    }
    return result;
  }

  /** @see net/atmp/CucaDiagram.java:865-876 */
  groups(): readonly Entity[] {
    const result: Entity[] = [];
    for (const quark of this.quarks()) {
      if (quark.isRoot()) continue;

      const data = quark.getData();
      if (data !== undefined && data.isGroup()) result.push(data);
    }
    return result;
  }

  /** @see net/atmp/CucaDiagram.java:878-886 */
  groupsAndRoot(): readonly Entity[] {
    const result: Entity[] = [];
    for (const quark of this.quarks()) {
      const data = quark.getData();
      if (data !== undefined && data.isGroup()) result.push(data);
    }
    return result;
  }

  /** @see net/atmp/CucaDiagram.java:888-890 */
  incRawLayout(): void {
    this.rawLayout++;
  }

  /** Upstream returns `Collections.unmodifiableList` — a LIVE
   * read-only view; the `readonly` type over the live array is the TS
   * equivalent. @see net/atmp/CucaDiagram.java:892-894 */
  getLinks(): readonly Link[] {
    return this.links;
  }

  /** ADR-3's keystone: the shared `-[single]->` add-time dedup.
   * @see net/atmp/CucaDiagram.java:896-901 */
  addLink(link: Link): void {
    if (link.isSingle() && this.containsSimilarLink(link)) return;

    this.links.push(link);
  }

  /** @see net/atmp/CucaDiagram.java:903-909 */
  private containsSimilarLink(other: Link): boolean {
    for (const link of this.links) if (other.sameConnections(link)) return true;

    return false;
  }

  /** @see net/atmp/CucaDiagram.java:911-916 */
  removeLink(link: Link): void {
    const idx = this.links.indexOf(link);
    const ok = idx !== -1;
    if (ok === false) throw new Error('IllegalArgumentException');
    this.links.splice(idx, 1);
  }

  /** @see net/atmp/CucaDiagram.java:918-924 */
  quarks(): readonly Quark<Entity>[] {
    const result: Quark<Entity>[] = [];
    for (const quark of this.namespace.quarks()) result.push(quark);

    return result;
  }

  /** The root quark's data is the ROOT group entity the constructor
   * creates — never absent on a constructed diagram.
   * @see net/atmp/CucaDiagram.java:926-929 */
  getRootGroup(): Entity {
    return this.root.getData() as Entity;
  }

  /** @see net/atmp/CucaDiagram.java:931-933 */
  setSeparator(namespaceSeparator: string | undefined): void {
    this.namespace.setSeparator(namespaceSeparator);
  }

  /** @see net/atmp/CucaDiagram.java:935-937 */
  firstWithName(full: string): Quark<Entity> | undefined {
    return this.namespace.firstWithName(full);
  }

  /** @see net/atmp/CucaDiagram.java:939-941 */
  countByName(full: string): number {
    return this.namespace.countByName(full);
  }

  /** @see net/atmp/CucaDiagram.java:943-951 */
  getInstallationRequirement(): InstallationRequirement {
    if (this.isUseElk()) return InstallationRequirement.ELK_LIBRARY_REQUIRED;
    else if (this.isUseSmetana()) return InstallationRequirement.NONE;
    else return InstallationRequirement.GRAPHVIZ_ENGINE_REQUIRED;
  }
}

/** The T9 seam: batch 4 lands `BodyFactory.createLeaf`/`createGroup`
 * (upstream cucadiagram/BodyFactory.java:58-66) in T9 PARALLEL to this
 * task, and `BodyFactory.ts` is T9's write-set. These accessors read
 * the members dynamically with the upstream signatures: once T9's
 * extension merges they dispatch to it; until then they are typed
 * ADR-2 deferred throws (journaled, T10). */
interface BodyFactoryT9Surface {
  createLeaf?: (skinParam: ISkinParam, entityType: LeafType, hides: ReadonlySet<VisibilityModifier>) => Bodier;
  createGroup?: (skinParam: ISkinParam) => Bodier;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyFactory.java:58-61 */
function bodyFactoryCreateLeaf(
  skinParam: ISkinParam,
  entityType: LeafType,
  hides: ReadonlySet<VisibilityModifier>,
): Bodier {
  const fn = (BodyFactory as unknown as BodyFactoryT9Surface).createLeaf;
  if (fn === undefined)
    throw new Error('deferred per SI1/T10: BodyFactory.createLeaf lands with T9 (cucadiagram/BodyFactory.java:58-61)');
  return fn(skinParam, entityType, hides);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyFactory.java:63-66 */
function bodyFactoryCreateGroup(skinParam: ISkinParam): Bodier {
  const fn = (BodyFactory as unknown as BodyFactoryT9Surface).createGroup;
  if (fn === undefined)
    throw new Error('deferred per SI1/T10: BodyFactory.createGroup lands with T9 (cucadiagram/BodyFactory.java:63-66)');
  return fn(skinParam);
}
