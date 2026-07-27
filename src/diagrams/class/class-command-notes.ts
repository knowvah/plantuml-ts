/**
 * Note-declaration commands for the class diagram dispatch table (rules
 * 6b-6e of the original class-commands.ts COMMANDS array): the attached
 * multi-line note opener, the attached single-line note, and both
 * freestanding-note forms. Split out of class-commands.ts to stay under the
 * line cap; order preserved (spread fifth in COMMANDS, right after the
 * declaration group, before the descriptive-leaf spread).
 */
import type { NotePosition } from './ast.js';
import { parseTagTokens } from './class-declaration-parser.js';
import {
  addFreestandingNote,
  addNote,
  NOTE_STEREO_CAPTURE,
  NOTE_COLOR,
  NOTE_URL,
  NOTE_TARGET,
} from './class-notes.js';
import { parseUrlBracket } from './class-url.js';
import type { Command } from './class-command-types.js';

/** A run of `$tag` tokens — upstream `Stereotag.pattern()` (the TAGS/TAGS1/
 *  TAGS2 note-command slots). Non-capturing form = acceptance only (attached
 *  notes' tags are never consulted — remove/restore delegates to the host);
 *  capturing form feeds `parseTagTokens` for freestanding notes. */
const NOTE_TAGS = '(?:\\s+\\$[^\\s{}"\'<>$]+)*';
const NOTE_TAGS_CAPTURE = '((?:\\s+\\$[^\\s{}"\'<>$]+)*)';

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const NOTE_COMMANDS: readonly Command[] = [
  // 6c. Multi-line note opener: note <pos> [of <Entity>] [<<s>>] [#c] [[u]]
  //     (… end note), OR ending in `{` (… `}`) — upstream's two SEPARATE
  //     withBracket=false/true commands merged (header identical, only the
  //     closer differs). @see CommandFactoryNoteOnEntity#createMultiLine
  //
  //     Tried BEFORE 6b: 6b ends in a MANDATORY `:`+text, and a `::member`
  //     target supplies a spare `:` for that — `note left of A::counter`
  //     would otherwise satisfy 6b by backtracking the target to `A` and
  //     reading `:counter` as bogus text. Real single-line notes always have
  //     text after `:`, so 6c's no-colon tail can't match them and they
  //     still fall through to 6b.
  {
    pattern: new RegExp(
      '^note\\s+(left|right|top|bottom)(?:\\s+of\\s+' + NOTE_TARGET + ')?' +
        NOTE_TAGS +
        NOTE_STEREO_CAPTURE +
        NOTE_TAGS +
        NOTE_COLOR +
        NOTE_URL +
        '\\s*(\\{)?\\s*$',
      'i',
    ),
    execute(state, match) {
      // G2 N70: NOTE_URL is now capturing (group 5) -- the brace-closer
      // shifted from match[5] to match[6]. See NOTE_URL's own doc comment.
      const url = match[5] !== undefined ? parseUrlBracket(match[5]) : undefined;
      state.pendingNote = {
        kind: 'attached',
        position: match[1]!.toLowerCase() as NotePosition,
        target: match[2] ?? state.lastEntity ?? undefined,
        implicitTarget: match[2] === undefined,
        textLines: [],
        namespace: state.activeNamespace,
        // G2 N37: NOTE_STEREO_CAPTURE is now capturing (group 3) -- COLOR
        // shifted from match[3] to match[4].
        ...(match[3] !== undefined ? { stereotype: match[3] } : {}),
        ...(match[4] !== undefined ? { color: match[4] } : {}),
        ...(url !== undefined ? { url } : {}),
        ...(match[6] !== undefined ? { closer: 'brace' } : {}),
      };
    },
  },

  // 6b. Single-line note: note <pos> [of <Entity>] [<<s>>][#c][[u]] : text
  //     `of <Entity>` absent -> attaches to the last created entity. Tried
  //     after 6c — see that entry's comment for why.
  // @see ~/git/plantuml/.../CommandFactoryNoteOnEntity.java:92-116 (regex),
  //      :293-301 (idShort==null -> getLastEntity(); null -> no-op here)
  {
    pattern: new RegExp(
      '^note\\s+(left|right|top|bottom)(?:\\s+of\\s+' + NOTE_TARGET + ')?' +
        NOTE_TAGS +
        NOTE_STEREO_CAPTURE +
        NOTE_TAGS +
        NOTE_COLOR +
        NOTE_URL +
        '\\s*:\\s*(.+)$',
      'i',
    ),
    execute(state, match) {
      const target = match[2] ?? state.lastEntity ?? undefined;
      if (target === undefined) return; // "Nothing to note to" — silent no-op
      // G2 N37: NOTE_STEREO_CAPTURE is now capturing (group 3) -- COLOR
      // shifted from match[3] to match[4].
      // G2 N70: NOTE_URL is now capturing (group 5) -- the text group shifted
      // from match[5] to match[6]. See NOTE_URL's own doc comment.
      const url = match[5] !== undefined ? parseUrlBracket(match[5]) : undefined;
      const id = addNote(
        state.ast,
        match[1]!.toLowerCase() as NotePosition,
        target,
        match[6]!.trim(),
        {
          namespace: state.activeNamespace,
          implicitTarget: match[2] === undefined,
          ...(match[3] !== undefined ? { stereotype: match[3] } : {}),
          ...(match[4] !== undefined ? { color: match[4] } : {}),
          ...(url !== undefined ? { url } : {}),
        },
        state.creationCounter,
        state.tipGroupsSeen,
      );
      state.lastEntity = id;
    },
  },

  // 6d. Multi-line freestanding note opener: note as <alias> [$tags]
  //     [<<stereo>>] [#color]  (… end note). Unattached; referenced later by
  //     a relationship (`N4 .> Drawable`). No URL group upstream —
  //     CommandFactoryNote.java's multiLine regex has none. TAGS captured and
  //     attached on finalize via ParseState.pendingNoteTags (PendingNote
  //     itself lives in class-notes.ts and carries no tags field).
  {
    pattern: new RegExp(
      '^note\\s+as\\s+(\\w+|"[^"]+")' + NOTE_TAGS_CAPTURE + NOTE_STEREO_CAPTURE + NOTE_COLOR + '\\s*$',
      'i',
    ),
    execute(state, match) {
      state.pendingNote = {
        kind: 'freestanding',
        alias: match[1]!,
        textLines: [],
        namespace: state.activeNamespace,
        // G2 N37: NOTE_STEREO_CAPTURE is now capturing, group 3 (after
        // alias/tags) -- COLOR shifted from match[3] to match[4].
        ...(match[3] !== undefined ? { stereotype: match[3] } : {}),
        ...(match[4] !== undefined ? { color: match[4] } : {}),
      };
      state.pendingNoteTags = parseTagTokens(match[2] ?? '');
    },
  },

  // 6e. Single-line freestanding note: note "text" as <alias> [$tags]
  //     [<<stereo>>] [#color]. A distinct upstream command from 6b-6d
  //     (CommandFactoryNote's `singleLine`, not CommandFactoryNoteOnEntity) —
  //     creates the note leaf immediately; there is no `end note` to wait for.
  //     TAGS sit right after CODE (before STEREO) in the upstream grammar.
  // @see ~/git/plantuml/.../CommandFactoryNote.java:91-107 (regex), :189-212
  //      (executeInternal), :210 (addTags)
  {
    pattern: new RegExp(
      '^note\\s+"([^"]+)"\\s+as\\s+(\\w+|"[^"]+")' +
        NOTE_TAGS_CAPTURE +
        NOTE_STEREO_CAPTURE +
        NOTE_COLOR +
        '\\s*$',
      'i',
    ),
    execute(state, match) {
      // G2 N37: NOTE_STEREO_CAPTURE is now capturing, group 4 (after
      // text/alias/tags) -- COLOR shifted from match[4] to match[5].
      const id = addFreestandingNote(
        state.ast,
        match[2]!,
        match[1]!.trim(),
        state.activeNamespace,
        match[5],
        state.creationCounter,
        match[4],
      );
      const tags = parseTagTokens(match[3] ?? '');
      if (tags.length > 0) {
        const note = state.ast.notes.find((n) => n.id === id);
        if (note !== undefined) note.tags = tags;
      }
      state.lastEntity = id;
    },
  },
];
