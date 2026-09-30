/**
 * SName — the full `style/SName.java` enum (1.2026.8beta1) plus its
 * `retrieve` lookup.
 */
import { describe, expect, it } from 'vitest';
import { SNAMES, retrieve } from '../../../../src/core/style/SName.js';
import type { SName } from '../../../../src/core/style/StyleSignatureBasic.js';

describe('SName', () => {
  it('carries every SName.java constant: 157 members, SName.java:42-202', () => {
    // `grep -cE '^\s+[A-Za-z_][A-Za-z0-9_]*\s*[,;]' style/SName.java` = 157
    expect(SNAMES).toHaveLength(157);
    expect(new Set(SNAMES).size).toBe(157);
    expect(SNAMES[0]).toBe('action'); // SName.java:42
    expect(SNAMES[156]).toBe('annotation'); // SName.java:202
  });

  it('keeps the trailing-underscore constant names verbatim', () => {
    const underscored = SNAMES.filter((s) => s.endsWith('_'));
    expect(underscored).toEqual(['class_', 'goto_', 'interface_', 'package_', 'private_', 'protected_', 'public_']);
  });

  it('keeps the eight names VisibilityModifier emits assignable via the StyleSignatureBasic re-export', () => {
    const names: readonly SName[] = [
      'root',
      'element',
      'visibilityIcon',
      'IEMandatory',
      'public_',
      'private_',
      'protected_',
      'package_',
    ];
    expect(names.every((n) => SNAMES.includes(n))).toBe(true);
  });

  describe('retrieve (SName.java:205-216)', () => {
    it('keys on name().replace("_", "").toLowerCase(), looked up case-insensitively', () => {
      expect(retrieve('PUBLIC')).toBe('public_');
      expect(retrieve('mindmapDiagram')).toBe('mindmapDiagram');
      expect(retrieve('ROOTNODE')).toBe('rootNode');
    });

    it('does not match the underscored spelling (the key has the underscore removed)', () => {
      expect(retrieve('public_')).toBeUndefined();
    });

    it('returns undefined for an unknown name (Java HashMap#get null)', () => {
      expect(retrieve('noSuchName')).toBeUndefined();
    });
  });
});
