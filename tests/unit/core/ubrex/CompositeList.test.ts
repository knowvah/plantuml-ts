import { describe, expect, it } from 'vitest';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { CompositeList } from '../../../../src/core/ubrex/CompositeList.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';
import { lengthOf } from './helpers.js';

describe('CompositeList', () => {
  it('createEmpty matches zero-width; addChallenge appends in order', () => {
    const list = CompositeList.createEmpty();
    expect(lengthOf(list, 'ab')).toBe(0);
    list.addChallenge(new ChallengeSingleChar('a'));
    list.addChallenge(new ChallengeSingleChar('b'));
    expect(lengthOf(list, 'abc')).toBe(2);
    expect(lengthOf(list, 'ac')).toBe(-2147483648);
    expect(list.getInternalChallengesList().length).toBe(2);
  });

  it('parseAndBuild parses a definition; toString is the List format (CompositeList.java toString)', () => {
    expect(CompositeList.parseAndBuild('ab').toString()).toBe('[[a], [b]]');
  });

  it('parseAndBuild rejects undefined (Java null) and the empty definition', () => {
    expect(() => CompositeList.parseAndBuild(undefined)).toThrow('IllegalArgumentException');
    expect(() => CompositeList.parseAndBuild('')).toThrow('UnsupportedOperationException');
  });

  it('parseAndBuildFromTextNavigator consumes the navigator and rejects undefined', () => {
    const nav = TextNavigator.build('a b');
    const list = CompositeList.parseAndBuildFromTextNavigator(nav);
    expect(list.getInternalChallengesList().length).toBe(2);
    expect(nav.length()).toBe(0);
    expect(() => CompositeList.parseAndBuildFromTextNavigator(undefined)).toThrow('IllegalArgumentException');
  });
});
