/**
 * BodierLikeClassOrObject.test.ts — SI1/T7:
 * `src/core/cucadiagram/BodierLikeClassOrObject.ts` against
 * cucadiagram/BodierLikeClassOrObject.java. Expectations hand-derived
 * from the Java; blank-row semantics cite A2s R2d's jar-verified rule
 * (`class-body-enhanced-layout.ts:155-164`), display filters cite A2s
 * F-A (class engine `parser.ts`, ADR-5 — that fork is not touched).
 */
import { describe, expect, it } from 'vitest';
import { BodierLikeClassOrObject } from '../../../../src/core/cucadiagram/BodierLikeClassOrObject.js';
import { Member } from '../../../../src/core/cucadiagram/Member.js';
import type { Entity } from '../../../../src/core/abel/Entity.js';
import type { FontConfiguration } from '../../../../src/core/abel/FontConfiguration.js';
import type { Style } from '../../../../src/core/abel/ISkinParam.js';
import { LeafType } from '../../../../src/core/abel/LeafType.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import { VisibilityModifier } from '../../../../src/core/skin/VisibilityModifier.js';
import { MockSkinParam } from '../abel/helpers.js';

const style: Style = { getHorizontalAlignment: () => HorizontalAlignment.LEFT };
const fontConfiguration = undefined as unknown as FontConfiguration;
const fakeLeaf = {} as Entity;

function displays(bodier: BodierLikeClassOrObject, kind: 'fields' | 'methods'): string[] {
  const display = kind === 'fields' ? bodier.getFieldsToDisplay() : bodier.getMethodsToDisplay();
  return display.asList().map((cs) => (cs as Member).getDisplay(false));
}

describe('constructor (java:74-82)', () => {
  it('rejects MAP', () => {
    expect(() => new BodierLikeClassOrObject(LeafType.MAP, null)).toThrow('IllegalArgumentException');
  });
});

describe('method/field classification (isMethod, java:102-111/:136-142)', () => {
  it('splits on paren containment; {method}/{field} tags force the bucket (A2s R2f cite-align)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('field1 : int');
    bodier.addFieldOrMethod('run()');
    bodier.addFieldOrMethod('{method} forced');
    bodier.addFieldOrMethod('{field} data()');
    expect(displays(bodier, 'methods')).toEqual(['run()', 'forced']);
    expect(displays(bodier, 'fields')).toEqual(['field1 : int', 'data()']);
  });

  it('tag bucket detection is case-SENSITIVE while the display strip is not (A2s R2f)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('{METHOD} x');
    expect(displays(bodier, 'methods')).toEqual([]);
    expect(displays(bodier, 'fields')).toEqual(['x']);
  });

  it('purges the URL text before the paren scan (java:103) — parens inside a url do not classify', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('name [[[http://x/(y)]]]');
    expect(displays(bodier, 'fields')).toEqual(['name']);
    expect(displays(bodier, 'methods')).toEqual([]);
  });

  it('an interior blank line between two methods counts as a method row (java:136-142)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('m1()');
    bodier.addFieldOrMethod('');
    bodier.addFieldOrMethod('m2()');
    expect(displays(bodier, 'methods')).toEqual(['m1()', ' ', 'm2()']);
    expect(displays(bodier, 'fields')).toEqual([]);
  });
});

describe('blank-row display rules (java:122-123/:152-153/:166-170; A2s F-A cite-align)', () => {
  it('skips leading blanks while the list is empty and trims trailing empty members', () => {
    // '+fx' not '+f': isVisibilityCharacter requires length > 2
    // (VisibilityModifier.java:211-213), so a 2-char '+f' would KEEP its
    // '+' — jar-faithful, verified against the Java before fixing this
    // fixture.
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('');
    bodier.addFieldOrMethod('+fx');
    bodier.addFieldOrMethod('');
    expect(displays(bodier, 'fields')).toEqual(['fx']);
  });
});

describe('hidden-visibility filtering (java:126-128/:156-158)', () => {
  it('drops members whose modifier is in hideVisibilityModifier', () => {
    const hide = new Set([VisibilityModifier.PRIVATE_FIELD, VisibilityModifier.PUBLIC_METHOD]);
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, hide);
    bodier.addFieldOrMethod('-secret : int');
    bodier.addFieldOrMethod('#kept : int');
    bodier.addFieldOrMethod('+shown()');
    bodier.addFieldOrMethod('-alsoShown()');
    expect(displays(bodier, 'fields')).toEqual(['kept : int']);
    expect(displays(bodier, 'methods')).toEqual(['alsoShown()']);
  });

  it('a null hide set filters nothing (java:126 null check)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('-secret : int');
    expect(displays(bodier, 'fields')).toEqual(['secret : int']);
  });
});

