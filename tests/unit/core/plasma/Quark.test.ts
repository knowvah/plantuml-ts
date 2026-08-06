import { describe, expect, it } from 'vitest';

import { Plasma } from '../../../../src/core/plasma/Plasma.js';
import { Quark } from '../../../../src/core/plasma/Quark.js';

/**
 * Behavior tests for the Quark tree, from the Java semantics in
 * ~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java
 */
describe('Quark', () => {
  describe('root creation', () => {
    it('plasma root has empty name, no parent, isRoot() true', () => {
      const plasma = new Plasma<string>();
      const root = plasma.root();
      expect(root.getName()).toBe('');
      expect(root.getParent()).toBeUndefined();
      expect(root.isRoot()).toBe(true);
      expect(root.getQualifiedName()).toBe('');
    });

    it('non-root quarks report isRoot() false', () => {
      const plasma = new Plasma<string>();
      const child = plasma.root().child('a');
      expect(child.isRoot()).toBe(false);
    });
  });

  describe('child get-or-create', () => {
    it('child() creates a new direct child when absent', () => {
      const plasma = new Plasma<string>();
      const a = plasma.root().child('a');
      expect(a.getName()).toBe('a');
      expect(a.getParent()).toBe(plasma.root());
    });

    it('child() returns the existing child on repeat calls', () => {
      const plasma = new Plasma<string>();
      const a1 = plasma.root().child('a');
      const a2 = plasma.root().child('a');
      expect(a2).toBe(a1);
    });

    it('child() with a separator-qualified path walks/creates the chain', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      const c = plasma.root().child('a.b.c');
      expect(c.getName()).toBe('c');
      expect(c.getParent()?.getName()).toBe('b');
      expect(c.getParent()?.getParent()?.getName()).toBe('a');
      expect(c.getParent()?.getParent()?.getParent()).toBe(plasma.root());
    });

    it('child() cleans leading/trailing separators (Quark.java clean)', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      const b = plasma.root().child('.a.b.');
      expect(b.getQualifiedName()).toBe('a.b');
      // '..a' repeatedly strips the leading separator
      expect(plasma.root().child('..a')).toBe(plasma.root().child('a'));
    });

    it('child() without a separator treats the full string as one name', () => {
      const plasma = new Plasma<string>();
      // no setSeparator: MAGIC_SEPARATOR active, hasSeparator() false
      const q = plasma.root().child('a.b');
      expect(q.getName()).toBe('a.b');
      expect(q.getParent()).toBe(plasma.root());
    });
  });

  describe('childIfExists', () => {
    it('returns undefined for an absent child and does not create it', () => {
      const plasma = new Plasma<string>();
      const root = plasma.root();
      expect(root.childIfExists('a')).toBeUndefined();
      expect(root.countChildren()).toBe(0);
    });

    it('returns the existing direct child', () => {
      const plasma = new Plasma<string>();
      const a = plasma.root().child('a');
      expect(plasma.root().childIfExists('a')).toBe(a);
    });

    it('throws when the name contains the active separator', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      expect(() => plasma.root().childIfExists('a.b')).toThrow('IllegalArgumentException');
    });

    it('does not throw on separator-looking names when no separator is set', () => {
      const plasma = new Plasma<string>();
      expect(plasma.root().childIfExists('a.b')).toBeUndefined();
    });
  });

  describe('qualifiedName', () => {
    it('children of root use the bare name (parent.parent == null branch)', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      expect(plasma.root().child('a').getQualifiedName()).toBe('a');
    });

    it('deeper quarks join with the separator', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('::');
      const c = plasma.root().child('a::b::c');
      expect(c.getQualifiedName()).toBe('a::b::c');
    });

    it('is fixed at construction time with the then-active separator', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      const b = plasma.root().child('a.b');
      plasma.setSeparator('::');
      // Constructed with '.', unchanged by the later setSeparator
      expect(b.getQualifiedName()).toBe('a.b');
    });

    it('toString() returns the qualified name', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      expect(String(plasma.root().child('a.b'))).toBe('a.b');
    });
  });

  describe('toStringPoint', () => {
    it('joins with "." regardless of the plasma separator', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('::');
      const c = plasma.root().child('a::b::c');
      expect(c.toStringPoint()).toBe('a.b.c');
    });

    it('returns the bare name for a child of root', () => {
      const plasma = new Plasma<string>();
      expect(plasma.root().child('a').toStringPoint()).toBe('a');
    });
  });

  describe('parent navigation', () => {
    it('getParent() walks up to the root', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      const c = plasma.root().child('a.b.c');
      expect(c.getParent()?.getQualifiedName()).toBe('a.b');
      expect(c.getParent()?.getParent()?.getQualifiedName()).toBe('a');
      expect(c.getParent()?.getParent()?.getParent()?.isRoot()).toBe(true);
    });

    it('getPlasma() returns the owning plasma', () => {
      const plasma = new Plasma<string>();
      expect(plasma.root().child('a').getPlasma()).toBe(plasma);
    });
  });

  describe('data attach', () => {
    it('getData() is undefined until set', () => {
      const plasma = new Plasma<{ kind: string }>();
      expect(plasma.root().child('a').getData()).toBeUndefined();
    });

    it('setData() attaches and getData() returns it', () => {
      const plasma = new Plasma<{ kind: string }>();
      const a = plasma.root().child('a');
      const data = { kind: 'leaf' };
      a.setData(data);
      expect(a.getData()).toBe(data);
    });

    it('setData() twice throws IllegalStateException', () => {
      const plasma = new Plasma<{ kind: string }>();
      const a = plasma.root().child('a');
      a.setData({ kind: 'leaf' });
      expect(() => a.setData({ kind: 'group' })).toThrow('IllegalStateException');
    });
  });

  describe('children collection', () => {
    it('getChildren() preserves insertion order (LinkedHashMap semantics)', () => {
      const plasma = new Plasma<string>();
      const root = plasma.root();
      root.child('b');
      root.child('a');
      root.child('c');
      expect([...root.getChildren()].map((q) => q.getName())).toEqual(['b', 'a', 'c']);
    });

    it('countChildren() counts direct children only', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      const root = plasma.root();
      root.child('a.x');
      root.child('a.y');
      root.child('b');
      expect(root.countChildren()).toBe(2); // a, b
      expect(root.child('a').countChildren()).toBe(2); // x, y
    });
  });

  describe('name collision behavior', () => {
    it('same name under different parents yields distinct quarks', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      const ax = plasma.root().child('a.x');
      const bx = plasma.root().child('b.x');
      expect(ax).not.toBe(bx);
      expect(ax.getQualifiedName()).toBe('a.x');
      expect(bx.getQualifiedName()).toBe('b.x');
    });
  });

  describe('constructor registration', () => {
    it('every constructed quark registers with its plasma', () => {
      const plasma = new Plasma<string>();
      plasma.setSeparator('.');
      plasma.root().child('a.b');
      // root + a + b
      expect([...plasma.quarks()].map((q) => q.getName())).toEqual(['', 'a', 'b']);
    });

    it('direct construction registers too (package-private ctor upstream)', () => {
      const plasma = new Plasma<string>();
      const q = new Quark<string>(plasma, plasma.root(), 'direct');
      expect(plasma.firstWithName('direct')).toBe(q);
    });
  });
});
