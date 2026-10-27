import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/ReversedTest.java (every assertion; Java line cited per assertion).
describe('ReversedTest', () => {
  function from(string: string, position: number): TextNavigator {
    const origin = TextNavigator.build(string);
    return origin.reverse(position);
  }

  it('test0 (ReversedTest.java:16)', () => {
    const cut = from('abcd', 0);
    expect(cut.toString()).toBe(''); // ReversedTest.java:18
    expect(cut.length()).toBe(0); // ReversedTest.java:19
  });

  it('test1 (ReversedTest.java:23)', () => {
    const cut = from('abcd', 1);
    expect(cut.toString()).toBe('a'); // ReversedTest.java:25
    expect(cut.length()).toBe(1); // ReversedTest.java:26
    expect(cut.charAt(0)).toBe('a'); // ReversedTest.java:27
  });

  it('test2 (ReversedTest.java:31)', () => {
    const cut = from('abcd', 2);
    expect(cut.toString()).toBe('ba'); // ReversedTest.java:33
    expect(cut.length()).toBe(2); // ReversedTest.java:34
    expect(cut.charAt(0)).toBe('b'); // ReversedTest.java:35
    expect(cut.charAt(1)).toBe('a'); // ReversedTest.java:36
  });

  it('test3 (ReversedTest.java:40)', () => {
    const cut = from('abcd', 3);
    expect(cut.toString()).toBe('cba'); // ReversedTest.java:42
    expect(cut.length()).toBe(3); // ReversedTest.java:43
    expect(cut.charAt(0)).toBe('c'); // ReversedTest.java:44
    expect(cut.charAt(1)).toBe('b'); // ReversedTest.java:45
    expect(cut.charAt(2)).toBe('a'); // ReversedTest.java:46
  });

  it('test4 (ReversedTest.java:50)', () => {
    const cut = from('abcd', 4);
    expect(cut.toString()).toBe('dcba'); // ReversedTest.java:52
    expect(cut.length()).toBe(4); // ReversedTest.java:53
    expect(cut.charAt(0)).toBe('d'); // ReversedTest.java:54
    expect(cut.charAt(1)).toBe('c'); // ReversedTest.java:55
    expect(cut.charAt(2)).toBe('b'); // ReversedTest.java:56
    expect(cut.charAt(3)).toBe('a'); // ReversedTest.java:57
  });

  it('testSubSequenceComplete (ReversedTest.java:61)', () => {
    const seq = from('abcd', 4); // "dcba"
    expect(seq.subSequence(0, seq.length()).toString()).toBe('dcba'); // ReversedTest.java:63
  });

  it('testSubSequenceComplete1 (ReversedTest.java:67)', () => {
    const seq = from('abcd', 3); // "dcba"
    expect(seq.subSequence(0, seq.length()).toString()).toBe('cba'); // ReversedTest.java:69
  });

  it('testSubSequencePartialDebut (ReversedTest.java:73)', () => {
    const seq = from('abcd', 4); // "dcba"
    expect(seq.subSequence(0, 2).toString()).toBe('dc'); // ReversedTest.java:75
  });

  it('testSubSequencePartialMilieu (ReversedTest.java:79)', () => {
    const seq = from('abcd', 4); // "dcba"
    expect(seq.subSequence(1, 3).toString()).toBe('cb'); // ReversedTest.java:81
  });

  it('testSubSequenceSurSequenceVide (ReversedTest.java:85)', () => {
    const seq = from('abcd', 0); // ""
    expect(seq.subSequence(0, 0).toString()).toBe(''); // ReversedTest.java:87
  });

  it('testSubSequenceIndicesEgaux (ReversedTest.java:91)', () => {
    const seq = from('abcd', 3); // "cba"
    expect(seq.subSequence(1, 1).toString()).toBe(''); // ReversedTest.java:93
  });

  it('testSubSequenceIndicesInvalidesNegatif (ReversedTest.java:97)', () => {
    const seq = from('abcd', 3); // "cba"
    expect(() => {
      seq.subSequence(-1, 2);
    }).toThrow(RangeError); // ReversedTest.java:99 assertThrows(IndexOutOfBoundsException)
  });

  it('testSubSequenceIndicesInvalidesTropGrand (ReversedTest.java:105)', () => {
    const seq = from('abcd', 3); // "cba"
    expect(() => {
      seq.subSequence(1, 4);
    }).toThrow(RangeError); // ReversedTest.java:107 assertThrows(IndexOutOfBoundsException)
  });

  it('testSubSequenceIndicesIncohérents (ReversedTest.java:113)', () => {
    const seq = from('abcd', 4); // "dcba"
    expect(() => {
      seq.subSequence(3, 2);
    }).toThrow(RangeError); // ReversedTest.java:115 assertThrows(IndexOutOfBoundsException)
  });
});
