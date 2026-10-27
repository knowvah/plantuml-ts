import { describe, expect, it } from 'vitest';
import { CommandControl } from '../../../../src/core/command/CommandControl.js';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { CommandHideShowColumns } from '../../../../src/diagrams/gantt/command/CommandHideShowColumns.js';
import { GanttTaskTableColumn } from '../../../../src/diagrams/gantt/GanttTaskTableColumn.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const CMD = 'src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideShowColumns.java';

const line = (s: string): StringLocated => new StringLocated(s, undefined);
const command = new CommandHideShowColumns();

describe('CommandHideShowColumns', () => {
  // Corpus forms.
  it.each(['hide column duration', 'show column task', 'show column START', 'hide column end', 'hide   column   end'])(
    `isValid %j is OK (${CMD}:62-67)`,
    (text) => {
      expect(command.isValid(line(text))).toBe(CommandControl.OK);
    },
  );

  it.each([
    'hide column foo',
    'hide columns duration',
    'hide column',
    'hide duration',
    'toggle column duration',
    'hide column duration extra',
  ])(`isValid %j is NOT_OK (${CMD}:62-67)`, (text) => {
    expect(command.isValid(line(text))).toBe(CommandControl.NOT_OK);
  });

  it('hide removes a displayed column (CommandHideShowColumns.java:78-84; GanttDiagram.java hideOrShowColumn)', () => {
    const d = newGantt();
    expect(d.getDisplayedColumn()).toContain(GanttTaskTableColumn.DURATION);
    const result = command.execute(d, line('hide column duration'), ParserPass.ONE);
    expect(result.isOk()).toBe(true);
    expect(d.getDisplayedColumn()).not.toContain(GanttTaskTableColumn.DURATION);
  });

  it('show adds a column: COMMAND starts with "s" (CommandHideShowColumns.java:79-80)', () => {
    const d = newGantt();
    expect(d.getDisplayedColumn()).not.toContain(GanttTaskTableColumn.TASK);
    const result = command.execute(d, line('show column task'), ParserPass.ONE);
    expect(result.isOk()).toBe(true);
    expect(d.getDisplayedColumn()).toContain(GanttTaskTableColumn.TASK);
  });

  it('the column name is resolved by GanttTaskTableColumn.of (CommandHideShowColumns.java:84)', () => {
    const d = newGantt();
    command.execute(d, line('hide column START'), ParserPass.ONE);
    expect(d.getDisplayedColumn()).toEqual([GanttTaskTableColumn.END, GanttTaskTableColumn.DURATION]);
  });

  it('explain answers undefined: @Explain "to be done" returns null (CommandHideShowColumns.java:70-74)', () => {
    expect(command.explain(line('hide column duration'))).toBeUndefined();
  });

  it('a non-matching line is refused by execute, no state change (UBrexSingleLineCommand2.execute)', () => {
    const d = newGantt();
    const before = [...d.getDisplayedColumn()];
    expect(command.execute(d, line('hide column foo'), ParserPass.ONE).isOk()).toBe(false);
    expect(d.getDisplayedColumn()).toEqual(before);
  });
});
