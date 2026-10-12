/**
 * The klimt text blocks the class ELK path hands `MyElkDrawing`/`MyElkEdge`/
 * `MyElkCluster` (cdd8 T3a): the link label, the quantifier and role labels,
 * and the cluster title. Upstream builds each through `Display#create*`
 * (`Display.java:614-701`) over the diagram's `ISkinParam`; the class engine
 * draws its svek path as plain strings, so this module builds the creole
 * `TextBlock`s the ELK drawing needs, with a class-local `ISkinSimple`
 * (the same `SkinParam.java` defaults `activity-text-sheet.ts` and
 * `annotations/blocks-creole.ts` each keep a private copy of).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java:149-278
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:115-142
 */
import type { Theme } from '../../core/theme.js';
import type { Namespace, Relationship } from './ast.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { chromeAtomOps } from '../../core/annotations/blocks-creole.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { MONOSPACED } from '../../core/klimt/creole/Parser.js';
import { getNestedDiagramRenderer } from '../../core/nested-diagram-registry.js';
import type { NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import type { ISkinSimple } from '../../core/style/ISkinSimple.js';
import { FontStyle, type FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { getSprite } from '../../core/sprite-registry.js';
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';
import { parseMagicArrowLabel } from '../../core/edge-label-box.js';
import { packageTitleFaces, packageTitleFontFamily, packageTitleFontSize } from './class-namespace-title-runs.js';
import { packageTitleFontColor } from './class-package-style.js';

/** `final double marginLabel = 1;`: `CucaDiagramFileMakerElk.java:180`, `:191`. */
const MARGIN_LABEL = 1;

/** `{{ }}` inside a label -- the global registry (`src/index.ts`). */
function nestedRenderer(): NestedDiagramRenderer {
  return (
    getNestedDiagramRenderer() ?? {
      render(): TextBlock {
        throw new Error('class ELK: no nested-diagram renderer is registered');
      },
    }
  );
}

/** The `ISkinSimple` surface `CreoleParser` reads: `SkinParam.java`'s
 *  defaults (the diagram's sprites, identity size hack, `MONOSPACED`, tab
 *  size 8, dpi 96, `getPadding()` = `skinparam padding`, `:1147-1150`). */
function classElkSkinSimple(fontConfiguration: FontConfiguration, theme: Theme): ISkinSimple {
  const padding = ClockwiseTopRightBottomLeft.same(theme.padding ?? 0);
  const atomOps = chromeAtomOps(theme.sprites, fontConfiguration);
  const pragma = Pragma.createEmpty();
  const sprites = theme.sprites;
  const skin: ISkinSimple = {
    getSprite: (name: string) => (sprites === undefined ? null : (getSprite(sprites, name) ?? null)),
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => padding,
    getMonospacedFamily: () => MONOSPACED,
    getTabSize: () => 8,
    getDpi: () => 96,
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

/** `display.create0(fc, alignment, skinParam, maxMessageSize, creoleMode, null, null)`: `Display.java:637-669`. */
function createBlock(display: Display, fc: FontConfiguration, theme: Theme, creoleMode: CreoleMode): TextBlock {
  const ctx = {
    fontConfiguration: fc,
    spriteContainer: classElkSkinSimple(fc, theme),
    atomOps: chromeAtomOps(theme.sprites, fc),
  };
  return display.create0(ctx, HorizontalAlignment.CENTER, LineBreakStrategy.NONE, creoleMode);
}

/**
 * `FontConfiguration.create(skinParam, FontParam.ARROW, null)` (`:257`, `:272`)
 * and the `{root, element, classDiagram, arrow}` style's font (`getFontForLink`,
 * `:157-163`): both resolve to the arrow font, `resolveArrowLabelFont`.
 */
function arrowFontConfiguration(theme: Theme): FontConfiguration {
  const font = resolveArrowLabelFont(theme);
  const styles = new Set<FontStyle>();
  if (font.weight === 'bold') styles.add(FontStyle.BOLD);
  if (font.style === 'italic') styles.add(FontStyle.ITALIC);
  return { family: font.family, size: font.size, color: font.color, styles };
}

/**
 * `Link#getLabel()`'s text: `new StringWithArrow(completeLabel).getLabel()`
 * (`descdiagram/command/Labels.java:64`, `StringWithArrow.java:56-91`) --
 * a single-guide-line label loses its magic-arrow token. The ELK path never
 * draws the arrow glyph itself (`StringWithArrow.addMagicArrow` is commented
 * out at `CucaDiagramFileMakerElk.java:205-207`, `:224-226`). `undefined` is
 * upstream's null label (a bare `<`/`>`).
 */
function stringWithArrowLabel(completeLabel: string): string | undefined {
  if (Display.hasSeveralGuideLines(completeLabel)) return completeLabel;
  const parsed = parseMagicArrowLabel(completeLabel);
  return parsed === undefined ? completeLabel : parsed.text;
}

/**
 * The maker's `getLabel(stringBounder, link)` (`CucaDiagramFileMakerElk.java:189-248`):
 * `TextBlockUtils.EMPTY_TEXT_BLOCK` (`empty(0, 0)`, `TextBlockUtils.java:57`)
 * for an unlabelled link; else the `SIMPLE_LINE` block in the default text
 * alignment (`skinParam.getDefaultTextAlignment(CENTER)`, `:165-170`),
 * `addVisibilityModifier`'s margin 1 (`:172-183`), then margin 1 again
 * (`:236-238`, no note).
 */
export function classElkLinkLabel(rel: Relationship, theme: Theme): TextBlock {
  const label = rel.label === undefined ? undefined : stringWithArrowLabel(rel.label);
  if (label === undefined || label.length === 0) return TextBlockUtils.empty(0, 0);
  const display = Display.getWithNewlines(Pragma.createEmpty(), label);
  const block = createBlock(display, arrowFontConfiguration(theme), theme, CreoleMode.SIMPLE_LINE);
  const labelOnly = TextBlockUtils.withMargin(block, MARGIN_LABEL, MARGIN_LABEL);
  return TextBlockUtils.withMargin(labelOnly, MARGIN_LABEL, MARGIN_LABEL);
}

/**
 * The maker's `getQuantifier` / `getRoleLabel` (`CucaDiagramFileMakerElk.java:250-278`):
 * `Display.getWithNewlines(pragma, tmp).create(labelFont, CENTER, skinParam)`,
 * null for a null string or an empty block.
 */
export function classElkEndLabel(
  text: string | undefined,
  theme: Theme,
  stringBounder: StringBounder,
): TextBlock | null {
  if (text === undefined) return null;
  const display = Display.getWithNewlines(Pragma.createEmpty(), text);
  const label = createBlock(display, arrowFontConfiguration(theme), theme, CreoleMode.FULL);
  if (TextBlockUtils.isEmpty(label, stringBounder)) return null;
  return label;
}

/**
 * `ClusterHeader#getTitleBlock` (`ClusterHeader.java:115-142`) for a package:
 * `g.getDisplay().create(fontConfiguration, style.getHorizontalAlignment(), skinParam)`
 * over the `{root, element, classDiagram, package_, title}` style
 * (`:153-157`) -- `plantuml.skin:94-98`'s bold, centred package title, with
 * the `package` font overrides `class-namespace-title-runs.ts` resolves.
 */
export function classElkClusterTitle(ns: Namespace, theme: Theme, tags: readonly string[]): TextBlock {
  const faces = packageTitleFaces(theme);
  const styles = new Set<FontStyle>();
  if (faces.bold) styles.add(FontStyle.BOLD);
  if (faces.italic) styles.add(FontStyle.ITALIC);
  const fc: FontConfiguration = {
    family: packageTitleFontFamily(theme),
    size: packageTitleFontSize(theme),
    color: packageTitleFontColor(theme, tags),
    styles,
  };
  return createBlock(Display.getWithNewlines(Pragma.createEmpty(), ns.display), fc, theme, CreoleMode.FULL);
}
