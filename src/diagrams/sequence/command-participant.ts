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
  type ParseState,
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

// ---------------------------------------------------------------------------
// 5. `participant CODE [ ... ]` — CommandParticipantMultilines (:110)
// ---------------------------------------------------------------------------

/**
 * The OPENING line only. Upstream's TYPE group is the literal `(participant)`
 * — unlike the single-line family above, `actor`/`boundary`/etc. do NOT get
 * a multi-line block form (`CommandParticipantMultilines.java:76`). The head
 * between `participant` and the trailing `[` is CODE plus upstream's shared
 * STEREO/ORDER/URL/COLOR tail (`:78-87`), reused here via
 * {@link parseParticipantDeclaration} — same tail-stripping this port's
 * single-line family already applies (order discarded, matching that
 * existing precedent; URL discarded, ditto).
 */
const PARTICIPANT_MULTILINE_OPEN_RE = /^participant\s+(.+?)\s*\[$/i;

/**
 * The CLOSING line — `Pattern2.cmpile("^([^\\[\\]]*)\\]$")`
 * (`CommandParticipantMultilines.java:68`). Any leading text on the same
 * line as the closing `]` is discarded by upstream's own `subExtract(1, 1)`
 * (`:142`), which drops the whole first and last raw lines regardless of
 * what either contains — not a divergence introduced here.
 */
const PARTICIPANT_MULTILINE_CLOSE_RE = /^[^[\]]*\]$/;

/**
 * `CommandParticipantMultilines#executeNow` (`:131-171`): the block's body
 * lines (between the opening and closing `[`/`]`) become the participant's
 * `Display` (`lines.subExtract(1, 1).removeEmptyColumns().toDisplay()`,
 * `:142-144`). Sequence creole is NOT ported (`creole-exposant-port`
 * covered description/class/state only); this stores the raw body lines
 * joined with `\n` rather than building a creole pipeline, per this task's
 * boundary. `jozomu-87-tajo507`'s body (`=MyTitle` / `----` /
 * `""MySubTitle""`) therefore renders as three literal lines of text, not a
 * rendered heading/rule/monospace run — a measured residual, not a silent
 * gap: filed for D6's census rather than fixed here.
 *
 * If `code` already names an existing participant, upstream moves it to the
 * last position (`putParticipantInLast`, `:138-140`); this port's
 * `ensureParticipant` has no such reordering (a pre-existing gap the plain
 * single-line family above already carries, per `parser.test.ts:322`'s
 * note), so a repeat declaration is silently a no-op here too — inherited,
 * not introduced.
 *
 * **Not yet wired into the dispatch loop.** `parser.ts`'s `runDispatchLoop`
 * has no call site for this matcher: multi-line commands in this port are
 * intercepted BEFORE the regular one-line-at-a-time `Command` table, the
 * same way `handlePendingNote`/`handlePendingRef`/`dispatchAnnotationOrSprite`
 * are (see `parser.ts`), and `parser.ts` is T11's write-set this batch, not
 * T10's. Reported in the T10 mission return rather than shipped: the
 * required call, inserted in `runDispatchLoop` immediately before
 * `dispatchCommand(state, line)` (mirroring upstream's `:110` registration,
 * before `CommandArrow` at `:111`), is
 * ```ts
 * const participantMultiConsumed = matchParticipantMultilineCommand(state, trimmedLines, i);
 * if (participantMultiConsumed !== null) { i += participantMultiConsumed - 1; continue; }
 * ```
 * Without this hook, `jozomu-87-tajo507` and `lafuzo-13-xura634`'s opening
 * `participant NAME [` line is instead matched by the plain
 * {@link participantCommand} above (whose `(.+)` capture is greedy enough to
 * swallow the trailing `[` into the participant id), so both fixtures still
 * refuse on their body's first line — unchanged from their pinned reason.
 *
 * @see sequencediagram/command/CommandParticipantMultilines.java:66-171
 */
export function matchParticipantMultilineCommand(
  state: ParseState,
  trimmedLines: readonly string[],
  i: number,
): number | null {
  const open = PARTICIPANT_MULTILINE_OPEN_RE.exec(trimmedLines[i] ?? '');
  if (open === null) return null;

  let closeIndex = -1;
  for (let j = i + 1; j < trimmedLines.length; j++) {
    if (PARTICIPANT_MULTILINE_CLOSE_RE.test(trimmedLines[j]!)) {
      closeIndex = j;
      break;
    }
  }
  if (closeIndex === -1) return null;

  const { id, color, stereotype } = parseParticipantDeclaration(open[1]!.trim());
  const bodyLines = trimmedLines.slice(i + 1, closeIndex);
  const display = bodyLines.length > 0 ? bodyLines.join('\n') : id;

  ensureParticipant(state, id, 'participant', { display, color, stereotype });

  return closeIndex - i + 1;
}

