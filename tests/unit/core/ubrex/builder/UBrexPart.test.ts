import { describe, expect, it } from 'vitest';
import { UBrexLeaf } from '../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexPart } from '../../../../../src/core/ubrex/builder/UBrexPart.js';
import { CompositeList } from '../../../../../src/core/ubrex/CompositeList.js';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';

// UBrexPart.java:42-45 (getChallenge) and :48-51 (final match(TextNavigator,int) -> UnicodeBracketedExpression.from(challenge)).
class TestPart extends UBrexPart {
  public constructor(definition: string) {
    super(CompositeList.parseAndBuild(definition));
  }
}

describe('UBrexPart', () => {
  it('getChallenge returns the wrapped challenge (UBrexPart.java:42)', () => {
    const part = new TestPart('ab');
    expect(part.getChallenge()).toBeInstanceOf(CompositeList);
    expect(part.getChallenge()).toBe(part.getChallenge());
  });

  it('match accepts a string with a position (UBrexPart.java:48)', () => {
    const part = new TestPart('ab');
    expect(part.match('xab', 1).getAcceptedMatch()).toBe('ab');
    expect(part.match('xab', 0).startMatch()).toBe(false);
  });

  it('match accepts a TextNavigator and defaults position to 0 (UBrexPart.java:48)', () => {
    const part = new UBrexLeaf('ab');
    expect(part.match(TextNavigator.build('abc')).getAcceptedMatch()).toBe('ab');
    expect(part.match(TextNavigator.build('abc')).exactMatch()).toBe(false);
  });
});
