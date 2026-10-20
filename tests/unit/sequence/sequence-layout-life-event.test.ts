/**
 * `sequence-layout-life-event.ts` (sdd1 T2f): the destroy cross
 * (`ComponentRoseDestroy`), who draws it (`LifeEventTile` for an unbound
 * destroy, `LiveBoxes` for one bound to a message), and the lifeline stopping
 * at the destroy (`LivingSpace#aliveChanges`).
 *
 * Every expected coordinate is the oracle jar's, rendered with
 * `scripts/oracle-render.sh` (deterministic text) from the markup quoted in
 * the case; the default paint cites `plantuml.skin:149-153`.
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type {
  DestroyCross,
  DestroyGeo,
  SequenceDiagramAST,
  SequenceGeometry,
} from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import { scaleSequenceGeometry } from '../../../src/diagrams/sequence/scale-geo.js';
import { NEWPAGE_TILE_HEIGHT } from '../../../src/diagrams/sequence/newpage-style.js';
import { paginateSequence } from '../../../src/diagrams/sequence/sequence-page.js';
import { destroyPaint, stepIndent } from '../../../src/diagrams/sequence/sequence-layout-life-event.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { DEFAULT_SEQUENCE_STYLE_BUILDER } from '../../helpers/sequence-source.js';

const measurer = new DeterministicMeasurer();

/** `src/index.ts#umlSourceOfBlock`'s widening, over a `@startuml` body. */
function sourceOf(body: readonly string[]): UmlSource {
  const block = buildBlockUmls(`@startuml\n${body.join('\n')}\n@enduml`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  return {
    ...block.source,
    stylePositions: block.preprocessed.stylePositions,
    skinparamAssignments: block.preprocessed.skinparamAssignments,
    styleSource: block.preprocessed,
  };
}

function geoOf(body: readonly string[]): SequenceGeometry {
  return layoutSequence(astOrThrow(parseSequence(sourceOf(body)), 'sequence'), defaultTheme, measurer);
}

function destroysOf(geo: SequenceGeometry): DestroyGeo[] {
  return geo.events.filter((e): e is DestroyGeo => e.kind === 'destroy');
}

/** Each cross rounded to the jar's 3 decimals (`SvgGraphics#format`). */
function crossesOf(geo: SequenceGeometry): DestroyCross[] {
  const round = (n: number): number => Math.round(n * 1000) / 1000;
  return destroysOf(geo).flatMap((d) => d.crosses.map((c) => ({ ...c, x: round(c.x), y: round(c.y) })));
}

/** `bodobu-73-noli773`, verbatim. */
const BODOBU = [
  'User->A: DoWork',
  'activate A',
  'A->B: <<createRequest>>',
  'activate B',
  'B->C: DoWork',
  'activate C',
  'C-->B: WorkDone',
  'destroy C',
  'B-->A: RequestCreated',
  'deactivate B',
  'A->User: Done',
];
const AB = ['participant A', 'participant B'];

function linesOf(svg: string): string[] {
  return svg.match(/<line [^>]*>/g) ?? [];
}

describe('destroy paint (ComponentRoseDestroy.java:52-65)', () => {
  it('defaults to #A80036 at 2, undashed (plantuml.skin:149-153)', () => {
    const paint = destroyPaint(DEFAULT_SEQUENCE_STYLE_BUILDER);
    expect([paint.stroke, paint.thickness, paint.dash]).toEqual(['#A80036', 2, undefined]);
  });

  it('takes the end-of-parse style (jar bumoda-17: stroke:#008000;stroke-width:3)', () => {
    const style = ['<style>', 'sequenceDiagram {', 'LineThickness 3', 'destroy { LineColor green }', '}', '</style>'];
    const [destroy] = destroysOf(geoOf(['participant X', 'X -> Y', 'return', 'destroy Y', ...style]));
    expect([destroy?.paint.stroke, destroy?.paint.thickness]).toEqual(['#008000', 3]);
  });
});

describe('where the cross goes (LifeEventTile.java:112-137, LiveBoxes.java:212-234,374-420)', () => {
  it('a destroy bound to a flat message: centred on its step, after every bar (bodobu-73)', () => {
    // Jar: `<line x1="322.831" y1="138" x2="340.831" y2="156" .../>`.
    expect(crossesOf(geoOf(BODOBU))).toEqual([{ x: 322.831, y: 138, drawnBy: 'liveboxes', level: 0 }]);
  });

  it('a self message steps at its end point; B, its activate bound first, gets none (jar: A x1=12.681 y1=124)', () => {
    const body = [
      ...AB,
      'A -> B ++ : one',
      'A -> B ++ : two',
      'destroy B',
      'A -> A : self',
      'destroy A',
      'B -> A : after',
    ];
    expect(crossesOf(geoOf(body))).toEqual([{ x: 12.681, y: 124, drawnBy: 'liveboxes', level: 0 }]);
  });

  it('a step that closes level 2 draws in drawOneLevel(2), moved half a bar (jar: x1=76.256 y1=111)', () => {
    const body = [...AB, 'A -> B ++ : one', 'A -> B ++ : two', 'B -> A : three', 'destroy B', 'A -> A : after'];
    expect(crossesOf(geoOf(body))).toEqual([{ x: 76.256, y: 111, drawnBy: 'liveboxes', level: 2 }]);
  });

  it.each([
    [
      'a deactivate bound before it (jar: no cross)',
      [...AB, 'A -> B ++ : one', 'deactivate B', 'destroy B', 'A -> A : self'],
    ],
    [
      'an exo message (isNextEventADestroy wants a Message; jar: no cross)',
      [...AB, '[-> B : exo', 'destroy B', 'A -> A : x'],
    ],
  ])('draws NO cross after %s', (_why, body) => {
    const geo = geoOf(body);
    expect(destroysOf(geo)).toHaveLength(1);
    expect(crossesOf(geo)).toEqual([]);
  });

  it('an unbound destroy draws its own cross at its tile top, on the lifeline (jar: y1=114, x1 = posC - 9)', () => {
    const geo = geoOf([...AB, 'A -> B : one', 'A -> A : self', 'destroy B', 'A -> A : after']);
    const b = geo.participants.find((p) => p.id === 'B')!;
    expect(crossesOf(geo)).toEqual([
      { x: Math.round((b.centerX - 9) * 1000) / 1000, y: 114, drawnBy: 'tile', level: 0 },
    ]);
  });

  it.each([
    ['the arrow`s own -- on the destroyed sender (jar: x1=12.681 y1=84)', ['B -> A ++ : go', 'A -> B -- : back']],
    [
      'a self arrow`s --, stepping at its START (CommunicationTileSelf.java:122-123; jar: y1=84)',
      ['B -> A ++ : go', 'A -> A -- : self'],
    ],
  ])('a destroy after %s', (_why, lead) => {
    const geo = geoOf([...AB, ...lead, 'destroy A', 'B -> B : after']);
    expect(crossesOf(geo)).toEqual([{ x: 12.681, y: 84, drawnBy: 'liveboxes', level: 0 }]);
  });

  it('draws NO cross after an activate bound before it (jar: no cross)', () => {
    expect(crossesOf(geoOf([...AB, 'A -> B : x', 'activate B', 'destroy B', 'A -> A : after']))).toEqual([]);
  });

  it('lays out nothing for a destroy of a participant the layout does not know', () => {
    const ast: SequenceDiagramAST = {
      participants: [
        { id: 'A', display: 'A', type: 'participant', order: 0, styleBuilder: DEFAULT_SEQUENCE_STYLE_BUILDER },
      ],
      events: [
        { kind: 'deactivate', participantId: 'Ghost', destroy: true, styleBuilder: DEFAULT_SEQUENCE_STYLE_BUILDER },
      ],
      autonumber: { enabled: false, start: 1, current: 1, step: 1, prefix: '' },
      options: { hideFootbox: false, messageAlign: 'center' },
      boxes: [],
      styleBuilder: DEFAULT_SEQUENCE_STYLE_BUILDER,
    };
    expect(destroysOf(layoutSequence(ast, defaultTheme, measurer))).toEqual([]);
  });

  it('never clamps a tile cross to the create (only LiveBoxes steps are)', () => {
    const geo = geoOf([...AB, 'create B', 'A -> B : hi', 'A -> A : self', 'destroy B', 'A -> A : after']);
    const [cross] = crossesOf(geo);
    expect(cross?.drawnBy).toBe('tile');
    expect(cross?.y).toBe(destroysOf(geo)[0]?.y);
  });

  it('a second destroy bound to the same step takes no second cross', () => {
    const geo = geoOf(['A -> B : one', 'destroy B', 'destroy B']);
    expect(destroysOf(geo).map((d) => d.crosses.length)).toEqual([1, 0]);
  });
});

describe('the lifeline stops at the destroy (LivingSpace.java:151-166)', () => {
  it('ends the destroyed line at the tile y (bodobu-73: C y2=155)', () => {
    expect(geoOf(BODOBU).lifelineSegments['C']?.map((s) => [s.y1, s.y2])).toEqual([[39, 155]]);
  });

  it('a re-create at the destroy y keeps the line alive (kafupo-63: ONE line 47..296)', () => {
    const round = ['a --> b : hello()', 'a --> b : how_are_you()', 'a --> b : goodbye()', 'destroy b'];
    const body = ['participant a', 'participant b', 'create b', ...round, 'create b', ...round, 'create b', ...round];
    expect(geoOf(body).lifelineSegments['b']?.map((s) => [s.y1, s.y2])).toEqual([[47, 296]]);
  });

  it('a participant created later starts dead, and its cross is clamped to the create (jar: line 114..153, cross y1=105)', () => {
    // `alive = create == false` (`LivingSpace.java:154`) and
    // `Math.max(createY, position)` (`LiveBoxes.java:330`).
    const geo = geoOf(['A -> B : one', 'destroy B', 'A -> A : gap', 'create B', 'A -> B : again']);
    expect(geo.lifelineSegments['B']?.map((s) => [s.y1, s.y2])).toEqual([[114, 153]]);
    expect(crossesOf(geo).map((c) => c.y)).toEqual([105]);
  });
});

describe('drawing the cross', () => {
  it('draws two diagonals in LineColor at the thickness, down-right first (jar bodobu-73)', () => {
    const svg = renderSequence(geoOf(BODOBU), defaultTheme, measurer).body;
    expect(linesOf(svg).filter((l) => l.includes('#A80036'))).toEqual([
      '<line x1="322.831" y1="138" x2="340.831" y2="156" stroke="#A80036" stroke-width="2"/>',
      '<line x1="322.831" y1="156" x2="340.831" y2="138" stroke="#A80036" stroke-width="2"/>',
    ]);
  });

  it('draws a level-2 cross after both bars, level order (jar: bar 1, bar 2, cross)', () => {
    const body = [...AB, 'A -> B ++ : one', 'A -> B ++ : two', 'B -> A : three', 'destroy B', 'A -> A : after'];
    const svg = renderSequence(geoOf(body), defaultTheme, measurer).body;
    const order = [...svg.matchAll(/<rect x="[^"]+" y="(\d+)" width="10"|<line [^>]*#A80036/g)].map((m) => m[1] ?? 'X');
    expect(order).toEqual(['66', '93', 'X', 'X']);
  });

  it('draws an unbound cross in the foreground pass, after the heads', () => {
    const body = [...AB, 'A -> B : one', 'A -> A : self', 'destroy B', 'A -> A : after'];
    const svg = renderSequence(geoOf(body), defaultTheme, measurer).body;
    expect(svg.indexOf('#A80036')).toBeGreaterThan(svg.indexOf('fill="#E2E2F0"'));
  });

  it('scales the corner, the size and the stroke (SvgGraphics.java:466-468,556-561)', () => {
    const geo = geoOf(['A -> B : one', 'destroy B']);
    const [cross] = crossesOf(scaleSequenceGeometry(geo, 2));
    const [unscaled] = crossesOf(geo);
    expect([cross?.x, cross?.y]).toEqual([unscaled!.x * 2, unscaled!.y * 2]);
    const svg = renderSequence({ ...geo, scale: { kind: 'simple', factor: 2 } }, defaultTheme, measurer).body;
    expect(linesOf(svg).filter((l) => l.includes('#A80036'))[0]).toContain('stroke-width="4"');
  });
});

describe('a page clips a cross whole (UClip.java:128-142)', () => {
  const paged = (crossY: number): SequenceGeometry => {
    const geo = geoOf(['A -> B : one', 'destroy B']);
    const [destroy] = destroysOf(geo);
    const cross: DestroyCross = { x: 50, y: crossY, drawnBy: 'liveboxes', level: 0 };
    const events = [
      { ...destroy!, crosses: [cross] },
      { kind: 'newpage' as const, y: 200, height: NEWPAGE_TILE_HEIGHT, bandX: 10, bandWidth: 300 },
    ];
    return { ...geo, events, lifelineEndY: 500 };
  };

  it('keeps a cross both of whose ends are on the page', () => {
    const page = paginateSequence(paged(150), 0);
    expect(crossesOf(page)).toEqual([{ x: 50, y: 150, drawnBy: 'liveboxes', level: 0 }]);
  });

  it('drops a cross the band cuts, and moves a later page`s cross into page coordinates', () => {
    expect(crossesOf(paginateSequence(paged(210), 0))).toEqual([]);
    const second = paginateSequence(paged(300), 1);
    expect(crossesOf(second).map((c) => c.y)).toEqual([300 - 200 + second.headHeight]);
  });
});

describe('the !! destroy marker (CommandArrow.java:453-455)', () => {
  // `!!` is `diagram.activate(p2, LifeEventType.DESTROY, null)`, which adds
  // the same `LifeEvent` a `destroy p2` line after the message adds
  // (`SequenceDiagram.java:369-371`). Jar values from `scripts/oracle-render.sh`
  // (2026-10-20) on the quoted markup; x is relative to the lifeline, since
  // the label-less spacing is not this test's subject.
  it('parses as a destroy of the target, not a deactivate', () => {
    const ast = astOrThrow(parseSequence(sourceOf(['A -> B !!'])), 'sequence');
    const message = ast.events.find((e) => e.kind === 'message');
    expect(message).toMatchObject({ destroys: 'B' });
    expect(message).not.toHaveProperty('deactivates');
  });

  it('closes the open bar and draws the cross on the step (jar A -> B ++, A -> B !!: cross y1=58, line y2=75)', () => {
    const geo = geoOf([...AB, 'A -> B ++', 'A -> B !!', 'A -> A']);
    const b = geo.participants.find((p) => p.id === 'B')!;
    expect(crossesOf(geo)).toEqual([
      { x: Math.round((b.centerX - 9) * 1000) / 1000, y: 58, drawnBy: 'liveboxes', level: 0 },
    ]);
    expect(geo.lifelineSegments['B']?.map((seg) => [seg.y1, seg.y2])).toEqual([[39, 75]]);
  });

  it('lays out exactly what a destroy line after the message lays out', () => {
    const marker = geoOf([...AB, 'A -> B ++ : one', 'A -> B !! : two', 'A -> A : three']);
    const line = geoOf([...AB, 'A -> B ++ : one', 'A -> B : two', 'destroy B', 'A -> A : three']);
    // Spans only: a segment's lazy paint throws on a dark-only read (`paintOf`).
    const spans = (g: SequenceGeometry): [string, number[][]][] =>
      Object.entries(g.lifelineSegments).map(([id, segs]) => [id, segs.map((seg) => [seg.y1, seg.y2])]);
    expect([crossesOf(marker), spans(marker)]).toEqual([crossesOf(line), spans(line)]);
    expect(crossesOf(marker)).toHaveLength(1);
  });

  it('steps a self !! at its END point, not as a deactivate (jar A -> A !!: cross y1=71, line y2=88)', () => {
    const geo = geoOf([...AB, 'A -> B ++', 'A -> A !!', 'B -> A']);
    expect(crossesOf(geo).map((c) => c.y)).toEqual([71]);
    expect(geo.lifelineSegments['A']?.map((seg) => [seg.y1, seg.y2])).toEqual([[39, 88]]);
  });

  it('stops the line of an exo !! and draws no cross (isNextEventADestroy wants a Message; jar y2=75)', () => {
    const geo = geoOf([...AB, 'A -> B', '[-> B !!', 'A -> A']);
    expect(crossesOf(geo)).toEqual([]);
    expect(geo.lifelineSegments['B']?.map((seg) => [seg.y1, seg.y2])).toEqual([[39, 75]]);
  });
});

describe('stepIndent (LiveBoxes.java:143-210, CONSIDER_FUTURE_DEACTIVATE)', () => {
  it.each([
    [0, ['down'], 0],
    [2, ['down'], 1],
    [1, ['up', 'down'], 2],
    [2, ['down', 'up'], 1],
    [0, ['down', 'down'], 0],
  ] as const)('from %i through %j is %i', (before, events, indent) => {
    expect(stepIndent(before, events)).toBe(indent);
  });
});
