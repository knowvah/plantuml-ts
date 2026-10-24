/**
 * sdd3-T8b: the lifeline and livebox draw functions hand a `UGraphic` the
 * jar's `apply` chains. A recording `UGraphic` logs, per draw, the chain of
 * changes applied to the instance that drew, so each `draw<X>` is pinned
 * against the Java lines it mirrors -- the apply ORDER is what
 * `UGraphicHandwritten` (T8f) depends on (a draw is jiggled by the RNG its
 * instance's last `apply` restarted).
 */
import { describe, it, expect } from 'vitest';
import {
  drawLifeline,
  drawLifelineSegments,
  drawLifelinePass,
  drawLifelinesOf,
} from '../../../src/diagrams/sequence/renderer-lifeline.js';
import { drawActivation, drawCross, drawDestroyCrosses } from '../../../src/diagrams/sequence/renderer-livebox.js';
import type {
  ActivationGeo,
  DestroyCross,
  DestroyGeo,
  LifelineSegment,
  ParticipantGeo,
} from '../../../src/diagrams/sequence/ast.js';
import { componentStyle, paintOf } from '../../../src/diagrams/sequence/sequence-skin-param.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../../src/core/klimt/color/HColorSimple.js';
import { Back } from '../../../src/core/klimt/Back.js';
import { Fore } from '../../../src/core/klimt/Fore.js';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import type { UChange } from '../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import { ULine } from '../../../src/core/klimt/shape/ULine.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import type { UGroup } from '../../../src/core/klimt/shape/UGroup.js';
import { UGroupType } from '../../../src/core/klimt/shape/UGroup.js';
import {
  DEFAULT_DELAY_LINE_PAINT,
  DEFAULT_LIFELINE_PAINT,
  DEFAULT_SEQUENCE_STYLE_BUILDER,
} from '../../helpers/sequence-source.js';

/** What the recorder logs: a draw with its apply chain, or a group edge. */
type Event =
  { readonly draw: string; readonly chain: readonly string[] } | { readonly start: string } | { readonly close: true };

function paintLabel(paint: unknown): string {
  if (typeof paint === 'string') return paint;
  if (paint instanceof HColorSimple) {
    return `${paint.isTransparent() ? 'transparent' : 'color'}/${paint.transparentFillBehavior()}`;
  }
  return String(paint);
}

function changeLabel(change: UChange): string {
  if (change instanceof UTranslate) return `translate(${String(change.getDx())},${String(change.getDy())})`;
  if (change instanceof UStroke)
    return `stroke(${String(change.getDashVisible())},${String(change.getDashSpace())},${String(change.getThickness())})`;
  if (change instanceof Fore) return `fore(${paintLabel(change.getColor())})`;
  if (change instanceof Back) return `back(${paintLabel(change.getBackColor())})`;
  throw new Error('unexpected change');
}

function shapeLabel(shape: UShape): string {
  if (shape instanceof ULine) return `ULine(${String(shape.getDX())},${String(shape.getDY())})`;
  if (shape instanceof URectangle) {
    const shadow = shape.getDeltaShadow() === 0 ? '' : `+shadow${String(shape.getDeltaShadow())}`;
    return `URectangle(${String(shape.getWidth())},${String(shape.getHeight())})${shadow}`;
  }
  throw new Error('unexpected shape');
}

/** A `UGraphic` that logs every draw with the chain of applies on its own
 *  instance, and every `startGroup`/`closeGroup`. */
class RecordingUGraphic implements UGraphic {
  constructor(
    readonly log: Event[] = [],
    private readonly chain: readonly string[] = [],
  ) {}

  apply(change: UChange): UGraphic {
    return new RecordingUGraphic(this.log, [...this.chain, changeLabel(change)]);
  }

  draw(shape: UShape): void {
    this.log.push({ draw: shapeLabel(shape), chain: this.chain });
  }

  startGroup(group: UGroup): void {
    this.log.push({ start: group.asMap().get(UGroupType.TITLE) ?? '' });
  }

