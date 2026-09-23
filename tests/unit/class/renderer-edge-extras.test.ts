/**
 * cdd-T7: direct unit tests for `renderer-edge-extras.ts` -- the
 * visibility-icon, note-on-link, and constraint renderers, tested in
 * isolation from the full `renderClass` pipeline (per
 * `~/.claude/rules/testability.md`). Every expected value is read off the
 * fixture's own oracle SVG, never fitted.
 */
import { describe, it, expect } from 'vitest';
import {
  renderEdgeVisibilityIcon,
  renderEdgeNoteBox,
  renderEdgeConstraint,
  renderEdgeCardinalityLabels,
} from '../../../src/diagrams/class/renderer-edge-extras.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const theme = scaleClassTheme(defaultTheme, 1);

function makeEdgeGeo(overrides?: Partial<EdgeGeo>): EdgeGeo {
  return {
    id: 'edge-0',
    points: [
      { x: 70, y: 70 },
      { x: 70, y: 140 },
    ],
    targetDecor: 'none',
    sourceDecor: 'none',
    dashed: false,
    from: 'A',
    to: 'B',
    ...overrides,
  };
}

// A2a/M2 -- canuti-20-jotu614's three visibility icons.
describe('renderEdgeVisibilityIcon', () => {
  it('returns empty string when the edge carries no visibility icon', () => {
    expect(renderEdgeVisibilityIcon(makeEdgeGeo(), theme)).toBe('');
  });

  it('draws the PRIVATE_METHOD square, unfilled, at the golden origin+2,+2', () => {
    // Golden: `<g data-visibility-modifier="PRIVATE_METHOD"><rect x="158.32"
    // y="160" width="6" height="6" fill="none" style="stroke:#C82930;...">`.
    const geo = makeEdgeGeo({ visibilityIcon: { x: 156.32, y: 158, modifier: 'PRIVATE_METHOD' } });
    const markup = renderEdgeVisibilityIcon(geo, theme);
    expect(markup).toContain('data-visibility-modifier="PRIVATE_METHOD"');
    expect(markup).toContain('<rect');
    expect(markup).toContain('x="158.32"');
    expect(markup).toContain('y="160"');
    expect(markup).toContain('width="6"');
    expect(markup).toContain('height="6"');
    expect(markup).toContain('fill="none"');
    expect(markup).toContain('#C82930');
  });

  it('draws the PROTECTED_METHOD diamond, unfilled', () => {
    // Golden: `<polygon points="101.32,158,105.32,162,101.32,166,97.32,162"
    // fill="none" style="stroke:#B38D22;...">` for icon origin 96.32,158.
    const geo = makeEdgeGeo({ visibilityIcon: { x: 96.32, y: 158, modifier: 'PROTECTED_METHOD' } });
    const markup = renderEdgeVisibilityIcon(geo, theme);
    expect(markup).toContain('data-visibility-modifier="PROTECTED_METHOD"');
    expect(markup).toContain('<polygon');
    expect(markup).toContain('fill="none"');
    expect(markup).toContain('#B38D22');
  });

  it('draws the PUBLIC_METHOD circle, unfilled', () => {
    // Golden: `<ellipse cx="230.99" cy="163" rx="3" ry="3" fill="none"
    // style="stroke:#038048;...">` for icon origin 225.99,158.
    const geo = makeEdgeGeo({ visibilityIcon: { x: 225.99, y: 158, modifier: 'PUBLIC_METHOD' } });
    const markup = renderEdgeVisibilityIcon(geo, theme);
    expect(markup).toContain('data-visibility-modifier="PUBLIC_METHOD"');
    expect(markup).toContain('<ellipse');
    expect(markup).toContain('cx="230.99"');
    expect(markup).toContain('cy="163"');
    expect(markup).toContain('fill="none"');
    expect(markup).toContain('#038048');
  });

  it('returns empty string for an unrecognised modifier name', () => {
    const geo = makeEdgeGeo({ visibilityIcon: { x: 0, y: 0, modifier: 'BOGUS' } });
    expect(renderEdgeVisibilityIcon(geo, theme)).toBe('');
  });
});

// A2a/M5 -- lipazi-06-care921's note-on-link structural presence.
describe('renderEdgeNoteBox', () => {
  it('returns empty string when the edge carries no note box', () => {
    expect(renderEdgeNoteBox(makeEdgeGeo(), theme)).toBe('');
  });

  it('emits the note body path, fold path and one <text> per line', () => {
    const geo = makeEdgeGeo({
      noteBox: {
        x: 10,
        y: 20,
        width: 100,
        height: 30,
        inkBox: { x: 15, y: 25, width: 90, height: 20 },
        noteLines: [
          { text: 'this is my note on left link', width: 123.581 },
          { text: 'blue', width: 24.619 },
        ],
      },
    });
    const markup = renderEdgeNoteBox(geo, theme);
    // Structural presence (AC: body path/polygon, corner path, text) --
    // byte-exact vertex order/paint is T8's (batch 3), not this task's.
    expect((markup.match(/<path/g) ?? []).length + (markup.match(/<polygon/g) ?? []).length).toBe(2);
    expect((markup.match(/<text/g) ?? []).length).toBe(2);
    expect(markup).toContain('this is my note on left link');
    expect(markup).toContain('blue');
  });
});

