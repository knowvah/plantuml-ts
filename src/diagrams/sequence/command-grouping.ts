/**
 * The box/grouping block: `CommandBoxStart` (`:124`), `CommandBoxEnd`
 * (`:125`) and `CommandGrouping` (`:126`), registered consecutively as one
 * group between the single-line note factories and the
 * `CommandActivate2`/`CommandReturn` pair.
 *
 * `CommandGrouping` is one upstream command for every group keyword: its
 * TYPE group is `GroupingType`'s whole alternation, so the opener, `else`/
 * `also` and `end` are three rules here and one regex there
 * (`sequencediagram/command/CommandGrouping.java:64-73,129-159`).
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:124-126
 */

import type { BoxGroup, FrameEvent } from './ast.js';
import {
  emit,
  SequenceCommandRefusal,
  setLastEventWithNoteSpan,
  type Command,
  type ParseState,
} from './sequence-parse-helpers.js';
import { DRESSED_ARROW_RE, UNDRESSED_ARROW_RE } from './sequence-arrow-compose.js';
import { currentStyleBuilder } from './sequence-skin-param.js';

// 3a. box — opens a named/colored participant group: `CommandBoxStart`'s
//     `box`, then NAME1 (quoted) or NAME2 (`[^#]+`, which is greedy and so
//     swallows a `<<stereotype>>` written after an UNQUOTED title -- the jar
//     draws `box Foo <<S>>` titled `Foo «S»` with no stereotype), then
//     `StereotypePattern.optional("STEREO")` and the BACK colour.
//     A box opened inside another is its child (`SequenceDiagram#boxStart`,
//     `:502-507`, `ParticipantEnglober#newChild`).
// @see sequencediagram/command/CommandBoxStart.java:65-77
export const boxStartCommand: Command = {
  pattern: /^box(?:\s+"([^"]*)"|\s+([^#]+))?\s*(<<.+?>>)?\s*(#\S+)?\s*$/i,
  execute(state, match) {
    // Verbatim: `title = argTitle == null ? "" : argTitle`
    // (`CommandBoxStart.java:116,127`), never trimmed -- NAME2's greedy
    // `[^#]+` keeps the space before a `#colour`, and the title's measured
    // width keeps it too (`Doll#addInternalConstraints`, `Doll.java:225-235`).
    const label = match[1] ?? match[2] ?? '';
    // `Stereotype.build(arg.get("STEREO", 0))` (`CommandBoxStart.java:119-123`),
    // kept as written and built where the `Doll` resolves its style.
    const stereotype = match[3];
    const color = match[4] ?? '';
    const id = `box-${++state.boxCounter}`;
    const style = state.style;
    const parent = state.currentBox;
    // A `Doll` reads the builder at TILE time (`Doll.java:81-83`), i.e. after
    // every command: a getter, read once the parse has completed.
    const box: BoxGroup = {
      id,
      label,
      color,
      participantIds: [],
      ...(parent !== null ? { parentId: parent.id } : {}),
      ...(stereotype !== undefined ? { stereotype } : {}),
      get styleBuilder() {
        return currentStyleBuilder(style);
      },
      get boxPadding() {
        return style.params.getValue('boxPadding');
      },
    };
    state.ast.boxes.push(box);
    state.currentBox = box;
  },
};

// 3b. end box — closes the current participant group, ONE level:
//     `participantEnglober = participantEnglober.getParent()`
//     (`SequenceDiagram#endBox`, `:510-515`). `\s*` (not `\s+`)
//     between "end" and "box" mirrors `CommandBoxEnd`'s
//     `RegexLeaf.spaceZeroOrMore()`, so the unspaced `endbox` form matches
//     too (T13, mission dispatch-by-parse-attempt).
// @see sequencediagram/command/CommandBoxEnd.java:56-59
export const boxEndCommand: Command = {
  pattern: /^end\s*box\s*$/i,
  execute(state) {
    const parentId = state.currentBox?.parentId;
    state.currentBox = state.ast.boxes.find((b) => b.id === parentId) ?? null;
  },
};

