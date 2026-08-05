import { describe, it, expect } from 'vitest';
import { CucaDiagram, InstallationRequirement } from '../../../../src/core/cucadiagram/CucaDiagram.js';
import { PortionShower } from '../../../../src/core/cucadiagram/PortionShower.js';
import { BodierJSon } from '../../../../src/core/cucadiagram/BodierJSon.js';
import { BodierMap } from '../../../../src/core/cucadiagram/BodierMap.js';
import type { Entity } from '../../../../src/core/abel/Entity.js';
import { EntityPortion } from '../../../../src/core/abel/EntityPortion.js';
import { all, byEntityType } from '../../../../src/core/abel/EntityGenderUtils.js';
import { GroupType } from '../../../../src/core/abel/GroupType.js';
import { LeafType } from '../../../../src/core/abel/LeafType.js';
import { Link } from '../../../../src/core/abel/Link.js';
import { LinkArg } from '../../../../src/core/abel/LinkArg.js';
import type { ISkinParam } from '../../../../src/core/abel/ISkinParam.js';
import { LinkType } from '../../../../src/core/decoration/LinkType.js';
import { LinkDecor } from '../../../../src/core/decoration/LinkDecor.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { PragmaKey } from '../../../../src/core/skin/PragmaKey.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import { PreprocessingArtifact } from '../../../../src/core/tim/PreprocessingArtifact.js';
import { ParserPass } from '../../../../src/core/command/ParserPass.js';
import { MockSkinParam } from '../abel/helpers.js';

/** Concrete harness over the real (abstract) class: supplies the two
 * abstract members (`getSkinParam` from the TitledDiagram boundary,
 * `getDotStrings` from :397) and pins a STABLE pragma (MockSkinParam
 * returns a fresh empty one per call, which would defeat define/
 * undefine round-trips). Unlike `abel/helpers.ts`'s MockDiagram it
 * overrides NO hide/remove members — these tests exercise the real
 * fold machinery. */
class TestDiagram extends CucaDiagram {
  readonly mockSkinParam = new MockSkinParam();
  readonly stablePragma: Pragma = Pragma.createEmpty();
  dotStrings: readonly string[] = [];

  constructor() {
    super({}, 'CLASS', undefined, new PreprocessingArtifact());
  }

  protected getDotStrings(): readonly string[] {
    return this.dotStrings;
  }
  getSkinParam(): ISkinParam {
    return this.mockSkinParam;
  }
  override getPragma(): Pragma {
    return this.stablePragma;
  }
}

function leaf(d: TestDiagram, name: string, type: LeafType = LeafType.CLASS): Entity {
  return d.reallyCreateLeaf(undefined, d.quarkInContext(true, name), Display.getWithNewlines(d.getPragma(), name), type, undefined);
}

function link(d: TestDiagram, e1: Entity, e2: Entity, single = false): Link {
  const l = new Link(undefined, d, {}, e1, e2, new LinkType(LinkDecor.NONE, LinkDecor.NONE), LinkArg.noDisplay(1));
  if (single) l.goSingle();
  return l;
}

describe('CucaDiagram construction and root', () => {
  it('creates the ROOT group on the root quark; group stack starts there', () => {
    const d = new TestDiagram();
    const root = d.getRootGroup();
    expect(root.isRoot()).toBe(true);
    expect(root.isGroup()).toBe(true);
    expect(root.getGroupType()).toBe(GroupType.ROOT);
    expect(root.getUid()).toBe('entroot');
    expect(d.getCurrentGroup()).toBe(root);
    expect(d.groupsAndRoot()).toEqual([root]);
    expect(d.groups()).toEqual([]);
    expect(d.leafs()).toEqual([]);
  });

  it('getUniqueSequenceValue and getUniqueSequence share cpt1; getUniqueSequence2 is separate', () => {
    const d = new TestDiagram();
    expect(d.getUniqueSequenceValue()).toBe(1);
    expect(d.getUniqueSequence('lnk')).toBe('lnk2');
    expect(d.getUniqueSequenceValue()).toBe(3);
    expect(d.getUniqueSequence2('x')).toBe('x1');
  });
});

describe('quarkInContext — no namespace separator', () => {
  it('reuses any same-named quark via firstWithName, else children of the current group', () => {
    const d = new TestDiagram();
    const a = d.quarkInContext(true, 'A');
    expect(a.getParent()).toBe(d.getRootGroup().getQuark());
    // second lookup finds the SAME quark by name
    expect(d.quarkInContext(true, 'A')).toBe(a);
    // reuse happens through firstWithName even with reuseExistingChild=false
    expect(d.quarkInContext(false, 'A')).toBe(a);
  });
});

