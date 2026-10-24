/**
 * The livebox side of the lifeline pass: the activation bars
 * (`skin/rose/ComponentRoseActiveLine.java`, drawn by `teoz/LiveBoxes.java`
 * through `LiveBoxesDrawer`) and the destroy crosses
 * (`skin/rose/ComponentRoseDestroy.java`) `LiveBoxes` owns. Split out of
 * `renderer-lifeline.ts` (500-line cap) as a pure move.
 *
 * @see net/sourceforge/plantuml/skin/rose/ComponentRoseActiveLine.java
 * @see net/sourceforge/plantuml/sequencediagram/teoz/LiveBoxes.java
 */

import type { ActivationGeo, DestroyCross, DestroyGeo } from './ast.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { ACTIVATION_HALF_WIDTH } from './sequence-layout-activation.js';
import { DESTROY_CROSS_SIZE } from './sequence-layout-life-event.js';
import { closeGroup, startGroup } from './renderer-ug.js';
import { drawEmptyGroup, lineColor, strokeOf, titledGroup } from './renderer-line-component.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';

/** `ComponentRoseActiveLine.java:75`: `(int) (area width - preferred width) / 2`,
 *  where the area is the drawer's own width -- the preferred width -- so 0. */
const ACTIVE_LINE_X = 0;

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
 * difference from `drawLifeline`, whose own guard sits INSIDE its already-
 * opened group. Two components, two guard positions; upstream's distinction,
 * kept rather than unified.
 *
 * The title is empty because the `Display` handed to this component is empty,
 * and the jar emits `<title></title>` rather than omitting the element.
 *
 * The paint and the shapes are {@link drawActiveLine}'s.
 */
export function drawActivation(ug: UGraphic, act: ActivationGeo): void {
  // The early return, mirrored. It was deliberately withheld while this
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
  if (act.height === 0) return;
  if (act.clippedOut === true) {
    drawEmptyGroup(ug, '');
    return;
  }
  const paint = activationPaintOf(act);
  // `LiveBoxesDrawer#getWidth` (`LiveBoxesDrawer.java:95-97`) is the component's preferred width,
  // 10; `LiveBoxes#drawOneLevel` moves the whole level right by
  // `(levelToDraw - 1) * drawer.getWidth() / 2.0` (`LiveBoxes.java:400`) -- HALF the box's
  // own width per level, not a standalone constant, which is why this reuses
  // the width rather than `CommunicationTile.LIVE_DELTA_SIZE` (they coincide at
  // 5 only because the box is 10 wide). Level 1 is centred on the lifeline;
  // each nested level steps right by half a box, so the stack reads as a
  // staircase.
  //
  // Jar-verified on `kejoke-76-curu931`, four levels deep on one lifeline at
  // cx=57.075: its golden runs x=52.075, 57.075, 62.075, 67.075.
  const width = ACTIVATION_HALF_WIDTH * 2;
  const level = ug.apply(new UTranslate(act.lifelineX, 0)).apply(UTranslate.dx(((act.level - 1) * width) / 2));
  // `LiveBoxesDrawer#drawInternal` (`LiveBoxesDrawer.java:131-148`): `comp.drawU(ug.apply(
  // new UTranslate(-width / 2, ya)), area, context)`.
  const comp = level.apply(new UTranslate(-width / 2, act.y));
  drawActiveLine(comp, act, paint, width);
}

/**
 * `ComponentRoseActiveLine#drawInternalU` past its two guards (`:71-105`),
 * on the graphic `LiveBoxesDrawer` positioned (above).
 *
 * ```java
 * ug.startGroup(UGroup.singletonMap(UGroupType.TITLE, stringsToDisplay.toTooltipText()));
 * final URectangle rect = URectangle.build(getPreferredWidth(stringBounder), h);
 * if (symbolContext.isShadowing())
 *     rect.setDeltaShadow(1);
 * ug = ug.apply(symbolContext.getForeColor());
 * if (closeUp && closeDown) {
 *     ug.apply(symbolContext.getBackColor().bg()).apply(UTranslate.dx(x)).draw(rect);
 * } else { ... }
 * ug.closeGroup();
 * ```
 *
 * `x` is `(int) (area.getWidth() - getPreferredWidth()) / 2` (`:75`); the area
 * is the drawer's own width, so it is 0. The title is empty because the
 * `Display` handed to this component is empty, and the jar emits
 * `<title></title>` rather than omitting the element.
 *
 * Paint is the bar's merged `activationBox` style (`sequence-layout-
 * activation.ts`), read as `getSymbolContext()` (`:63`): the fill is its
 * back colour, the stroke its fore colour (`:85-90`). The component applies
 * no `UStroke`, so the outline keeps the driver's unit stroke whatever the
 * style's `LineThickness` (jar-probed: `activationBox { LineThickness 3 }`
 * still draws `stroke-width:1`); `isShadowing()` only gates a fixed
 * `setDeltaShadow(1)` (`:82-83`), and no corner is read.
 */
