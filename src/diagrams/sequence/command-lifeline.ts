/**
 * The life-line block: `CommandActivate` (`SequenceDiagramFactory.java:103`)
 * and `CommandDeactivateShort` (`:104`), registered as their own group
 * immediately after `addCommonCommands1`/`CommandHideUnlinked` and before the
 * participant declarations.
 *
 * All four rules below port TWO upstream commands. `CommandActivate`'s TYPE
 * group is the alternation `(activate|deactivate|destroy|create)`
 * (`sequencediagram/command/CommandActivate.java:63`), so `activate X`,
 * `deactivate X` and `destroy X` are one regex upstream and three rules here;
 * its WHO group, `([%pLN_.@]+|[%g][^%g]+[%g])` (`:65`), is shared by all
 * three, which is why the quoted alternative and the `getOrCreateParticipant`
 * call (`:109`) apply uniformly below rather than only on `activate`.
 * `deactivateShortCommand` ports `CommandDeactivateShort` (`:104`), the
 * participant-less `deactivate` that closes whichever life line the latest
 * message opened (`CommandDeactivateShort.java:57-61,73-83`).
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:103-104
 */

import type { ActivationEvent } from './ast.js';
import { emit, ensureParticipant, type Command } from './sequence-parse-helpers.js';

/** `CommandActivate`'s shared WHO group -- `([%pLN_.@]+|[%g][^%g]+[%g])`
 *  (`CommandActivate.java:65`): a bare token or a quoted, space-carrying
 *  name (`activate "actor 1"`). Shared by activate/deactivate/destroy since
 *  upstream captures it once for all three TYPE values. */
const WHO = `("[^"]+"|\\S+)`;

function stripQuotes(who: string): string {
  return who.replace(/^"(.*)"$/, '$1');
}

// 5. activate. T13 (mission dispatch-by-parse-attempt) added the quoted WHO
//    alternative; T9 fixes the actual defect it was blocked on --
//    `CommandActivate.executeArg` calls `diagram.getOrCreateParticipant`
//    UNCONDITIONALLY before `diagram.activate(...)` (`:109`), so `activate
//    X` with no prior `participant X` declares X. This port previously only
//    emitted the `ActivationEvent`, leaving X undeclared -- a source whose
//    only mention of X was `activate X` rendered no lifeline for it at all.
//    A SECOND trailing `#color` is matched and discarded -- `CommandActivate`
//    only has one BACK/LINE pair and the corpus fixture pairing
//    `activate X #C1 #C2` has no second-color field on `ActivationEvent`.
// @see sequencediagram/command/CommandActivate.java:63-65,109
export const activateCommand: Command = {
  pattern: new RegExp(`^activate\\s+${WHO}(?:\\s+(#\\w+))?(?:\\s+#\\w+)*\\s*$`, 'i'),
  execute(state, match) {
    const participantId = stripQuotes(match[1]!);
    const color = match[2];
    ensureParticipant(state, participantId);
    const ev: ActivationEvent = {
      kind: 'activate',
      participantId,
      ...(color !== undefined ? { color } : {}),
    };
    emit(state, ev);
  },
};

// 6. deactivate. Same `getOrCreateParticipant` call and quoted-WHO widening
//    as `activateCommand` -- upstream shares one WHO group and one
//    unconditional declare across all three TYPE values (`:65,109`).
// @see sequencediagram/command/CommandActivate.java:63-65,109
export const deactivateCommand: Command = {
  pattern: new RegExp(`^deactivate\\s+${WHO}\\s*$`, 'i'),
  execute(state, match) {
    const participantId = stripQuotes(match[1]!);
    ensureParticipant(state, participantId);
    const ev: ActivationEvent = {
      kind: 'deactivate',
      participantId,
    };
    emit(state, ev);
  },
};

// 7. destroy → treated as deactivate. Same widening as `deactivateCommand`.
// @see sequencediagram/command/CommandActivate.java:63-65,109
export const destroyCommand: Command = {
  pattern: new RegExp(`^destroy\\s+${WHO}\\s*$`, 'i'),
  execute(state, match) {
    const participantId = stripQuotes(match[1]!);
    ensureParticipant(state, participantId);
    const ev: ActivationEvent = {
      kind: 'deactivate',
      participantId,
    };
    emit(state, ev);
  },
};

// 8. bare deactivate -- `CommandDeactivateShort` (`SequenceDiagramFactory
//    .java:104`). Upstream deactivates `getActivatingMessage()
//    .getParticipant2()`, the target of the latest message that still has
//    an open ACTIVATE life event on the `activationState` stack
//    (`SequenceDiagram.java:347-393`). This port has no `activationState`
//    / `getActivatingMessage()` (see `command-arrow.ts`'s `returnCommand`
//    note, which flags the same gap), so the best approximation available
//    within this task's write-set is `state.lastMessageTo` -- the target of
//    the MOST RECENT message, which `returnCommand` already treats as the
//    stand-in for "the message currently open for activation". A source
//    with no preceding message has nothing to deactivate (upstream returns
//    `CommandExecutionResult.error("Nothing to deactivate.")`; this
//    dispatch table's `execute` returns void, so the no-op is the closest
//    equivalent) and is left as-is rather than emitting a bogus event.
// @see sequencediagram/command/CommandDeactivateShort.java:57-61,73-83
export const deactivateShortCommand: Command = {
  pattern: /^deactivate\s*$/i,
  execute(state) {
    const participantId = state.lastMessageTo;
    if (participantId === null) return;
    const ev: ActivationEvent = {
      kind: 'deactivate',
      participantId,
    };
    emit(state, ev);
  },
};

