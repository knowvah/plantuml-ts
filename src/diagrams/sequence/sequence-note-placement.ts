/**
 * What the note commands read from the diagram built so far: the text a
 * note's display is rewritten to (`SequenceDiagram#manageVariable`) and the
 * event list an arrow note lands in (`SequenceDiagram#getLastEventWithNote`).
 *
 * Upstream's `events` list is flat (`SequenceDiagram.java:411-446`); this
 * port's parser nests a frame's events in `FrameEvent.branches` and appends
 * the frame to its parent only at `end`, so both questions walk the open
 * frames (`ParseState.frameStack`) before the completed events.
 */
import type { MessageEvent, NoteEvent, SequenceEvent } from './ast.js';
import { currentEvents, type ParseState } from './sequence-parse-helpers.js';

/** The literal `SequenceDiagram#manageVariable` replaces in a note's display
 *  (`SequenceDiagram.java:613-615`). */
const AUTONUMBER_VARIABLE = '%autonumber%';

/** The formatted number of the last numbered message in `events`, document
 *  order, nested frames included. */
function lastLabelIn(events: readonly SequenceEvent[]): string | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]!;
    if (event.kind === 'frame') {
      const found = lastLabelOf(event);
      if (found !== undefined) return found;
    } else if ((event.kind === 'message' || event.kind === 'messageExo') && event.sequenceLabel !== undefined) {
      return event.sequenceLabel;
    }
  }
  return undefined;
}

function lastLabelOf(frame: { readonly branches: readonly (readonly SequenceEvent[])[] }): string | undefined {
  for (let b = frame.branches.length - 1; b >= 0; b--) {
    const found = lastLabelIn(frame.branches[b]!);
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * `AutoNumber#getCurrentMessageNumber(false)` (`AutoNumber.java:91-96`): the
 * `last` formatted number, `<b>`/`</b>` removed. `last` is only ever set by
 * `getNextMessageNumber` (`:82-89`) and is cleared by neither `autonumber
 * stop` nor a restart, so it is the label of the last numbered message in
 * document order -- the open frames' events (innermost last) after the
 * completed ones. `""` before the first.
 */
function currentMessageNumber(state: ParseState): string {
  return stripBold(lastLabelBefore(state) ?? '');
}

function stripBold(label: string): string {
  return label.replaceAll('<b>', '').replaceAll('</b>', '');
}

function lastLabelBefore(state: ParseState): string | undefined {
  for (let d = state.frameStack.length - 1; d >= 0; d--) {
    const found = lastLabelOf(state.frameStack[d]!);
    if (found !== undefined) return found;
  }
  return lastLabelIn(state.ast.events);
}

/**
 * `SequenceDiagram#manageVariable(display)`: every `%autonumber%` becomes the
 * current message number. Every note factory calls it on its display before
 * building the `Note` (`FactorySequenceNoteCommand.java:148,166`,
 * `...OverSeveralCommand.java:137,222`, `...AcrossCommand.java:123,202`,
 * `...OnArrowCommand.java:119,203`).
 */
export function manageVariable(state: ParseState, text: string): string {
  if (!text.includes(AUTONUMBER_VARIABLE)) return text;
  return text.replaceAll(AUTONUMBER_VARIABLE, currentMessageNumber(state));
}

/**
 * `diagram.manageVariable(labels)` on an arrow's label
 * (`CommandArrow.java:400-402`). It runs AFTER `getNextMessageNumber`, so a
 * numbered message reads its OWN number; an unnumbered one (autonumber off or
 * stopped) reads the previous `last`. `msg` is not yet in the event tree.
 */
export function manageMessageLabel(state: ParseState, msg: MessageEvent): MessageEvent {
  if (!msg.label.includes(AUTONUMBER_VARIABLE)) return msg;
  const number = msg.sequenceLabel !== undefined ? stripBold(msg.sequenceLabel) : currentMessageNumber(state);
  return { ...msg, label: msg.label.replaceAll(AUTONUMBER_VARIABLE, number) };
}

/** Whether `event` is an `EventWithNote` of the flat list (`AbstractMessage`,
 *  `Reference`, or a closed frame's `end` leaf). */
function isEventWithNote(event: SequenceEvent): boolean {
  return event.kind === 'message' || event.kind === 'messageExo' || event.kind === 'frame';
}

/**
 * The list an arrow note (`note left|right|top|bottom`) joins.
 * `FactorySequenceNoteOnArrowCommand` adds it to `getLastEventWithNote()`
 * (`:211`, `SequenceDiagram.java:154-158`), and a `GroupingStart` is not an
 * `EventWithNote` (`GroupingStart.java:48`), so a note written straight after
 * `alt x` belongs to the event before the frame. That event lives in the list
 * the frame will be appended to: climb out of every open frame that is still
 * on its first branch (an `else` leaf IS an owner) and holds no owner yet.
 */
function arrowNoteList(state: ParseState): SequenceEvent[] {
  const stack = state.frameStack;
  let list = currentEvents(state);
  for (let d = stack.length - 1; d >= 0; d--) {
    if (stack[d]!.branches.length > 1 || list.some(isEventWithNote)) break;
    list = d > 0 ? (stack[d - 1]!.branches.at(-1) ?? state.ast.events) : state.ast.events;
  }
  return list;
}

/** Emit an arrow note into {@link arrowNoteList}. */
export function emitOnArrowNote(state: ParseState, note: NoteEvent): void {
  arrowNoteList(state).push(note);
}
