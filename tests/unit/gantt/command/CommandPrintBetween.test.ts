import { describe, expect, it } from 'vitest';
import { CommandControl } from '../../../../src/core/command/CommandControl.js';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import { RegexResult } from '../../../../src/core/regex/RegexResult.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { CommandPrintBetween } from '../../../../src/diagrams/gantt/command/CommandPrintBetween.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const CMD = 'src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintBetween.java';

const line = (s: string): StringLocated => new StringLocated(s, undefined);
const command = new CommandPrintBetween();

/** `timeBounds` is protected on the diagram; the print interval has no public getter. */
const printInterval = (d: GanttDiagram): [LocalDate | undefined, LocalDate | undefined] => {
  const bounds = (
    d as unknown as { timeBounds: { getPrintStart(): LocalDate | undefined; getPrintEnd(): LocalDate | undefined } }
  ).timeBounds;
  return [bounds.getPrintStart(), bounds.getPrintEnd()];
};

describe('CommandPrintBetween', () => {
  // "Print between 2020/02/14 and 2020/03/04" is the example comment at java:65; the command is case sensitive here
  // because the ubrex leaves are literal.
  it.each([
    'print between 2020-02-14 and 2020-03-04',
    'print   between   2020-02-14   and   2020-03-04',
    'print between d+1 and d+5',
    'print between 2020-02-14 and d+5',
  ])(`isValid %j is OK (${CMD}:66-75)`, (text) => {
    expect(command.isValid(line(text))).toBe(CommandControl.OK);
  });

  it.each([
    'print between 2020-02-14',
    'print between 2020-02-14 and',
    'print 2020-02-14 and 2020-03-04',
    'print between 2020-02-14 and 2020-03-04 extra',
    'between 2020-02-14 and 2020-03-04',
    'print between foo and bar',
  ])(`isValid %j is NOT_OK (${CMD}:66-75)`, (text) => {
    expect(command.isValid(line(text))).toBe(CommandControl.NOT_OK);
  });

  it('isEligibleFor is pass ONE only (UBrexSingleLineCommand2.java)', () => {
    expect(command.isEligibleFor(ParserPass.ONE)).toBe(true);
    expect(command.isEligibleFor(ParserPass.TWO)).toBe(false);
  });

  it('explain describes the raw date expressions (java:78-86)', () => {
    expect(command.explain(line('print between 2020-02-14 and 2020-03-04'))).toBe(
      'Restricting the printed interval to between 2020-02-14 and 2020-03-04',
    );
  });

  it('explain returns undefined for a non-matching line (UBrexSingleLineCommand2.java explain)', () => {
    expect(command.explain(line('print between nothing'))).toBeUndefined();
  });

  it('execute sets the print interval from both dates (java:88-97)', () => {
    const d = newGantt();
    const result = command.execute(d, line('print between 2020-02-14 and 2020-03-04'), ParserPass.ONE);
    expect(result.isOk()).toBe(true);
    const [start, end] = printInterval(d);
    expect(start?.toString()).toBe('2020-02-14');
    expect(end?.toString()).toBe('2020-03-04');
  });

  it('execute resolves relative dates against the gantt start (java:93-94; ComplementDate.java:119-127)', () => {
    const d = newGantt();
    d.updateStartingPoint(LocalDate.of(2020, 7, 1));
    const result = command.execute(d, line('print between d+1 and d+5'), ParserPass.ONE);
    expect(result.isOk()).toBe(true);
    const [start, end] = printInterval(d);
    expect(start?.toString()).toBe('2020-07-02');
    expect(end?.toString()).toBe('2020-07-06');
  });

  it('executeArg without a UMatcher is the NullPointerException of java:91-92', () => {
    const d = newGantt();
    const bare = RegexResult.fromMap(new Map());
    const exec = (
      command as unknown as {
        executeArg(d: GanttDiagram, l: undefined, a: RegexResult, p: ParserPass): unknown;
      }
    ).executeArg.bind(command);
    expect(() => exec(d, undefined, bare, ParserPass.ONE)).toThrow('NullPointerException');
  });
});
