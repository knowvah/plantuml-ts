/**
 * Ports.test.ts — T8: unit coverage for `Ports` (svek/Ports.java).
 * `encodePortNameToId`'s MD5 digest is now provided by
 * `SignatureUtils.getMD5Hex` (T8b relocated the digest implementation out
 * of `Ports.ts`; see `tests/unit/core/utils/SignatureUtils.test.ts` for its
 * own RFC 1321 test vectors). The vectors kept here are unchanged from T8:
 * they prove the RELOCATION was byte-identical, not just that some hex
 * string comes back.
 */
import { describe, expect, it } from 'vitest';
import { Ports } from '../../../../src/core/svek/Ports.js';

describe('Ports.encodePortNameToId', () => {
  it('prefixes "p" + the lowercase MD5 hex digest of the port name (RFC 1321 vectors)', () => {
    // RFC 1321 Appendix A.5 test suite (MD5("") / MD5("abc") / MD5("message digest")).
    expect(Ports.encodePortNameToId('')).toBe('pd41d8cd98f00b204e9800998ecf8427e');
    expect(Ports.encodePortNameToId('abc')).toBe('p900150983cd24fb0d6963f7d28e17f72');
    expect(Ports.encodePortNameToId('message digest')).toBe('pf96b697d7cb7938d525a2f31aaf161d0');
  });

  it('matches the well-known "The quick brown fox..." MD5 vector', () => {
    expect(Ports.encodePortNameToId('The quick brown fox jumps over the lazy dog')).toBe(
      'p9e107d9d372bb6826bd81d3542a419d6',
    );
  });

  it('is deterministic and distinguishes different port names', () => {
    expect(Ports.encodePortNameToId('port1')).toBe(Ports.encodePortNameToId('port1'));
    expect(Ports.encodePortNameToId('port1')).not.toBe(Ports.encodePortNameToId('port2'));
  });
});

describe('Ports.add', () => {
  it('adds a new port under its encoded id', () => {
    const ports = new Ports();
    ports.add('p1', 1, 10, 5);
    const all = ports.getAllPortGeometry();
    expect(all).toHaveLength(1);
    expect(all[0]?.getId()).toBe(Ports.encodePortNameToId('p1'));
    expect(all[0]?.getPosition()).toBe(10);
    expect(all[0]?.getHeight()).toBe(5);
    expect(all[0]?.getScore()).toBe(1);
  });

  it('a higher-score report for the same port REPLACES the existing one', () => {
    const ports = new Ports();
    ports.add('p1', 1, 10, 5);
    ports.add('p1', 5, 20, 8);
    const all = ports.getAllPortGeometry();
    expect(all).toHaveLength(1);
    expect(all[0]?.getScore()).toBe(5);
    expect(all[0]?.getPosition()).toBe(20);
  });

  it('a lower-or-equal-score report for the same port is IGNORED', () => {
    const ports = new Ports();
    ports.add('p1', 5, 20, 8);
    ports.add('p1', 5, 99, 99);
    ports.add('p1', 1, 1, 1);
    const all = ports.getAllPortGeometry();
    expect(all).toHaveLength(1);
    expect(all[0]?.getPosition()).toBe(20);
    expect(all[0]?.getHeight()).toBe(8);
  });
});

describe('Ports.addThis', () => {
  it('merges another Ports, keeping the higher score per id', () => {
    const a = new Ports();
    a.add('p1', 1, 10, 5);
    a.add('p2', 1, 1, 1);
    const b = new Ports();
    b.add('p1', 9, 99, 9); // higher score for p1 -- should win
    b.add('p3', 1, 3, 3); // new id -- should be added

    a.addThis(b);
    const byId = new Map(a.getAllPortGeometry().map((pg) => [pg.getId(), pg]));
    expect(byId.get(Ports.encodePortNameToId('p1'))?.getPosition()).toBe(99);
    expect(byId.get(Ports.encodePortNameToId('p2'))?.getPosition()).toBe(1);
    expect(byId.get(Ports.encodePortNameToId('p3'))?.getPosition()).toBe(3);
  });

  it('does not overwrite a higher-scored existing entry with a lower-scored merged one', () => {
    const a = new Ports();
    a.add('p1', 9, 10, 5);
    const b = new Ports();
    b.add('p1', 1, 999, 999);

    a.addThis(b);
    const all = a.getAllPortGeometry();
    expect(all[0]?.getPosition()).toBe(10);
  });
});

describe('Ports.getAllPortGeometry', () => {
  it('returns entries sorted ascending by position', () => {
    const ports = new Ports();
    ports.add('c', 1, 30, 1);
    ports.add('a', 1, 10, 1);
    ports.add('b', 1, 20, 1);
    const positions = ports.getAllPortGeometry().map((pg) => pg.getPosition());
    expect(positions).toEqual([10, 20, 30]);
  });

  it('returns an empty array for a fresh Ports', () => {
    expect(new Ports().getAllPortGeometry()).toEqual([]);
  });
});

describe('Ports.translateY', () => {
  it('returns a NEW Ports with every entry shifted by deltaY, original unchanged', () => {
    const ports = new Ports();
    ports.add('p1', 1, 10, 5);
    const shifted = ports.translateY(3);

    expect(shifted).not.toBe(ports);
    expect(ports.getAllPortGeometry()[0]?.getPosition()).toBe(10);
    expect(shifted.getAllPortGeometry()[0]?.getPosition()).toBe(13);
    expect(shifted.getAllPortGeometry()[0]?.getHeight()).toBe(5);
  });
});

describe('Ports.toString', () => {
  it('is empty-braces for a fresh Ports', () => {
    expect(new Ports().toString()).toBe('{}');
  });

  it('joins "id=pos=X height=Y (score)" entries', () => {
    const ports = new Ports();
    ports.add('p1', 2, 10, 5);
    const id = Ports.encodePortNameToId('p1');
    expect(ports.toString()).toBe(`{${id}=pos=10 height=5 (2)}`);
  });
});
