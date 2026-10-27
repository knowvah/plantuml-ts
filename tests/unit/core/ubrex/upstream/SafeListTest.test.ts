// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/SafeListTest.java (every assertion).
import { describe, expect, it } from 'vitest';
import { SafeList } from '../../../../../src/core/ubrex/SafeList.js';

describe('SafeListTest', () => {
  it('test1 (SafeListTest.java:9)', () => {
    expect(SafeList.createEmpty().size()).toBe(0);
  });

  it('testAdd (SafeListTest.java:14)', () => {
    const list1 = SafeList.createEmpty<string>();
    const list2 = list1.add('Alpha');
    const list3 = list2.add('Beta');
    expect(list1.size()).toBe(0);
    expect(list2.size()).toBe(1);
    expect(list3.size()).toBe(2);
    expect(list1.toString()).toBe('[]');
    expect(list2.toString()).toBe('[Alpha]');
    expect(list3.toString()).toBe('[Alpha, Beta]');
  });

  it('testMerge (SafeListTest.java:28)', () => {
    const listABC = SafeList.createEmpty<string>().add('A').add('B').add('C');
    const listDE = SafeList.createEmpty<string>().add('D').add('E');
    expect(listABC.toString()).toBe('[A, B, C]');
    expect(listDE.toString()).toBe('[D, E]');
    const listABCDE = listABC.addAll(listDE);
    expect(listABC.toString()).toBe('[A, B, C]');
    expect(listDE.toString()).toBe('[D, E]');
    expect(listABCDE.toString()).toBe('[A, B, C, D, E]');
  });
});
