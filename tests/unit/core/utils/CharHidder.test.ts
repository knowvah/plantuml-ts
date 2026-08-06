import { describe, expect, it } from 'vitest';
import { CharHidder } from '../../../../src/core/utils/CharHidder.js';

/**
 * CharHidder — the '~' tile escape (utils/CharHidder.java).
 *
 * Hidden characters are remapped into the Unicode private-use area
 * (U+E000 + charCode); `unhide` maps them back. Expectations below are
 * derived directly from the Java source (charCode arithmetic), e.g.
 * '_' (0x5F) hides to '' and '~' (0x7E) to ''.
 */
describe('CharHidder', () => {
  describe('addTileAtBegin', () => {
    it('prefixes a tilde', () => {
      expect(CharHidder.addTileAtBegin('foo')).toBe('~foo');
    });

    it('prefixes even an empty string', () => {
      expect(CharHidder.addTileAtBegin('')).toBe('~');
    });
  });

  describe('hide', () => {
    it('hides backslash-tilde as PUA tilde', () => {
      expect(CharHidder.hide('a\\~b')).toBe('ab');
    });

    it('hides tilde followed by each escapable char', () => {
      // CharHidder.java:85-86 — the exact isToBeHidden set.
      for (const c of ['_', '-', '"', '#', ']', '[', '*', '.', '/', '<']) {
        const expected = String.fromCharCode(0xe000 + c.charCodeAt(0));
        expect(CharHidder.hide(`x~${c}y`)).toBe(`x${expected}y`);
      }
    });

    it('keeps tilde followed by a non-escapable char, consuming both', () => {
      expect(CharHidder.hide('a~qb')).toBe('a~qb');
    });

    it('keeps a trailing tilde', () => {
      expect(CharHidder.hide('ab~')).toBe('ab~');
    });

    it('keeps a backslash not followed by tilde', () => {
      expect(CharHidder.hide('a\\nb')).toBe('a\\nb');
    });

    it('returns the same string instance when nothing is hidden', () => {
      const s = 'plain';
      expect(CharHidder.hide(s)).toBe(s);
    });

    it('handles multiple escapes in one string', () => {
      expect(CharHidder.hide('~_a\\~b~.')).toBe('ab');
    });

    it('a tilde-tilde pair consumes both without hiding', () => {
      // '~' is not in the isToBeHidden set, so '~~' passes through.
      expect(CharHidder.hide('a~~b')).toBe('a~~b');
    });
  });

  describe('hideChar / unhideChar', () => {
    it('hideChar maps into the PUA block', () => {
      expect(CharHidder.hideChar('~')).toBe('');
      expect(CharHidder.hideChar('_')).toBe('');
    });

    it('hideChar throws for chars above 255', () => {
      expect(() => CharHidder.hideChar('Ā')).toThrow();
    });

    it('unhideChar reverses hideChar and passes others through', () => {
      expect(CharHidder.unhideChar('')).toBe('~');
      expect(CharHidder.unhideChar('')).toBe('ÿ');
      expect(CharHidder.unhideChar('a')).toBe('a');
      // Just outside the PUA window used by CharHidder.
      expect(CharHidder.unhideChar('')).toBe('');
    });
  });

  describe('unhide', () => {
    it('restores hidden characters', () => {
      expect(CharHidder.unhide('xy')).toBe('x_y');
      expect(CharHidder.unhide('')).toBe('~');
    });

    it('returns the same string instance when nothing is hidden', () => {
      const s = 'plain';
      expect(CharHidder.unhide(s)).toBe(s);
    });

    it('round-trips hide -> unhide (escapes collapse to their payload)', () => {
      expect(CharHidder.unhide(CharHidder.hide('a~_b\\~c'))).toBe('a_b~c');
      expect(CharHidder.unhide(CharHidder.hide('~[x~]'))).toBe('[x]');
    });
  });
});
