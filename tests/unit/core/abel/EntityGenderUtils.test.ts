import { describe, expect, it } from 'vitest';

import {
  byEntityType,
  byEntityAlone,
  byStereotype,
  byPackage,
  and,
  all,
  emptyMethods,
  emptyFields,
  byClassName,
} from '../../../../src/core/abel/EntityGenderUtils.js';
import { LeafType } from '../../../../src/core/abel/LeafType.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { makeWorld, makeLeaf, makeGroup, MockBodier } from './helpers.js';

/** Behavior tests from abel/EntityGenderUtils.java:42-177. */
describe('EntityGenderUtils', () => {
  it('byEntityType matches on leaf type and reports it as the gender', () => {
    const world = makeWorld();
    const cls = makeLeaf(world, 'A', LeafType.CLASS);
    const iface = makeLeaf(world, 'B', LeafType.INTERFACE);
    const g = byEntityType(LeafType.CLASS);
    expect(g.contains(cls)).toBe(true);
    expect(g.contains(iface)).toBe(false);
    expect(g.getGender()).toBe('CLASS');
  });

  it('byEntityAlone matches by uid', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'A');
    const b = makeLeaf(world, 'B');
    const g = byEntityAlone(a);
    expect(g.contains(a)).toBe(true);
    expect(g.contains(b)).toBe(false);
    expect(g.getGender()).toBe(a.getUid());
  });

  it('byStereotype: exact per-label equality over the double-guillemet labels', () => {
    const world = makeWorld();
    const tagged = makeLeaf(world, 'A');
    tagged.setStereotype(Stereotype.build('<<foo>><<bar>>'));
    const bare = makeLeaf(world, 'B');

    const g = byStereotype('<<foo>>');
    expect(g.contains(tagged)).toBe(true);
    expect(g.contains(bare)).toBe(false);
    expect(byStereotype('<<baz>>').contains(tagged)).toBe(false);
    expect(byStereotype('foo').contains(tagged)).toBe(false); // exact, brackets included
    expect(g.getGender()).toBe('<<foo>>');
  });

  it('byPackage: DIRECT parent equality only; root group rejected', () => {
    const world = makeWorld();
    const p = makeGroup(world, 'P');
    const q = makeGroup(world, 'Q', undefined, p.getQuark());
    const direct = makeLeaf(world, 'A', LeafType.CLASS, p.getQuark());
    const nested = makeLeaf(world, 'D', LeafType.CLASS, q.getQuark());
    const topLevel = makeLeaf(world, 'T');

    expect(() => byPackage(world.root)).toThrow('IllegalArgumentException');
    const g = byPackage(p);
    expect(g.contains(direct)).toBe(true);
    expect(g.contains(nested)).toBe(false); // no ancestor walk
    expect(g.contains(topLevel)).toBe(false); // parent is root
    expect(g.getGender()).toBeUndefined();
  });

  it('and composes; all matches everything', () => {
    const world = makeWorld();
    const cls = makeLeaf(world, 'A', LeafType.CLASS);
    cls.setStereotype(Stereotype.build('<<x>>'));
    const other = makeLeaf(world, 'B', LeafType.CLASS);

    const g = and(byEntityType(LeafType.CLASS), byStereotype('<<x>>'));
    expect(g.contains(cls)).toBe(true);
    expect(g.contains(other)).toBe(false);
    expect(g.getGender()).toBeUndefined();

    expect(all().contains(other)).toBe(true);
    expect(all().getGender()).toBeUndefined();
  });

  it('emptyMethods/emptyFields consult the bodier displays', () => {
    const world = makeWorld();
    const bodier = new MockBodier();
    const leaf = makeLeaf(world, 'A', LeafType.CLASS, world.plasma.root(), bodier);
    expect(emptyMethods().contains(leaf)).toBe(true);
    expect(emptyFields().contains(leaf)).toBe(true);
    bodier.methods = Display.create('doIt()');
    bodier.fields = Display.create('field1');
    expect(emptyMethods().contains(leaf)).toBe(false);
    expect(emptyFields().contains(leaf)).toBe(false);
  });

  it('byClassName matches the quark name', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'Alpha');
    const g = byClassName('Alpha');
    expect(g.contains(a)).toBe(true);
    expect(byClassName('Beta').contains(a)).toBe(false);
    expect(g.getGender()).toBe('Alpha');
  });
});
