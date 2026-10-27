import { describe, expect, it } from 'vitest';
import {
  applyCommandSeparator,
  COMMAND_SEPARATOR_RE,
  CommandSeparator,
} from '../../../../src/diagrams/gantt/command/CommandSeparator.js';
import type { TaskSeparator } from '../../../../src/diagrams/gantt/core/TaskSeparator.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const CMD = 'src/main/java/net/sourceforge/plantuml/gantt/command/CommandSeparator.java';

describe('CommandSeparator', () => {
  // Corpus forms.
  it.each([
    '--',
    '-- Phase Two --',
    '-- end --',
    '-- Separator title --',
    '-- test02 --',
    '-- Sub-project One --',
    '--x--',
    '--   spaced   --',
  ])(`matches %j (${CMD}:56-58)`, (line) => {
    expect(COMMAND_SEPARATOR_RE.test(line)).toBe(true);
  });

  it.each(['---', '-', '- x -', '-- unterminated', '-- a -- b', 'x --'])(
    `rejects %j: the comment needs a closing -- and the line is anchored (${CMD}:58)`,
    (line) => {
      expect(COMMAND_SEPARATOR_RE.test(line)).toBe(false);
    },
  );

  it('COMMENT is the INNER group, trimmed of the spaces before the closing -- (CommandSeparator.java:58,64)', () => {
    expect(COMMAND_SEPARATOR_RE.exec('-- Phase Two --')?.groups?.['COMMENT']).toBe('Phase Two');
    expect(COMMAND_SEPARATOR_RE.exec('--')?.groups?.['COMMENT']).toBeUndefined();
  });

  it('apply with a title adds a named separator task (CommandSeparator.java:64-65; TaskSeparator.java:51-55)', () => {
    const d = newGantt();
    expect(applyCommandSeparator(d, COMMAND_SEPARATOR_RE.exec('-- Phase Two --')!).isOk()).toBe(true);
    expect((d.getExistingTask('##0') as TaskSeparator).getName()).toBe('Phase Two');
  });

  it('apply without a title passes the absent group as-is (journal row 57; CommandSeparator.java:64)', () => {
    const d = newGantt();
    expect(applyCommandSeparator(d, COMMAND_SEPARATOR_RE.exec('--')!).isOk()).toBe(true);
    expect((d.getExistingTask('##0') as TaskSeparator).getName()).toBeUndefined();
  });

  it('exports { regex, apply } under the Java class name', () => {
    expect(CommandSeparator.regex).toBe(COMMAND_SEPARATOR_RE);
    expect(CommandSeparator.apply).toBe(applyCommandSeparator);
  });
});
