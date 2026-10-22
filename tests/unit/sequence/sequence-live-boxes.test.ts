/**
 * `sequence-live-boxes.ts` / `sequence-live-events.ts` (sdd2 T2b): the port of
 * `teoz/LiveBoxes.java` over the flat event list `SequenceDiagram#events`
 * holds. Each case parses real markup, flattens it, and drives one
 * participant's `LiveBoxes` with the steps its tiles would record, so every
 * expected value is upstream arithmetic quoted at the case; the bar extents
 * that a golden shows are cited with the fixture.
 */
import { describe, expect, it } from 'vitest';
import type { SequenceDiagramAST, SequenceEvent } from '../../../src/diagrams/sequence/ast.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import {
  ACTIVATION_HALF_WIDTH,
  LiveBoxes,
  Stairs,
  flattenLiveEvents,
  isParallelWith,
  type LiveEvent,
  type LiveEvents,
  type LiveLifeEvent,
  type LiveMessage,
} from '../../../src/diagrams/sequence/sequence-live-boxes.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

interface Parsed {
  readonly ast: SequenceDiagramAST;
  readonly live: LiveEvents;
}

function parse(lines: readonly string[]): Parsed {
  const ast = astOrThrow(parseSequence(sequenceSource(lines)), 'sequence');
  return { ast, live: flattenLiveEvents(ast.events) };
}

/** The `LiveEvent` of the `i`-th top-level AST event. */
function at(p: Parsed, i: number): LiveEvent {
  const event = p.live.ofSource.get(p.ast.events[i]!);
  if (event === undefined) throw new Error(`event ${i} is not in the list`);
  return event;
}

function message(p: Parsed, i: number): LiveMessage {
  const event = at(p, i);
  if (event.kind !== 'message') throw new Error(`event ${i} is a ${event.kind}`);
  return event;
}

function life(p: Parsed, i: number): LiveLifeEvent {
  const event = at(p, i);
  if (event.kind !== 'life') throw new Error(`event ${i} is a ${event.kind}`);
  return event;
}

/** The own life events of the `i`-th top-level message. */
function own(p: Parsed, i: number): readonly LiveLifeEvent[] {
  const event = p.ast.events[i] as SequenceEvent;
  if (event.kind !== 'message') throw new Error(`event ${i} is a ${event.kind}`);
  return p.live.ownOf.get(event) ?? [];
}

const kinds = (p: Parsed): string[] => p.live.events.map((e) => e.kind);

