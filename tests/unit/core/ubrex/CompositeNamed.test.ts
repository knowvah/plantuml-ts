import { describe, expect, it } from 'vitest';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { CompositeNamed } from '../../../../src/core/ubrex/CompositeNamed.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';
import { javaList, lengthOf } from './helpers.js';

describe('CompositeNamed', () => {
  it('single-challenge constructor captures the matched text under the name', () => {
    const c = new CompositeNamed('g', new ChallengeSingleChar('a'));
    const r = c.runChallenge(TextNavigator.build('ab'), 0);
    expect(r.getFullCaptureLength()).toBe(1);
    expect(javaList(r.findValuesByKey('g'))).toBe('[a]');
  });

  it('list constructor runs the challenges in order; a failing one is NO_MATCH', () => {
    const c = new CompositeNamed('g', [new ChallengeSingleChar('a'), new ChallengeSingleChar('b')]);
    expect(lengthOf(c, 'ab')).toBe(2);
    expect(lengthOf(c, 'ac')).toBe(-2147483648);
  });

  it('toString (CompositeNamed.java toString)', () => {
    expect(new CompositeNamed('g', new ChallengeSingleChar('a')).toString()).toBe('(g) [[a]]');
  });
});
