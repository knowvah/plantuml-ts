/**
 * BodyFactory.test.ts — SI1/T9: `createLeaf`/`createGroup` routing and
 * the `create1`/`create2` → `BodyEnhanced1` construction (upstream
 * cucadiagram/BodyFactory.java:58-77), including the ADR-9 runtime
 * narrowing guards (`BodyEnhanced1Config.ts`). `create3` is covered by
 * `BodyEnhanced2.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { Style } from '../../../../src/core/abel/ISkinParam.js';
import { LeafType } from '../../../../src/core/abel/LeafType.js';
import { BodierLikeClassOrObject } from '../../../../src/core/cucadiagram/BodierLikeClassOrObject.js';
import { BodierSimple } from '../../../../src/core/cucadiagram/BodierSimple.js';
import { BodyFactory } from '../../../../src/core/cucadiagram/BodyFactory.js';
import { MockSkinParam } from '../abel/helpers.js';
import { CHAR_WIDTH, LINE_HEIGHT, fakeLeaf, fakeSkin, makeBodyStyle, sb } from './helpers.js';

const LEFT = HorizontalAlignment.LEFT;

describe('createLeaf routing (java:58-63)', () => {
  it('class-like types and OBJECT get BodierLikeClassOrObject', () => {
    expect(BodyFactory.createLeaf(new MockSkinParam(), LeafType.CLASS, null)).toBeInstanceOf(BodierLikeClassOrObject);
    expect(BodyFactory.createLeaf(new MockSkinParam(), LeafType.INTERFACE, null)).toBeInstanceOf(BodierLikeClassOrObject);
    expect(BodyFactory.createLeaf(new MockSkinParam(), LeafType.OBJECT, null)).toBeInstanceOf(BodierLikeClassOrObject);
  });

  it('everything else — including MAP and JSON, which are neither class-like nor OBJECT — gets BodierSimple', () => {
    expect(BodyFactory.createLeaf(new MockSkinParam(), LeafType.USECASE, null)).toBeInstanceOf(BodierSimple);
    expect(BodyFactory.createLeaf(new MockSkinParam(), LeafType.STATE, null)).toBeInstanceOf(BodierSimple);
    expect(BodyFactory.createLeaf(new MockSkinParam(), LeafType.MAP, null)).toBeInstanceOf(BodierSimple);
    expect(BodyFactory.createLeaf(new MockSkinParam(), LeafType.JSON, null)).toBeInstanceOf(BodierSimple);
  });
});

describe('createGroup (java:65-67)', () => {
  it('always BodierSimple', () => {
    expect(BodyFactory.createGroup(new MockSkinParam())).toBeInstanceOf(BodierSimple);
  });
});

describe('create1/create2 → BodyEnhanced1 (java:69-77)', () => {
  /** A present-but-unconsumed renderer exercises the optional-seam
   *  forwarding (exactOptionalPropertyTypes spread) without needing an
   *  embedded diagram block. */
  const renderer = {
    render: (): never => {
      throw new Error('not exercised in this test');
    },
  };

  it('create1 uses the List ctor (lineFirst: leading "_" separator, +8 height)', () => {
    const block = BodyFactory.create1(
      LEFT,
      ['alpha'],
      fakeSkin(),
      undefined,
      fakeLeaf(LeafType.CLASS),
      makeBodyStyle({ nestedDiagramRenderer: renderer }),
    );
    const dim = block.calculateDimension(sb);
    expect(dim.getWidth()).toBe(5 * CHAR_WIDTH + 12);
    expect(dim.getHeight()).toBe(LINE_HEIGHT + 8);
  });

  it('create2 uses the Display ctor (no leading separator) — the ADR-4 folder/package title route', () => {
    const block = BodyFactory.create2(
      LEFT,
      Display.create(['alpha']),
      fakeSkin(),
      undefined,
      fakeLeaf(LeafType.CLASS),
      makeBodyStyle({ nestedDiagramRenderer: renderer }),
    );
    const dim = block.calculateDimension(sb);
    expect(dim.getWidth()).toBe(5 * CHAR_WIDTH + 12);
    expect(dim.getHeight()).toBe(LINE_HEIGHT);
  });

  it('an undefined entity throws upstream\'s NPE (entity.getColors() in the super call)', () => {
    expect(() => BodyFactory.create1(LEFT, [], fakeSkin(), undefined, undefined, makeBodyStyle())).toThrow(
      'NullPointerException',
    );
    expect(() => BodyFactory.create2(LEFT, Display.empty(), fakeSkin(), undefined, undefined, makeBodyStyle())).toThrow(
      'NullPointerException',
    );
  });

  it('a bare ISkinParam stub fails the MethodsOrFieldsAreaSkinParam narrowing with the ADR-2 deferral message', () => {
    expect(() =>
      BodyFactory.create1(LEFT, [], new MockSkinParam(), undefined, fakeLeaf(LeafType.CLASS), makeBodyStyle()),
    ).toThrow(/deferred per SI1\/ADR-2: .*MethodsOrFieldsAreaSkinParam/);
  });

  it('a bare Style stub fails the BodyEnhanced1Style narrowing with the ADR-2 deferral message', () => {
    const bareStyle: Style = { getHorizontalAlignment: () => LEFT };
    expect(() =>
      BodyFactory.create2(LEFT, Display.empty(), fakeSkin(), undefined, fakeLeaf(LeafType.CLASS), bareStyle),
    ).toThrow(/deferred per SI1\/ADR-2: .*BodyEnhanced1Style/);
  });
});