describe('caching and mutation (java:84-91/:67-72)', () => {
  it('addFieldOrMethod invalidates the cached member lists', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('a : int');
    expect(displays(bodier, 'fields')).toEqual(['a : int']);
    bodier.addFieldOrMethod('b : int');
    expect(displays(bodier, 'fields')).toEqual(['a : int', 'b : int']);
    expect(bodier.getRawBody()).toEqual(['a : int', 'b : int']);
  });

  it('muteClassToObject switches to OBJECT: method-shaped lines become fields (java:149 OBJECT bypass)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('run()');
    bodier.addFieldOrMethod('f : int');
    expect(displays(bodier, 'fields')).toEqual(['f : int']);
    bodier.muteClassToObject();
    expect(displays(bodier, 'fields')).toEqual(['run()', 'f : int']);
  });

  it('getFieldsToDisplay returns Display elements that ARE the Member objects', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('+f : int');
    const first = bodier.getFieldsToDisplay().asList()[0];
    expect(first).toBeInstanceOf(Member);
    expect((first as Member).getVisibilityModifier()).toBe(VisibilityModifier.PUBLIC_FIELD);
  });
});

describe('hasUrl (java:172-190)', () => {
  it('is true iff a displayed field or method carries a member url', () => {
    const withUrl = new BodierLikeClassOrObject(LeafType.CLASS, null);
    withUrl.addFieldOrMethod('name [[[http://x]]]');
    expect(withUrl.hasUrl()).toBe(true);

    const without = new BodierLikeClassOrObject(LeafType.CLASS, null);
    without.addFieldOrMethod('name');
    without.addFieldOrMethod('run()');
    expect(without.hasUrl()).toBe(false);
  });
});

describe('rawBodyWithoutHidden (java:192-206; A2s R2d jar-verified blank-row rule)', () => {
  interface RawBodyProbe {
    rawBodyWithoutHidden(): Member[];
  }

  it('wraps EVERY raw line in a Member — blanks included, never the empties-filtering', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, new Set([VisibilityModifier.PRIVATE_METHOD]));
    bodier.addFieldOrMethod('+a : int');
    bodier.addFieldOrMethod('');
    bodier.addFieldOrMethod('-b()');
    const result = (bodier as unknown as RawBodyProbe).rawBodyWithoutHidden();
    expect(result.map((m) => m.getDisplay(false))).toEqual(['a : int', ' ']);
  });

  it('preserves upstream NPE when the hide set is null (java:201 unguarded contains)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, null);
    bodier.addFieldOrMethod('a');
    expect(() => (bodier as unknown as RawBodyProbe).rawBodyWithoutHidden()).toThrow('NullPointerException');
  });
});

describe('getBody dispatch (java:208-250)', () => {
  const emptyHide = new Set<VisibilityModifier>();

  it('enhanced body + no methods + no fields returns null (java:220) — before any leaf check', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, emptyHide);
    bodier.addFieldOrMethod('--sep--');
    expect(bodier.getBody(new MockSkinParam(), false, false, undefined, style, fontConfiguration)).toBeNull();
  });

  it('enhanced body with members shown routes to BodyFactory.create1 (deferred T9 hook pinned)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, emptyHide);
    bodier.addFieldOrMethod('--sep--');
    expect(() => bodier.getBody(new MockSkinParam(), true, true, undefined, style, fontConfiguration)).toThrow(
      /create1: deferred to SI1 batch-4\/T9/,
    );
  });

  it('throws IllegalStateException when no leaf was set (java:222-223)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, emptyHide);
    bodier.addFieldOrMethod('f : int');
    expect(() => bodier.getBody(new MockSkinParam(), true, true, undefined, style, fontConfiguration)).toThrow(
      'IllegalStateException',
    );
  });

  it('OBJECT with showFields=false returns the 0x0 empty block (java:225-229)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.OBJECT, emptyHide);
    bodier.setLeaf(fakeLeaf);
    bodier.addFieldOrMethod('f : int');
    const block = bodier.getBody(new MockSkinParam(), true, false, undefined, style, fontConfiguration);
    const dim = block?.calculateDimension(undefined as unknown as StringBounder);
    expect(dim?.getWidth()).toBe(0);
    expect(dim?.getHeight()).toBe(0);
  });

  it('OBJECT with showFields=true routes to BodyFactory.create1 (deferred T9 hook pinned)', () => {
    const bodier = new BodierLikeClassOrObject(LeafType.OBJECT, emptyHide);
    bodier.setLeaf(fakeLeaf);
    bodier.addFieldOrMethod('f : int');
    expect(() => bodier.getBody(new MockSkinParam(), false, true, undefined, style, fontConfiguration)).toThrow(
      /create1: deferred to SI1 batch-4\/T9/,
    );
  });

  it('the class MethodsOrFieldsArea path is the deferred T9 wiring hook (java:237-249; pinned)', () => {
    // Upstream constructs BOTH areas before branching on show flags, so
    // even (false,false) reaches the construction — once T9 bridges
    // T8's MethodsOrFieldsAreaConfig seam, this pin flips to real blocks.
    const bodier = new BodierLikeClassOrObject(LeafType.CLASS, emptyHide);
    bodier.setLeaf(fakeLeaf);
    bodier.addFieldOrMethod('f : int');
    expect(() => bodier.getBody(new MockSkinParam(), true, true, undefined, style, fontConfiguration)).toThrow(
      /deferred to SI1 batch-4\/T9 \(MethodsOrFieldsArea/,
    );
  });
});
