import { describe, expect, it } from 'vitest';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { UBrexLeaf } from '../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { NaturalGanttCommand } from '../../../../src/diagrams/gantt/command/NaturalGanttCommand.js';
import type { GanttConstraint } from '../../../../src/diagrams/gantt/GanttConstraint.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import type { Task } from '../../../../src/diagrams/gantt/core/Task.js';
import type { TaskImpl } from '../../../../src/diagrams/gantt/core/TaskImpl.js';
import { SubjectTask } from '../../../../src/diagrams/gantt/lang/SubjectTask.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: SubjectTask.java (line numbers in each test title). Sentences are the corpus forms from
// test-results/dot-cache/gantt/*/in.puml and tests/fixtures/gantt/*.puml; dates follow from a project start of
// 2020-07-01 (a Wednesday) and the day arithmetic of TaskImpl.
const subject = SubjectTask.ME;
const subjectMatch = (s: string) => subject.toUnicodeBracketedExpressionSubject().match(s);
const line = (s: string): StringLocated => new StringLocated(s, undefined);
const command = new NaturalGanttCommand(subject);

const START = LocalDate.of(2020, 7, 1);

/** A gantt with a project start and `[A] lasts 5 days` (2020-07-01 .. 2020-07-06, end exclusive). */
function started(withA = true): GanttDiagram {
  const gantt = newGantt();
  gantt.updateStartingPoint(START);
  if (withA) say(gantt, '[A] lasts 5 days');
  return gantt;
}

/** Run one sentence and return the result message (`'ok'` or the error). */
function say(gantt: GanttDiagram, text: string): string {
  expect(command.isValid(line(text))).toBe('OK');
  const result = command.execute(gantt, line(text), ParserPass.ONE);
  return result.isOk() ? 'ok' : result.getError();
}

const task = (gantt: GanttDiagram, id: string): Task => {
  const t = gantt.getExistingTask(id);
  if (t === undefined) throw new Error('missing task ' + id);
  return t;
};
const startOf = (gantt: GanttDiagram, id: string): string => task(gantt, id).getStart().toString();
const endOf = (gantt: GanttDiagram, id: string): string => task(gantt, id).getEnd().toString();
const constraintsOf = (gantt: GanttDiagram): GanttConstraint[] =>
  (gantt as unknown as { modelData: { getConstraints(): GanttConstraint[] } }).modelData.getConstraints();
const hex = (c: unknown): string => (c as HColorSimple).asString();

describe('SubjectTask static members', () => {
  it('REGEX_TASK_CODE is the legacy task-code regex (java:76)', () => {
    expect(SubjectTask.REGEX_TASK_CODE).toBe('\\[([^\\[\\]]+?)\\]');
    expect(new RegExp(SubjectTask.REGEX_TASK_CODE).exec('[Prototype design]')?.[1]).toBe('Prototype design');
  });

  it.each(['[A]', '[Prototype design]', '[Design phase/Test prototype]', '[x y z]'])(
    'taskCode accepts %s (java:78-83)',
    (s) => {
      const m = SubjectTask.taskCode('N').match(s);
      expect(m.exactMatch()).toBe(true);
      expect(m.findFirstValueByKey('N')).toBe(s.slice(1, -1));
    },
  );

  it.each(['A', '[]', '[A', 'A]', '[[A]]', '[A]x'])('taskCode rejects %s (java:78-83)', (s) => {
    expect(SubjectTask.taskCode('N').match(s).exactMatch()).toBe(false);
  });

  it('ME is the singleton subject (java:75)', () => {
    expect(SubjectTask.ME).toBe(SubjectTask.ME);
    expect(new UBrexLeaf('x')).toBeDefined();
  });
});

