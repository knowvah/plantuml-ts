/**
 * `SKINPARAMETER_NAMES` -- the table `PSystemSkinparameterList` prints:
 * `SkinParam.getPossibleValues()` (`SkinParam.java:567-641`), a `TreeSet`
 * of literal keys plus keys derived from the FontParam/ColorParam/LineParam/
 * AlignmentParam enums at runtime (ufp T0e, D5).
 */
import { describe, expect, it } from 'vitest';

import { SKINPARAMETER_NAMES } from '../../../src/diagrams/donors/skinparameter-names.js';

describe('SKINPARAMETER_NAMES', () => {
  it('holds the 478 keys the jar prints, first and last in TreeSet order', () => {
    expect(SKINPARAMETER_NAMES).toHaveLength(478);
    expect(SKINPARAMETER_NAMES[0]).toBe('ActivityBackgroundColor');
    expect(SKINPARAMETER_NAMES.at(-1)).toBe('WrapWidth');
  });

  it('is code-unit sorted with no duplicates, as a TreeSet<String> iterates', () => {
    const sorted = [...new Set(SKINPARAMETER_NAMES)].sort();
    expect(SKINPARAMETER_NAMES).toEqual(sorted);
  });

  it('contains literal keys and enum-derived keys alike', () => {
    expect(SKINPARAMETER_NAMES).toContain('Monochrome'); // SkinParam.java:569
    expect(SKINPARAMETER_NAMES).toContain('FixCircleLabelOverlapping'); // SkinParam.java:620
    expect(SKINPARAMETER_NAMES).toContain('UsecaseStereotypeFontStyle'); // FontParam loop, java:623-629
    expect(SKINPARAMETER_NAMES).toContain('BackgroundColor'); // literal commented out (java:570), ColorParam.background re-adds it
    expect(SKINPARAMETER_NAMES).not.toContain('LifelineStrategy'); // commented out, java:621
  });
});
