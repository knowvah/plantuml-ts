import { describe, expect, it } from 'vitest';
import { Failable } from '../../../../src/core/gantt/Failable.js';
import { UBrexLeaf } from '../../../../src/core/ubrex/builder/UBrexLeaf.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import type { Subject } from '../../../../src/diagrams/gantt/lang/Subject.js';
import { SubjectGantt } from '../../../../src/diagrams/gantt/lang/SubjectGantt.js';
import { SubjectTask } from '../../../../src/diagrams/gantt/lang/SubjectTask.js';
import { SubjectToday } from '../../../../src/diagrams/gantt/lang/SubjectToday.js';
import { SubjectWorkingHours } from '../../../../src/diagrams/gantt/lang/SubjectWorkingHours.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Subject.java:44-52 is an interface with three members; it has no runtime body, so the tests pin the contract through
// a conforming object and through the four upstream implementations.
describe('Subject', () => {
  it('a conforming object exposes the three members (Subject.java:46-50)', () => {
    const subject: Subject<number> = {
      toUnicodeBracketedExpressionSubject: () => new UBrexLeaf('me'),
      getMe: (diagram: number) => Failable.ok(diagram + 1),
      getVerbPhrases: () => [],
    };
    expect(subject.toUnicodeBracketedExpressionSubject().match('me').getAcceptedMatch()).toBe('me');
    expect(subject.getMe(41, subject.toUnicodeBracketedExpressionSubject().match('me')).get()).toBe(42);
    expect(subject.getVerbPhrases()).toEqual([]);
  });

  it.each([
    ['SubjectTask', SubjectTask.ME, 24],
    ['SubjectGantt', SubjectGantt.ME, 1],
    ['SubjectToday', SubjectToday.ME, 2],
    ['SubjectWorkingHours', SubjectWorkingHours.ME, 1],
  ] as const)('%s implements Subject<GanttDiagram> with its upstream verb-phrase count', (_name, subject, count) => {
    const gantt: GanttDiagram = newGantt();
    expect(subject.getVerbPhrases()).toHaveLength(count);
    expect(subject.toUnicodeBracketedExpressionSubject().getChallenge()).toBeDefined();
    expect(typeof subject.getMe).toBe('function');
    expect(gantt).toBeDefined();
  });
});
