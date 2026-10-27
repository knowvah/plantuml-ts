import { describe, expect, it } from 'vitest';
import { UBrexConcat } from '../../../../../src/core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../../../src/core/ubrex/builder/UBrexNamed.js';
import { UBrexOr } from '../../../../../src/core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../../../src/core/ubrex/builder/UBrexPart.js';

describe('UBrexOr', () => {
  it('varargs constructor tries each alternative (UBrexOr.java:43-47)', () => {
    const cut = new UBrexOr(new UBrexLeaf('ab'), new UBrexLeaf('cd'));
    expect(cut.match('ab').exactMatch()).toBe(true);
    expect(cut.match('cd').exactMatch()).toBe(true);
    expect(cut.match('ef').startMatch()).toBe(false);
  });

  it('Collection constructor is equivalent (UBrexOr.java:49-53)', () => {
    const parts: UBrexPart[] = [new UBrexLeaf('ab'), new UBrexLeaf('cd')];
    const cut = new UBrexOr(parts);
    expect(cut.match('ab').exactMatch()).toBe(true);
    expect(cut.match('cd').exactMatch()).toBe(true);
    expect(cut.match('ef').startMatch()).toBe(false);
  });

  it('a Set (any Iterable) is accepted as the collection', () => {
    const cut = new UBrexOr(new Set<UBrexPart>([new UBrexLeaf('x')]));
    expect(cut.match('x').exactMatch()).toBe(true);
  });

  it('a single part given as varargs is not mistaken for a collection (UBrexOr.java:43)', () => {
    const cut = new UBrexOr(new UBrexLeaf('ab'));
    expect(cut.match('ab').exactMatch()).toBe(true);
  });

  /**
   * Gantt acceptance: the exact tree of lang/SubjectDayAsDate.java:132-142
   * (toUbrexE) inside the Or of :144-146 with toUbrexB =
   * TimeResolution.toUbrexB_YYYY_MM_DD (TimeResolution.java:60-71).
   */
  describe('SubjectDayAsDate tree (SubjectDayAsDate.java:132-146)', () => {
    const digits1to2 = (): UBrexPart => new UBrexLeaf('〇{1-2}〴d'); // TimeResolution.java:61
    const digits1to4 = (): UBrexPart => new UBrexLeaf('〇{1-4}〴d'); // :62
    const nonDigit = new UBrexLeaf('〇+〴D'); // :63
    const toUbrexB = (): UBrexPart =>
      UBrexConcat.build(
        new UBrexNamed('BYEAR', digits1to4()),
        nonDigit,
        new UBrexNamed('BMONTH', digits1to2()),
        nonDigit,
        new UBrexNamed('BDAY', digits1to2()),
      ); // TimeResolution.java:64-70 via SubjectDayAsDate.java:128-130
    const toUbrexE = (): UBrexPart =>
      UBrexConcat.build(
        new UBrexNamed('ETYPE', new UBrexLeaf('「dDtTeE」')),
        new UBrexNamed('EOPERATION', new UBrexLeaf('「-+」')),
        new UBrexNamed('ECOUNT', new UBrexLeaf('〇+〴d')),
      ); // SubjectDayAsDate.java:132-138
    const cut = new UBrexOr(toUbrexB(), toUbrexE()); // :144-146

    it.each([
      ['T+5', 'T', '+', '5'],
      ['d-2', 'd', '-', '2'],
      ['E+10', 'E', '+', '10'],
    ])('%s -> ETYPE/EOPERATION/ECOUNT (SubjectDayAsDate.java:107-110)', (text, type, operation, count) => {
      const m = cut.match(text, 0);
      expect(m.exactMatch()).toBe(true);
      expect(m.findFirstValueByKey('ETYPE')).toBe(type);
      expect(m.findFirstValueByKey('EOPERATION')).toBe(operation);
      expect(m.findFirstValueByKey('ECOUNT')).toBe(count);
      expect(m.findFirstValueByKey('BDAY')).toBeUndefined(); // :97 takes the E branch
    });

    it('X+1 is rejected', () => {
      const m = cut.match('X+1', 0);
      expect(m.startMatch()).toBe(false);
      expect(m.exactMatch()).toBe(false);
      expect(m.findFirstValueByKey('ETYPE')).toBeUndefined();
    });

    it('a date takes the B branch (SubjectDayAsDate.java:97-98, resultB :102-106)', () => {
      const m = cut.match('2024-03-15', 0);
      expect(m.exactMatch()).toBe(true);
      expect(m.findFirstValueByKey('BYEAR')).toBe('2024');
      expect(m.findFirstValueByKey('BMONTH')).toBe('03');
      expect(m.findFirstValueByKey('BDAY')).toBe('15');
      expect(m.findFirstValueByKey('ECOUNT')).toBeUndefined();
    });
  });
});
