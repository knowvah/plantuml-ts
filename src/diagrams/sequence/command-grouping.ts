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
import { emit, type Command } from './sequence-parse-helpers.js';

// 3a. box — opens a named/colored participant group. T13 (mission
//     dispatch-by-parse-attempt): widened to accept an unquoted label
//     (`box BoxOfAlice #yellow/blue`) and a trailing `<<stereotype>>`
//     (`box "Tier 1" <<Client>>`) between the label and color, matching
//     `CommandBoxStart`'s NAME1/NAME2/STEREOTYPE/color order. The
//     stereotype is matched and discarded -- `BoxGroup` has no field for
//     it and nothing in this port's renderer draws a box's stereotype.
// @see sequencediagram/command/CommandBoxStart.java:65-77
export const boxStartCommand: Command = {
  pattern: /^box(?:\s+"([^"]*)"|\s+([^#<\s][^#<]*?))?(?:\s*<<[^>]*>>)?(?:\s+(#\S+))?\s*$/i,
  execute(state, match) {
    const label = (match[1] ?? match[2] ?? '').trim();
    const color = match[3] ?? '';
    const id = `box-${++state.boxCounter}`;
    const box: BoxGroup = { id, label, color, participantIds: [] };
    state.ast.boxes.push(box);
    state.currentBox = box;
  },
};

// 3b. end box — closes the current participant group. `\s*` (not `\s+`)
//     between "end" and "box" mirrors `CommandBoxEnd`'s
//     `RegexLeaf.spaceZeroOrMore()`, so the unspaced `endbox` form matches
//     too (T13, mission dispatch-by-parse-attempt).
// @see sequencediagram/command/CommandBoxEnd.java:56-59
export const boxEndCommand: Command = {
  pattern: /^end\s*box\s*$/i,
  execute(state) {
    state.currentBox = null;
  },
};

// 10. Frame types (loop, alt, opt, par, par2, break, critical, group).
//     T13: added `par2` (`GroupingType.getType`, a same-visual-class START
//     alongside `par`) and an optional COLORS pair mirroring
//     `CommandGrouping`'s `#header[ #body]` -- captured so the label group
//     doesn't absorb them, but not modelled on `FrameGeo` (no colored-frame
//     rendering in this engine yet), same documented scope cut as `ref`'s
//     `REF` color group below.
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
// @see sequencediagram/command/CommandGrouping.java:64-73,66,151-152
export const groupingCommand: Command = {
  pattern:
    /^(&\s*)?(loop|alt|opt|par2|par|break|critical|group)(#\w+)?(?:\s+(#\w+))?(?:\s+(.+))?\s*$/i,
  execute(state, match) {
    const frameType = match[2]!.toLowerCase() as FrameEvent['frameType'];
    const label = match[5]?.trim() ?? '';
    const frame: FrameEvent = {
      kind: 'frame',
      frameType,
      label,
      branches: [[]],
      branchLabels: [label],
      ...(match[1] !== undefined ? { parallel: true } : {}),
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
// @see sequencediagram/GroupingType.java:52-53
export const elseCommand: Command = {
  pattern: /^(?:else|also)(?:\s+(.+))?\s*$/i,
  execute(state, match) {
    const top = state.frameStack[state.frameStack.length - 1];
    if (top !== undefined) {
      top.branches.push([]);
      top.branchLabels.push(match[1]?.trim() ?? '');
    }
  },
};

// 12. end — closes the current frame. T13: widened from bare `end` to
//     accept a trailing keyword/comment (`end opt`, `end group`, `end
//     par2`, …) -- `CommandGrouping`'s single TYPE token covers `end`
//     exactly like every open keyword, with everything after it captured
//     as an optional COMMENT that upstream's own `executeArg` never reads
//     for the END case (`GroupingType.END` takes no branch that consults
//     `comment`). Trailing text is matched and discarded here for the same
//     reason.
// @see sequencediagram/command/CommandGrouping.java:64-73,129-159
export const endCommand: Command = {
  pattern: /^end(?:\s+.+)?\s*$/i,
  execute(state) {
    const frame = state.frameStack.pop();
    if (frame !== undefined) {
      emit(state, frame);
    }
  },
};

