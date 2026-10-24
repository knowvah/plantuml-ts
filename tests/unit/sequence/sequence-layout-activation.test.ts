/**
 * `sequence-layout-activation.ts` (sdd1 T2b): each activation bar's paint is
 * its merged `activationBox` style, from the builder of the step that OPENS
 * the bar (`teoz/LiveBoxes.java:323-331,405-407`,
 * `LiveBoxesDrawer.java:137-146`), its `BackGroundColor` overridden by the
 * activating event's colour.
 *
 * Expected default values cite
 * `~/git/plantuml/src/main/resources/skin/plantuml.skin`; the builder-choice
 * cases are oracle-verified (jar `<rect ... width="10">` fills quoted inline).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type {
  ActivationGeo,
  EventGeo,
  MessageEvent,
  MessageExoEvent,
  MessageGeo,
} from '../../../src/diagrams/sequence/ast.js';
import type { NoteGeo } from '../../../src/diagrams/sequence/geo-annotation.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import {
  activationLevel,
  emitActivation,
  flushOpenActivations,
  newActivationStack,
  openActivation,
  popActivation,
  pushActivation,
} from '../../../src/diagrams/sequence/sequence-layout-activation.js';
import { processEvents, type EventProcessingContext } from '../../../src/diagrams/sequence/sequence-layout-events.js';
import { endOfParseStyleBuilder } from '../../../src/diagrams/sequence/sequence-layout-lifeline.js';
import { computeParticipantLayout, LEFT_MARGIN } from '../../../src/diagrams/sequence/sequence-layout-participants.js';
import { messageTileGauge, type MessageTileGauge } from '../../../src/diagrams/sequence/sequence-y-gauge.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

/** `plantuml.skin:146` `activationBox { BackGroundColor white }`. */
const ACTIVATION_WHITE = '#FFFFFF';
/** `plantuml.skin:16` `root { LineColor #181818 }`. */
const ROOT_LINE = '#181818';
const RED = '#FF0000';
const RED_STYLE = ['<style>', `activationBox { BackGroundColor ${RED} }`, '</style>'];

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

function activations(body: readonly string[]): ActivationGeo[] {
  const ast = astOrThrow(parseSequence(sourceOf(body)), 'sequence');
  const geo = layoutSequence(ast, defaultTheme, new DeterministicMeasurer());
  return geo.events.filter((e): e is ActivationGeo => e.kind === 'activation').sort((a, b) => a.y - b.y);
}

function fills(body: readonly string[]): unknown[] {
  return activations(body).map((a) => a.paint?.fill);
}

