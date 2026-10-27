import { describe, expect, it } from 'vitest';
import { CommandControl } from '../../../../src/core/command/CommandControl.js';
import { CommandExecutionResult } from '../../../../src/core/command/CommandExecutionResult.js';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import { Failable } from '../../../../src/core/gantt/Failable.js';
import { NoSuchColorException } from '../../../../src/core/klimt/color/NoSuchColorException.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { UBrexLeaf } from '../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import type { TaskImpl } from '../../../../src/diagrams/gantt/core/TaskImpl.js';
import { ComplementAnything } from '../../../../src/diagrams/gantt/lang/ComplementAnything.js';
import type { Subject } from '../../../../src/diagrams/gantt/lang/Subject.js';
import { SubjectGantt } from '../../../../src/diagrams/gantt/lang/SubjectGantt.js';
import { SubjectTask } from '../../../../src/diagrams/gantt/lang/SubjectTask.js';
import { SubjectToday } from '../../../../src/diagrams/gantt/lang/SubjectToday.js';
import { Verbs } from '../../../../src/diagrams/gantt/lang/Verbs.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { VerbPhraseAction } from '../../../../src/diagrams/gantt/ulang/VerbPhraseAction.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: NaturalGanttCommand.java:59-151. Corpus sentences come from
// test-results/dot-cache/gantt/*/in.puml and tests/fixtures/gantt/*.puml.
const line = (s: string): StringLocated => new StringLocated(s, undefined);
const task = (gantt: GanttDiagram, id: string): TaskImpl => gantt.getExistingTask(id) as TaskImpl;

/** Run a corpus script through the right subject, the way the (T7c) factory dispatches it. */
function play(gantt: GanttDiagram, sentences: string[]): string[] {
  const results: string[] = [];
  for (const text of sentences) {
    const subject = /^(project|gantt)\b/i.test(text)
      ? SubjectGantt.ME
      : /^today\b/i.test(text)
        ? SubjectToday.ME
        : SubjectTask.ME;
    const command = new NaturalGanttCommand(subject);
    expect(command.isValid(line(text))).toBe(CommandControl.OK);
    const result = command.execute(gantt, line(text), ParserPass.ONE);
    results.push(result.isOk() ? 'ok' : result.getError());
  }
  return results;
}

describe('NaturalGanttCommand corpus sentences', () => {
  it('"[A] lasts 5 days" and "[B] starts at [A]\'s end" (java:73-121)', () => {
    const gantt = newGantt();
    const results = play(gantt, [
      'Project starts 2020-07-01',
      '[Prototype design] lasts 13 days',
      "[Test prototype] starts at [Prototype design]'s end and lasts 2 weeks",
    ]);
    expect(results).toEqual(['ok', 'ok', 'ok']);
    expect(gantt.getMinDay().toString()).toBe('2020-07-01');
    expect(
      task(gantt, 'Prototype design')
        .getLoad()
        .equals(Load.of(Duration.ofDays(13))),
    ).toBe(true);
    expect(task(gantt, 'Prototype design').getEnd().toString()).toBe('2020-07-14T00:00');
    // starts at the other task's end, then the "and lasts 2 weeks" phrase sets the load (java:103-115 loop)
    expect(task(gantt, 'Test prototype').getStart().toString()).toBe('2020-07-14T00:00');
    expect(task(gantt, 'Test prototype').getEnd().toString()).toBe('2020-07-28T00:00');
  });

  it('"today is 30 days after start and is colored in #AAF" runs two phrases (java:112-119)', () => {
    const gantt = newGantt();
    const results = play(gantt, ['Project starts 2020-07-01', 'today is 30 days after start and is colored in #AAF']);
    expect(results).toEqual(['ok', 'ok']);
    expect(gantt.getToday().toString()).toBe('2020-07-31');
  });

  it('"[Prototype completed] happens at [TASK1]\'s end" makes a diamond (java:73-121)', () => {
    const gantt = newGantt();
    const results = play(gantt, [
      'Project starts the 20th of september 2018',
      '[TASK1] lasts 4 days',
      "[Prototype completed] happens at [TASK1]'s end",
    ]);
    expect(results).toEqual(['ok', 'ok', 'ok']);
    expect(task(gantt, 'Prototype completed').isDiamond()).toBe(true);
    expect(task(gantt, 'Prototype completed').getStart().toString()).toBe('2018-09-23T00:00');
  });

  it('"[foo] is 40% completed" and "[bar] lasts 30 days and is 10% complete" (corpus)', () => {
    const gantt = newGantt();
    const results = play(gantt, [
      'Project starts 2020-07-01',
      '[foo] is 40% completed',
      '[bar] lasts 30 days and is 10% complete',
    ]);
    expect(results).toEqual(['ok', 'ok', 'ok']);
    expect(task(gantt, 'foo').getCompletion()).toBe(40);
    expect(task(gantt, 'bar').getCompletion()).toBe(10);
    expect(
      task(gantt, 'bar')
        .getLoad()
        .equals(Load.of(Duration.ofDays(30))),
    ).toBe(true);
  });

  it('"[TASK1] as [T1] starts on 2020-05-29 and ends on 2020-06-30" (corpus)', () => {
    const gantt = newGantt();
    const results = play(gantt, [
      'Project starts 2020-05-01',
      '[TASK1] as [T1] starts on 2020-05-29 and ends on 2020-06-30',
    ]);
    expect(results).toEqual(['ok', 'ok']);
    expect(task(gantt, 'T1').getStart().toString()).toBe('2020-05-29T00:00');
    expect(task(gantt, 'T1').getEnd().toString()).toBe('2020-07-01T00:00');
  });
});

