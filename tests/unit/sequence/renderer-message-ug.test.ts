/**
 * sdd3-T8d: messages, arrowheads and self messages are drawn through the
 * page's `UGraphic`. A recording graphic logs, per draw, the chain of
 * `apply`s on the instance that drew (`tests/helpers/recording-ugraphic.ts`),
 * pinning each `draw<X>` against the Java lines it mirrors -- the apply ORDER
 * is what `UGraphicHandwritten` (T8f) restarts its RNG on.
 *
 * Frame: `fromX 10, toX 100` -> `lenFull 90`, so `len = 89`, `pos1 = 1`,
 * `pos2 = 88` (`ComponentRoseArrow.java:96-101`); the default skin's arrow
 * ink is `#181818` at thickness 1 (`plantuml.skin`).
 */
import { describe, it, expect } from 'vitest';
import {
  drawLabelPadder,
  drawMessage,
  drawMessageLabel,
  drawMulticast,
} from '../../../src/diagrams/sequence/renderer-message.js';
import { drawFlatMessageArrow } from '../../../src/diagrams/sequence/renderer-arrowhead.js';
import { drawSelfMessageLeft, drawSelfMessageRight } from '../../../src/diagrams/sequence/renderer-message-self.js';
import { drawMarkup } from './draw-markup.js';
import { pageThemeOf } from '../../../src/diagrams/sequence/renderer-ug.js';
import { arrowConfigurationOf, type ArrowSpec } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type { MessageGeo, ParticipantGeo } from '../../../src/diagrams/sequence/ast.js';
import type { TextRun } from '../../../src/diagrams/sequence/text-block-geo.js';
import { PAINT_NONE } from '../../../src/core/svg.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { record, type RecordedEvent } from '../../helpers/recording-ugraphic.js';
import { tagsOf } from '../../helpers/svg-tags.js';

/** The message drawn on the page's graphic and read back as markup. */
const renderMessage = (msg: MessageGeo, t: typeof THEME): string => drawMarkup((ug) => drawMessage(ug, msg, t), t);

const MEASURER = new DeterministicMeasurer();
const THEME = pageThemeOf(defaultTheme, MEASURER);
const INK = '#181818';
const ARROW_ORIGIN_CHAIN = ['translate(10,50)', `fore(${INK})`];
const SELF_STROKE = 'stroke(0,0,1)';

const message = (spec: ArrowSpec, over: Partial<MessageGeo> = {}): MessageGeo => ({
  kind: 'message',
  fromX: 10,
  toX: 100,
  y: 50,
  label: '',
  arrow: arrowConfigurationOf(spec),
  arrowDirection: 'right',
  labelLines: [],
  ...over,
});

const drawFlat = (msg: MessageGeo): RecordedEvent[] =>
  record(MEASURER, (ug) => drawFlatMessageArrow(ug, msg, msg.arrow, THEME));

/** The apply chain of one recorded draw (none for a url edge). */
const chainOf = (e: RecordedEvent | undefined): readonly string[] => (e !== undefined && 'chain' in e ? e.chain : []);

const drawn = (log: readonly RecordedEvent[]): string[] => log.map((e) => ('draw' in e ? e.draw : 'other'));

