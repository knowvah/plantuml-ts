import { describe, expect, it } from 'vitest';
import { ChallengeSingleChar } from '../../../../src/core/ubrex/ChallengeSingleChar.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../src/core/ubrex/UnicodeBracketedExpression.js';
import { javaList } from './helpers.js';

describe('UnicodeBracketedExpression', () => {
  const cut = UnicodeBracketedExpression.build('〶$k=〇+〴d x');

  it('exactMatch needs the whole text; startMatch only a prefix', () => {
    expect(cut.match('12x').exactMatch()).toBe(true);
    expect(cut.match('12xy').exactMatch()).toBe(false);
    expect(cut.match('12xy').startMatch()).toBe(true);
    expect(cut.match('y').exactMatch()).toBe(false);
    expect(cut.match('y').startMatch()).toBe(false);
  });

  it('match accepts a TextNavigator with and without a position', () => {
    expect(cut.match(TextNavigator.build('12x')).getAcceptedMatch()).toBe('12x');
    expect(cut.match(TextNavigator.build('a12x'), 1).getAcceptedMatch()).toBe('12x');
  });

  it('exposes captures: findFirstValueByKey, findFirstValuesByKeyPrefix, extractByPrefix', () => {
    const m = cut.match('12x');
    expect(m.findFirstValueByKey('k')).toBe('12');
    expect(m.findFirstValueByKey('nope')).toBeUndefined();
    expect(javaList(m.findFirstValuesByKeyPrefix('k') ?? [])).toBe('[12]');
    const nested = UnicodeBracketedExpression.build('〶$g=〘〶$k=〇+〴d〙').match('12');
    expect(javaList(nested.extractByPrefix('g').findValuesByKey('k'))).toBe('[12]');
  });

  it('toString is the accepted text then the challenge result (UnicodeBracketedExpression.java toString)', () => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- UMatcher.toString is the Java anonymous-class toString
    expect(cut.match('12x').toString().startsWith('12x fullCaptureLength=3 ')).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- UMatcher.toString is the Java anonymous-class toString
    expect(cut.match('y').toString().startsWith(' fullCaptureLength=-2147483648 ')).toBe(true);
  });

  it('from wraps any Challenge', () => {
    expect(UnicodeBracketedExpression.from(new ChallengeSingleChar('q')).match('Q').getAcceptedMatch()).toBe('Q');
  });
});
