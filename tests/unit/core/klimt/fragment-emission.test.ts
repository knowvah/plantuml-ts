/**
 * fragment-emission.test.ts — SI14 T1: `document-shell.ts#renderDrawableToFragment`
 * / `#mergeFragmentDefs`, the klimt fragment-emission seam batch 3 draws
 * usecase/actor leaves through (ADR-2).
 *
 * @see plans/si14-usymbol-measurement-sharing/decisions.md (ADR-2)
 */
import { describe, expect, it } from 'vitest';
import {
  renderDrawableToFragment,
  mergeFragmentDefs,
  type DrawableFragment,
} from '../../../../src/core/klimt/document-shell.js';
import { URectangle } from '../../../../src/core/klimt/shape/URectangle.js';
import { UText } from '../../../../src/core/klimt/shape/UText.js';
import type { FontStyle } from '../../../../src/core/klimt/shape/UText.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { Back } from '../../../../src/core/klimt/Back.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import type { UDrawable } from '../../../../src/core/klimt/shape/UDrawable.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import type { StringMeasurer } from '../../../../src/core/measurer.js';

// A cheap, deterministic stand-in for jarMeasurer/DeterministicMeasurer --
// this task only exercises id-emission/extraction plumbing, not real
// jar-measured widths, so any fixed formula suffices.
const stubMeasurer: StringMeasurer = {
  measure(text, font) {
    return { width: text.length * font.size * 0.5, height: font.size };
  },
  getDescent(font) {
    return font.size / 4.5;
  },
};

/** A rectangle with a drop shadow: `SvgGraphicsCore#addFilterShadowId`
 *  sets `filter="url(#<shadowId>)"` directly ON the `<rect>` element in
 *  BODY (the `<filter id="...">` definition itself goes to `extraDefs`) --
 *  an id-bearing-element proof that does not depend on gradient
 *  de-dup/registration order. */
function shadowedRect(width: number, height: number, deltaShadow: number): UDrawable {
  return {
    drawU(ug: UGraphic): void {
      const rect = URectangle.build(width, height);
      rect.setDeltaShadow(deltaShadow);
      ug.apply(new Fore('#000000')).apply(new Back('#FF0000')).draw(rect);
    },
  };
}

/** A rectangle filled with a two-stop gradient: registers a
 *  `<linearGradient id="...">` def (`extraDefs`) referenced via
 *  `fill="url(#...)"` in `body`. */
function gradientRect(
  width: number,
  height: number,
  color1: string,
  color2: string,
): UDrawable {
  return {
    drawU(ug: UGraphic): void {
      const gradient = { color1, color2, policy: '/' as const };
      ug.apply(new Fore('none')).apply(new Back(gradient)).draw(URectangle.build(width, height));
    },
  };
}

/** A single line of text, drawn via `UText`/`DriverTextSvg` -- exercises
 *  `renderDrawableToFragment`'s `driverBounderFor` wiring (the
 *  `stringBounder` param), which a rectangle-only drawable never reaches
 *  (`DriverTextSvg` is the only driver that calls
 *  `UGraphic#getStringBounder`/the injected width-only bounder). */
function textDrawable(text: string, x: number, y: number): UDrawable {
  return {
    drawU(ug: UGraphic): void {
      const font = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set<FontStyle>() };
      ug.apply(new UTranslate(x, y)).draw(UText.build(text, font));
    },
  };
}

function bodyReferencedIds(fragment: DrawableFragment): string[] {
  return [...fragment.body.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]!);
}

function defIds(defs: string | undefined): string[] {
  return [...(defs ?? '').matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!);
}

