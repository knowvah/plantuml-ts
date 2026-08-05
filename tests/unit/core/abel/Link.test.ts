import { describe, it, expect } from 'vitest';
import { Link } from '../../../../src/core/abel/Link.js';
import { LinkArg } from '../../../../src/core/abel/LinkArg.js';
import { LinkArrow } from '../../../../src/core/abel/LinkArrow.js';
import { LinkStrategy } from '../../../../src/core/abel/LinkStrategy.js';
import { CucaNote } from '../../../../src/core/abel/CucaNote.js';
import { NoteLinkStrategy } from '../../../../src/core/abel/NoteLinkStrategy.js';
import { Position } from '../../../../src/core/abel/Position.js';
import { Colors } from '../../../../src/core/abel/Colors.js';
import { EntityPort } from '../../../../src/core/abel/EntityPort.js';
import type { Bibliotekon } from '../../../../src/core/abel/Bibliotekon.js';
import { LeafType } from '../../../../src/core/abel/LeafType.js';
import type { Entity } from '../../../../src/core/abel/Entity.js';
import { LinkType } from '../../../../src/core/decoration/LinkType.js';
import { LinkDecor } from '../../../../src/core/decoration/LinkDecor.js';
import { LinkMiddleDecor } from '../../../../src/core/decoration/LinkMiddleDecor.js';
import { LinkStyle } from '../../../../src/core/decoration/LinkStyle.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { Ports } from '../../../../src/core/svek/Ports.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import { Url } from '../../../../src/core/url/Url.js';
import type { LineLocation } from '../../../../src/core/tim/LineLocation.js';
import { makeWorld, makeLeaf, makeGroup, type World } from './helpers.js';

function makeLink(
  world: World,
  e1: Entity,
  e2: Entity,
  type: LinkType = new LinkType(LinkDecor.NONE, LinkDecor.NONE),
  linkArg: LinkArg = LinkArg.noDisplay(2),
): Link {
  return new Link(undefined, world.diagram, { mock: 'sb' }, e1, e2, type, linkArg);
}

const mockBibliotekon: Bibliotekon = { getNodeUid: (leaf) => `uid_${leaf.getName()}` };

describe('Link constructor', () => {
  it('rejects length < 1', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    expect(() => makeLink(world, a, b, undefined, LinkArg.noDisplay(0))).toThrow('IllegalArgumentException');
  });

  it('draws its uid from the diagram sequence (lnk prefix, shared counter)', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a'); // seq 1
    const b = makeLeaf(world, 'b'); // seq 2
    expect(makeLink(world, a, b).getUid()).toBe('lnk3');
    expect(makeLink(world, a, b).getUid()).toBe('lnk4');
  });

  it('KERMOR pragma: exactly one non-normal entity position drops the constraint', () => {
    const world = makeWorld();
    world.diagram.pragma.define('kermor', 'true');
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const pin = makeLeaf(world, 'pin', LeafType.PORTIN);
    const pin2 = makeLeaf(world, 'pin2', LeafType.PORTIN);
    expect(makeLink(world, a, b).isConstraint()).toBe(true); // both normal
    expect(makeLink(world, pin, b).isConstraint()).toBe(false); // XOR
    expect(makeLink(world, pin, pin2).isConstraint()).toBe(true); // both non-normal
  });

  it('without KERMOR the constraint stays regardless of positions', () => {
    const world = makeWorld();
    const pin = makeLeaf(world, 'pin', LeafType.PORTIN);
    const b = makeLeaf(world, 'b');
    expect(makeLink(world, pin, b).isConstraint()).toBe(true);
  });
});

