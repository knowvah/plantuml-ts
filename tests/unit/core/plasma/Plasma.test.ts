import { describe, expect, it } from 'vitest';

import { MAGIC_SEPARATOR, Plasma } from '../../../../src/core/plasma/Plasma.js';

/**
 * Behavior tests for the Plasma namespace, from the Java semantics in
 * ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Plasma.java
 */
describe('Plasma', () => {
  describe('root', () => {
    it('constructs with a single root quark named ""', () => {
      const plasma = new Plasma<string>();
      expect(plasma.root().getName()).toBe('');
      expect(plasma.root().isRoot()).toBe(true);
      expect([...plasma.quarks()]).toEqual([plasma.root()]);
    });

    it('root() always returns the same quark', () => {
      const plasma = new Plasma<string>();
      expect(plasma.root()).toBe(plasma.root());
    });
  });

  describe('separator', () => {
    it('defaults to MAGIC_SEPARATOR ("\\u0001") and hasSeparator() false', () => {
      const plasma = new Plasma<string>();
      expect(MAGIC_SEPARATOR).toBe('\u0001');
      expect(plasma.getSeparator()).toBe(MAGIC_SEPARATOR);
      expect(plasma.hasSeparator()).toBe(false);
    });

    it('setSeparator installs a real separator', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      expect(plasma.getSeparator()).toBe('.');
      expect(plasma.hasSeparator()).toBe(true);
    });

    it('setSeparator(undefined) resets to MAGIC_SEPARATOR (Java null branch)', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      plasma.setSeparator(undefined);
      expect(plasma.getSeparator()).toBe(MAGIC_SEPARATOR);
      expect(plasma.hasSeparator()).toBe(false);
    });
  });

  describe('quarks registry', () => {
    it('lists every quark ever created, in creation order', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      plasma.root().child('a.b');
      plasma.root().child('c');
      expect([...plasma.quarks()].map((q) => q.getName())).toEqual(['', 'a', 'b', 'c']);
    });
  });

  describe('firstWithName / countByName (PEntry stats)', () => {
    it('firstWithName returns undefined for an unknown name', () => {
      const plasma = new Plasma<string>();
      expect(plasma.firstWithName('nope')).toBeUndefined();
    });

    it('countByName returns 0 for an unknown name', () => {
      const plasma = new Plasma<string>();
      expect(plasma.countByName('nope')).toBe(0);
    });

    it('tracks the FIRST quark created with a name, and the total count', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      const ax = plasma.root().child('a.x');
      plasma.root().child('b.x');
      plasma.root().child('c.x');
      expect(plasma.firstWithName('x')).toBe(ax);
      expect(plasma.countByName('x')).toBe(3);
    });

    it('re-fetching an existing quark does not bump the count', () => {
      const plasma = new Plasma<string>();
      const a = plasma.root().child('a');
      plasma.root().child('a');
      expect(plasma.countByName('a')).toBe(1);
      expect(plasma.firstWithName('a')).toBe(a);
    });

    it('the root registers under the empty name', () => {
      const plasma = new Plasma<string>();
      expect(plasma.firstWithName('')).toBe(plasma.root());
      expect(plasma.countByName('')).toBe(1);
    });
  });
});
