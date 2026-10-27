import { describe, expect, it } from 'vitest';
import { Words } from '../../../../src/diagrams/gantt/lang/Words.js';

const exact = (p: { match(s: string): { exactMatch(): boolean } }, s: string): boolean => p.match(s).exactMatch();

describe('Words', () => {
  it('keyword constants (Words.java:46-65)', () => {
    expect([Words.AFTER, Words.AND, Words.AS, Words.AT, Words.BEFORE, Words.COMPLETION]).toEqual([
      'after',
      'and',
      'as',
      'at',
      'before',
      'completion',
    ]);
    expect([Words.DAY, Words.END, Words.FOR, Words.FROM, Words.ON, Words.START]).toEqual([
      'day',
      'end',
      'for',
      'from',
      'on',
      'start',
    ]);
    expect([Words.THE, Words.TO, Words.WEEK, Words.WITH, Words.WORKING, Words.THEN, Words.IT]).toEqual([
      'the',
      'to',
      'week',
      'with',
      'working',
      'then',
      'it',
    ]);
  });

  it('uoneOf accepts exactly one of the words (Words.java:76-82)', () => {
    const p = Words.uoneOf('starts', 'ends');
    expect(exact(p, 'starts')).toBe(true);
    expect(exact(p, 'ends')).toBe(true);
    expect(exact(p, 'start')).toBe(false);
    expect(exact(p, 'starts ends')).toBe(false);
  });

  it('usingle is one literal (Words.java:103-105)', () => {
    const p = Words.usingle('then');
    expect(exact(p, 'then')).toBe(true);
    expect(exact(p, 'there')).toBe(false);
  });

  it('uzeroOrMore matches word + spaces repeated (Words.java:67-74)', () => {
    const p = Words.uzeroOrMore('the', 'and');
    expect(exact(p, '')).toBe(true);
    expect(exact(p, 'the ')).toBe(true);
    expect(exact(p, 'the and  the ')).toBe(true);
    expect(exact(p, 'the')).toBe(false);
    expect(exact(p, 'or ')).toBe(false);
  });

  it('uexactly prefixes every word with spaces (Words.java:84-91)', () => {
    const p = Words.uexactly('on', 'the');
    expect(exact(p, ' on the')).toBe(true);
    expect(exact(p, '   on  the')).toBe(true);
    expect(exact(p, 'on the')).toBe(false);
    expect(exact(p, ' on')).toBe(false);
  });

  it('uexactly2 separates words with spaces only (Words.java:93-101)', () => {
    const p = Words.uexactly2('working', 'on');
    expect(exact(p, 'working on')).toBe(true);
    expect(exact(p, 'working   on')).toBe(true);
    expect(exact(p, ' working on')).toBe(false);
    expect(exact(p, 'workingon')).toBe(false);
  });

  it('uconcat concatenates parts (Words.java:107-109)', () => {
    const p = Words.uconcat(Words.usingle('a'), Words.usingle('b'));
    expect(exact(p, 'ab')).toBe(true);
    expect(exact(p, 'a b')).toBe(false);
  });
});