describe('flattenLiveEvents — SequenceDiagram#events', () => {
  it("puts a message's own --/++ right after it, deactivate first (CommandArrow.java:444-466)", () => {
    const p = parse(['A -> B --++ : x']);
    expect(own(p, 0).map((e) => [e.type, e.participant])).toEqual([
      ['DEACTIVATE', 'A'],
      ['ACTIVATE', 'B'],
    ]);
    expect(own(p, 0).every((e) => e.message === message(p, 0))).toBe(true);
    expect(kinds(p)).toEqual(['message', 'life', 'life']);
  });

  it('gives the own activate the LIFECOLOR, the deactivate none (CommandArrow.java:445-450)', () => {
    const p = parse(['A -> B ++ #red : x', 'B -> A !!']);
    expect(own(p, 0)[0]?.color).toBe('#red');
    expect(own(p, 1).map((e) => [e.type, e.participant, e.color])).toEqual([['DESTROY', 'A', undefined]]);
  });

  it('binds EVERY life event after a message, not only the first (SequenceDiagram.java:367-404)', () => {
    const p = parse(['First -> Second : message', 'activate First', 'activate Second']);
    expect(life(p, 1).message).toBe(message(p, 0));
    expect(life(p, 2).message).toBe(message(p, 0));
  });

  it('leaves a life event unbound before any message, or when the message does not deal with it (:378-393)', () => {
    const p = parse(['activate C', 'A -> B', 'activate C']);
    expect(life(p, 0).message).toBeUndefined();
    expect(life(p, 2).message).toBeUndefined();
  });

  it('a divider and a group end close the message off; a group start does not (:275,443)', () => {
    const p = parse(['A -> B', 'alt x', 'activate B', 'end', 'activate B', 'A -> B', '== d ==', 'activate B']);
    const lifes = p.live.events.filter((e): e is LiveLifeEvent => e.kind === 'life');
    expect(lifes.map((e) => e.message !== undefined)).toEqual([true, false, false]);
    // start, the bound activate, end; then the divider.
    expect(kinds(p)).toEqual(['message', 'other', 'life', 'other', 'life', 'message', 'other', 'life']);
  });

  it('adds one else leaf per later branch (SequenceDiagram#grouping)', () => {
    const p = parse(['alt a', 'A -> B', 'else b', 'A -> B', 'else c', 'end']);
    expect(kinds(p)).toEqual(['other', 'message', 'other', 'message', 'other', 'other']);
  });

  it('makes a ref one event that keeps the message binding (Reference is no EventWithDeactivate)', () => {
    const p = parse(['A -> B', 'ref over A, B : r', 'activate B']);
    expect(kinds(p)).toEqual(['message', 'other', 'life']);
    expect(life(p, 2).message).toBe(message(p, 0));
  });

  it('drops a note on a message, keeps a standalone note, vmerges / note into a Notes (:226-241)', () => {
    const p = parse(['A -> B', 'note right : on the arrow', 'note over A : one', '/ note over B : two', 'B -> A']);
    expect(kinds(p)).toEqual(['message', 'other', 'message']);
    const q = parse(['note over A : one', 'note over B : two']);
    expect(kinds(q)).toEqual(['note', 'note']);
  });

  it("chains a & message to the last AbstractMessage, an exo's included (:200-202,217-223)", () => {
    const p = parse(['participant A', 'participant B', '[-> A : in', '& A -> B : x', '& B -> A : y']);
    const [exo, first, second] = [message(p, 0), message(p, 1), message(p, 2)];
    expect(first.parallelBrother).toBe(exo);
    expect(second.parallelBrother).toBe(first);
    expect(isParallelWith(second, exo)).toBe(true);
    expect(isParallelWith(exo, second)).toBe(false);
  });

  it("records a self message's own life events in lifeEventsType (AbstractMessage.java:147-160)", () => {
    const p = parse(['A -> A : self', 'activate A']);
    expect([...message(p, 0).lifeEventsType]).toEqual(['ACTIVATE']);
    expect(message(p, 0).self).toBe(true);
  });

  it('makes every other event its own key', () => {
    const p = parse(['A -> B', '...', '||45||', 'newpage', '== d ==']);
    const others = p.live.events.filter((e) => e.kind === 'other');
    expect(new Set(others).size).toBe(4);
  });
});

describe('LiveBoxes#addStep — LiveBoxes.java:79-87', () => {
  it('moves a deactivate landing on a recorded y down by 5; an activate stays', () => {
    // nanedo-96-foso005: `b -> a`, `activate a`, `deactivate a`.
    const p = parse(['b -> a : hello', 'activate a', 'deactivate a']);
    const boxes = new LiveBoxes('a', p.live.events);
    boxes.addStep(at(p, 0), 66);
    boxes.addStep(at(p, 1), 74);
    boxes.addStep(at(p, 2), 74);
    expect([boxes.getStep(at(p, 1)), boxes.getStep(at(p, 2))]).toEqual([74, 79]);
  });

  it('does not move a destroy: LifeEvent#isDeactivate is DEACTIVATE only (LifeEvent.java:86-88)', () => {
    const p = parse(['A -> B : x', 'activate B', 'destroy B']);
    const boxes = new LiveBoxes('B', p.live.events);
    boxes.addStep(at(p, 1), 74);
    boxes.addStep(at(p, 2), 74);
    expect(boxes.getStep(at(p, 2))).toBe(74);
  });

  it('ignores an event that does not deal with its participant (:80)', () => {
    const p = parse(['A -> B : x', 'activate A']);
    const boxes = new LiveBoxes('B', p.live.events);
    boxes.addStep(at(p, 1), 74);
    expect(boxes.getStep(at(p, 1))).toBeUndefined();
    expect(boxes.getParticipant()).toBe('B');
  });
});

