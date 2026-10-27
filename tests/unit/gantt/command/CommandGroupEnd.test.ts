import { describe, expect, it } from 'vitest';
import {
  applyCommandGroupEnd,
  COMMAND_GROUP_END_RE,
  CommandGroupEnd,
} from '../../../../src/diagrams/gantt/command/CommandGroupEnd.js';
import {
  applyCommandGroupStart,
  COMMAND_GROUP_START_RE,
} from '../../../../src/diagrams/gantt/command/CommandGroupStart.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

/** Corpus: `end group` x9 (tests/fixtures/gantt/*.puml, test-results/dot-cache/gantt/*\/in.puml). */
const MATCHING = ['end group', '  end group  ', 'endgroup', 'END GROUP', 'end group'];
const NEAR_MISSES = ['end groups', 'end', 'group end', 'end group x', 'ends group'];

describe('CommandGroupEnd', () => {
  it.each(MATCHING)('regex matches %j (CommandGroupEnd.java:54-62)', (line) => {
    expect(COMMAND_GROUP_END_RE.test(line)).toBe(true);
  });

  it.each(NEAR_MISSES)('regex rejects %j', (line) => {
    expect(COMMAND_GROUP_END_RE.test(line)).toBe(false);
  });

  it('exports the class-name const as { regex, apply }', () => {
    expect(CommandGroupEnd.regex).toBe(COMMAND_GROUP_END_RE);
    expect(CommandGroupEnd.apply).toBe(applyCommandGroupEnd);
  });

  it('with no open group answers the error from GanttDiagram.endGroup (GanttDiagram.java:327-334)', () => {
    const result = applyCommandGroupEnd(newGantt(), COMMAND_GROUP_END_RE.exec('end group')!);
    expect(result.isOk()).toBe(false);
    expect(result.getError()).toBe('No group to be closed');
  });

  it('closes an open group (CommandGroupEnd.java:67)', () => {
    const diagram = newGantt();
    applyCommandGroupStart(diagram, COMMAND_GROUP_START_RE.exec('group [G]')!);
    expect(applyCommandGroupEnd(diagram, COMMAND_GROUP_END_RE.exec('end group')!).isOk()).toBe(true);
    expect(applyCommandGroupEnd(diagram, COMMAND_GROUP_END_RE.exec('end group')!).getError()).toBe(
      'No group to be closed',
    );
  });
});
