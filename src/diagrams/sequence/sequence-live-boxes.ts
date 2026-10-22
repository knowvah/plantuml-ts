/**
 * `teoz/LiveBoxes.java`: one participant's activation history, the `Step`s its
 * tiles record as their gauges resolve, and the `Stairs` the lifeline pass
 * draws the activation bars from.
 *
 * Upstream builds one `LiveBoxes` per `LivingSpace` over the diagram's whole
 * event list (`LivingSpace.java:148`), so its two questions -- the level at an
 * event and the y each step sits at -- are answered over that FLAT list, with
 * every group, divider and standalone note in place. This port's AST nests a
 * group's branches, keeps a message's own `++`/`--`/`!!` as fields and folds
 * notes on messages into their message; {@link flattenLiveEvents} rebuilds the
 * list `SequenceDiagram#events` holds, binding every life event as
 * `SequenceDiagram#activate` does (`:367-404`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LiveBoxes.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/SequenceDiagram.java
 */

import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import {
  flattenLiveEvents,
  isParallelWith,
  type LiveEvent,
  type LiveLifeEvent,
  type LiveMessage,
} from './sequence-live-events.js';

export { flattenLiveEvents, isParallelWith };
export type { LiveEvent, LiveEvents, LiveLifeEvent, LiveMessage, LifeEventType } from './sequence-live-events.js';

/** `ComponentRoseActiveLine#getPreferredWidth` (`:114-116`) returns 10, and
 *  `LiveBoxesDrawer#getWidth` is that width (`LiveBoxesDrawer.java:95-97`):
 *  this is it halved, the bar's offset from its lifeline and the step
 *  `drawOneLevel` moves each nested level by (`LiveBoxes.java:400`). */
export const ACTIVATION_HALF_WIDTH = 5;

/** `teoz/EventsHistoryMode.java`: which of an event's bound life events
 *  `getLevelAt` counts. */
export type EventsHistoryMode = 'IGNORE_FUTURE_ACTIVATE' | 'IGNORE_FUTURE_DEACTIVATE' | 'CONSIDER_FUTURE_DEACTIVATE';

/** `teoz/Step.java`, plus the event that recorded it (the port's handle for
 *  where the bar it closes is emitted). */
export interface Step {
  readonly value: number;
  readonly destroy: boolean;
  readonly indent: number;
  /** `getActivateColor` (`LiveBoxes.java:236-260`): a back colour. */
  readonly color: string | undefined;
  readonly styleBuilder: StyleBuilder | undefined;
  /** `undefined` on the closing `totalHeight` step (`:335`). */
  readonly event: LiveEvent | undefined;
}

/** `teoz/Stairs.java`: steps in y order; one above its predecessor's value
 *  is dropped (`:47-58`). */
export class Stairs {
  private readonly values: Step[] = [];

  addStep(step: Step): void {
    if (step.indent < 0) throw new RangeError(`Stairs.addStep: negative indent ${step.indent}`);
    const last = this.values[this.values.length - 1];
    if (last !== undefined && step.value < last.value) return;
    this.values.push(step);
  }

  /** `Integer.MIN_VALUE` on an empty stairs, as upstream (`:61-70`). */
  getMaxIndent(): number {
    return this.values.reduce((max, s) => Math.max(max, s.indent), Number.MIN_SAFE_INTEGER);
  }

  getSteps(): readonly Step[] {
    return this.values;
  }
}

/** One bar `drawOneLevel` draws (`LiveBoxes.java:398-420`): `addStart` at
 *  `y1`, `doDrawing` at `y2`. `closing` is the step event that closed it,
 *  `undefined` when the closing `totalHeight` step did. */
export interface LiveBox {
  readonly level: number;
  readonly y1: number;
  readonly y2: number;
  readonly color: string | undefined;
  readonly styleBuilder: StyleBuilder | undefined;
  readonly closing: LiveEvent | undefined;
}

/** `getStairs`' running state (`LiveBoxes.java:278-282`). */
interface StairsWalk {
  indent: number;
  lastMessage: LiveMessage | undefined;
  position: number | undefined;
  seenActivate: boolean;
  seenDeactivate: boolean;
}