// `CommandGrouping.java:76-77`, applied at `:140-149`. For the `group`
// keyword only: matches a trailing `[...]` run (the `[[url]]` alternative
// guards against eating a creole link's own brackets first). Group 1 is
// everything before the final bracket run (the custom header text), group 2
// is the bracket's own content.
const TRAILING_BRACKET_CONTENT_PATTERN = /^(.*\[\[.*\]\].*?|.*?)\[(.*)\]$/;

/**
 * `group`'s header rewrite (`CommandGrouping.java:139-149`): an empty comment
 * on `group` becomes the literal `"group"` (`:140-142`); a comment matching
 * TRAILING_BRACKET_CONTENT_PATTERN reassigns upstream's local `type` -- the
 * TITLE `SequenceDiagram#grouping` receives -- to group 1, verbatim, and the
 * comment to group 2 (`:143-148`). `frameType` (`GroupingType.getType(type)`,
 * `:139`) is read before the rewrite and never changes. The title is returned
 * only when rewritten; otherwise it is the keyword, `frameType`.
 */
function resolveGroupTitle(
  frameType: FrameEvent['frameType'],
  comment: string,
): { readonly title?: string; readonly comment: string } {
  if (frameType !== 'group') return { comment };
  if (comment === '') return { comment: 'group' };
  const bracketMatch = TRAILING_BRACKET_CONTENT_PATTERN.exec(comment);
  return bracketMatch ? { title: bracketMatch[1]!, comment: bracketMatch[2]! } : { comment };
}

/**
 * `SequenceDiagram#grouping`'s fallback for a command with no general
 * colour, read at the command's own line for the opener, every `else` and
 * `end` alike: `getSkinParam().getHtmlColor(ColorParam
 * .sequenceGroupBodyBackground, null, false)` (`SequenceDiagram.java:418-419`).
 * The `end` leaf's colour has no reader (`teoz/GroupingTile.java:162-163,
 * 1028` reads only its notes), but its read still fills `getValue`'s cache
 * (SkinParam.java:323-340).
 */
function groupBodyBackground(state: ParseState): string | undefined {
  return state.style.params.getHtmlColorToken('sequenceGroupBodyBackground');
}

