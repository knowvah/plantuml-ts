/**
 * Sequence diagram layout — activation (livebox) bars: the open-bar stack the
 * event walk keeps, and the {@link ActivationGeo} each closed bar becomes,
 * painted from its merged `activationBox` style.
 *
 * Split out of `sequence-layout-events.ts` (500-line file cap, sdd1 T2b);
 * that module re-exports every name here, so its importers are unchanged.
 *
 * ## Which builder paints a bar
 *
 * `LiveBoxes#getStairs` records one `Step` per event, carrying that event's
 * builder (`teoz/LiveBoxes.java:323-331`: an `AbstractMessage`'s or a
 * `LifeEvent`'s `getStyleBuilder()`), and `LiveBoxesDrawer#addStart` keeps the
 * builder of the step that OPENS the level (`teoz/LiveBoxes.java:405-407`,
 * `LiveBoxesDrawer.java:99-103`). `drawInternal` then merges the bar's style
 * from it (`LiveBoxesDrawer.java:137-140`). A message that activates — by its
 * own `++` or by an `activate` bound to it — reaches the new level at its own
 * step, because `getLevelAtInternal` counts the bound life events forward
 * from the message (`teoz/LiveBoxes.java:146-170`); so the message's builder
 * paints that bar. A standalone `activate` opens at its own step, with its own
 * builder.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LiveBoxes.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LiveBoxesDrawer.java
 */

import type { ActivationGeo, EventGeo, Participant, ParticipantGeo } from './ast.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { componentStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';

/** `ComponentRoseActiveLine#getPreferredWidth` (`:114-116`) returns 10, and
 *  `LiveBoxesDrawer#getWidth` is that width (`LiveBoxesDrawer.java:95-97`):
 *  this is it halved, the bar's offset from its lifeline and the step
 *  `drawOneLevel` moves each nested level by (`LiveBoxes.java:400`). */
export const ACTIVATION_HALF_WIDTH = 5;

/** Pending activation-bar start record. `level` is 1-based and fixed when
 *  the bar OPENS — upstream's `Step#getIndent` for this bar's steps.
 *  `styleBuilder` is that opening step's (`LiveBoxes.java:325-331`). */
type ActivationRecord = { y: number; level: number; color?: string; styleBuilder: StyleBuilder };

/**
 * The open activation bars for one participant, innermost LAST.
 *
 * A STACK, not a single record, because upstream's activation state is a
 * nesting LEVEL: `LiveBoxes#getLevelAtInternal` replays the event list
 * counting `level++` on every activate and `level = Math.max(0, level - 1)`
 * on every deactivate (`:100-108`), and `getStairs` emits one step per level
 * change. `A -> B++` four deep is four boxes, each with its own extent, which
 * one record per participant cannot hold: the inner activate would overwrite
 * the outer one's start.
 *
 * `Math.max(0, ...)` is the other half, and it is why {@link emitActivation}
 * returns on an empty stack instead of inventing a start: a deactivate that
 * arrives at level 0 leaves the level at 0 and draws nothing at all.
 *
 * `lastMessageStyleBuilder` is the builder of the last message the walk laid
 * out — the step builder of every bar a message opens (module head). The
 * event walk sets it before it hands a message to its handler; a bar pushed
 * without its own builder takes it. One walk owns one stack, single-threaded.
 */
export type ActivationStack = Map<string, ActivationRecord[]> & {
  lastMessageStyleBuilder?: StyleBuilder;
  /** Each participant's stereotype, merged into every one of its bars
   *  (`LiveBoxes.java:391,399` hand `p.getStereotype()` to the drawer). */
  readonly stereotypes: ReadonlyMap<string, Stereotype>;
};

/** An empty stack over `participants`, keeping each one's stereotype. */
export function newActivationStack(participants: readonly Participant[]): ActivationStack {
  const stereotypes = new Map<string, Stereotype>();
  for (const p of participants) {
    const stereotype = Stereotype.build(p.stereotype);
    if (stereotype !== undefined) stereotypes.set(p.id, stereotype);
  }
  return Object.assign(new Map<string, ActivationRecord[]>(), { stereotypes });
}

/** What a caller supplies to open a bar; a bar a message opens omits
 *  `styleBuilder` and takes {@link ActivationStack.lastMessageStyleBuilder}. */
export type ActivationStart = Omit<ActivationRecord, 'level' | 'styleBuilder'> & {
  readonly styleBuilder?: StyleBuilder;
};

/** Open one activation bar for `participantId`, nested inside any already
 *  open — `level++` in `LiveBoxes#getLevelAtInternal` (`:102-103`). */
