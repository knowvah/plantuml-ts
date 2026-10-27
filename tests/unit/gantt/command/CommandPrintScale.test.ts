import { describe, expect, it } from 'vitest';
import { PrintScale } from '../../../../src/diagrams/gantt/core/PrintScale.js';
import {
  applyCommandPrintScale,
  COMMAND_PRINT_SCALE_RE,
  CommandPrintScale,
} from '../../../../src/diagrams/gantt/command/CommandPrintScale.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const CMD = 'src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintScale.java';

interface Halves {
  scaleConfig: { getPrintScale: () => PrintScale; getFactorScale: () => number };
  weekConfig: { getWeeklyHeaderStrategy: () => string | undefined; getWeekStartingNumber: () => number };
}
const halves = (d: GanttDiagram): Halves => d as unknown as Halves;

function run(line: string): { d: GanttDiagram; h: Halves } {
  const d = newGantt();
  const m = COMMAND_PRINT_SCALE_RE.exec(line);
  if (m === null) throw new Error(`no match: ${line}`);
  expect(applyCommandPrintScale(d, m).isOk()).toBe(true);
  return { d, h: halves(d) };
}

describe('CommandPrintScale', () => {
  // Corpus forms.
  it.each([
    'printscale weekly',
    'printscale monthly',
    'projectscale weekly',
    'printscale yearly',
    'projectscale monthly zoom 3',
    'printscale weekly with calendar date',
    'printscale quarterly',
    'printscale daily',
    'printscale daily zoom 2',
    'ganttscale weekly',
    'Printscale weekly',
    'projectscale yearly zoom 25',
    'printscale weekly with week numbering from 5',
    'printscale weekly with week numbering from -3 zoom 1.5',
    'printscale weekly with calendar date zoom .5',
  ])(`matches %s (${CMD}:59-80)`, (line) => {
    expect(COMMAND_PRINT_SCALE_RE.test(line)).toBe(true);
  });

  it.each([
    'printscale',
    'printscale hourly',
    'scale weekly',
    'printscale weekly zoom',
    'printscale weekly with week numbering from',
    'printscale weekly with calendar',
    'printscale weekly zoom x',
    'printscale weekly extra',
    'printscaleweekly',
  ])(`rejects %j (${CMD}:60-79)`, (line) => {
    expect(COMMAND_PRINT_SCALE_RE.test(line)).toBe(false);
  });

  it('SCALE, OPTION, NUMBER, ZOOM groups (CommandPrintScale.java:64,72,74,79)', () => {
    const g = COMMAND_PRINT_SCALE_RE.exec('printscale weekly with week numbering from -3 zoom 1.5')?.groups;
    expect(g?.['SCALE']).toBe('weekly');
    expect(g?.['OPTION']).toBe('with week numbering from -3');
    expect(g?.['NUMBER']).toBe('-3');
    expect(g?.['ZOOM']).toBe('1.5');
  });

  it('apply sets the print scale from the SCALE prefix (CommandPrintScale.java:86-88; PrintScale.java:48-65)', () => {
    expect(run('printscale yearly').h.scaleConfig.getPrintScale()).toBe(PrintScale.YEARLY);
    expect(run('printscale quarterly').h.scaleConfig.getPrintScale()).toBe(PrintScale.QUARTERLY);
    expect(run('printscale monthly').h.scaleConfig.getPrintScale()).toBe(PrintScale.MONTHLY);
    expect(run('projectscale weekly').h.scaleConfig.getPrintScale()).toBe(PrintScale.WEEKLY);
    expect(run('ganttscale daily').h.scaleConfig.getPrintScale()).toBe(PrintScale.DAILY);
  });

  it('apply with ZOOM calls setFactorScale(Double.parseDouble) (CommandPrintScale.java:90-92)', () => {
    expect(run('printscale daily zoom 2').h.scaleConfig.getFactorScale()).toBe(2);
    expect(run('printscale daily zoom 1.5').h.scaleConfig.getFactorScale()).toBe(1.5);
    expect(run('printscale daily zoom .5').h.scaleConfig.getFactorScale()).toBe(0.5);
    expect(run('printscale daily zoom 3.').h.scaleConfig.getFactorScale()).toBe(3);
  });

  it('apply without ZOOM leaves the factor at its default (CommandPrintScale.java:91-92)', () => {
    const untouched = halves(newGantt()).scaleConfig.getFactorScale();
    expect(run('printscale weekly').h.scaleConfig.getFactorScale()).toBe(untouched);
  });

  it('a non-numeric ZOOM throws NumberFormatException as Double.parseDouble does (CommandPrintScale.java:79,92)', () => {
    expect(() => run('printscale daily zoom 1.2.3')).toThrow(/NumberFormatException/);
    expect(() => run('printscale daily zoom .')).toThrow(/NumberFormatException/);
  });

  it('OPTION "with calendar date" selects DAY_OF_MONTH, 0 (CommandPrintScale.java:95-96)', () => {
    const { h } = run('printscale weekly with calendar date');
    expect(h.weekConfig.getWeeklyHeaderStrategy()).toBe('DAY_OF_MONTH');
    expect(h.weekConfig.getWeekStartingNumber()).toBe(0);
  });

  it('OPTION "with week numbering from N" selects FROM_N, N (CommandPrintScale.java:97-100)', () => {
    const pos = run('printscale weekly with week numbering from 5').h;
    expect(pos.weekConfig.getWeeklyHeaderStrategy()).toBe('FROM_N');
    expect(pos.weekConfig.getWeekStartingNumber()).toBe(5);
    expect(run('printscale weekly with week numbering from -3').h.weekConfig.getWeekStartingNumber()).toBe(-3);
  });

  it('a week number past the int range throws NumberFormatException as Integer.parseInt does (CommandPrintScale.java:99)', () => {
    expect(() => run('printscale weekly with week numbering from 99999999999')).toThrow(/NumberFormatException/);
  });

  it('no OPTION leaves the header strategy unset (CommandPrintScale.java:93)', () => {
    expect(run('printscale weekly').h.weekConfig.getWeeklyHeaderStrategy()).toBeUndefined();
  });

  it('exports { regex, apply } under the Java class name', () => {
    expect(CommandPrintScale.regex).toBe(COMMAND_PRINT_SCALE_RE);
    expect(CommandPrintScale.apply).toBe(applyCommandPrintScale);
  });
});
