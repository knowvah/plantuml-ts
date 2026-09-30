/**
 * The mindmap engine's `SkinParam` — the slice of upstream's
 * `skin/SkinParam.java` a `MindMapDiagram` reaches through
 * `TitledDiagram#getSkinParam()`: the `ISkinSimple` members the creole
 * sheets read, `getIHtmlColorSet`, the real style engine's builder
 * (`buildMindmapStyleBuilder`, decision D2) and the rankdir the
 * `MindMapDiagram` constructor and `CommandRankDir` set.
 *
 * `params` is filled from the preprocessor's skinparam map exactly as
 * `setParam` fills it (every cleaned key, trimmed value,
 * SkinParam.java:227-234); `getValue` reads it through the same
 * `cleanForKey` (java:326-340).
 *
 * Members the mindmap path never reaches (`getFontHtmlColor`, `getFont`,
 * `getHyperlinkColor`, `useUnderlineForHyperlink`,
 * `getDefaultTextAlignment`, `strictUmlStyle`) throw `unported:` rather
 * than answer a guess.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java
 */
import type { FontParam, UFont } from '../../core/abel/ISkinParam.js';
import type { HColor } from '../../core/abel/Colors.js';
import { chromeAtomOps } from '../../core/annotations/blocks-creole.js';
import type { NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import type { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../../core/klimt/creole/Parser.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import type { SheetBuilder } from '../../core/klimt/creole/SheetBuilder.js';
import { bridgeFontConfiguration } from '../../core/klimt/font/FontConfigurationBridge.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { Rankdir } from '../../core/klimt/geom/Rankdir.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { Sprite } from '../../core/klimt/sprite/Sprite.js';
import type { UStroke } from '../../core/klimt/UStroke.js';
import { getNestedDiagramRenderer } from '../../core/nested-diagram-registry.js';
import type { Pragma } from '../../core/skin/Pragma.js';
import { getSprite, type SpriteRegistry } from '../../core/sprite-registry.js';
import { cleanForKeySlow } from '../../core/style/mindmap-style-builder.js';
import { trin } from '../../core/style/parser/StyleParser.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { Stereotype } from '../../core/stereo/Stereotype.js';
import { GUILLEMET_DEFAULT, type GuillemetPair } from '../../core/text/Guillemet.js';
import type { MindMapSkinParam } from './MindMap.js';

/** `getDpi`'s default. @see SkinParam.java:651 */
const DEFAULT_DPI = 96;
/** `getTabSize`'s default. @see SkinParam.java:1097 */
const DEFAULT_TAB_SIZE = 8;
/** @see SkinParam.java:131 (`DIGITS`) */
const DIGITS = /^\d+$/;
/** @see SkinParam.java:133 (`INT_OR_DECIMAL`) */
const INT_OR_DECIMAL = /^\d+(\.\d+)?$/;

function unported(member: string): never {
  throw new Error(`unported: SkinParam#${member} is not reached by the mindmap engine`);
}

/** `{{ … }}` inside a node label — the nested-diagram slot `src/index.ts`
 *  registers per render (`nested-diagram-registry.ts`); absent only when
 *  nothing registered one (a unit test), where `EmbeddedDiagram`'s own
 *  catch turns the throw into its fallback block. */
function nestedRenderer(): NestedDiagramRenderer {
  return (
    getNestedDiagramRenderer() ?? {
      render(): TextBlock {
        throw new Error('mindmap: no nested-diagram renderer is registered');
      },
    }
  );
}

/** What {@link SkinParam} is built from. */
export interface SkinParamSource {
  /** The builder `buildMindmapStyleBuilder` produced (D2). */
  readonly styleBuilder: StyleBuilder;
  /** The preprocessor's skinparam map (key as written, value untrimmed). */
  readonly skinparam: ReadonlyMap<string, string>;
  readonly sprites: SpriteRegistry;
  readonly pragma: Pragma;
}

/**
 * The mindmap engine's `SkinParam` — see the module doc comment.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java
 */
export class SkinParam implements MindMapSkinParam {
  /** @see SkinParam.java:205 */
  private readonly params = new Map<string, string>();
  /** @see SkinParam.java:208 (`Rankdir.TOP_TO_BOTTOM`) */
  private rankdir: Rankdir = Rankdir.TOP_TO_BOTTOM;
  private readonly styleBuilder: StyleBuilder;
  private readonly sprites: SpriteRegistry;
  private readonly pragma: Pragma;
  /** The creole atom capability every sheet shares (ADR-9). */
  readonly atomOps: AtomOps;

  constructor(source: SkinParamSource) {
    this.styleBuilder = source.styleBuilder;
    this.sprites = source.sprites;
    this.pragma = source.pragma;
    for (const [key, value] of source.skinparam) this.setParam(key, value);
    this.atomOps = chromeAtomOps(source.sprites, rootFont(source.styleBuilder));
  }

  /** The `params` half of `setParam`. @see SkinParam.java:227-234 */
  private setParam(key: string, value: string): void {
    for (const key2 of cleanForKeySlow(key)) this.params.set(key2, trin(value));
  }

  getCurrentStyleBuilder(): StyleBuilder {
    return this.styleBuilder;
  }

  /** @see SkinParam.java:1022-1024 */
  getRankdir(): Rankdir {
    return this.rankdir;
  }

  /** @see SkinParam.java:1026-1028 */
  setRankdir(rankdir: Rankdir): void {
    this.rankdir = rankdir;
  }

  /** @see SkinParam.java:1052-1054 */
  getIHtmlColorSet(): HColorSet {
    return HColorSet.instance();
  }

  /** @see SkinParam.java:326-340 */
  getValue(key: string): string | null {
    for (const key2 of cleanForKeySlow(key)) {
      const result = this.params.get(key2);
      if (result !== undefined) return result;
    }
    return null;
  }

  /** @see SkinParam.java:223-225 */
  values(): ReadonlyMap<string, string> {
    return this.params;
  }

  /** @see SkinParam.java:213-215 */
  copyAllFrom(other: ReadonlyMap<string, string>): void {
    for (const [key, value] of other) this.params.set(key, value);
  }

  /** @see SkinParam.java:1166-1172 */
  private getAsInt(key: string, defaultValue: number): number {
    const value = this.getValue(key);
    return value !== null && DIGITS.test(value) ? Number.parseInt(value, 10) : defaultValue;
  }

  /** @see SkinParam.java:650-656 */
  getDpi(): number {
    const dpi = this.getAsInt('dpi', DEFAULT_DPI);
    return dpi <= 0 ? DEFAULT_DPI : dpi;
  }

  /** @see SkinParam.java:1096-1098 */
  getTabSize(): number {
    return this.getAsInt('tabsize', DEFAULT_TAB_SIZE);
  }

  /** @see SkinParam.java:1091-1093 */
  getMonospacedFamily(): string {
    return this.getValue('defaultMonospacedFontName') ?? MONOSPACED;
  }

  /** `getAsDouble("padding")`. @see SkinParam.java:1147-1164 */
  getPadding(): ClockwiseTopRightBottomLeft {
    const value = this.getValue('padding');
    if (value !== null && INT_OR_DECIMAL.test(value)) return ClockwiseTopRightBottomLeft.same(Number.parseFloat(value));
    return ClockwiseTopRightBottomLeft.same(0);
  }

  /** `Guillemet.GUILLEMET.fromDescription(getValue("guillemet"))`: only
   *  the default pair is ported (`text/Guillemet.ts`).
   *  @see SkinParam.java:1070-1073 */
  guillemet(): GuillemetPair {
    return GUILLEMET_DEFAULT;
  }

  /** `sprites` — `addSprite`'s target (the sprite commands). @see SkinParam.java:799 */
  getSprites(): SpriteRegistry {
    return this.sprites;
  }

  /** The diagram's own registry (`sprite-registry.ts#getSprite`, java:811-817). */
  getSprite(name: string): Sprite | null {
    return getSprite(this.sprites, name) ?? null;
  }

  /** `md5map` — no mindmap command fills it. @see SkinParam.java:1328-1330 */
  getFromMd5(_md5: string): string | null {
    return null;
  }

  /** `svgCharSizes` — no mindmap command fills it. @see SkinParam.java:1250-1255 */
  transformStringForSizeHack(s: string): string {
    return s;
  }

  /** @see SkinParam.java:1313-1315 */
  getPragma(): Pragma {
    return this.pragma;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinSimple.java (sheet) */
  sheet(
    fontConfiguration: FontConfiguration,
    horizontalAlignment: HorizontalAlignment,
    creoleMode: CreoleMode,
    stereo?: FontConfiguration,
  ): SheetBuilder {
    return new CreoleParser(
      fontConfiguration,
      horizontalAlignment,
      this,
      { creoleMode, stereotype: stereo ?? fontConfiguration },
      { atomOps: this.atomOps, renderer: nestedRenderer() },
    );
  }

  getFontHtmlColor(_stereotype: Stereotype | undefined, ..._param: FontParam[]): HColor {
    return unported('getFontHtmlColor');
  }

  getFont(_stereotype: Stereotype | undefined, _inGroup: boolean, ..._fontParam: FontParam[]): UFont {
    return unported('getFont');
  }

  getHyperlinkColor(): HColor {
    return unported('getHyperlinkColor');
  }

  useUnderlineForHyperlink(): UStroke {
    return unported('useUnderlineForHyperlink');
  }

  getDefaultTextAlignment(_defaultValue: HorizontalAlignment): HorizontalAlignment {
    return unported('getDefaultTextAlignment');
  }

  strictUmlStyle(): boolean {
    return unported('strictUmlStyle');
  }
}

/** The root style's font — the base configuration the shared `AtomOps`
 *  resolves inline sprites/images against (T4a's wiring). */
function rootFont(styleBuilder: StyleBuilder): FontConfiguration {
  const root = StyleSignatureBasic.of('root').getMergedStyle(styleBuilder);
  if (root === undefined) throw new Error('mindmap: the style builder has no root style');
  return bridgeFontConfiguration(root.getFontConfiguration(HColorSet.instance()));
}
