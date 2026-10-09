/**
 * cdd3-T8 (R-LEAF, `class-divergence-drive-3/batch-1/T8-leaf-ink.md`):
 * `measureEntityLeafInk` generalizes `measureUsecaseOrActorLeafInk` to any
 * leaf sized through `EntityImageDescription` (`buildSizingEntityParams`),
 * walking with the element's OWN `opts`/`sprites`/`measurer` rather than a
 * bare re-synthesis (cdd2-T17's own probe finding: walking WITHOUT `opts`
 * raised `gujigi-63-roki030` 576→578).
 *
 * Jar-verified (`cacoma-43-poxu615`, `component comp3`): `USymbolComponent2
 * #drawComponent2` (`decoration/symbol/USymbolComponent2.java:62,68`) draws
 * one `URectangle.build(widthTotal, heightTotal)` at the shape's own origin
 * — `LimitFinder#drawRectangle`'s `(x-1, y-1)`/`(x+w-1, y+h-1)` corner rule
 * (`klimt/drawing/LimitFinder.ts:184-188`, a faithful port of
 * `LimitFinder.java:184-188`) then walks it to `{-1,-1,81,43}` for comp3's
 * declared 82x44 box — cdd2-T17's own cited numbers (`.agent-notes/
 * cdd2-T17.md`), reproduced here against the real `WidthTableMeasurer` (the
 * SAME measurer the render-diff/conformance harness uses, so this number is
 * jar-comparable, not just internally consistent).
 */
import { describe, expect, test } from 'vitest';
import {
  measureEntityLeafInk,
  measureUsecaseOrActorLeafInk,
} from '../../../../../src/core/svek/image/leaf-sizing-entity.js';
import type { LeafSizingSubject } from '../../../../../src/core/svek/image/LeafSizingSubject.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';

const measurer = new DeterministicMeasurer();
const fontSpec = { family: 'sans-serif', size: 14 };

describe('measureEntityLeafInk (cdd3-T8, R-LEAF)', () => {
  test('a `component` leaf ink is the drawn URectangle corner rule -- comp3, cacoma-43-poxu615', () => {
    const node: LeafSizingSubject = { id: '', display: 'comp3', symbol: 'component' };
    const ink = measureEntityLeafInk(node, fontSpec, { opts: undefined, sprites: undefined, measurer });
    expect(ink).toEqual({ minX: -1, minY: -1, maxX: 81, maxY: 43 });
  });

  test('measureUsecaseOrActorLeafInk (actor/usecase) delegates unchanged -- opts: undefined, same result as before this task', () => {
    const viaWrapper = measureUsecaseOrActorLeafInk('Foo', 'actor', fontSpec, measurer);
    const node: LeafSizingSubject = { id: '', display: 'Foo', symbol: 'actor' };
    const viaGeneral = measureEntityLeafInk(node, fontSpec, { opts: undefined, sprites: undefined, measurer });
    expect(viaWrapper).toEqual(viaGeneral);
  });

  test('an opts override changes the ink -- `skinparam minClassWidth` widens the box the same way it widens sizing (cdd2-T17\'s own "walk WITHOUT opts raises gujigi" finding, guarded against)', () => {
    const node: LeafSizingSubject = { id: '', display: 'comp3', symbol: 'component' };
    const unstyled = measureEntityLeafInk(node, fontSpec, { opts: undefined, sprites: undefined, measurer });
    const widened = measureEntityLeafInk(node, fontSpec, {
      opts: { minimumWidth: 400 },
      sprites: undefined,
      measurer,
    });
    expect(widened).not.toEqual(unstyled);
    expect(widened!.maxX).toBeGreaterThan(unstyled!.maxX);
  });
});
