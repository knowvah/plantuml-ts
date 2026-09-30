/**
 * PName — the full `style/PName.java` enum plus `getFromName`.
 */
import { describe, expect, it } from 'vitest';
import { PNAMES, getFromName } from '../../../../src/core/style/PName.js';

describe('PName', () => {
  it('carries every PName.java constant, in declaration order: 30 members, PName.java:39-70', () => {
    // `grep -cE '^\s+[A-Za-z_][A-Za-z0-9_]*\s*[,;]' style/PName.java` = 30
    expect(PNAMES).toHaveLength(30);
    expect(PNAMES[0]).toBe('Shadowing'); // PName.java:39
    expect(PNAMES[5]).toBe('FontWeight'); // PName.java:45
    expect(PNAMES[6]).toBe('BackGroundColor'); // PName.java:46
    expect(PNAMES[29]).toBe('Width'); // PName.java:70
  });

  describe('getFromName (PName.java:72-78): prop.name().equalsIgnoreCase(name)', () => {
    it('matches case-insensitively and returns the canonical constant', () => {
      expect(getFromName('backgroundcolor', 'REGULAR')).toBe('BackGroundColor');
      expect(getFromName('FONTSIZE', 'DARK')).toBe('FontSize');
    });

    it('returns undefined for an unknown key (Java null)', () => {
      expect(getFromName('BackgroundColour', 'REGULAR')).toBeUndefined();
    });
  });
});