describe('Link.sameConnections (ADR-3 dedup keystone)', () => {
  it('matches identical and swapped entity pairs, by reference identity', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const c = makeLeaf(world, 'c');
    const d = makeLeaf(world, 'd');
    const ab = makeLink(world, a, b);
    expect(ab.sameConnections(makeLink(world, a, b))).toBe(true);
    expect(ab.sameConnections(makeLink(world, b, a))).toBe(true);
    expect(ab.sameConnections(makeLink(world, a, c))).toBe(false);
    expect(ab.sameConnections(makeLink(world, c, b))).toBe(false);
    expect(ab.sameConnections(makeLink(world, c, d))).toBe(false);
  });

  it('autolinks match only autolinks on the same entity', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const aa = makeLink(world, a, a);
    expect(aa.sameConnections(makeLink(world, a, a))).toBe(true);
    expect(aa.sameConnections(makeLink(world, b, b))).toBe(false);
    expect(aa.sameConnections(makeLink(world, a, b))).toBe(false);
  });

  it('same-named entities in different containers are different connections', () => {
    const world = makeWorld();
    const g1 = makeGroup(world, 'g1');
    const g2 = makeGroup(world, 'g2');
    const x1 = makeLeaf(world, 'x', LeafType.CLASS, g1.getQuark());
    const x2 = makeLeaf(world, 'x', LeafType.CLASS, g2.getQuark());
    const b = makeLeaf(world, 'b');
    expect(makeLink(world, x1, b).sameConnections(makeLink(world, x2, b))).toBe(false);
  });

  it('does not consult direction-independent state (type, length, ports)', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const thick = makeLink(world, a, b, new LinkType(LinkDecor.ARROW, LinkDecor.NONE), LinkArg.noDisplay(5));
    thick.setPortMembers('p1', 'p2');
    expect(makeLink(world, a, b).sameConnections(thick)).toBe(true);
  });
});

describe('Link.getInv', () => {
  it('swaps entities, ports and label sides; inverts type and the inverted flag', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const arg = LinkArg.noDisplay(3).withQuantifier('q1', 'q2');
    const link = makeLink(world, a, b, new LinkType(LinkDecor.ARROW, LinkDecor.NONE), arg);
    link.setPortMembers('p1', 'p2');
    const url = new Url('http://example.com', null, null);
    link.setUrl(url);
    const st = Stereotype.build('<<s>>')!;
    link.setStereotype(st);
    link.setLinkArrow(LinkArrow.DIRECT_NORMAL);

    const inv = link.getInv();
    expect(inv.getEntity1()).toBe(b);
    expect(inv.getEntity2()).toBe(a);
    expect(inv.isInverted()).toBe(true);
    expect(inv.getPortName1()).toBe('p2');
    expect(inv.getPortName2()).toBe('p1');
    expect(inv.getUrl()).toBe(url);
    expect(inv.getStereotype()).toBe(st);
    expect(inv.getType().toString()).toBe(new LinkType(LinkDecor.NONE, LinkDecor.ARROW).toString());
    expect(inv.getQuantifier1()).toBe('q2');
    expect(inv.getQuantifier2()).toBe('q1');
    expect(inv.getLength()).toBe(3);
    // linkArrow field is carried; the inverted flag makes getLinkArrow reverse it
    expect(inv.getLinkArrow()).toBe(LinkArrow.BACKWARD);
    expect(link.getLinkArrow()).toBe(LinkArrow.DIRECT_NORMAL);
  });

  it('double inversion restores the flag and direction', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const inv2 = makeLink(world, a, b).getInv().getInv();
    expect(inv2.isInverted()).toBe(false);
    expect(inv2.getEntity1()).toBe(a);
    expect(inv2.getEntity2()).toBe(b);
  });
});

