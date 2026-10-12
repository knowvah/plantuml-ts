/**
 * `Terminator` / `Terminated` against the Java (`salt/Terminator.java:38-40`,
 * `salt/Terminated.java:40-62`). Values are from a jshell probe of the
 * 1.2026.8beta1 oracle jar: `new Terminated<String>("[OK]", Terminator.NEWCOL)`
 * prints `[OK] NEWCOL`; a null terminator throws (`Objects.requireNonNull`).
 */
import { describe, expect, it } from 'vitest';
import { Terminated } from '../../../src/diagrams/salt/Terminated.js';
import { Terminator } from '../../../src/diagrams/salt/Terminator.js';

describe('Terminator', () => {
  it('has exactly the two upstream constants, in declaration order', () => {
    expect(Object.values(Terminator)).toEqual(['NEWLINE', 'NEWCOL']);
  });
});

describe('Terminated', () => {
  it('carries its element and terminator', () => {
    const t = new Terminated('[OK]', Terminator.NEWCOL);
    expect(t.getElement()).toBe('[OK]');
    expect(t.getTerminator()).toBe(Terminator.NEWCOL);
  });

  it('prints "<element> <terminator>" (jar: "[OK] NEWCOL")', () => {
    expect(new Terminated('[OK]', Terminator.NEWCOL).toString()).toBe('[OK] NEWCOL');
    expect(new Terminated('}', Terminator.NEWLINE).toString()).toBe('} NEWLINE');
  });

  it('prints a non-string element through its own toString', () => {
    const element = { toString: (): string => 'elem' };
    expect(new Terminated(element, Terminator.NEWLINE).toString()).toBe('elem NEWLINE');
  });

  it('rejects a missing terminator, as Objects.requireNonNull does', () => {
    // Deliberately bypasses the type to reach the Java's null guard (Terminated.java:47).
    const missing = undefined as unknown as Terminator;
    expect(() => new Terminated('x', missing)).toThrow('NullPointerException');
  });
});
