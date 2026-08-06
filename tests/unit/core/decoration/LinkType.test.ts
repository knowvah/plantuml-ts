/**
 * LinkType.test.ts — SI1/T2: `LinkType` (decoration/LinkType.java:44-326)
 * — construction, decor predicates, mutators, dot-attribute emission,
 * stroke resolution, semantic name, equality.
 */
import { describe, expect, it } from 'vitest';
import { LinkDecor } from '../../../../src/core/decoration/LinkDecor.js';
import { LinkMiddleDecor } from '../../../../src/core/decoration/LinkMiddleDecor.js';
import { LinkType } from '../../../../src/core/decoration/LinkType.js';
import { LinkStrategy } from '../../../../src/core/abel/LinkStrategy.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';

describe('construction and accessors (java:72-81, 199-209, 258-260)', () => {
  it('2-arg construction defaults to NONE middle decor and NORMAL style', () => {
    const t = new LinkType(LinkDecor.ARROW, LinkDecor.NONE);
    expect(t.getDecor1()).toBe(LinkDecor.ARROW);
    expect(t.getDecor2()).toBe(LinkDecor.NONE);
    expect(t.getMiddleDecor()).toBe(LinkMiddleDecor.NONE);
    expect(t.getStyle().isNormal()).toBe(true);
  });
});

describe('decor predicates (java:51-70, 224-226)', () => {
  it('isDoubleDecorated needs both decors non-NONE', () => {
    expect(new LinkType(LinkDecor.ARROW, LinkDecor.ARROW).isDoubleDecorated()).toBe(true);
    expect(new LinkType(LinkDecor.ARROW, LinkDecor.NONE).isDoubleDecorated()).toBe(false);
  });

  it('looksLikeRevertedForSvg is decor1 NONE + decor2 non-NONE', () => {
    expect(new LinkType(LinkDecor.NONE, LinkDecor.ARROW).looksLikeRevertedForSvg()).toBe(true);
    expect(new LinkType(LinkDecor.ARROW, LinkDecor.NONE).looksLikeRevertedForSvg()).toBe(false);
  });

  it('looksLikeNoDecorAtAllSvg is both-NONE or both-non-NONE', () => {
    expect(new LinkType(LinkDecor.NONE, LinkDecor.NONE).looksLikeNoDecorAtAllSvg()).toBe(true);
    expect(new LinkType(LinkDecor.ARROW, LinkDecor.ARROW).looksLikeNoDecorAtAllSvg()).toBe(true);
    expect(new LinkType(LinkDecor.NONE, LinkDecor.ARROW).looksLikeNoDecorAtAllSvg()).toBe(false);
  });

  it('isExtends checks either side', () => {
    expect(new LinkType(LinkDecor.EXTENDS, LinkDecor.NONE).isExtends()).toBe(true);
    expect(new LinkType(LinkDecor.NONE, LinkDecor.EXTENDS).isExtends()).toBe(true);
    expect(new LinkType(LinkDecor.ARROW, LinkDecor.NONE).isExtends()).toBe(false);
  });
});

