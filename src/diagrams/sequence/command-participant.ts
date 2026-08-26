/**
 * The participant-declaration family: `CommandParticipantA` (`:106`),
 * `CommandParticipantA2` (`:107`), `CommandParticipantA3` (`:108`),
 * `CommandParticipantA4` (`:109`) and `CommandParticipantMultilines`
 * (`:110`) — four single-line arities of the same `CommandParticipant`
 * base plus its multi-line form, all registered consecutively.
 *
 * `create` belongs to this family rather than to a `create` command of its
 * own: it is one alternative of `CommandParticipant#getRegexType`'s TYPE
 * group and the whole of its CREATE group
 * (`sequencediagram/command/CommandParticipant.java:80-86`).
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:106-110
 */

import type { ParticipantType } from './ast.js';
import {
  ensureParticipant,
  parseParticipantDeclaration,
  type Command,
} from './sequence-parse-helpers.js';

// 4. Participant declarations with optional quoted name, alias, and color.
//    Handles forms like:
//      participant Alice
//      participant "Alice Smith" as A
//      participant Alice #pink
//      participant "Alice Smith" as A #pink
export const participantCommand: Command = {
  pattern:
    /^(participant|actor|boundary|control|entity|database|collections|queue)\s+(.+)$/i,
  execute(state, match) {
    const type = match[1]!.toLowerCase() as ParticipantType;
    const rest = match[2]!.trim();
    const { id, display, color, stereotype } = parseParticipantDeclaration(rest);
    ensureParticipant(state, id, type, { display, color, stereotype });
  },
};

/** `create [participant|actor|...] X` — `CommandParticipant`'s CREATE
 *  branch: declares the participant (defaulting to type `participant`) and
 *  triggers a CREATE life event on it (`LifeEventType.CREATE`,
 *  `CommandParticipant.java:194-199`). This port's layout always renders a
 *  participant's header box at the top row regardless of first use, so the
 *  CREATE life event's deferred-appearance visual (the box appearing only
 *  at the create line, `LifeEventType.CREATE`'s handling in
 *  `ComponentRoseParticipant`) is not reproduced — a documented
 *  simplification: `create` behaves as sugar for a plain participant
 *  declaration here, same scope cut as `autoactivate`'s write-only flag.
 *  @see sequencediagram/command/CommandParticipant.java:80-86,142-201 */
export const createCommand: Command = {
  pattern:
    /^create\s+(?:(participant|actor|boundary|control|entity|queue|database|collections)\s+)?(.+)$/i,
  execute(state, match) {
    const type = (match[1]?.toLowerCase() ?? 'participant') as ParticipantType;
    const { id, display, color, stereotype } = parseParticipantDeclaration(match[2]!.trim());
    ensureParticipant(state, id, type, { display, color, stereotype });
  },
};

