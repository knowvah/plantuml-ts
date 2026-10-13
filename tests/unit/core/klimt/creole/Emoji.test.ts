/**
 * `Emoji.getAll()`: the registry as a key-sorted map.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/Emoji.java:85-86
 */
import { describe, expect, it } from 'vitest';
import { getAll, retrieveEmoji } from '../../../../../src/core/klimt/creole/Emoji.js';

describe('Emoji.getAll (java:85-86, `new TreeMap<>(ALL)`)', () => {
  const all = getAll();
  const keys = [...all.keys()];

  it('iterates in TreeMap order: String#compareTo, i.e. UTF-16 code units', () => {
    expect(keys).toEqual([...keys].sort());
  });

  it('carries both unicode and shortcut keys for one entry (java:101, :107)', () => {
    const byUnicode = all.get('1f600');
    expect(byUnicode).toBeDefined();
    expect(byUnicode).toBe(retrieveEmoji('1f600'));
    const shortcut = byUnicode?.shortcut;
    expect(shortcut).toBe('grinning');
    expect(all.get('grinning')).toBe(byUnicode);
  });

  it('is a fresh copy each call (unmodifiableMap of a new TreeMap)', () => {
    expect(getAll()).not.toBe(all);
    expect(getAll().size).toBe(all.size);
  });
});
