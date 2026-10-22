/**
 * sdd2-T7f — sequence document chrome drawn by `TextBlockExporter#exportTo`
 * and `SvgGraphics`'s constructor, finalized in `core/assemble-svg-sequence.ts`:
 *
 *  - Q: an `HColorGradient` backcolor mints its gradient FIRST and paints the
 *    full-canvas rect with it, leaving the root style without `background:`
 *    (`klimt/drawing/svg/SvgGraphics.java:178-183`, `:207-212`).
 *  - AD: `maybeDrawBorder` draws `URectangle.build(dim.w - t, dim.h - t)` at
 *    the origin, AFTER the background rect and BEFORE the diagram
 *    (`core/TextBlockExporter.java:170,214-231`).
 */
import { describe, it, expect } from 'vitest';
import { assembleSvg } from '../../../src/core/assemble-svg.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';
import { ROOT_GROUP_OPEN } from '../../../src/core/svg.js';
import { seedOf } from '../../../src/core/klimt/drawing/svg/svg-seed.js';
import { getSeed } from '../../../src/core/svg-defs-seeded.js';

const INNER = '<line x1="0" y1="0" x2="1" y2="1"/>';

/** `kitevo-12-guvo789`'s canvas (`skinparam backgroundcolor blue/red`). */
const KITEVO_DIMS = { width: 228, height: 248 };

/** `dabozi-63-zuco354`'s `calculateFinalDimension` -- golden border rect
 *  `width="112.388" height="157"` plus the 1 px `UStroke.simple()`. */
const DABOZI_EXPORTED = { width: 113.388, height: 158 };

function sequenceFragment(overrides: Partial<RenderFragment> = {}): RenderFragment {
  return { body: INNER, ...KITEVO_DIMS, diagramType: 'SEQUENCE', ...overrides };
}

function rootGroupChildren(svg: string): string {
  const start = svg.indexOf(ROOT_GROUP_OPEN) + ROOT_GROUP_OPEN.length;
  return svg.slice(start, svg.lastIndexOf('</g></svg>'));
}

describe('assembleSvg — SEQUENCE gradient document background (Q)', () => {
  const blueRed = { color1: 'blue', color2: 'red', policy: '/' } as const;

  it('mints the gradient with the default diagonal vector and paints the full canvas with it (kitevo)', () => {
    const svg = assembleSvg(sequenceFragment({ background: 'blue/red', backgroundGradient: blueRed }));
    // Golden: `<linearGradient x1="0%" y1="0%" x2="100%" y2="100%" id="…">
    // <stop stop-color="#00F" offset="0%"/><stop stop-color="#F00" offset="100%"/>`
    // -- the `else` vector of `createSvgGradient` (SvgGraphics.java:387-392).
    const id = /<linearGradient id="([^"]+)" x1="0%" y1="0%" x2="100%" y2="100%">/.exec(svg)?.[1];
    expect(id).toBeDefined();
    expect(svg).toContain('<stop offset="0%" stop-color="#00F"/><stop offset="100%" stop-color="#F00"/>');
    expect(rootGroupChildren(svg)).toBe(
      `<rect x="0" y="0" width="228" height="248" fill="url(#${String(id)})" stroke="none"/>` + INNER,
    );
  });

  it('leaves the root style without a background property (backcolorString = null, SvgGraphics.java:179)', () => {
    const svg = assembleSvg(sequenceFragment({ background: 'blue/red', backgroundGradient: blueRed }));
    expect(svg).toContain('style="width:228px;height:248px;"');
  });

  it('numbers the background gradient before every gradient the diagram draws (gifope)', () => {
    // gifope-23-jufe872: the jar's background gradient is `g<uid>0` and the
    // participant's `#red\blue` is `g<uid>1` -- the constructor mints the
    // background before `textBlock.drawU` runs (SvgGraphics.java:181,393).
    const participant =
      '<linearGradient id="gpart" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#F00"/>' +
      '<stop offset="100%" stop-color="#00F"/></linearGradient><rect fill="url(#gpart)"/>';
    const seed = seedOf('@startuml\n@enduml');
    const svg = assembleSvg(
      sequenceFragment({
        body: participant,
        background: 'AntiqueWhite/Gold',
        backgroundGradient: { color1: 'AntiqueWhite', color2: 'Gold', policy: '/' },
      }),
      seed,
    );
    const uid = getSeed(seed);
    expect(rootGroupChildren(svg)).toMatch(
      new RegExp(`^<rect x="0" y="0" width="228" height="248" fill="url\\(#g${uid}0\\)"`),
    );
    expect(svg).toContain(`<rect fill="url(#g${uid}1)"/>`);
  });

  it('paints a plain background exactly as before (regression guard)', () => {
    const svg = assembleSvg(sequenceFragment({ background: '#FF0000' }));
    expect(rootGroupChildren(svg)).toBe(
      '<rect x="0" y="0" width="228" height="248" fill="#F00" stroke="none"/>' + INNER,
    );
    expect(svg).not.toContain('<linearGradient');
  });
});

