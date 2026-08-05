import { Plasma } from '../../../../src/core/plasma/Plasma.js';
import type { Quark } from '../../../../src/core/plasma/Quark.js';
import { Entity } from '../../../../src/core/abel/Entity.js';
import type { CucaDiagram, DiagramType } from '../../../../src/core/abel/CucaDiagram.js';
import { Link } from '../../../../src/core/abel/Link.js';
import { LinkArg } from '../../../../src/core/abel/LinkArg.js';
import type { ISkinParam, StyleBuilder, UFont, FontParam } from '../../../../src/core/abel/ISkinParam.js';
import type { HColor } from '../../../../src/core/abel/Colors.js';
import type { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { Bodier } from '../../../../src/core/cucadiagram/Bodier.js';
import type { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import { LeafType } from '../../../../src/core/abel/LeafType.js';
import { GroupType } from '../../../../src/core/abel/GroupType.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { LinkType } from '../../../../src/core/decoration/LinkType.js';
import { LinkDecor } from '../../../../src/core/decoration/LinkDecor.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';

/** Mock of T10's CucaDiagram consumed interface. */
export class MockDiagram implements CucaDiagram {
  private seq = 0;
  readonly links: Link[] = [];
  readonly hidden = new Set<Entity>();
  readonly removed = new Set<Entity>();
  readonly removedIgnoreUnlinked = new Set<Entity>();
  skinParam: ISkinParam | undefined;
  diagramType: DiagramType = 'CLASS';
  skinParamUsed = false;

  pragma: Pragma = Pragma.createEmpty();
  readonly stereotypeRemoved = new Set<Stereotype>();

  getUniqueSequenceValue(): number {
    this.seq += 1;
    return this.seq;
  }
  /** Same counter as getUniqueSequenceValue — upstream's shared `cpt1`. */
  getUniqueSequence(prefix: string): string {
    this.seq += 1;
    return prefix + String(this.seq);
  }
  getPragma(): Pragma {
    return this.pragma;
  }
  isStereotypeRemoved(stereotype: Stereotype): boolean {
    return this.stereotypeRemoved.has(stereotype);
  }
  getLinks(): readonly Link[] {
    return this.links;
  }
  removeLink(link: Link): void {
    const idx = this.links.indexOf(link);
    if (idx !== -1) this.links.splice(idx, 1);
  }
  isHidden(leaf: Entity): boolean {
    return this.hidden.has(leaf);
  }
  isRemoved(leaf: Entity): boolean {
    return this.removed.has(leaf);
  }
  isRemovedIgnoreUnlinked(leaf: Entity): boolean {
    return this.removedIgnoreUnlinked.has(leaf);
  }
  getSkinParam(): ISkinParam {
    if (this.skinParam === undefined) throw new Error('MockDiagram: no skinParam configured');
    return this.skinParam;
  }
  getDiagramType(): DiagramType {
    return this.diagramType;
  }
  isSkinParamUsed(): boolean {
    return this.skinParamUsed;
  }
}

/** Mock of T7's Bodier contract. */
export class MockBodier implements Bodier {
  rawBody: readonly string[] = [];
  urlFlag = false;
  fields: Display = Display.empty();
  methods: Display = Display.empty();
  muteClassToObjectCalls = 0;

  setLeaf(): void {}
  getFieldsToDisplay(): Display {
    return this.fields;
  }
  getMethodsToDisplay(): Display {
    return this.methods;
  }
  addFieldOrMethod(): boolean {
    return true;
  }
  getBody(): never {
    throw new Error('MockBodier.getBody not implemented');
  }
  getRawBody(): readonly string[] {
    return this.rawBody;
  }
  muteClassToObject(): void {
    this.muteClassToObjectCalls += 1;
  }
  hasUrl(): boolean {
    return this.urlFlag;
  }
  getBestMatch(candidate: string): string {
    return `match:${candidate}`;
  }
}

/** T6: the Link forward interface became the real class, whose private
 * state a hand-rolled mock can no longer satisfy — MockLink is now a
 * thin real-Link subclass keeping the old (e1, e2, type?) call sites
 * compiling. Its diagram is a throwaway MockDiagram (uid sequence per
 * link), matching the old mock's isolation. */
export class MockLink extends Link {
  constructor(e1: Entity, e2: Entity, type: LinkType = new LinkType(LinkDecor.NONE, LinkDecor.NONE)) {
    super(undefined, new MockDiagram(), { mock: 'styleBuilder' }, e1, e2, type, LinkArg.noDisplay(1));
  }
}

/** Mock of the ADR-2 ISkinParam consumed slice; records what was asked. */
export class MockSkinParam implements ISkinParam {
  readonly fontHtmlColorCalls: Array<readonly FontParam[]> = [];
  readonly fontCalls: Array<{ inGroup: boolean; params: readonly FontParam[] }> = [];
  readonly fontHtmlColor: HColor = { mock: 'fontHtmlColor' };
  readonly font: UFont = { mock: 'font' };
  readonly hyperlinkColor: HColor = { mock: 'hyperlinkColor' };
  readonly underline = UStroke.simple();
  readonly styleBuilder: StyleBuilder = { mock: 'styleBuilder' };

  getFontHtmlColor(_stereotype: Stereotype | undefined, ...param: FontParam[]): HColor {
    this.fontHtmlColorCalls.push(param);
    return this.fontHtmlColor;
  }
  getFont(_stereotype: Stereotype | undefined, inGroup: boolean, ...fontParam: FontParam[]): UFont {
    this.fontCalls.push({ inGroup, params: fontParam });
    return this.font;
  }
  getHyperlinkColor(): HColor {
    return this.hyperlinkColor;
  }
  useUnderlineForHyperlink(): UStroke {
    return this.underline;
  }
  getTabSize(): number {
    return 8;
  }
  getCurrentStyleBuilder(): StyleBuilder {
    return this.styleBuilder;
  }
  getPragma(): Pragma {
    return Pragma.createEmpty();
  }
  /** SI1/T7 consumed-slice growth — the mock echoes the default, matching
   * upstream `SkinParam`'s behavior when no skinparam sets an alignment. */
  getDefaultTextAlignment(defaultValue: HorizontalAlignment): HorizontalAlignment {
    return defaultValue;
  }
}

export interface World {
  diagram: MockDiagram;
  plasma: Plasma<Entity>;
  root: Entity;
}

/** Builds a diagram world with the ROOT group entity on the plasma root
 * (what upstream `EntityFactory`'s constructor does). */
export function makeWorld(): World {
  const diagram = new MockDiagram();
  const plasma = new Plasma<Entity>();
  const root = new Entity({}, undefined, plasma.root(), diagram, new MockBodier(), undefined, GroupType.ROOT, 0);
  return { diagram, plasma, root };
}

export function makeLeaf(
  world: World,
  name: string,
  leafType: LeafType = LeafType.CLASS,
  parent: Quark<Entity> = world.plasma.root(),
  bodier: Bodier = new MockBodier(),
): Entity {
  return new Entity({}, undefined, parent.child(name), world.diagram, bodier, leafType, undefined, 0);
}

export function makeGroup(
  world: World,
  name: string,
  groupType: GroupType = GroupType.PACKAGE,
  parent: Quark<Entity> = world.plasma.root(),
): Entity {
  return new Entity({}, undefined, parent.child(name), world.diagram, new MockBodier(), undefined, groupType, 0);
}