describe('drawFlatMessageArrow (ComponentRoseArrow.java:91-162)', () => {
  it('NORMAL: the head polygon (`getForegroundColor().bg()`) THEN the shaft, `ULine(len, 0)` at `(start, posArrow)`', () => {
    // :152-154 `drawDressing2(ug.apply(new UTranslate(pos2, posArrow + inclination2)))`, :230/:267
    // `ug.apply(getForegroundColor().bg()).draw(polygon)`; :158 `applyStroke(ug, style)
    // .apply(new UTranslate(start, posArrow)).draw(new ULine(len, 0))`; `len = 89 - arrowDeltaX / 2`.
    expect(drawFlat(message({}))).toEqual([
      { draw: 'UPolygon', chain: [...ARROW_ORIGIN_CHAIN, 'translate(88,0)', `back(${INK})`] },
      { draw: 'ULine(84,0)', chain: [...ARROW_ORIGIN_CHAIN, 'stroke(0,0,1)', 'translate(0,0)'] },
    ]);
  });

  it('NORMAL: the polygon is `getPolygonNormal` in the tip-local frame (nice arrow adds the inset point)', () => {
    // :272-291: `(-dx,-dy) (0,0) (-dx,+dy)` and, `niceArrow`, `(-dx + 4, 0)`, at the tip (10 + 88, 50).
    const svg = renderMessage(message({}), THEME);
    expect(tagsOf(svg, 'polygon')[0]).toMatchObject({
      points: '88,46,98,50,88,54,92,50',
      fill: INK,
      stroke: INK,
      'stroke-width': '1',
    });
  });

  it('ASYNC: each stroke on its own `applyThicknessOnly` instance, drawn before the shaft', () => {
    // :211-216 `applyThicknessOnly(ug).draw(new ULine(dx, -dy).rotate(..))`, then `new ULine(dx, dy)`;
    // :246-254 the head side leaves to the left. `len` is not trimmed by an open head.
    const log = drawFlat(message({ async1: true, async2: true }));
    const head1 = [...ARROW_ORIGIN_CHAIN, 'translate(1,0)', 'stroke(0,0,1)'];
    const head2 = [...ARROW_ORIGIN_CHAIN, 'translate(88,0)', 'stroke(0,0,1)'];
    expect(log).toEqual([
      { draw: 'ULine(10,-4)', chain: head1 },
      { draw: 'ULine(10,4)', chain: head1 },
      { draw: 'ULine(-10,-4)', chain: head2 },
      { draw: 'ULine(-10,4)', chain: head2 },
      { draw: 'ULine(89,0)', chain: [...ARROW_ORIGIN_CHAIN, 'stroke(0,0,1)', 'translate(0,0)'] },
    ]);
  });

  it('CROSSX: one `UStroke.withThickness(2)`, each saltire stroke on its own translate', () => {
    // :255-260 `ug = ug.apply(UStroke.withThickness(2))`, `ug.apply(new UTranslate(-spaceCrossX -
    // arrowDeltaX, -arrowDeltaX / 2)).draw(new ULine(dx, dx))` and the mirrored second;
    // :134-135 `len -= 2 * spaceCrossX` -> 77.
    const head = [...ARROW_ORIGIN_CHAIN, 'translate(88,0)', 'stroke(0,0,2)'];
    expect(drawFlat(message({ cross2: true }))).toEqual([
      { draw: 'ULine(10,10)', chain: [...head, 'translate(-16,-5)'] },
      { draw: 'ULine(10,-10)', chain: [...head, 'translate(-16,5)'] },
      { draw: 'ULine(77,0)', chain: [...ARROW_ORIGIN_CHAIN, 'stroke(0,0,1)', 'translate(0,0)'] },
    ]);
  });

  it('CIRCLE: the `o` ellipse first (stroke, fore, back, top-left translate), then the pushed-off head', () => {
    // :237-243 `ug.apply(UStroke.withThickness(thinCircle)).apply(getForegroundColor())
    // .apply(getBackgroundColor().bg())`, `ug.apply(new UTranslate(-diamCircle / 2 + thinCircle,
    // -diamCircle / 2 - thinCircle / 2)).draw(circle)`; `ug.apply(UTranslate.dx(-diamCircle / 2
    // - thinCircle))` pushes the polygon 5.5 left. `len = 89 - 5.5 - 5`.
    const log = drawFlat(message({ circle2: true }));
    const tip = [...ARROW_ORIGIN_CHAIN, 'translate(88,0)'];
    expect(log).toHaveLength(3);
    expect(log[0]).toEqual({
      draw: 'UEllipse(8,8)',
      chain: [...tip, 'stroke(0,0,1.5)', `fore(${INK})`, expect.stringMatching(/^back\(/), 'translate(-2.5,-4.75)'],
    });
    expect(log[1]).toEqual({ draw: 'UPolygon', chain: [...tip, `back(${INK})`] });
    expect(log[2]).toEqual({
      draw: 'ULine(78.5,0)',
      chain: [...ARROW_ORIGIN_CHAIN, 'stroke(0,0,1)', 'translate(0,0)'],
    });
    const svg = renderMessage(message({ circle2: true }), THEME);
    expect(tagsOf(svg, 'polygon')[0]!.points).toBe('82.5,46,92.5,50,82.5,54,86.5,50');
    expect(tagsOf(svg, 'ellipse')[0]).toMatchObject({ cx: '99.5', cy: '49.25', rx: '4', ry: '4' });
  });

  it('CIRCLE at the tail with a NORMAL head: the circle sits left of the tip, the head is pushed right', () => {
    // :201-206 `UTranslate(-diamCircle / 2 - thinCircle, ..)`, `ug = ug.apply(UTranslate.dx(diamCircle / 2
    // + thinCircle))` (not for CROSSX).
    const log = drawFlat(message({ circle1: true, both: true }));
    expect(drawn(log).slice(0, 2)).toEqual(['UEllipse(8,8)', 'UPolygon']);
    expect(chainOf(log[0])).toEqual([
      ...ARROW_ORIGIN_CHAIN,
      'translate(1,0)',
      'stroke(0,0,1.5)',
      `fore(${INK})`,
      'back(#000000)',
      'translate(-5.5,-4.75)',
    ]);
  });

  it('a right-to-left message is drawn forwards from the REVERSED configuration at min(x1, x2)', () => {
    // `CommunicationTile.java:337-339`, `getComponent:145-146`.
    const log = drawFlat(message({}, { fromX: 100, toX: 10 }));
    expect(log[0]).toEqual({ draw: 'UPolygon', chain: [...ARROW_ORIGIN_CHAIN, 'translate(1,0)', `back(${INK})`] });
    expect(log[1]).toEqual({
      draw: 'ULine(84,0)',
      chain: [...ARROW_ORIGIN_CHAIN, 'stroke(0,0,1)', 'translate(5,0)'],
    });
  });

  it('inclination 1: the shaft is `drawLine` back to local x 0, each head at its own y', () => {
    // :160 `drawLine(applyStroke(ug), start + len, posArrow, 0, posArrow + inclination1)`;
    // `drawLine` = `apply(new UTranslate(x1, y1))`, `draw(new ULine(x2 - x1, y2 - y1))` (:182-186).
    const msg = message({ cross2: true }, { arrow: { ...arrowConfigurationOf({ cross2: true }), inclination: 6 } });
    const log = drawFlat(msg);
    expect(log.at(-1)).toEqual({
      draw: 'ULine(-77,6)',
      chain: [...ARROW_ORIGIN_CHAIN, 'stroke(0,0,1)', 'translate(77,0)'],
    });
  });

  it('inclination 2: the shaft runs out to `pos2`', () => {
    // :162 `drawLine(.., start, posArrow, pos2, posArrow + inclination2)`: `start` 5 (a FULL NORMAL tail
    // head), `pos2` 88, so `new ULine(88 - 5, 4)`.
    const msg = message({ both: true }, { arrow: { ...arrowConfigurationOf({ both: true }), inclination: 4 } });
    expect(drawFlat(msg).at(-1)).toEqual({
      draw: 'ULine(83,4)',
      chain: [...ARROW_ORIGIN_CHAIN, 'stroke(0,0,1)', 'translate(5,0)'],
    });
  });

  it('a dotted body strokes 2,2 at the style thickness (`ArrowConfiguration#applyStroke`)', () => {
    // ArrowConfiguration.java:244-252: `new UStroke(2, 2, stroke.getThickness())`.
    const log = drawFlat(message({ dashed: true }));
    expect(chainOf(log.at(-1))).toContain('stroke(2,2,1)');
  });
});

describe('drawSelfMessageRight (ComponentRoseSelfArrow.java:80-174)', () => {
  const self = (spec: ArrowSpec, over: Partial<MessageGeo> = {}): MessageGeo =>
    message(spec, { fromX: 10, toX: 52, selfReturnX: 11, arrowDirection: 'self', ...over });
  const drawRight = (msg: MessageGeo): RecordedEvent[] =>
    record(MEASURER, (ug) => drawSelfMessageRight(ug, msg, msg.arrow, THEME));
  const component = ['translate(10,50)', `fore(${INK})`];

  it('draws the three strokes on `ug2` (stroked once, never drawn on) and then the foot head', () => {
    // :124-126 `ug2.apply(new UTranslate(x1, textHeight)).draw(ULine.hline(xRight - x1))`, the vline
    // `UTranslate(xRight, ..)`, the foot `UTranslate(x2, textHeight + arrowHeight)`; :171-172 the
    // polygon `ug.apply(getForegroundColor().bg()).apply(UTranslate.dx(x2))`.
    const ug2 = [...component, SELF_STROKE];
    expect(drawRight(self({}))).toEqual([
      { draw: 'ULine(42,0)', chain: [...ug2, 'translate(0,0)'] },
      { draw: 'ULine(0,13)', chain: [...ug2, 'translate(42,0)'] },
      { draw: 'ULine(41,0)', chain: [...ug2, 'translate(1,13)'] },
      { draw: 'UPolygon', chain: [...component, 'translate(1,13)', `back(${INK})`] },
    ]);
  });

  it('circles come first, on `ug2`, each with its own stroke/fore/back/top-left chain', () => {
    // :94-112: `ug2.apply(UStroke.withThickness(thinCircle)).apply(fore).apply(back.bg())
    // .apply(new UTranslate(x1 + 1 - diamCircle / 2 - thinCircle, textHeight - diamCircle / 2 - thinCircle / 2))`.
    const log = drawRight(self({ circle1: true, circle2: true }));
    expect(drawn(log).slice(0, 2)).toEqual(['UEllipse(8,8)', 'UEllipse(8,8)']);
    // The jar's one translate `(x1 + 1 - 4 - 1.5, textHeight - 4 - 0.75)` is the centre `(-0.5, -0.75)`
    // then the top-left `(-4, -4)`.
    expect(log[0]).toEqual({
      draw: 'UEllipse(8,8)',
      chain: [
        ...component,
        SELF_STROKE,
        'translate(-0.5,-0.75)',
        'stroke(0,0,1.5)',
        `fore(${INK})`,
        'back(#000000)',
        'translate(-4,-4)',
      ],
    });
    expect(chainOf(log[1])).toEqual([
      ...component,
      SELF_STROKE,
      'translate(-0.5,12.25)',
      'stroke(0,0,1.5)',
      `fore(${INK})`,
      'back(#000000)',
      'translate(-4,-4)',
    ]);
    const svg = renderMessage(self({ circle1: true, circle2: true }), THEME);
    const ellipses = tagsOf(svg, 'ellipse');
    expect(ellipses.map((e) => [e.cx, e.cy])).toEqual([
      ['9.5', '49.25'],
      ['9.5', '62.25'],
    ]);
  });

  it('ASYNC heads: the open pair on the outgoing end, then on the foot', () => {
    // :138-146 `applyThicknessOnly(ug).apply(new UTranslate(x1, textHeight)).draw(new ULine(dx, dy))`,
    // :159-166 the foot pair, both leaving to the right; the shaft gives up one pixel for the ASYNC foot
    // (:121-122), so the foot stroke starts at 0 and is 42 long.
    const log = drawRight(self({ async1: true, async2: true, both: true }));
    expect(log.map((e) => ('draw' in e ? e.draw : ''))).toEqual([
      'ULine(42,0)',
      'ULine(0,13)',
      'ULine(42,0)',
      'ULine(10,4)',
      'ULine(10,-4)',
      'ULine(10,-4)',
      'ULine(10,4)',
    ]);
  });

  it('CROSSX heads are square to the component origin, one stroke(2) each', () => {
    // :131-136 `UTranslate(spaceCrossX, textHeight - arrowDeltaX / 2)`, `ULine(dx, dx)` under
    // `UStroke.withThickness(2)`; `x1 += 2 * spaceCrossX`.
    const log = drawRight(self({ cross1: true, cross2: true, both: true }));
    const crosses = log.filter((e): e is Extract<RecordedEvent, { draw: string }> => 'draw' in e).slice(3);
    expect(crosses.map((e) => e.chain.at(-2))).toEqual([
      'stroke(0,0,2)',
      'stroke(0,0,2)',
      'stroke(0,0,2)',
      'stroke(0,0,2)',
    ]);
    expect(crosses.map((e) => e.chain.at(-1))).toEqual([
      'translate(6,-5)',
      'translate(6,5)',
      'translate(6,-5)',
      'translate(6,5)',
    ]);
  });
});

describe('drawSelfMessageLeft (ComponentRoseSelfArrow.java:176-273)', () => {
  const self = (spec: ArrowSpec, over: Partial<MessageGeo> = {}): MessageGeo =>
    message(spec, {
      fromX: 62,
      toX: 20,
      selfReturnX: 61,
      arrowDirection: 'self',
      arrow: { ...arrowConfigurationOf(spec), reverseDefine: true },
      ...over,
    });
  const drawLeft = (msg: MessageGeo): RecordedEvent[] =>
    record(MEASURER, (ug) => drawSelfMessageLeft(ug, msg, msg.arrow, THEME));
  const component = ['translate(62,50)', `fore(${INK})`];

  it('draws the strokes from the vertical at `prefTextWidth - xRight`, then the foot head', () => {
    // :228-230 `ug2.apply(new UTranslate(prefTextWidth - xRight, textHeight)).draw(ULine.hline(xRight -
    // x1))` / `vline(arrowHeight)` / `(.., textHeight + arrowHeight)` `hline(xRight - x2 - extraline)`;
    // :270 `getPolygon().translate(0, textHeight + arrowHeight)`.
    const ug2 = [...component, SELF_STROKE];
    expect(drawLeft(self({}))).toEqual([
      { draw: 'ULine(41,0)', chain: [...ug2, 'translate(-42,0)'] },
      { draw: 'ULine(0,13)', chain: [...ug2, 'translate(-42,0)'] },
      { draw: 'ULine(40,0)', chain: [...ug2, 'translate(-42,13)'] },
      { draw: 'UPolygon', chain: [...component, 'translate(-2,13)', `back(${INK})`] },
    ]);
  });

  it('circles, saltires and open heads follow `at(inset)` = `prefTextWidth - inset`', () => {
    const circles = drawLeft(self({ circle1: true, circle2: true, both: true }));
    expect(drawn(circles).slice(0, 2)).toEqual(['UEllipse(8,8)', 'UEllipse(8,8)']);
    const crosses = drawLeft(self({ cross1: true, cross2: true, both: true }));
    expect(
      drawn(crosses)
        .filter((d) => d.startsWith('ULine'))
        .slice(3),
    ).toEqual(['ULine(10,10)', 'ULine(10,-10)', 'ULine(10,10)', 'ULine(10,-10)']);
    const open = drawLeft(self({ async2: true }));
    expect(drawn(open).slice(3)).toEqual(['ULine(-10,-4)', 'ULine(-10,4)']);
  });
});

describe('drawMulticast (CommunicationTile.java:373-390)', () => {
  const multi = message({}, { multicast: [{ fromX: 10, toX: 200, y: 52 }] });

  it('draws each extra target as a flat arrow of the message configuration, without a label', () => {
    // :386-388 `ug.apply(UTranslate.dx(Math.min(x1, x2))).apply(UTranslate.dy(dy))`, `comp.drawU(ug2, ..)`.
    const log = record(MEASURER, (ug) => drawMulticast(ug, multi, THEME));
    expect(log).toEqual([
      { draw: 'UPolygon', chain: ['translate(10,52)', `fore(${INK})`, 'translate(188,0)', `back(${INK})`] },
      { draw: 'ULine(184,0)', chain: ['translate(10,52)', `fore(${INK})`, 'stroke(0,0,1)', 'translate(0,0)'] },
    ]);
  });

  it('a hidden arrow draws no multicast target (`ComponentRoseArrow.java:85-87`)', () => {
    const hidden = { ...multi, arrow: { ...multi.arrow, hidden: true } };
    expect(record(MEASURER, (ug) => drawMulticast(ug, hidden, THEME))).toEqual([]);
  });

  it('a self message with a multicast arrow reaches the graphic multicast first, then its loop, then its label', () => {
    // `CommunicationTile#drawU:338` runs `drawMulticast` BEFORE the component draws.
    const run: TextRun = { text: 'hi', x: 12, y: 40, textWidth: 10, textAscent: 11, textLineHeight: 16 };
    const msg = message(
      {},
      { arrowDirection: 'self', toX: 52, selfReturnX: 11, multicast: multi.multicast!, labelLines: [run] },
    );
    const log = record(MEASURER, (ug) => drawMessage(ug, msg, THEME));
    expect(drawn(log)).toEqual([
      'UPolygon',
      'ULine(184,0)',
      'ULine(42,0)',
      'ULine(0,13)',
      'ULine(41,0)',
      'UPolygon',
      'UText(hi)',
    ]);
  });
});

describe('drawMessage (CommunicationTile.java:324-371)', () => {
  const run: TextRun = { text: 'hello', x: 20, y: 44, textWidth: 30, textAscent: 11, textLineHeight: 16 };
  const participant: ParticipantGeo = {
    id: 'B',
    display: 'B',
    type: 'participant',
    x: 90,
    y: 40,
    width: 20,
    height: 20,
    centerX: 100,
    background: '#FFF',
    border: INK,
    labelRuns: [],
  };

  it('draws the arrow, then the label text at its run position', () => {
    // ComponentRoseArrow.java:179 `getTextBlock().drawU(..)` after the shaft.
    const log = record(MEASURER, (ug) => drawMessage(ug, message({}, { labelLines: [run] }), THEME));
    expect(drawn(log)).toEqual(['UPolygon', 'ULine(84,0)', 'UText(hello)']);
    expect(log.at(-1)).toEqual({ draw: 'UText(hello)', chain: ['translate(20,44)'] });
  });

  it('puts the autonumber run first, then the label lines (`Display.java:703-712`)', () => {
    const number: TextRun = { ...run, text: '1', x: 12 };
    const log = record(MEASURER, (ug) =>
      drawMessage(ug, message({}, { labelNumber: number, labelLines: [run] }), THEME),
    );
    expect(drawn(log).slice(-2)).toEqual(['UText(1)', 'UText(hello)']);
  });

  it('a part-anchored message draws nothing (`CommunicationTile.java:328-331`)', () => {
    expect(record(MEASURER, (ug) => drawMessage(ug, message({}, { partAnchored: true }), THEME))).toEqual([]);
  });

  it('a hidden arrow draws no head, shaft or label (`ComponentRoseArrow.java:85-87`)', () => {
    const msg = message({}, { labelLines: [run], arrow: { ...arrowConfigurationOf({}), hidden: true } });
    expect(record(MEASURER, (ug) => drawMessage(ug, msg, THEME))).toEqual([]);
  });

  it('a create message draws the created head FIRST, even when the arrow is hidden', () => {
    // CommunicationTile.java:351-371 `livingSpace2.drawHead(..)` before `comp.drawU(..)`.
    const msg = message(
      {},
      { createdHead: { participant, y: 40 }, arrow: { ...arrowConfigurationOf({}), hidden: true } },
    );
    const log = record(MEASURER, (ug) => drawMessage(ug, msg, THEME));
    expect(drawn(log)[0]).toBe('URectangle(20,20)');
    expect(drawn(log).filter((d) => d.startsWith('ULine'))).toEqual([]);
  });
});

describe('drawLabelPadder (Padder.java:119-135)', () => {
  const box = { x: 20, y: 30, width: 40, height: 20, fill: '#FFF', stroke: '#00F', roundCorner: 0 };
  const draw = (over: Partial<typeof box>): RecordedEvent[] =>
    record(MEASURER, (ug) => drawLabelPadder(ug, message({}, { labelPadder: { ...box, ...over } })));

  it('applies the margin translate, the border colour, then the background, and draws one rectangle', () => {
    // :120 `ug.apply(margin.getTranslate())`, :125 `ug2.apply(borderColor)`, :130
    // `ug2.apply(backgroundColor.bg())`, :133-134 `ug2.draw(URectangle.build(..).rounded(roundCorner))`.
    expect(draw({})).toEqual([{ draw: 'URectangle(40,20)', chain: ['translate(20,30)', 'fore(#00F)', 'back(#FFF)'] }]);
  });

  it('an unset border colour and background are `HColors.none()` (:123,:128)', () => {
    expect(chainOf(draw({ fill: PAINT_NONE, stroke: PAINT_NONE })[0])).toEqual([
      'translate(20,30)',
      `fore(${PAINT_NONE})`,
      `back(${PAINT_NONE})`,
    ]);
  });

  it('`rounded(roundCorner)` reaches the SVG as rx = ry = roundCorner / 2', () => {
    const svg = renderMessage(message({}, { labelPadder: { ...box, roundCorner: 15 } }), THEME);
    expect(tagsOf(svg, 'rect')[0]).toMatchObject({ rx: '7.5', ry: '7.5', fill: '#FFF', stroke: '#00F' });
  });

  it('draws nothing without a padder, and precedes the label runs', () => {
    expect(record(MEASURER, (ug) => drawLabelPadder(ug, message({})))).toEqual([]);
    const run: TextRun = { text: 'x', x: 25, y: 44, textWidth: 5, textAscent: 11, textLineHeight: 16 };
    const msg = message({}, { labelPadder: { ...box }, labelLines: [run] });
    expect(drawn(record(MEASURER, (ug) => drawMessageLabel(ug, msg)))).toEqual(['URectangle(40,20)', 'UText(x)']);
  });
});
