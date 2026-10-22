/**
 * sdd2-T3b: reverse-defined self messages (`A <- A`) and the
 * `ResponseMessageBelowArrow` below-the-arrow response.
 *
 * Expected values cite the Java or a jar golden (`scripts/oracle-render.sh`
 * renders and the `kumogu-10-rigi101` / `tovese-18-xira071` /
 * `pukebe-27-xadi418` goldens), never this port's own output.
 *
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:306-310,388-389
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseSelfArrow.java:176-273
 * @see ~/git/plantuml/.../sequencediagram/teoz/CommunicationTileSelf.java:139-176,263-277
 */

import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { MessageEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { leftSideInsets } from '../../../src/diagrams/sequence/sequence-layout-message-self.js';
import { selfCompWidth, selfMaxX, selfMinX } from '../../../src/diagrams/sequence/sequence-note-anchor.js';
import type { EventProcessingContext } from '../../../src/diagrams/sequence/sequence-layout-events.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const MEASURER = new DeterministicMeasurer();

function messagesOf(lines: readonly string[]): MessageEvent[] {
  const ast = parseSequence(sequenceSource(lines)) as SequenceDiagramAST;
  return ast.events.filter((e): e is MessageEvent => e.kind === 'message');
}

function render(puml: string): string {
  return renderFixtureSequence(puml, MEASURER, { includeStore: fixtureIncludeStore() });
}

interface Shape {
  readonly tag: 'line' | 'polygon' | 'ellipse';
  readonly attrs: Readonly<Record<string, string>>;
}

function shapesOf(svg: string): Shape[] {
  const shapes: Shape[] = [];
  for (const m of svg.matchAll(/<(line|polygon|ellipse)\b([^>]*)>/g)) {
    const attrs: Record<string, string> = {};
    for (const a of m[2]!.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[a[1]!] = a[2]!;
    shapes.push({ tag: m[1] as Shape['tag'], attrs });
  }
  return shapes;
}

const num = (s: Shape, key: string): number => Number(s.attrs[key]);

/** The solid message strokes: lifelines carry a dasharray. */
const strokes = (svg: string): Shape[] =>
  shapesOf(svg).filter((s) => s.tag === 'line' && s.attrs['stroke-dasharray'] === undefined);

describe('reverseDefine is recorded on the arrow configuration (CommandArrow.java:388-389)', () => {
  it('sets it for `A <- A` and `A <- B`, whose left dressing carries the `<`', () => {
    const [self, flat] = messagesOf(['participant A', 'participant B', 'A <- A : x', 'A <- B : y']);
    expect(self!.arrow.reverseDefine).toBe(true);
    expect(flat!.arrow.reverseDefine).toBe(true);
  });

  it('leaves it unset for `A -> A` and for `A <-> A` (hasDressing2butx wins, :302-305)', () => {
    const [forward, both] = messagesOf(['participant A', 'A -> A : x', 'A <-> A : y']);
    expect(forward!.arrow.reverseDefine).toBeUndefined();
    expect(both!.arrow.reverseDefine).toBeUndefined();
  });
});

describe('ComponentRoseSelfArrow#drawLeftSide x1/x2 (:177-190)', () => {
  // Each row is the Java branch worked by hand: dx = (ignore - consider) * 5,
  // level = ignore, extra = level * 5.
  it.each([
    // [ignore, consider, x1, x2, branch]
    [0, 0, 0, 1, 'dx == 0, level 0: neither branch'],
    [1, 1, 0, 1, 'dx == 0, level 1: `level > 1` is false'],
    [2, 2, -5, -4, 'dx == 0, level 2: both minus (extra - deltaSize) = 5'],
    [1, 2, 0, -4, 'dx < 0, level > 0: x2 += -extra'],
    [0, 1, 0, 6, 'dx < 0, level 0: x2 += deltaSize'],
    [2, 1, -5, 1, 'dx > 0, level 2: x1 += deltaSize - extra, x2 += 0'],
    [1, 0, 0, -4, 'dx > 0, level 1: x1 += 0, x2 += -deltaSize'],
  ])('levels (%i, %i) -> x1 %i, x2 %i (%s)', (ignore, consider, x1, x2) => {
    expect(leftSideInsets(ignore, consider)).toEqual({ x1, x2 });
  });
});

describe('a reverse self loop is drawn on the left (kumogu-10-rigi101 golden)', () => {
  // Bob's lifeline at 83.919; the golden's loop: 41.919 -> 82.919 at the top,
  // the stroke at 41.919, 41.919 -> 81.919 at the bottom, head 71.919..81.919
  // with the nice-arrow notch at 75.919, label at 40.919.
  const svg = render(
    '@startuml\n!pragma teoz true\nparticipant Alice as a\nparticipant Bob as b\nb <- b : ""<-""\n@enduml',
  );

  it('strokes the three segments at the jar x', () => {
    const [top, side, bottom] = strokes(svg);
    expect([num(top!, 'x1'), num(top!, 'x2')]).toEqual([41.919, 82.919]);
    expect([num(side!, 'x1'), num(side!, 'x2')]).toEqual([41.919, 41.919]);
    expect([num(bottom!, 'x1'), num(bottom!, 'x2')]).toEqual([41.919, 81.919]);
  });

  it('points the head left', () => {
    const head = shapesOf(svg).find((s) => s.tag === 'polygon')!;
    expect(head.attrs['points']!.split(',').filter((_, i) => i % 2 === 0)).toEqual([
      '71.919',
      '81.919',
      '71.919',
      '75.919',
    ]);
  });

  it('draws the label at the component origin plus getOldPaddingX1', () => {
    expect(svg).toContain('<text x="40.919"');
  });

  it('reserves the loop to the LEFT of the lifeline: the canvas does not widen (114, not 144)', () => {
    expect(svg).toMatch(/viewBox="0 0 114 /);
  });
});

describe('saltire and circle ends of a reverse loop (tovese-18-xira071 golden)', () => {
  // Alice is the last lifeline, `c`. The golden's offsets, in order for
  // `x<-`, `<-X` and `o<-x`, are relative to it.
  const svg = render(
    [
      '@startuml',
      '!pragma teoz true',
      'participant Bob as b',
      'participant Alice as a',
      'a x<-    a : ""x<-""',
      'a <-X    a : ""<-x""',
      'a o<-x   a : ""o<-x""',
      '@enduml',
    ].join('\n'),
  );
  const centre = num(shapesOf(svg).filter((s) => s.attrs['stroke-dasharray'] !== undefined)[1]!, 'x1');
  const rel = (s: Shape, key: string): number => Math.round((num(s, key) - centre) * 1000) / 1000;
  const rows = (() => {
    const all = strokes(svg);
    return [all.slice(0, 5), all.slice(5, 10), all.slice(10, 15)];
  })();

  it('`x<-`: the saltire sits spaceCrossX*2 + 3 in from the returning stroke end (:219-226,251-258)', () => {
    const [top, side, bottom, crossA, crossB] = rows[0]!;
    expect([rel(top!, 'x1'), rel(top!, 'x2')]).toEqual([-42, -1]);
    expect(rel(side!, 'x1')).toBe(-42);
    expect([rel(bottom!, 'x1'), rel(bottom!, 'x2')]).toEqual([-42, -13]);
    expect([rel(crossA!, 'x1'), rel(crossA!, 'x2')]).toEqual([-16, -6]);
    expect(crossB!.attrs['stroke-width']).toBe('2');
  });

  it('`<-X`: a saltire on the upper end and a polygon whose tip is `extraline` in from the edge', () => {
    const [top, , bottom, cross] = rows[1]!;
    expect([rel(top!, 'x1'), rel(top!, 'x2')]).toEqual([-42, -13]);
    expect([rel(bottom!, 'x1'), rel(bottom!, 'x2')]).toEqual([-42, -2]);
    expect(rel(cross!, 'x1')).toBe(-16);
    const head = shapesOf(svg).filter((s) => s.tag === 'polygon')[0]!;
    expect(Number(head.attrs['points']!.split(',')[2]) - centre).toBeCloseTo(-2, 3);
  });

  it('`o<-x`: the circle is centred thinCircle/2 left of the lifeline (:206-209)', () => {
    const circle = shapesOf(svg).find((s) => s.tag === 'ellipse')!;
    expect(num(circle, 'cx') - centre).toBeCloseTo(-0.5, 3);
    expect(num(circle, 'rx')).toBe(4);
  });
});

describe('participant spacing for a reverse loop (CommunicationTileSelf.java:170-176)', () => {
  it('pushes the loop`s participant right of the PREVIOUS one by the component width', () => {
    // 60-character label: component width = text + 2*7 padding, well past the
    // 50 floor, so the demand (previous.posC2 + compWidth) beats the natural
    // 51.694 gap between two bare participants.
    const label = 'w'.repeat(60);
    const wide = shapesOf(render(`@startuml\nparticipant A\nparticipant B\nB <- B : ${label}\n@enduml`));
    const narrow = shapesOf(render('@startuml\nparticipant A\nparticipant B\nB -> B\n@enduml'));
    const lifelines = (shapes: Shape[]): number[] =>
      shapes.filter((s) => s.attrs['stroke-dasharray'] !== undefined).map((s) => num(s, 'x1'));
    const gap = (xs: number[]): number => xs[1]! - xs[0]!;
    expect(gap(lifelines(wide))).toBeGreaterThan(gap(lifelines(narrow)));
  });
});

describe('skinparam ResponseMessageBelowArrow (pukebe-27-xadi418 golden)', () => {
  const body = 'A -> B : Request\nactivate B\nA <- B : Response\ndeactivate B\n@enduml';
  const on = render(`@startuml\nskinparam ResponseMessageBelowArrow true\n${body}`);
  const off = render(`@startuml\n${body}`);

  it('draws the reverse arrow at getPaddingY() and the label below it (:143-148,330-332)', () => {
    // Golden: request arrow y 66, response arrow y 78, response label y 89.111.
    const arrowsOn = strokes(on).filter((s) => num(s, 'y1') === num(s, 'y2'));
    expect(arrowsOn.map((s) => num(s, 'y1'))).toEqual([66, 78]);
    expect(on).toContain('y="89.111"');
  });

  it('is off by default: the response label stays above its arrow', () => {
    const arrowsOff = strokes(off).filter((s) => num(s, 'y1') === num(s, 'y2'));
    expect(arrowsOff.map((s) => num(s, 'y1'))).toEqual([66, 93]);
  });

  it('does not move a forward arrow (isBelowForResponse needs isReverseDefine, :195-197)', () => {
    const forward = render(`@startuml\nskinparam ResponseMessageBelowArrow true\nA -> B : Request\n@enduml`);
    expect(strokes(forward).map((s) => num(s, 'y1'))).toEqual([66]);
  });
});

describe('reverse self extents (CommunicationTileSelf.java:263-277)', () => {
  const [forward, reverse] = messagesOf(['participant A', 'A -> A : hello', 'A <- A : hello']);
  const CENTRE = 100;
  const MAX_POSITION = 5;
  const ctxAt = (level: number): EventProcessingContext =>
    ({
      measurer: MEASURER,
      sprites: undefined,
      activationStart: {
        levels: new Map([['A', level]]),
        live: { boxes: new Map([['A', { getMaxPosition: () => MAX_POSITION }]]) },
      },
    }) as unknown as EventProcessingContext;

  it('forward: posC .. posC2 + compWidth', () => {
    const ctx = ctxAt(0);
    expect(selfMinX(forward!, CENTRE, ctx)).toBe(CENTRE);
    expect(selfMaxX(forward!, CENTRE, ctx)).toBe(CENTRE + MAX_POSITION + selfCompWidth(forward!, ctx));
  });

  it('reverse: posC - compWidth .. posC2, with no live level (:263-277)', () => {
    const ctx = ctxAt(0);
    expect(selfMinX(reverse!, CENTRE, ctx)).toBe(CENTRE - selfCompWidth(reverse!, ctx));
    expect(selfMaxX(reverse!, CENTRE, ctx)).toBe(CENTRE + MAX_POSITION);
  });

  it('reverse: one LIVE_DELTA_SIZE further left once the lifeline is activated (:264-268)', () => {
    const ctx = ctxAt(1);
    expect(selfMinX(reverse!, CENTRE, ctx)).toBe(CENTRE - selfCompWidth(reverse!, ctx) - 5);
  });
});