describe('quarkInContext — with namespace separator', () => {
  it('rejects names ending with or doubling the separator (score 3)', () => {
    const d = new TestDiagram();
    d.setNamespaceSeparator('.');
    const bad = d.quarkInContextSafe(true, 'a.');
    expect(bad.isFail()).toBe(true);
    expect(bad.getError()).toBe('Bad name since . is a separator');
    expect(bad.getScore()).toBe(3);
    expect(d.quarkInContextSafe(true, 'a..b').isFail()).toBe(true);
  });

  it('resolves a leading separator from the root', () => {
    const d = new TestDiagram();
    d.setNamespaceSeparator('.');
    const q = d.quarkInContext(true, '.x.y');
    expect(q.getQualifiedName()).toBe('x.y');
  });

  it('plain names land in the current group; reuseExistingChild returns a unique same-named quark', () => {
    const d = new TestDiagram();
    d.setNamespaceSeparator('.');
    d.gotoGroup(undefined, d.quarkInContext(false, 'p'), Display.getWithNewlines(d.getPragma(), 'p'), GroupType.PACKAGE);
    const inP = d.quarkInContext(false, 'X');
    expect(inP.getQualifiedName()).toBe('p.X');
    // X is unique in the whole plasma — reuse finds it from anywhere
    d.endGroup();
    expect(d.quarkInContext(true, 'X')).toBe(inP);
    // without reuse, a NEW root-level X is created
    const rootX = d.quarkInContext(false, 'X');
    expect(rootX).not.toBe(inP);
    expect(rootX.getQualifiedName()).toBe('X');
  });

  it('a qualified name whose first package exists resolves from the root; a leaf first segment is an error', () => {
    const d = new TestDiagram();
    d.setNamespaceSeparator('.');
    d.gotoGroup(undefined, d.quarkInContext(false, 'p'), Display.getWithNewlines(d.getPragma(), 'p'), GroupType.PACKAGE);
    d.endGroup();
    const q = d.quarkInContext(true, 'p.X');
    expect(q.getQualifiedName()).toBe('p.X');
    // unknown first segment: created under the current group (root here)
    const r = d.quarkInContext(true, 'q.Y');
    expect(r.getQualifiedName()).toBe('q.Y');
    // a LEAF first segment is "Not a package"
    leaf(d, 'L');
    const bad = d.quarkInContextSafe(true, 'L.Z');
    expect(bad.isFail()).toBe(true);
    expect(bad.getError()).toBe('Not a package: L');
  });
});

describe('group stack', () => {
  it('gotoGroup creates the group once, mutes its type, and pushes it; endGroup pops', () => {
    const d = new TestDiagram();
    const q = d.quarkInContext(false, 'p');
    const rc = d.gotoGroup(undefined, q, Display.getWithNewlines(d.getPragma(), 'p'), GroupType.PACKAGE);
    expect(rc.isOk()).toBe(true);
    const p = q.getData() as Entity;
    expect(p.isGroup()).toBe(true);
    expect(p.getGroupType()).toBe(GroupType.PACKAGE);
    expect(d.getCurrentGroup()).toBe(p);
    // re-entering the same quark reuses the entity and re-mutes the type
    d.endGroup();
    d.gotoGroup(undefined, q, Display.getWithNewlines(d.getPragma(), 'p'), GroupType.STATE);
    expect(q.getData()).toBe(p);
    expect(p.getGroupType()).toBe(GroupType.STATE);
    d.endGroup();
    expect(d.getCurrentGroup()).toBe(d.getRootGroup());
    expect(d.isGroup('p')).toBe(true);
    expect(d.isGroup(q)).toBe(true);
    expect(d.getGroup('p')).toBe(p);
    expect(d.isGroup('nope')).toBe(false);
    expect(d.getGroup('nope')).toBeUndefined();
  });

  it('together frames stack transparently for getCurrentGroup and nest their parents', () => {
    const d = new TestDiagram();
    expect(d.currentTogether()).toBeUndefined();
    d.gotoTogether();
    const t1 = d.currentTogether();
    expect(t1).toBeDefined();
    expect(t1?.getParent()).toBeUndefined();
    expect(d.getCurrentGroup()).toBe(d.getRootGroup());
    d.gotoTogether();
    expect(d.currentTogether()?.getParent()).toBe(t1);
    d.endGroup();
    expect(d.currentTogether()).toBe(t1);
    d.endGroup();
    expect(d.currentTogether()).toBeUndefined();
  });

  it('endGroup pops even the root frame, then reports false on an empty stack', () => {
    const d = new TestDiagram();
    expect(d.endGroup()).toBe(true);
    expect(d.endGroup()).toBe(false);
    expect(() => d.getCurrentGroup()).toThrow('IllegalStateException');
  });

  it('startingPass resets lastEntity, cpt2, and trims the stack to the root frame', () => {
    const d = new TestDiagram();
    d.gotoTogether();
    d.gotoGroup(undefined, d.quarkInContext(false, 'p'), Display.getWithNewlines(d.getPragma(), 'p'), GroupType.PACKAGE);
    leaf(d, 'A');
    d.getUniqueSequence2('x');
    d.startingPass(ParserPass.TWO);
    expect(d.getLastEntity()).toBeUndefined();
    expect(d.getCurrentGroup()).toBe(d.getRootGroup());
    expect(d.currentTogether()).toBeUndefined();
    expect(d.getUniqueSequence2('x')).toBe('x1');
  });
});