// A2a/M9 -- gujigi-63-roki030's four constrained links.
describe('renderEdgeConstraint', () => {
  const measurer = new WidthTableMeasurer();

  it('returns empty string when the edge carries no constraint', () => {
    expect(renderEdgeConstraint(makeEdgeGeo(), theme, measurer)).toBe('');
  });

  it('draws the dashed 3,3 line at the golden coordinates (lnk10)', () => {
    const geo = makeEdgeGeo({
      constraint: { line: { x1: 96.57, y1: 265.5, x2: 130, y2: 331 }, text: 'enten/eller' },
    });
    const markup = renderEdgeConstraint(geo, theme, measurer);
    expect(markup).toContain('x1="96.57"');
    expect(markup).toContain('y1="265.5"');
    expect(markup).toContain('x2="130"');
    expect(markup).toContain('y2="331"');
    expect(markup).toContain('stroke-dasharray');
    expect(markup).toContain('3,3');
  });

  it('centres a single-line constraint text on the line midpoint (lnk10)', () => {
    // Golden `<text x="82.938" y="301.861" fill="#000" font-size="13"
    // textLength="60.694">enten/eller</text>`.
    const geo = makeEdgeGeo({
      constraint: { line: { x1: 96.57, y1: 265.5, x2: 130, y2: 331 }, text: 'enten/eller' },
    });
    const markup = renderEdgeConstraint(geo, theme, measurer);
    expect(markup).toContain('x="82.938"');
    expect(markup).toContain('y="301.861"');
    expect(markup).toContain('textLength="60.694"');
    expect(markup).toContain('fill="#000"');
    expect(markup).toContain('>enten/eller<');
  });

  it('splits a `\\n`-carrying constraint text into two independently-centred lines (lnk12)', () => {
    // Golden `<text x="230.12" y="146.611" ... textLength="32.5">enten</text>
    // <text x="232.273" y="159.611" ... textLength="28.194">/eller</text>`.
    const geo = makeEdgeGeo({
      constraint: { line: { x1: 266.12, y1: 91, x2: 226.62, y2: 208 }, text: 'enten\\n/eller' },
    });
    const markup = renderEdgeConstraint(geo, theme, measurer);
    expect(markup).toContain('x="230.12"');
    expect(markup).toContain('y="146.611"');
    expect(markup).toContain('textLength="32.5"');
    expect(markup).toContain('>enten<');
    expect(markup).toContain('x="232.273"');
    expect(markup).toContain('y="159.611"');
    expect(markup).toContain('textLength="28.194"');
    expect(markup).toContain('>/eller<');
  });

  it('draws only the dashed line when no measurer is available', () => {
    const geo = makeEdgeGeo({
      constraint: { line: { x1: 0, y1: 0, x2: 10, y2: 10 }, text: 'x' },
    });
    const markup = renderEdgeConstraint(geo, theme, undefined);
    expect(markup).toContain('<line');
    expect(markup).not.toContain('<text');
  });
});

// cdd-T17 (M8) -- mugobo-34-fede498's four <text> labels (2 quantifiers +
// 2 additive roles). Golden: <text x="6" y="73.253" textLength="127.319">
// owner which is very long</text><text x="151.23" y="73.253">1</text>
// <text x="125.618" y="104.032" textLength="21.613">0..n</text>
// <text x="151.23" y="104.032" textLength="31.038">items</text>.
describe("renderEdgeCardinalityLabels — T17 (M8) role lines draw per-end, after that end's quantifier", () => {
  const CARDINALITY_COLOR = '#000';

  it('draws quantifierLines only when roleLines is absent — regression guard', () => {
    const geo = makeEdgeGeo({
      quantifierLines: [[{ text: '1', x: 1, y: 2, width: 3 }], [{ text: '0..n', x: 4, y: 5, width: 6 }]],
    });
    const parts = renderEdgeCardinalityLabels(geo, theme, CARDINALITY_COLOR);
    expect(parts).toHaveLength(2);
    expect(parts.join('')).toContain('>1<');
    expect(parts.join('')).toContain('>0..n<');
  });

  it('interleaves tail quantifier, tail role, head quantifier, head role — mugobo-34-fede498 golden order', () => {
    const geo = makeEdgeGeo({
      quantifierLines: [
        [{ text: 'owner which is very long', x: 6, y: 73.253, width: 127.319 }],
        [{ text: '0..n', x: 125.618, y: 104.032, width: 21.613 }],
      ],
      roleLines: [
        [{ text: '1', x: 151.23, y: 73.253, width: 7.231 }],
        [{ text: 'items', x: 151.23, y: 104.032, width: 31.038 }],
      ],
    });
    const parts = renderEdgeCardinalityLabels(geo, theme, CARDINALITY_COLOR);
    expect(parts).toHaveLength(4);
    const texts = parts.map((p) => /<text[^>]*>([^<]*)<\/text>/.exec(p)?.[1]);
    expect(texts).toEqual(['owner which is very long', '1', '0..n', 'items']);
    expect(parts[1]).toContain('x="151.23"');
    expect(parts[1]).toContain('y="73.253"');
    expect(parts[3]).toContain('x="151.23"');
    expect(parts[3]).toContain('y="104.032"');
  });

  it("an end with no additive role emits only that end's quantifier line", () => {
    const geo = makeEdgeGeo({
      quantifierLines: [
        [{ text: 'owner', x: 6, y: 73.253, width: 35.425 }],
        [{ text: '0..n', x: 21.816, y: 104.032, width: 21.613 }],
      ],
      roleLines: [[{ text: '1', x: 47.429, y: 73.253, width: 7.231 }], []],
    });
    const parts = renderEdgeCardinalityLabels(geo, theme, CARDINALITY_COLOR);
    expect(parts).toHaveLength(3);
  });
});
