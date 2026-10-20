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

import type { ParticipantGeo, ActivationGeo, DestroyCross, DestroyGeo, LifelineSegment } from './ast.js';
import { lifelineTitle } from './sequence-layout-lifeline.js';
import { noGradient } from '../../core/paint.js';
import { fmt } from '../../core/svg-format.js';
import { rect, line, escapeXmlText, type LineStyle } from '../../core/svg.js';
import type { ScaledTheme } from './scale-geo.js';
import { activationShadowFilter } from './sequence-shadow.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { ACTIVATION_HALF_WIDTH } from './sequence-layout-activation.js';
import { DESTROY_CROSS_SIZE } from './sequence-layout-life-event.js';

/** `ComponentRoseLine#drawTitleHoverTargetRect`'s `hoverTargetWidth`
 *  (`ComponentRoseLine.java:101`). */
const HOVER_TARGET_WIDTH = 8;

/** `ComponentRoseLine#getPreferredWidth` (`:96-98`). The lifeline component's
 *  area is one pixel wide, and that width is what both offsets below are
 *  computed from -- it is not an arbitrary unit. */
const LINE_COMPONENT_WIDTH = 1;

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
 * The stroke a line component applies: `ug.apply(color)` and
 * `ug.apply(stroke)` (`ComponentRoseLine.java:77-78`,
 * `ComponentRoseDelayLine.java:62`) -- `LineColor`, and `getStroke()`'s
 * thickness and dash, all multiplied by the scale at emission
 * (`SvgGraphics.java:556-561`). A `<line>` cannot carry a gradient: the
 * driver strokes its first colour (`DriverLineSvg.java:76-82`).
 */
function lineStroke(paint: SequencePaint, k: number): LineStyle {
  const dash = paint.dash;
  return {
    stroke: noGradient(paint.stroke),
    strokeWidth: paint.thickness * k,
    ...(dash === undefined ? {} : { strokeDasharray: `${fmt(dash[0]! * k)},${fmt(dash[1]! * k)}` }),
  };
}

/**
 * Upstream: `ComponentRoseLine#drawInternalU` (`:74-88`).
 *
 * ```java
 * ug = ug.apply(color);
 * ug = ug.apply(stroke);
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
 *
 * The line takes the piece's merged `lifeLine` style (`MutingLine.java:
 * 105-106`): by default `element { LineThickness 0.5 }` and `lifeLine {
 * LineStyle 5 }` over `root { LineColor #181818 }` (`plantuml.skin:16,91-93,
 * 141-143`), which the jar emits as `stroke:#181818;stroke-width:0.5;
 * stroke-dasharray:5,5;`.
 */
export function renderLifeline(p: ParticipantGeo, seg: LifelineSegment, theme: ScaledTheme): string {
  // `seg.y1` is the head ROW's bottom, not this participant's box bottom.
  // Upstream draws every lifeline from body-coordinate 0 and translates the
  // whole body by `getHeadHeight()` (`PlayingSpaceWithParticipants#drawU:213`),
  // so all of them start together however tall each individual head is. For
  // a plain participant those two differ by exactly one pixel — the `+ 1` in
  // `ComponentRoseParticipant#getPreferredHeight:129-132` — which is why
  // `jobadi-87-jegi648`'s box ends at 38 and its lifeline begins at 39.
  const height = seg.y2 - seg.y1;

  // `drawTitleHoverTargetRect` (`:99-108`) guards its whole body on
  // `dimensionToUse.getHeight() > 0`. The group and its title are already
  // open by then, so a zero-height lifeline still emits `<g><title>` --
  // only the rect is skipped. (Contrast `renderActivation`, whose guard
  // sits ABOVE its own `startGroup`.)
  const hover =
    height > 0
      ? rect(p.centerX + (LINE_COMPONENT_WIDTH - HOVER_TARGET_WIDTH) / 2, seg.y1, HOVER_TARGET_WIDTH, height, {
          fill: '#000',
          fillOpacity: 0,
        })
      : '';

  const vline = line(p.centerX, seg.y1, p.centerX, seg.y2, lineStroke(seg.paint, theme.scaleK));

  return `${openTitledGroup(seg.title ?? lifelineTitle(p))}${hover}${vline}</g>`;
}

