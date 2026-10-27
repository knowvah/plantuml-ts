import { describe, expect, it } from 'vitest';
import type { Display } from '../../../../src/core/klimt/creole/Display.js';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import type { Url } from '../../../../src/core/url/Url.js';
import { Resource } from '../../../../src/diagrams/gantt/core/Resource.js';
import { TaskSeparator } from '../../../../src/diagrams/gantt/core/TaskSeparator.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskSeparator.java
const STYLE = {} as unknown as StyleBuilder;
const UNSUPPORTED = 'UnsupportedOperationException';
const sep = (): TaskSeparator => new TaskSeparator(STYLE, 'Phase 1', 7);

describe('TaskSeparator', () => {
  it('code id is "##" + id (java:54), the name is the comment (:83-85)', () => {
    const s = sep();
    expect(s.getCode().getId()).toBe('##7');
    expect(s.getCode().getDisplay()).toBe('##7');
    expect(s.getName()).toBe('Phase 1');
    expect(s.getStyleBuilder()).toBe(STYLE);
  });

  it('setNote is a no-op and isAssignedTo is false (java:131-138)', () => {
    const s = sep();
    expect(s.setNote({} as Display, undefined)).toBeUndefined();
    expect(s.isAssignedTo(new Resource('r'))).toBe(false);
  });

  it('every date/load/colour/resource mutator or accessor throws (java:58-129)', () => {
    const s = sep();
    const tp = TimePoint.ofStartOfDay(2024, 3, 1);
    const calls: (() => unknown)[] = [
      () => s.getStart(),
      () => s.getEnd(),
      () => s.setStart(tp),
      () => s.setEnd(tp),
      () => s.setColors(),
      () => s.addResource(new Resource('r'), 100),
      () => s.getLoad(),
      () => s.setLoad(Load.zero()),
      () => s.setDiamond(true),
      () => s.isDiamond(),
      () => s.setCompletion(50),
      () => s.setUrl({} as Url),
      () => s.addPause(LocalDate.of(2024, 3, 1)),
      () => s.addPause(DayOfWeek.MONDAY),
    ];
    for (const call of calls) expect(call).toThrow(UNSUPPORTED);
  });

  it('a null comment (optional COMMENT group, GanttDiagram.java:310-314) gives an undefined name (:83-85)', () => {
    expect(new TaskSeparator(STYLE, undefined, 3).getName()).toBeUndefined();
  });
});
