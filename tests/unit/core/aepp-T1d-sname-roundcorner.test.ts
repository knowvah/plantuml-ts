import { describe, it, expect } from 'vitest';
import { resolveTheme } from '../../../src/core/theme.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';

/** `addMagic` registers `<sname>RoundCorner` -> `PName.RoundCorner` on `{<sname>}`
 *  (`FromSkinparamToStyle.java:275`). */
function elements(key: string, value: string) {
  return resolveSkinparam(new Map([[key, value]]), resolveTheme('default')).theme.colors.elements;
}

describe('<sname>RoundCorner skinparam', () => {
  it.each(['rectangle', 'card', 'package', 'node', 'database', 'participant'])('%s stores the raw value', (n) => {
    expect(elements(`${n}roundcorner`, '25')?.[n]?.roundCorner).toBe(25);
  });
  it('0 is a real value', () => {
    expect(elements('rectangleroundcorner', '0')?.['rectangle']?.roundCorner).toBe(0);
  });
  it('a non-number is rejected', () => {
    expect(elements('rectangleroundcorner', 'x')?.['rectangle']?.roundCorner).toBeUndefined();
  });
});