describe('NaturalGanttCommand.isValid (java:124-145)', () => {
  const command = new NaturalGanttCommand(SubjectTask.ME);

  it.each(['[A] lasts 5 days', '   [A] lasts 5 days', "[B] starts at [A]'s end", 'it is deleted'])(
    'OK for %j',
    (text) => {
      expect(command.isValid(line(text))).toBe(CommandControl.OK);
    },
  );

  it.each([
    ['', 'empty line: no subject, java:131-132'],
    ['hello world', 'no subject'],
    ['[A]', 'subject but no verb phrase, java:142'],
    ['[A] bogus', 'subject with an unknown verb'],
    ['project starts 2020-07-01', 'a gantt sentence is not a task sentence'],
  ])('NOT_OK for %j (%s)', (text) => {
    expect(command.isValid(line(text))).toBe(CommandControl.NOT_OK);
  });

  it('isEligibleFor is pass ONE only (java:147-150)', () => {
    expect(command.isEligibleFor(ParserPass.ONE)).toBe(true);
    expect(command.isEligibleFor(ParserPass.TWO)).toBe(false);
  });
});

describe('NaturalGanttCommand.execute failures (java:73-121)', () => {
  const command = new NaturalGanttCommand(SubjectTask.ME);
  const run = (gantt: GanttDiagram, text: string) => command.execute(gantt, line(text), ParserPass.ONE);

  it('a failing subject returns its error (java:88-89)', () => {
    const result = run(newGantt(), 'it is deleted');
    expect(result.isOk()).toBe(false);
    expect(result.getError()).toBe('Not sure what are you refering to?');
  });

  it('a failing complement returns its error (java:99-101)', () => {
    const gantt = newGantt();
    gantt.updateStartingPoint(LocalDate.of(2020, 7, 1));
    const result = run(gantt, "[B] starts at [Nope]'s end");
    expect(result.getError()).toBe('No such task Nope');
  });

  it('a failing verb phrase returns that result (java:103-105)', () => {
    const result = run(newGantt(), '[B] starts at 2020-07-03');
    expect(result.getError()).toBe('No starting date for the project');
  });

  it('a trailing "and" with no valid phrase after it is "No matching verb phrase" (java:92,120)', () => {
    const gantt = newGantt();
    gantt.updateStartingPoint(LocalDate.of(2020, 7, 1));
    const result = run(gantt, '[B] lasts 2 days and nonsense');
    expect(result.getError()).toBe('No matching verb phrase');
    // the first phrase already ran (java:103-119): its effect is kept
    expect(
      task(gantt, 'B')
        .getLoad()
        .equals(Load.of(Duration.ofDays(2))),
    ).toBe(true);
  });

  it('a sentence no phrase can check is "No matching verb phrase" (java:120)', () => {
    const gantt = newGantt();
    gantt.updateStartingPoint(LocalDate.of(2020, 7, 1));
    expect(run(gantt, "[B] starts at 3 days after [A]'s end").getError()).toBe('No matching verb phrase');
  });
});

describe('NaturalGanttCommand with a synthetic subject', () => {
  // SYNTHETIC: a throwing verb phrase, to reach the NoSuchColorException catch of java:75 (the declared `throws`)
  // that no stock phrase raises at execute time.
  class Throwing extends VerbPhraseAction {
    override execute(): CommandExecutionResult {
      throw new NoSuchColorException();
    }
  }
  const synthetic: Subject<GanttDiagram> = {
    toUnicodeBracketedExpressionSubject: () => new UBrexLeaf('thing'),
    getMe: () => Failable.ok('thing'),
    getVerbPhrases: () => [new Throwing(Verbs.is, new ComplementAnything())],
  };

  it('NoSuchColorException is mapped to CommandExecutionResult.badColor() (java:75)', () => {
    const result = new NaturalGanttCommand(synthetic).execute(newGantt(), line('thing is whatever'), ParserPass.ONE);
    expect(result.isOk()).toBe(false);
    expect(result.getError()).toBe(CommandExecutionResult.badColor().getError());
  });

  it('any other exception propagates', () => {
    class Boom extends VerbPhraseAction {
      override execute(): CommandExecutionResult {
        throw new Error('boom');
      }
    }
    const boom: Subject<GanttDiagram> = {
      ...synthetic,
      getVerbPhrases: () => [new Boom(Verbs.is, new ComplementAnything())],
    };
    expect(() => new NaturalGanttCommand(boom).execute(newGantt(), line('thing is whatever'), ParserPass.ONE)).toThrow(
      'boom',
    );
  });
});
