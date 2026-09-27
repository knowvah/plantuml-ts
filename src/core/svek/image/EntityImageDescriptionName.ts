/**
 * `EntityImageDescription`'s `name` block — `BodyFactory.create2`
 * (`EntityImageDescription.java:198-199`):
 *
 * ```java
 * name = BodyFactory.create2(getSkinParam().getDefaultTextAlignment(HorizontalAlignment.CENTER),
 *         codeDisplay, getSkinParam(), stereotype, entity, styleTitle);
 * ```
 *
 * One construction, two `AtomOps` flavours: the folder-family sizer
 * (`leaf-sizing-folder-title.ts#measureShownFolderTitle`, SI1 T12) passes
 * sizing-only ops; the drawing path (`EntityImageDescription`'s own ctor,
 * cdd3-T28 E3-14) passes the draw-capable `descAtomOps`. Moved here from
 * `leaf-sizing-folder-title.ts` (cdd3-T28) so both share it — the input
 * construction and every traced default are unchanged; see that module's
 * doc comment ("Input construction — the ADR-9 seam surfaces") for each
 * value's provenance.
 *
 * `USymbolFolder` is the only `asSmall` that reads its `title` argument
 * (`USymbolFolder.java:177-183`, drawn at `UTranslate(4, 3)` when
 * `showTitle`), which is why only the `package_` symbol routes here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java:198-199
 */
import type { FontConfiguration } from '../../klimt/shape/UText.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import { HorizontalAlignment } from '../../klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../klimt/geom/ClockwiseTopRightBottomLeft.js';
import { LineBreakStrategy } from '../../klimt/LineBreakStrategy.js';
import { Display } from '../../klimt/creole/Display.js';
import { CreoleParser } from '../../klimt/creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../../klimt/creole/Parser.js';
import type { AtomOps } from '../../klimt/creole/Sea.js';
import type { NestedDiagramRenderer } from '../../EmbeddedDiagram.js';
import { Pragma } from '../../skin/Pragma.js';
import { GUILLEMET_DEFAULT, type GuillemetPair } from '../../text/Guillemet.js';
import { BodyFactory } from '../../cucadiagram/BodyFactory.js';
import type { BodyEnhanced1Style } from '../../cucadiagram/BodyEnhanced1Config.js';
import type { MethodsOrFieldsAreaSkinParam } from '../../cucadiagram/MethodsOrFieldsAreaConfig.js';
import type { Entity } from '../../abel/Entity.js';
import { LeafType } from '../../abel/LeafType.js';
import type { AtomImageResolver } from '../../creole-atoms.js';
import type { USymbol } from '../../decoration/symbol/USymbol.js';
import { buildTextBlock } from './EntityImageDescriptionSupport.js';
import { descAtomOps } from './EntityImageDescriptionDelegates.js';
import type { EmojiArtworkResolver } from './EntityImageDescriptionEmoji.js';

/** `plantuml.skin:15`, `root { LineThickness 1.0 }` — read only when the
 *  title text contains a `--`/`==`/`..`/`__` block separator. */
const ROOT_LINE_THICKNESS = 1.0;

/** A description title embedding a nested `{{ ... }}` diagram is a
 *  genuinely separate, unbuilt feature (`EntityImageDescriptionDelegates
 *  .ts#blockedEmbeddedRenderer`'s identical typed deferral). */
function blockedEmbeddedRenderer(): NestedDiagramRenderer {
  return {
    render(): never {
      throw new Error(
        'EntityImageDescriptionName: embedded diagrams ({{ ... }}) inside a folder/package title ' +
          'are not supported — no nested-diagram renderer exists for description text ' +
          '(EmbeddedDiagram.ts#NestedDiagramRenderer is the seam)',
      );
    },
  };
}

/**
 * The `MethodsOrFieldsAreaSkinParam` surface `create2` requires
 * (`requireBodyEnhanced1SkinParam`): the `ISkinSimple` half mirrors
 * `EntityImageDescriptionDelegates.ts#buildLocalSkinSimple` member for
 * member (each value upstream's own traced `SkinParam.java` default); the
 * `abel/ISkinParam` half supplies opaque stubs; the two T8 additions carry
 * upstream's own defaults (`SkinParam.java:554-555`'s
 * `classAttributeIconSize` 10; `getCircledCharacterRadius` 11).
 */
