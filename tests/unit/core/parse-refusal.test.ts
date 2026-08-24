/**
 * The refusal vocabulary this mission builds so a dispatcher can attempt a
 * parse and take the first factory that does not refuse, as upstream does.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemError.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemErrorUtils.java
 */

import { describe, it, expect } from 'vitest';
import {
  refuse,
  refusalScore,
  mergeRefusals,
  type ParseRefusal,
} from '../../../src/core/parse-refusal.js';

describe('parse-refusal — refuse', () => {
  it('builds a syntax refusal with commandScore 0 by default', () => {
    const r = refuse('syntax', 3, 3, 'Syntax Error?');
    expect(r).toEqual({
      refused: true,
      kind: 'syntax',
      line: 3,
      consumed: 3,
      message: 'Syntax Error?',
      commandScore: 0,
    });
  });

  it('carries an explicit commandScore for an execution refusal', () => {
    const r = refuse('execution', 5, 5, 'bad arrow', 42);
    expect(r.commandScore).toBe(42);
    expect(r.kind).toBe('execution');
  });
});

describe('parse-refusal — refusalScore (D2, PSystemError.java:382-384)', () => {
  it('is consumed * 10 + commandScore', () => {
    const r = refuse('execution', 2, 4, 'boom', 7);
    expect(refusalScore(r)).toBe(4 * 10 + 7);
  });

  it('is consumed * 10 for a syntax refusal (commandScore 0)', () => {
    const r = refuse('syntax', 0, 6, 'Syntax Error?');
    expect(refusalScore(r)).toBe(60);
  });
});

describe('parse-refusal — mergeRefusals (PSystemErrorUtils.mergeV2, :140-147)', () => {
  it('AC1: the refusal with more consumed lines wins', () => {
    const shallow = refuse('syntax', 0, 2, 'Syntax Error?');
    const deep = refuse('syntax', 0, 9, 'Syntax Error?');
    expect(mergeRefusals([shallow, deep])).toBe(deep);
    expect(mergeRefusals([deep, shallow])).toBe(deep);
  });

  it('AC2: with equal consumed, the higher commandScore wins', () => {
    const low = refuse('execution', 4, 5, 'weak', 1);
    const high = refuse('execution', 4, 5, 'strong', 9);
    expect(mergeRefusals([low, high])).toBe(high);
    expect(mergeRefusals([high, low])).toBe(high);
  });

  it('keeps the first refusal on an exact score tie (strict `<` upstream)', () => {
    const first = refuse('syntax', 0, 3, 'Syntax Error?');
    const second = refuse('final', 1, 3, 'final error');
    expect(mergeRefusals([first, second])).toBe(first);
  });

  it('AC4: throws on an empty array, mirroring PSystemErrorUtils.merge (:112-114)', () => {
    expect(() => mergeRefusals([])).toThrow();
  });
});

describe('parse-refusal — AC3: syntax refusal commandScore (PSystemCommandFactory.java:171)', () => {
  it('is 0 regardless of the consumed count', () => {
    expect(refuse('syntax', 0, 0, 'Syntax Error?').commandScore).toBe(0);
    expect(refuse('syntax', 12, 12, 'Syntax Error?').commandScore).toBe(0);
  });
});

describe('parse-refusal — AC5: refused discriminates without a cast', () => {
  interface FakeAst {
    readonly kind: 'ast';
    readonly value: number;
  }

  function narrow(input: FakeAst | ParseRefusal): string {
    // `FakeAst` has no `refused` field at all -- the `in` check narrows the
    // union on PRESENCE of the discriminant, with no cast either way.
    if ('refused' in input) {
      return `refused:${input.kind}`;
    }
    return `ast:${input.value}`;
  }

  it('narrows a ParseRefusal out of an AST union on the refused discriminant', () => {
    const refusal: ParseRefusal = refuse('incomplete', 1, 1, 'incomplete');
    expect(narrow(refusal)).toBe('refused:incomplete');
  });

  it('narrows an AST value out of the same union', () => {
    const ast: FakeAst = { kind: 'ast', value: 5 };
    expect(narrow(ast)).toBe('ast:5');
  });
});