/** `ComponentRoseDelayLine#drawInternalU` (`:59-65`): one vertical line at
 *  `(int) (width / 2)` = 0 of a 1-wide component, so on the lifeline itself,
 *  in the piece's merged `lifeLine { delay }` style (by default `delay {
 *  LineStyle 1-4 }`, `plantuml.skin:300-305`). It opens no `<g>`. */
function renderDelayLine(p: ParticipantGeo, seg: LifelineSegment, theme: ScaledTheme): string {
  return line(p.centerX, seg.y1, p.centerX, seg.y2, lineStroke(seg.paint, theme.scaleK));
}

/**
 * One participant's pieces, which layout builds for every participant
 * (`sequence-layout-lifeline.ts`).
 */
export function lifelineOf(
  segments: Readonly<Record<string, readonly LifelineSegment[]>>,
  p: ParticipantGeo,
): readonly LifelineSegment[] {
  const pieces = segments[p.id];
  if (pieces === undefined) throw new Error(`participant ${p.id} has no lifeline`);
  return pieces;
}

/**
 * One participant's lifeline, piece by piece -- `MutingLine#drawLine`
 * (`teoz/MutingLine.java:73-92`); see `sequence-delay.ts#lifelineSegments`.
 * A `PARTICIPANT_LINE` piece a page clipped away entirely still opens its
 * titled group (`ComponentRoseLine` starts it before the driver drops the
 * shapes), so it is emitted empty.
 */
export function renderLifelineSegments(
  p: ParticipantGeo,
  segments: readonly LifelineSegment[],
  theme: ScaledTheme,
): string {
  return segments
    .map((seg) => {
      if (seg.delay) return renderDelayLine(p, seg, theme);
      if (seg.clippedOut === true) return `${openTitledGroup(seg.title ?? lifelineTitle(p))}</g>`;
      return renderLifeline(p, seg, theme);
    })
    .join('');
}

/**
 * Upstream: `ComponentRoseActiveLine#drawInternalU` (`:71-105`).
 *
 * ```java
 * if (dimensionToUse.getHeight() == 0)
 *     return;
 * ug.startGroup(UGroup.singletonMap(UGroupType.TITLE, stringsToDisplay.toTooltipText()));
 * ```
 *
 * The early return sits ABOVE `startGroup`, so a zero-height activation emits
 * nothing whatsoever -- not an empty group. That is the one behavioural
 * difference from `renderLifeline`, whose own guard sits INSIDE its already-
 * opened group. Two components, two guard positions; upstream's distinction,
 * kept rather than unified.
 *
 * The title is empty because the `Display` handed to this component is empty,
 * and the jar emits `<title></title>` rather than omitting the element.
 *
 * Paint is the bar's merged `activationBox` style (`sequence-layout-
 * activation.ts`), read as `getSymbolContext()` (`:63`): the fill is its
 * back colour, the stroke its fore colour (`:85-90`). The component applies
 * no `UStroke`, so the outline keeps the driver's unit stroke whatever the
 * style's `LineThickness` (jar-probed: `activationBox { LineThickness 3 }`
 * still draws `stroke-width:1`); `isShadowing()` only gates a fixed
 * `setDeltaShadow(1)` (`:82-83`), and no corner is read.
 */