describe('reallyCreateLeaf', () => {
  it('creates the leaf with display, symbol, together, and lastEntity', () => {
    const d = new TestDiagram();
    d.gotoTogether();
    const a = leaf(d, 'A');
    expect(a.isGroup()).toBe(false);
    expect(a.getLeafType()).toBe(LeafType.CLASS);
    expect(a.getName()).toBe('A');
    expect(d.getLastEntity()).toBe(a);
    expect(a.getTogether()).toBe(d.currentTogether());
    expect(d.leafs()).toEqual([a]);
  });

  it('guards: occupied quark and NULL display throw', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    expect(() =>
      d.reallyCreateLeaf(undefined, a.getQuark(), Display.getWithNewlines(d.getPragma(), 'A'), LeafType.CLASS, undefined),
    ).toThrow('IllegalStateException');
    expect(() => d.reallyCreateLeaf(undefined, d.quarkInContext(true, 'B'), Display.NULL, LeafType.CLASS, undefined)).toThrow(
      'IllegalArgumentException',
    );
  });

  it('MAP and JSON leaves get their dedicated bodiers', () => {
    const d = new TestDiagram();
    expect(leaf(d, 'M', LeafType.MAP).getBodier()).toBeInstanceOf(BodierMap);
    expect(leaf(d, 'J', LeafType.JSON).getBodier()).toBeInstanceOf(BodierJSon);
  });
});

describe('phantom groups', () => {
  it('a class-like leaf on a dangling path builds PACKAGE groups for data-less parent quarks', () => {
    const d = new TestDiagram();
    d.setNamespaceSeparator('.');
    const q = d.quarkInContext(true, 'p.X');
    expect(q.getParent()?.getData()).toBeUndefined();
    d.reallyCreateLeaf(undefined, q, Display.getWithNewlines(d.getPragma(), 'X'), LeafType.CLASS, undefined);
    const p = q.getParent()?.getData() as Entity;
    expect(p).toBeDefined();
    expect(p.isGroup()).toBe(true);
    expect(p.getGroupType()).toBe(GroupType.PACKAGE);
    expect(d.groups()).toEqual([p]);
  });

  it('a non-class-like leaf builds no phantom groups', () => {
    const d = new TestDiagram();
    d.setNamespaceSeparator('.');
    const q = d.quarkInContext(true, 'p.U');
    d.reallyCreateLeaf(undefined, q, Display.getWithNewlines(d.getPragma(), 'U'), LeafType.USECASE, undefined);
    expect(q.getParent()?.getData()).toBeUndefined();
  });
});

