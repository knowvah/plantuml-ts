import { chromeAtomOps } from '../../core/annotations/blocks-creole.js';
import type { NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import type { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../../core/klimt/creole/Parser.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import type { SheetBuilder } from '../../core/klimt/creole/SheetBuilder.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { Sprite } from '../../core/klimt/sprite/Sprite.js';
import { getNestedDiagramRenderer } from '../../core/nested-diagram-registry.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { addSprite, createSpriteRegistry, type SpriteRegistry } from '../../core/sprite-registry.js';
import type { ISkinSimple } from '../../core/style/ISkinSimple.js';
import type { Style } from '../../core/style/Style.js';
import { GUILLEMET_DEFAULT, type GuillemetPair } from '../../core/text/Guillemet.js';
import type { Element } from './element/Element.js';
import { WrappedElement } from './element/WrappedElement.js';

/** @see SaltDictionary.java:108-110 */
const TAB_SIZE = 8;
/** @see SaltDictionary.java:118-120 */
const DPI = 96;

function unsupported(member: string): never {
  throw new Error(`UnsupportedOperationException: SaltDictionary#${member}`);
}

/** `{{ … }}` inside salt text: the nested-diagram slot `src/index.ts`
 *  registers per render (`nested-diagram-registry.ts`), as mindmap's
 *  `SkinParam#sheet` reads it; absent only in a unit test, where
 *  `EmbeddedDiagram`'s own catch turns the throw into its fallback block. */
function nestedRenderer(): NestedDiagramRenderer {
  return (
    getNestedDiagramRenderer() ?? {
      render(): TextBlock {
        throw new Error('salt: no nested-diagram renderer is registered');
      },
    }
  );
}

/**
 * SaltDictionary — the per-diagram store of named elements (`put`/`get`,
 * read back by `ElementFactoryRetrieveFromDictonnary`) and of `sprite $name`
 * definitions, and the `ISkinSimple` every salt text block is built against:
 * no skinparam, no style, no padding (decisions.md D3).
 *
 * `sprites` is the shared `SpriteRegistry` (decisions.md D4), created with
 * NO internal store: upstream's `getSprite` is the plain map lookup
 * (java:83-85), without `SkinParam`'s `SpriteImage.fromInternal` fallback.
 *
 * Not ported: the constructor's `PathSystem`/`ConfigurationStore<OptionKey>`
 * (java:65-71) and the `options()`/`getPathSystem()` getters returning them
 * (java:165-173) — neither type has a port and the port's `ISkinSimple`
 * omits both members (`style/ISkinSimple.ts` doc comment).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/SaltDictionary.java:62-180
 */
export class SaltDictionary implements ISkinSimple {
  /** @see SaltDictionary.java:64 */
  private readonly data = new Map<string, Element>();
  /** @see SaltDictionary.java:122 */
  private readonly sprites: SpriteRegistry = createSpriteRegistry();

  /** @see SaltDictionary.java:73-75 */
  put(name: string, element: Element): void {
    this.data.set(name, element);
  }

  /** `Objects.requireNonNull(data.get(name))`. @see SaltDictionary.java:77-80 */
  get(name: string): Element {
    const result = this.data.get(name);
    if (result === undefined) throw new Error(`NullPointerException: no salt element named ${name}`);
    return new WrappedElement(result);
  }

  /** @see SaltDictionary.java:82-85 */
  getSprite(name: string): Sprite | null {
    return this.sprites.byName.get(name) ?? null;
  }

  /** @see SaltDictionary.java:87-90 */
  getValue(_key: string): string | null {
    return null;
  }

  /** @see SaltDictionary.java:92-95 */
  getPadding(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.none();
  }

  /** `Guillemet.GUILLEMET`. @see SaltDictionary.java:97-100 */
  guillemet(): GuillemetPair {
    return GUILLEMET_DEFAULT;
  }

  /** `Parser.MONOSPACED`. @see SaltDictionary.java:102-105 */
  getMonospacedFamily(): string {
    return MONOSPACED;
  }

  /** @see SaltDictionary.java:107-110 */
  getTabSize(): number {
    return TAB_SIZE;
  }

  /** @see SaltDictionary.java:112-115 */
  getIHtmlColorSet(): HColorSet {
    return HColorSet.instance();
  }

  /** @see SaltDictionary.java:117-120 */
  getDpi(): number {
    return DPI;
  }

  /** `sprites.put(name, sprite)` through the shared registry's `addSprite`.
   *  @see SaltDictionary.java:124-127 */
  addSprite(name: string, sprite: Sprite): void {
    addSprite(this.sprites, name, sprite);
  }

  /** PORT-ONLY: the registry the creole `AtomOps` resolve `<$name>` against
   *  (see {@link atomOpsFor}). */
  getSprites(): SpriteRegistry {
    return this.sprites;
  }

  /** @see SaltDictionary.java:129-132 */
  copyAllFrom(_other: ReadonlyMap<string, string>): void {
    unsupported('copyAllFrom');
  }

  /** @see SaltDictionary.java:134-137 */
  values(): ReadonlyMap<string, string> {
    return unsupported('values');
  }

  /** @see SaltDictionary.java:139-141 */
  minClassWidthTOBEREMOVED(_style: Style): number {
    return 0;
  }

  /** @see SaltDictionary.java:143-146 */
  transformStringForSizeHack(s: string): string {
    return s;
  }

  /**
   * The three-argument overload throws (java:148-152); the four-argument one
   * builds a `CreoleParser` (java:154-158). `atomOps`/`renderer` are the
   * parser's ADR-9 adapters (`CreoleParser.ts` doc comment).
   */
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
    if (stereo === undefined) return unsupported('sheet');
    return new CreoleParser(
      fontConfiguration,
      horizontalAlignment,
      this,
      { creoleMode, stereotype: stereo },
      { atomOps: chromeAtomOps(this.sprites, fontConfiguration), renderer: nestedRenderer() },
    );
  }

  /** @see SaltDictionary.java:160-163 */
  getPragma(): Pragma {
    return Pragma.createEmpty();
  }

  /** @see SaltDictionary.java:175-178 */
  getFromMd5(_md5: string): string | null {
    return null;
  }
}

/**
 * PORT-ONLY (ADR-9): the creole `AtomOps` a salt text block is built with —
 * `chromeAtomOps` over the dictionary's sprites, at the block's own font
 * (upstream's `AtomSprite` takes the stripe's `fontConfiguration`,
 * StripeSimple.java:228-236). Every salt `spriteContainer` IS the
 * `SaltDictionary` (PSystemSalt.java:188-234 hands each factory
 * `dictionary`), so anything else is a broken invariant — Java's checked
 * cast.
 */
export function atomOpsFor(spriteContainer: ISkinSimple, fontConfiguration: FontConfiguration): AtomOps {
  if (!(spriteContainer instanceof SaltDictionary))
    throw new Error('ClassCastException: a salt spriteContainer is always the SaltDictionary');
  return chromeAtomOps(spriteContainer.getSprites(), fontConfiguration);
}
