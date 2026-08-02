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

  // 3a. box — opens a named/colored participant group
  {
    pattern: /^box(?:\s+"([^"]*)")?(?:\s+(#\w+))?\s*$/i,
    execute(state, match) {
      const label = match[1] ?? '';
      const color = match[2] ?? '';
      const id = `box-${++state.boxCounter}`;
      const box: BoxGroup = { id, label, color, participantIds: [] };
      state.ast.boxes.push(box);
      state.currentBox = box;
    },
  },

  // 3b. end box — closes the current participant group
  {
    pattern: /^end\s+box\s*$/i,
    execute(state) {
      state.currentBox = null;
    },
  },

  // 3. autonumber
  {
    pattern: /^autonumber(?:\s+(\d+))?\s*$/i,
    execute(state, match) {
      const start = match[1] !== undefined ? parseInt(match[1], 10) : 1;
      state.ast.autonumber.enabled = true;
      state.ast.autonumber.start = start;
      state.ast.autonumber.current = start;
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

  // 5. activate
  {
    pattern: /^activate\s+(\S+)(?:\s+(#\w+))?\s*$/i,
    execute(state, match) {
      const participantId = match[1]!;
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

  // 9. end note — closes a multi-line note
  {
    pattern: /^end\s+note\s*$/i,
    execute(state) {
      if (state.pendingNote !== null) {
        emit(state, state.pendingNote);
        state.pendingNote = null;
      }
    },
  },

  // 10. Frame types (loop, alt, opt, par, break, critical, group)
  {
    pattern:
      /^(loop|alt|opt|par|break|critical|group)(?:\s+(.+))?\s*$/i,
    execute(state, match) {
      const frameType = match[1]!.toLowerCase() as FrameEvent['frameType'];
      const label = match[2]?.trim() ?? '';
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

  // 11. else — adds a new branch to the current alt/par frame.
  // The condition was captured but DISCARDED before SI-alt: `execute(state)`
  // ignored `match`, so `else other case` lost "other case" at parse time and
  // no downstream stage could draw it.
  {
    pattern: /^else(?:\s+(.+))?\s*$/i,
    execute(state, match) {
      const top = state.frameStack[state.frameStack.length - 1];
      if (top !== undefined) {
        top.branches.push([]);
        top.branchLabels.push(match[1]?.trim() ?? '');
      }
    },
  },

  // 12. end — closes the current frame
  {
    pattern: /^end\s*$/i,
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
  //     Optionally: ++ (activates) or -- (deactivates) after target
  //     Optionally: : label
  {
    pattern:
      /^(\S+)\s*(->|-->>|->>|-->|->\?|\?->)\s*(\S+?)(\s*\+\+)?(\s*--)?\s*(?::\s*(.*))?$/,
    execute(state, match) {
      const from = match[1]!;
      const arrowToken = match[2]!;
      const to = match[3]!;
      const activatesFlag = match[4] !== undefined && match[4].trim() === '++';
      const deactivatesFlag =
        match[5] !== undefined && match[5].trim() === '--';
      const label = match[6]?.trim() ?? '';

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
