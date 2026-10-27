import { describe, expect, it } from 'vitest';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { ComplementInColorsFromTo } from '../../../../src/diagrams/gantt/lang/ComplementInColorsFromTo.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementInColorsFromTo.java:52-82.
const complement = new ComplementInColorsFromTo();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);
const hex = (c: unknown): string => (c as HColorSimple).asString();

describe('ComplementInColorsFromTo', () => {
  it.each(['from #FF0000 to #0000FF', 'from  #FF0000/#00FF00  to  #0000FF/#000000', 'from red to blue'])(
    'accepts %s (java:54-67)',
    (s) => {
      expect(parse(s).exactMatch()).toBe(true);
    },
  );

  it.each(['from #FF0000', 'to #FF0000', 'from #FF0000 #0000FF', 'from #FF0000/ to #0000FF'])(
    'rejects %s (java:54-67)',
    (s) => {
      expect(parse(s).exactMatch()).toBe(false);
    },
  );

  it('returns [from, to] pairs (java:70-82)', () => {
    const r = complement.getMe(newGantt(), parse('from #FF0000 to #0000FF'));
    const [from, to] = r.get();
    expect(r.get()).toHaveLength(2);
    expect(hex(from!.getCenter())).toBe('#FF0000');
    expect(hex(to!.getCenter())).toBe('#0000FF');
  });

  it('captures FROM2 and TO2 as the borders (java:72-79)', () => {
    const m = parse('from #FF0000/#00FF00 to #0000FF/#000000');
    expect(m.findFirstValueByKey('FROM1')).toBe('#FF0000');
    expect(m.findFirstValueByKey('FROM2')).toBe('#00FF00');
    expect(m.findFirstValueByKey('TO1')).toBe('#0000FF');
    expect(m.findFirstValueByKey('TO2')).toBe('#000000');
    const [from, to] = complement.getMe(newGantt(), m).get();
    expect(hex(from!.getCenter())).toBe('#FF0000');
    expect(hex(to!.getCenter())).toBe('#0000FF');
  });

  it('absent captures give null colours (java:76-79)', () => {
    const none = { findFirstValueByKey: (): undefined => undefined, findValuesByKey: (): string[] => [] };
    const [from, to] = complement.getMe(newGantt(), none).get();
    expect(from!.getCenter()).toBeUndefined();
    expect(to!.getCenter()).toBeUndefined();
  });
});