/** `ensureLevelCache` (`LiveBoxes.java:110-141`). */
interface LevelCache {
  /** `eventInfo`: index in `events`, level right after the event. */
  readonly info: Map<LiveEvent, readonly [number, number]>;
  /** `nextLife[i]`: the first life event at or after `i` a message lookahead
   *  reaches through notes and messages, else -1. */
  readonly nextLife: readonly number[];
}

function dealWith(event: LiveEvent, p: string): boolean {
  if (event.kind === 'message') return event.participants.includes(p);
  if (event.kind === 'life') return event.participant === p;
  return false;
}

function isDeactivateOrDestroy(le: LiveLifeEvent): boolean {
  return le.type === 'DEACTIVATE' || le.type === 'DESTROY';
}

export class LiveBoxes {
  private readonly eventsStep = new Map<LiveEvent, number>();
  private cache: LevelCache | undefined;

  constructor(
    private readonly p: string,
    private readonly events: readonly LiveEvent[],
  ) {}

  getParticipant(): string {
    return this.p;
  }

  /** `addStep` (`:79-87`): a deactivate landing on a y some event already
   *  recorded is moved 5 down. A destroy is not a deactivate (`LifeEvent
   *  #isDeactivate`, `LifeEvent.java:86-88`). */
  addStep(event: LiveEvent, y: number): void {
    if (!dealWith(event, this.p)) return;
    let value = y;
    if (event.kind === 'life' && event.type === 'DEACTIVATE' && [...this.eventsStep.values()].includes(value))
      value += DEACTIVATE_NUDGE;
    this.eventsStep.set(event, value);
  }

  /** The step `event` recorded, if any. */
  getStep(event: LiveEvent): number | undefined {
    return this.eventsStep.get(event);
  }

  private levelCache(): LevelCache {
    if (this.cache !== undefined) return this.cache;
    const info = new Map<LiveEvent, readonly [number, number]>();
    let level = 0;
    this.events.forEach((e, i) => {
      if (e.kind === 'life' && e.participant === this.p) {
        if (e.type === 'ACTIVATE') level++;
        if (isDeactivateOrDestroy(e)) level = Math.max(0, level - 1);
      }
      if (!info.has(e)) info.set(e, [i, level]);
    });
    const nextLife: number[] = new Array<number>(this.events.length + 1).fill(-1);
    for (let i = this.events.length - 1; i >= 0; i--) {
      const e = this.events[i]!;
      if (e.kind === 'life') nextLife[i] = i;
      else if (e.kind === 'note' || e.kind === 'message') nextLife[i] = nextLife[i + 1]!;
    }
    this.cache = { info, nextLife };
    return this.cache;
  }

  private infoOf(event: LiveEvent): readonly [number, number] {
    const info = this.levelCache().info.get(event);
    if (info === undefined) throw new Error(`LiveBoxes(${this.p}).getLevelAt: event not in the list`);
    return info;
  }

  /** `getLevelAt` / `getLevelAtInternal` (`:93-95,143-210`). */
  getLevelAt(event: LiveEvent, mode: EventsHistoryMode): number {
    const [index, before] = this.infoOf(event);
    let level = before;
    if (event.kind === 'message') level = this.messageLookahead(event, index, level, mode);
    if (event.kind === 'note') level = this.noteLookahead(index, level, mode);
    return Math.max(0, level);
  }

  /** `:152-182`: the life events bound to this message (or to one `&`
   *  parallel with it) move its level; once both an activate and a
   *  deactivate are seen the walk stops before applying the second. */
  private messageLookahead(msg: LiveMessage, index: number, start: number, mode: EventsHistoryMode): number {
    const { nextLife } = this.levelCache();
    const walk: Lookahead = { level: start, seenActivate: false, seenDeactivate: false };
    // `msg.dealWith(p)` guards both arms (`:164,172`).
    if (!msg.participants.includes(this.p)) return start;
    for (let k = nextLife[index + 1]!; k !== -1; k = nextLife[k + 1]!) {
      const le = this.events[k] as LiveLifeEvent;
      // `sameMessage` (`:159-160`): bound to it, or to a later `&` brother.
      if (le.message === undefined || !isParallelWith(le.message, msg) || le.participant !== this.p) continue;
      if (!lookaheadTurn(walk, le, mode)) break;
    }
    return walk.level;
  }

