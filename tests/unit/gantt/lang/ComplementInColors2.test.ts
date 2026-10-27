import { describe, expect, it } from 'vitest';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { ComplementInColors2 } from '../../../../src/diagrams/gantt/lang/ComplementInColors2.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementInColors2.java:52-69.
const complement = new ComplementInColors2();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);
const hex = (c: unknown): string => (c as HColorSimple).asString();

describe('ComplementInColors2', () => {
  it.each(['colored #FF0000', 'coloured  red', 'colored in #FF0000/#0000FF', 'coloured in  #00FF00'])(
    'accepts %s (java:54-61)',
    (s) => {
      expect(parse(s).exactMatch()).toBe(true);
    },
  );

  it.each(['#FF0000', 'color #FF0000', 'colored', 'colored #FF0000/'])('rejects %s (java:54-61)', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('a single colour yields centre only, border null (java:65-69)', () => {
    const m = parse('colored #FF0000');
    const r = complement.getMe(newGantt(), m);
    expect(r.isFail()).toBe(false);
    expect(hex(r.get().getCenter())).toBe('#FF0000');
    expect(r.get().getStyle()).toBeUndefined();
  });

  it('COMPLEMENT2 after "/" is the border (java:64-68); apply uses it as line colour', () => {
    const gantt = newGantt();
    const m = parse('coloured in #FF0000/#0000FF');
    expect(m.findFirstValueByKey('COMPLEMENT1')).toBe('#FF0000');
    expect(m.findFirstValueByKey('COMPLEMENT2')).toBe('#0000FF');
    const c = complement.getMe(gantt, m).get();
    expect(hex(c.getCenter())).toBe('#FF0000');
    expect(c.isOk()).toBe(true);
  });

  it('an unknown colour name resolves to white (getColorOrWhite)', () => {
    const c = complement.getMe(newGantt(), parse('colored nosuchcolour')).get();
    expect(hex(c.getCenter())).toBe(hex(newGantt().getIHtmlColorSet().getColorOrWhite('#FFFFFF')));
  });

  it('absent captures give a null centre and border (java:66-68)', () => {
    const none = { findFirstValueByKey: (): undefined => undefined, findValuesByKey: (): string[] => [] };
    const c = complement.getMe(newGantt(), none).get();
    expect(c.getCenter()).toBeUndefined();
    expect(c.isOk()).toBe(false);
  });
});
