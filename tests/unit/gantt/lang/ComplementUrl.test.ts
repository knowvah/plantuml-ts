import { describe, expect, it } from 'vitest';
import { ComplementUrl } from '../../../../src/diagrams/gantt/lang/ComplementUrl.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementUrl.java:48-61 and UbrexUrlBuilder.java:112-139.
const complement = new ComplementUrl();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementUrl', () => {
  it.each(['[[http://a.b]]', '[[http://a.b{tip} label]]'])('accepts %s (java:50)', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each(['http://a.b', '[http://a.b]', '[[http://a.b]', ''])('rejects %j (java:50)', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('getMe builds the Url with an empty top url, STRICT (java:58-60)', () => {
    const url = complement.getMe(newGantt(), parse('[[http://a.b/c]]')).get();
    expect(url?.getUrl()).toBe('http://a.b/c');
  });

  it('carries tooltip and label (UbrexUrlBuilder.java buildUrl)', () => {
    const url = complement.getMe(newGantt(), parse('[[http://a.b{the tip} the label]]')).get();
    expect(url?.getUrl()).toBe('http://a.b');
    expect(url?.getTooltip()).toBe('the tip');
    expect(url?.getLabel()).toBe('the label');
  });

  it('an unparseable url throws IllegalArgumentException (UbrexUrlBuilder.java:138 -> ComplementUrl.java:61 -> Failable.java:57-58)', () => {
    const lookup = { findFirstValueByKey: () => '', findValuesByKey: () => [] };
    expect(() => complement.getMe(newGantt(), lookup)).toThrow('IllegalArgumentException');
  });
});
