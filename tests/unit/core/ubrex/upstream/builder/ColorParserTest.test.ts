import { describe, expect, it } from 'vitest';
import { UBrexConcat } from '../../../../../../src/core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexOneOrMore } from '../../../../../../src/core/ubrex/builder/UBrexOneOrMore.js';
import { UBrexOr } from '../../../../../../src/core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../../../../src/core/ubrex/builder/UBrexPart.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/builder/ColorParserTest.java (every assertion; Java line cited per assertion).
// ColorParserTest.java:15-18 (COLOR_REGEXP / PART2 / COLORS_REGEXP) are unused regex strings upstream and are not ported.
function cutPart1(): UBrexPart {
  return UBrexConcat.build(new UBrexLeaf('# 〇+〴w 〇?〘 「-\\|/」 〇+〴w 〙'), UBrexLeaf.end()); // :22-27
}

function cutPart2(): UBrexPart {
  return UBrexConcat.build(
    new UBrexLeaf('# 〇?〘 〇+〴w 〇?〘 「-\\|/」 〇+〴w 〙 ;  〙'),
    new UBrexOneOrMore(
      UBrexConcat.build(
        new UBrexLeaf('【text┇back┇header┇line.dashed┇line.dotted┇line.bold┇line┇shadowing】'),
        new UBrexLeaf('# 〇?〘 〇+〴w 〇?〘 「-\\|/」 〇+〴w 〙  〙'),
        new UBrexLeaf('【 ; ┇ 〒!「〴w;:.」 】'),
      ),
    ),
  ); // :30-38
}

function cutPart(): UBrexPart {
  return new UBrexOr(cutPart1(), cutPart2()); // :41-44
}

describe('ColorParserTest', () => {
  it('testCut (ColorParserTest.java:46)', () => {
    const cut = cutPart();
    expect(cut.match('#foo-bar;text#foo;', 0).exactMatch()).toBe(true); // :50
    expect(cut.match('#foo;text#foo;', 0).exactMatch()).toBe(true); // :51
    expect(cut.match('#foo-bar;header#foo;', 0).exactMatch()).toBe(true); // :54
    expect(cut.match('#foo-bar;header#foo', 0).exactMatch()).toBe(true); // :57
    expect(cut.match('#foo-bar;header#foo,', 0).startMatch()).toBe(true); // :60
    expect(cut.match('#foo-bar;header#foo,', 0).exactMatch()).toBe(false); // :61
    expect(cut.match('#foo-bar', 0).exactMatch()).toBe(true); // :64
    expect(cut.match('#foo', 0).exactMatch()).toBe(true); // :65
  });

  it('test200 (ColorParserTest.java:70)', () => {
    const cut = cutPart2();
    expect(cut.match('#foo-bar;text#foo;', 0).exactMatch()).toBe(true); // :73
    expect(cut.match('#foo;text#foo;', 0).exactMatch()).toBe(true); // :74
  });

  it('test201 (ColorParserTest.java:77)', () => {
    const match = cutPart2().match('#foo-bar;header#foo;', 0);
    expect(match.exactMatch()).toBe(true); // :81
  });

  it('test202 (ColorParserTest.java:85)', () => {
    const match = cutPart2().match('#foo-bar;header#foo', 0);
    expect(match.exactMatch()).toBe(true); // :89
  });

  it('test203 (ColorParserTest.java:93)', () => {
    const match = cutPart2().match('#foo-bar;header#foo,', 0);
    expect(match.startMatch()).toBe(true); // :97
    expect(match.exactMatch()).toBe(false); // :98
  });

  it('test100 (ColorParserTest.java:102)', () => {
    const cut = cutPart1();
    expect(cut.match('#foo-bar', 0).exactMatch()).toBe(true); // :105
    expect(cut.match('#foo', 0).exactMatch()).toBe(true); // :106
  });
});
