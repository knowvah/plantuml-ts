import { EntityBase } from './EntityBase.js';
import { Display } from '../klimt/creole/Display.js';
import { LeafType } from './LeafType.js';
import { GroupType } from './GroupType.js';
import { EntityPosition } from './EntityPosition.js';
import { Stereostyles } from './Stereostyles.js';
import type { Colors, HColor } from './Colors.js';
import type { ColorType } from './ColorType.js';
import type { Direction } from './Direction.js';
import type { Kal } from './Kal.js';
import type { Neighborhood } from './Neighborhood.js';
import type { IEntityImage } from './IEntityImage.js';
import { SingleStrategy } from './SingleStrategy.js';
import type { Together } from './Together.js';
import type { DisplayPositioned } from './DisplayPositioned.js';
import type { CucaDiagram, DiagramType } from '../cucadiagram/CucaDiagram.js';
import { FontParam, type ISkinParam, type StyleBuilder } from './ISkinParam.js';
import { FontConfiguration } from './FontConfiguration.js';
import { EntityImageStateCommon } from './EntityImageStateCommon.js';
import type { USymbol } from '../decoration/symbol/USymbol.js';
import { USymbols } from '../decoration/symbol/USymbols.js';
import type { PackageStyleName } from '../svek/PackageStyle.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type { LineLocation } from '../tim/LineLocation.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../klimt/shape/TextBlockUtils.js';
import type { Bag } from './Bag.js';
import type { Hideable } from './Hideable.js';
import type { Removeable } from './Removeable.js';
import type { SpecificBackcolorable } from './SpecificBackcolorable.js';
import type { LineConfigurable } from './LineConfigurable.js';
import { isPureInnerLink12, isPureInnerLink3 } from './EntityUtils.js';

/**
 * Entity — the single node type of the abel model: every leaf AND every
 * group of every cuca-family diagram is one of these, hung on a `Quark`
 * (leaf xor group discriminated by `leafType`/`groupType`).
 *
 * SI1/T5 — full port of `abel/Entity.java` (775 ln; fields :89-135).
 * The class body is split across TWO files solely for this repo's
 * 500-line cap (upstream is a single class with no file boundary to
 * split along — journaled): `EntityBase.ts` carries the fields,
 * constructor, and members :91-363; this file carries :365-773. TS
 * adaptations, each documented at its member: the merged constructor,
 * the name-keyed tag map, the `staticFlag` field name, and the
 * ADR-2-deferred style seams inside `getStateDescription`.
 * `TeaVM.a()`-gated asserts are dropped (build-target machinery; the
 * preceding throw already guards).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Entity.java:89
 */