describe('mutators (java:83-89, 115-133, 135-161, 237-243, 262-268)', () => {
  const base = new LinkType(LinkDecor.EXTENDS, LinkDecor.ARROW);

  it('withoutDecors1/withoutDecors2/getPart1/getPart2 blank one side', () => {
    expect(base.withoutDecors1().getDecor1()).toBe(LinkDecor.NONE);
    expect(base.withoutDecors1().getDecor2()).toBe(LinkDecor.ARROW);
    expect(base.withoutDecors2().getDecor2()).toBe(LinkDecor.NONE);
    expect(base.getPart1().getDecor2()).toBe(LinkDecor.NONE);
    expect(base.getPart1().getDecor1()).toBe(LinkDecor.EXTENDS);
    expect(base.getPart2().getDecor1()).toBe(LinkDecor.NONE);
    expect(base.getPart2().getDecor2()).toBe(LinkDecor.ARROW);
    expect(base.withLollipopInterfaceEye1().getDecor2()).toBe(LinkDecor.NONE);
    expect(base.withLollipopInterfaceEye2().getDecor1()).toBe(LinkDecor.NONE);
  });

  it('getInversed swaps decors and inverses the middle decor', () => {
    const inv = base.withMiddleCircleCircled1().getInversed();
    expect(inv.getDecor1()).toBe(LinkDecor.ARROW);
    expect(inv.getDecor2()).toBe(LinkDecor.EXTENDS);
    expect(inv.getMiddleDecor()).toBe(LinkMiddleDecor.CIRCLE_CIRCLED2);
  });

  it('style mutators keep decors and change the style', () => {
    expect(base.goDashed().getStyle().toString()).toBe('DASHED(null)');
    expect(base.goDotted().getStyle().toString()).toBe('DOTTED(null)');
    expect(base.goBold().getStyle().toString()).toBe('BOLD(null)');
    expect(base.goThickness(2).getStyle().toString()).toBe('NORMAL(2.0)');
    expect(base.getInvisible().isInvisible()).toBe(true);
    expect(base.goDashed().getDecor1()).toBe(LinkDecor.EXTENDS);
  });

  it('withMiddle* set the middle decor', () => {
    expect(base.withMiddleCircle().getMiddleDecor()).toBe(LinkMiddleDecor.CIRCLE);
    expect(base.withMiddleCircleCircled().getMiddleDecor()).toBe(LinkMiddleDecor.CIRCLE_CIRCLED);
    expect(base.withMiddleCircleCircled1().getMiddleDecor()).toBe(LinkMiddleDecor.CIRCLE_CIRCLED1);
    expect(base.withMiddleCircleCircled2().getMiddleDecor()).toBe(LinkMiddleDecor.CIRCLE_CIRCLED2);
    expect(base.withMiddleSubset().getMiddleDecor()).toBe(LinkMiddleDecor.SUBSET);
    expect(base.withMiddleSuperset().getMiddleDecor()).toBe(LinkMiddleDecor.SUPERSET);
  });
});

describe('getSpecificDecorationSvek (java:163-197)', () => {
  it('SIMPLEST always emits no-decor attributes', () => {
    const t = new LinkType(LinkDecor.EXTENDS, LinkDecor.ARROW);
    expect(t.getSpecificDecorationSvek(LinkStrategy.SIMPLEST)).toBe('arrowtail=none,arrowhead=none');
  });

  it('LEGACY: both empty', () => {
    const t = new LinkType(LinkDecor.NONE, LinkDecor.NONE);
    expect(t.getSpecificDecorationSvek(LinkStrategy.LEGACY_toberemoved)).toBe(
      'arrowtail=none,arrowhead=none',
    );
  });

  it('LEGACY: both decorated emits dir=both with Java double arrowsize', () => {
    const t = new LinkType(LinkDecor.EXTENDS, LinkDecor.ARROW);
    expect(t.getSpecificDecorationSvek(LinkStrategy.LEGACY_toberemoved)).toBe(
      'dir=both,arrowtail=empty,arrowhead=empty,arrowsize=2.0',
    );
  });

  it('LEGACY: only decor2 emits dir=back', () => {
    const t = new LinkType(LinkDecor.NONE, LinkDecor.ARROW_TRIANGLE);
    expect(t.getSpecificDecorationSvek(LinkStrategy.LEGACY_toberemoved)).toBe(
      'arrowtail=empty,arrowhead=none,dir=back,arrowsize=0.8',
    );
  });

  it('LEGACY: only decor1 emits arrowsize alone (upstream fall-through)', () => {
    const t = new LinkType(LinkDecor.ARROW, LinkDecor.NONE);
    expect(t.getSpecificDecorationSvek(LinkStrategy.LEGACY_toberemoved)).toBe('arrowsize=0.5');
  });
});

