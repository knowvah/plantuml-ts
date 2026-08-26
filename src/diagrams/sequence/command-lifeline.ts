/**
 * The life-line block: `CommandActivate` (`SequenceDiagramFactory.java:103`)
 * and `CommandDeactivateShort` (`:104`), registered as their own group
 * immediately after `addCommonCommands1`/`CommandHideUnlinked` and before the
 * participant declarations.
 *
 * All three rules below port ONE upstream command: `CommandActivate`'s TYPE
 * group is the alternation `(activate|deactivate|destroy|create)`
 * (`sequencediagram/command/CommandActivate.java:63`), so `activate X`,
 * `deactivate X` and `destroy X` are one regex upstream and three rules here.
 * `CommandDeactivateShort` (the participant-less `deactivate`, which closes
 * whichever life line the latest activating message opened,
 * `CommandDeactivateShort.java:57-61,73-83`) has no counterpart here yet.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:103-104
 */

import type { ActivationEvent } from './ast.js';
import { emit, type Command } from './sequence-parse-helpers.js';

// 5. activate. T13 (mission dispatch-by-parse-attempt): the participant
//    token accepts a quoted, space-carrying name (`activate "actor 1"
//    #Olive`), and a SECOND trailing `#color` is matched and discarded --
//    `CommandActivate`'s regex (`command/CommandActivate.java`, not read
//    in full for this pass) is not the two-color source; the corpus
//    fixture pairs it with a `activate X #C1 #C2` line whose second color
//    this port's single-color `ActivationEvent.color` has no field for.
export const activateCommand: Command = {
  pattern: /^activate\s+("[^"]+"|\S+)(?:\s+(#\w+))?(?:\s+#\w+)*\s*$/i,
  execute(state, match) {
    const participantId = match[1]!.replace(/^"(.*)"$/, '$1');
    const color = match[2];
    const ev: ActivationEvent = {
      kind: 'activate',
      participantId,
      ...(color !== undefined ? { color } : {}),
    };
    emit(state, ev);
  },
};

// 6. deactivate
export const deactivateCommand: Command = {
  pattern: /^deactivate\s+(\S+)\s*$/i,
  execute(state, match) {
    const ev: ActivationEvent = {
      kind: 'deactivate',
      participantId: match[1]!,
    };
    emit(state, ev);
  },
};

// 7. destroy → treated as deactivate
export const destroyCommand: Command = {
  pattern: /^destroy\s+(\S+)\s*$/i,
  execute(state, match) {
    const ev: ActivationEvent = {
      kind: 'deactivate',
      participantId: match[1]!,
    };
    emit(state, ev);
  },
};