describe('link management — ADR-3 dedup semantics', () => {
  it('addLink dedups single links on same connections, in BOTH orientations', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    const b = leaf(d, 'B');
    const first = link(d, a, b, true);
    d.addLink(first);
    d.addLink(link(d, a, b, true));
    d.addLink(link(d, b, a, true));
    expect(d.getLinks()).toEqual([first]);
    // a single link to a DIFFERENT pair is kept
    const c = leaf(d, 'C');
    const ac = link(d, a, c, true);
    d.addLink(ac);
    expect(d.getLinks()).toEqual([first, ac]);
  });

  it('non-single duplicates are all kept', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    const b = leaf(d, 'B');
    d.addLink(link(d, a, b));
    d.addLink(link(d, a, b));
    d.addLink(link(d, b, a));
    expect(d.getLinks()).toHaveLength(3);
  });

  it('a single link dedups against an EXISTING non-single link too', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    const b = leaf(d, 'B');
    const plain = link(d, a, b);
    d.addLink(plain);
    d.addLink(link(d, a, b, true));
    expect(d.getLinks()).toEqual([plain]);
  });

  it('removeLink removes exactly the given link and throws for an unknown one', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    const b = leaf(d, 'B');
    const l1 = link(d, a, b);
    const l2 = link(d, a, b);
    d.addLink(l1);
    d.addLink(l2);
    d.removeLink(l1);
    expect(d.getLinks()).toEqual([l2]);
    expect(() => d.removeLink(l1)).toThrow('IllegalArgumentException');
  });

  it('getLastLink and getTwoLastLinks skip NOTE endpoints', () => {
    const d = new TestDiagram();
    expect(d.getLastLink()).toBeUndefined();
    expect(d.getTwoLastLinks()).toBeUndefined();
    const a = leaf(d, 'A');
    const b = leaf(d, 'B');
    const n = leaf(d, 'N', LeafType.NOTE);
    const ab = link(d, a, b);
    const ba = link(d, b, a);
    d.addLink(ab);
    d.addLink(ba);
    d.addLink(link(d, a, n));
    expect(d.getLastLink()).toBe(ba);
    expect(d.getTwoLastLinks()).toEqual([ba, ab]);
    // with only one non-note link, getTwoLastLinks is undefined
    d.removeLink(ab);
    expect(d.getTwoLastLinks()).toBeUndefined();
  });

  it('isStandalone counts any link; isStandaloneForArgo ignores invisible links', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    const b = leaf(d, 'B');
    const invis = new Link(
      undefined,
      d,
      {},
      a,
      b,
      new LinkType(LinkDecor.NONE, LinkDecor.NONE).getInvisible(),
      LinkArg.noDisplay(1),
    );
    d.addLink(invis);
    expect(d.isStandalone(a)).toBe(false);
    expect(d.isStandaloneForArgo(a)).toBe(true);
  });
});

describe('hide / remove machinery (real HideOrShow folds)', () => {
  it('hideOrShow2 hides by name and wildcard; a later show wins', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'abc');
    const z = leaf(d, 'zzz');
    d.hideOrShow2('abc', false);
    expect(d.isHidden(a)).toBe(true);
    expect(d.isHidden(z)).toBe(false);
    d.hideOrShow2('abc', true);
    expect(d.isHidden(a)).toBe(false);
    d.hideOrShow2('ab*', false);
    expect(d.isHidden(a)).toBe(true);
    expect(d.isHidden(z)).toBe(false);
  });

  it('removeOrRestore removes by stereotype and drives isStereotypeRemoved', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    const st = Stereotype.build('<<gone>>') as Stereotype;
    a.setStereotype(st);
    d.removeOrRestore('<<gone>>', false);
    expect(d.isRemoved(a)).toBe(true);
    expect(d.isStereotypeRemoved(st)).toBe(true);
    expect(d.isRemovedIgnoreUnlinked(a)).toBe(true);
    d.removeOrRestore('<<gone>>', true);
    expect(d.isRemoved(a)).toBe(false);
    expect(d.isStereotypeRemoved(st)).toBe(false);
  });

  it('@unlinked removal is skipped by isRemovedIgnoreUnlinked', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    d.removeOrRestore('@unlinked', false);
    expect(d.isRemoved(a)).toBe(true);
    expect(d.isRemovedIgnoreUnlinked(a)).toBe(false);
  });

  it('a NOTE with a single visible link follows the hiding of its target', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    const n = leaf(d, 'N', LeafType.NOTE);
    d.addLink(link(d, n, a));
    expect(d.isHidden(n)).toBe(false);
    d.hideOrShow2('A', false);
    expect(d.isHidden(a)).toBe(true);
    expect(d.isHidden(n)).toBe(true);
    expect(d.isRemoved(n)).toBe(false);
    d.removeOrRestore('A', false);
    expect(d.isRemoved(n)).toBe(true);
  });

  it('the root entity is never hidden nor removed', () => {
    const d = new TestDiagram();
    expect(d.isHidden(d.getRootGroup())).toBe(false);
    expect(d.isRemoved(d.getRootGroup())).toBe(false);
  });

  it('fixWhat prefixes the current group qualified name when a separator is set', () => {
    const d = new TestDiagram();
    d.setNamespaceSeparator('.');
    d.gotoGroup(undefined, d.quarkInContext(false, 'p'), Display.getWithNewlines(d.getPragma(), 'p'), GroupType.PACKAGE);
    const x = d.reallyCreateLeaf(
      undefined,
      d.quarkInContext(false, 'X'),
      Display.getWithNewlines(d.getPragma(), 'X'),
      LeafType.USECASE,
      undefined,
    );
    d.hideOrShow2('X', false);
    expect(d.isHidden(x)).toBe(true);
  });
});