describe('getStroke3 (java:245-256)', () => {
  it('style thickness override wins', () => {
    const t = new LinkType(LinkDecor.NONE, LinkDecor.NONE).goThickness(3);
    expect(t.getStroke3(new UStroke(4, 4, 9)).equals(UStroke.withThickness(3))).toBe(true);
  });

  it('null default falls back to the style stroke', () => {
    const t = new LinkType(LinkDecor.NONE, LinkDecor.NONE).goDashed();
    expect(t.getStroke3(null).equals(new UStroke(7, 7, 1))).toBe(true);
  });

  it('plain default thickness is merged into the style', () => {
    const t = new LinkType(LinkDecor.NONE, LinkDecor.NONE).goDashed();
    expect(t.getStroke3(UStroke.withThickness(2)).equals(new UStroke(7, 7, 2))).toBe(true);
  });

  it('a dashed default stroke is returned as-is', () => {
    const t = new LinkType(LinkDecor.NONE, LinkDecor.NONE);
    const dashedDefault = new UStroke(5, 5, 2);
    expect(t.getStroke3(dashedDefault)).toBe(dashedDefault);
  });
});

describe('getLinkTypeName (java:276-308)', () => {
  const name = (d1: LinkDecor, d2: LinkDecor): string | null =>
    new LinkType(d1, d2).getLinkTypeName();

  it('maps decors to semantic names in upstream priority order', () => {
    expect(name(LinkDecor.COMPOSITION, LinkDecor.NONE)).toBe('composition');
    expect(name(LinkDecor.NONE, LinkDecor.AGGREGATION)).toBe('aggregation');
    expect(name(LinkDecor.EXTENDS, LinkDecor.NONE)).toBe('extension');
    expect(name(LinkDecor.REDEFINES, LinkDecor.NONE)).toBe('redefines');
    expect(name(LinkDecor.DEFINEDBY, LinkDecor.NONE)).toBe('definedby');
    expect(name(LinkDecor.ARROW, LinkDecor.NONE)).toBe('dependency');
    expect(name(LinkDecor.ARROW_TRIANGLE, LinkDecor.NONE)).toBe('dependency');
    expect(name(LinkDecor.NOT_NAVIGABLE, LinkDecor.NONE)).toBe('not_navigable');
    expect(name(LinkDecor.CROWFOOT, LinkDecor.NONE)).toBe('crowfoot');
    expect(name(LinkDecor.CIRCLE_LINE, LinkDecor.NONE)).toBe('association');
    expect(name(LinkDecor.NONE, LinkDecor.NONE)).toBe('association');
    expect(name(LinkDecor.PLUS, LinkDecor.NONE)).toBe('nested');
    expect(name(LinkDecor.SQUARE, LinkDecor.NONE)).toBeNull();
  });

  it('composition wins over aggregation (first match)', () => {
    expect(name(LinkDecor.COMPOSITION, LinkDecor.AGGREGATION)).toBe('composition');
  });
});

describe('equals/toString/hashCode (java:96-109)', () => {
  it('equals uses reference identity on the style (upstream ==)', () => {
    const a = new LinkType(LinkDecor.ARROW, LinkDecor.NONE);
    const b = new LinkType(LinkDecor.ARROW, LinkDecor.NONE);
    // freshly-built LinkTypes hold distinct LinkStyle.NORMAL() instances:
    expect(a.equals(b)).toBe(false);
    // ...but copies derived from the SAME LinkType share its style
    // reference, so they compare equal (upstream behaves identically):
    expect(a.withoutDecors2().equals(a.getPart1())).toBe(true);
    expect(a.equals(a)).toBe(true);
  });

  it('toString is decor1-style-decor2', () => {
    expect(new LinkType(LinkDecor.ARROW, LinkDecor.NONE).toString()).toBe('ARROW-NORMAL(null)-NONE');
  });

  it('hashCode is Java String.hashCode of toString', () => {
    const t = new LinkType(LinkDecor.ARROW, LinkDecor.NONE);
    // "ARROW-NORMAL(null)-NONE".hashCode() computed by the Java algorithm:
    let h = 0;
    for (const c of 'ARROW-NORMAL(null)-NONE') h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
    expect(t.hashCode()).toBe(h);
  });
});