describe('Link topology predicates', () => {
  it('isBetween / contains / getOther / doesTouch / isAutolink', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const c = makeLeaf(world, 'c');
    const ab = makeLink(world, a, b);
    expect(ab.isBetween(a, b)).toBe(true);
    expect(ab.isBetween(b, a)).toBe(true);
    expect(ab.isBetween(a, c)).toBe(false);
    expect(ab.contains(a)).toBe(true);
    expect(ab.contains(c)).toBe(false);
    expect(ab.getOther(a)).toBe(b);
    expect(ab.getOther(b)).toBe(a);
    expect(() => ab.getOther(c)).toThrow('IllegalArgumentException');
    expect(ab.doesTouch(makeLink(world, b, c))).toBe(true);
    expect(ab.doesTouch(makeLink(world, c, a))).toBe(true);
    expect(ab.doesTouch(makeLink(world, c, c))).toBe(false);
    expect(ab.isAutolink()).toBe(false);
    expect(makeLink(world, a, a).isAutolink()).toBe(true);
  });

  it('containsType inspects both leaf types', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a', LeafType.CLASS);
    const u = makeLeaf(world, 'u', LeafType.USECASE);
    const link = makeLink(world, a, u);
    expect(link.containsType(LeafType.CLASS)).toBe(true);
    expect(link.containsType(LeafType.USECASE)).toBe(true);
    expect(link.containsType(LeafType.OBJECT)).toBe(false);
  });

  it('isAutoLinkOfAGroup requires the SAME group on both ends', () => {
    const world = makeWorld();
    const g = makeGroup(world, 'g');
    const h = makeGroup(world, 'h');
    const a = makeLeaf(world, 'a');
    expect(makeLink(world, g, g).isAutoLinkOfAGroup()).toBe(true);
    expect(makeLink(world, g, h).isAutoLinkOfAGroup()).toBe(false);
    expect(makeLink(world, a, a).isAutoLinkOfAGroup()).toBe(false);
  });

  it('hasEntryPoint / hasTwoEntryPointsSameContainer track non-normal leaf positions', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const pin = makeLeaf(world, 'pin', LeafType.PORTIN);
    const pin2 = makeLeaf(world, 'pin2', LeafType.PORTIN);
    expect(makeLink(world, a, b).hasEntryPoint()).toBe(false);
    expect(makeLink(world, pin, b).hasEntryPoint()).toBe(true);
    expect(makeLink(world, pin, pin2).hasTwoEntryPointsSameContainer()).toBe(true);
    expect(makeLink(world, pin, b).hasTwoEntryPointsSameContainer()).toBe(false);
  });
});

describe('Link type resolution', () => {
  it('opale or sametail force a bare NONE/NONE type', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const bare = new LinkType(LinkDecor.NONE, LinkDecor.NONE).toString();
    const link = makeLink(world, a, b, new LinkType(LinkDecor.ARROW, LinkDecor.SQUARE));
    link.setOpale(true);
    expect(link.isOpale()).toBe(true);
    expect(link.getType().toString()).toBe(bare);

    const link2 = makeLink(world, a, b, new LinkType(LinkDecor.ARROW, LinkDecor.SQUARE));
    link2.setSametail('t');
    expect(link2.getSametail()).toBe('t');
    expect(link2.getType().toString()).toBe(bare);
  });

  it('getTypePatchCluster strips the decor facing a NON-empty group', () => {
    const world = makeWorld();
    const g = makeGroup(world, 'g');
    makeLeaf(world, 'inner', LeafType.CLASS, g.getQuark());
    const empty = makeGroup(world, 'empty');
    const b = makeLeaf(world, 'b');
    const type = new LinkType(LinkDecor.ARROW, LinkDecor.SQUARE);

    expect(makeLink(world, g, b, type).getTypePatchCluster().toString()).toBe(
      new LinkType(LinkDecor.ARROW, LinkDecor.NONE).toString(),
    );
    expect(makeLink(world, b, g, type).getTypePatchCluster().toString()).toBe(
      new LinkType(LinkDecor.NONE, LinkDecor.SQUARE).toString(),
    );
    expect(makeLink(world, empty, b, type).getTypePatchCluster().toString()).toBe(type.toString());
  });

  it('isInvis reflects the invisible style or the explicit flag', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const link = makeLink(world, a, b);
    expect(link.isInvis()).toBe(false);
    link.setInvis(true);
    expect(link.isInvis()).toBe(true);
    const invisible = new LinkType(LinkDecor.NONE, LinkDecor.NONE, LinkMiddleDecor.NONE, LinkStyle.INVISIBLE());
    expect(makeLink(world, a, b, invisible).isInvis()).toBe(true);
  });
});