export function renderActivation(act: ActivationGeo, theme: ScaledTheme): string {
  // The early return, now mirrored. It was deliberately withheld while this
  // port's LAYOUT still produced zero-height bars the jar gives height to --
  // 32 of the 121 activation-bearing fixtures at the time -- because
  // suppressing those would have deleted boxes the golden carries. That
  // input defect is fixed (the activation STACK and its `Math.max(0, level
  // - 1)` clamp, `sequence-layout-events.ts`), and the census now reports
  // ZERO zero-height bars across all 157 activation-bearing fixtures, so the
  // guard is faithful and no longer costly. It is dead on today's corpus by
  // construction; it is here because upstream has it, and because a
  // hand-authored `activate X` / `deactivate X` pair at one y can still
  // reach it.
  if (act.height === 0) return '';
  const paint = activationPaintOf(act);
  const half = ACTIVATION_HALF_WIDTH * theme.scaleK;
  // `LiveBoxes#drawOneLevel` draws every bar from the same origin and moves
  // the whole level right by `(levelToDraw - 1) * drawer.getWidth() / 2`
  // (`:365-368`) -- HALF the box's own width per level, not a standalone
  // constant, which is why this reuses `half` rather than
  // `CommunicationTile.LIVE_DELTA_SIZE` (they coincide at 5 only because the
  // box is 10 wide). Level 1 is centred on the lifeline; each nested level
  // steps right by half a box, so the stack reads as a staircase.
  //
  // Jar-verified on `kejoke-76-curu931`, four levels deep on one lifeline at
  // cx=57.075: its golden runs x=52.075, 57.075, 62.075, 67.075.
  const x = act.lifelineX - half + (act.level - 1) * half;
  if (act.open !== undefined) return `${openTitledGroup('')}${renderOpenBar(act, x, paint, theme)}</g>`;
  const bar = rect(x, act.y, half * 2, act.height, {
    fill: paint.fill,
    stroke: paint.stroke,
    strokeWidth: ACTIVATION_STROKE_THICKNESS * theme.scaleK,
    ...activationShadowFilter(paint),
  });

  return `${openTitledGroup('')}${bar}</g>`;
}

/** The driver's unit stroke the bar keeps (`UStroke.simple()`): see
 *  {@link renderActivation}. */
const ACTIVATION_STROKE_THICKNESS = 1;

/** The paint layout resolved for this bar (`sequence-layout-activation.ts`). */
function activationPaintOf(act: ActivationGeo): SequencePaint {
  if (act.paint === undefined) throw new Error(`activation of ${act.participantId} carries no paint`);
  return act.paint;
}

/**
 * The `closeUp && closeDown` false branch of `ComponentRoseActiveLine
 * #drawInternalU` (`:88-101`): the rect is filled AND stroked with the back
 * colour, then the two sides are drawn, then whichever ends are closed.
 */
function renderOpenBar(act: ActivationGeo, x: number, paint: SequencePaint, theme: ScaledTheme): string {
  const width = ACTIVATION_HALF_WIDTH * theme.scaleK * 2;
  const style = { stroke: noGradient(paint.stroke), strokeWidth: ACTIVATION_STROKE_THICKNESS * theme.scaleK };
  const bottom = act.y + act.height;
  const box = rect(x, act.y, width, act.height, {
    fill: paint.fill,
    stroke: paint.fill,
    strokeWidth: style.strokeWidth,
    ...activationShadowFilter(paint),
  });
  const sides = line(x, act.y, x, bottom, style) + line(x + width, act.y, x + width, bottom, style);
  const up = act.open!.closeUp ? line(x, act.y, x + width, act.y, style) : '';
  const down = act.open!.closeDown ? line(x, bottom, x + width, bottom, style) : '';
  return box + sides + up + down;
}

/**
 * `ComponentRoseDestroy#drawInternalU` (`:60-65`): two `2 * crossSize`
 * diagonals from the cross's top-left, down-right then up-right, in
 * `LineColor` at the style's stroke -- by default `destroy { LineColor
 * #A80036; LineStyle 0; LineThickness 2 }` (`plantuml.skin:149-153`), which
 * the jar emits as `stroke:#A80036;stroke-width:2;`.
 */
