import { describe, expect, it } from 'vitest';
import { Failable } from '../../../../src/core/gantt/Failable.js';
import { UBrexLeaf } from '../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { PairOfSomething } from '../../../../src/diagrams/gantt/lang/PairOfSomething.js';
import type { Something } from '../../../../src/diagrams/gantt/lang/Something.js';

// Expected values: PairOfSomething.java (gantt/lang).
const noArg = { findFirstValueByKey: () => undefined, findValuesByKey: () => [] };

function fixed(result: Failable<unknown>, pattern: string, calls: string[], name: string): Something<string> {
  return {
    getMe: () => {
      calls.push(name);
      return result;
    },
    toUnicodeBracketedExpressionComplement: () => new UBrexLeaf(pattern),
  };
}

describe('PairOfSomething', () => {
  it('returns both values as a two-element array (java:56-66)', () => {
    const calls: string[] = [];
    const pair = new PairOfSomething(
      fixed(Failable.ok('a'), 'x', calls, 'one'),
      fixed(Failable.ok(2), 'y', calls, 'two'),
    );
    expect(pair.getMe('d', noArg).get()).toEqual(['a', 2]);
  });

  it('returns the first failure but still evaluates both (java:57-62)', () => {
    const calls: string[] = [];
    const e1 = Failable.error<string>('first', 1);
    const e2 = Failable.error<string>('second', 2);
    const pair = new PairOfSomething(fixed(e1, 'x', calls, 'one'), fixed(e2, 'y', calls, 'two'));
    expect(pair.getMe('d', noArg)).toBe(e1);
    expect(calls).toEqual(['one', 'two']);
  });

  it('returns the second failure when only it fails (java:62-63)', () => {
    const e2 = Failable.error<string>('second', 2);
    const pair = new PairOfSomething(fixed(Failable.ok('a'), 'x', [], 'one'), fixed(e2, 'y', [], 'two'));
    expect(pair.getMe('d', noArg)).toBe(e2);
  });

  it('concatenates the complements with one-or-more spaces (java:68-74)', () => {
    const pair = new PairOfSomething(
      fixed(Failable.ok(1), '「a」', [], 'one'),
      fixed(Failable.ok(2), '「b」', [], 'two'),
    );
    const part = pair.toUnicodeBracketedExpressionComplement();
    expect(part.match('a   b').exactMatch()).toBe(true);
    expect(part.match('ab').exactMatch()).toBe(false);
  });
});