describe('SubjectTask subject grammar (java:416-439)', () => {
  it.each([
    'it',
    '[A]',
    'then [A]',
    '[A] <<st>>',
    '[A]<<st>>',
    '[A] as [B]',
    '[A] on {Alice}',
    '[A] on {Alice:25%}{Bob}',
    '[A] on {Alice:25%} {Bob:50%}',
    'then [A] as [B] on {Alice}',
  ])('accepts %s', (s) => {
    expect(subjectMatch(s).exactMatch()).toBe(true);
  });

  it.each([
    'A',
    '[]',
    'then',
    'then A',
    '[A] as B',
    '[A] on',
    '[A] on Alice',
    'it [A]',
    // StereotypePattern.uoptional ends in spaceZeroOrMore (StereotypePattern.java:74-77), which takes the blank that
    // Words.uexactly(AS) (Words.java:84-91) needs: the pair is never matched after a stereotype. Mirrored.
    '[A] <<st>> as [B]',
    '[A] <<st>> on {Alice}',
  ])('rejects %s', (s) => {
    expect(subjectMatch(s).exactMatch()).toBe(false);
  });

  it('captures the subject parts (java:418-436)', () => {
    const m = subjectMatch('then [Prototype design] as [P1] on {Alice:25%}{Bob}');
    expect(m.findFirstValueByKey('THEN')).toBe('then');
    expect(m.findFirstValueByKey('SUBJECT')).toBe('Prototype design');
    expect(m.findFirstValueByKey('SHORTNAME')).toBe('P1');
    expect(m.findFirstValueByKey('RESOURCE')).toBe('{Alice:25%}{Bob}');
    expect(subjectMatch('[A] <<st>>').findFirstValueByKey('STEREOTYPE')).toBe('<<st>>');
    expect(subjectMatch('it').findFirstValueByKey('IT')).toBe('it');
  });
});

describe('SubjectTask.getMe (java:441-482)', () => {
  it('creates the task from SUBJECT and makes it the current "it" (java:452-460)', () => {
    const gantt = started(false);
    const t = subject.getMe(gantt, subjectMatch('[Prototype design]')).get() as Task;
    expect(t.getCode().getId()).toBe('Prototype design');
    expect(gantt.getIt()).toBe(t);
  });

  it('SHORTNAME becomes the id, SUBJECT the display (java:456; TaskCode.fromIdAndDisplay)', () => {
    const gantt = started(false);
    const t = subject.getMe(gantt, subjectMatch('[My task1] as [TASK1]')).get() as Task;
    expect(t.getCode().getId()).toBe('TASK1');
    expect(t.getCode().getDisplay()).toBe('My task1');
    expect(gantt.getExistingTask('TASK1')).toBe(t);
  });

  it('a stereotype is attached (java:459-460)', () => {
    const t = subject.getMe(started(false), subjectMatch('[A] <<st>>')).get() as Task;
    expect(t.getStereotype()?.getStyleNames()).toEqual(['st']);
  });

  it('"it" with no current task fails (java:447-449)', () => {
    const r = subject.getMe(started(false), subjectMatch('it'));
    expect(r.isFail()).toBe(true);
    expect(r.getError()).toBe('Not sure what are you refering to?');
  });

  it('"it" returns the current task (java:446-447)', () => {
    const gantt = started();
    const a = task(gantt, 'A');
    gantt.setIt(a);
    expect(subject.getMe(gantt, subjectMatch('it')).get()).toBe(a);
  });

  it('"then" links the new task to the previous one (java:456 getOrCreateTask(code, then != null))', () => {
    const gantt = started();
    say(gantt, 'then [W] lasts 1 day');
    expect(startOf(gantt, 'W')).toBe('2020-07-06T00:00');
  });

  it('RESOURCE tokens split on { and } and each is assigned (java:468-476)', () => {
    const gantt = started(false);
    const t = subject.getMe(gantt, subjectMatch('[R] on {Alice:25%}{Bob}')).get() as Task;
    expect(t.isAssignedTo(gantt.getResource('Alice'))).toBe(true);
    expect(t.isAssignedTo(gantt.getResource('Bob'))).toBe(true);
    expect(t.isAssignedTo(gantt.getResource('Carol'))).toBe(false);
  });

  it('a blank resource token is skipped (java:470: part.length() > 0 after trim)', () => {
    const gantt = started(false);
    const t = subject.getMe(gantt, subjectMatch('[R] on { }')).get() as Task;
    expect(t.getCode().getId()).toBe('R');
  });

  it('a resource at 0% is rejected (java:471-473; GanttDiagram.affectResource)', () => {
    const r = subject.getMe(started(false), subjectMatch('[R] on {Alice:0%}'));
    expect(r.isFail()).toBe(true);
    expect(r.getError()).toBe('Bad argument for resource');
  });
});