  closeGroup(): void {
    this.log.push({ close: true });
  }

  getParam(): UParam {
    throw new Error('the draw functions never read the param');
  }

  getTranslate(): UTranslate {
    return UTranslate.none();
  }

  getStringBounder(): StringBounder {
    throw new Error('the draw functions never measure');
  }
}

const builder = DEFAULT_SEQUENCE_STYLE_BUILDER;
const paintOfComponent = (name: Parameters<typeof componentStyle>[1]): ReturnType<typeof paintOf> =>
  paintOf(componentStyle(builder, name), HColorSet.instance());

function record(draw: (ug: UGraphic) => void): Event[] {
  const ug = new RecordingUGraphic();
  draw(ug);
  return ug.log;
}

const participant = (id = 'A', centerX = 22): ParticipantGeo => ({
  id,
  display: id,
  type: 'participant',
  x: centerX - 12,
  y: 10,
  width: 24,
  height: 28,
  centerX,
  background: '#FFF',
  border: '#181818',
  labelRuns: [],
});
const piece = (over: Partial<LifelineSegment> = {}): LifelineSegment => ({
  y1: 39,
  y2: 178,
  delay: false,
  paint: DEFAULT_LIFELINE_PAINT,
  ...over,
});
const activation = (over: Partial<ActivationGeo> = {}): ActivationGeo => ({
  kind: 'activation',
  participantId: 'A',
  lifelineX: 22,
  y: 50,
  height: 34,
  level: 1,
  paint: paintOfComponent('ACTIVATION_BOX'),
  ...over,
});
const FORE_LINE = 'fore(#181818)';
const LIFELINE_STROKE = 'stroke(5,5,0.5)';

describe('drawLifeline (ComponentRoseLine.java:74-88)', () => {
  it('applies color then stroke, opens the titled group, draws hover rect then line, closes', () => {
    // MutingLine.java:111 `ug.apply(UTranslate.dy(y1))` over LivingSpaces.java:166
    // `ug.apply(UTranslate.dx(x))`; ComponentRoseLine.java:77-78 color, stroke; :80
    // startGroup; :104-108 hover (stroke 0, transparent fore, transparent(WITH_FILL_OPACITY)
    // back, dx((1-8)/2)); :83 dx((int)(1/2)) line; :84 closeGroup.
    const base = ['translate(22,39)', FORE_LINE, LIFELINE_STROKE];
    expect(record((ug) => drawLifeline(ug, participant(), piece()))).toEqual([
      { start: 'A' },
      {
        draw: 'URectangle(8,139)',
        chain: [
          ...base,
          'stroke(0,0,0)',
          'fore(transparent/WITH_FILL_NONE)',
          'back(transparent/WITH_FILL_OPACITY)',
          'translate(-3.5,0)',
        ],
      },
      { draw: 'ULine(0,139)', chain: [...base, 'translate(0,0)'] },
      { close: true },
    ]);
  });

  it('skips only the hover rect at zero height: the group and line stay (:99-100)', () => {
    expect(record((ug) => drawLifeline(ug, participant(), piece({ y2: 39 })))).toEqual([
      { start: 'A' },
      { draw: 'ULine(0,0)', chain: ['translate(22,39)', FORE_LINE, LIFELINE_STROKE, 'translate(0,0)'] },
      { close: true },
    ]);
  });

  it('titles the group with the layout title over the display (MutingLine.java:107-108)', () => {
    const [first] = record((ug) => drawLifeline(ug, participant(), piece({ title: '..s..' })));
    expect(first).toEqual({ start: '..s..' });
  });

  it('draws on a graphic with no group support, as a non-SVG backend does', () => {
    const bare: UGraphic = {
      apply: () => bare,
      draw: () => undefined,
      getParam: () => {
        throw new Error('unused');
      },
      getTranslate: () => UTranslate.none(),
      getStringBounder: () => {
        throw new Error('unused');
      },
    };
    expect(() => drawLifeline(bare, participant(), piece())).not.toThrow();
  });
});