describe('LiveBoxes#getLevelAt — LiveBoxes.java:143-210', () => {
  const p = parse(['A -> B ++ : x', 'deactivate B']);
  const boxes = new LiveBoxes('B', p.live.events);

  it('counts a bound activate unless IGNORE_FUTURE_ACTIVATE', () => {
    expect(boxes.getLevelAt(at(p, 0), 'IGNORE_FUTURE_ACTIVATE')).toBe(0);
    expect(boxes.getLevelAt(at(p, 0), 'IGNORE_FUTURE_DEACTIVATE')).toBe(1);
  });

  it('stops before a deactivate once an activate was seen (:167-176)', () => {
    expect(boxes.getLevelAt(at(p, 0), 'CONSIDER_FUTURE_DEACTIVATE')).toBe(1);
    // The life event itself: the prefix level right after it.
    expect(boxes.getLevelAt(at(p, 1), 'CONSIDER_FUTURE_DEACTIVATE')).toBe(0);
  });

  it('lets a later & brother bound event count for the head (:159-160)', () => {
    const q = parse(['A -> B : x', '& C -> B : y', 'activate B']);
    expect(new LiveBoxes('B', q.live.events).getLevelAt(at(q, 0), 'IGNORE_FUTURE_DEACTIVATE')).toBe(1);
  });

  it('applies a bound life event after a note above it (:184-204)', () => {
    const q = parse(['A -> B ++ : x', 'note over A : n', 'deactivate B', 'activate B']);
    const note = q.live.events[2]!;
    const b = new LiveBoxes('B', q.live.events);
    expect(b.getLevelAt(note, 'CONSIDER_FUTURE_DEACTIVATE')).toBe(1);
    expect(b.getLevelAt(note, 'IGNORE_FUTURE_DEACTIVATE')).toBe(2);
    expect(b.getLevelAt(note, 'IGNORE_FUTURE_ACTIVATE')).toBe(1);
  });

  it('throws for an event outside the list', () => {
    expect(() => boxes.getLevelAt({ kind: 'note' }, 'IGNORE_FUTURE_ACTIVATE')).toThrow('not in the list');
  });
});

