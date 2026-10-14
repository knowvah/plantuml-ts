/**
 * `SpriteContainerEmpty` — the skin `GraphicStrings` hands its creole text
 * (GraphicStrings.java:135): no skinparams, `<<`/`>>` left as typed, and
 * sprites only from the jar-resident bundle (`SpriteImage.fromInternal`).
 *
 * Port-only, per the established ADR-2/ADR-9 seams:
 * - the internal bundle arrives as an optional {@link InternalSpriteStore}
 *   (`internal-sprite-store.ts`; a browser-safe port has no classpath) —
 *   without one, `getSprite` answers `null`, an unresolved name;
 * - {@link SpriteContainerEmpty.atomOps} is the creole `AtomOps` for a font
 *   (`annotations/blocks-creole.ts#chromeAtomOps` over this container's
 *   sprites), which `CreoleParser` and `SheetBlock1` need beside the skin;
 * - `{{ }}` resolves through `nested-diagram-registry.ts`'s slot.
 *
 * Not ported: `getIHtmlColorSet`, `options()`, `getPathSystem()` — absent
 * from this port's `ISkinSimple` and read by no ported caller.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java
 */
import { chromeAtomOps } from '../../annotations/blocks-creole.js';
import type { NestedDiagramRenderer } from '../../EmbeddedDiagram.js';
import type { InternalEmojiStore } from '../../internal-emoji-store.js';
import type { InternalSpriteStore } from '../../internal-sprite-store.js';
import { getNestedDiagramRenderer } from '../../nested-diagram-registry.js';
import { Pragma } from '../../skin/Pragma.js';
import { createSpriteRegistry } from '../../sprite-registry.js';
import type { SpriteRegistry } from '../../sprite-registry.js';
import type { ISkinSimple } from '../../style/ISkinSimple.js';
import type { GuillemetPair } from '../../text/Guillemet.js';
import type { CreoleMode } from '../creole/CreoleMode.js';
import { CreoleParser } from '../creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../creole/Parser.js';
import type { AtomOps } from '../creole/Sea.js';
import type { SheetBuilder } from '../creole/SheetBuilder.js';
import { ClockwiseTopRightBottomLeft } from '../geom/ClockwiseTopRightBottomLeft.js';
import type { HorizontalAlignment } from '../geom/HorizontalAlignment.js';
import type { TextBlock } from '../shape/TextBlock.js';
import type { FontConfiguration } from '../shape/UText.js';
import type { Sprite } from './Sprite.js';

/** `Guillemet.DOUBLE_COMPARATOR = new Guillemet("<<", ">>")`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/text/Guillemet.java:45 */
const DOUBLE_COMPARATOR: GuillemetPair = { start: '<<', end: '>>' };

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:84-86 */
const TAB_SIZE = 8;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:94-96 */
const DPI = 96;

/** No renderer registered (a unit test importing klimt directly): the
 *  `EmbeddedDiagram` catch turns the throw into its fallback block. */
function nestedRenderer(): NestedDiagramRenderer {
  return (
    getNestedDiagramRenderer() ?? {
      render(): TextBlock {
        throw new Error('SpriteContainerEmpty: no nested-diagram renderer is registered');
      },
    }
  );
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:56 */
export class SpriteContainerEmpty implements ISkinSimple {
  private readonly sprites: SpriteRegistry;

  /** Both stores are port-only (ADR-2): upstream reads `/sprites/**` and the
   *  Twemoji artwork off the classpath (`SpriteImage.fromInternal`,
   *  `Emoji.java:167`), which a browser-safe library cannot have. */
  constructor(internal?: InternalSpriteStore, emoji?: InternalEmojiStore) {
    this.sprites = createSpriteRegistry(internal, emoji);
  }

  /** `SpriteImage.fromInternal(name)`; `undefined` (no store, or no such
   *  bundle entry) is upstream's `null`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:58-61 */
  getSprite(name: string): Sprite | null {
    return this.sprites.internal?.get(name) ?? null;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:63-66 */
  getValue(_key: string): string | null {
    return null;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:68-71 */
  getPadding(): ClockwiseTopRightBottomLeft {
    return ClockwiseTopRightBottomLeft.none();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:73-76 */
  guillemet(): GuillemetPair {
    return DOUBLE_COMPARATOR;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:78-81 */
  getMonospacedFamily(): string {
    return MONOSPACED;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:83-86 */
  getTabSize(): number {
    return TAB_SIZE;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:93-96 */
  getDpi(): number {
    return DPI;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:98-101 */
  copyAllFrom(_other: ReadonlyMap<string, string>): void {
    throw new Error('UnsupportedOperationException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:103-106 */
  values(): ReadonlyMap<string, string> {
    throw new Error('UnsupportedOperationException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:107-110 */
  minClassWidthTOBEREMOVED(_style: unknown): number {
    return 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:112-115 */
  transformStringForSizeHack(s: string): string {
    return s;
  }

  /**
   * The three-argument overload throws (java:117-121); the four-argument one
   * builds a `CreoleParser` over this container (java:123-127).
   */
  sheet(
    fontConfiguration: FontConfiguration,
    horizontalAlignment: HorizontalAlignment,
    creoleMode: CreoleMode,
    stereo?: FontConfiguration,
  ): SheetBuilder {
    if (stereo === undefined) throw new Error('UnsupportedOperationException');
    return new CreoleParser(
      fontConfiguration,
      horizontalAlignment,
      this,
      { creoleMode, stereotype: stereo },
      { atomOps: this.atomOps(fontConfiguration), renderer: nestedRenderer() },
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:129-132 */
  getPragma(): Pragma {
    return Pragma.createEmpty();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteContainerEmpty.java:144-147 */
  getFromMd5(_md5: string): string | null {
    return null;
  }

  /** Port-only (ADR-9): the creole `AtomOps` at `fontConfiguration`, over
   *  this container's sprites. */
  atomOps(fontConfiguration: FontConfiguration): AtomOps {
    return chromeAtomOps(this.sprites, fontConfiguration);
  }
}
