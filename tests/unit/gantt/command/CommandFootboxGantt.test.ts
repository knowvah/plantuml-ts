import { describe, expect, it } from 'vitest';
import {
  applyCommandFootboxGantt,
  COMMAND_FOOTBOX_GANTT_RE,
  CommandFootboxGantt,
} from '../../../../src/diagrams/gantt/command/CommandFootboxGantt.js';
import type { DisplayConfigData } from '../../../../src/diagrams/gantt/data/DisplayConfigData.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const showFootbox = (d: GanttDiagram): boolean =>
  (d as unknown as { displayConfig: DisplayConfigData }).displayConfig.isShowFootbox();

/** Corpus (tests/fixtures/gantt/*.puml, test-results/dot-cache/gantt/*\/in.puml): `hide footbox` x7. */
const MATCHING = ['hide footbox', 'show footbox', 'HIDE FOOTBOX', 'hide  footbox', 'footbox'];
const NEAR_MISSES = ['hide footboxes', 'hid footbox', 'hide footbox ', 'hide foot box', 'show hide footbox'];

describe('CommandFootboxGantt', () => {
  it.each(MATCHING)('regex matches %j (CommandFootbox.java:51-54)', (line) => {
    expect(COMMAND_FOOTBOX_GANTT_RE.test(line)).toBe(true);
  });

  it.each(NEAR_MISSES)('regex rejects %j', (line) => {
    expect(COMMAND_FOOTBOX_GANTT_RE.test(line)).toBe(false);
  });

  it('exports the class-name const as { regex, apply }', () => {
    expect(CommandFootboxGantt.regex).toBe(COMMAND_FOOTBOX_GANTT_RE);
    expect(CommandFootboxGantt.apply).toBe(applyCommandFootboxGantt);
  });

  it('hide turns the footbox off, show turns it back on (CommandFootboxGantt.java:55-57)', () => {
    const diagram = newGantt();
    expect(showFootbox(diagram)).toBe(true);
    expect(applyCommandFootboxGantt(diagram, COMMAND_FOOTBOX_GANTT_RE.exec('hide footbox')!).isOk()).toBe(true);
    expect(showFootbox(diagram)).toBe(false);
    expect(applyCommandFootboxGantt(diagram, COMMAND_FOOTBOX_GANTT_RE.exec('SHOW footbox')!).isOk()).toBe(true);
    expect(showFootbox(diagram)).toBe(true);
  });

  it('a bare footbox leaves TYPE null and throws, as the Java NullPointerException (:55)', () => {
    expect(() => applyCommandFootboxGantt(newGantt(), COMMAND_FOOTBOX_GANTT_RE.exec('footbox')!)).toThrow(TypeError);
  });
});
