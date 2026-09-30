/**
 * StyleSignatureBasic — `style/StyleSignatureBasic.java` (311 lines).
 *
 * `matchAll` expectations are jar-probed with the T0c StyleProbe
 * (`plans/mindmap-engine-port/tools/probe/run-probe.sh StyleProbe <snippet>
 * special root,element,mindmapDiagram,node --level N [--star]
 * [--stereotype s] --delta 3000`, 1.2026.8beta1). `special` mode is
 * `StyleBuilder.getMergedStyleSpecial` (StyleBuilder.java:139-160), which
 * merges exactly the stored styles whose declaration `matchAll`s the
 * query, so `FontColor=red` in the probe output means the snippet's rule
 * matched and `FontColor=black` (the skin default) means it did not:
 *
 *  | snippet rule               | query                     | probe      |
 *  | `:depth(2) * {FontColor red}` | level 1                | black      |
 *  | `:depth(2) * {...}`        | level 2                   | red        |
 *  | `:depth(2) * {...}`        | level 3                   | red        |
 *  | `:depth(2) * {...}`        | level 2 --star            | red        |
 *  | `:depth(2) {...}`          | level 2                   | red        |
 *  | `:depth(2) {...}`          | level 3                   | black      |
 *  | `:depth(2) {...}`          | level 2 --star            | (no style) |
 *  | `.Fo_o {...}`              | level 1 --stereotype F.OO | red        |
 *  | `.Fo_o {...}`              | level 1 --stereotype bar  | black      |
 *  | `node {...}`               | level 1                   | red        |
 *  | `node {...}` (arrow query) | ...,arrow level 1         | black      |
 *  | `node {...}`               | level 1 --star            | (no style) |
 *  | `node {...}`               | level 1 --stereotype foo  | red        |
 *
 * The declarations below are built the way `style/parser/Context.java:70-99`
 * (`push`) builds them from those selectors; the queries the way StyleProbe's
 * `buildSignature` does (`of(snames).addLevel(n)`, then `addStereotype`,
 * then `addStar`).
 */
import { describe, expect, it } from 'vitest';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { StyleSignatures } from '../../../../src/core/style/StyleSignatures.js';
import { STAR } from '../../../../src/core/style/StyleSignature.js';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import { Stereostyles } from '../../../../src/core/abel/Stereostyles.js';
import { Url } from '../../../../src/core/url/Url.js';
import type { SName } from '../../../../src/core/style/SName.js';
import { Style } from '../../../../src/core/style/Style.js';
import { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';

const NODE: readonly SName[] = ['root', 'element', 'mindmapDiagram', 'node'];
const query = (level: number): StyleSignatureBasic => StyleSignatureBasic.of(...NODE).addLevel(level);
/** `Context.push(":depth(2) *")` — addLevel then addStar (Context.java:83-96). */
const depth2Star = StyleSignatureBasic.empty().addLevel(2).addStar();
/** `Context.push(":depth(2)")`. */
const depth2 = StyleSignatureBasic.empty().addLevel(2);
/** `Context.push(".Fo_o")` — a leading dot goes through addStereotype (Context.java:86-87). */
const dotFoo = StyleSignatureBasic.empty().addStereotype('.Fo_o');
/** `Context.push("node")` — SName.retrieve hits, so addSName (Context.java:90-94). */
const nodeDecl = StyleSignatureBasic.empty().addSName('node');

describe('StyleSignatureBasic.matchAll — jar-probed', () => {
  it('a starred depth(2) declaration matches levels >= 2 only', () => {
    expect(depth2Star.matchAll(query(1))).toBe(false);
    expect(depth2Star.matchAll(query(2))).toBe(true);
    expect(depth2Star.matchAll(query(3))).toBe(true);
    expect(depth2Star.matchAll(query(2).addStar())).toBe(true);
  });

  it('an unstarred depth(2) declaration matches level 2 exactly and rejects a starred element', () => {
    expect(depth2.matchAll(query(2))).toBe(true);
    expect(depth2.matchAll(query(3))).toBe(false);
    expect(depth2.matchAll(query(2).addStar())).toBe(false);
  });

  it('a stereotype declaration matches after clean() on both sides', () => {
    expect(dotFoo.matchAll(query(1).addStereotype('F.OO'))).toBe(true);
    expect(dotFoo.matchAll(query(1).addStereotype('bar'))).toBe(false);
  });

  it('an sname declaration needs the sname and tolerates extra stereotypes', () => {
    expect(nodeDecl.matchAll(query(1))).toBe(true);
    expect(nodeDecl.matchAll(StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'arrow').addLevel(1))).toBe(
      false,
    );
    expect(nodeDecl.matchAll(query(1).addStar())).toBe(false);
    expect(nodeDecl.matchAll(query(1).addStereotype('foo'))).toBe(true);
  });
});