describe('portion showing', () => {
  it('hideOrShow expands MEMBER to FIELD+METHOD for the matched gender', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    d.hideOrShow(byEntityType(LeafType.CLASS), EntityPortion.MEMBER, false);
    expect(d.showPortion(EntityPortion.FIELD, a)).toBe(false);
    expect(d.showPortion(EntityPortion.METHOD, a)).toBe(false);
    expect(d.showPortion(EntityPortion.STEREOTYPE, a)).toBe(true);
    d.hideOrShow(byEntityType(LeafType.CLASS), EntityPortion.FIELD, true);
    expect(d.showPortion(EntityPortion.FIELD, a)).toBe(true);
    expect(PortionShower.ALL.showPortion(EntityPortion.FIELD, a)).toBe(true);
  });

  it('getVisibleStereotypeLabels filters hidden stereotype labels', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    expect(d.getVisibleStereotypeLabels(a)).toBeUndefined();
    a.setStereotype(Stereotype.build('<<s1>><<s2>>'));
    expect(d.getVisibleStereotypeLabels(a)).toEqual(['<<s1>>', '<<s2>>']);
    // a typed gender ('CLASS') never label-matches — labels stay visible
    d.hideOrShow(byEntityType(LeafType.CLASS), EntityPortion.STEREOTYPE, false);
    expect(d.getVisibleStereotypeLabels(a)).toEqual(['<<s1>>', '<<s2>>']);
    // the null-gender predicate (`hide stereotype`) hides every label
    d.hideOrShow(all(), EntityPortion.STEREOTYPE, false);
    expect(d.getVisibleStereotypeLabels(a)).toEqual([]);
  });
});

describe('pragma-backed accessors', () => {
  it('label distance/angle read the pragma with numeric validation and dot defaults', () => {
    const d = new TestDiagram();
    expect(d.getLabeldistance()).toBe('1.7');
    expect(d.getLabelangle()).toBe('25');
    d.getPragma().define(PragmaKey.LABEL_DISTANCE, '2.5');
    d.getPragma().define(PragmaKey.LABEL_ANGLE, 'oops');
    expect(d.getLabeldistance()).toBe('2.5');
    expect(d.getLabelangle()).toBe('25');
    d.getPragma().define(PragmaKey.DEFAULT_LABEL_ANGLE, '-30');
    expect(d.getLabelangle()).toBe('-30');
    d.resetPragmaLabel();
    expect(d.getLabeldistance()).toBe('1.7');
    expect(d.getLabelangle()).toBe('-30');
  });

  it('getDotStringSkek filters dot strings and appends aspect/ratio pragmas', () => {
    const d = new TestDiagram();
    d.dotStrings = ['nodesep=0.35;', 'ranksep=0.7;', 'bgcolor="transparent";'];
    expect(d.getDotStringSkek()).toEqual(['nodesep=0.35;', 'ranksep=0.7;']);
    d.getPragma().define(PragmaKey.ASPECT, '2,5');
    d.getPragma().define(PragmaKey.RATIO, 'auto');
    expect(d.getDotStringSkek()).toEqual(['nodesep=0.35;', 'ranksep=0.7;', 'aspect=2.5;', 'ratio=auto;']);
  });
});

