import { describe, expect, it } from 'vitest';
import { AtomicParser } from '../../../../src/core/ubrex/AtomicParser.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../src/core/ubrex/UnicodeBracketedExpression.js';
import { javaList } from './helpers.js';

const build = (ubrex: string): UnicodeBracketedExpression => UnicodeBracketedExpression.build(ubrex);

describe('AtomicParser', () => {
  describe('syntax errors (AtomicParser.java throw sites)', () => {
    it.each([
      ['┇', 'IllegalArgumentException', 'parse: bare alternative separator'],
      ['〒x', 'Syntax error', 'manageLookAround: unknown look-around'],
      ['〒=〄>a', 'UnsupportedOperationException', 'parseSingle: operand parsed into two challenges'],
      ['〇za', 'wip01', 'manageQuantifier: unknown operator'],
      ['〄x', 'manageQuantifierUpTo1', 'manageUpTo: unknown operator'],
      ['〄+a b', 'manageQuantifierUpTo2', 'manageUpTo: missing -'],
      ['〄+a-b', 'manageQuantifierUpTo2', 'manageUpTo: missing >'],
      ['〘ab', 'wip99', 'manageGroup: unclosed group'],
      ['【a┇b', 'wip32', 'manageAlternative: unclosed alternative'],
      ['〶x', 'varname must have a $', 'manageNamed: no $'],
      ['〶$=a', 'no name!', 'manageNamed: empty name'],
      ['〶$a-', 'Unsupported name!', 'manageNamed: bad name char'],
      ['「ab', 'wip80', 'manageCharacterSet: unclosed set'],
    ])('%s -> %s (%s)', (ubrex, message) => {
      expect(() => build(ubrex)).toThrow(message);
    });

    it('a bare space reaching manageRegularCharacter is an IllegalStateException', () => {
      expect(() => new AtomicParser().parse(TextNavigator.build(' a'))).toThrow('no space allowed');
    });

    it('an unterminated 〄+ runs off the end (Java StringIndexOutOfBoundsException -> RangeError)', () => {
      expect(() => build('〄+a')).toThrow(RangeError);
    });
  });

  describe('notation', () => {
    it('〃 is a double quote and ∙ is a space', () => {
      expect(build('〃∙a').match('" a').getAcceptedMatch()).toBe('" a');
    });

    it('〄> returns the up-to challenge and the target as siblings', () => {
      const cut = build('〶$x=〄>;');
      expect(cut.match('ab;').getAcceptedMatch()).toBe('ab;');
      expect(javaList(cut.match('ab;').findValuesByKey('x'))).toBe('[ab]');
    });

    it('nested alternatives and groups are split at their own level', () => {
      expect(build('【a┇【b┇c】d】').match('cd').getAcceptedMatch()).toBe('cd');
      expect(build('【a┇【b┇c】d】').match('a').getAcceptedMatch()).toBe('a');
      expect(build('〘a〘b〙〙c').match('abc').getAcceptedMatch()).toBe('abc');
    });

    it('a named lazy quantifier keeps its stop condition outside the group', () => {
      const m = build('〶$g=〇l+a b').match('aab');
      expect(javaList(m.findValuesByKey('g'))).toBe('[aa]');
      expect(m.getAcceptedMatch()).toBe('aab');
    });

    it('identifier parts allowed in group names: digits and underscore', () => {
      expect(javaList(build('〶$a_1=x').match('x').findValuesByKey('a_1'))).toBe('[x]');
    });
  });
});
