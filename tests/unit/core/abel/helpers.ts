import { Plasma } from '../../../../src/core/plasma/Plasma.js';
import type { Quark } from '../../../../src/core/plasma/Quark.js';
import { Entity } from '../../../../src/core/abel/Entity.js';
import type { CucaDiagram, DiagramType } from '../../../../src/core/abel/CucaDiagram.js';
import type { Link } from '../../../../src/core/abel/Link.js';
import type { ISkinParam, StyleBuilder, UFont, FontParam } from '../../../../src/core/abel/ISkinParam.js';
import type { HColor } from '../../../../src/core/abel/Colors.js';
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

  getUniqueSequenceValue(): number {
    this.seq += 1;
    return this.seq;
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

/** Mock of T6's Link forward interface. */
export class MockLink implements Link {
  constructor(
    private readonly e1: Entity,
    private readonly e2: Entity,
    private readonly type: LinkType = new LinkType(LinkDecor.NONE, LinkDecor.NONE),
  ) {}

  getEntity1(): Entity {
    return this.e1;
  }
  getEntity2(): Entity {
    return this.e2;
  }
  contains(entity: Entity): boolean {
    return this.e1 === entity || this.e2 === entity;
  }
  getOther(entity: Entity): Entity {
    if (this.e1 === entity) return this.e2;
    if (this.e2 === entity) return this.e1;
    throw new Error('IllegalArgumentException');
  }
  getType(): LinkType {
    return this.type;
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
