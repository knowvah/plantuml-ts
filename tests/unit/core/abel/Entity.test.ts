import { describe, expect, it } from 'vitest';

import { LeafType } from '../../../../src/core/abel/LeafType.js';
import { GroupType } from '../../../../src/core/abel/GroupType.js';
import { EntityPosition } from '../../../../src/core/abel/EntityPosition.js';
import { Position } from '../../../../src/core/abel/Position.js';
import { Colors } from '../../../../src/core/abel/Colors.js';
import { ColorType } from '../../../../src/core/abel/ColorType.js';
import { Stereotag } from '../../../../src/core/abel/Stereotag.js';
import { SingleStrategy } from '../../../../src/core/abel/SingleStrategy.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import { USymbols } from '../../../../src/core/decoration/symbol/USymbols.js';
import { Margins } from '../../../../src/core/svek/image/EntityImageDescriptionSupport.js';
import { Url } from '../../../../src/core/url/Url.js';
import { makeWorld, makeLeaf, makeGroup, MockBodier } from './helpers.js';

/** Behavior tests from abel/Entity.java (fields/uids/mutes/accessors half). */
describe('Entity (base half)', () => {
  it('root entity gets uid "entroot"; leaves get ent%04d from the sequence', () => {
    const world = makeWorld();
    expect(world.root.getUid()).toBe('entroot');
    const a = makeLeaf(world, 'A');
    const b = makeLeaf(world, 'B');
    expect(a.getUid()).toBe('ent0001');
    expect(b.getUid()).toBe('ent0002');
  });

  it('registers itself as the quark data', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'A');
    expect(a.getQuark().getData()).toBe(a);
    expect(world.plasma.root().getData()).toBe(world.root);
  });

  it('leaf/group discrimination via isGroup and the type getters', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A', LeafType.CLASS);
    const group = makeGroup(world, 'P', GroupType.PACKAGE);
    expect(leaf.isGroup()).toBe(false);
    expect(group.isGroup()).toBe(true);
    expect(leaf.getLeafType()).toBe(LeafType.CLASS);
    expect(group.getGroupType()).toBe(GroupType.PACKAGE);
    expect(() => leaf.getGroupType()).toThrow('UnsupportedOperationException');
  });

  it('addNote/getNotes file TOP and BOTTOM separately; others throw', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    const top = Display.create('t');
    const bottom = Display.create('b');
    leaf.addNote(top, Position.TOP, Colors.empty());
    leaf.addNote(bottom, Position.BOTTOM, Colors.empty());
    leaf.addNote(Display.create('x'), Position.LEFT, Colors.empty()); // silently ignored upstream
    expect(leaf.getNotes(Position.TOP).map((n) => n.getDisplay())).toEqual([top]);
    expect(leaf.getNotes(Position.BOTTOM).map((n) => n.getDisplay())).toEqual([bottom]);
    expect(() => leaf.getNotes(Position.LEFT)).toThrow('IllegalArgumentException');
  });

  it('stereotags dedupe by name, first add wins, insertion order', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    const first = new Stereotag('x');
    leaf.addStereotag(first);
    leaf.addStereotag(new Stereotag('y'));
    leaf.addStereotag(new Stereotag('x'));
    expect(leaf.stereotags()).toEqual([first, new Stereotag('y')]);
    expect(leaf.stereotags()[0]).toBe(first);
  });

  it('muteToType (1-arg) mutes CLASS→OBJECT through the bodier', () => {
    const world = makeWorld();
    const bodier = new MockBodier();
    const leaf = makeLeaf(world, 'A', LeafType.CLASS, world.plasma.root(), bodier);
    leaf.muteToType(LeafType.OBJECT);
    expect(leaf.getLeafType()).toBe(LeafType.OBJECT);
    expect(bodier.muteClassToObjectCalls).toBe(1);
  });

  it('muteToType (2-arg) guard matrix: same type true, non-class-family false', () => {
    const world = makeWorld();
    const cls = makeLeaf(world, 'A', LeafType.CLASS);
    expect(cls.muteToType(LeafType.CLASS, undefined)).toBe(true);

    const usecase = makeLeaf(world, 'U', LeafType.USECASE);
    expect(usecase.muteToType(LeafType.INTERFACE, undefined)).toBe(false);
    expect(usecase.getLeafType()).toBe(LeafType.USECASE);

    const cls2 = makeLeaf(world, 'B', LeafType.CLASS);
    expect(cls2.muteToType(LeafType.USECASE, undefined)).toBe(false);
    expect(cls2.getLeafType()).toBe(LeafType.CLASS);
  });

  it('muteToType (2-arg) mutes class-family and STILL_UNKNOWN, storing the symbol', () => {
    const world = makeWorld();
    const cls = makeLeaf(world, 'A', LeafType.CLASS);
    expect(cls.muteToType(LeafType.ENUM, USymbols.RECTANGLE)).toBe(true);
    expect(cls.getLeafType()).toBe(LeafType.ENUM);
    expect(cls.getUSymbol()).toBe(USymbols.RECTANGLE);

    const unknown = makeLeaf(world, 'U', LeafType.STILL_UNKNOWN);
    expect(unknown.muteToType(LeafType.USECASE, undefined)).toBe(true);
    expect(unknown.getLeafType()).toBe(LeafType.USECASE);
  });

  it('muteToGroupType turns a leaf into a group', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A', LeafType.STATE);
    leaf.muteToGroupType(GroupType.STATE);
    expect(leaf.isGroup()).toBe(true);
    expect(leaf.getGroupType()).toBe(GroupType.STATE);
  });

  it('display defaults empty; setDisplay/getDisplay round-trip', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    expect(Display.isNull(leaf.getDisplay())).toBe(false);
    expect(leaf.getDisplay().size()).toBe(0);
    const d = Display.create('Hello');
    leaf.setDisplay(d);
    expect(leaf.getDisplay()).toBe(d);
  });

  it('toString prints quark, display, types (Java null spelling) and uid', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A', LeafType.CLASS);
    // Java's empty Display prints as "[]" (AbstractCollection.toString) — the port mirrors it.
    expect(leaf.toString()).toBe('A [](CLASS)[null] ent0001');
    const group = makeGroup(world, 'P', GroupType.PACKAGE);
    expect(group.toString()).toBe('P [](null)[PACKAGE] ent0002');
  });

  it('addUrl/getUrl99 round-trip; hasUrl propagates the deferred Display.hasUrl', () => {
    const world = makeWorld();
    const bodier = new MockBodier();
    const leaf = makeLeaf(world, 'A', LeafType.CLASS, world.plasma.root(), bodier);
    expect(leaf.getUrl99()).toBeUndefined();
    const url = new Url('http://x', null, null);
    leaf.addUrl(url);
    expect(leaf.getUrl99()).toBe(url);
    // Faithful body reaches display.hasUrl() first, which THIS PORT's
    // Display defers (ADR-8 documented deferral in Display.ts). The
    // bodier/url fallbacks become reachable when Display.hasUrl lands.
    expect(() => leaf.hasUrl()).toThrow('Display.hasUrl');
  });

  it('margins merge via ensureMargins; getMargins guarded for groups', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    expect(leaf.getMargins()).toBe(Margins.NONE);
    leaf.ensureMargins(new Margins(1, 2, 3, 4));
    leaf.ensureMargins(new Margins(2, 1, 0, 8));
    expect(leaf.getMargins().toString()).toBe('MARGIN[2,2,3,8]');
    const group = makeGroup(world, 'P');
    expect(() => group.getMargins()).toThrow('UnsupportedOperationException');
    group.ensureMargins(new Margins(1, 1, 1, 1)); // upstream: checkNotGroup commented out
  });

  it('xposition/svekImage/generic accessors are leaf-only', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    leaf.setXposition(5);
    expect(leaf.getXposition()).toBe(5);
    const img = {};
    leaf.setSvekImage(img);
    expect(leaf.getSvekImage()).toBe(img);
    leaf.setGeneric('T');
    expect(leaf.getGeneric()).toBe('T');
    const group = makeGroup(world, 'P');
    expect(() => group.setXposition(1)).toThrow('UnsupportedOperationException');
    expect(() => group.getSvekImage()).toThrow('UnsupportedOperationException');
    expect(() => group.setGeneric('X')).toThrow('UnsupportedOperationException');
  });

  it('getEntityPosition: ports, non-state NORMAL, state stereotype dispatch', () => {
    const world = makeWorld();
    expect(makeLeaf(world, 'in', LeafType.PORTIN).getEntityPosition()).toBe(EntityPosition.PORTIN);
    expect(makeLeaf(world, 'out', LeafType.PORTOUT).getEntityPosition()).toBe(EntityPosition.PORTOUT);
    expect(makeLeaf(world, 'c', LeafType.CLASS).getEntityPosition()).toBe(EntityPosition.NORMAL);

    const plain = makeLeaf(world, 's1', LeafType.STATE);
    expect(plain.getEntityPosition()).toBe(EntityPosition.NORMAL);

    const entry = makeLeaf(world, 's2', LeafType.STATE);
    entry.setStereotype(Stereotype.build('<<entryPoint>>'));
    expect(entry.getEntityPosition()).toBe(EntityPosition.ENTRY_POINT);

    const exit = makeLeaf(world, 's3', LeafType.STATE);
    exit.setStereotype(Stereotype.build('<<exitPoint>>'));
    expect(exit.getEntityPosition()).toBe(EntityPosition.EXIT_POINT);
  });

  it('getUSymbol special-cases USECASE/USECASE_BUSINESS/CIRCLE, else the set symbol', () => {
    const world = makeWorld();
    expect(makeLeaf(world, 'u', LeafType.USECASE).getUSymbol()).toBe(USymbols.USECASE);
    expect(makeLeaf(world, 'ub', LeafType.USECASE_BUSINESS).getUSymbol()).toBe(USymbols.USECASE_BUSINESS);
    expect(makeLeaf(world, 'ci', LeafType.CIRCLE).getUSymbol()).toBe(USymbols.INTERFACE);
    const leaf = makeLeaf(world, 'c', LeafType.DESCRIPTION);
    expect(leaf.getUSymbol()).toBeUndefined();
    leaf.setUSymbol(USymbols.DATABASE);
    expect(leaf.getUSymbol()).toBe(USymbols.DATABASE);
  });

  it('getSingleStrategy is always SQUARE', () => {
    const world = makeWorld();
    expect(makeLeaf(world, 'A').getSingleStrategy()).toBe(SingleStrategy.SQUARE);
  });

  it('colors: setColors/getColors and setSpecificColorTOBEREMOVED', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    expect(leaf.getColors().isEmpty()).toBe(true);
    const red = { r: 255, g: 0, b: 0, a: 255 };
    leaf.setSpecificColorTOBEREMOVED(ColorType.BACK, red);
    expect(leaf.getColors().getColor(ColorType.BACK)).toBe(red);
    leaf.setSpecificColorTOBEREMOVED(ColorType.LINE, undefined);
    expect(leaf.getColors().getColor(ColorType.LINE)).toBeUndefined();
    const replacement = Colors.empty();
    leaf.setColors(replacement);
    expect(leaf.getColors()).toBe(replacement);
  });

  it('port short names collect uniquely; read is leaf-only', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    leaf.addPortShortName('p1');
    leaf.addPortShortName('p2');
    leaf.addPortShortName('p1');
    expect([...leaf.getPortShortNames()]).toEqual(['p1', 'p2']);
    const group = makeGroup(world, 'P');
    expect(() => group.getPortShortNames()).toThrow('UnsupportedOperationException');
  });

  it('stereostyle builds from <<<...>>> labels', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    expect(leaf.getStereostyles().isEmpty()).toBe(true);
    leaf.setStereostyle('<<<red>>>');
    expect(leaf.getStereostyles().getStyleNames()).toEqual(['red']);
  });

  it('kals are grouped by direction, in insertion order', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    const k1 = { getPosition: () => 'LEFT' as const };
    const k2 = { getPosition: () => 'LEFT' as const };
    const k3 = { getPosition: () => 'UP' as const };
    leaf.addKal(k1);
    leaf.addKal(k2);
    leaf.addKal(k3);
    expect(leaf.getKals('LEFT')).toEqual([k1, k2]);
    expect(leaf.getKals('UP')).toEqual([k3]);
    expect(leaf.getKals('DOWN')).toEqual([]);
  });

  it('tips map keeps insertion order', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    const d1 = Display.create('one');
    leaf.putTip('m1', d1);
    leaf.putTip('m2', Display.create('two'));
    expect([...leaf.getTips().keys()]).toEqual(['m1', 'm2']);
    expect(leaf.getTips().get('m1')).toBe(d1);
  });

  it('misc scalar accessors: rawLayout, concurrentSeparator, static, visibility, together, legend', () => {
    const world = makeWorld();
    const leaf = makeLeaf(world, 'A');
    expect(leaf.getRawLayout()).toBe(0);
    expect(leaf.getConcurrentSeparator()).toBe('\u0000'); // Java char default
    leaf.setConcurrentSeparator('-');
    expect(leaf.getConcurrentSeparator()).toBe('-');
    expect(leaf.isStatic()).toBe(false);
    leaf.setStatic(true);
    expect(leaf.isStatic()).toBe(true);
    const n = {};
    leaf.setNeighborhood(n);
    expect(leaf.getNeighborhood()).toBe(n);
    expect(leaf.getLocation()).toBeUndefined();
    expect(leaf.getDiagram()).toBe(world.diagram);
    expect(leaf.getDiagramType()).toBe('CLASS');
    expect(leaf.getBestMatch('cand')).toBe('match:cand');
  });
});