describe('misc surface', () => {
  it('cleanId strips wrapping double quotes', () => {
    const d = new TestDiagram();
    expect(d.cleanId(undefined)).toBeUndefined();
    expect(d.cleanId('"abc"')).toBe('abc');
    expect(d.cleanId('abc')).toBe('abc');
  });

  it('port id helpers honour the :: convention unless :: IS the separator', () => {
    const d = new TestDiagram();
    expect(d.removePortId('a::p')).toBe('a');
    expect(d.getPortId('a::p')).toBe('p');
    expect(d.getPortId('a')).toBeUndefined();
    expect(d.getPortFor('a::p', d.quarkInContext(true, 'a'))).toBe('p');
    expect(d.getPortFor('b::p', d.quarkInContext(true, 'a'))).toBeUndefined();
    d.setNamespaceSeparator('::');
    expect(d.removePortId('a::p')).toBe('a::p');
    expect(d.getPortId('a::p')).toBeUndefined();
  });

  it('createGroup is idempotent on an occupied quark', () => {
    const d = new TestDiagram();
    const q = d.quarkInContext(false, 'p');
    const g1 = d.createGroup(undefined, q, GroupType.PACKAGE);
    const g2 = d.createGroup(undefined, q, GroupType.STATE);
    expect(g2).toBe(g1);
    expect(g1.getGroupType()).toBe(GroupType.PACKAGE);
  });

  it('getInstallationRequirement follows the layout-engine flags', () => {
    const d = new TestDiagram();
    expect(d.getInstallationRequirement()).toBe(InstallationRequirement.GRAPHVIZ_ENGINE_REQUIRED);
    d.setUseSmetana(true);
    expect(d.getInstallationRequirement()).toBe(InstallationRequirement.NONE);
    d.setUseElk(true);
    expect(d.getInstallationRequirement()).toBe(InstallationRequirement.ELK_LIBRARY_REQUIRED);
  });

  it('getDefaultMargins keeps the backwards-compatibility numbers', () => {
    const d = new TestDiagram();
    const m = d.getDefaultMargins();
    expect([m.getTop(), m.getRight(), m.getBottom(), m.getLeft()]).toEqual([0, 5, 5, 0]);
  });

  it('constraintOnLinks hangs one shared LinkConstraint on both links', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    const b = leaf(d, 'B');
    const c = leaf(d, 'C');
    const l1 = link(d, a, b);
    const l2 = link(d, b, c);
    const rc = d.constraintOnLinks(l1, l2, Display.getWithNewlines(d.getPragma(), 'lbl'));
    expect(rc.isOk()).toBe(true);
    expect(l1.getLinkConstraint()).toBeDefined();
    expect(l1.getLinkConstraint()).toBe(l2.getLinkConstraint());
  });

  it('isEmpty delegates to the entity', () => {
    const d = new TestDiagram();
    const q = d.quarkInContext(false, 'p');
    const g = d.createGroup(undefined, q, GroupType.PACKAGE);
    expect(d.isEmpty(g)).toBe(true);
    d.reallyCreateLeaf(undefined, q.child('X'), Display.getWithNewlines(d.getPragma(), 'X'), LeafType.USECASE, undefined);
    expect(d.isEmpty(g)).toBe(false);
  });

  it('visibility-modifier collections round-trip through the LIVE readonly view', () => {
    const d = new TestDiagram();
    const view = d.getHidesVisibilityModifier();
    expect(view.size).toBe(0);
    expect(d.isVisibilityModifierPresent()).toBe(false);
    d.setVisibilityModifierPresent(true);
    expect(d.isVisibilityModifierPresent()).toBe(true);
  });
});

describe('applySingleStrategy', () => {
  it('chains 3+ standalone leaves of a group into invisible square links', () => {
    const d = new TestDiagram();
    leaf(d, 'A');
    leaf(d, 'B');
    leaf(d, 'C');
    d.applySingleStrategy();
    // 3 items, branch=2: leftRight(A,B) then topDown(A,C)
    expect(d.getLinks()).toHaveLength(2);
    for (const l of d.getLinks()) expect(l.isInvis()).toBe(true);
    expect(d.getLinks().map((l) => [l.getEntity1().getName(), l.getEntity2().getName()])).toEqual([
      ['A', 'B'],
      ['A', 'C'],
    ]);
    expect(d.getLinks().map((l) => l.getLength())).toEqual([1, 2]);
  });

  it('does nothing for fewer than 3 standalones or for linked leaves', () => {
    const d = new TestDiagram();
    const a = leaf(d, 'A');
    const b = leaf(d, 'B');
    const c = leaf(d, 'C');
    d.addLink(link(d, a, b));
    // C is the only standalone left
    d.applySingleStrategy();
    expect(d.getLinks()).toHaveLength(1);
    expect(d.isStandalone(c)).toBe(true);
  });
});
