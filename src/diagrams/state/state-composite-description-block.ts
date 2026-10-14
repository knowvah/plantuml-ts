/**
 * state-composite-description-block -- the composite header's attribute
 * block measured the way the jar builds it: `ClusterHeader.java:78`
 * `g.getStateDescription(skinParam).calculateDimension(..)`, where
 * `Entity.java:610-632` ends in `display.create(fontConfiguration,
 * horizontalAlignment, skinParam)` = `Display#create0` with
 * `CreoleMode.FULL` / `LineBreakStrategy.NONE` (`Display.java:614`). That is
 * the real `CreoleParser -> Sheet -> SheetBlock1` pipeline (`DisplayCreole
 * .ts#create0`), so a `* item` line carries `Bullet`'s 12-wide header
 * (`StripeSimple.java:117-121`, `StripeStyle.java:61-64`, `Bullet.java:72-76`)
 * which the flat run seam (`creole-text-lines.ts`) does not model.
 *
 * `ISkinSimple` is the minimal surface that pipeline reads, modeled on the
 * other engines' local copies (`SkinParam.java` defaults); diagrams may not
 * import each other (`tests/architecture/layering.test.ts` rule 2).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:78
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Entity.java:610-632
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { ISkinSimple } from '../../core/style/ISkinSimple.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { create0 } from '../../core/klimt/creole/DisplayCreole.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../../core/klimt/creole/Parser.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import { chromeAtomOps } from '../../core/annotations/blocks-creole.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { getSprite } from '../../core/sprite-registry.js';
import { getNestedDiagramRenderer } from '../../core/nested-diagram-registry.js';

/** `SkinParam.java:1073` default tab size. */
const DEFAULT_TAB_SIZE = 8;
/** `SkinParam.java` default dpi. */
const DEFAULT_DPI = 96;
/** Colour never affects a width; the black default keeps the config total. */
const MEASURE_ONLY_COLOR = '#000000';

export function nestedRenderer(): NestedDiagramRenderer {
  return (
    getNestedDiagramRenderer() ?? {
      render(): TextBlock {
        throw new Error('state: no nested-diagram renderer is registered');
      },
    }
  );
}

export function stateSkinSimple(fc: FontConfiguration, theme: Theme): ISkinSimple {
  const sprites = theme.sprites;
  const atomOps = chromeAtomOps(sprites, fc);
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
    getTabSize: () => DEFAULT_TAB_SIZE,
    getDpi: () => DEFAULT_DPI,
    copyAllFrom: () => undefined,
    getPragma: () => pragma,
    sheet: (cfg, align, mode, stereo?: FontConfiguration) =>
      new CreoleParser(
        cfg,
        align,
        skin,
        { creoleMode: mode, stereotype: stereo ?? cfg },
        { atomOps, renderer: nestedRenderer() },
      ),
  };
  return skin;
}

export function stringBounderFor(measurer: StringMeasurer, font: FontSpec): StringBounder {
  return {
    calculateDimension(fc, text) {
      const dim = measurer.measure(text, { ...font, size: fc.size });
      return new XDimension2D(dim.width, dim.height);
    },
    getDescent(fc, text) {
      return measurer.getDescent({ ...font, size: fc.size }, text);
    },
  };
}

/** Width of `Entity#getStateDescription`'s text block over `lines` (the
 *  composite's own entry/exit/body lines); 0 for no lines
 *  (`Entity.java:616-617`, `TextBlockEmpty`). */
export function stateDescriptionBlockWidth(
  lines: readonly string[],
  font: FontSpec,
  measurer: StringMeasurer,
  theme: Theme,
): number {
  if (lines.length === 0) return 0;
  const fc: FontConfiguration = { family: font.family, size: font.size, color: MEASURE_ONLY_COLOR, styles: new Set() };
  const block = create0(
    Display.create([...lines]),
    { fontConfiguration: fc, spriteContainer: stateSkinSimple(fc, theme), atomOps: chromeAtomOps(theme.sprites, fc) },
    {
      horizontalAlignment: HorizontalAlignment.LEFT,
      maxMessageSize: LineBreakStrategy.NONE,
      creoleMode: CreoleMode.FULL,
    },
  );
  return block.calculateDimension(stringBounderFor(measurer, font)).getWidth();
}
