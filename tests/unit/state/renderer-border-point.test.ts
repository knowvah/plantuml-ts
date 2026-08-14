/**
 * Feature: `EntityImageStateBorder` — a border point's own symbol and the
 * placement of its name label.
 *
 * G9/T7: border points used to render through `renderNormal`, which gave them
 * a rounded state box, a divider `<line>` and the box's own header text
 * position. Upstream draws a bare circle (ENTRY/EXIT) or square (PINs) at
 * stroke 1.5, no divider, and the label OUTSIDE the symbol — above it when the
 * symbol sits in the top half of its parent cluster, below otherwise
 * (`EntityImageStateBorder.java:70-89`, `EntityPosition.java:82-118`).
 *
 * Every expected number below is read off a cached oracle, not derived:
 *   `lulozu-10-bopu547` — `<ellipse cx="25" cy="39.611" rx="6" ry="6"
 *     fill="#F1F1F1" style="stroke:#181818;stroke-width:1.5;"/>` with its
 *     label at `x="13.319" y="18.5"`, i.e. `symbolTop - 12 - 14 + ascent`.
 *   `cinoni-00-sere847` — the exit point's cross,
 *     `(29.389,176.72)-(21.611,168.942)` and
 *     `(29.389,168.942)-(21.611,176.72)` about a symbol at `(19,166.331)`.
 */
import { describe, it, expect } from 'vitest';
import { renderBorderPoint } from '../../../src/diagrams/state/renderer-border-point.js';
import type { StateNodeGeo } from '../../../src/diagrams/state/state-geo-types.js';
import { resolveTheme } from '../../../src/core/theme.js';

const theme = resolveTheme({});

/** `lulozu-10-bopu547`'s `en1`: a 12x12 symbol whose top-left is (19, 33.611),
 *  labelled "en1" at the fixture's own measured 23.363px. */
function borderPoint(overrides: Partial<StateNodeGeo> = {}): StateNodeGeo {
  return {
    id: 'en1',
    kind: 'normal',
    display: 'en1',
    x: 19,
    y: 33.611,
    width: 12,
    height: 12,
    children: [],
    transitions: [],
    stereotype: 'entrypoint',
    headerLines: [{ text: 'en1', width: 23.363 }],
    borderPointLabelHeight: 14,
    borderPointLabelAbove: true,
    ...overrides,
  };
}

describe('renderBorderPoint — EntityImageStateBorder', () => {
  it('draws an entry point as a bare circle at stroke 1.5, with no divider', () => {
    const svg = renderBorderPoint(borderPoint(), theme);
    expect(svg).toContain('<ellipse cx="25" cy="39.611" rx="6" ry="6"');
    expect(svg).toContain('stroke-width="1.5"');
    expect(svg).not.toContain('<line');
    expect(svg).not.toContain('rx="12.5"'); // the state box's rounded corner
  });

  it('places the label ABOVE the symbol when it sits in the parent`s top half', () => {
    // baseline = symbolTop(33.611) - 2*RADIUS - descHeight + ascent(10.889)
    const svg = renderBorderPoint(borderPoint(), theme);
    expect(svg).toContain('y="18.5"');
    expect(svg).toContain('x="13.319"'); // centred: 25 - 23.363/2
  });

  it('places it BELOW, flush under the symbol, in the bottom half', () => {
    // `drawU`'s else branch is `y += 2 * RADIUS` — no gap, unlike the 12px
    // one the above-branch leaves. baseline = 33.611 + 12 + 10.889.
    const svg = renderBorderPoint(borderPoint({ borderPointLabelAbove: false }), theme);
    expect(svg).toContain('y="56.5"');
  });

  it('draws a pin as a square, and an exit point as a circle plus its cross', () => {
    const pin = renderBorderPoint(borderPoint({ stereotype: 'inputPin' }), theme);
    expect(pin).toContain('<rect x="19" y="33.611" width="12" height="12"');
    expect(pin).not.toContain('<ellipse');

    // cinoni-00-sere847's own EC, translated to this fixture's origin.
    const exit = renderBorderPoint(borderPoint({ stereotype: 'exitPoint', x: 19, y: 166.331 }), theme);
    expect(exit).toContain('<ellipse cx="25" cy="172.331"');
    expect(exit).toContain('x1="29.389" y1="176.72" x2="21.611" y2="168.942"');
    expect(exit).toContain('x1="29.389" y1="168.942" x2="21.611" y2="176.72"');
  });

  it('draws the symbol alone when the border point has no label', () => {
    const svg = renderBorderPoint(borderPoint({ headerLines: [] }), theme);
    expect(svg).toContain('<ellipse');
    expect(svg).not.toContain('<text');
  });
});
