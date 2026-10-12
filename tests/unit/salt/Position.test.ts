/**
 * `Position` against the Java (`salt/Position.java:38-67`). Values are from a
 * jshell probe of the 1.2026.8beta1 oracle jar:
 * `new Position(2,3)` → row 2, col 3, hashCode 101; `(0,49)` and `(1,0)` both
 * hash to 49 and are not equal.
 */
import { describe, expect, it } from 'vitest';
import { Position } from '../../../src/diagrams/salt/Position.js';

describe('Position', () => {
  it('returns its row and column', () => {
    const p = new Position(2, 3);
    expect(p.getRow()).toBe(2);
    expect(p.getCol()).toBe(3);
  });

  it('hashes as row * 49 + col (jar: (2,3) → 101)', () => {
    expect(new Position(2, 3).hashCode()).toBe(101);
    expect(new Position(0, 49).hashCode()).toBe(49);
    expect(new Position(1, 0).hashCode()).toBe(49);
  });

  it('is equal exactly when row and col both match', () => {
    const p = new Position(2, 3);
    expect(p.equals(new Position(2, 3))).toBe(true);
    expect(p.equals(new Position(3, 2))).toBe(false);
    expect(p.equals(new Position(2, 4))).toBe(false);
    expect(new Position(0, 49).equals(new Position(1, 0))).toBe(false);
  });
});