export function pushActivation(activationStart: ActivationStack, participantId: string, start: ActivationStart): void {
  const styleBuilder = start.styleBuilder ?? activationStart.lastMessageStyleBuilder;
  // A bar without its own builder is opened only while a message is laid out
  // (`sequence-layout-message.ts#applyMessageActivation`), after the walk set
  // the message's builder.
  if (styleBuilder === undefined) throw new Error(`activation of ${participantId} opened outside any message`);
  const stack = activationStart.get(participantId);
  const record = { y: start.y, ...(start.color !== undefined ? { color: start.color } : {}), styleBuilder };
  if (stack === undefined) activationStart.set(participantId, [{ ...record, level: 1 }]);
  else stack.push({ ...record, level: stack.length + 1 });
}

/** The INNERMOST open activation for `participantId`, or `undefined` at
 *  level 0. */
export function openActivation(activationStart: ActivationStack, participantId: string): ActivationRecord | undefined {
  const stack = activationStart.get(participantId);
  return stack === undefined ? undefined : stack[stack.length - 1];
}

/** How deep `participantId` is currently activated — upstream's own `level`
 *  (`LiveBoxes#getLevelAt`). 0 when nothing is open. */
export function activationLevel(activationStart: ActivationStack, participantId: string): number {
  return activationStart.get(participantId)?.length ?? 0;
}

/**
 * Close every activation still open when the diagram ends, at the body's
 * bottom.
 *
 * Upstream has nothing to close: the level simply never returns to 0, so
 * `getStairs` (`LiveBoxes.java:245-300`) records its last step at that level
 * and `LiveBoxesDrawer` draws the bar on to the end of the lifeline. This
 * port materialises each bar at its deactivate, so an activation with no
 * deactivate needs the equivalent flush -- without it the bar vanishes.
 *
 * Jar-verified on `micaki-01-rexa741`, whose third `alt` branch opens an
 * activation that is never closed: the golden's second bar ends at `y=190`,
 * exactly where its lifelines do.
 *
 * Innermost first, then outward, then participant by participant in
 * declaration order -- deterministic, and the reverse of the order the walk
 * opened them in.
 */
export function flushOpenActivations(
  activationStart: ActivationStack,
  endY: number,
  participantMap: Map<string, ParticipantGeo>,
  eventGeos: EventGeo[],
): void {
  for (const participantId of [...activationStart.keys()])
    while (activationLevel(activationStart, participantId) > 0)
      emitActivation(participantId, endY, participantMap, activationStart, eventGeos);
}

/**
 * A bar's paint: `LiveBoxesDrawer#drawInternal` merges
 * `ACTIVATION_BOX_*`'s signature (`root, element, sequenceDiagram,
 * activationBox`, `ComponentType.java:82-84`) with the participant's
 * stereotype (`withTOBECHANGED(stereotype)`, `LiveBoxesDrawer.java:140`)
 * from the opening step's builder, and lets the step's colour override its
 * `BackGroundColor` (`style.eventuallyOverride(symbolContext)`,
 * `LiveBoxesDrawer.java:140-146`; `Style.java:214-223`). The colour is the
 * activating event's `getSpecificColors()` (`LiveBoxes.java:236-240,249-256`).
 */
function activationPaint(record: ActivationRecord, stereotype: Stereotype | undefined): SequencePaint {
  const set = HColorSet.instance();
  const back = record.color === undefined ? undefined : set.getColorOrNull(record.color);
  return paintOf(
    componentStyle(record.styleBuilder, 'ACTIVATION_BOX', stereotype).eventuallyOverride('BackGroundColor', back),
    set,
  );
}

export function emitActivation(
  participantId: string,
  currentY: number,
  participantMap: Map<string, ParticipantGeo>,
  activationStart: ActivationStack,
  eventGeos: EventGeo[],
): void {
  const record = activationStart.get(participantId)?.pop();
  // A deactivate with nothing open draws NOTHING -- not a zero-height box.
  //
  // Upstream never tracks "the open activation": it recomputes a nesting
  // LEVEL per participant by replaying the event list, and every deactivate
  // is clamped -- `level = Math.max(0, level - 1)`
  // (`LiveBoxes#getLevelAtInternal:104-108`, and again at `:136-141` for the
  // future-deactivate lookahead). A deactivate that arrives at level 0 leaves
  // it at 0, so `getStairs` records no step and `LiveBoxesDrawer` draws no
  // box. This port models that level as one open record per participant, and
  // "no record" IS level 0.
  //
  // Without this, `rugeco-70-muro754` emitted a fourth activation -- `a`
  // deactivated twice, once by `a ->> b --++`'s own `--` and once by the
  // standalone `deactivate a` after the group -- as a `height: 0` bar that
  // the renderer then wrapped in a `<g>`, one surplus top-level child
  // against a golden this port otherwise matched element for element.
  if (record === undefined) return;
  const startY = record.y;
  const activationGeo: ActivationGeo = {
    kind: 'activation',
    participantId,
    lifelineX: participantMap.get(participantId)?.centerX ?? 0,
    y: startY,
    height: currentY - startY,
    level: record.level,
    ...(record.color !== undefined ? { color: record.color } : {}),
    paint: activationPaint(record, activationStart.stereotypes.get(participantId)),
  };
  eventGeos.push(activationGeo);
}
