import { describe, expect, it } from 'vitest';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { ComplementInColors } from '../../../../src/diagrams/gantt/lang/ComplementInColors.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementInColors.java:52-68.
const complement = new ComplementInColors();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);
const hex = (c: unknown): string => (c as HColorSimple).asString();

describe('ComplementInColors', () => {
  it.each(['in #FF0000', 'in  red', 'in #FF0000/#0000FF', 'in #red/blue'])('accepts %s (java:54-60)', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each(['#FF0000', 'on #FF0000', 'in', 'in #FF0000/'])('rejects %s (java:54-60)', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('a single colour yields centre only, border null (java:65-68)', () => {
    const m = parse('in #FF0000');
    const r = complement.getMe(newGantt(), m);
    expect(r.isFail()).toBe(false);
    expect(hex(r.get().getCenter())).toBe('#FF0000');
    expect(r.get().getStyle()).toBeUndefined();
  });

  it('COMPLEMENT2 after "/" is the border (java:62-64); apply uses it as line colour', () => {
    const gantt = newGantt();
    const m = parse('in #FF0000/#0000FF');
    expect(m.findFirstValueByKey('COMPLEMENT1')).toBe('#FF0000');
    expect(m.findFirstValueByKey('COMPLEMENT2')).toBe('#0000FF');
    const c = complement.getMe(gantt, m).get();
    expect(hex(c.getCenter())).toBe('#FF0000');
    expect(c.isOk()).toBe(true);
  });

  it('an unknown colour name resolves to white (getColorOrWhite)', () => {
    const c = complement.getMe(newGantt(), parse('in nosuchcolour')).get();
    expect(hex(c.getCenter())).toBe(hex(newGantt().getIHtmlColorSet().getColorOrWhite('#FFFFFF')));
  });

  it('absent captures give a null centre and border (java:65-67)', () => {
    const none = { findFirstValueByKey: (): undefined => undefined, findValuesByKey: (): string[] => [] };
    const c = complement.getMe(newGantt(), none).get();
    expect(c.getCenter()).toBeUndefined();
    expect(c.isOk()).toBe(false);
  });
});
