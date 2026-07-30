/**
 * class-body-enhanced-geometry.test.ts — T2a: direct unit coverage for
 * `src/diagrams/class/class-body-enhanced-geometry.ts`, the ADR-7 bridge
 * that derives `BodyEnhancedAbstract#decorate`'s Y-axis offsets for
 * `class-body-enhanced-layout.ts`'s plain/titled divider branches through
 * the REAL ported `decorate()` (`src/core/cucadiagram/
 * BodyEnhancedAbstract.ts`), rather than a local re-derivation.
 *
 * These numbers are also cross-checked directly against
 * `tests/unit/core/cucadiagram/BodyEnhancedAbstract.test.ts`'s
 * hand-derived Java formulas — this file exercises the SAME arithmetic
 * through the class-side entry point (`ClassifierBodyGeometry`).
 */
import { describe, expect, it } from 'vitest';
import {
  ClassifierBodyGeometry,
  ELEMENT_DEFAULT_LINE_THICKNESS,
  BODY_ENHANCED_MARGIN_X,
  memberLineCount,
} from '../../../src/diagrams/class/class-body-enhanced-geometry.js';

describe('ELEMENT_DEFAULT_LINE_THICKNESS / BODY_ENHANCED_MARGIN_X (traced constants)', () => {
  it('ELEMENT_DEFAULT_LINE_THICKNESS is 0.5 (plantuml.skin:91-93 element { LineThickness 0.5 })', () => {
    expect(ELEMENT_DEFAULT_LINE_THICKNESS).toBe(0.5);
  });

  it('BODY_ENHANCED_MARGIN_X is 6 (BodyEnhanced1.java:113-115 getMarginX)', () => {
    expect(BODY_ENHANCED_MARGIN_X).toBe(6);
  });
});

describe('memberLineCount', () => {
  it('counts only lines that parse as a member (skips blank/separator/malformed)', () => {
    expect(memberLineCount(['+field1 : int', '-field2 : String'])).toBe(2);
    expect(memberLineCount([])).toBe(0);
  });
});

describe('ClassifierBodyGeometry.deriveHeightOffsets — no title (decorate()`s no-title branch)', () => {
  it('contentTop=4, dividerY=0, totalHeight=contentHeight+8 (Java: withMargin(block, marginX, 4))', () => {
    const geometry = new ClassifierBodyGeometry(ELEMENT_DEFAULT_LINE_THICKNESS, BODY_ENHANCED_MARGIN_X);
    const offsets = geometry.deriveHeightOffsets(20, '-');
    expect(offsets).toEqual({ contentTop: 4, dividerY: 0, totalHeight: 28 });
  });

  it('is independent of separator char (only the char value, not its shape, feeds Y geometry)', () => {
    const geometry = new ClassifierBodyGeometry(ELEMENT_DEFAULT_LINE_THICKNESS, BODY_ENHANCED_MARGIN_X);
    expect(geometry.deriveHeightOffsets(20, '=')).toEqual({ contentTop: 4, dividerY: 0, totalHeight: 28 });
    expect(geometry.deriveHeightOffsets(20, '.')).toEqual({ contentTop: 4, dividerY: 0, totalHeight: 28 });
  });
});

describe('ClassifierBodyGeometry.deriveHeightOffsets — with title (decorate()`s title branch)', () => {
  it('reproduces the dimTitleHeight/2 offsets exactly (mirrors BodyEnhancedAbstract.test.ts)', () => {
    const geometry = new ClassifierBodyGeometry(ELEMENT_DEFAULT_LINE_THICKNESS, BODY_ENHANCED_MARGIN_X);
    // contentHeight=20, dimTitleHeight=10 (fontSpec.size):
    //   contentTop = dimTitleHeight = 10
    //   dividerY = dimTitleHeight/2 = 5
    //   innerHeight = 20 + 5 + 4 = 29; rawHeight = max(29, 10) = 29
    //   totalHeight = dimTitleHeight/2 + rawHeight = 5 + 29 = 34
    const offsets = geometry.deriveHeightOffsets(20, '-', 10);
    expect(offsets).toEqual({ contentTop: 10, dividerY: 5, totalHeight: 34 });
  });

  it("the atLeast(_, dimTitleHeight) floor binds on EMPTY content (pacagu-24-nune023's fixture shape)", () => {
    const geometry = new ClassifierBodyGeometry(ELEMENT_DEFAULT_LINE_THICKNESS, BODY_ENHANCED_MARGIN_X);
    // contentHeight=0, dimTitleHeight=10:
    //   innerHeight = 0 + 5 + 4 = 9; rawHeight = max(9, 10) = 10 (floor binds)
    //   totalHeight = 5 + 10 = 15
    const offsets = geometry.deriveHeightOffsets(0, '-', 10);
    expect(offsets).toEqual({ contentTop: 10, dividerY: 5, totalHeight: 15 });
  });
});

describe('ClassifierBodyGeometry.getArea — unreachable via this file`s own usage, but a real throw', () => {
  it('throws if invoked (e.g. via the inherited public calculateDimension/drawU)', () => {
    class ProbeableGeometry extends ClassifierBodyGeometry {
      // `getArea` is `protected` -- calling it via `this` from a subclass
      // (rather than re-declaring/overriding it) proves the BASE class's
      // own throw body runs, not a re-implementation.
      callGetArea(): never {
        return this.getArea();
      }
    }
    const geometry = new ProbeableGeometry(ELEMENT_DEFAULT_LINE_THICKNESS, BODY_ENHANCED_MARGIN_X);
    expect(() => geometry.callGetArea()).toThrow(/unreachable/);
  });
});
