/**
 * Unit tests for the composite south-cap ink term — SI31 T4 (G5,
 * "mechanism 8" in `layout-ink-extent.ts`'s own module doc comment).
 *
 * `RoundedContainer.drawU`
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/
 * RoundedContainer.java:89-91`) draws the south cap as a SEPARATE shape,
 * translated by `nameHeight + descriptionHeight` and `dim.getHeight() -
 * nameHeight - descriptionHeight` tall — so its own max-Y is the
 * container's full `height`, exactly.
 *
 * When `RoundedSouth.drawU` takes its `rounded != 0` branch
 * (`RoundedSouth.java:68-83`) that shape is a `UPath`, and
 * `LimitFinder#drawUPath` (`klimt/drawing/LimitFinder.java:164-167`) adds
 * `y + shape.getMaxY()` with ZERO inset, while the container's own outline
 * `URectangle` goes through `LimitFinder#drawRectangle`
 * (`LimitFinder.java:184-188`) at `y + height - 1`. The difference is
 * exactly the 1 px this term restores.
 *
 * `RoundedSouth.drawU:66-67` early-returns on `backColor.isTransparent()`,
 * and `plantuml.skin:266-271` defaults `stateDiagram.state.body`'s
 * `BackGroundColor` to `transparent` — so the DEFAULT path must stay
 * byte-identical, which the first describe block below asserts directly.
 */
import { describe, it, expect } from 'vitest';
import { computeStateDocumentDims } from '../../../src/diagrams/state/layout-ink-extent.js';
import type { StateNodeGeo } from '../../../src/diagrams/state/state-geo-types.js';

/** A composite (`children.length > 0`) at `x=10,y=20,w=100,h=50` holding one
 *  leaf well inside it, so the composite's OWN box is what bounds the
 *  document on every side. `addNodeInk`'s composite branch calls
 *  `addStateBoxInk(box, node, true)`, giving `[9,19]..[110,69]`; the south
 *  cap, when drawn, extends max-Y to `y + h = 70`. */
function composite(southCapInk?: boolean): StateNodeGeo {
  return {
    id: 'c1', kind: 'normal', display: 'c1', x: 10, y: 20, width: 100, height: 50,
    headerLines: [{ text: 'c1', width: 20 }],
    transitions: [],
    children: [
      {
        id: 'leaf', kind: 'normal', display: 'leaf', x: 20, y: 35, width: 20, height: 10,
        headerLines: [{ text: 'leaf', width: 10 }], children: [], transitions: [],
      },
    ],
    ...(southCapInk !== undefined ? { southCapInk } : {}),
  };
}

describe('composite south-cap ink — transparent south (the skin default)', () => {
  it('reserves no extra ink when southCapInk is absent', () => {
    expect(computeStateDocumentDims([composite()], [])).toEqual({ width: 122, height: 71 });
  });

  it('reserves no extra ink when southCapInk is explicitly false', () => {
    expect(computeStateDocumentDims([composite(false)], [])).toEqual({ width: 122, height: 71 });
  });

  it('is byte-identical to a geometry that has never heard of the field', () => {
    const withoutField = composite();
    const withFalse = composite(false);
    expect(computeStateDocumentDims([withFalse], [])).toEqual(computeStateDocumentDims([withoutField], []));
  });
});

describe('composite south-cap ink — non-transparent south', () => {
  it('extends max-Y by exactly 1 px (drawUPath zero inset vs drawRectangle -1)', () => {
    // height 71 -> 72; width UNCHANGED (the composite branch's own
    // `hasDivider: true` already contributes the uninset `x + w`, which is
    // the SAME max-X the south cap's `UPath` reaches).
    expect(computeStateDocumentDims([composite(true)], [])).toEqual({ width: 122, height: 72 });
  });

  it('leaves the min corner untouched', () => {
    const on = computeStateDocumentDims([composite(true)], []);
    const off = computeStateDocumentDims([composite(false)], []);
    expect(on.width).toBe(off.width);
    expect(on.height).toBe(off.height + 1);
  });
});

describe('composite south-cap ink — scope', () => {
  it('is ignored on a LEAF box (no children): jar draws no RoundedContainer there', () => {
    const leaf: StateNodeGeo = {
      id: 's1', kind: 'normal', display: 's1', x: 0, y: 0, width: 100, height: 50,
      children: [], transitions: [], headerLines: [{ text: 's1', width: 20 }],
      southCapInk: true,
    };
    expect(computeStateDocumentDims([leaf], [])).toEqual({ width: 122, height: 71 });
  });
});