// 10. Frame types (loop, alt, opt, par, par2, break, critical, group).
//     T13: added `par2` (`GroupingType.getType`, a same-visual-class START
//     alongside `par`) and a COLORS pair mirroring `CommandGrouping`'s
//     `#header[ #body]` -- T2: now modelled on `FrameEvent.backColorElement`
//     / `.backColorGeneral` (`CommandGrouping.java:134-135`: COLORS index 0
//     is the header/element color, index 1 is the general/body color).
//
//     T9: leading `(&\s*)?` mirrors the PARALLEL group upstream's single
//     `CommandGrouping` regex carries ahead of TYPE (`&[%s]*`, zero-or-more
//     spaces so `&opt` and `& opt` both match). Per D4 it is stored on
//     `FrameEvent.parallel` and never drawn: every consumer of
//     `isParallel()` lives under `sequencediagram/teoz/`
//     (`teoz/GroupingTile.java:145,864`), which this classic-renderer port
//     does not implement, and upstream's own classic renderer ignores it
//     too. Only the opening TYPE alternation carries the marker here --
//     `elseCommand`/`endCommand` split off the same upstream regex's
//     ELSE/ALSO/END arm, but no corpus fixture exercises `& else`/`& end`,
//     so that combination is left unported rather than guessed at.
// @see sequencediagram/command/CommandGrouping.java:64-73,66,134-135,151-152
export const groupingCommand: Command = {
  pattern: /^(&\s*)?(loop|alt|opt|par2|par|break|critical|group)(#\w+)?(?:\s+(#\w+))?(?:\s+(.+))?\s*$/i,
  execute(state, match) {
    // Upstream registers `CommandArrow` (`SequenceDiagramFactory.java:111`)
    // ahead of `CommandGrouping` (`:126`), so `LOOP -> X : hi` -- a
    // participant named like a group keyword -- is a MESSAGE there
    // (`sozifu-13-zufu979`). This table lists grouping first; declining
    // here hands such a line on to the arrow rules, as upstream's order does.
    if (UNDRESSED_ARROW_RE.test(match.input) || DRESSED_ARROW_RE.test(match.input)) throw new SequenceCommandRefusal();
    const frameType = match[2]!.toLowerCase() as FrameEvent['frameType'];
    const backColorElement = match[3];
    const backColorGeneral = match[4] ?? groupBodyBackground(state);
    const { title, comment: label } = resolveGroupTitle(frameType, match[5]?.trim() ?? '');
    const styleBuilder = currentStyleBuilder(state.style); // `SequenceDiagram.java:427-428`
    const frame: FrameEvent = {
      kind: 'frame',
      frameType,
      label,
      ...(title !== undefined ? { title } : {}),
      branches: [[]],
      branchLabels: [label],
      branchColors: [backColorGeneral],
      styleBuilder,
      branchStyleBuilders: [styleBuilder],
      ...(match[1] !== undefined ? { parallel: true } : {}),
      ...(backColorElement !== undefined ? { backColorElement } : {}),
      ...(backColorGeneral !== undefined ? { backColorGeneral } : {}),
    };
    state.frameStack.push(frame);
  },
};

// 11. else — adds a new branch to the current alt/par frame. T13: `also`
//     is `else`'s documented alias (`GroupingType.getType`'s ELSE case
//     covers both).
// The condition was captured but DISCARDED before SI-alt: `execute(state)`
// ignored `match`, so `else other case` lost "other case" at parse time and
// no downstream stage could draw it.
//
// T2: added an optional COLORS-index-1 group ahead of the condition text,
// pushed onto `FrameEvent.branchColors` index-aligned with `branchLabels`
// (D10, `ast.ts` doc comment on that field) -- index 0 there is the frame's
// own COLORS-index-1 value, seeded by `groupingCommand`, so this branch's
// push always lands at the SAME index as the `branchLabels` push two lines
// below. `sequence-layout-events.ts#handleFrameEvent` carries it onto each
// `FrameGeo.branchSeparators` entry for `renderer-frame-blotter.ts` to read.
//
// Upstream's single shared regex guards the color with `(?<!else)(?<!also)`
// negative lookaheads so `else` can only ever carry the SPACE-separated
// COLORS group, never the one that attaches directly to TYPE
// (`CommandGrouping.java:68`) -- this port's split-per-keyword regexes make
// that lookahead structurally unnecessary (there is no shared TYPE
// alternative to disambiguate against), so it is not ported; the effect
// (`else#eee` is not a color, `else #eee cond` is) falls out of requiring
// `\s+` ahead of the color group below.
/**
 * `SequenceDiagram#grouping`'s `default` arm (`:429-430`): EVERY `else`/
 * `also`/`end` line builds a NEW `GroupingLeaf`, which `implements
 * EventWithNote` (`GroupingLeaf.java:47`) -- so each is one of the three
 * upstream `getLastEventWithNote` anchors (T11, ubrr batch 2; see
 * `ParseState.lastEventWithNoteLeft`'s doc comment). `GroupingLeaf` carries
 * no participant of its own (`dealWith()` is unconditionally `false`);
 * upstream positions its note against the FRAME's own rendered span
 * (`teoz/GroupingTile.java`'s `getNotesWidth`/`getNoteComponents`), which
 * this port's AST does not track per-frame. Approximated here as the
 * MOST RECENT message's own endpoints when one exists -- for a typical
 * loop/group, that message sits inside (or immediately before) the frame
 * closing here, so its span is a closer stand-in for the frame's own than
 * the whole diagram is (jar-verified regression against
 * `mukebo-35-xoju095`, a six-participant/four-box diagram where the
 * whole-diagram span used to give a materially worse position than the
 * two participants the closing `loop`/`group` actually messaged between)
 * -- falling back to the full currently-declared participant span (the
 * same "across the whole diagram" reading `noteAcrossCommand`,
 * `command-note-factory.ts`, already uses) only when NO message has
 * occurred at all yet, which is the only shape this approximation needs
 * to cover faithfully: a `ref`/`opt`/`end` sequence with no message
 * anywhere (`teoz-ng-001-17`). The OPENING keyword (`groupingCommand`, a
 * `GroupingStart`) does NOT implement `EventWithNote` and must never call
 * this.
 */
function markGroupingLeafNoteAnchor(state: ParseState): void {
  if (state.lastMessageFrom !== null && state.lastMessageTo !== null) {
    setLastEventWithNoteSpan(state, [state.lastMessageFrom, state.lastMessageTo]);
    return;
  }
  setLastEventWithNoteSpan(
    state,
    state.ast.participants.map((p) => p.id),
  );
}

export const elseCommand: Command = {
  pattern: /^(?:else|also)(?:\s+(#\w+))?(?:\s+(.+))?\s*$/i,
  execute(state, match) {
    const top = state.frameStack[state.frameStack.length - 1];
    if (top !== undefined) {
      top.branches.push([]);
      top.branchLabels.push(match[2]?.trim() ?? '');
      top.branchColors?.push(match[1] ?? groupBodyBackground(state));
      // The `else` leaf's own builder (`SequenceDiagram.java:431-432`).
      top.branchStyleBuilders.push(currentStyleBuilder(state.style));
    }
    markGroupingLeafNoteAnchor(state);
  },
};

// 12. end — closes the current frame. T13: widened from bare `end` to
//     accept a trailing keyword/comment (`end opt`, `end group`, `end
//     par2`, …) -- `CommandGrouping`'s single TYPE token covers `end`
//     exactly like every open keyword, with everything after it captured
//     as an optional COMMENT that upstream's own `executeArg` never reads
//     for the END case (`GroupingType.END` takes no branch that consults
//     `comment`). Trailing text is matched and discarded here for the same
//     reason. The space-separated COLORS index 1 (`end #c`, `:68`) is
//     captured only to decide whether the end reads the legacy colour.
// @see sequencediagram/command/CommandGrouping.java:64-73,129-159
export const endCommand: Command = {
  pattern: /^end(?:\s+(#\w+))?(?:\s+.+)?\s*$/i,
  execute(state, match) {
    const frame = state.frameStack.pop();
    if (frame !== undefined) {
      // The END leaf's colour (`SequenceDiagram.java:418-419`) is never
      // drawn, but its read fills the cache: jar-verified, an `end` before
      // the skinparam leaves every later group uncoloured; `end #c` does not.
      if (match[1] === undefined) groupBodyBackground(state);
      emit(state, frame);
      // `SequenceDiagram#grouping`, END (`:441-444`).
      state.life.lastEventWithDeactivate = 'notMessage';
    }
    markGroupingLeafNoteAnchor(state);
  },
};

/**
 * End-of-input drain: a frame still open at EOF keeps its events. Upstream's
 * `events` list is flat (`SequenceDiagram.java:411-446`, `grouping` only
 * appends) and `GroupingTile`'s constructor consumes events "until END or the
 * end of the iterator" (`teoz/GroupingTile.java:158-166`, `while (it.hasNext())`
 * with `this.end` left null), so an unclosed `alt`/`group` still draws. The
 * innermost frame closes first, into its parent's current branch. No END leaf
 * exists, so unlike {@link endCommand} nothing else is touched (no colour read,
 * no `lastEventWithDeactivate`, no note anchor).
 */
export function drainOpenFrames(state: ParseState): void {
  for (let frame = state.frameStack.pop(); frame !== undefined; frame = state.frameStack.pop()) {
    emit(state, frame);
  }
}
