/**
 * Sequence diagram layout — the lifelines: `LivingSpace#drawLineAndLiveboxes`
 * (`teoz/LivingSpace.java:151-167`) handing each alive span to `MutingLine`
 * (`teoz/MutingLine.java`), which cuts it at the delays
 * (`sequence-delay.ts#lifelineSegments`) and draws every piece with its own
 * merged style.
 *
 * ## Which builder paints a lifeline
 *
 * `MutingLine` keeps `skinParam.getCurrentStyleBuilder()` from its
 * constructor (`MutingLine.java:70`), and `LivingSpace` builds it at TILE
 * time (`LivingSpace.java:147`), after the parse: so a `skinparam` or a
 * `<style>` written after the last message still reaches every lifeline
 * (jar-probed). That builder is `SequenceDiagramAST.styleBuilder`.
 *
 * Split out of `layout.ts` (500-line file cap, sdd1 T2f).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/MutingLine.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LivingSpace.java
 */

import type { EventGeo, LifelineSegment, Participant, ParticipantGeo, SequenceDiagramAST } from './ast.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { delaySpansOf, lifelineSegments, type Span } from './sequence-delay.js';
import { componentStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';

/** The builder every tile reads after the parse (module head). An AST built
 *  without `parseSequence` has none, and a lifeline cannot be painted. */
export function endOfParseStyleBuilder(ast: SequenceDiagramAST): StyleBuilder {
  if (ast.styleBuilder === undefined)
    throw new Error('a sequence AST built without parseSequence has no style builder');
  return ast.styleBuilder;
}

/**
 * `MutingLine#drawInternal` (`:102-108`): the piece's `ComponentType`
 * (`PARTICIPANT_LINE`, or `DELAY_LINE` inside a delay, `:84`) with the
 * participant's stereotype, merged from the end-of-parse builder.
 * `ComponentRoseLine` reads `getColorLine()` and `getStroke()`
 * (`ComponentRoseLine.java:66-67`), `ComponentRoseDelayLine` the same
 * (`ComponentRoseDelayLine.java:56,62`).
 */
export function mutingLinePaint(builder: StyleBuilder, participant: Participant, delay: boolean): SequencePaint {
  const type = delay ? 'DELAY_LINE' : 'PARTICIPANT_LINE';
  return paintOf(componentStyle(builder, type, Stereotype.build(participant.stereotype)), HColorSet.instance());
}

/** Where the body's lifelines run: from the head row to `end`, past the
 *  laid-out events. */
export interface LifelineBody {
  readonly headHeight: number;
  readonly end: number;
  readonly events: readonly EventGeo[];
}

/**
 * `LivingSpace#aliveChanges` (`:83-85`) for every participant, in tile order:
 * each create message's tile top maps to true (`CommunicationTile.java:
 * 188-190` -> `goCreate`, `LivingSpace.java:256-259`), each destroy's tile y
 * to false (`LifeEventTile.java:65-72` -> `goDestroy`, `:265-267`). A later
 * write to the same y wins, as in the `TreeMap`: a participant destroyed and
 * re-created at one y stays alive (jar: `kafupo-63`'s three create/destroy
 * rounds draw ONE line).
 */
function aliveChangesOf(events: readonly EventGeo[]): Map<string, Map<number, boolean>> {
  const byId = new Map<string, Map<number, boolean>>();
  const put = (id: string, y: number, alive: boolean): void => {
    byId.set(id, (byId.get(id) ?? new Map<number, boolean>()).set(y, alive));
  };
  for (const e of events) {
    if (e.kind === 'message' && e.createdHead !== undefined) put(e.createdHead.participant.id, e.createdHead.y, true);
    else if (e.kind === 'destroy') put(e.participantId, e.y, false);
  }
  return byId;
}

/**
 * `LivingSpace#drawLineAndLiveboxes` (`:151-166`): the spans a participant
 * is alive over, walking its sorted `aliveChanges`. A created participant
 * starts dead (`alive = create == false`); the line runs from 0 (this port's
 * `headHeight`) or from a create to the next destroy, and on to the body's
 * end while alive.
 */
function aliveSpans(created: boolean, changes: ReadonlyMap<number, boolean>, body: LifelineBody): Span[] {
  const spans: Span[] = [];
  let alive = !created;
  let since = body.headHeight;
  for (const [y, isCreate] of [...changes].sort((a, b) => a[0] - b[0])) {
    if (!alive && isCreate) since = y;
    else if (alive && !isCreate) spans.push({ y1: since, y2: y });
    alive = isCreate;
  }
  if (alive) spans.push({ y1: since, y2: body.end });
  return spans;
}

/**
 * Every participant's lifeline pieces, painted: each alive span
 * ({@link aliveSpans}) handed to `MutingLine#drawLine`, which cuts it at
 * every delay wholly inside it (`LivingSpaces#delayOn` registers each delay
 * on all of them).
 */
export function lifelinesOf(
  ast: SequenceDiagramAST,
  participants: readonly ParticipantGeo[],
  body: LifelineBody,
): Record<string, LifelineSegment[]> {
  const builder = endOfParseStyleBuilder(ast);
  const byId = new Map(ast.participants.map((p) => [p.id, p]));
  const delays = delaySpansOf(body.events);
  const changes = aliveChangesOf(body.events);
  const linesOf = (p: ParticipantGeo): LifelineSegment[] => {
    // Every participant geo is laid out from an AST participant.
    const participant = byId.get(p.id)!;
    const spans = aliveSpans(p.createY !== undefined, changes.get(p.id) ?? new Map(), body);
    return spans.flatMap(({ y1, y2 }) =>
      lifelineSegments(y1, y2, delays).map((piece) => ({
        ...piece,
        paint: mutingLinePaint(builder, participant, piece.delay),
      })),
    );
  };
  return Object.fromEntries(participants.map((p) => [p.id, linesOf(p)]));
}