function buildTitleSkinParam(guillemet: GuillemetPair | undefined, atomOps: AtomOps): MethodsOrFieldsAreaSkinParam {
  const renderer = blockedEmbeddedRenderer();
  const skin: MethodsOrFieldsAreaSkinParam = {
    getFontHtmlColor: () => ({}),
    getFont: () => ({}),
    getHyperlinkColor: () => ({}),
    useUnderlineForHyperlink: () => {
      throw new Error('EntityImageDescriptionName: useUnderlineForHyperlink is not reached by a title block');
    },
    getCurrentStyleBuilder: () => ({}),
    getDefaultTextAlignment: (defaultValue) => defaultValue,
    strictUmlStyle: () => false,
    getSprite: () => null,
    guillemet: () => guillemet ?? GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => MONOSPACED,
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => Pragma.createEmpty(),
    sheet: (fontConfiguration, horizontalAlignment, creoleMode, stereo?: FontConfiguration) =>
      new CreoleParser(
        fontConfiguration,
        horizontalAlignment,
        skin,
        { creoleMode, stereotype: stereo ?? fontConfiguration },
        { atomOps, renderer },
      ),
    classAttributeIconSize: () => 10,
    getCircledCharacterRadius: () => 11,
  };
  return skin;
}

/** The two `Entity` members `create2`'s closure reads (`getLeafType` for
 *  the `Display` ctor's `inEllipse` check, `getPortShortNames` on the
 *  ports path) — a shape, not a real `abel/Entity`. */
function titleEntity(): Entity {
  const shape = {
    getLeafType: () => LeafType.DESCRIPTION,
    getPortShortNames: () => new Set<string>(),
  };
  return shape as unknown as Entity;
}

/** The resolved `styleTitle` reads `create2` consumes: all three font slots
 *  are the ONE title font (java:198's single `styleTitle` argument). */
function titleStyle(font: FontConfiguration, atomOps: AtomOps): BodyEnhanced1Style {
  return {
    getHorizontalAlignment: () => HorizontalAlignment.CENTER,
    lineThickness: ROOT_LINE_THICKNESS,
    minimumWidth: 0,
    titleConfig: font,
    treeTableFontConfig: font,
    memberFontConfig: font,
    wrapWidth: LineBreakStrategy.NONE,
    atomOps,
  };
}

/**
 * `BodyFactory.create2(CENTER, codeDisplay, skinParam, stereotype, entity,
 * styleTitle)` for the entity code name `code` in the title font `font`.
 * `codeDisplay = Display.getWithNewlines(pragma, entity.getName())`
 * (java:180) — the literal-`\n`-escape scanner, since a quoted element
 * name carries the two-char escape.
 */
export function buildCreate2Name(
  code: string,
  font: FontConfiguration,
  atomOps: AtomOps,
  guillemet: GuillemetPair | undefined,
): TextBlock {
  const skinParam = buildTitleSkinParam(guillemet, atomOps);
  const display = Display.getWithNewlines(Pragma.createEmpty(), code);
  return BodyFactory.create2(
    skinParam.getDefaultTextAlignment(HorizontalAlignment.CENTER),
    display,
    skinParam,
    undefined,
    titleEntity(),
    titleStyle(font, atomOps),
  );
}

/** The title-font slice of `EntityImageDescriptionPaint` the name reads. */
export interface EntityNamePaint {
  readonly fontTitle: FontConfiguration;
  readonly titleAlignment: HorizontalAlignment;
  readonly guillemet?: GuillemetPair | undefined;
}

/**
 * `EntityImageDescription`'s `name` field (java:198-199). `package_` — the
 * only symbol whose `asSmall` reads `name` (`USymbolFolder` with
 * `showTitle`) — gets the real `create2` block over `entity.getName()`
 * (`codeName`), drawn through the draw-capable `descAtomOps`; its
 * `BodyEnhanced1` `withMargin(block, 6, 6, 0, 0)` is what puts the jar's
 * title text 10px (4 + 6) inside the tab (cdd3-T28 E3-14,
 * `gujigi-63-roki030`). Every other symbol ignores `name`, so it keeps the
 * pre-existing `buildTextBlock` substitute rather than constructing a
 * create2 block nothing reads.
 */
export function buildEntityName(
  symbol: USymbol,
  codeName: string,
  paint: EntityNamePaint,
  resolveAtomImage: AtomImageResolver | undefined,
  emojiArtwork: EmojiArtworkResolver | undefined,
): TextBlock {
  if (symbol.getSNames()[0] !== 'package_') {
    return buildTextBlock(codeName, paint.fontTitle, paint.titleAlignment, resolveAtomImage);
  }
  return buildCreate2Name(codeName, paint.fontTitle, descAtomOps(resolveAtomImage, emojiArtwork), paint.guillemet);
}