describe('drawLifelineSegments (MutingLine.java:73-92)', () => {
  it('draws a delay piece bare (stroke, then color, then dx) and a clipped piece as an empty group', () => {
    // ComponentRoseDelayLine.java:62 `ug.apply(getStroke()).apply(color)`, :64 dx(x) -> vline;
    // UAntiAliasing is not ported (no driver reads it) so its apply is omitted.
    const events = record((ug) =>
      drawLifelineSegments(ug, participant(), [
        piece({ y1: 39, y2: 60, delay: true, paint: DEFAULT_DELAY_LINE_PAINT }),
        piece({ y1: 60, y2: 60, clippedOut: true }),
      ]),
    );
    expect(events).toEqual([
      { draw: 'ULine(0,21)', chain: ['translate(22,39)', 'stroke(1,4,0.5)', FORE_LINE, 'translate(0,0)'] },
      { start: 'A' },
      { close: true },
    ]);
  });
});

describe('drawActivation (ComponentRoseActiveLine.java:71-105, LiveBoxes.java:400)', () => {
  const white = '#FFFFFF';

  it('moves the level by (level-1)*width/2, positions at (-width/2, y), fills, draws -- no UStroke apply (:85-100)', () => {
    expect(record((ug) => drawActivation(ug, activation({ level: 3 })))).toEqual([
      { start: '' },
      {
        draw: 'URectangle(10,34)',
        chain: [
          'translate(22,0)',
          'translate(10,0)',
          'translate(-5,50)',
          FORE_LINE,
          `back(${white})`,
          'translate(0,0)',
        ],
      },
      { close: true },
    ]);
  });

  it('opens NO group for a zero-height bar (the guard precedes startGroup, :76-77)', () => {
    expect(record((ug) => drawActivation(ug, activation({ height: 0 })))).toEqual([]);
  });

  it('keeps the empty group for a bar a page clipped away', () => {
    expect(record((ug) => drawActivation(ug, activation({ clippedOut: true })))).toEqual([
      { start: '' },
      { close: true },
    ]);
  });

  it('sets the fixed delta shadow 1 when the style shadows (:82-83)', () => {
    const shadowed = { ...activation(), paint: { ...paintOfComponent('ACTIVATION_BOX'), shadowing: 2 } };
    const [, rect] = record((ug) => drawActivation(ug, shadowed));
    expect(rect).toMatchObject({ draw: 'URectangle(10,34)+shadow1' });
  });

  it('draws an open bar: back-on-back rect (back then FORE fill), two sides, the closed end (:88-101)', () => {
    const open = activation({ open: { closeUp: true, closeDown: true } });
    const base = ['translate(22,0)', 'translate(0,0)', 'translate(-5,50)', FORE_LINE];
    expect(record((ug) => drawActivation(ug, open))).toEqual([
      { start: '' },
      { draw: 'URectangle(10,34)', chain: [...base, `back(${white})`, `fore(${white})`, 'translate(0,0)'] },
      { draw: 'ULine(0,34)', chain: [...base, 'translate(0,0)'] },
      { draw: 'ULine(0,34)', chain: [...base, 'translate(10,0)'] },
      { draw: 'ULine(10,0)', chain: [...base, 'translate(0,0)'] },
      { draw: 'ULine(10,0)', chain: [...base, 'translate(0,34)'] },
      { close: true },
    ]);
  });

  it('omits the end line of an open end', () => {
    const open = activation({ open: { closeUp: false, closeDown: false } });
    const draws = record((ug) => drawActivation(ug, open)).filter((e) => 'draw' in e);
    expect(draws.map((e) => ('draw' in e ? e.draw : ''))).toEqual(['URectangle(10,34)', 'ULine(0,34)', 'ULine(0,34)']);
  });

  it('refuses a bar layout did not paint', () => {
    const { paint: _unpainted, ...bare } = activation();
    expect(() => record((ug) => drawActivation(ug, bare))).toThrow('activation of A carries no paint');
  });
});

