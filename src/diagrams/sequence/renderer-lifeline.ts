/**
 * The lifeline component a sequence participant owns, and the lifeline pass
 * that draws it together with the livebox bars (`renderer-livebox.ts`).
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

import type { ParticipantGeo, LifelineSegment, SequenceGeometry } from './ast.js';
import { lifelineTitle } from './sequence-layout-lifeline.js';
import { closeGroup, startGroup } from './renderer-ug.js';
import { drawEmptyGroup, lineColor, strokeOf, titledGroup } from './renderer-line-component.js';
import { drawLiveboxes, type LiveboxItem } from './renderer-livebox.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { HColors } from '../../core/klimt/color/HColors.js';
import { TransparentFillBehavior } from '../../core/klimt/drawing/svg/svg-option.js';

export type { LiveboxItem };

/** `ComponentRoseLine#drawTitleHoverTargetRect`'s `hoverTargetWidth`
 *  (`ComponentRoseLine.java:101`). */
const HOVER_TARGET_WIDTH = 8;

/** `ComponentRoseLine#getPreferredWidth` (`:96-98`). The lifeline component's
 *  area is one pixel wide, and that width is what both offsets below are
 *  computed from -- it is not an arbitrary unit. */
const LINE_COMPONENT_WIDTH = 1;

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
export function drawLifeline(ug: UGraphic, p: ParticipantGeo, seg: LifelineSegment): void {
  // `seg.y1` is the head ROW's bottom, not this participant's box bottom.
  // Upstream draws every lifeline from body-coordinate 0 and translates the
  // whole body by `getHeadHeight()` (`PlayingSpaceWithParticipants#drawU:213`),
  // so all of them start together however tall each individual head is. For
  // a plain participant those two differ by exactly one pixel — the `+ 1` in
  // `ComponentRoseParticipant#getPreferredHeight:129-132` — which is why
  // `jobadi-87-jegi648`'s box ends at 38 and its lifeline begins at 39.
  const height = seg.y2 - seg.y1;

  // `LivingSpaces#drawLifeLines` (`LivingSpaces.java:165-166`) places the piece at the participant centre
  // and `MutingLine#drawInternal` (`:111`) at `UTranslate.dy(y1)`.
  const piece = ug.apply(new UTranslate(p.centerX, seg.y1));
  // `ug = ug.apply(color); ug = ug.apply(stroke)` (`:77-78`).
  const styled = piece.apply(lineColor(seg.paint)).apply(strokeOf(seg.paint));

  // `drawTitleHoverTargetRect` (`:99-108`) guards its whole body on
  // `dimensionToUse.getHeight() > 0`. The group and its title are already
  // open by then, so a zero-height lifeline still emits `<g><title>` --
  // only the rect is skipped. (Contrast `drawActivation`, whose guard
  // sits ABOVE its own `startGroup`.)
  startGroup(styled, titledGroup(seg.title ?? lifelineTitle(p)));
  if (height > 0) drawHoverTarget(styled, height);
  // `final int x = (int) (dimensionToUse.getWidth() / 2)` (`:82`), then
  // `ug.apply(UTranslate.dx(x)).draw(ULine.vline(height))` (`:83`).
  const x = Math.trunc(LINE_COMPONENT_WIDTH / 2);
  styled.apply(UTranslate.dx(x)).draw(ULine.vline(height));
  closeGroup(styled);
}

/**
 * `ComponentRoseLine#drawTitleHoverTargetRect` (`:99-108`), the body of the
 * `height > 0` guard:
 *
 * ```java
 * ug = ug.apply(UStroke.withThickness(0));
 * ug = ug.apply(HColors.transparent());
 * ug = ug.apply(HColors.transparent(WITH_FILL_OPACITY).bg());
 * ug = ug.apply(UTranslate.dx((dimensionToUse.getWidth() - hoverTargetWidth) / 2));
 * ug.draw(URectangle.build(hoverTargetWidth, dimensionToUse.getHeight()));
 * ```
 *
 */
function drawHoverTarget(ug: UGraphic, height: number): void {
  ug.apply(UStroke.withThickness(0))
    .apply(new Fore(HColors.transparent()))
    .apply(new Back(HColors.transparent(TransparentFillBehavior.WITH_FILL_OPACITY)))
    .apply(UTranslate.dx((LINE_COMPONENT_WIDTH - HOVER_TARGET_WIDTH) / 2))
    .draw(URectangle.build(HOVER_TARGET_WIDTH, height));
}

/** `ComponentRoseDelayLine#drawInternalU` (`:59-65`): one vertical line at
 *  `(int) (width / 2)` = 0 of a 1-wide component, so on the lifeline itself,
 *  in the piece's merged `lifeLine { delay }` style (by default `delay {
 *  LineStyle 1-4 }`, `plantuml.skin:300-305`). It opens no `<g>`. */
function drawDelayLine(ug: UGraphic, p: ParticipantGeo, seg: LifelineSegment): void {
  // `ug = ug.apply(getStroke()).apply(color)` (`:62`), then
  // `ug.apply(UAntiAliasing.ANTI_ALIASING_OFF).apply(UTranslate.dx(x)).draw(
  // ULine.vline(h))` (`:64`). `UAntiAliasing` is not ported (`LimitFinder.ts`)
  // and no driver reads it, so that apply is omitted; the chain still ends on
  // an apply.
  const styled = ug.apply(new UTranslate(p.centerX, seg.y1)).apply(strokeOf(seg.paint)).apply(lineColor(seg.paint));
  const x = Math.trunc(LINE_COMPONENT_WIDTH / 2);
  styled.apply(UTranslate.dx(x)).draw(ULine.vline(seg.y2 - seg.y1));
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
export function drawLifelineSegments(ug: UGraphic, p: ParticipantGeo, segments: readonly LifelineSegment[]): void {
  for (const seg of segments) {
    if (seg.delay) drawDelayLine(ug, p, seg);
    else if (seg.clippedOut === true) drawEmptyGroup(ug, seg.title ?? lifelineTitle(p));
    else drawLifeline(ug, p, seg);
  }
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
export function drawLifelinePass(
  ug: UGraphic,
  participants: readonly ParticipantGeo[],
  liveboxes: readonly LiveboxItem[],
  segmentsOf: (p: ParticipantGeo) => readonly LifelineSegment[],
): void {
  for (const p of participants) {
    drawLifelineSegments(ug, p, segmentsOf(p));
    drawLiveboxes(
      ug,
      liveboxes.filter((a) => a.participantId === p.id),
    );
  }
}

/**
 * The lifeline pass over a scaled page geometry: the livebox items are the
 * activation and destroy events, and each participant's pieces come from
 * layout's `lifelineSegments`.
 */
export function drawLifelinesOf(
  ug: UGraphic,
  geo: Pick<SequenceGeometry, 'participants' | 'events' | 'lifelineSegments'>,
): void {
  const liveboxes = geo.events.filter((e): e is LiveboxItem => e.kind === 'activation' || e.kind === 'destroy');
  drawLifelinePass(ug, geo.participants, liveboxes, (p) => lifelineOf(geo.lifelineSegments, p));
}