describe('StyleSignatureBasic.matchAll — Java branches (java:194-220)', () => {
  it('a leveled declaration never matches an element without a level (java:198,204)', () => {
    expect(depth2Star.matchAll(StyleSignatureBasic.of(...NODE))).toBe(false);
    expect(depth2.matchAll(StyleSignatureBasic.of(...NODE))).toBe(false);
  });

  it('an unleveled declaration ignores the element level', () => {
    expect(nodeDecl.matchAll(StyleSignatureBasic.of(...NODE))).toBe(true);
    expect(nodeDecl.matchAll(query(7))).toBe(true);
  });
});

describe('StyleSignatureBasic construction', () => {
  it('of() builds an unleveled, unstarred, stereotype-free signature (java:222-224)', () => {
    const s = StyleSignatureBasic.of('root', 'element', 'mindmapDiagram', 'node', 'rootNode');
    expect([...s.getKey().snames]).toEqual(['root', 'element', 'mindmapDiagram', 'node', 'rootNode']);
    expect(s.getKey().level).toBe(-1);
    expect(s.isStarred()).toBe(false);
    expect([...s.getStereotypes()]).toEqual([]);
  });

  it('names exposes the of() order for the visibility-icon consumer', () => {
    expect(StyleSignatureBasic.of('root', 'element', 'visibilityIcon', 'IEMandatory').names).toEqual([
      'root',
      'element',
      'visibilityIcon',
      'IEMandatory',
    ]);
  });

  it('of(n0,n1,n2,n3,SName[]) accepts 1 or 2 trailing names and throws otherwise (java:280-286)', () => {
    expect([
      ...StyleSignatureBasic.of('root', 'element', 'classDiagram', 'class_', ['header']).getKey().snames,
    ]).toEqual(['root', 'element', 'classDiagram', 'class_', 'header']);
    expect(
      [...StyleSignatureBasic.of('root', 'element', 'classDiagram', 'class_', ['header', 'title']).getKey().snames]
        .length,
    ).toBe(6);
    expect(() => StyleSignatureBasic.of('root', 'element', 'classDiagram', 'class_', [])).toThrow();
  });

  it('of(n0,n1,n2,SName[],...other) concatenates (java:288-298)', () => {
    const s = StyleSignatureBasic.of('root', 'element', 'componentDiagram', ['hexagon'], 'title');
    expect([...s.getKey().snames]).toEqual(['root', 'element', 'componentDiagram', 'hexagon', 'title']);
  });

  it('addLevel/addStar/isStarred (java:81-83,156-162)', () => {
    const s = query(2).addStar();
    expect(s.getKey().level).toBe(2);
    expect(s.isStarred()).toBe(true);
    expect(query(2).isStarred()).toBe(false);
  });

  it('createStereotype cleans the name: lowercase, strip "_" and "." (java:55-57,226-235)', () => {
    expect([...StyleSignatureBasic.createStereotype('My_St.Ereo').getStereotypes()]).toEqual(['mystereo']);
    expect(StyleSignatureBasic.createStereotype('x').getKey().snames.size).toBe(0);
  });

  it('addStereotype(Stereotype) adds every cleaned label; undefined is identity (java:104-116)', () => {
    const base = query(1);
    expect(base.addStereotype(undefined)).toBe(base);
    const st = Stereotype.build('<<A.b>><<C_c>>');
    expect([...base.addStereotype(st).getStereotypes()]).toEqual(['ab', 'cc']);
    expect([...base.getStereotypes()]).toEqual([]);
  });

  it('addSName adds a name (java:150-154); addClickable adds clickable for a url only (java:73-79)', () => {
    expect([...StyleSignatureBasic.of('root').addSName('node').getKey().snames]).toEqual(['root', 'node']);
    const s = StyleSignatureBasic.of('node');
    expect(s.addClickable(undefined)).toBe(s);
    expect([...s.addClickable(new Url('http://x', null, null)).getKey().snames]).toEqual(['node', 'clickable']);
  });

  it('frequent-use factories (java:267-277)', () => {
    expect([...StyleSignatureBasic.activity().getKey().snames]).toEqual([
      'root',
      'element',
      'activityDiagram',
      'activity',
    ]);
    expect([...StyleSignatureBasic.activityDiamond().getKey().snames].at(-1)).toBe('diamond');
    expect([...StyleSignatureBasic.activityArrow().getKey().snames].at(-1)).toBe('arrow');
  });

  it('STAR is "*" (StyleSignature.java:44) and reachable as StyleSignatureBasic.STAR', () => {
    expect(STAR).toBe('*');
    expect(StyleSignatureBasic.STAR).toBe('*');
  });
});