describe('drawCross (ComponentRoseDestroy.java:60-65)', () => {
  const paint = paintOfComponent('DESTROY');
  const cross: DestroyCross = { x: 100, y: 200, drawnBy: 'liveboxes', level: 0 };

  it('strokes then colours, draws down-right on that instance, then up-right one crossSize down', () => {
    const base = ['translate(100,200)', 'stroke(0,0,2)', 'fore(#A80036)'];
    expect(record((ug) => drawCross(ug, cross, paint))).toEqual([
      { draw: 'ULine(18,18)', chain: base },
      { draw: 'ULine(18,-18)', chain: [...base, 'translate(0,18)'] },
    ]);
  });

  it('drawDestroyCrosses draws only the crosses its pass owns', () => {
    const destroy: DestroyGeo = {
      kind: 'destroy',
      participantId: 'A',
      y: 200,
      paint,
      crosses: [cross, { x: 1, y: 2, drawnBy: 'tile', level: 0 }],
    };
    const drawn = (by: DestroyCross['drawnBy']): number => record((ug) => drawDestroyCrosses(ug, destroy, by)).length;
    expect([drawn('liveboxes'), drawn('tile')]).toEqual([2, 2]);
    expect(record((ug) => drawDestroyCrosses(ug, destroy, 'tile'))[0]).toMatchObject({
      chain: ['translate(1,2)', 'stroke(0,0,2)', 'fore(#A80036)'],
    });
  });
});

describe('drawLifelinePass (LivingSpaces.java:157-168, LiveBoxes.java:374-420)', () => {
  const destroyAt = (participantId: string, level: number): DestroyGeo => ({
    kind: 'destroy',
    participantId,
    y: 150,
    paint: paintOfComponent('DESTROY'),
    crosses: [{ x: 5, y: 150, drawnBy: 'liveboxes', level }],
  });
  const titles = (events: Event[]): string[] =>
    events.map((e) => {
      if ('start' in e) return `<${e.start}>`;
      if ('close' in e) return '</>';
      return e.draw.split('(')[0] === 'ULine' && e.chain.includes('stroke(0,0,2)') ? 'cross-stroke' : e.draw;
    });

  it('draws per participant: its line, then its boxes by level, then indent-0 crosses last', () => {
    const items = [
      destroyAt('A', 0),
      activation({ participantId: 'A', level: 2, y: 80 }),
      activation({ participantId: 'A', level: 1, y: 60 }),
      activation({ participantId: 'B', lifelineX: 122, y: 70 }),
    ];
    const events = record((ug) =>
      drawLifelinePass(ug, [participant('A', 22), participant('B', 122)], items, () => [piece()]),
    );
    const levelsOf = events
      .filter((e) => 'draw' in e && e.draw === 'URectangle(10,34)')
      .map((e) => 'chain' in e && e.chain[1]);
    // A: hover, line, bar level 1 (dx 0), bar level 2 (dx 5), the two cross strokes; then B.
    expect(titles(events)).toEqual([
      '<A>',
      'URectangle(8,139)',
      'ULine(0,139)',
      '</>',
      '<>',
      'URectangle(10,34)',
      '</>',
      '<>',
      'URectangle(10,34)',
      '</>',
      'cross-stroke',
      'cross-stroke',
      '<B>',
      'URectangle(8,139)',
      'ULine(0,139)',
      '</>',
      '<>',
      'URectangle(10,34)',
      '</>',
    ]);
    expect(levelsOf.slice(0, 2)).toEqual(['translate(0,0)', 'translate(5,0)']);
  });

  it('draws the lifeline pass in the jar order: the line, then its bar', () => {
    const events = record((ug) =>
      drawLifelinesOf(ug, {
        participants: [participant()],
        events: [activation()],
        lifelineSegments: { A: [piece()] },
      }),
    );
    expect(titles(events)).toEqual([
      '<A>',
      'URectangle(8,139)',
      'ULine(0,139)',
      '</>',
      '<>',
      'URectangle(10,34)',
      '</>',
    ]);
  });
});
