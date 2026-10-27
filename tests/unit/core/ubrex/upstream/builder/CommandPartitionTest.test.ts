import { describe, expect, it } from 'vitest';
import { UBrexConcat } from '../../../../../../src/core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../../../../src/core/ubrex/builder/UBrexNamed.js';
import { UBrexOptional } from '../../../../../../src/core/ubrex/builder/UBrexOptional.js';
import type { UnicodeBracketedExpression } from '../../../../../../src/core/ubrex/UnicodeBracketedExpression.js';
import { javaList } from '../../helpers.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/builder/CommandPartitionTest.java (every assertion; Java line cited per assertion).
function cut(): UnicodeBracketedExpression {
  return UBrexConcat.build(
    new UBrexLeaf('partition'),
    UBrexLeaf.spaceOneOrMore(),
    new UBrexLeaf('【 〃 〶$NAME=〇+「〤〃」 〃 ┇ 〶$NAME=〇+〴S   】'),
    UBrexLeaf.spaceZeroOrMore(),
    new UBrexOptional(new UBrexNamed('STEREOTYPE', new UBrexLeaf('<<  〄+〴. ->〘 >>〙'))),
    UBrexLeaf.spaceZeroOrMore(),
    new UBrexOptional(new UBrexLeaf('{')),
    UBrexLeaf.end(),
  ); // :28-40
}

describe('CommandPartitionTest', () => {
  it('test1 (CommandPartitionTest.java:43)', () => {
    const c = cut();
    expect(c.match('partition "foo"', 0).exactMatch()).toBe(true); // :46
    expect(c.match(' partition "foo"', 0).exactMatch()).toBe(false); // :47
    expect(c.match('partition "foo"Z', 0).exactMatch()).toBe(false); // :48
    const match = c.match('partition "foo"', 0);
    expect(match.exactMatch()).toBe(true); // :51
    expect(javaList(match.findValuesByKey('NAME'))).toBe('[foo]'); // :52
  });

  it('test2 (CommandPartitionTest.java:56)', () => {
    const match = cut().match('partition DUMMY', 0);
    expect(match.exactMatch()).toBe(true); // :60
    expect(javaList(match.findValuesByKey('NAME'))).toBe('[DUMMY]'); // :61
  });

  it('test3 (CommandPartitionTest.java:65)', () => {
    const match = cut().match('partition DUMMY <<my-stereo>>', 0);
    expect(match.exactMatch()).toBe(true); // :69
    expect(javaList(match.findValuesByKey('NAME'))).toBe('[DUMMY]'); // :70
    expect(javaList(match.findValuesByKey('STEREOTYPE'))).toBe('[<<my-stereo>>]'); // :71
  });
});