describe('Link hidden/removed/url state', () => {
  it('isHidden combines goHidden with either entity', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const link = makeLink(world, a, b);
    expect(link.isHidden()).toBe(false);
    world.diagram.hidden.add(a);
    expect(link.isHidden()).toBe(true);
    world.diagram.hidden.delete(a);
    link.goHidden();
    expect(link.isHidden()).toBe(true);
  });

  it('isRemoved consults entity removal and stereotype removal', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const link = makeLink(world, a, b);
    expect(link.isRemoved()).toBe(false);
    world.diagram.removed.add(b);
    expect(link.isRemoved()).toBe(true);
    world.diagram.removed.delete(b);
    const st = Stereotype.build('<<gone>>')!;
    link.setStereotype(st);
    expect(link.isRemoved()).toBe(false);
    world.diagram.stereotypeRemoved.add(st);
    expect(link.isRemoved()).toBe(true);
  });

  it('hasUrl is url-driven for a NULL label; a real label hits the Display.hasUrl deferral', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const link = makeLink(world, a, b);
    expect(link.hasUrl()).toBe(false);
    link.setUrl(new Url('http://example.com', null, null));
    expect(link.hasUrl()).toBe(true);
    // Pre-existing ADR-8 deferral pin (.agent-notes/T5-entity-port.md): flip when Display.hasUrl lands.
    const labeled = makeLink(world, a, b, undefined, LinkArg.build(Display.create('lbl'), 1));
    expect(() => labeled.hasUrl()).toThrow('Display.hasUrl');
  });
});

describe('Link ports', () => {
  it('setPortMembers records port names on the link and short names on the entities', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const link = makeLink(world, a, b);
    expect(link.getPortName1()).toBeUndefined();
    link.setPortMembers('p1', 'p2');
    expect(link.getPortName1()).toBe('p1');
    expect(link.getPortName2()).toBe('p2');
    expect(a.getPortShortNames().has('p1')).toBe(true);
    expect(b.getPortShortNames().has('p2')).toBe(true);
  });

  it('getEntityPort1/2 encode member ports and use :P for entry/exit positions', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const pin = makeLeaf(world, 'pin', LeafType.PORTIN);
    const link = makeLink(world, a, b);
    link.setPortMembers('myport', undefined);
    expect(link.getEntityPort1(mockBibliotekon).getFullString()).toBe(
      'uid_a:' + Ports.encodePortNameToId('myport'),
    );
    expect(link.getEntityPort2(mockBibliotekon).getFullString()).toBe('uid_b');
    const pinLink = makeLink(world, pin, b);
    expect(pinLink.getEntityPort1(mockBibliotekon).getFullString()).toBe('uid_pin:P');
  });
});

describe('EntityPort (local port of cucadiagram/EntityPort.java)', () => {
  it('create/forPort/getFullString/getPrefix/startsWith/equalsId', () => {
    const plain = EntityPort.create('cluster0', undefined);
    expect(plain.getFullString()).toBe('cluster0');
    expect(plain.getPrefix()).toBe('cluster0');
    const shielded = EntityPort.create('node7:h', undefined);
    expect(shielded.getPrefix()).toBe('node7');
    const forPort = EntityPort.forPort('node7');
    expect(forPort.getFullString()).toBe('node7:P');
    expect(forPort.startsWith('node')).toBe(true);
    expect(forPort.startsWith('x')).toBe(false);
    expect(forPort.equalsId(EntityPort.create('node7', 'other'))).toBe(true);
    expect(forPort.equalsId(EntityPort.create('node8', undefined))).toBe(false);
  });
});