function renderCross(cross: DestroyCross, paint: SequencePaint, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const size = 2 * DESTROY_CROSS_SIZE * k;
  const style = lineStroke(paint, k);
  return (
    line(cross.x, cross.y, cross.x + size, cross.y + size, style) +
    line(cross.x, cross.y + size, cross.x + size, cross.y, style)
  );
}

/** The crosses one drawer owns: `tile` in the foreground pass
 *  (`LifeEventTile#drawU`), `liveboxes` in the lifeline pass. */
export function renderDestroyCrosses(
  destroy: DestroyGeo,
  drawnBy: DestroyCross['drawnBy'],
  theme: ScaledTheme,
): string {
  return destroy.crosses
    .filter((c) => c.drawnBy === drawnBy)
    .map((c) => renderCross(c, destroy.paint, theme))
    .join('');
}

/** What the lifeline pass draws besides the line: the bars, and the crosses
 *  `LiveBoxes` owns. */
export type LiveboxItem = ActivationGeo | DestroyGeo;

/** The level a livebox item is drawn in: a bar's own, a cross's pass. */
function passLevel(item: LiveboxItem, cross?: DestroyCross): number {
  return item.kind === 'activation' ? item.level : (cross?.level ?? 0);
}

/**
 * `LiveBoxes#drawBoxes` (`teoz/LiveBoxes.java:374-388`) for one participant:
 * `drawOneLevel(1)` to `drawOneLevel(max)` -- each level's bars in step
 * order, each followed by the cross its closing step draws (`:409-417`) --
 * then the indent-0 crosses (`drawDestroys`, `:390-396`). Jar-probed:
 * `A -> B ++`, `A -> B ++`, `B -> A`, `destroy B` draws the level-1 bar,
 * the level-2 bar, then the cross.
 */
function renderLiveboxes(items: readonly LiveboxItem[], theme: ScaledTheme): string {
  const parts = items.flatMap((item) =>
    item.kind === 'activation'
      ? [{ level: passLevel(item), svg: renderActivation(item, theme) }]
      : item.crosses
          .filter((c) => c.drawnBy === 'liveboxes')
          .map((c) => ({ level: passLevel(item, c), svg: renderCross(c, item.paint, theme) })),
  );
  const order = (level: number): number => (level === 0 ? Number.POSITIVE_INFINITY : level);
  // A stable sort: within one level, step order is kept.
  return parts
    .sort((a, b) => order(a.level) - order(b.level))
    .map((p) => p.svg)
    .join('');
}

/**
 * The lifeline pass: `LivingSpaces#drawLifeLines`
 * (`teoz/LivingSpaces.java:157-168`), which loops the living spaces and calls
 * `LivingSpace#drawLineAndLiveboxes` (`teoz/LivingSpace.java:150-167`) on
 * each:
 *
 * ```java
 * if (alive)
 *     mutingLine.drawLine(ug, context, aliveSince, height);
 * liveboxes.drawBoxes(ug, context, getFirstCreateY(), height);
 * ```
 *
 * So the interleave is PER PARTICIPANT -- each one's line, then that same
 * one's boxes -- not every line followed by every box. Confirmed against the
 * jar on `kejoke-76-curu931`, whose golden emits `Particpant_A`'s line and
 * then all seven of A's untitled livebox groups before `Particpant_B`'s line
 * appears at all.
 *
 * This whole pass runs BEFORE the participant heads and before the foreground
 * tiles (`teoz/PlayingSpaceWithParticipants.java:218-227`), which is why
 * activations do not belong in the renderer's event loop.
 */
export function renderLifelinePass(
  participants: readonly ParticipantGeo[],
  liveboxes: readonly LiveboxItem[],
  segmentsOf: (p: ParticipantGeo) => readonly LifelineSegment[],
  theme: ScaledTheme,
): string {
  return participants
    .map((p) => {
      const own = liveboxes.filter((a) => a.participantId === p.id);
      return renderLifelineSegments(p, segmentsOf(p), theme) + renderLiveboxes(own, theme);
    })
    .join('');
}
