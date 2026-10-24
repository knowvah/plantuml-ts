/**
 * What every "line" component of the lifeline pass shares: the `<g><title>`
 * group it opens, and the stroke and colour it applies
 * (`skin/rose/ComponentRoseLine.java`, `ComponentRoseActiveLine.java`,
 * `ComponentRoseDelayLine.java`, `ComponentRoseDestroy.java`). Split out of
 * `renderer-lifeline.ts` (500-line cap) as a pure move.
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UGroup, UGroupType } from '../../core/klimt/shape/UGroup.js';
import { noGradient } from '../../core/paint.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { closeGroup, startGroup } from './renderer-ug.js';

/** `UGroup.singletonMap(UGroupType.TITLE, title)`: the `<g><title>` every
 *  line component opens (`ComponentRoseLine.java:80`,
 *  `ComponentRoseActiveLine.java:78`). `PortableSvgDocument#applyGroupAttribute`
 *  (`:44-52`) appends the title as the group's FIRST child, so the title
 *  always precedes the drawn content; an empty title is still written
 *  `<title></title>`. */
export function titledGroup(title: string): UGroup {
  return UGroup.singletonMap(UGroupType.TITLE, title);
}

/**
 * `getStroke()`'s thickness and dash (`Style.java:299-320`), multiplied by the
 * scale at emission (`SvgGraphics.java:556-561`) -- the `UStroke` a line
 * component applies (`ComponentRoseLine.java:77-78`,
 * `ComponentRoseDelayLine.java:62`, `ComponentRoseDestroy.java:62`).
 */
export function strokeOf(paint: SequencePaint): UStroke {
  const dash = paint.dash;
  return dash === undefined ? UStroke.withThickness(paint.thickness) : new UStroke(dash[0]!, dash[1]!, paint.thickness);
}

/** `ug.apply(color)` for a line component: a `<line>` cannot carry a gradient,
 *  the driver strokes its first colour (`DriverLineSvg.java:76-82`). */
export function lineColor(paint: SequencePaint): Fore {
  return new Fore(noGradient(paint.stroke));
}

/** A group whose shapes the driver dropped (clipped away by a page): the
 *  component still opened it. */
export function drawEmptyGroup(ug: UGraphic, title: string): void {
  startGroup(ug, titledGroup(title));
  closeGroup(ug);
}