describe('SubjectTask verb phrases through NaturalGanttCommand', () => {
  it('has the 24 phrases in upstream order (java:91-411)', () => {
    const names = subject.getVerbPhrases().map((p) => p.toString().split(' ').at(-1));
    expect(names).toEqual([
      'ComplementDuration',
      'ComplementTimePoint',
      'PairOfSomething',
      'ComplementBeforeOrAfterOrAtTaskStartOrEnd',
      'ComplementDate',
      'ComplementDate',
      'ComplementInColors',
      'ComplementInColorsFromTo',
      'ComplementDate',
      'ComplementBeforeOrAfterOrAtTaskStartOrEnd',
      'ComplementFromTo',
      'ComplementTimePoint',
      'ComplementBeforeOrAfterOrAtTaskStartOrEnd',
      'ComplementDate',
      'ComplementDate',
      'ComplementNamed',
      'ComplementDeleted',
      'ComplementCompleted',
      'ComplementIntervals',
      'ComplementIntervalsSmart',
      'ComplementDate',
      'ComplementDayOfWeek',
      'ComplementUrl',
      'ComplementAnything',
    ]);
  });

  it('requires / lasts: sets the load (java:91-100)', () => {
    const gantt = started();
    expect(
      task(gantt, 'A')
        .getLoad()
        .equals(Load.of(Duration.ofDays(5))),
    ).toBe(true);
    expect(startOf(gantt, 'A')).toBe('2020-07-01T00:00');
    expect(endOf(gantt, 'A')).toBe('2020-07-06T00:00');
    say(gantt, '[B] requires 2 weeks');
    expect(
      task(gantt, 'B')
        .getLoad()
        .equals(Load.of(Duration.ofDays(14))),
    ).toBe(true);
  });

  it('starts <date time>: sets the start point (java:102-115)', () => {
    const gantt = started();
    expect(say(gantt, '[Q] starts 2020-07-01 08:00')).toBe('ok');
    expect(startOf(gantt, 'Q')).toBe('2020-07-01T08:00');
  });

  it('starts <date time> without a project start is the "No starting date" error (java:105-106)', () => {
    expect(say(newGantt(), '[Q] starts 2020-07-01 08:00')).toBe('No starting date for the project');
  });

  it("starts at [A]'s end with <style> <color> link: start + coloured constraint (java:117-138)", () => {
    const gantt = started();
    expect(say(gantt, "[D] starts at [A]'s end with dotted #FF0000 link")).toBe('ok');
    expect(startOf(gantt, 'D')).toBe('2020-07-06T00:00');
    const constraints = constraintsOf(gantt);
    expect(constraints).toHaveLength(1);
    expect(hex(constraints[0]!.getSpecificColor())).toBe('#FF0000');
    expect(constraints[0]!.getType().getStyle().toString()).toBe('DOTTED(null)'); // LinkStyle.toString: type(stroke)
  });

  it("starts at [A]'s end: start + plain constraint (java:140-154)", () => {
    const gantt = started();
    expect(say(gantt, "[B] starts at [A]'s end")).toBe('ok');
    expect(startOf(gantt, 'B')).toBe('2020-07-06T00:00');
    const constraints = constraintsOf(gantt);
    expect(constraints).toHaveLength(1);
    expect(constraints[0]!.getSpecificColor()).toBeUndefined();
  });

  it('starts N days after [A]\'s end (java:140-154; corpus "starts 20 days after [task1]\'s end")', () => {
    const gantt = started();
    expect(say(gantt, "[C] starts 20 days after [A]'s end and lasts 3 days")).toBe('ok');
    expect(startOf(gantt, 'C')).toBe('2020-07-26T00:00');
    expect(endOf(gantt, 'C')).toBe('2020-07-29T00:00');
  });

  it('a named day is a Moment but not a task: the start is set and no constraint is added (java:128,150)', () => {
    const gantt = started();
    gantt.nameDay(LocalDate.of(2020, 7, 10), 'Easter');
    expect(say(gantt, "[N1] starts at [Easter]'s start")).toBe('ok');
    expect(startOf(gantt, 'N1')).toBe('2020-07-10T00:00');
    expect(say(gantt, "[N2] starts at [Easter]'s start with dotted #FF0000 link")).toBe('ok');
    expect(startOf(gantt, 'N2')).toBe('2020-07-10T00:00');
    expect(constraintsOf(gantt)).toHaveLength(0);
  });

  it('starts d+3: relative start (java:156-166)', () => {
    const gantt = started();
    expect(say(gantt, '[E] starts d+3')).toBe('ok');
    expect(startOf(gantt, 'E')).toBe('2020-07-04T00:00');
  });

  it('starts at <date>: absolute start (java:168-180)', () => {
    const gantt = started();
    expect(say(gantt, '[D2] starts at 2020-07-03')).toBe('ok');
    expect(startOf(gantt, 'D2')).toBe('2020-07-03T00:00');
  });

  it('starts at <date> without a project start is the "No starting date" error (java:171-173)', () => {
    expect(say(newGantt(), '[D2] starts at 2020-07-03')).toBe('No starting date for the project');
  });

  it('is colored in A/B: centre and border (java:182-190)', () => {
    const gantt = started();
    expect(say(gantt, '[A] is colored in Lavender/LightBlue')).toBe('ok');
    const colors = (task(gantt, 'A') as TaskImpl).getColors()!;
    expect(hex(colors.getCenter())).toBe('#E6E6FA');
  });

  it('is colored for completion from X to Y: two colours blended by completion (java:192-201)', () => {
    const gantt = started();
    expect(say(gantt, '[A] is colored for completion from #FF0000 to #0000FF')).toBe('ok');
    // default completion is 100 -> HColors.unlinear returns the second colour
    expect(hex((task(gantt, 'A') as TaskImpl).getColors()!.getCenter())).toBe('#0000FF');
  });

  it('happens <date>: a one day diamond (java:203-214)', () => {
    const gantt = started();
    expect(say(gantt, '[F2] happens 2020-07-03')).toBe('ok');
    expect(startOf(gantt, 'F2')).toBe('2020-07-03T00:00');
    expect((task(gantt, 'F2') as TaskImpl).isDiamond()).toBe(true);
    expect(
      task(gantt, 'F2')
        .getLoad()
        .equals(Load.of(Duration.ofDays(1))),
    ).toBe(true);
  });

  it("happens at [A]'s end: the diamond sits on the last day (java:216-231)", () => {
    const gantt = started();
    expect(say(gantt, "[F] happens at [A]'s end")).toBe('ok');
    expect(startOf(gantt, 'F')).toBe('2020-07-05T00:00');
  });

  it("happens at [A]'s start: the diamond sits on the start (java:216-231)", () => {
    const gantt = started();
    expect(say(gantt, "[F3] happens at [A]'s start")).toBe('ok');
    expect(startOf(gantt, 'F3')).toBe('2020-07-01T00:00');
  });

  it('occurs from [A] to [B]: spans both and adds two constraints (java:233-256)', () => {
    const gantt = started();
    say(gantt, "[B] starts at [A]'s end and lasts 2 weeks");
    const before = constraintsOf(gantt).length;
    expect(say(gantt, '[G] occurs from [A] to [B]')).toBe('ok');
    expect(startOf(gantt, 'G')).toBe('2020-07-01T00:00');
    expect(endOf(gantt, 'G')).toBe('2020-07-20T00:00');
    expect(constraintsOf(gantt)).toHaveLength(before + 2);
  });

  it.each([
    ['[G] occurs from [Z] to [A]', 'No such Z task'],
    ['[G] occurs from [A] to [Z]', 'No such Z task'],
  ])('%s fails with %j (java:239-244)', (text, error) => {
    expect(say(started(), text)).toBe(error);
  });

  it('ends <date time>: sets the end (java:258-272)', () => {
    const gantt = started();
    expect(say(gantt, '[H] ends 2020-07-09 08:00')).toBe('ok');
    expect(endOf(gantt, 'H')).toBe('2020-07-09T08:00');
  });

  it('ends <date time> without a project start is the "No starting date" error (java:261-262)', () => {
    expect(say(newGantt(), '[H] ends 2020-07-09 08:00')).toBe('No starting date for the project');
  });

  it("ends at [A]'s start: end + constraint (java:275-285)", () => {
    const gantt = started();
    expect(say(gantt, "[H2] ends at [A]'s start")).toBe('ok');
    expect(endOf(gantt, 'H2')).toBe('2020-07-01T00:00');
    expect(constraintsOf(gantt)).toHaveLength(1);
  });

  it('ends d+9: relative end is the end of that day (java:287-297)', () => {
    const gantt = started();
    expect(say(gantt, '[H3] ends d+9')).toBe('ok');
    expect(endOf(gantt, 'H3')).toBe('2020-07-11T00:00');
  });

  it('ends at <date>: absolute end is the end of that day (java:299-311)', () => {
    const gantt = started();
    expect(say(gantt, '[H1] ends at 2020-07-09')).toBe('ok');
    expect(endOf(gantt, 'H1')).toBe('2020-07-10T00:00');
  });

  it('ends at <date> without a project start is the "No starting date" error (java:303-305)', () => {
    expect(say(newGantt(), '[H1] ends at 2020-07-09')).toBe('No starting date for the project');
  });

  it('displays on same row as [B]: shares the row (java:313-324)', () => {
    const gantt = started();
    say(gantt, '[B] lasts 2 days');
    expect(say(gantt, '[A] displays on same row as [B]')).toBe('ok');
    expect(task(gantt, 'A').getRow()).toBe(task(gantt, 'B'));
  });

  it('displays on same row as an unknown task prints the null task (java:317-319)', () => {
    expect(say(started(), '[A] displays on same row as [Nope]')).toBe('No such task null');
  });

  it('is deleted: recolours the task (java:326-332)', () => {
    const gantt = started();
    expect(say(gantt, '[A] is deleted')).toBe('ok');
    // GanttDiagram.deleteTask only recolours the task white on black (GanttDiagram.java:476-479)
    const colors = (task(gantt, 'A') as TaskImpl).getColors()!;
    expect(hex(colors.getCenter())).toBe('#FFFFFF');
  });

  it('is 40% completed: sets the completion (java:334-342)', () => {
    const gantt = started();
    expect(say(gantt, '[A] is 40% completed')).toBe('ok');
    expect((task(gantt, 'A') as TaskImpl).getCompletion()).toBe(40);
  });

  it('pauses on <date> (java:369-378)', () => {
    const gantt = started();
    expect(say(gantt, '[A] pauses on 2020-07-02')).toBe('ok');
    expect((task(gantt, 'A') as TaskImpl).getAllPaused().map((d) => d.toString())).toEqual(['2020-07-02']);
    expect(endOf(gantt, 'A')).toBe('2020-07-07T00:00');
  });

  it('pauses <date> to <date> pauses every day of the interval (java:344-355)', () => {
    const gantt = started();
    expect(say(gantt, '[A] pauses 2020-07-02 to 2020-07-03')).toBe('ok');
    expect((task(gantt, 'A') as TaskImpl).getAllPaused().map((d) => d.toString())).toEqual([
      '2020-07-02',
      '2020-07-03',
    ]);
  });

  it("pauses <date> to [B]'s end pauses up to B's last day (java:357-367)", () => {
    const gantt = started();
    say(gantt, "[B] starts at [A]'s end and lasts 2 days"); // 2020-07-06 .. 2020-07-08
    expect(say(gantt, "[A] pauses 2020-07-02 to [B]'s end")).toBe('ok');
    expect((task(gantt, 'A') as TaskImpl).getAllPaused().map((d) => d.toString())).toEqual([
      '2020-07-02',
      '2020-07-03',
      '2020-07-04',
      '2020-07-05',
      '2020-07-06',
      '2020-07-07',
    ]);
  });

  it('pauses monday: a day of week (java:380-389)', () => {
    const gantt = started(false);
    say(gantt, '[A] lasts 7 days');
    expect(endOf(gantt, 'A')).toBe('2020-07-08T00:00');
    expect(say(gantt, '[A] pauses monday')).toBe('ok');
    expect(endOf(gantt, 'A')).toBe('2020-07-09T00:00');
  });

  it('links to [[url]] (java:391-399)', () => {
    const gantt = started();
    expect(say(gantt, '[A] links to [[http://example.com]]')).toBe('ok');
    expect((task(gantt, 'A') as TaskImpl).getUrl()?.getUrl()).toBe('http://example.com');
  });

  it('is displayed as <text> (java:401-409)', () => {
    const gantt = started();
    expect(say(gantt, '[A] is displayed as Hello world')).toBe('ok');
    expect(task(gantt, 'A').getDisplayString()).toBe('Hello world');
  });

  it('"it" continues the previous sentence subject (java:446-450)', () => {
    const gantt = started();
    expect(say(gantt, 'it is 50% complete')).toBe('ok');
    expect((task(gantt, 'A') as TaskImpl).getCompletion()).toBe(50);
  });

  it('"it" before any task is an error result (java:447-449)', () => {
    expect(say(started(false), 'it is 50% complete')).toBe('Not sure what are you refering to?');
  });
});