describe('assembleSvg — SEQUENCE diagram border (AD)', () => {
  const BORDER_112 = '<rect x="0" y="0" width="112.388" height="157" fill="none" stroke="#000" stroke-width="1"/>';

  it('draws the border at calculateFinalDimension minus the stroke (dabozi, chrome-composed)', () => {
    const svg = assembleSvg(
      sequenceFragment({ width: 114, height: 159, diagramBorderColor: '#000000', exportedDimension: DABOZI_EXPORTED }),
    );
    expect(rootGroupChildren(svg)).toBe(BORDER_112 + INNER);
  });

  it('recovers the dimension from the margin-less block when no chrome ran (SequenceDiagram.java:630 same(5))', () => {
    const svg = assembleSvg(
      sequenceFragment({
        width: 114.388,
        height: 159,
        preChromeWidth: 103.388,
        preChromeHeight: 148,
        diagramBorderColor: '#000000',
      }),
    );
    expect(rootGroupChildren(svg)).toBe(BORDER_112 + INNER);
  });

  it('falls back to the canvas less ensureVisible`s +1 when the block is undeclared (scaled document)', () => {
    const svg = assembleSvg(sequenceFragment({ width: 114.388, height: 159, diagramBorderColor: '#000000' }));
    expect(rootGroupChildren(svg)).toBe(BORDER_112 + INNER);
  });

  it('draws the border AFTER the background rect, which the SvgGraphics constructor appends first', () => {
    const svg = assembleSvg(
      sequenceFragment({
        width: 114,
        height: 159,
        background: '#FF0000',
        diagramBorderColor: '#000000',
        exportedDimension: DABOZI_EXPORTED,
      }),
    );
    expect(rootGroupChildren(svg)).toBe(
      '<rect x="0" y="0" width="114" height="159" fill="#F00" stroke="none"/>' + BORDER_112 + INNER,
    );
  });

  it('splices the border ahead of chrome in an already-wrapped body', () => {
    const title = '<g class="title"><text x="5" y="12">t</text></g>';
    const svg = assembleSvg(
      sequenceFragment({
        body: ROOT_GROUP_OPEN + title + INNER + '</g>',
        bodyWrapped: true,
        width: 114,
        height: 159,
        diagramBorderColor: '#000000',
        exportedDimension: DABOZI_EXPORTED,
      }),
    );
    expect(rootGroupChildren(svg)).toBe(BORDER_112 + title + INNER);
  });

  it('draws no border when diagramBorderColor is unset', () => {
    const svg = assembleSvg(sequenceFragment({ width: 114, height: 159, exportedDimension: DABOZI_EXPORTED }));
    expect(rootGroupChildren(svg)).toBe(INNER);
  });
});