describe('StyleSignatureBasic predicates, merge, identity', () => {
  it('isEmpty is true only with no snames and no stereotypes (java:300-302)', () => {
    expect(StyleSignatureBasic.empty().isEmpty()).toBe(true);
    expect(StyleSignatureBasic.empty().addLevel(2).isEmpty()).toBe(true);
    expect(dotFoo.isEmpty()).toBe(false);
    expect(nodeDecl.isEmpty()).toBe(false);
  });

  it('isWithDot is true when any stereotype is present (java:261-263)', () => {
    expect(dotFoo.isWithDot()).toBe(true);
    expect(nodeDecl.isWithDot()).toBe(false);
  });

  it('mergeWith unions stereotypes and merges keys (java:245-251)', () => {
    const m = query(1).addStereotype('a').mergeWith(depth2Star.addStereotype('b'));
    expect([...m.getStereotypes()]).toEqual(['a', 'b']);
    expect(m.getKey().level).toBe(2);
    expect(m.isStarred()).toBe(true);
  });

  it('mergeWith(List<Style>) folds each style signature (java:237-243)', () => {
    const styles = [{ getSignature: () => nodeDecl }, { getSignature: () => dotFoo }];
    const m = StyleSignatureBasic.of('root').mergeWith(styles);
    expect([...m.getKey().snames]).toEqual(['root', 'node']);
    expect([...m.getStereotypes()]).toEqual(['foo']);
  });

  it('equals/keyString: same key and stereotype set regardless of insertion order (java:164-184)', () => {
    const a = query(2).addStereotype('x').addStereotype('y');
    const b = StyleSignatureBasic.of('node', 'mindmapDiagram', 'element', 'root')
      .addStereotype('Y')
      .addStereotype('x')
      .addLevel(2);
    expect(a.equals(b)).toBe(true);
    expect(a.keyString()).toBe(b.keyString());
    expect(a.equals(a.addStar())).toBe(false);
    expect(a.keyString()).not.toBe(a.addStar().keyString());
    expect(a.equals(query(2).addStereotype('x'))).toBe(false);
    const map = new Map([[a.keyString(), 1]]);
    expect(map.get(b.keyString())).toBe(1);
  });

  it('toString is "<key> [stereotypes]" (java:59-62)', () => {
    expect(nodeDecl.addStereotype('a').toString()).toBe('[node]  [a]');
  });
});

describe('StyleSignatureBasic stereotype fan-out (java:92-148)', () => {
  it('with(Stereostyles) adds the raw names, identity when empty', () => {
    expect(nodeDecl.with(Stereostyles.NONE)).toBe(nodeDecl);
    const r = nodeDecl.with(Stereostyles.build('<<<Big_One>>>'));
    expect(r).toBeInstanceOf(StyleSignatureBasic);
    expect([...(r as StyleSignatureBasic).getStereotypes()]).toEqual(['Big_One']);
  });

  it('withTOBECHANGED is identity for undefined or a style-name-free stereotype', () => {
    expect(nodeDecl.withTOBECHANGED(undefined)).toBe(nodeDecl);
    expect(nodeDecl.withTOBECHANGED(Stereotype.build('<<<<<st>>>>>'))).toBe(nodeDecl);
  });

  it('withTOBECHANGED fans out one signature per label', () => {
    const r = nodeDecl.withTOBECHANGED(Stereotype.build('<<A>><<B_b>>'));
    expect(r).toBeInstanceOf(StyleSignatures);
    expect(r.toString()).toBe('[[node]  [a], [node]  [bb]]');
  });

  it('forStereotypeItself also adds SName.stereotype to each fan-out signature', () => {
    expect(nodeDecl.forStereotypeItself(undefined)).toBe(nodeDecl);
    const r = nodeDecl.forStereotypeItself(Stereotype.build('<<A>>'));
    expect(r.toString()).toBe('[[node, stereotype]  [a]]');
  });
});

describe('StyleSignatureBasic.getMergedStyle (StyleSignatureBasic.java:253-259)', () => {
  it("undefined builder -> undefined; else the builder's getMergedStyle(this)", () => {
    const sig = StyleSignatureBasic.of('root');
    const builder = new StyleBuilder().muteStyle([new Style(sig, new Map([['FontSize', ValueImpl.regular('9', 1)]]))]);
    expect(sig.getMergedStyle(undefined)).toBeUndefined();
    const query = StyleSignatureBasic.of('root', 'element').addLevel(0);
    expect(query.getMergedStyle(builder)).toBe(builder.getMergedStyle(query));
    expect(query.getMergedStyle(builder)?.value('FontSize').asString()).toBe('9');
  });
});
