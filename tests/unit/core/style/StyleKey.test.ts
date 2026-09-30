/**
 * StyleKey — the sname-set / level / star triple a StyleSignatureBasic
 * carries (`style/StyleKey.java`, 131 lines). Pure-Java semantics, each
 * expectation pinned by quoting the Java line it follows.
 */
import { describe, expect, it } from 'vitest';
import { StyleKey } from '../../../../src/core/style/StyleKey.js';
import { Url } from '../../../../src/core/url/Url.js';

describe('StyleKey', () => {
  it('empty() has no snames, level -1, not starred (StyleKey.java:55-57)', () => {
    const k = StyleKey.empty();
    expect([...k.snames]).toEqual([]);
    expect(k.level).toBe(-1);
    expect(k.isStared).toBe(false);
  });

  it('of() collects the names as a set, level -1, not starred (java:94-100)', () => {
    const k = StyleKey.of('root', 'element', 'root');
    expect([...k.snames]).toEqual(['root', 'element']);
    expect(k.level).toBe(-1);
    expect(k.isStared).toBe(false);
  });

  it('addLevel/addStar/addSName return new keys and leave the receiver untouched (java:80-92)', () => {
    const base = StyleKey.of('node');
    const k = base.addLevel(2).addStar().addSName('leafNode');
    expect(k.level).toBe(2);
    expect(k.isStared).toBe(true);
    expect([...k.snames]).toEqual(['node', 'leafNode']);
    expect(base.level).toBe(-1);
    expect(base.isStared).toBe(false);
    expect([...base.snames]).toEqual(['node']);
  });

  it('addClickable adds SName.clickable only for a non-null url (java:69-78)', () => {
    const base = StyleKey.of('node');
    expect(base.addClickable(undefined)).toBe(base);
    expect([...base.addClickable(new Url('http://x', null, null)).snames]).toEqual(['node', 'clickable']);
  });

  it('mergeWith unions snames, takes max level, ORs the star (java:102-108)', () => {
    const a = StyleKey.of('root').addLevel(1);
    const b = StyleKey.of('node').addLevel(3).addStar();
    const m = a.mergeWith(b);
    expect([...m.snames]).toEqual(['root', 'node']);
    expect(m.level).toBe(3);
    expect(m.isStared).toBe(true);
    expect(b.mergeWith(a).level).toBe(3);
  });

  it('equals compares snames as a set plus star and level (java:110-118)', () => {
    const a = StyleKey.of('root', 'node').addLevel(2);
    expect(a.equals(a)).toBe(true);
    expect(a.equals(StyleKey.of('node', 'root').addLevel(2))).toBe(true);
    expect(a.equals(StyleKey.of('root', 'node').addLevel(3))).toBe(false);
    expect(a.equals(a.addStar())).toBe(false);
    expect(a.equals(StyleKey.of('root'))).toBe(false);
  });

  it('keyString is equal exactly when equals() is (hashCode stand-in)', () => {
    const a = StyleKey.of('root', 'node').addLevel(2);
    expect(a.keyString()).toBe(StyleKey.of('node', 'root').addLevel(2).keyString());
    expect(a.keyString()).not.toBe(a.addStar().keyString());
    expect(a.keyString()).not.toBe(a.addLevel(-1).keyString());
  });

  it('toString prints the EnumSet in SName ordinal order, level, and star (java:59-67)', () => {
    // EnumSet iteration is ordinal order: element (SName.java ordinal) < root.
    expect(StyleKey.of('root', 'element').toString()).toBe('[element, root] ');
    expect(StyleKey.of('node').addLevel(2).addStar().toString()).toBe('[node]  2 (*)');
  });
});
