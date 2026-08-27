/**
 * The two "line" components a sequence participant owns: its lifeline and
 * its activation (livebox) bars.
 *
 * Upstream keeps these as their own component classes rather than as inline
 * drawing code, and this module mirrors that split so each one's guard
 * conditions stay visible -- they differ, and the difference is easy to lose.
 *
 * Both are reached from teoz's lifeline pass
 * (`teoz/PlayingSpaceWithParticipants.java:221` ->
 * `LivingSpaces#drawLifeLines`), which runs before the participant heads and
 * before the foreground tiles -- not from the message/event pass.
 *
 * @see net/sourceforge/plantuml/skin/rose/ComponentRoseLine.java
 * @see net/sourceforge/plantuml/skin/rose/ComponentRoseActiveLine.java
 */

import type { ParticipantGeo, ActivationGeo } from './ast.js';
import { rect, line, escapeXmlText } from '../../core/svg.js';
import type { ScaledTheme } from './scale-geo.js';
import { scaledDashPattern } from './scale-geo.js';

/** `ComponentRoseActiveLine#getPreferredWidth` (`:114-116`) returns 10; this
 *  is that width halved, because the bar is centred on the lifeline. */
const ACTIVATION_HALF_WIDTH = 5;

/** `ComponentRoseLine#drawTitleHoverTargetRect`'s `hoverTargetWidth`
 *  (`ComponentRoseLine.java:101`). */
const HOVER_TARGET_WIDTH = 8;

/** `ComponentRoseLine#getPreferredWidth` (`:96-98`). The lifeline component's
 *  area is one pixel wide, and that width is what both offsets below are
 *  computed from -- it is not an arbitrary unit. */
const LINE_COMPONENT_WIDTH = 1;

/**
 * `Display#toTooltipText` (`klimt/creole/Display.java:601-605`): the first
 * line of the display, or the empty string when there is none. NOT the
 * participant code, and NOT the lines joined.
 */
function toTooltipText(display: string): string {
  return display.split('\n')[0] ?? '';
}

/**
 * `<g><title>...</title>` open tag. Upstream builds this in
 * `PortableSvgDocument#applyGroupAttribute` (`:44-52`), which for
 * `UGroupType.TITLE` creates a `title` element and appends it as the group's
 * FIRST child -- so the title always precedes the drawn content.
 *
 * The title carries an explicit closing tag even when empty
 * (`<title></title>`), matching the jar's serialiser; a self-closed
 * `<title/>` is a different byte sequence.
 */
function openTitledGroup(title: string): string {
  return `<g><title>${escapeXmlText(title)}</title>`;
}

/**
 * Upstream: `ComponentRoseLine#drawInternalU` (`:74-88`).
 *
 * ```java
 * ug.startGroup(UGroup.singletonMap(UGroupType.TITLE, stringsToDisplay.toTooltipText()));
 * drawTitleHoverTargetRect(ug, dimensionToUse);
 * final int x = (int) (dimensionToUse.getWidth() / 2);
 * ug.apply(UTranslate.dx(x)).draw(ULine.vline(dimensionToUse.getHeight()));
 * ug.closeGroup();
 * ```
 *
 * Both x offsets fall out of the component's own one-pixel width, placed at
 * the participant centre: the line sits at `centreX + (int)(1/2)` = `centreX`,
 * and the hover rect at `centreX + (1 - 8)/2` = `centreX - 3.5`. Confirmed
 * against the jar -- `celego-19-laji937`'s participant A has a head box of
 * `x=10 w=23.362` (centre `21.681`), and the golden emits `rect x="18.181"`
 * beside `line x1="21.681"`.
 *
 * The hover rect is a transparent hit target, not ink:
 * `UStroke.withThickness(0)` plus `HColors.transparent()` leave it with no
 * stroke at all, and `HColors.transparent(WITH_FILL_OPACITY).bg()` is what
 * serialises as `fill="#000" fill-opacity="0"`.
 */
export function renderLifeline(
  p: ParticipantGeo,
  lifelineEndY: number,
  theme: ScaledTheme,
): string {
  const startY = p.y + p.height;
  const height = lifelineEndY - startY;

  // `drawTitleHoverTargetRect` (`:99-108`) guards its whole body on
  // `dimensionToUse.getHeight() > 0`. The group and its title are already
  // open by then, so a zero-height lifeline still emits `<g><title>` --
  // only the rect is skipped. (Contrast `renderActivation`, whose guard
  // sits ABOVE its own `startGroup`.)
  const hover =
    height > 0
      ? rect(
          p.centerX + (LINE_COMPONENT_WIDTH - HOVER_TARGET_WIDTH) / 2,
          startY,
          HOVER_TARGET_WIDTH,
          height,
          { fill: '#000', fillOpacity: 0 },
        )
      : '';

  const vline = line(p.centerX, startY, p.centerX, lifelineEndY, {
    stroke: theme.colors.lifeline,
    strokeDasharray: scaledDashPattern(theme.scaleK),
  });

  return `${openTitledGroup(toTooltipText(p.display))}${hover}${vline}</g>`;
}

/**
 * The activation (livebox) bar.
 *
 * Upstream is `ComponentRoseActiveLine#drawInternalU` (`:71-105`), which
 * wraps this rect in its own `<g><title></title>` and returns before opening
 * that group when the height is zero. Neither behaviour is mirrored yet --
 * see T2 of `plans/sequence-participant-g-wrapper`. Moved here unchanged so
 * it sits beside the sibling component it belongs with.
 */
export function renderActivation(act: ActivationGeo, theme: ScaledTheme): string {
  const half = ACTIVATION_HALF_WIDTH * theme.scaleK;
  const x = act.lifelineX - half;
  const fill = act.color ?? theme.colors.activation;
  return rect(x, act.y, half * 2, act.height, {
    fill,
    stroke: theme.colors.border,
  });
}