describe('Link notes, arrows and remaining accessors', () => {
  it('addNote/getNote/addNoteFrom with strategy rewrite', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const l1 = makeLink(world, a, b);
    const l2 = makeLink(world, a, b);
    expect(l1.getNote()).toBeUndefined();
    l2.addNoteFrom(l1, NoteLinkStrategy.HALF_NOT_PRINTED); // no note on l1 → no-op
    expect(l2.getNote()).toBeUndefined();
    const note = CucaNote.build(Display.NULL, Position.TOP, Colors.empty());
    l1.addNote(note);
    expect(l1.getNote()).toBe(note);
    expect(l1.getNote()!.getStrategy()).toBe(NoteLinkStrategy.NORMAL);
    l2.addNoteFrom(l1, NoteLinkStrategy.HALF_NOT_PRINTED);
    expect(l2.getNote()!.getStrategy()).toBe(NoteLinkStrategy.HALF_NOT_PRINTED);
    expect(l1.getNote()!.getStrategy()).toBe(NoteLinkStrategy.NORMAL);
  });

  it('getLinkArrow reverses only when inverted', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const link = makeLink(world, a, b);
    expect(link.getLinkArrow()).toBe(LinkArrow.NONE_OR_SEVERAL);
    link.setLinkArrow(LinkArrow.DIRECT_NORMAL);
    expect(link.getLinkArrow()).toBe(LinkArrow.DIRECT_NORMAL);
  });

  it('goNorank drops the constraint', () => {
    const world = makeWorld();
    const link = makeLink(world, makeLeaf(world, 'a'), makeLeaf(world, 'b'));
    expect(link.isConstraint()).toBe(true);
    link.goNorank();
    expect(link.isConstraint()).toBe(false);
  });

  it('idCommentForSvg / commentForSvg follow the raw type decor shape', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const reverted = makeLink(world, a, b, new LinkType(LinkDecor.NONE, LinkDecor.ARROW));
    expect(reverted.idCommentForSvg()).toBe('a-backto-b');
    expect(reverted.commentForSvg().getComment()).toBe('reverse link a to b');
    const bare = makeLink(world, a, b, new LinkType(LinkDecor.NONE, LinkDecor.NONE));
    expect(bare.idCommentForSvg()).toBe('a-b');
    expect(bare.commentForSvg().getComment()).toBe('link a to b');
    const normal = makeLink(world, a, b, new LinkType(LinkDecor.ARROW, LinkDecor.NONE));
    expect(normal.idCommentForSvg()).toBe('a-to-b');
  });

  it('accessor round-trips: weight, length, kals, codeLine, misc', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'a');
    const b = makeLeaf(world, 'b');
    const arg = LinkArg.noDisplay(2).withKal('k1', '').withDistanceAngle('1.5', '-30').withRole('r1', 'r2');
    const link = makeLink(world, a, b, undefined, arg);
    expect(link.getWeight()).toBe(1.0);
    link.setWeight(3.5);
    expect(link.getWeight()).toBe(3.5);
    expect(link.getLength()).toBe(2);
    link.setLength(5);
    expect(link.getLength()).toBe(5);
    expect(link.hasKal1()).toBe(true);
    expect(link.hasKal2()).toBe(false); // empty string
    expect(link.getLabeldistance()).toBe('1.5');
    expect(link.getLabelangle()).toBe('-30');
    expect(link.getRole1()).toBe('r1');
    expect(link.getRole2()).toBe('r2');
    expect(link.getLabel()).toBe(Display.NULL);
    expect(link.getCodeLine()).toBeUndefined();
    link.setCodeLine({ getPosition: () => 42 } as LineLocation);
    expect(link.getCodeLine()).toBe('42');
    expect(link.getLinkStrategy()).toBe(LinkStrategy.SIMPLEST);
    expect(link.getLocation()).toBeUndefined();
    expect(link.getStyleBuilder()).toEqual({ mock: 'sb' });
    expect(link.getVisibilityModifier()).toBeUndefined();
    expect(link.isHorizontalSolitary()).toBe(false);
    link.setHorizontalSolitary(true);
    expect(link.isHorizontalSolitary()).toBe(true);
    expect(link.getLinkConstraint()).toBeUndefined();
    const lc = {};
    link.setLinkConstraint(lc);
    expect(link.getLinkConstraint()).toBe(lc);
  });
});
