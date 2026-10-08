/**
 * The activity start/stop circles' merged-style colours (mission add4,
 * T3f, `labala-74-juki864`).
 *
 * Upstream reads each circle's colours off ONE merged `Style`:
 * `VCompactFactory#start`/`#stop` build it for the signature `root,
 * element, activityDiagram, circle, start|stop` (`activitydiagram3/ftile/
 * vcompact/VCompactFactory.java:99-121`), and `CircleStart`/`CircleEnd`
 * paint `BackGroundColor` and `LineColor` from it (`svek/image/
 * CircleStart.java:72-82`, `CircleEnd.java:74-102`).
 *
 * The merge is PRIORITY-ordered, not specificity-ordered: every parsed
 * style value takes the builder's next counter value as its priority
 * (`style/ValueImpl.java:51-55`, `StyleBuilder.java:121-123`), skinparam
 * converts included (`FromSkinparamToStyle.java:357`), and a merge keeps
 * the higher priority (`DarkString.java:54-57,73-78`) whatever the
 * selector (`StyleStorage.java:101-115`). So a `<style> root {
 * BackgroundColor }` declared after `plantuml.skin`'s `activityDiagram {
 * circle { start, stop, end { ... } } }` (`plantuml.skin:376-381`) -- every
 * document declaration is, the document continues the skin's counter --
 * beats it, while under `skin rose` with no document style the skin's own
 * later `circle` rule beats its `root` (`rose.skin:400-405`).
 *
 * This replays that with the faithful style engine (`style/StyleBuilder.ts`
 * via {@link buildMindmapStyleBuilder}, which is diagram-agnostic despite
 * its name: skin, then every skinparam and `<style>` block in source
 * order), so the order-blind `graph.rootElementBackground` is not needed
 * here.
 */
import type { Paint } from './paint.js';
import type { PreprocessorResult } from './preprocessor.js';
import type { Theme } from './theme.js';
import { HColorSet } from './klimt/color/HColorSet.js';
import { HColorSimple } from './klimt/color/HColorSimple.js';
import { buildMindmapStyleBuilder } from './style/mindmap-style-builder.js';
import { StyleParsingException } from './style/parser/StyleParser.js';
import type { PName } from './style/PName.js';
import type { Style } from './style/Style.js';
import type { StyleBuilder } from './style/StyleBuilder.js';
import { StyleSignatureBasic } from './style/StyleSignatureBasic.js';

/** One circle's two painted colours, `undefined` when unresolvable. */
export interface ActivityCircleColors {
  /** `PName.BackGroundColor`: start fill, stop inner-disc fill. */
  readonly back: Paint | undefined;
  /** `PName.LineColor`: start stroke, both stop strokes. */
  readonly line: Paint | undefined;
}

/** {@link resolveActivityCircleStyle}'s result. */
export interface ActivityCircleStyle {
  readonly start: ActivityCircleColors;
  readonly stop: ActivityCircleColors;
}

/** What the resolution reads from a preprocessed block. */
export type ActivityCircleStyleSource = Pick<PreprocessorResult, 'skin' | 'skinparam' | 'styles' | 'declarationOrder'>;

/** `SkinParam.isDark`: `"dark".equalsIgnoreCase(getValue("mode"))`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:114-116 */
const MODE_KEY = 'mode';
const MODE_DARK = 'dark';

/**
 * One property's colour as the SVG driver would paint it: `ColorMapper
 * .DARK_MODE` (selected by `TitledDiagram.java:294` when `isDark`) takes
 * `darkSchemeTheme()` (`ColorMapper.java:68-72`, `HColorSimple.java:
 * 236-240`), the identity mapper the light colour. A value with no light
 * half (`value1 == null`) would make `ValueImpl#asColor` throw upstream
 * (`ValueImpl.java:92-108`); it is left `undefined` here so the caller
 * keeps its own default.
 */
function paintOf(style: Style, name: PName, isDark: boolean): Paint | undefined {
  const value = style.value(name);
  if (value.asString() === null) return undefined;
  const color = value.asColor(HColorSet.instance());
  // `HColor#darkSchemeTheme` is `this` (`HColor.java:117-119`); only
  // `HColorSimple` overrides it. A non-simple colour (a gradient) keeps its
  // raw spelling, which `svg.ts#resolvePaint` parses at emission.
  const shown = isDark && color instanceof HColorSimple ? color.darkSchemeTheme() : color;
  return shown instanceof HColorSimple ? shown.asPaint() : (value.asString() ?? undefined);
}

/** The merged style of `root, element, activityDiagram, circle, <leaf>`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/VCompactFactory.java:99-109 */
function circleColors(builder: StyleBuilder, leaf: 'start' | 'stop', isDark: boolean): ActivityCircleColors {
  const style = StyleSignatureBasic.of('root', 'element', 'activityDiagram', 'circle', leaf).getMergedStyle(builder);
  if (style === undefined) return { back: undefined, line: undefined };
  return { back: paintOf(style, 'BackGroundColor', isDark), line: paintOf(style, 'LineColor', isDark) };
}

/**
 * The start/stop circles' merged-style colours for `pre`, or `undefined`
 * when a `<style>` block does not parse (`CommandStyleMultilinesCSS.java:
 * 92-93` reports it as a command error; the caller keeps its defaults).
 */
export function resolveActivityCircleStyle(pre: ActivityCircleStyleSource): ActivityCircleStyle | undefined {
  let builder: StyleBuilder;
  try {
    builder = buildMindmapStyleBuilder(pre);
  } catch (e) {
    if (e instanceof StyleParsingException) return undefined;
    throw e;
  }
  const isDark = pre.skinparam.get(MODE_KEY)?.trim().toLowerCase() === MODE_DARK;
  return { start: circleColors(builder, 'start', isDark), stop: circleColors(builder, 'stop', isDark) };
}

/**
 * `theme` with `graph.activity.circleStyle` set from `pre` (unchanged when
 * {@link resolveActivityCircleStyle} has nothing).
 */
export function withActivityCircleStyle(theme: Theme, pre: ActivityCircleStyleSource): Theme {
  const circleStyle = resolveActivityCircleStyle(pre);
  if (circleStyle === undefined) return theme;
  const graph = theme.colors.graph;
  return {
    ...theme,
    colors: { ...theme.colors, graph: { ...graph, activity: { ...graph.activity, circleStyle } } },
  };
}
