import { describe, expect, it } from 'vitest';

import { LeafType } from '../../../../src/core/abel/LeafType.js';
import { GroupType } from '../../../../src/core/abel/GroupType.js';
import { FontParam } from '../../../../src/core/abel/ISkinParam.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import { DisplayPositioned } from '../../../../src/core/abel/DisplayPositioned.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { VerticalAlignment } from '../../../../src/core/klimt/geom/VerticalAlignment.js';
import { PackageStyle } from '../../../../src/core/svek/PackageStyle.js';
import { makeWorld, makeLeaf, makeGroup, MockLink, MockSkinParam } from './helpers.js';

/** Behavior tests from abel/Entity.java (group/hierarchy/diagram half). */
describe('Entity (hierarchy half)', () => {
  it('getParentContainer walks the quark tree; root has none', () => {
    const world = makeWorld();
    const group = makeGroup(world, 'P');
    const leaf = makeLeaf(world, 'A', LeafType.CLASS, group.getQuark());
    expect(world.root.getParentContainer()).toBeUndefined();
    expect(group.getParentContainer()).toBe(world.root);
    expect(leaf.getParentContainer()).toBe(group);
  });

  it('leafs/groups/countChildren/isRoot/getName reflect the quark children', () => {
    const world = makeWorld();
    const group = makeGroup(world, 'P');
    const a = makeLeaf(world, 'A', LeafType.CLASS, group.getQuark());
    const q = makeGroup(world, 'Q', GroupType.PACKAGE, group.getQuark());
    expect(world.root.isRoot()).toBe(true);
    expect(group.isRoot()).toBe(false);
    expect(group.getName()).toBe('P');
    expect(group.countChildren()).toBe(2);
    expect(group.leafs()).toEqual([a]);
    expect(group.groups()).toEqual([q]);
    expect(world.root.groups()).toEqual([group]);
  });

  it('isEmpty is true when every child is removed', () => {
    const world = makeWorld();
    const group = makeGroup(world, 'P');
    const a = makeLeaf(world, 'A', LeafType.CLASS, group.getQuark());
    expect(group.isEmpty()).toBe(false);
    world.diagram.removed.add(a);
    expect(group.isEmpty()).toBe(true);
  });

  it('isHidden/isRemoved consult the parent chain then the diagram', () => {
    const world = makeWorld();
    const group = makeGroup(world, 'P');
    const leaf = makeLeaf(world, 'A', LeafType.CLASS, group.getQuark());
    expect(leaf.isHidden()).toBe(false);
    expect(world.root.isHidden()).toBe(false);
    world.diagram.hidden.add(group);
    expect(group.isHidden()).toBe(true);
    expect(leaf.isHidden()).toBe(true); // inherited from parent

    expect(leaf.isRemoved()).toBe(false);
    world.diagram.removed.add(leaf);
    expect(leaf.isRemoved()).toBe(true);
  });

  it('isAloneAndUnlinked: visible link to a live other makes it false', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'A');
    const b = makeLeaf(world, 'B');
    const c = makeLeaf(world, 'C');
    expect(a.isAloneAndUnlinked()).toBe(true);
    world.diagram.links.push(new MockLink(a, b));
    expect(a.isAloneAndUnlinked()).toBe(false);
    expect(c.isAloneAndUnlinked()).toBe(true);
    // removed-ignore-unlinked other neutralizes the link
    world.diagram.removedIgnoreUnlinked.add(b);
    expect(a.isAloneAndUnlinked()).toBe(true);
  });

  it('isAloneAndUnlinked ignores invisible links and recurses for groups', () => {
    const world = makeWorld();
    const group = makeGroup(world, 'P');
    const a = makeLeaf(world, 'A', LeafType.CLASS, group.getQuark());
    const b = makeLeaf(world, 'B');
    const invisible = new MockLink(a, b);
    const invisibleType = invisible.getType().getInvisible();
    world.diagram.links.push(new MockLink(a, b, invisibleType));
    expect(a.isAloneAndUnlinked()).toBe(true);
    expect(group.isAloneAndUnlinked()).toBe(true);
    world.diagram.links.push(new MockLink(a, b));
    expect(group.isAloneAndUnlinked()).toBe(false);
  });

  it('isAutarkic by group type, links, and child entity positions', () => {
    const world = makeWorld();
    const pkg = makeGroup(world, 'P', GroupType.PACKAGE);
    expect(pkg.isAutarkic()).toBe(false);
    const inner = makeGroup(world, 'IA', GroupType.INNER_ACTIVITY);
    expect(inner.isAutarkic()).toBe(true);
    expect(makeGroup(world, 'CA', GroupType.CONCURRENT_ACTIVITY).isAutarkic()).toBe(true);
    expect(makeGroup(world, 'CS', GroupType.CONCURRENT_STATE).isAutarkic()).toBe(true);

    const state = makeGroup(world, 'S', GroupType.STATE);
    const a = makeLeaf(world, 'A', LeafType.CLASS, state.getQuark());
    const outside = makeLeaf(world, 'O');
    expect(state.isAutarkic()).toBe(true);
    // a link crossing the boundary is not a pure inner link 3
    world.diagram.links.push(new MockLink(a, outside));
    expect(state.isAutarkic()).toBe(false);
  });

  it('isAutarkic false when a child leaf sits on the border (entry point)', () => {
    const world = makeWorld();
    const state = makeGroup(world, 'S', GroupType.STATE);
    const child = makeLeaf(world, 'E', LeafType.STATE, state.getQuark());
    child.setStereotype(Stereotype.build('<<entryPoint>>'));
    expect(state.isAutarkic()).toBe(false);
  });

  it('canBePacked: exactly one group child which itself has children, no links, not packed', () => {
    const world = makeWorld();
    const outer = makeGroup(world, 'Outer');
    const only = makeGroup(world, 'Only', GroupType.PACKAGE, outer.getQuark());
    makeLeaf(world, 'X', LeafType.CLASS, only.getQuark());
    expect(outer.canBePacked()).toBe(true);

    expect(only.canBePacked()).toBe(false); // its single child is a leaf ⇒ leafs()!==0

    outer.setPacked(false); // upstream setPacked always packs
    expect(outer.isPacked()).toBe(true);
    expect(outer.canBePacked()).toBe(false);
  });

  it('overrideImage swaps a group to a leaf and drops its pure inner links', () => {
    const world = makeWorld();
    const group = makeGroup(world, 'P');
    const a = makeLeaf(world, 'A', LeafType.CLASS, group.getQuark());
    const b = makeLeaf(world, 'B', LeafType.CLASS, group.getQuark());
    const outside = makeLeaf(world, 'O');
    const inner = new MockLink(a, b);
    const crossing = new MockLink(a, outside);
    world.diagram.links.push(inner, crossing);

    const img = {};
    group.overrideImage(img, LeafType.EMPTY_PACKAGE);
    expect(group.isGroup()).toBe(false);
    expect(group.getLeafType()).toBe(LeafType.EMPTY_PACKAGE);
    expect(group.getSvekImage()).toBe(img);
    expect(world.diagram.links).toEqual([crossing]);
  });

  it('legend and package style are group-only', () => {
    const world = makeWorld();
    const group = makeGroup(world, 'P');
    const legend = DisplayPositioned.single(Display.create('L'), HorizontalAlignment.CENTER, VerticalAlignment.TOP);
    group.setLegend(legend);
    expect(group.getLegend()).toBe(legend);
    const leaf = makeLeaf(world, 'A');
    expect(() => leaf.setLegend(legend)).toThrow('UnsupportedOperationException');

    expect(group.getPackageStyle()).toBeUndefined();
    group.setStereotype(Stereotype.build('<<Folder>>'));
    expect(group.getPackageStyle()).toBe(PackageStyle.FOLDER);
    expect(group.getStereotype()?.toString()).toContain('Folder');
  });

  it('getFontConfigurationForTitle asks STATE font for state groups, PACKAGE otherwise', () => {
    const world = makeWorld();
    const skinParam = new MockSkinParam();
    const pkg = makeGroup(world, 'P', GroupType.PACKAGE);
    const fc = pkg.getFontConfigurationForTitle(skinParam);
    expect(fc.getFont()).toBe(skinParam.font);
    expect(fc.getColor()).toBe(skinParam.fontHtmlColor);
    expect(fc.getHyperlinkColor()).toBe(skinParam.hyperlinkColor);
    expect(fc.getHyperlinkUnderlineStroke()).toBe(skinParam.underline);
    expect(fc.getTabSize()).toBe(8);
    expect(skinParam.fontHtmlColorCalls[0]).toEqual([FontParam.PACKAGE, FontParam.PACKAGE]);
    expect(skinParam.fontCalls[0]).toEqual({ inGroup: true, params: [FontParam.PACKAGE, FontParam.PACKAGE] });

    const state = makeGroup(world, 'S', GroupType.STATE);
    state.getFontConfigurationForTitle(skinParam);
    expect(skinParam.fontHtmlColorCalls[1]).toEqual([FontParam.STATE, FontParam.PACKAGE]);
  });

  it('getStateDescription is group-only and currently ADR-2 deferred', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    const skinParam = new MockSkinParam();
    expect(() => leaf.getStateDescription(skinParam)).toThrow('UnsupportedOperationException');
    const group = makeGroup(world, 'P');
    expect(() => group.getStateDescription(skinParam)).toThrow('deferred per SI1/ADR-2');
  });

  it('getCurrentStyleBuilder prefers the skinparam builder once skinparam was used (#2171)', () => {
    const world = makeWorld();
    const skinParam = new MockSkinParam();
    world.diagram.skinParam = skinParam;
    const leaf = makeLeaf(world, 'A');
    expect(leaf.getCurrentStyleBuilder()).not.toBe(skinParam.styleBuilder);
    world.diagram.skinParamUsed = true;
    expect(leaf.getCurrentStyleBuilder()).toBe(skinParam.styleBuilder);
    expect(leaf.getSkinParam()).toBe(skinParam);
  });
});
