/**
 * The creole `TextBlock` the ELK maker builds for a link's label, quantifier and role
 * (`Display.getWithNewlines(...).create0(font, CENTER, skinParam, wrapWidth, CreoleMode.SIMPLE_LINE, null, null)`:
 * `CucaDiagramFileMakerElk.java:213-215`, `:256-259`, `:271-274`).
 *
 * The description engine's own edge-label draw is the narrower `buildTextBlock`
 * (`EntityImageDescriptionTextBlock.ts`): it has no table, tree or horizontal-rule stripes. Upstream
 * runs every label through `Display#create0` -> `SheetBuilder` -> `SheetBlock1`/`SheetBlock2`
 * (`Display.java:637-701`), so this builds that pipeline over a minimal `ISkinSimple`, the same shape
 * `activity-text-sheet.ts#activitySkinSimple` and `EntityImageDescriptionDelegates.ts#buildLocalSkinSimple`
 * each keep privately for their own call path.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:637-701
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java:189-278
 */
import { chromeAtomOps } from '../../core/annotations/blocks-creole.js';
import type { NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import { Display } from '../../core/klimt/creole/Display.js';
import type { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../../core/klimt/creole/Parser.js';
import type { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import { getNestedDiagramRenderer } from '../../core/nested-diagram-registry.js';
import { Pragma } from '../../core/skin/Pragma.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { getSprite } from '../../core/sprite-registry.js';
import type { ISkinSimple } from '../../core/style/ISkinSimple.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';

/** `SkinParam.java:1073` (`getTabSize` default), `:641` (`getDpi` default). */
const TAB_SIZE = 8;
const DPI = 96;

/** `{{ }}` inside a label: the registered nested renderer, which a unit test may not have registered. */
function nestedRenderer(): NestedDiagramRenderer {
  return (
    getNestedDiagramRenderer() ?? {
      render(): TextBlock {
        throw new Error('description ELK: no nested-diagram renderer is registered');
      },
    }
  );
}

/** The `ISkinSimple` members `CreoleParser`/`StripeSimple` read for a label (`SkinParam.java` defaults). */
function labelSkinSimple(font: FontConfiguration, sprites: SpriteRegistry | undefined): ISkinSimple {
  const atomOps = chromeAtomOps(sprites, font);
  const pragma = Pragma.createEmpty();
  const skin: ISkinSimple = {
    getSprite: (name: string) => (sprites === undefined ? null : (getSprite(sprites, name) ?? null)),
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => MONOSPACED,
    getTabSize: () => TAB_SIZE,
    getDpi: () => DPI,
    copyAllFrom: () => undefined,
    getPragma: () => pragma,
    sheet: (fc, align, mode, stereo?: FontConfiguration) =>
      new CreoleParser(
        fc,
        align,
        skin,
        { creoleMode: mode, stereotype: stereo ?? fc },
        { atomOps, renderer: nestedRenderer() },
      ),
  };
  return skin;
}

/** What {@link elkDisplayBlock} needs beyond the lines. */
export interface ElkDisplayStyle {
  readonly font: FontConfiguration;
  readonly alignment: HorizontalAlignment;
  readonly creoleMode: CreoleMode;
  readonly maxMessageSize: LineBreakStrategy;
  readonly sprites: SpriteRegistry | undefined;
}

/** `display.create0(font, alignment, skinParam, maxMessageSize, creoleMode, null, null)` over already-split lines. */
export function elkDisplayBlock(lines: readonly string[], style: ElkDisplayStyle): TextBlock {
  const ctx = {
    fontConfiguration: style.font,
    spriteContainer: labelSkinSimple(style.font, style.sprites),
    atomOps: chromeAtomOps(style.sprites, style.font),
  };
  return Display.create([...lines]).create0(ctx, style.alignment, style.maxMessageSize, style.creoleMode);
}