describe('activation paint (LiveBoxesDrawer.java:137-146)', () => {
  it('defaults to the activationBox style: fill white, line #181818 (plantuml.skin:16,145-147)', () => {
    const [bar] = activations(['A -> B ++ : hi', 'B --> A -- : back']);
    expect(bar?.paint).toMatchObject({ fill: ACTIVATION_WHITE, stroke: ROOT_LINE, shadowing: 0 });
  });

  it('a bar a message opens takes that message builder (jar: #FFF then #F00)', () => {
    expect(fills(['A -> B ++ : first', ...RED_STYLE, 'B -> A -- : back', 'A -> B ++ : second', 'B -> A --'])).toEqual([
      ACTIVATION_WHITE,
      RED,
    ]);
  });

  it('a bound activate takes the message builder, a standalone one its own (jar: #FFF, then #F00)', () => {
    // LiveBoxes.java:146-170: the message's level already counts the bound
    // `activate B`, so the message's step opens that bar. `== d ==` closes
    // the message off (Divider.java:72-82), so `activate A` binds to nothing
    // and opens at its own step.
    const body = [
      'A -> B : hi',
      ...RED_STYLE,
      'activate B',
      'B -> A : back',
      'deactivate B',
      '== d ==',
      'activate A',
      'A -> B : x',
      'deactivate A',
    ];
    expect(fills(body)).toEqual([ACTIVATION_WHITE, RED]);
  });

  it('the activating colour overrides BackGroundColor (Style.java:214-223)', () => {
    expect(fills(['A -> B : hi', 'activate B #00FF00', 'B -> A', 'deactivate B'])).toEqual(['#00FF00']);
    expect(fills(['A -> B ++ #red : hi', 'B -> A --'])).toEqual([RED]);
  });

  it('skinparam sequenceLifeLineBackgroundColor reaches the box (FromSkinparamToStyle.java:113)', () => {
    expect(fills(['skinparam sequenceLifeLineBackgroundColor #FFFF00', 'A -> B ++ : hi', 'B -> A --'])).toEqual([
      '#FFFF00',
    ]);
  });

  it('merges the participant stereotype (LiveBoxesDrawer.java:140; jar: fill="#0F0" on B only)', () => {
    const body = [
      '<style>',
      '.foo { activationBox { BackGroundColor #00FF00 } }',
      '</style>',
      'participant A',
      'participant B <<foo>>',
      'A -> B ++ : hello',
      'B -> A -- : back',
      'A -> A ++ : self',
    ];
    const bars = activations(body);
    expect(bars.map((b) => [b.participantId, b.paint?.fill])).toEqual([
      ['B', '#00FF00'],
      ['A', ACTIVATION_WHITE],
    ]);
  });

  it('merges the decorated stereotype, without its (C, #color) spot (CommandParticipant.java:176-181; jar: fill="#F00")', () => {
    // `participant.getStereotype()` is the four-argument build, whose label --
    // hence its style name -- is `foo`, not `(C,#ADD1B2) foo`.
    const body = [
      '<style>',
      '.foo {',
      '  BackGroundColor red',
      '}',
      '</style>',
      'participant Alice',
      'participant Bob << (C,#ADD1B2) foo >>',
      'Alice -> Bob ++ : hi',
      'Bob --> Alice -- : ok',
    ];
    expect(fills(body)).toEqual([RED]);
  });

  it('a bar left open is flushed with its opening builder', () => {
    const [bar] = activations(['A -> B ++ : hi']);
    expect(bar?.paint?.fill).toBe(ACTIVATION_WHITE);
  });
});

describe('the walk level — LiveBoxes#getLevelAt prefix count (LiveBoxes.java:115-125)', () => {
  it('counts up and clamps down at 0', () => {
    const stack = newActivationStack([]);
    pushActivation(stack, 'A');
    pushActivation(stack, 'A');
    popActivation(stack, 'A');
    expect([activationLevel(stack, 'A'), openActivation(stack, 'A')]).toEqual([1, 1]);
    emitActivation(stack, 'A');
    emitActivation(stack, 'A');
    expect([activationLevel(stack, 'A'), openActivation(stack, 'A')]).toEqual([0, undefined]);
  });
});

interface Walked {
  readonly bars: ActivationGeo[];
  readonly messages: MessageGeo[];
  readonly gauges: readonly MessageTileGauge[];
  readonly geos: readonly EventGeo[];
}

/** `processEvents` then the flush, over `newActivationStack(participants,
 *  events)` -- the layout's own sequence, at an arbitrary start. */
function walk(body: readonly string[]): Walked {
  const ast = astOrThrow(parseSequence(sequenceSource(body)), 'sequence');
  const measurer = new DeterministicMeasurer();
  const layout = computeParticipantLayout(ast, defaultTheme, measurer);
  const ctx: EventProcessingContext = {
    theme: defaultTheme,
    measurer,
    sprites: ast.sprites,
    originX: LEFT_MARGIN,
    participantMap: layout.participantMap,
    participantIndex: layout.participantIndex,
    activationStart: newActivationStack(ast.participants, ast.events),
    endStyleBuilder: endOfParseStyleBuilder(ast),
    eventGeos: [],
    dividerGeos: [],
    newpageGeos: [],
  };
  const end = processEvents(ast.events, START, ctx);
  flushOpenActivations(ctx.activationStart, end + TAIL, ctx.participantMap, ctx.eventGeos);
  const messages = ast.events.filter(
    (e): e is MessageEvent | MessageExoEvent => e.kind === 'message' || e.kind === 'messageExo',
  );
  return {
    bars: ctx.eventGeos.filter((g): g is ActivationGeo => g.kind === 'activation'),
    messages: ctx.eventGeos.filter((g): g is MessageGeo => g.kind === 'message'),
    gauges: messages.map((m) => messageTileGauge(ctx, m)!),
    geos: ctx.eventGeos,
  };
}

