import { describe, expect, it } from 'vitest';

import { Stereostyles } from '../../../../src/core/abel/Stereostyles.js';

/** Behavior tests from stereo/Stereostyles.java:45-69. */
describe('Stereostyles', () => {
  it('NONE is empty', () => {
    expect(Stereostyles.NONE.isEmpty()).toBe(true);
    expect(Stereostyles.NONE.getStyleNames()).toEqual([]);
  });

  it('build extracts a single <<<name>>> group', () => {
    const s = Stereostyles.build('<<<red>>>');
    expect(s.isEmpty()).toBe(false);
    expect(s.getStyleNames()).toEqual(['red']);
  });

  it('build extracts multiple groups in order and dedupes', () => {
    const s = Stereostyles.build('<<<a>>><<<b>>><<<a>>>');
    expect(s.getStyleNames()).toEqual(['a', 'b']);
  });

  it('build of a label without triple guillemets is empty', () => {
    expect(Stereostyles.build('<<plain>>').isEmpty()).toBe(true);
  });

  it('is non-greedy per group (upstream (.*?))', () => {
    expect(Stereostyles.build('<<<x>>> and <<<y>>>').getStyleNames()).toEqual(['x', 'y']);
  });
});