describe('renderDrawableToFragment', () => {
  it('AC1: two different uid values produce fragments whose body-referenced ids never collide', () => {
    const drawable = shadowedRect(20, 10, 4);
    const a = renderDrawableToFragment(drawable, {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'node-a',
    });
    const b = renderDrawableToFragment(drawable, {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'node-b',
    });

    const idsA = bodyReferencedIds(a);
    const idsB = bodyReferencedIds(b);
    // Provably non-vacuous: the shadow filter reference must actually be
    // present in body, or this test would pass even if id derivation were
    // broken (both sides empty).
    expect(idsA).toHaveLength(1);
    expect(idsB).toHaveLength(1);
    expect(idsA[0]).not.toBe(idsB[0]);
    // The def id in extraDefs must match the body's own reference.
    expect(defIds(a.extraDefs)).toContain(idsA[0]);
    expect(defIds(b.extraDefs)).toContain(idsB[0]);
  });

  it('AC1 (regression guard): the SAME uid on two separate calls reproduces the SAME id', () => {
    const drawable = shadowedRect(20, 10, 4);
    const a = renderDrawableToFragment(drawable, {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'node-shared',
    });
    const b = renderDrawableToFragment(drawable, {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'node-shared',
    });
    expect(bodyReferencedIds(a)).toEqual(bodyReferencedIds(b));
  });

  it('AC3: rendering the same drawable/uid/measurer twice is byte-identical', () => {
    const drawable = gradientRect(30, 15, '#112233', '#445566');
    const opts = { width: 30, height: 15, measurer: stubMeasurer, uid: 'det-node' };
    const first = renderDrawableToFragment(drawable, opts);
    const second = renderDrawableToFragment(drawable, opts);
    expect(second).toEqual(first);
    expect(second.body).toBe(first.body);
    expect(second.extraDefs).toBe(first.extraDefs);
  });

  it('emits a body with no <svg> wrapper and no leading/trailing <g> markup', () => {
    const fragment = renderDrawableToFragment(shadowedRect(20, 10, 0), {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'plain-node',
    });
    expect(fragment.body).not.toContain('<svg');
    expect(fragment.body).not.toMatch(/^<g>/);
    expect(fragment.body).toContain('<rect');
  });

  it('omits extraDefs (not empty string) when the drawable registers no defs', () => {
    const fragment = renderDrawableToFragment(shadowedRect(20, 10, 0), {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'no-defs-node',
    });
    expect(fragment.extraDefs).toBeUndefined();
  });

  it('threads the caller-supplied measurer through to text draws (driverBounderFor wiring)', () => {
    const fragment = renderDrawableToFragment(textDrawable('Hi', 5, 12), {
      width: 30,
      height: 20,
      measurer: stubMeasurer,
      uid: 'text-node',
    });
    // stubMeasurer.measure: width = text.length * font.size * 0.5 = 2*14*0.5 = 14
    expect(fragment.body).toContain('<text');
    expect(fragment.body).toContain('textLength="14"');
  });

  it('reports width/height from the fragment document viewBox', () => {
    const fragment = renderDrawableToFragment(shadowedRect(20, 10, 0), {
      width: 40,
      height: 25,
      measurer: stubMeasurer,
      uid: 'sized-node',
    });
    // `SvgGraphicsCore#ensureVisible`'s own `Math.trunc(x) + 1` floor
    // convention (svg-graphics-core.ts:218-220) — matches
    // `renderDescription`'s documented "minDim is a floor, not the final
    // size" semantics, not a bug in this seam.
    expect(fragment.width).toBe(41);
    expect(fragment.height).toBe(26);
  });
});

describe('mergeFragmentDefs', () => {
  it('AC2: two fragments with distinct extraDefs merge with each def exactly once, and every url(#) in either body resolves', () => {
    const a = renderDrawableToFragment(gradientRect(20, 10, '#FF0000', '#FFFF00'), {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'grad-a',
    });
    const b = renderDrawableToFragment(gradientRect(20, 10, '#0000FF', '#00FF00'), {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'grad-b',
    });

    const merged = mergeFragmentDefs([a, b]);
    expect(merged).toBeDefined();
    const mergedIds = new Set(defIds(merged));

    // Each distinct def appears exactly once.
    expect([...merged!.matchAll(/<linearGradient/g)]).toHaveLength(2);

    // Every url(#...) reference in either body resolves to a def present
    // in the merged output.
    for (const id of [...bodyReferencedIds(a), ...bodyReferencedIds(b)]) {
      expect(mergedIds.has(id)).toBe(true);
    }
  });

  it('AC2 (real de-dup, not just non-collision): merging the SAME fragment twice yields one copy of its def', () => {
    const fragment = renderDrawableToFragment(gradientRect(20, 10, '#111111', '#222222'), {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'dup-node',
    });

    const merged = mergeFragmentDefs([fragment, fragment]);
    expect([...merged!.matchAll(/<linearGradient/g)]).toHaveLength(1);
  });

  it('returns undefined (not empty string) when no fragment carries extraDefs', () => {
    const a = renderDrawableToFragment(shadowedRect(20, 10, 0), {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'plain-a',
    });
    const b = renderDrawableToFragment(shadowedRect(20, 10, 0), {
      width: 20,
      height: 10,
      measurer: stubMeasurer,
      uid: 'plain-b',
    });
    expect(mergeFragmentDefs([a, b])).toBeUndefined();
  });

  it('returns undefined for an empty fragment list', () => {
    expect(mergeFragmentDefs([])).toBeUndefined();
  });
});
