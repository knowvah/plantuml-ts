/**
 * The post-parse `hide unlinked` / `hide stereotype` passes, split out of
 * `sequence-parse-helpers.ts` (which re-exports them) to keep that file under
 * the 500-line cap (sdd1 T1b). Bodies unchanged.
 */
import type { Participant, ParticipantBadge, SequenceDiagramAST, SequenceEvent } from './ast.js';
import type { Paint } from '../../core/paint.js';
import { anyBadgeFor, visibleStereotypeLines, type ParticipantLayoutCtx } from './sequence-layout-participant-label.js';

// ---------------------------------------------------------------------------
// hide unlinked (CommandHideUnlinked.java, T13)
// ---------------------------------------------------------------------------

/** Every participant id referenced by an event, recursing into frame
 *  branches (an `alt` branch's messages still "link" the participant).
 *  @see sequencediagram/SequenceDiagram.java (removeHiddenParticipants) */
export function linkedParticipantIds(events: readonly SequenceEvent[]): Set<string> {
  const linked = new Set<string>();
  for (const event of events) collectLinkedIds(event, linked);
  return linked;
}

function collectLinkedIds(event: SequenceEvent, linked: Set<string>): void {
  if (event.kind === 'message') {
    linked.add(event.from);
    linked.add(event.to);
  } else if (event.kind === 'messageExo') {
    // `isAlone` asks every event `dealWith(p)`, and `MessageExo.dealWith`
    // answers `participant == someone` (`MessageExo.java:90-92`) — so an exo
    // message links its ONE endpoint and nothing else.
    // @see sequencediagram/SequenceDiagram.java:535-541
    linked.add(event.participant);
  } else if (event.kind === 'note') {
    for (const p of event.participants) linked.add(p);
  } else if (event.kind === 'activate' || event.kind === 'deactivate') {
    linked.add(event.participantId);
  } else if (event.kind === 'frame') {
    for (const branch of event.branches) for (const inner of branch) collectLinkedIds(inner, linked);
  }
}

/** `hide stereotype` (`options.hideStereotype`): hide every participant's
 *  DISPLAYED stereotype. Upstream each `Participant` holds the diagram's
 *  `hiddenPortions` and `getDisplay` skips the stereotype when it contains
 *  `STEREOTYPE` (`Participant.java:125-135`), while `getUsedStyles` still
 *  merges it (`:82-91`) -- so the stereotype is kept and only flagged.
 *  Applied post-parse for the same reason `applyHideUnlinked` is: the set is
 *  read at draw time, so the directive reaches declarations above it. See
 *  `hideStereotypeCommand` (`command-common.ts`) for the registration. */
export function applyHideStereotype(ast: SequenceDiagramAST): void {
  if (ast.options.hideStereotype !== true) return;
  for (const p of ast.participants) if (p.stereotype !== undefined) p.stereotypeHidden = true;
}

/** The stereotype rows a head draws: none once `hide stereotype` has dropped
 *  it from `Participant#getDisplay` (`Participant.java:125-135`). */
export function displayedStereotypeLines(p: Participant): readonly string[] {
  return p.stereotypeHidden === true ? [] : visibleStereotypeLines(p);
}

/** The badge `Display#createStereotype` draws from the DISPLAYED stereotype
 *  (`Display.java:671-676`): none once `hide stereotype` has dropped it. */
export function displayedBadgeOf(p: Participant, ctx: ParticipantLayoutCtx, fill: Paint): ParticipantBadge | undefined {
  return p.stereotypeHidden === true ? undefined : anyBadgeFor(p, ctx, fill);
}

/** `hide unlinked` (`options.hideUnlinked`): drop participants no event
 *  references, and prune them out of any box's `participantIds` too so a
 *  box background doesn't span a column that no longer renders.
 *  @see sequencediagram/command/CommandHideUnlinked.java */
export function applyHideUnlinked(ast: SequenceDiagramAST): void {
  if (ast.options.hideUnlinked !== true) return;
  const linked = linkedParticipantIds(ast.events);
  ast.participants = ast.participants.filter((p) => linked.has(p.id));
  for (const box of ast.boxes) {
    box.participantIds = box.participantIds.filter((id) => linked.has(id));
  }
}