export class Entity
  extends EntityBase
  implements SpecificBackcolorable, Hideable, Removeable, LineConfigurable, Bag
{
  /** @see abel/Entity.java:365-368 */
  getGroupType(): GroupType | undefined {
    this.checkGroup();
    return this.groupType;
  }

  /** @see abel/Entity.java:370-376 */
  getPackageStyle(): PackageStyleName | undefined {
    this.checkGroup();
    if (this.stereotype === undefined) return undefined;

    return this.stereotype.getPackageStyle();
  }

  /** @see abel/Entity.java:378-391 */
  isGroup(): boolean {
    if (this.groupType !== undefined && this.leafType !== undefined) throw new Error('IllegalStateException');

    if (this.groupType !== undefined) return true;

    if (this.leafType !== undefined) return false;

    throw new Error('IllegalStateException');
  }

  // ---- other

  /** @see abel/Entity.java:395-406 */
  overrideImage(img: IEntityImage, leafType: LeafType): void {
    this.checkGroup();
    this.svekImage = img;
    this.url = undefined;

    for (const link of [...this.diagram.getLinks()])
      if (isPureInnerLink12(this, link)) this.diagram.removeLink(link);

    this.groupType = undefined;
    this.leafType = leafType;
  }

  /** @see abel/Entity.java:408-419 */
  getUSymbol(): USymbol | undefined {
    if (this.getLeafType() === LeafType.USECASE) return USymbols.USECASE;
    if (this.getLeafType() === LeafType.USECASE_BUSINESS) return USymbols.USECASE_BUSINESS;
    // return USymbols.ACTOR_STICKMAN_BUSINESS;
    if (this.getLeafType() === LeafType.CIRCLE) return USymbols.INTERFACE;

    return this.symbol;
  }

  /** @see abel/Entity.java:421-423 */
  setUSymbol(symbol: USymbol | undefined): void {
    this.symbol = symbol;
  }

  /** @see abel/Entity.java:425-427 */
  getSingleStrategy(): SingleStrategy {
    return SingleStrategy.SQUARE;
  }

  /** @see abel/Entity.java:429-441 */
  isHidden(): boolean {
    if (this.isRoot()) return false;

    const parentContainer = this.getParentContainer();
    if (parentContainer === this) return false;

    if (parentContainer !== undefined && parentContainer.isHidden()) return true;

    return this.diagram.isHidden(this);
  }

  /** @see abel/Entity.java:443-455 */
  isRemoved(): boolean {
    if (this.isRoot()) return false;

    const parentContainer = this.getParentContainer();
    if (parentContainer === this) return false;

    if (parentContainer !== undefined && parentContainer.isRemoved()) return true;

    return this.diagram.isRemoved(this);
  }

  /** @see abel/Entity.java:457-476 */
  isAloneAndUnlinked(): boolean {
    if (this.isGroup()) {
      for (const quarkChild of this.getQuark().getChildren()) {
        const child = quarkChild.getData();
        // Java dereferences unconditionally (a data-less quark would NPE).
        if (child !== undefined && child.isAloneAndUnlinked() === false) return false;
      }
      return true;
    }

    for (const link of this.diagram.getLinks())
      if (link.contains(this)) {
        const other = link.getOther(this);
        const removed = this.diagram.isRemovedIgnoreUnlinked(other);
        if (removed === false && link.getType().isInvisible() === false) return false;
      }

    return true;
  }

  /** @see abel/Entity.java:478-480 */
  private getTitleFontParam(): FontParam {
    return this.getGroupType() === GroupType.STATE ? FontParam.STATE : FontParam.PACKAGE;
  }

  /** @see abel/Entity.java:482-489 */
  getFontConfigurationForTitle(skinParam: ISkinParam): FontConfiguration {
    const fontParam = this.getTitleFontParam();
    const fontHtmlColor = skinParam.getFontHtmlColor(this.getStereotype(), fontParam, FontParam.PACKAGE);
    const font = skinParam.getFont(this.getStereotype(), true, fontParam, FontParam.PACKAGE);
    const fontConfiguration = FontConfiguration.create(
      font,
      fontHtmlColor,
      skinParam.getHyperlinkColor(),
      skinParam.useUnderlineForHyperlink(),
      skinParam.getTabSize(),
    );
    return fontConfiguration;
  }

  /** @see abel/Entity.java:491-493 */
  getRawLayout(): number {
    return this.rawLayout;
  }

  /** @see abel/Entity.java:495-497 */
  getConcurrentSeparator(): string {
    return this.concurrentSeparator;
  }

  /** @see abel/Entity.java:499-501 */
  setConcurrentSeparator(separator: string): void {
    this.concurrentSeparator = separator;
  }

  /** @see abel/Entity.java:503-505 */
  setNeighborhood(neighborhood: Neighborhood): void {
    this.neighborhood = neighborhood;
  }

  /** @see abel/Entity.java:507-509 */
  getNeighborhood(): Neighborhood | undefined {
    return this.neighborhood;
  }

  /** @see abel/Entity.java:511-513 */
  putTip(member: string, display: Display): void {
    this.tips.set(member, display);
  }

  /** @see abel/Entity.java:515-517 */
  getTips(): ReadonlyMap<string, Display> {
    return this.tips;
  }

  /** @see abel/Entity.java:519-521 */
  getColors(): Colors {
    return this.colors;
  }

  /** @see abel/Entity.java:523-525 */
  setColors(colors: Colors): void {
    this.colors = colors;
  }

  /** @see abel/Entity.java:527-531 */
  setSpecificColorTOBEREMOVED(type: ColorType, color: HColor | undefined): void {
    if (color !== undefined) this.colors = this.colors.add(type, color);
  }

  /** @see abel/Entity.java:533-536 */
  getPortShortNames(): ReadonlySet<string> {
    this.checkNotGroup();
    return this.portShortNames;
  }

  /** @see abel/Entity.java:538-540 */
  addPortShortName(portShortName: string): void {
    this.portShortNames.add(portShortName);
  }

  /** @see abel/Entity.java:542-545 */
  setVisibilityModifier(visibility: VisibilityModifier): void {
    this.visibility = visibility;
  }

  /** @see abel/Entity.java:547-549 */
  getVisibilityModifier(): VisibilityModifier | undefined {
    return this.visibility;
  }

  /** @see abel/Entity.java:551-554 */
  setLegend(legend: DisplayPositioned): void {
    this.checkGroup();
    this.legend = legend;
  }

  /** @see abel/Entity.java:556-558 */
  getLegend(): DisplayPositioned | undefined {
    return this.legend;
  }

  /** @see abel/Entity.java:571-573 */
  setStereostyle(stereo: string): void {
    this.stereostyles = Stereostyles.build(stereo);
  }

  /** @see abel/Entity.java:575-577 */
  getStereostyles(): Stereostyles {
    return this.stereostyles;
  }

  /** @see abel/Entity.java:579-587 */
  addKal(kal: Kal): void {
    const position = kal.getPosition();
    let list = this.kals.get(position);
    if (list === undefined) {
      list = [];
      this.kals.set(position, list);
    }
    list.push(kal);
  }

  /** @see abel/Entity.java:589-594 */
  getKals(position: Direction): readonly Kal[] {
    const result = this.kals.get(position);
    if (result === undefined) return [];
    return result;
  }

  /** @see abel/Entity.java:596-598 */
  getDiagram(): CucaDiagram {
    return this.diagram;
  }

  /** @see abel/Entity.java:600-602 */
  setStatic(isStatic: boolean): void {
    this.staticFlag = isStatic;
  }

  /** @see abel/Entity.java:604-606 */
  isStatic(): boolean {
    return this.staticFlag;
  }

  // For group

  /**
   * Faithful body up to the style/render seam. The opening
   * `EntityImageStateCommon.getStyleStateDescription` call is an ADR-2
   * deferred stub (throws today), and the terminal upstream line
   * `display.create(fontConfiguration, horizontalAlignment, skinParam)`
   * needs the ADR-9 `AtomOps` render seam this layer does not hold —
   * it is replaced by a deferred throw until the style slice lands.
   * Journaled (T5).
   *
   * @see abel/Entity.java:610-633
   */
  getStateDescription(skinParam: ISkinParam): TextBlock {
    this.checkGroup();
    const style = EntityImageStateCommon.getStyleStateDescription(
      this.getStereotype(),
      skinParam.getCurrentStyleBuilder(),
    );
    const details = this.getBodier().getRawBody();

    // Upstream `new TextBlockEmpty()` — 0×0, same as TextBlockUtils.empty(0, 0).
    if (details.length === 0) return TextBlockUtils.empty(0, 0);

    if (style === undefined) throw new Error('IllegalArgumentException');
    const fontConfiguration = FontConfiguration.create(skinParam, style);

    let display: Display | undefined = undefined;
    for (const s of details)
      if (display === undefined) display = Display.getWithNewlines(skinParam.getPragma(), s);
      else display = display.addAll(Display.getWithNewlines(skinParam.getPragma(), s));

    const horizontalAlignment = style.getHorizontalAlignment();
    void fontConfiguration;
    void horizontalAlignment;
    void display;
    throw new Error(
      'deferred per SI1/ADR-2: Entity.getStateDescription needs the Display render seam (display.create(fontConfiguration, horizontalAlignment, skinParam)) not yet ported',
    );
  }

  /** Parameter widened to `| undefined` by T10: Java's is nullable and
   * `CucaDiagram#reallyCreateLeaf` passes `currentTogether()` (null
   * outside a `together` block). @see abel/Entity.java:635-637 */
  setTogether(together: Together | undefined): void {
    this.together = together;
  }

  /** @see abel/Entity.java:639-641 */
  getTogether(): Together | undefined {
    return this.together;
  }

  /** @see abel/Entity.java:643-647 */
  getParentContainer(): Entity | undefined {
    if (this.quark.isRoot()) return undefined;
    return this.quark.getParent()?.getData();
  }

  /** @see abel/Entity.java:649-657 */
  leafs(): readonly Entity[] {
    const result: Entity[] = [];
    for (const child of this.quark.getChildren()) {
      const data = child.getData();
      if (data !== undefined && data.isGroup() === false) result.push(data);
    }
    return result;
  }

  /** @see abel/Entity.java:659-667 */
  groups(): readonly Entity[] {
    const result: Entity[] = [];
    for (const child of this.quark.getChildren()) {
      const data = child.getData();
      if (data !== undefined && data.isGroup()) result.push(data);
    }
    return result;
  }

  /** @see abel/Entity.java:669-671 */
  countChildren(): number {
    return this.getQuark().countChildren();
  }

  /** @see abel/Entity.java:673-675 */
  isRoot(): boolean {
    return this.getQuark().isRoot();
  }

  /** @see abel/Entity.java:677-684 */
  isEmpty(): boolean {
    for (const quarkChild of this.getQuark().getChildren()) {
      const child = quarkChild.getData();
      // Java dereferences `child` unconditionally (data-less quark would NPE).
      if (child !== undefined && this.diagram.isRemoved(child) === false) return false;
    }
    return true;
  }

  /** @see abel/Entity.java:686-688 */
  getName(): string {
    return this.getQuark().getName();
  }

  /** @see abel/Entity.java:690-715 */
  isAutarkic(): boolean {
    if (this.getGroupType() === GroupType.PACKAGE) return false;

    if (this.getGroupType() === GroupType.INNER_ACTIVITY) return true;

    if (this.getGroupType() === GroupType.CONCURRENT_ACTIVITY) return true;

    if (this.getGroupType() === GroupType.CONCURRENT_STATE) return true;

    for (const link of this.diagram.getLinks()) if (isPureInnerLink3(this, link) === false) return false;

    for (const leaf of this.leafs()) if (leaf.getEntityPosition() !== EntityPosition.NORMAL) return false;

    return true;
  }

  /** @see abel/Entity.java:717-733 */
  canBePacked(): boolean {
    if (this.isPacked()) return false;
    if (this.countChildren() !== 1) return false;
    if (this.leafs().length !== 0) return false;
    for (const link of this.diagram.getLinks()) if (link.contains(this)) return false;

    const child = this.groups()[0];
    // Java `groups().iterator().next()` throws when empty.
    if (child === undefined) throw new Error('NoSuchElementException');
    if (child.countChildren() === 0) return false;

    return true;
  }

  /** Upstream ignores the parameter and always sets `true` — preserved.
   * @see abel/Entity.java:735-737 */
  setPacked(packed: boolean): void {
    void packed;
    this.packed = true;
  }

  /** @see abel/Entity.java:739-741 */
  isPacked(): boolean {
    return this.packed;
  }

  /** @see abel/Entity.java:743-745 */
  getSkinParam(): ISkinParam {
    return this.diagram.getSkinParam();
  }

  /** @see abel/Entity.java:747-749 */
  getDiagramType(): DiagramType {
    return this.diagram.getDiagramType();
  }

  /** @see abel/Entity.java:751-753 */
  getLocation(): LineLocation | undefined {
    return this.location;
  }

  /** See https://github.com/plantuml/plantuml/issues/2171 for background
   * (upstream's own comment): with a `skinparam` directive in play the
   * latest builder from SkinParam wins; otherwise the builder captured
   * at creation supports local styles.
   * @see abel/Entity.java:755-768 */
  getCurrentStyleBuilder(): StyleBuilder {
    if (this.diagram.isSkinParamUsed()) return this.getSkinParam().getCurrentStyleBuilder();

    return this.currentStyleBuilder;
  }

  /** Return widened to `string | undefined` with the `Bodier` interface's
   * T7 correction (upstream returns `null` when the body is empty —
   * BodierAbstract.java:68-86).
   * @see abel/Entity.java:770-773 */
  getBestMatch(candidate: string): string | undefined {
    return this.bodier.getBestMatch(candidate);
  }
}
