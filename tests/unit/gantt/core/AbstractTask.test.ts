import { describe, expect, it } from 'vitest';
import type { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { AbstractTask, unsupportedOperation } from '../../../../src/diagrams/gantt/core/AbstractTask.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/AbstractTask.java
const STYLE = {} as unknown as StyleBuilder;
const END = TimePoint.of(LocalDateTime.of(2024, 3, 5, 0, 0));

class Probe extends AbstractTask {
  constructor(style: StyleBuilder, code: TaskCode) {
    super(style, code);
  }
  getStart = unsupportedOperation;
  getEnd(): TimePoint {
    return END;
  }
  getLoad = unsupportedOperation;
  setLoad = unsupportedOperation;
  setStart = unsupportedOperation;
  setEnd = unsupportedOperation;
  setColors = unsupportedOperation;
  addResource = unsupportedOperation;
  setDiamond = unsupportedOperation;
  isDiamond = unsupportedOperation;
  setCompletion = unsupportedOperation;
  setUrl = unsupportedOperation;
  addPause = unsupportedOperation;
  setNote = unsupportedOperation;
  isAssignedTo = unsupportedOperation;
}

const make = (id: string): Probe => new Probe(STYLE, TaskCode.fromId(id));

describe('AbstractTask', () => {
  it('keeps the code and style builder it was built with (java:50-53, :66-74)', () => {
    const code = TaskCode.fromId('T1');
    const t = new Probe(STYLE, code);
    expect(t.getCode()).toBe(code);
    expect(t.getStyleBuilder()).toBe(STYLE);
  });

  it('putInSameRowAs records another task, never itself (java:55-59)', () => {
    const a = make('a');
    const b = make('b');
    expect(a.getRow()).toBeUndefined();
    a.putInSameRowAs(a);
    expect(a.getRow()).toBeUndefined();
    a.putInSameRowAs(b);
    expect(a.getRow()).toBe(b);
  });

  it('display string and stereotype are plain properties (java:76-94)', () => {
    const t = make('a');
    expect(t.getDisplayString()).toBeUndefined();
    expect(t.getStereotype()).toBeUndefined();
    t.setDisplay('shown');
    const st = {} as Stereotype;
    t.setStereotype(st);
    expect(t.getDisplayString()).toBe('shown');
    expect(t.getStereotype()).toBe(st);
  });

  it('inherits Moment#getEndMinusOneDayTOBEREMOVED = end.decrement() (Moment.java default)', () => {
    expect(make('a').getEndMinusOneDayTOBEREMOVED().toString()).toBe('2024-03-04T00:00');
  });

  it('unsupportedOperation throws UnsupportedOperationException', () => {
    expect(() => unsupportedOperation()).toThrow('UnsupportedOperationException');
  });
});
