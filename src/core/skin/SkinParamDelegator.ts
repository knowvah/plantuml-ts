import type { FontParam, ISkinParamWithSimple, StyleBuilder, UFont } from '../abel/ISkinParam.js';
import type { HColor } from '../abel/Colors.js';
import type { HColorSet } from '../klimt/color/HColorSet.js';
import type { CreoleMode } from '../klimt/creole/CreoleMode.js';
import type { SheetBuilder } from '../klimt/creole/SheetBuilder.js';
import type { ClockwiseTopRightBottomLeft } from '../klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../klimt/shape/UText.js';
import type { Sprite } from '../klimt/sprite/Sprite.js';
import type { UStroke } from '../klimt/UStroke.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import type { GuillemetPair } from '../text/Guillemet.js';
import type { Pragma } from './Pragma.js';

/**
 * SkinParamDelegator — an `ISkinParam` that forwards every call to the one
 * it wraps; subclasses (`SkinParamColors`, ...) override the few members
 * they change.
 *
 * Ported slice: the constructor and the forwarding body of every member of
 * the port's `ISkinParamWithSimple` (the consumed `ISkinParam` slice plus
 * `ISkinSimple` and `getIHtmlColorSet`). The remaining ~45 forwarders
 * (`getHtmlColor`, `shadowing`, `getRankdir`, ...) forward members the
 * port's `ISkinParam` slice does not declare yet; each lands with the
 * slice member it forwards.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParamDelegator.java:73-489
 */
export class SkinParamDelegator implements ISkinParamWithSimple {
  /** @see SkinParamDelegator.java:75 */
  private readonly skinParam: ISkinParamWithSimple;

  /** @see SkinParamDelegator.java:77-79 */
  constructor(skinParam: ISkinParamWithSimple) {
    this.skinParam = skinParam;
  }

  /** @see SkinParamDelegator.java:82-84 */
  getHyperlinkColor(): HColor {
    return this.skinParam.getHyperlinkColor();
  }

  /** Forwards `false`, not `inPackageTitle` — upstream's own body. @see SkinParamDelegator.java:97-99 */
  getFont(stereotype: Stereotype | undefined, _inPackageTitle: boolean, ...fontParam: FontParam[]): UFont {
    return this.skinParam.getFont(stereotype, false, ...fontParam);
  }

  /** @see SkinParamDelegator.java:102-104 */
  getFontHtmlColor(stereotype: Stereotype | undefined, ...param: FontParam[]): HColor {
    return this.skinParam.getFontHtmlColor(stereotype, ...param);
  }

  /** @see SkinParamDelegator.java:112-114 */
  getValue(key: string): string | null {
    return this.skinParam.getValue(key);
  }

  /** @see SkinParamDelegator.java:122-124 */
  getDpi(): number {
    return this.skinParam.getDpi();
  }

  /** @see SkinParamDelegator.java:148-150 */
  getSprite(name: string): Sprite | null {
    return this.skinParam.getSprite(name);
  }

  /** @see SkinParamDelegator.java:198-200 */
  strictUmlStyle(): boolean {
    return this.skinParam.strictUmlStyle();
  }

  /** @see SkinParamDelegator.java:233-235 */
  getIHtmlColorSet(): HColorSet {
    return this.skinParam.getIHtmlColorSet();
  }

  /** @see SkinParamDelegator.java:238-240 */
  useUnderlineForHyperlink(): UStroke {
    return this.skinParam.useUnderlineForHyperlink();
  }

  /** @see SkinParamDelegator.java:243-245 */
  getDefaultTextAlignment(defaultValue: HorizontalAlignment): HorizontalAlignment {
    return this.skinParam.getDefaultTextAlignment(defaultValue);
  }

  /** @see SkinParamDelegator.java:248-250 */
  getPadding(): ClockwiseTopRightBottomLeft {
    return this.skinParam.getPadding();
  }

  /** @see SkinParamDelegator.java:258-260 */
  guillemet(): GuillemetPair {
    return this.skinParam.guillemet();
  }

  /** @see SkinParamDelegator.java:278-280 */
  getMonospacedFamily(): string {
    return this.skinParam.getMonospacedFamily();
  }

  /** @see SkinParamDelegator.java:288-290 */
  getTabSize(): number {
    return this.skinParam.getTabSize();
  }

  /** @see SkinParamDelegator.java:383-385 */
  copyAllFrom(other: ReadonlyMap<string, string>): void {
    this.skinParam.copyAllFrom(other);
  }

  /** @see SkinParamDelegator.java:388-390 */
  values(): ReadonlyMap<string, string> {
    return this.skinParam.values();
  }

  /** @see SkinParamDelegator.java:403-405 */
  getCurrentStyleBuilder(): StyleBuilder {
    return this.skinParam.getCurrentStyleBuilder();
  }

  /** @see SkinParamDelegator.java:438-440 */
  transformStringForSizeHack(s: string): string {
    return this.skinParam.transformStringForSizeHack(s);
  }

  /** Both upstream overloads. @see SkinParamDelegator.java:453-463 */
  sheet(
    fontConfiguration: FontConfiguration,
    horizontalAlignment: HorizontalAlignment,
    creoleMode: CreoleMode,
  ): SheetBuilder;
  sheet(
    fontConfiguration: FontConfiguration,
    horizontalAlignment: HorizontalAlignment,
    creoleMode: CreoleMode,
    stereo: FontConfiguration,
  ): SheetBuilder;
  sheet(
    fontConfiguration: FontConfiguration,
    horizontalAlignment: HorizontalAlignment,
    creoleMode: CreoleMode,
    stereo?: FontConfiguration,
  ): SheetBuilder {
    if (stereo === undefined) return this.skinParam.sheet(fontConfiguration, horizontalAlignment, creoleMode);
    return this.skinParam.sheet(fontConfiguration, horizontalAlignment, creoleMode, stereo);
  }

  /** @see SkinParamDelegator.java:470-472 */
  getPragma(): Pragma {
    return this.skinParam.getPragma();
  }

  /** @see SkinParamDelegator.java:485-487 */
  getFromMd5(md5: string): string | null {
    return this.skinParam.getFromMd5(md5);
  }
}