const START = 47;
const TAIL = 10;
/** `ComponentRoseSelfArrow#getArrowOnlyHeight` (`:321-323`). */
const SELF_DROP = 13;
/** `LiveBoxes.java:81-82`. */
const NUDGE = 5;

const extent = (b: ActivationGeo): [number, number, number] => [b.level, b.y, b.height];

describe('activation steps (sdd2 T2b: LiveBoxes replaces the consume-once cursor)', () => {
  it('nanedo: a bound deactivate on the activate tile y is nudged 5 (jar rect y=66 height=13)', () => {
    const w = walk(['participant b', 'participant a', 'b -> a : hello', 'activate a', 'deactivate a']);
    const g = w.gauges[0]!;
    // Both life tiles sit at the message tile's max; the second is moved.
    expect(w.bars.map(extent)).toEqual([[1, g.contactY, g.top + g.height + NUDGE - g.contactY]]);
    expect(w.bars[0]!.height).toBe(13);
  });

  it("TeozTimelineIssues_0003: a message's own ++ steps at its life tile, so the next deactivate is nudged (jar heights 13)", () => {
    const w = walk([
      'activate b',
      'b -> a --++ #red : hello',
      'deactivate a',
      'b -> a : hello2',
      'activate a #green',
      'deactivate a',
    ]);
    expect(w.bars.filter((b) => b.participantId === 'a').map((b) => b.height)).toEqual([13, 13]);
  });

  it('a note on the message lowers the own ++ tile: no nudge when the deactivate lands below it', () => {
    const w = walk(['A -> B ++ : hi', 'note right : n', 'deactivate B']);
    const [g] = w.gauges;
    const bar = w.bars[0]!;
    expect(bar.y).toBe(g!.contactY);
    // The note wrapper is taller than the message tile, so the deactivate
    // steps at its bottom with nothing recorded there.
    expect(bar.y + bar.height).toBeGreaterThan(g!.top + g!.height + NUDGE);
  });

  it("TeozTimelineIssues_0002: a note-wrapped message's own life steps sit at the WRAPPER max, so the -- is nudged 5 (jar FFF rect y=126 height=14)", () => {
    // `CommunicationTileNoteRight.java:96-99` gauges the wrapper to
    // `min.addAtLeast(max(tile, note))` and `LifeEventTile.java:65-69` steps
    // at that min; `LiveBoxes.java:81-82` nudges a deactivate landing on a
    // recorded y by 5. The wrapper here is the note on `& F -> G`; F's own
    // `++--` (from `D -> F ++--`) land on its bottom, where the first
    // recorded step is the ++ itself.
    const w = walk(['D -> F ++-- : m3', '& F -> G -- : m4', 'note right : n']);
    const note = w.geos.find((g): g is NoteGeo => g.kind === 'note');
    const [bar] = w.bars.filter((b) => b.participantId === 'F');
    const wrapperMax = note!.y + note!.height;
    expect(bar!.y + bar!.height).toBe(wrapperMax + NUDGE);
    expect(bar!.height).toBe(14);
  });

  it('a message without a note wrapper records its own steps where it did (jar-equal bare max)', () => {
    const w = walk(['D -> F ++-- : m3', '& F -> G -- : m4']);
    const [g3] = w.gauges;
    const [bar] = w.bars.filter((b) => b.participantId === 'F');
    expect(bar!.y + bar!.height).toBe(g3!.top + g3!.height + NUDGE);
  });

  it('nocilo: every life event after one message binds to it (jar rects both y=66 height=27)', () => {
    const w = walk([
      'First -> Second : message',
      'activate First',
      'activate Second',
      'Second -> First: response',
      'deactivate First',
      'deactivate Second',
    ]);
    const [m1, m2] = w.gauges;
    expect(w.bars.map((b) => [b.participantId, b.y, b.y + b.height])).toEqual([
      ['First', m1!.contactY, m2!.contactY],
      ['Second', m1!.contactY, m2!.contactY],
    ]);
    expect(w.bars.map((b) => b.height)).toEqual([27, 27]);
  });

  it('kilili: a self message that activates steps at its end point (CommunicationTileSelf.java:120-121; jar y=106)', () => {
    const w = walk([
      'participant myclass',
      'activate myclass',
      'myclass -> class2: test()',
      'myclass -> myclass: call1()',
      'activate myclass',
      'myclass -> class2: test()',
      'deactivate myclass',
    ]);
    const self = w.messages[1]!;
    const inner = w.bars.find((b) => b.level === 2)!;
    expect([inner.y, inner.height]).toEqual([self.y + SELF_DROP, 27]);
  });

  it('a self message with no life event records no step', () => {
    const w = walk(['A -> B ++ : x', 'B -> B : self', 'B -> A -- : y']);
    const [m1, , m3] = w.gauges;
    expect(w.bars.map((b) => [b.y, b.y + b.height])).toEqual([[m1!.contactY, m3!.contactY]]);
  });

  it('a self message that deactivates steps at its start point (:122-123)', () => {
    const w = walk(['A -> B ++ : x', 'B -> B -- : self']);
    expect(w.bars.map((b) => b.y + b.height)).toEqual([w.messages[1]!.y]);
  });

  it('exo: the bar a bound + opens starts on the exo arrow (CommunicationExoTile.java:197-203)', () => {
    const w = walk(['participant A', 'activate A', '[-> A ++ : in', '[-> A : two', 'A -->] -- : back']);
    const [e1, , e3] = w.messages;
    expect(w.bars.map((b) => [b.level, b.y, b.y + b.height])).toEqual([
      [1, START, w.bars[0]!.y + w.bars[0]!.height],
      [2, e1!.y, e3!.y],
    ]);
  });

  it('emits a closing bar before the destroy drawn after it, and an open one at the end', () => {
    // `B -> A`'s lookahead counts the bound destroy (`LiveBoxes.java:172-178`),
    // so its step closes level 2 only; level 1 runs to the last step.
    const w = walk(['A -> B ++ : x', 'A -> B ++ : y', 'B -> A : z', 'destroy B', 'A -> C ++ : open']);
    const order = w.geos.flatMap((g) =>
      g.kind === 'activation' ? [`${g.participantId}${g.level}`] : g.kind === 'destroy' ? ['destroy'] : [],
    );
    expect(order).toEqual(['B2', 'destroy', 'B1', 'C1']);
  });
});

/**
 * `LiveBoxes#addStep` runs once per layout pass over the SAME `LiveBoxes`:
 * `PlayingSpace#drawUInternal` (`:119-123`) re-runs `fillPositionelTiles` from
 * `getPreferredHeight` (`:154-157`, reached by `calculateDimensionSlow` and by
 * `PlayingSpaceWithParticipants#drawU:205`) and from `drawBackground`
 * (`:109-111`) before `drawLifeLines` (`:221`) -- three passes.
 */
describe('activation steps replayed over the layout passes (sdd2 T7b)', () => {
  it('jasixo: `deactivate C` then `activate C` at one y draws no bar (jar golden has no livebox group)', () => {
    expect(activations(['A -> B', 'deactivate C', 'activate C'])).toEqual([]);
  });

  it('zujuge: the later activate is swallowed by the nudged deactivate (jar rect y=47 height=19)', () => {
    const bars = activations(['activate C', 'A -> B', 'deactivate C', 'activate C', 'A -> B', 'deactivate C']);
    expect(bars.map((b) => [b.y, b.height])).toEqual([[47, 19]]);
  });
});
