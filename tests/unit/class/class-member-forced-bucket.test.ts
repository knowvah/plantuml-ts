/**
 * A2s R2f pasova-33-toze386: the `{method}`/`{field}` documentation tags are
 * stripped from the display AND recorded as a FORCED compartment bucket —
 * upstream's field/method split checks the raw line for the tags BEFORE
 * falling back to the paren scan:
 *   if raw contains "{method}" → method;
 *   else if raw contains "{field}" → field;
 *   else parens decide.
 * @see ~/git/plantuml/.../cucadiagram/BodierLikeClassOrObject.java:102-111 (isMethod)
 */
import { describe, it, expect } from 'vitest';
import { parseMemberLine } from '../../../src/diagrams/class/class-member-parser.js';
import { isMethodMember } from '../../../src/diagrams/class/class-member-rows.js';

describe('parseMemberLine — {method}/{field} forced bucket (pasova-33-toze386)', () => {
  it('records forcedBucket=method for a paren-less {method}-tagged line', () => {
    const m = parseMemberLine('- {method} foo');
    expect(m).not.toBeNull();
    expect(m!.name).toBe('foo');
    expect(m!.forcedBucket).toBe('method');
    expect(m!.visibility).toBe('-');
  });

  it('records forcedBucket=field for a paren-carrying {field}-tagged line', () => {
    const m = parseMemberLine('+ {field} bar()');
    expect(m).not.toBeNull();
    expect(m!.name).toBe('bar');
    expect(m!.params).toEqual([]);
    expect(m!.forcedBucket).toBe('field');
  });

  it('{method} wins over {field} when both appear (upstream checks {method} first)', () => {
    const m = parseMemberLine('{field} {method} x');
    expect(m!.forcedBucket).toBe('method');
  });

  it('leaves forcedBucket unset for an untagged line (existing toEqual assertions rely on this)', () => {
    const m = parseMemberLine('+name: String');
    expect(m!.forcedBucket).toBeUndefined();
  });

  it('detection is case-sensitive like upstream isMethod (only display-strip is (?i))', () => {
    // `{METHOD}` is stripped from the display (REMOVE_TAG_PATTERN is (?i))
    // but does NOT force the bucket (BodierLikeClassOrObject#isMethod uses
    // case-sensitive String#contains on the raw line).
    const m = parseMemberLine('{METHOD} foo');
    expect(m!.name).toBe('foo');
    expect(m!.forcedBucket).toBeUndefined();
  });
});

describe('isMethodMember — forcedBucket consulted first', () => {
  const base = { visibility: '+' as const, isStatic: false, isAbstract: false };

  it('forcedBucket=method beats the missing-params field default', () => {
    expect(isMethodMember({ ...base, name: 'foo', forcedBucket: 'method' })).toBe(true);
  });

  it('forcedBucket=field beats the params-present method default', () => {
    expect(isMethodMember({ ...base, name: 'bar', params: [], forcedBucket: 'field' })).toBe(false);
  });

  it('forcedBucket=field beats the raw-display paren scan', () => {
    expect(
      isMethodMember({ ...base, name: 'b()x', rawDisplay: 'b()x', forcedBucket: 'field' }),
    ).toBe(false);
  });

  it('without forcedBucket the pre-existing rules are unchanged', () => {
    expect(isMethodMember({ ...base, name: 'foo' })).toBe(false);
    expect(isMethodMember({ ...base, name: 'foo', params: [] })).toBe(true);
    expect(isMethodMember({ ...base, name: 'x', rawDisplay: 'x(' })).toBe(true);
  });
});
