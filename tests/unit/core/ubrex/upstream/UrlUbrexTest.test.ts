import { describe, expect, it } from 'vitest';
import { TextNavigator } from '../../../../../src/core/ubrex/TextNavigator.js';
import { UnicodeBracketedExpression } from '../../../../../src/core/ubrex/UnicodeBracketedExpression.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/UrlUbrexTest.java (every assertion; Java line cited per assertion).
/** UrlUbrexTest.java:9-15 */
function buildPart(...parts: string[]): UnicodeBracketedExpression {
  return UnicodeBracketedExpression.build(parts.join(''));
}

function accepted(cut: UnicodeBracketedExpression, text: string): string {
  return cut.match(TextNavigator.build(text)).getAcceptedMatch();
}

describe('UrlUbrexTest', () => {
  it('testTooltip (UrlUbrexTest.java:18)', () => {
    const sQuoted = buildPart('〇?〘 〇*〴s { 〇*「〤{}」 } 〙');
    expect(accepted(sQuoted, '{tooltip}')).toBe('{tooltip}'); // :22
  });

  it('test_S_QUOTED (UrlUbrexTest.java:26)', () => {
    const cut = buildPart(
      '[[ 〇*〴s',
      '〃  〇+「〤〃」 〃',
      '〇?〘 〇*〴s { 〇*「〤{}」 } 〙',
      '〇?〘 〴s 「〤〴s{}[]」  〇*「〤[]」 〙',
      '〇*〴s  ]]',
    );
    expect(accepted(cut, '[["hello1"]]')).toBe('[["hello1"]]'); // :37
    expect(accepted(cut, '[["he llo2"]]')).toBe('[["he llo2"]]'); // :38
    expect(accepted(cut, '[["he llo3"]]xx')).toBe('[["he llo3"]]'); // :39
    expect(accepted(cut, 'x[["he llo4"]]xxx')).toBe(''); // :40
    expect(accepted(cut, '[x["he llo5"]]xxx')).toBe(''); // :41
    expect(accepted(cut, '[["he llo6"{tooltip}]]')).toBe('[["he llo6"{tooltip}]]'); // :43-44
  });

  it('test_S_ONLY_TOOLTIP (UrlUbrexTest.java:48)', () => {
    const cut = buildPart('[[ 〇*〴s', '{  〇+「〤{}」 }', '〇*〴s  ]]');
    expect(accepted(cut, '[[ { hello1  }  ]]')).toBe('[[ { hello1  }  ]]'); // :57-58
    expect(accepted(cut, '[[{hello1}]]xx')).toBe('[[{hello1}]]'); // :59
  });

  it('test_S_ONLY_TOOLTIP_AND_LABEL (UrlUbrexTest.java:63)', () => {
    const cut = buildPart('[[ 〇*〴s', '{  〇+「〤{}」 }', '〇*〴s', '「〤〴s[]{}」 〇*「〤[]」 ', '〇*〴s  ]]');
    expect(accepted(cut, '[[{hello1}toto]]')).toBe('[[{hello1}toto]]'); // :74
    expect(accepted(cut, '[[{hello2}   toto{}  ]]')).toBe('[[{hello2}   toto{}  ]]'); // :75-76
  });

  it('test_S_LINK_TOOLTIP_NOLABEL (UrlUbrexTest.java:80)', () => {
    const cut = buildPart('[[ 〇*〴s', '〇+「〤〴s〴g{}[]」', '〇*〴s', '{  〇*「〤{}」  } ', '〇*〴s  ]]');
    expect(accepted(cut, '[[http://toto1 {foo}]]')).toBe('[[http://toto1 {foo}]]'); // :91-92
  });

  it('test_S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL (UrlUbrexTest.java:96)', () => {
    const cut = buildPart(
      '[[ 〇*〴s',
      '〇+「〤〴s〴g[]」',
      '〇?〘  〇*〴s  {  〇*「〤{}」  } 〙',
      '〇?〘  〴s   「〤〴s{}[]」  〇*「〤[]」   〙',
      '〇*〴s  ]]',
    );
    expect(accepted(cut, '[[http://toto1]]')).toBe('[[http://toto1]]'); // :107
    expect(accepted(cut, '[[http://toto2 {foo}]]')).toBe('[[http://toto2 {foo}]]'); // :108-109
    expect(accepted(cut, '[[http://toto2 label]]')).toBe('[[http://toto2 label]]'); // :110-111
    expect(accepted(cut, '[[http://toto2 my label]]')).toBe('[[http://toto2 my label]]'); // :112-113
    expect(accepted(cut, '[[http://toto2  my label]]')).toBe(''); // :114
    expect(accepted(cut, '[[http://toto2{tooltip} my label]]')).toBe('[[http://toto2{tooltip} my label]]'); // :115-116
  });
});
