/**
 * `CommandReturn` (`SequenceDiagramFactory.java:129`) -- split out of
 * `command-arrow.ts` to keep that file under its size cap; see that file's
 * header for why it is filed beside the arrow rules.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandReturn.java
 */

import type { MessageEvent, MessageExoEvent, MessageExoType } from './ast.js';
import { activate, addMessage, getActivatingMessage } from './sequence-life-state.js';
import { applyAutonumber, emit, type Command, type ParseState } from './sequence-parse-helpers.js';

// 16. return -- `CommandReturn`. The reply runs along the latest ACTIVATING
//     message (`getActivatingMessage()`), reversed and dotted, and then
//     deactivates that message's PART2; with nothing activating it reverses
//     the last `Message` without deactivating, and with no such message it is
//     an error. The `#color` group is matched and, like every arrow colour in
//     this port, not carried.
// @see sequencediagram/command/CommandReturn.java:66-76,103-160
export const returnCommand: Command = {
  pattern: /^(&\s*)?return\s*(?:(#\w+)\s+)?(.*)$/i,
  execute(state, match) {
    const activating = getActivatingMessage(state.life);
    const last = state.life.lastEventWithDeactivate;
    const message1 = activating ?? (typeof last === 'object' && last?.kind === 'message' ? last : undefined);
    if (message1 === undefined) {
      state.executionError = 'Nowhere to return to.';
      return;
    }
    const message2 = numbered(state, replyTo(message1, match[3] ?? '', match[1] !== undefined));
    emit(state, message2);
    const error = addMessage(state.life, message2) ?? deactivateAfterReturn(state, message1, activating);
    if (error !== undefined) state.executionError = error;
  },
};

/** `message2` (`CommandReturn.java:120-137`): the activating message's own
 *  arrow, `withBody(DOTTED)`, run the other way. */
function replyTo(message1: MessageEvent | MessageExoEvent, label: string, parallel: boolean): ReturnReply {
  const arrow = { ...message1.arrow, dashed: true };
  if (message1.kind === 'messageExo') {
    const exoType = REVERSE_EXO[message1.exoType];
    return { kind: 'messageExo', participant: message1.participant, exoType, shortArrow: false, label, arrow };
  }
  return {
    kind: 'message',
    from: message1.to,
    to: message1.from,
    label,
    arrow,
    ...(parallel ? { parallel: true } : {}),
  };
}

type ReturnReply = MessageEvent | MessageExoEvent;

/** `diagram.getNextMessageNumber()` for the reply (`:127,131`). An exo reply
 *  draws its number through a plain-message probe, as `command-exo-arrow.ts`
 *  does. */
function numbered(state: ParseState, reply: ReturnReply): ReturnReply {
  if (reply.kind === 'message') return applyAutonumber(state, reply);
  const probe = applyAutonumber(state, { kind: 'message', from: '', to: '', label: '', arrow: reply.arrow });
  return {
    ...reply,
    ...(probe.sequenceNumber !== undefined ? { sequenceNumber: probe.sequenceNumber } : {}),
    ...(probe.sequenceLabel !== undefined ? { sequenceLabel: probe.sequenceLabel } : {}),
  };
}

/** `MessageExoType#reverse` (`MessageExoType.java:63-75`). */
const REVERSE_EXO: Readonly<Record<MessageExoType, MessageExoType>> = {
  FROM_LEFT: 'TO_LEFT',
  TO_RIGHT: 'FROM_RIGHT',
  FROM_RIGHT: 'TO_RIGHT',
  TO_LEFT: 'FROM_LEFT',
};

/** `if (doDeactivation) diagram.activate(message1.getParticipant2(),
 *  DEACTIVATE)` (`:142-147`) -- attached to the reply, which is now the last
 *  event and deals with that participant. */
function deactivateAfterReturn(
  state: ParseState,
  message1: MessageEvent | MessageExoEvent,
  activating: MessageEvent | MessageExoEvent | undefined,
): string | undefined {
  if (activating === undefined) return undefined;
  const p2 = message1.kind === 'message' ? message1.to : message1.participant;
  const error = activate(state.life, p2, 'DEACTIVATE');
  if (error === undefined) emit(state, { kind: 'deactivate', participantId: p2 });
  return error;
}