function drawActiveLine(ug: UGraphic, act: ActivationGeo, paint: SequencePaint, width: number): void {
  const x = ACTIVE_LINE_X;
  startGroup(ug, titledGroup(''));
  const rect = URectangle.build(width, act.height);
  if (paint.shadowing > 0) rect.setDeltaShadow(1);
  const fore = ug.apply(new Fore(paint.stroke));
  if (act.open === undefined) fore.apply(new Back(paint.fill)).apply(UTranslate.dx(x)).draw(rect);
  else drawOpenBar(fore, act, rect, x, paint);
  closeGroup(ug);
}

/** The paint layout resolved for this bar (`sequence-layout-activation.ts`). */
function activationPaintOf(act: ActivationGeo): SequencePaint {
  if (act.paint === undefined) throw new Error(`activation of ${act.participantId} carries no paint`);
  return act.paint;
}

/**
 * The `closeUp && closeDown` false branch of `ComponentRoseActiveLine
 * #drawInternalU` (`:88-101`): the rect is filled AND stroked with the back
 * colour (`apply(back.bg()).apply(back)`: the second apply is a FORE change),
 * then the two sides are drawn, then whichever ends are closed.
 */
function drawOpenBar(ug: UGraphic, act: ActivationGeo, rect: URectangle, x: number, paint: SequencePaint): void {
  const width = rect.getWidth();
  ug.apply(new Back(paint.fill)).apply(new Fore(paint.fill)).apply(UTranslate.dx(x)).draw(rect);
  const vline = ULine.vline(act.height);
  ug.apply(UTranslate.dx(x)).draw(vline);
  ug.apply(UTranslate.dx(x + width)).draw(vline);
  const hline = ULine.hline(width);
  if (act.open!.closeUp) ug.apply(UTranslate.dx(x)).draw(hline);
  if (act.open!.closeDown) ug.apply(new UTranslate(x, act.height)).draw(hline);
}

/**
 * `ComponentRoseDestroy#drawInternalU` (`:60-65`): two `2 * crossSize`
 * diagonals from the cross's top-left, down-right then up-right, in
 * `LineColor` at the style's stroke -- by default `destroy { LineColor
 * #A80036; LineStyle 0; LineThickness 2 }` (`plantuml.skin:149-153`), which
 * the jar emits as `stroke:#A80036;stroke-width:2;`.
 */
export function drawCross(ug: UGraphic, cross: DestroyCross, paint: SequencePaint): void {
  const size = 2 * DESTROY_CROSS_SIZE;
  // `LiveBoxesDrawer#drawDestroyIfNeeded` (`LiveBoxesDrawer.java:123-129`) positions the component
  // at the cross's top-left; then `ug.apply(getStroke()).apply(foregroundColor)`
  // (`ComponentRoseDestroy.java:62`).
  const styled = ug.apply(new UTranslate(cross.x, cross.y)).apply(strokeOf(paint)).apply(lineColor(paint));
  styled.draw(new ULine(size, size));
  styled.apply(UTranslate.dy(size)).draw(new ULine(size, -size));
}

/** The crosses one drawer owns: `tile` in the foreground pass
 *  (`LifeEventTile#drawU`), `liveboxes` in the lifeline pass. */
export function drawDestroyCrosses(ug: UGraphic, destroy: DestroyGeo, drawnBy: DestroyCross['drawnBy']): void {
  for (const c of destroy.crosses.filter((cross) => cross.drawnBy === drawnBy)) drawCross(ug, c, destroy.paint);
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
export function drawLiveboxes(ug: UGraphic, items: readonly LiveboxItem[]): void {
  const parts = items.flatMap((item) =>
    item.kind === 'activation'
      ? [{ level: passLevel(item), draw: () => drawActivation(ug, item) }]
      : item.crosses
          .filter((c) => c.drawnBy === 'liveboxes')
          .map((c) => ({ level: passLevel(item, c), draw: () => drawCross(ug, c, item.paint) })),
  );
  const order = (level: number): number => (level === 0 ? Number.POSITIVE_INFINITY : level);
  // A stable sort: within one level, step order is kept.
  for (const part of parts.sort((a, b) => order(a.level) - order(b.level))) part.draw();
}