describe('LiveBoxes#getStairs — LiveBoxes.java:276-337', () => {
  it('nanedo: the bar runs from the arrow to the nudged deactivate (jar rect y=66 height=13)', () => {
    const p = parse(['b -> a : hello', 'activate a', 'deactivate a']);
    const boxes = new LiveBoxes('a', p.live.events);
    [66, 74, 74].forEach((y, i) => boxes.addStep(at(p, i), y));
    expect(boxes.drawBoxes(0, 200).map((b) => [b.level, b.y1, b.y2 - b.y1])).toEqual([[1, 66, 13]]);
  });

  it('nocilo: both activates bound to one message open at its arrow (jar rects y=66)', () => {
    const p = parse(['First -> Second : message', 'activate First', 'activate Second']);
    for (const id of ['First', 'Second']) {
      const boxes = new LiveBoxes(id, p.live.events);
      [66, 74, 74].forEach((y, i) => boxes.addStep(at(p, i), y));
      expect(boxes.drawBoxes(0, 93).map((b) => [b.y1, b.y2])).toEqual([[66, 93]]);
    }
  });

  it('a standalone note resets the binding: the next bound event takes its own step (:284-289)', () => {
    const p = parse(['A -> B : hi', 'activate B', 'note over A : n', 'activate B']);
    const boxes = new LiveBoxes('B', p.live.events);
    boxes.addStep(at(p, 0), 66);
    boxes.addStep(at(p, 1), 74);
    boxes.addStep(at(p, 3), 107);
    const steps = boxes.getStairs(0, 200).getSteps();
    expect(steps.map((s) => [s.value, s.indent])).toEqual([
      [66, 2],
      [66, 1],
      [107, 2],
      [200, 2],
    ]);
  });

  it('zutesu: a & message is skipped; the unbound deactivate takes its own step (jar heights 27, 19)', () => {
    const p = parse([
      'participant P',
      'participant DP',
      'participant R',
      'participant DR',
      'activate P',
      'activate R',
      'P -> DP : a',
      '& R -> DR : b',
      'deactivate P',
      'deactivate R',
    ]);
    const steps = [47, 47, 66, 66, 74, 74];
    const heights = ['P', 'R'].map((id) => {
      const boxes = new LiveBoxes(id, p.live.events);
      steps.forEach((y, i) => boxes.addStep(at(p, i), y));
      return boxes.drawBoxes(0, 100).map((b) => b.y2 - b.y1);
    });
    expect(heights).toEqual([[27], [19]]);
  });

  it('flags a Message step a destroy follows, never an exo (:212-234), and clamps at createY (:330)', () => {
    const p = parse(['A -> B ++ : x', 'B -> A : y', 'destroy B']);
    const boxes = new LiveBoxes('B', p.live.events);
    boxes.addStep(at(p, 0), 66);
    boxes.addStep(at(p, 1), 93);
    const steps = boxes.getStairs(80, 200).getSteps();
    // The own `++` and the destroy record no step here, but each keeps its
    // message's position (`:298-302`) and so steps there at its own level.
    expect(steps.map((s) => [s.value, s.destroy, s.indent])).toEqual([
      [80, false, 1],
      [80, false, 1],
      [93, true, 0],
      [93, false, 0],
      [200, false, 0],
    ]);
    const q = parse(['participant A', '[-> A ++ : in', 'destroy A']);
    const exo = new LiveBoxes('A', q.live.events);
    exo.addStep(at(q, 0), 66);
    expect(exo.getStairs(0, 100).getSteps()[0]?.destroy).toBe(false);
  });

  it("takes the activating event's colour (:236-260)", () => {
    const p = parse(['A -> B : x', 'activate B #00FF00', 'B -> A : y', 'activate A']);
    const boxes = new LiveBoxes('B', p.live.events);
    boxes.addStep(at(p, 0), 66);
    const b = new LiveBoxes('A', p.live.events);
    b.addStep(at(p, 2), 93);
    expect(boxes.drawBoxes(0, 100)[0]?.color).toBe(life(p, 1).color);
    expect(b.getStairs(0, 100).getSteps()[0]?.color).toBeUndefined();
  });

  it('draws nothing for a deactivate at level 0', () => {
    const p = parse(['A -> B : x', 'deactivate B']);
    const boxes = new LiveBoxes('B', p.live.events);
    boxes.addStep(at(p, 0), 66);
    expect(boxes.drawBoxes(0, 100)).toEqual([]);
  });
});

describe('Stairs — Stairs.java', () => {
  const step = (value: number, indent: number) => ({
    value,
    indent,
    destroy: false,
    color: undefined,
    styleBuilder: undefined,
    event: undefined,
  });

  it('drops a step above its predecessor (:47-58)', () => {
    const s = new Stairs();
    s.addStep(step(50, 1));
    s.addStep(step(40, 0));
    expect(s.getSteps().map((x) => x.value)).toEqual([50]);
  });

  it('refuses a negative indent and has no max indent empty (:48-50,61-70)', () => {
    expect(() => new Stairs().addStep(step(0, -1))).toThrow(RangeError);
    expect(new Stairs().getMaxIndent()).toBe(Number.MIN_SAFE_INTEGER);
  });
});

describe('LiveBoxes#getMaxValue / getMaxPosition — LiveBoxes.java:347-372', () => {
  it('counts the deepest nesting, at half a box per level', () => {
    const p = parse(['A -> B ++', 'A -> B ++', 'B -> A --']);
    const boxes = new LiveBoxes('B', p.live.events);
    expect(boxes.getMaxValue()).toBe(2);
    expect(boxes.getMaxPosition()).toBe(2 * ACTIVATION_HALF_WIDTH);
  });

  it('does not clamp: a deactivate at level 0 cancels the next activate', () => {
    const p = parse(['A -> B : x', 'deactivate B', 'B -> A : y', 'activate B']);
    expect(new LiveBoxes('B', p.live.events).getMaxValue()).toBe(0);
  });
});