  /** `:184-204`: a life event bound to a previous message, written after
   *  this note, applies above it. */
  private noteLookahead(index: number, start: number, mode: EventsHistoryMode): number {
    let level = start;
    for (let k = index + 1; k < this.events.length; k++) {
      const next = this.events[k]!;
      if (next.kind === 'note') continue;
      if (next.kind !== 'life') break;
      if (next.participant !== this.p || next.message === undefined) continue;
      if (mode !== 'IGNORE_FUTURE_ACTIVATE' && next.type === 'ACTIVATE') level++;
      if (mode === 'CONSIDER_FUTURE_DEACTIVATE' && isDeactivateOrDestroy(next)) level = Math.max(0, level - 1);
    }
    return level;
  }

  /** `isNextEventADestroy` (`:212-234`): a `Message` (not an exo) followed,
   *  through notes and life events, by this participant's destroy. */
  private isNextEventADestroy(event: LiveEvent): boolean {
    if (event.kind !== 'message' || event.exo) return false;
    for (let k = this.infoOf(event)[0] + 1; k < this.events.length; k++) {
      const next = this.events[k]!;
      if (next.kind === 'note') continue;
      if (next.kind !== 'life') return false;
      if (next.type === 'DESTROY' && next.participant === this.p) return true;
    }
    return false;
  }

  /** `getActivateColor` (`:236-260`). */
  private getActivateColor(event: LiveEvent): string | undefined {
    if (event.kind === 'life' && event.type === 'ACTIVATE') return event.color;
    if (event.kind !== 'message') return undefined;
    for (let k = this.infoOf(event)[0] + 1; k < this.events.length; k++) {
      const next = this.events[k]!;
      if (next.kind === 'note') continue;
      if (next.kind !== 'life' || next.message !== event) return undefined;
      if (next.type === 'ACTIVATE' && next.participant === this.p) return next.color;
    }
    return undefined;
  }

  /** `getStairs` (`:276-337`). */
  getStairs(createY: number, totalHeight: number): Stairs {
    const stair = new Stairs();
    const walk: StairsWalk = {
      indent: 0,
      lastMessage: undefined,
      position: undefined,
      seenActivate: false,
      seenDeactivate: false,
    };
    for (const event of this.events) {
      if (!this.advance(walk, event) || walk.position === undefined) continue;
      walk.indent = this.getLevelAt(event, 'CONSIDER_FUTURE_DEACTIVATE');
      stair.addStep(this.stepAt(event, Math.max(createY, walk.position), walk.indent));
    }
    stair.addStep({
      value: totalHeight,
      destroy: false,
      indent: walk.indent,
      color: undefined,
      styleBuilder: undefined,
      event: undefined,
    });
    return stair;
  }

  /** `new Step(...)` (`:323-331`): the builder is the message's or the life
   *  event's own. */
  private stepAt(event: LiveEvent, value: number, indent: number): Step {
    return {
      value,
      destroy: this.isNextEventADestroy(event),
      indent,
      color: this.getActivateColor(event),
      styleBuilder: event.kind === 'message' || event.kind === 'life' ? event.styleBuilder : undefined,
      event,
    };
  }

  /** One turn of `getStairs`' loop up to the step (`:284-318`); `false`
   *  where upstream `continue`s. */
  private advance(walk: StairsWalk, event: LiveEvent): boolean {
    if (event.kind === 'note') {
      // "This would be a participant positioned Note, not a Message based Note"
      walk.lastMessage = undefined;
      walk.seenActivate = false;
      walk.seenDeactivate = false;
    }
    const potential = this.eventsStep.get(event);
    if (walk.position === undefined || walk.lastMessage === undefined) walk.position = potential;
    else if (event.kind === 'life') {
      if (!dealWith(event, this.p)) return false;
      this.boundPosition(walk, event, potential);
    } else walk.position = potential;
    if (event.kind !== 'message') return true;
    if (walk.lastMessage !== undefined && isParallelWith(event, walk.lastMessage)) return false;
    walk.seenActivate = false;
    walk.seenDeactivate = false;
    walk.lastMessage = event;
    return true;
  }

