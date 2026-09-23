/**
 * `core/theme-dark.ts` — the `skinparam mode dark` default-color table
 * (cdd-T33). Pure data; the wiring test lives in
 * `tests/unit/skinparam-mode-dark.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import { DARK_MODE_DEFAULTS } from '../../../src/core/theme-dark.js';

describe('DARK_MODE_DEFAULTS', () => {
  it('cites the exact plantuml.skin @media(prefers-color-scheme:dark) values', () => {
    // resources/skin/plantuml.skin:563-776, `root`/`document`/`spot.spotClass`
    // selectors -- see theme-dark.ts's own per-field doc comments for the
    // exact line citation.
    expect(DARK_MODE_DEFAULTS).toEqual({
      background: '#1B1B1B',
      border: '#E7E7E7',
      text: '#FFF',
      classBackground: '#313139',
      spotClassBackground: '#2E5233',
    });
  });
});
