/**
 * SDL/UML box styles (`:label; <<input>>` etc.): an `FtileBox` whose outline
 * is `boxStyle.drawMe(ug, widthTotal, heightTotal, shadowing, roundCorner)`
 * (`FtileBox.java:222`) instead of the PLAIN rounded rectangle, with the
 * label drawn through the SAME Sheet as a plain box (`FtileBox.java:178-181,
 * 224-233`, `activity-creole-sheet.ts#renderActionLabel`).
 *
 * Every `drawMe` first narrows the width by the style's shield (`width -=
 * getShield()`, e.g. `BoxStyle.java:179-181`), so each outline below is
 * built over `node.width - shield` -- the shield itself is the room the
 * input/output point juts into. `BoxStyle.java:110-112` constants:
 * `DELTA_INPUT_OUTPUT = 10`, `DELTA_CONTINUOUS = 5`, `PADDING = 5`. The
 * outlines would live in `ftile/BoxStyle.ts`, whose SDL/UML half is not yet
 * ported; the shield table is `tiles/gtile-action.ts#boxStyleShield`.
 *
 * `actColors` is imported back FROM `activity-renderer-shapes.ts`, which
 * imports {@link renderBoxStyleAction} for its `renderNode` dispatcher -- a
 * safe circular import (function definitions only, called at render time).
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type { Paint } from '../../core/paint.js';
import { line, path, polygon, rect } from '../../core/svg.js';
import { fmt } from '../../core/svg-format.js';
import { activityFontSize, activityLineThickness } from './activity-style-defaults.js';
import { actColors } from './activity-renderer-shapes.js';
import { renderActionLabel } from './activity-creole-sheet.js';
import { DELTA_INPUT_OUTPUT, boxStyleShield } from './tiles/gtile-action.js';

/** `BoxStyle.java:111`. */
const DELTA_CONTINUOUS = 5;
/** `BoxStyle.java:112`. */
const PADDING = 5;

/** The narrowed outline box (`width -= getShield()`) and its ink. */
interface Outline {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly paint: { readonly fill: Paint; readonly stroke: string; readonly strokeWidth: number };
}

type Pt = readonly [number, number];

function poly(o: Outline, pts: readonly Pt[]): string {
  return polygon(
    pts.map(([px, py]) => ({ x: o.x + px, y: o.y + py })),
    o.paint,
  );
}

/** `BoxStyleInput#getShapeInput` (`BoxStyle.java:190-198`), also
 *  `BoxStyleTrigger` (`:415-423`). */
function inputShape(o: Outline): string {
  const { w, h } = o;
  const d = DELTA_INPUT_OUTPUT;
  return poly(o, [
    [0, 0],
    [w + d, 0],
    [w, h / 2],
    [w + d, h],
    [0, h],
  ]);
}

/** `BoxStyleOutput#getShapeOutput` (`BoxStyle.java:220-228`), also
 *  `BoxStyleSendSignal` (`:441-449`). */
function outputShape(o: Outline): string {
  const { w, h } = o;
  return poly(o, [
    [0, 0],
    [w, 0],
    [w + DELTA_INPUT_OUTPUT, h / 2],
    [w, h],
    [0, h],
  ]);
}

/** `BoxStyleProcedure#drawMe` (`BoxStyle.java:239-247`): a square rectangle
 *  plus two `ULine.vline(height)` at `PADDING` and `width - PADDING`. */
function procedureShape(o: Outline): string {
  const { x, y, w, h, paint } = o;
  const ink = { stroke: paint.stroke, strokeWidth: paint.strokeWidth };
  return (
    rect(x, y, w, h, paint) +
    line(x + PADDING, y, x + PADDING, y + h, ink) +
    line(x + w - PADDING, y, x + w - PADDING, y + h, ink)
  );
}

/** `BoxStyleLoad#getShape` (`BoxStyle.java:264-271`). */
function loadShape(o: Outline): string {
  const { w, h } = o;
  const d = DELTA_INPUT_OUTPUT;
  return poly(o, [
    [0, 0],
    [w - d, 0],
    [w, h],
    [d, h],
  ]);
}

