/**
 * The post-parse `hide unlinked` / `hide stereotype` passes, split out of
 * `sequence-parse-helpers.ts` (which re-exports them) to keep that file under
 * the 500-line cap (sdd1 T1b). Bodies unchanged.
 */
import type { SequenceDiagramAST, SequenceEvent } from './ast.js';

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

/** `hide stereotype` (`options.hideStereotype`): drop every participant's
 *  stereotype so neither the layout nor the renderer sees one. Applied
 *  post-parse for the same reason `applyHideUnlinked` is — the directive can
 *  appear after the declarations it affects. See `hideStereotypeCommand`
 *  (`command-arrow.ts`) for the upstream registration chain. */
export function applyHideStereotype(ast: SequenceDiagramAST): void {
  if (ast.options.hideStereotype !== true) return;
  for (const p of ast.participants) delete p.stereotype;
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
