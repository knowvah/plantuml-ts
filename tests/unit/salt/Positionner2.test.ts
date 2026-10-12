/**
 * `Positionner2` (Positionner2.java:44-113). Every expectation is the
 * oracle jar's own `Positionner2` output for the same token sequence
 * (`fixtures/Positionner2Probe.java`, 1.2026.8beta1): `e,` adds with
 * `NEWCOL`, `e;` adds with `NEWLINE`, `*,`/`*;` merge left.
 */
import { describe, expect, it } from 'vitest';
import type { Element } from '../../../src/diagrams/salt/element/Element.js';
import { ElementEmpty } from '../../../src/diagrams/salt/element/ElementEmpty.js';
import { Positionner2 } from '../../../src/diagrams/salt/Positionner2.js';
import { Terminated } from '../../../src/diagrams/salt/Terminated.js';
import { Terminator } from '../../../src/diagrams/salt/Terminator.js';

interface Placed {
  readonly cells: string[];
  readonly rows: number;
  readonly cols: number;
}

/** Runs a probe scenario through the port and reports what the probe prints. */
function run(scenario: string): Placed {
  const p = new Positionner2();
  for (const tok of scenario.split(' ')) {
    const t = tok[1] === ',' ? Terminator.NEWCOL : Terminator.NEWLINE;
    if (tok[0] === '*') p.mergeLeft(t);
    else p.add(new Terminated<Element>(new ElementEmpty(), t));
  }
  return { cells: [...p.getAll().values()].map((c) => c.toString()), rows: p.getNbRows(), cols: p.getNbCols() };
}

describe('Positionner2 — jar probe scenarios', () => {
  it('a single NEWCOL cell is one row by one column', () => {
    expect(run('e,')).toEqual({ cells: ['(0,0)-(0,0)'], rows: 1, cols: 1 });
  });

  it('a single NEWLINE cell is one row by one column (the trailing row move is not counted)', () => {
    expect(run('e;')).toEqual({ cells: ['(0,0)-(0,0)'], rows: 1, cols: 1 });
  });

  it('NEWCOL moves right, NEWLINE starts the next row at column 0', () => {
    expect(run('e, e, e; e; e, e;')).toEqual({
      cells: ['(0,0)-(0,0)', '(0,1)-(0,1)', '(0,2)-(0,2)', '(1,0)-(1,0)', '(2,0)-(2,0)', '(2,1)-(2,1)'],
      rows: 3,
      cols: 3,
    });
  });

  it('mergeLeft widens the last cell and moves on like an add', () => {
    expect(run('e, *, e; e; e, *, *;')).toEqual({
      cells: ['(0,0)-(0,1)', '(0,2)-(0,2)', '(1,0)-(1,0)', '(2,0)-(2,2)'],
      rows: 3,
      cols: 3,
    });
  });

  it('a merge at the start of a row widens the previous row`s last cell', () => {
    expect(run('e, e; *, e;')).toEqual({ cells: ['(0,0)-(0,0)', '(0,1)-(0,2)', '(1,1)-(1,1)'], rows: 2, cols: 2 });
  });

  it('mergeLeft counts the max BEFORE moving: a NEWLINE merge adds a row, not a column', () => {
    expect(run('e; e; *;')).toEqual({ cells: ['(0,0)-(0,0)', '(1,0)-(1,1)'], rows: 3, cols: 1 });
  });

  it('a NEWCOL-then-NEWLINE merge counts the column it stood on', () => {
    expect(run('e, e, e, *;')).toEqual({
      cells: ['(0,0)-(0,0)', '(0,1)-(0,1)', '(0,2)-(0,3)'],
      rows: 1,
      cols: 4,
    });
  });

  it('mergeLeft before any add is the jar`s NullPointerException', () => {
    expect(() => run('*;')).toThrow(/NullPointerException/);
  });
});

describe('Positionner2#getAll', () => {
  it('keeps insertion order and maps each element to its own cell', () => {
    const a = new ElementEmpty();
    const b = new ElementEmpty();
    const p = new Positionner2();
    p.add(new Terminated<Element>(a, Terminator.NEWCOL));
    p.add(new Terminated<Element>(b, Terminator.NEWLINE));
    const all = p.getAll();
    expect([...all.keys()]).toEqual([a, b]);
    expect(all.get(a)?.toString()).toBe('(0,0)-(0,0)');
    expect(all.get(b)?.toString()).toBe('(0,1)-(0,1)');
  });

  it('re-adding an element moves it to its new cell but keeps its first position (LinkedHashMap#put)', () => {
    const a = new ElementEmpty();
    const b = new ElementEmpty();
    const p = new Positionner2();
    p.add(new Terminated<Element>(a, Terminator.NEWLINE));
    p.add(new Terminated<Element>(b, Terminator.NEWLINE));
    p.add(new Terminated<Element>(a, Terminator.NEWLINE));
    expect([...p.getAll().keys()]).toEqual([a, b]);
    expect(p.getAll().get(a)?.toString()).toBe('(2,0)-(2,0)');
    expect(p.getNbRows()).toBe(3);
  });
});