  /** `:298-304`: a life event bound to the last message keeps that
   *  message's position, unless it reverses what was already seen. */
  private boundPosition(walk: StairsWalk, le: LiveLifeEvent, potential: number | undefined): void {
    const lastMessage = walk.lastMessage!;
    if (le.message === undefined || !isParallelWith(le.message, lastMessage)) walk.position = potential;
    else if ((le.type === 'ACTIVATE' && walk.seenDeactivate) || (le.type === 'DEACTIVATE' && walk.seenActivate))
      walk.position = potential;
    walk.seenActivate ||= le.type === 'ACTIVATE';
    walk.seenDeactivate ||= le.type === 'DEACTIVATE';
  }

  /** `getMaxValue` (`:347-365`) -- unclamped, as upstream. */
  getMaxValue(): number {
    let max = 0;
    let level = 0;
    for (const e of this.events) {
      if (e.kind !== 'life') continue;
      if (e.participant === this.p && e.type === 'ACTIVATE') level++;
      max = Math.max(max, level);
      if (e.participant === this.p && isDeactivateOrDestroy(e)) level--;
    }
    return max;
  }

  /** `getMaxPosition` (`:367-372`): `drawer.getWidth() / 2.0 * max`. */
  getMaxPosition(): number {
    return ACTIVATION_HALF_WIDTH * this.getMaxValue();
  }

  /** The bars `drawBoxes` draws (`:374-378`): `drawOneLevel(i)` for `i`
   *  from 1 to the stairs' max indent, each level's bars in step order. The
   *  destroy crosses (`:380-396,415-416`) are `sequence-layout-life-event.ts`'s. */
  drawBoxes(createY: number, endY: number): LiveBox[] {
    const stairs = this.getStairs(createY, endY);
    const boxes: LiveBox[] = [];
    for (let level = 1; level <= stairs.getMaxIndent(); level++) boxes.push(...drawOneLevel(level, stairs));
    return boxes;
  }
}

/** `LiveBoxes.java:79-86`: `y += 5.0`. */
const DEACTIVATE_NUDGE = 5;

/** The message lookahead's running state (`LiveBoxes.java:153-154`). */
interface Lookahead {
  level: number;
  seenActivate: boolean;
  seenDeactivate: boolean;
}

/** One bound life event of the lookahead (`:164-178`); `false` is the
 *  `break` once both an activate and a deactivate have been seen. */
function lookaheadTurn(walk: Lookahead, le: LiveLifeEvent, mode: EventsHistoryMode): boolean {
  if (mode !== 'IGNORE_FUTURE_ACTIVATE' && le.type === 'ACTIVATE') {
    walk.seenActivate = true;
    if (walk.seenDeactivate) return false;
    walk.level++;
  }
  if (mode === 'CONSIDER_FUTURE_DEACTIVATE' && isDeactivateOrDestroy(le)) {
    walk.seenDeactivate = true;
    if (walk.seenActivate) return false;
    walk.level = Math.max(0, walk.level - 1);
  }
  return true;
}

/** `drawOneLevel` (`:398-420`): a bar opens at the first step whose indent is
 *  EXACTLY this level and closes at the next step below it, or at the last
 *  step. */
function drawOneLevel(level: number, stairs: Stairs): LiveBox[] {
  const boxes: LiveBox[] = [];
  const steps = stairs.getSteps();
  let start: Step | undefined;
  steps.forEach((step, i) => {
    if (start === undefined && step.indent === level) start = step;
    else if (start !== undefined && (i === steps.length - 1 || step.indent < level)) {
      boxes.push({
        level,
        y1: start.value,
        y2: step.value,
        color: start.color,
        styleBuilder: start.styleBuilder,
        closing: step.event,
      });
      start = undefined;
    }
  });
  return boxes;
}
