import { describe, expect, it, vi } from 'vitest';
import { NoSuchColorException } from '../../../../src/core/klimt/color/NoSuchColorException.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import {
  applyCommandNoteBottom,
  COMMAND_NOTE_BOTTOM_END_RE,
  COMMAND_NOTE_BOTTOM_RE,
  collectCommandNoteBottomBlock,
  CommandNoteBottom,
} from '../../../../src/diagrams/gantt/command/CommandNoteBottom.js';
import type { CommandNoteBottomBlock } from '../../../../src/diagrams/gantt/command/CommandNoteBottom.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const CMD = 'src/main/java/net/sourceforge/plantuml/gantt/command/CommandNoteBottom.java';

function block(lines: string[]): CommandNoteBottomBlock {
  const b = collectCommandNoteBottomBlock(lines, 0);
  if (b === undefined) throw new Error('no block');
  return b;
}

function run(lines: string[]) {
  const d = newGantt();
  const spy = vi.spyOn(d, 'addNote');
  const result = applyCommandNoteBottom(d, block(lines));
  return { result, spy };
}

describe('CommandNoteBottom start pattern', () => {
  // Corpus forms.
  it.each([
    'note bottom',
    'note bottom <<s2n>>',
    'NOTE BOTTOM',
    'notebottom',
    'note bottom $tag',
    'note bottom $a $b <<s>>',
    'note   bottom   <<s>>  ',
  ])(`matches %j (${CMD}:67-74)`, (text) => {
    expect(COMMAND_NOTE_BOTTOM_RE.test(text)).toBe(true);
  });

  it.each(['note top', 'note bottom extra', 'note', 'note bottom <<>>', 'note bottom $', 'a note bottom'])(
    `rejects %j (${CMD}:68-74)`,
    (text) => {
      expect(COMMAND_NOTE_BOTTOM_RE.test(text)).toBe(false);
    },
  );

  it('captures TAGS and STEREO (CommandNoteBottom.java:72-73; StereotypePattern.java:53-59)', () => {
    const g = COMMAND_NOTE_BOTTOM_RE.exec('note bottom $a $b <<s2n>>')?.groups;
    expect(g?.['TAGS']).toBe('$a $b');
    expect(g?.['STEREO']).toBe('<<s2n>>');
    const bare = COMMAND_NOTE_BOTTOM_RE.exec('note bottom')?.groups;
    expect(bare?.['TAGS']).toBeUndefined();
    expect(bare?.['STEREO']).toBeUndefined();
  });

  it('END is ^end[%s]*note$ (CommandNoteBottom.java:60)', () => {
    expect(COMMAND_NOTE_BOTTOM_END_RE.test('end note')).toBe(true);
    expect(COMMAND_NOTE_BOTTOM_END_RE.test('endnote')).toBe(true);
    expect(COMMAND_NOTE_BOTTOM_END_RE.test('END  NOTE')).toBe(true);
    expect(COMMAND_NOTE_BOTTOM_END_RE.test('end notes')).toBe(false);
    expect(COMMAND_NOTE_BOTTOM_END_RE.test('x end note')).toBe(false);
  });
});

