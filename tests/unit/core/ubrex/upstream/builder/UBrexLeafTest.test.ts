import { describe, expect, it } from 'vitest';
import { UBrexConcat } from '../../../../../../src/core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../../../../src/core/ubrex/builder/UBrexLeaf.js';
import { TextNavigator } from '../../../../../../src/core/ubrex/TextNavigator.js';

// Port of ~/git/plantuml/src/test/java/com/plantuml/ubrex/builder/UBrexLeafTest.java (every assertion; Java line cited per assertion).
describe('UBrexLeafTest', () => {
  it('test1 (UBrexLeafTest.java:14)', () => {
    const m = new UBrexLeaf('else').match('else', 0);
    expect(m.startMatch()).toBe(true); // :19
    expect(m.exactMatch()).toBe(true); // :20
  });

  it('test2 (UBrexLeafTest.java:23)', () => {
    const m = new UBrexLeaf('else').match('elsex', 0);
    expect(m.startMatch()).toBe(true); // :28
    expect(m.exactMatch()).toBe(false); // :29
  });

  it('test3 (UBrexLeafTest.java:32)', () => {
    const string = TextNavigator.build('Xelse');
    const cut = new UBrexLeaf('else');
    expect(cut.match(string).startMatch()).toBe(false); // :38
    expect(cut.match(string).exactMatch()).toBe(false); // :39
    expect(cut.match(string, 1).startMatch()).toBe(true); // :41
    expect(cut.match(string, 1).exactMatch()).toBe(true); // :42
  });

  it('test4 (UBrexLeafTest.java:46)', () => {
    const string = TextNavigator.build('Xelse');
    string.jump(1);
    const cut = new UBrexLeaf('else');
    expect(cut.match(string).startMatch()).toBe(true); // :51
    expect(cut.match(string).exactMatch()).toBe(true); // :52
  });

  it('test5 (UBrexLeafTest.java:56)', () => {
    const string = TextNavigator.build('Xelse');
    expect(new UBrexLeaf('else').match(string, 1).startMatch()).toBe(true); // :60
  });

  it('test6 (UBrexLeafTest.java:64)', () => {
    const cut = new UBrexLeaf('else');
    expect(cut.match(TextNavigator.build('Xelse'), 1).startMatch()).toBe(true); // :67
    expect(cut.match(TextNavigator.build('XelseZ'), 1).exactMatch()).toBe(false); // :68
  });

  it('test7 (UBrexLeafTest.java:72)', () => {
    const cut = UBrexConcat.build(new UBrexLeaf('else'), UBrexLeaf.end());
    expect(cut.match('else', 0).exactMatch()).toBe(true); // :78
    expect(cut.match('else ', 0).exactMatch()).toBe(false); // :79
  });
});
