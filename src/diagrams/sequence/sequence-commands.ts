/**
 * Command dispatch table for the sequence diagram parser.
 *
 * Order matters: patterns are tested top-to-bottom; first match wins. More
 * specific patterns must precede general ones. Split out of `parser.ts`
 * (the mutable `ParseState` and its mutation helpers live in
 * `sequence-parse-helpers.ts`) purely to stay under the project's 500-line
 * file cap; this file owns only the `COMMANDS` table and its per-command
 * `execute` bodies.
 */

import type {
  ActivationEvent,
  BoxGroup,
  DelayEvent,
  DividerEvent,
  FrameEvent,
  MessageEvent,
  NoteEvent,
  ParticipantType,
  SpaceEvent,
} from './ast.js';
import {
  ARROW_STYLE_MAP,
  applyAutonumber,
  emit,
  ensureParticipant,
  parseDottedStart,
  parseParticipantDeclaration,
  type Command,
} from './sequence-parse-helpers.js';

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 * More specific patterns must precede general ones.
 */
export const COMMANDS: readonly Command[] = [
  // 1. skinparam sequenceMessageAlign
  {
    pattern: /^skinparam\s+sequenceMessageAlign\s+(left|center|right)\s*$/i,
    execute(state, match) {
      const align = match[1]?.toLowerCase() as 'left' | 'center' | 'right';
      state.ast.options.messageAlign = align;
    },
  },

  // 2. hide footbox
  {
    pattern: /^hide\s+footbox\s*$/i,
    execute(state) {
      state.ast.options.hideFootbox = true;
    },
  },

  // 3a. box — opens a named/colored participant group. T13 (mission
  //     dispatch-by-parse-attempt): widened to accept an unquoted label
  //     (`box BoxOfAlice #yellow/blue`) and a trailing `<<stereotype>>`
  //     (`box "Tier 1" <<Client>>`) between the label and color, matching
  //     `CommandBoxStart`'s NAME1/NAME2/STEREOTYPE/color order. The
  //     stereotype is matched and discarded -- `BoxGroup` has no field for
  //     it and nothing in this port's renderer draws a box's stereotype.
  // @see sequencediagram/command/CommandBoxStart.java:65-77
  {
    pattern: /^box(?:\s+"([^"]*)"|\s+([^#<\s][^#<]*?))?(?:\s*<<[^>]*>>)?(?:\s+(#\S+))?\s*$/i,
    execute(state, match) {
      const label = (match[1] ?? match[2] ?? '').trim();
      const color = match[3] ?? '';
      const id = `box-${++state.boxCounter}`;
      const box: BoxGroup = { id, label, color, participantIds: [] };
      state.ast.boxes.push(box);
      state.currentBox = box;
    },
  },

  // 3b. end box — closes the current participant group. `\s*` (not `\s+`)
  //     between "end" and "box" mirrors `CommandBoxEnd`'s
  //     `RegexLeaf.spaceZeroOrMore()`, so the unspaced `endbox` form matches
  //     too (T13, mission dispatch-by-parse-attempt).
  // @see sequencediagram/command/CommandBoxEnd.java:56-59
  {
    pattern: /^end\s*box\s*$/i,
    execute(state) {
      state.currentBox = null;
    },
  },

  // 3. autonumber. T13: widened for `autonumber START STEP "FORMAT"`, where
  //    START may be a dotted number (`1.1`, `1-1:1`) and FORMAT a quoted
  //    DecimalFormat pattern -- see `parseDottedStart`/`formatAutonumber`.
  // @see sequencediagram/command/CommandAutonumber.java:58-74
  {
    pattern: /^autonumber(?:\s+([\d][^\s"]*))?(?:\s+(\d+))?(?:\s+"([^"]+)")?\s*$/i,
    execute(state, match) {
      const { prefix, value } = parseDottedStart(match[1] ?? '1');
      const step = match[2] !== undefined ? parseInt(match[2], 10) : 1;
      state.ast.autonumber = {
        enabled: true,
        start: value,
        current: value,
        step,
        prefix,
        ...(match[3] !== undefined ? { format: match[3] } : {}),
      };
    },
  },

  // 4. Participant declarations with optional quoted name, alias, and color.
  //    Handles forms like:
  //      participant Alice
  //      participant "Alice Smith" as A
  //      participant Alice #pink
  //      participant "Alice Smith" as A #pink
  {
    pattern:
      /^(participant|actor|boundary|control|entity|database|collections|queue)\s+(.+)$/i,
    execute(state, match) {
      const type = match[1]!.toLowerCase() as ParticipantType;
      const rest = match[2]!.trim();
      const { id, display, color } = parseParticipantDeclaration(rest);
      ensureParticipant(state, id, type, display, color);
    },
  },

  // 5. activate. T13 (mission dispatch-by-parse-attempt): the participant
  //    token accepts a quoted, space-carrying name (`activate "actor 1"
  //    #Olive`), and a SECOND trailing `#color` is matched and discarded --
  //    `CommandActivate`'s regex (`command/CommandActivate.java`, not read
  //    in full for this pass) is not the two-color source; the corpus
  //    fixture pairs it with a `activate X #C1 #C2` line whose second color
  //    this port's single-color `ActivationEvent.color` has no field for.
  {
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
  },

  // 6. deactivate
  {
    pattern: /^deactivate\s+(\S+)\s*$/i,
    execute(state, match) {
      const ev: ActivationEvent = {
        kind: 'deactivate',
        participantId: match[1]!,
      };
      emit(state, ev);
    },
  },

  // 7. destroy → treated as deactivate
  {
    pattern: /^destroy\s+(\S+)\s*$/i,
    execute(state, match) {
      const ev: ActivationEvent = {
        kind: 'deactivate',
        participantId: match[1]!,
      };
      emit(state, ev);
    },
  },

  // 8. note left of / right of / over
  //
  //    Single-line form (inline text after colon):
  //      note left of Alice: some text
  //      note over Alice, Bob: some text
  //      note over Bob #yellow: colored note
  //
  //    Multi-line form (no colon on the header line):
  //      note left of Alice [#color]
  //      ...lines...
  //      end note
  //
  //    Groups:
  //      1 — position keyword (left of | right of | over)
  //      2 — participant list (stops before : or #)
  //      3 — optional color (#word)
  //      4 — optional inline text (everything after ": ")
  {
    pattern:
      /^note\s+(left of|right of|over)\s+([^:#\n]+?)(?:\s+(#\w+))?(?:\s*:\s*(.+))?\s*$/i,
    execute(state, match) {
      const rawPos = match[1]!.toLowerCase();
      const position: NoteEvent['position'] =
        rawPos === 'left of'
          ? 'left'
          : rawPos === 'right of'
            ? 'right'
            : 'over';
      const rawParticipants = match[2]!;
      const color = match[3];
      const inlineText = match[4];

      const participants = rawParticipants
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (inlineText !== undefined) {
        // Single-line form: replace literal \n escape sequences with real newlines,
        // then emit the note immediately.
        const text = inlineText.replace(/\\n/g, '\n');
        const ev: NoteEvent = {
          kind: 'note',
          position,
          participants,
          text,
          ...(color !== undefined ? { color } : {}),
        };
        emit(state, ev);
      } else {
        // Multi-line form: open a pending note; subsequent lines accumulate until
        // "end note".
        state.pendingNote = {
          kind: 'note',
          position,
          participants,
          text: '',
          ...(color !== undefined ? { color } : {}),
        };
      }
    },
  },

  // 9. end note — closes a multi-line note. T13: also accepts the
  //    style-qualified closers `end hnote`/`end rnote` and the unspaced
  //    `endnote`/`endhnote`/`endrnote` forms, mirroring
  //    `Pattern2.cmpile("^end[%s]?(note|hnote|rnote)$")`.
  // @see command/note/sequence/FactorySequenceNoteCommand.java:117
  {
    pattern: /^end\s*(?:note|hnote|rnote)\s*$/i,
    execute(state) {
      if (state.pendingNote !== null) {
        emit(state, state.pendingNote);
        state.pendingNote = null;
      }
    },
  },

  // 10. Frame types (loop, alt, opt, par, par2, break, critical, group).
  //     T13: added `par2` (`GroupingType.getType`, a same-visual-class START
  //     alongside `par`) and an optional COLORS pair mirroring
  //     `CommandGrouping`'s `#header[ #body]` -- captured so the label group
  //     doesn't absorb them, but not modelled on `FrameGeo` (no colored-frame
  //     rendering in this engine yet), same documented scope cut as `ref`'s
  //     `REF` color group below.
  // @see sequencediagram/command/CommandGrouping.java:64-73
  {
    pattern:
      /^(loop|alt|opt|par2|par|break|critical|group)(#\w+)?(?:\s+(#\w+))?(?:\s+(.+))?\s*$/i,
    execute(state, match) {
      const frameType = match[1]!.toLowerCase() as FrameEvent['frameType'];
      const label = match[4]?.trim() ?? '';
      const frame: FrameEvent = {
        kind: 'frame',
        frameType,
        label,
        branches: [[]],
        branchLabels: [label],
      };
      state.frameStack.push(frame);
    },
  },

  // 11. else — adds a new branch to the current alt/par frame. T13: `also`
  //     is `else`'s documented alias (`GroupingType.getType`'s ELSE case
  //     covers both).
  // The condition was captured but DISCARDED before SI-alt: `execute(state)`
  // ignored `match`, so `else other case` lost "other case" at parse time and
  // no downstream stage could draw it.
  // @see sequencediagram/GroupingType.java:52-53
  {
    pattern: /^(?:else|also)(?:\s+(.+))?\s*$/i,
    execute(state, match) {
      const top = state.frameStack[state.frameStack.length - 1];
      if (top !== undefined) {
        top.branches.push([]);
        top.branchLabels.push(match[1]?.trim() ?? '');
      }
    },
  },

  // 12. end — closes the current frame. T13: widened from bare `end` to
  //     accept a trailing keyword/comment (`end opt`, `end group`, `end
  //     par2`, …) -- `CommandGrouping`'s single TYPE token covers `end`
  //     exactly like every open keyword, with everything after it captured
  //     as an optional COMMENT that upstream's own `executeArg` never reads
  //     for the END case (`GroupingType.END` takes no branch that consults
  //     `comment`). Trailing text is matched and discarded here for the same
  //     reason.
  // @see sequencediagram/command/CommandGrouping.java:64-73,129-159
  {
    pattern: /^end(?:\s+.+)?\s*$/i,
    execute(state) {
      const frame = state.frameStack.pop();
      if (frame !== undefined) {
        emit(state, frame);
      }
    },
  },

  // 13. Divider: == text ==
  {
    pattern: /^==\s*(.+?)\s*==\s*$/,
    execute(state, match) {
      const ev: DividerEvent = {
        kind: 'divider',
        text: match[1]!,
      };
      emit(state, ev);
    },
  },

  // 14a. Delay with text: ...text...
  {
    pattern: /^\.\.\.\s*(.+?)\s*\.\.\.\s*$/,
    execute(state, match) {
      const ev: DelayEvent = {
        kind: 'delay',
        text: match[1]!,
      };
      emit(state, ev);
    },
  },

  // 14b. Bare delay: ...
  {
    pattern: /^\.\.\.\s*$/,
    execute(state) {
      const ev: DelayEvent = { kind: 'delay' };
      emit(state, ev);
    },
  },

  // 15. Space: |||  or  ||N|
  {
    pattern: /^\|\|(\d+)?\|\s*$/,
    execute(state, match) {
      const pixels = match[1] !== undefined ? parseInt(match[1], 10) : 5;
      const ev: SpaceEvent = { kind: 'space', pixels };
      emit(state, ev);
    },
  },

  // 16. return — sends a reply back to the most recent message sender
  {
    pattern: /^return(?:\s+(.+))?\s*$/i,
    execute(state, match) {
      const label = match[1]?.trim() ?? '';
      const from = state.lastMessageTo ?? '';
      const to = state.lastMessageFrom ?? '';
      ensureParticipant(state, from);
      ensureParticipant(state, to);
      let msg: MessageEvent = {
        kind: 'message',
        from,
        to,
        label,
        style: 'reply',
      };
      msg = applyAutonumber(state, msg);
      emit(state, msg);
    },
  },

  // 17. Arrow messages — must come after frame keywords to avoid conflicts.
  //     Supports: ->, -->, ->>, -->>, ->?, ?->
  //     Optionally: ++/--/**/!!/--++/++-- (activation spec) after target
  //     Optionally: : label
  //     T13 (mission dispatch-by-parse-attempt): the two separate `++`/`--`
  //     optional groups widened to one combined ACTIVATION group accepting
  //     `**`/`!!`/the two 4-char combos too, mirroring
  //     `CommandArrow.java:126` (`(\+\+|\*\*|!!|--|--\+\+|\+\+--)?`) --
  //     `**`/`!!` (create/destroy life events) still only ACTIVATE/
  //     DEACTIVATE here, since this port's `ActivationEvent.kind` has no
  //     CREATE/DESTROY variant (`manageActivations`, `:446-467`).
  {
    // T13: `(?:&\s*)?` accepts the leading PARALLEL marker (`& A -> B`,
    // `CommandArrow.java:90`), discarded (see `sequence-commands-2.ts`'s
    // `decoratedArrowCommand`, the sibling rule that also drops it).
    // Quoted endpoints (`"Application thread" -> "DB connection"`) are
    // unquoted at use.
    //
    // The unquoted endpoint is upstream's own participant code,
    // `PART1CODE`/`PART2CODE` = `([%pLN_.@]+)` (`CommandArrow.java:93,96`):
    // Unicode letters and digits, `_`, `.`, `@`. NOT `\S+`, which let the
    // token absorb a leading dash of the arrow itself -- greedy backtracking
    // made `C-->B` parse as `C-` `->` `B`, inventing a participant named
    // `C-`. Jar-verified: `B->C` / `C-->B` declares exactly B and C.
    // Anything outside that class has to be quoted upstream too.
    pattern:
      /^(?:&\s*)?("[^"]+"|[\p{L}\p{N}_.@]+)\s*(->|-->>|->>|-->|->\?|\?->)\s*("[^"]+"|[\p{L}\p{N}_.@]+?)(\s*(?:\+\+|--\+\+|\+\+--|--|\*\*|!!))?\s*(?::\s*(.*))?$/u,
    execute(state, match) {
      const from = match[1]!.replace(/^"(.*)"$/, '$1');
      const arrowToken = match[2]!;
      const to = match[3]!.replace(/^"(.*)"$/, '$1');
      const activation = match[4]?.trim() ?? '';
      const activatesFlag =
        activation === '++' || activation === '**' || activation === '--++' || activation === '++--';
      const deactivatesFlag =
        activation === '--' || activation === '!!' || activation === '--++' || activation === '++--';
      const label = match[5]?.trim() ?? '';

      const style = ARROW_STYLE_MAP[arrowToken] ?? 'sync';

      ensureParticipant(state, from);
      ensureParticipant(state, to);

      let msg: MessageEvent = {
        kind: 'message',
        from,
        to,
        label,
        style,
        ...(activatesFlag ? { activates: to } : {}),
        ...(deactivatesFlag ? { deactivates: to } : {}),
      };
      msg = applyAutonumber(state, msg);

      state.lastMessageFrom = from;
      state.lastMessageTo = to;

      emit(state, msg);
    },
  },
];