describe('collectCommandNoteBottomBlock', () => {
  it('collects start..end and reports the end index (CommandMultilines2.java:79-111)', () => {
    const b = collectCommandNoteBottomBlock(['x', 'note bottom', 'hello', 'end note', 'y'], 1);
    expect(b).toEqual({ lines: ['note bottom', 'hello', 'end note'], endIndex: 3 });
  });

  it('drops lines whose trimmed text starts with a quote: REMOVE_STARTING_QUOTE (MultilinesStrategy.java:56-58)', () => {
    const b = collectCommandNoteBottomBlock(['note bottom', "  ' comment", 'text', 'end note'], 0);
    expect(b?.lines).toEqual(['note bottom', 'text', 'end note']);
    expect(b?.endIndex).toBe(3);
  });

  it('a first line that does not match the start pattern is no block (CommandMultilines2.java:99-101)', () => {
    expect(collectCommandNoteBottomBlock(['note top', 'end note'], 0)).toBeUndefined();
    expect(collectCommandNoteBottomBlock(["' note bottom", 'end note'], 0)).toBeUndefined();
    expect(collectCommandNoteBottomBlock(['note bottom'], 5)).toBeUndefined();
  });

  it('with no end line there is no block (CommandMultilines2.java:106-108: OK_PARTIAL)', () => {
    expect(collectCommandNoteBottomBlock(['note bottom', 'text'], 0)).toBeUndefined();
  });

  it('the END probe is trimmed (Trim.BOTH, CommandNoteBottom.java:63)', () => {
    expect(collectCommandNoteBottomBlock(['note bottom', '  end note  '], 0)?.endIndex).toBe(1);
  });
});

describe('applyCommandNoteBottom', () => {
  it('adds the body as a Display with a stereotype, after subExtract(1,1) (CommandNoteBottom.java:103-114)', () => {
    const { result, spy } = run(['note bottom <<s2n>>', 'first', 'second', 'end note']);
    expect(result.getError()).toBe('No task defined'); // GanttDiagram.java:486-495, no task yet
    const [display, stereotype] = spy.mock.calls[0]!;
    expect(display.asList().map(String)).toEqual(['first', 'second']);
    expect(stereotype).toEqual(Stereotype.build('<<s2n>>'));
  });

  it('no STEREO passes an undefined stereotype (CommandNoteBottom.java:110-112)', () => {
    const { spy } = run(['note bottom', 'text', 'end note']);
    expect(spy.mock.calls[0]![1]).toBeUndefined();
  });

  it('removes the common leading whitespace column (CommandNoteBottom.java:104; BlocLines.java:234-263)', () => {
    const { spy } = run(['note bottom', '  a', '   b', '', '  c', 'end note']);
    expect(spy.mock.calls[0]![0].asList().map(String)).toEqual(['a', ' b', '', 'c']);
  });

  it('leaves the lines alone when a column is not blank (BlocLines.java:250-263)', () => {
    const { spy } = run(['note bottom', ' a', 'b', 'end note']);
    expect(spy.mock.calls[0]![0].asList().map(String)).toEqual([' a', 'b']);
  });

  it('an empty body is "No note defined" and adds nothing (CommandNoteBottom.java:106-107)', () => {
    const { result, spy } = run(['note bottom', 'end note']);
    expect(result.getError()).toBe('No note defined');
    expect(spy).not.toHaveBeenCalled();
  });

  it('a body of only blank lines is a note of those lines, not empty (BlocLines.java:234-263)', () => {
    const { spy } = run(['note bottom', '', 'end note']);
    expect(spy.mock.calls[0]![0].asList().map(String)).toEqual(['']);
  });

  it('a NoSuchColorException becomes badColor, anything else is rethrown (CommandMultilines2.java:117-121)', () => {
    const d = newGantt();
    const spy = vi.spyOn(d, 'addNote');
    spy.mockImplementation(() => {
      throw new NoSuchColorException();
    });
    const bad = applyCommandNoteBottom(d, block(['note bottom', 'text', 'end note']));
    expect(bad.isOk()).toBe(false);
    expect(bad.getError()).toBe('No such color');
    spy.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => applyCommandNoteBottom(d, block(['note bottom', 'text', 'end note']))).toThrow('boom');
  });

  it('exports start/end/collect/apply under the Java class name', () => {
    expect(CommandNoteBottom.start).toBe(COMMAND_NOTE_BOTTOM_RE);
    expect(CommandNoteBottom.end).toBe(COMMAND_NOTE_BOTTOM_END_RE);
    expect(CommandNoteBottom.collect).toBe(collectCommandNoteBottomBlock);
    expect(CommandNoteBottom.apply).toBe(applyCommandNoteBottom);
  });
});
