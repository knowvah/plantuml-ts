import { describe, expect, it } from 'vitest';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import { SubjectGantt } from '../../../../src/diagrams/gantt/lang/SubjectGantt.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: SubjectGantt.java:61-86.
const subject = SubjectGantt.ME;
const subjectMatch = (s: string) => subject.toUnicodeBracketedExpressionSubject().match(s);
const line = (s: string): StringLocated => new StringLocated(s, undefined);

describe('SubjectGantt', () => {
  it.each(['project', 'gantt', 'Project'])('subject accepts %s (java:63)', (s) => {
    expect(subjectMatch(s).getAcceptedMatch()).toBe(s);
  });

  it.each(['projects', 'task', 'proj', ' project'])('subject rejects %s (java:63)', (s) => {
    expect(subjectMatch(s).exactMatch()).toBe(false);
  });

  it('getMe returns the gantt itself (java:84-86)', () => {
    const gantt = newGantt();
    expect(subject.getMe(gantt, subjectMatch('project')).get()).toBe(gantt);
  });

  it('has the single "starts" verb phrase (java:69-80)', () => {
    expect(subject.getVerbPhrases()).toHaveLength(1);
    expect(subject.getVerbPhrases()[0]!.toString()).toContain('ComplementDate');
  });

  // Corpus sentences: test-results/dot-cache/gantt/*/in.puml ("Project starts 2020-07-01",
  // "Project starts the 20th of september 2018", "project starts on 2023-12-01").
  it.each([
    ['Project starts 2020-07-01', '2020-07-01'],
    ['project starts on 2023-12-01', '2023-12-01'],
    ['gantt starts for the 2018/04/03', '2018-04-03'],
    ['Project starts the 20th of september 2018', '2018-09-20'],
  ])('%j sets the starting point to %s (java:69-80 -> GanttDiagram.updateStartingPoint)', (text, expected) => {
    const gantt = newGantt();
    const command = new NaturalGanttCommand(subject);
    expect(command.isValid(line(text))).toBe('OK');
    const result = command.execute(gantt, line(text), ParserPass.ONE);
    expect(result.isOk()).toBe(true);
    expect(gantt.getMinDay().toString()).toBe(expected);
  });

  it('a relative date is not accepted: ComplementDate.onlyAbsolute (java:70)', () => {
    const command = new NaturalGanttCommand(subject);
    expect(command.isValid(line('project starts d+1'))).toBe('NOT_OK');
  });
});
