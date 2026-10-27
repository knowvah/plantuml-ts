import { describe, expect, it } from 'vitest';
import { CharSet } from '../../../../src/core/ubrex/CharSet.js';

const members = (cs: CharSet): string => {
  let out = '';
  for (let c = 32; c <= 128; c++) {
    const ch = String.fromCharCode(c);
    // contains() lowercases first, so upper-case twins are always members; list the rest.
    if (cs.contains(ch) && !(ch >= 'A' && ch <= 'Z')) out += ch;
  }
  return out;
};

describe('CharSet (CharSet.java)', () => {
  it('addChar/contains, case-insensitive via ensureLowercase (:44,102)', () => {
    const cs = new CharSet();
    cs.addChar('A');
    expect(cs.contains('a')).toBe(true);
    expect(cs.contains('A')).toBe(true);
    expect(cs.contains('b')).toBe(false);
  });
  it('addChar bounds 32..128 inclusive, else throws "Bad char : x" (:48)', () => {
    const cs = new CharSet();
    cs.addChar(' ');
    cs.addChar('\u0080');
    expect(cs.contains(' ')).toBe(true);
    expect(cs.contains('\u0080')).toBe(true);
    expect(() => cs.addChar('\u001f')).toThrow('Bad char : \u001f');
    expect(() => cs.addChar('\u0081')).toThrow('Bad char : \u0081');
  });
  it('chars in mask2 (offset >= 64): "`" at 96 and "~" (:51-53)', () => {
    const cs = new CharSet();
    cs.addChar('a');
    cs.addChar('~');
    expect(members(cs)).toBe('a~');
  });
  it('addRange within mask1 (:73-77)', () => {
    const cs = new CharSet();
    cs.addRange('0', '9');
    expect(members(cs)).toBe('0123456789');
  });
  it('addRange lowercases both ends, so A-Z equals a-z (:69-72)', () => {
    const cs = new CharSet();
    cs.addRange('A', 'C');
    expect(members(cs)).toBe('abc');
    expect(cs.contains('B')).toBe(true);
  });
  it('addRange entirely in mask2 (:80-86)', () => {
    const cs = new CharSet();
    cs.addRange('a', 'f');
    expect(members(cs)).toBe('abcdef');
  });
  it('addRange spanning both masks (:88-99)', () => {
    const cs = new CharSet();
    cs.addRange('0', 'f');
    const expected = Array.from({ length: 'f'.charCodeAt(0) - 48 + 1 }, (_, i) => String.fromCharCode(48 + i));
    // Upper-case letters inside the range are looked up lowercased, so their lower twins are members.
    expect(members(cs)).toBe(expected.filter((c) => !(c >= 'A' && c <= 'Z')).join(''));
  });
  it('addRange full 64-bit mask1 (length == 64) and start at offset 0 spanning (:75,91)', () => {
    const full = new CharSet();
    full.addRange(' ', '_');
    expect(members(full)).toBe(
      Array.from({ length: 64 }, (_, i) => String.fromCharCode(32 + i))
        .filter((c) => !(c >= 'A' && c <= 'Z'))
        .join(''),
    );
    const span = new CharSet();
    span.addRange(' ', 'b');
    expect(span.contains(' ')).toBe(true);
    expect(span.contains('b')).toBe(true);
    expect(span.contains('c')).toBe(false);
  });
  it('addRange errors (:59-64)', () => {
    const cs = new CharSet();
    expect(() => cs.addRange('z', 'a')).toThrow("Invalid range: 'z' is greater than 'a'.");
    expect(() => cs.addRange('\u001f', 'a')).toThrow('Characters must be in the range 32 to 128.');
    expect(() => cs.addRange('a', '\u0081')).toThrow('Characters must be in the range 32 to 128.');
  });
  it('contains beyond offset 128 is false; offsets <= 128 alias via JVM shift masking (:107-113)', () => {
    const cs = new CharSet();
    cs.addChar('a');
    expect(cs.contains('Ā')).toBe(false);
    // ch=0x00A0: offset 128 -> not > 128 -> mask2 bit (128-64)&63 = 0 -> aliases ch 96 ('`')
    const al = new CharSet();
    al.addChar('`');
    expect(al.contains(' ')).toBe(true);
    // ch < 32 is negative offset -> mask1 bit (offset & 63): '\u0000' offset -32 -> bit 32 aliases ch 64 ('@')
    const neg = new CharSet();
    neg.addChar('@');
    expect(neg.contains('\u0000')).toBe(true);
  });
});
