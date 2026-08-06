import { describe, it, expect } from 'vitest';
import { LinkArg } from '../../../../src/core/abel/LinkArg.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { VisibilityModifier } from '../../../../src/core/skin/VisibilityModifier.js';

describe('LinkArg', () => {
  it('build stores label and length; every optional slot starts undefined', () => {
    const arg = LinkArg.build(Display.create('hello'), 2);
    expect(Display.isNull(arg.getLabel())).toBe(false);
    expect(arg.getLength()).toBe(2);
    expect(arg.getVisibilityModifier()).toBeUndefined();
    expect(arg.getQuantifier1()).toBeUndefined();
    expect(arg.getQuantifier2()).toBeUndefined();
    expect(arg.getRole1()).toBeUndefined();
    expect(arg.getRole2()).toBeUndefined();
    expect(arg.getKal1()).toBeUndefined();
    expect(arg.getKal2()).toBeUndefined();
    expect(arg.getLabeldistance()).toBeUndefined();
    expect(arg.getLabelangle()).toBeUndefined();
  });

  it('noDisplay yields the NULL display', () => {
    const arg = LinkArg.noDisplay(3);
    expect(arg.getLabel()).toBe(Display.NULL);
    expect(arg.getLength()).toBe(3);
  });

  it('a null label short-circuits to Display.NULL without modifier extraction', () => {
    const arg = LinkArg.build(Display.NULL, 1);
    expect(arg.getLabel()).toBe(Display.NULL);
    expect(arg.getVisibilityModifier()).toBeUndefined();
  });

  it('extracts the method visibility modifier from the first label element', () => {
    expect(LinkArg.build(Display.create('+run()'), 1).getVisibilityModifier()).toBe(
      VisibilityModifier.PUBLIC_METHOD,
    );
    expect(LinkArg.build(Display.create('-x y'), 1).getVisibilityModifier()).toBe(
      VisibilityModifier.PRIVATE_METHOD,
    );
  });

  it('manageVisibilityModifier=false skips extraction', () => {
    const arg = LinkArg.build(Display.create('+run()'), 1, false);
    expect(arg.getVisibilityModifier()).toBeUndefined();
  });

  it('short or doubled first characters are not visibility markers', () => {
    expect(LinkArg.build(Display.create('+a'), 1).getVisibilityModifier()).toBeUndefined();
    expect(LinkArg.build(Display.create('++ab'), 1).getVisibilityModifier()).toBeUndefined();
  });

  it('withQuantifier / withRole / withKal / withDistanceAngle build new instances', () => {
    const base = LinkArg.noDisplay(1);
    const q = base.withQuantifier('1', '*');
    expect(q).not.toBe(base);
    expect(q.getQuantifier1()).toBe('1');
    expect(q.getQuantifier2()).toBe('*');
    expect(base.getQuantifier1()).toBeUndefined();

    const r = q.withRole('owner', 'owned');
    expect(r.getRole1()).toBe('owner');
    expect(r.getRole2()).toBe('owned');
    expect(r.getQuantifier1()).toBe('1');

    const k = r.withKal('k1', 'k2');
    expect(k.getKal1()).toBe('k1');
    expect(k.getKal2()).toBe('k2');
    expect(k.getRole1()).toBe('owner');

    const d = k.withDistanceAngle('2.0', '45');
    expect(d.getLabeldistance()).toBe('2.0');
    expect(d.getLabelangle()).toBe('45');
    expect(d.getKal1()).toBe('k1');
    expect(d.getQuantifier2()).toBe('*');
  });

  it('getInv swaps quantifiers, kals, and roles but keeps label/length/distance/angle', () => {
    const arg = LinkArg.build(Display.create('lbl'), 4)
      .withQuantifier('q1', 'q2')
      .withRole('r1', 'r2')
      .withKal('k1', 'k2')
      .withDistanceAngle('d', 'a');
    const inv = arg.getInv();
    expect(inv.getQuantifier1()).toBe('q2');
    expect(inv.getQuantifier2()).toBe('q1');
    expect(inv.getRole1()).toBe('r2');
    expect(inv.getRole2()).toBe('r1');
    expect(inv.getKal1()).toBe('k2');
    expect(inv.getKal2()).toBe('k1');
    expect(inv.getLabel()).toBe(arg.getLabel());
    expect(inv.getLength()).toBe(4);
    expect(inv.getLabeldistance()).toBe('d');
    expect(inv.getLabelangle()).toBe('a');
  });

  it('setLength and setVisibilityModifier mutate in place (the two mutable fields)', () => {
    const arg = LinkArg.noDisplay(1);
    arg.setLength(7);
    expect(arg.getLength()).toBe(7);
    arg.setVisibilityModifier(VisibilityModifier.PUBLIC_FIELD);
    expect(arg.getVisibilityModifier()).toBe(VisibilityModifier.PUBLIC_FIELD);
  });
});
