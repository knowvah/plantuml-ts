/**
 * T7 (description-leaf-sizing-audit) — the SIZER's `actor`/`actor-business`
 * dispatch must read `BoxSizingOpts.actorStyle` (threaded from
 * `Theme.actorStyle`), not a hardcoded `ActorStyle.STICKMAN`, so a
 * `skinparam actorStyle awesome|hollow` leaf sizes to match what
 * `renderer-entity.ts` will actually draw.
 *
 * Jar-verified dimensions (T4 measurement, this task's own oracle capture
 * against `oracle/dist/plantuml-oracle.jar`, `actor Foo\nusecase Bar\nFoo
 * --> Bar` with `skinparam actorStyle <style>`): awesome 55x75px (0.763889
 * x1.041667in), hollow 26x33px shape (label-dominated to 30x47px under
 * this suite's 10px/char stub measurer), unset/stickman 27x60px shape
 * (label-dominated to 30x74px). See `src/core/skin/ActorAwesome.ts`/
 * `ActorHollow.ts` module doc comments for the upstream formula each
 * number traces to.
 */
import { describe, it, expect } from 'vitest';
import { measureLeafNode, type BoxSizingOpts } from '../../../src/diagrams/description/leaf-sizing.js';
import { ActorStyle } from '../../../src/core/skin/ActorStyle.js';
import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';

const fontSpec: FontSpec = { family: 'Helvetica', size: 14 };

/** Deterministic 10px/char, height = fontSize -- same stub convention as
 *  `leaf-sizing-body.test.ts`. "Foo" measures 30px wide, narrower than the
 *  awesome/stickman shape widths (55/27) but WIDER than hollow's (26) --
 *  deliberately chosen so both "shape wins" and "label wins" branches of
 *  the `mergeLayoutT12B3` max() are exercised across the three styles. */
const stubMeasurer: StringMeasurer = {
  measure: (text: string, f: FontSpec) => ({ width: text.length * 10, height: f.size }),
  getDescent: () => 0,
};

function actorNode(): DescriptiveNode {
  return { id: 'x', display: 'Foo', symbol: 'actor', children: [] };
}

function size(opts?: BoxSizingOpts): { width: number; height: number } {
  return measureLeafNode(actorNode(), fontSpec, stubMeasurer, opts);
}

describe('leaf-sizing — actor/actorStyle (T7, description-leaf-sizing-audit)', () => {
  it('unset actorStyle sizes as STICKMAN (label-dominated width, 27px shape + 14px label = 60+14 height)', () => {
    expect(size()).toEqual({ width: 30, height: 74 });
  });

  it('actorStyle STICKMAN (explicit) matches unset', () => {
    expect(size({ actorStyle: ActorStyle.STICKMAN })).toEqual({ width: 30, height: 74 });
  });

  it('actorStyle AWESOME sizes wider and taller (shape-dominated width, 55px shape + 14px label = 61+14 height)', () => {
    expect(size({ actorStyle: ActorStyle.AWESOME })).toEqual({ width: 55, height: 75 });
  });

  it('actorStyle HOLLOW sizes shortest (label-dominated width, 33px shape + 14px label height)', () => {
    expect(size({ actorStyle: ActorStyle.HOLLOW })).toEqual({ width: 30, height: 47 });
  });

  it('actor-business ignores actorStyle -- upstream ALWAYS resolves the "actor/" keyword to ' +
    'ACTOR_STICKMAN_BUSINESS regardless of skinparam actorStyle (USymbols.java\'s own ' +
    '"actor/" branch is checked before the actorStyle-driven "actor" branch, bug-for-bug ' +
    'preserved -- see USymbols.ts\'s own doc comment)', () => {
    const node: DescriptiveNode = { id: 'x', display: 'Foo', symbol: 'actor-business', children: [] };
    const dims = measureLeafNode(node, fontSpec, stubMeasurer, { actorStyle: ActorStyle.AWESOME });
    expect(dims).toEqual({ width: 30, height: 74 });
  });
});