/** `BoxStyleSave#getShape` (`BoxStyle.java:288-295`). */
function saveShape(o: Outline): string {
  const { w, h } = o;
  const d = DELTA_INPUT_OUTPUT;
  return poly(o, [
    [d, 0],
    [w, 0],
    [w - d, h],
    [0, h],
  ]);
}

/** `BoxStyleContinuous#getShape` (`BoxStyle.java:312-330`): one `UPath`, two
 *  open `MOVETO`/`LINETO` chevrons, drawn with the box's back colour. */
function continuousShape(o: Outline): string {
  const { x, y, w, h, paint } = o;
  const c = DELTA_CONTINUOUS;
  const p = (px: number, py: number): string => `${fmt(x + px)},${fmt(y + py)}`;
  const d = `M${p(c, 0)} L${p(0, h / 2)} L${p(c, h)} M${p(w - c, 0)} L${p(w, h / 2)} L${p(w - c, h)}`;
  return path(d, paint);
}

/** `BoxStyleTask`/`BoxStyleObject#getShape` (`BoxStyle.java:347-349,
 *  366-368`): `URectangle.build(width, height)`, never rounded. */
function squareShape(o: Outline): string {
  return rect(o.x, o.y, o.w, o.h, o.paint);
}

/** `BoxStyleObjectSignal#getShape` (`BoxStyle.java:385-394`). */
function objectSignalShape(o: Outline): string {
  const { w, h } = o;
  const d = DELTA_INPUT_OUTPUT;
  return poly(o, [
    [-d, 0],
    [w, 0],
    [w + d, h / 2],
    [w, h],
    [-d, h],
    [0, h / 2],
  ]);
}

/** `BoxStyleAcceptEvent#getShape` (`BoxStyle.java:466-474`). */
function acceptEventShape(o: Outline): string {
  const { w, h } = o;
  const d = DELTA_INPUT_OUTPUT;
  return poly(o, [
    [-d, 0],
    [w, 0],
    [w, h],
    [-d, h],
    [0, h / 2],
  ]);
}

/** `BoxStyleTimeEvent#getShape` (`BoxStyle.java:489-498`): the hourglass. */
function timeEventShape(o: Outline): string {
  const half = o.w / 2;
  const third = o.h / 3;
  return poly(o, [
    [half - third, third],
    [half + third, third],
    [half - third, o.h],
    [half + third, o.h],
  ]);
}

/** Every non-PLAIN `BoxStyle` (`BoxStyle.java:61-97`) -> its `drawMe`
 *  outline; keys are `tiles/gtile-action.ts#boxStyleName`'s. */
const BOX_STYLE_OUTLINES: Readonly<Record<string, (o: Outline) => string>> = {
  input: inputShape,
  output: outputShape,
  procedure: procedureShape,
  load: loadShape,
  save: saveShape,
  continuous: continuousShape,
  task: squareShape,
  object: squareShape,
  objectsignal: objectSignalShape,
  trigger: inputShape,
  sendsignal: outputShape,
  acceptevent: acceptEventShape,
  timeevent: timeEventShape,
};

/**
 * `FtileBox#drawU` for a non-PLAIN box style (`FtileBox.java:195-233`): the
 * outline in `borderColor`/`backColor.bg()`/`style.getStroke()` (`:208-222`),
 * then the Sheet text block at the alignment translate, over the FULL
 * `dimTotal` width (shield included, `:224-233`).
 */
export function renderBoxStyleAction(node: ActivityNodeGeo, theme: Theme, style: string): string {
  const c = actColors(theme);
  const shield = boxStyleShield(style);
  const outline: Outline = {
    x: node.x,
    y: node.y,
    w: node.width - shield,
    h: node.height,
    paint: {
      fill: node.color ?? c.nodeFill,
      stroke: c.nodeBorder,
      strokeWidth: activityLineThickness(theme, 'activity'),
    },
  };
  const label = renderActionLabel(node.label ?? '', theme, activityFontSize(theme, 'activity'), { ...node, shield });
  return BOX_STYLE_OUTLINES[style]!(outline) + label;
}
