import { describe, it, expect } from 'vitest';
import { noGradient } from '../../../src/core/paint.js';
import { renderActivity } from '../../../src/diagrams/activity/renderer.js';
import { assembleSvg } from '../../../src/index.js';
import type { ActivityGeometry, ActivityNodeGeo } from '../../../src/diagrams/activity/activity-geometry.types.js';
import { resolveTheme, deepMergeTheme, defaultTheme } from '../../../src/core/theme.js';
import { ACTIVITY_FONT_COLOR } from '../../../src/diagrams/activity/activity-text-style.js';

const theme = resolveTheme('default');

/** A theme carrying one `<style>`/`skinparam` bucket `FontColor` override --
 *  standing in for `<style> activityDiagram { arrow { FontColor ... } } */
function themeWithArrowFontColor(color: string): typeof theme {
  return {
    ...theme,
    colors: { ...theme.colors, elements: { ...theme.colors.elements, arrow: { font: color } } },
  };
}

// ---------------------------------------------------------------------------
// Geometry factory helpers
// ---------------------------------------------------------------------------

function makeNode(overrides: Partial<ActivityNodeGeo> & Pick<ActivityNodeGeo, 'kind'>): ActivityNodeGeo {
  return {
    id: 'node1',
    x: 50,
    y: 50,
    width: 20,
    height: 20,
    ...overrides,
  };
}

function makeGeo(overrides: Partial<ActivityGeometry> = {}): ActivityGeometry {
  return {
    totalWidth: 300,
    totalHeight: 200,
    nodes: [],
    edges: [],
    swimlanes: [],
    ...overrides,
  };
}

/**
 * Return SVG content after the closing </defs> tag.
 * svgRoot always emits a <defs> block with arrow markers; exclude those
 * from element counts to avoid false positives.
 */
function contentAfterDefs(svg: string): string {
  const idx = svg.indexOf('</defs>');
  return idx === -1 ? svg : svg.slice(idx + '</defs>'.length);
}

// ---------------------------------------------------------------------------
// Test 1: start node is a filled circle
// ---------------------------------------------------------------------------

describe('renderActivity — start node', () => {
  it('renders an ellipse filled AND stroked in the resolved circle ink', () => {
    // plantuml.skin:378-380 -- the same `#2` token for LineColor and
    // BackgroundColor, at LineThickness 1. This port previously drew the
    // start terminal with a `theme.colors.border` fill and NO stroke at
    // all, so the shape was a hair small as well as the wrong colour.
    const node = makeNode({ kind: 'start', id: 'start', x: 50, y: 50, width: 20, height: 20 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('<ellipse');
    expect(content).toContain('fill="#222"');
    expect(content).toContain('stroke="#222"');
    expect(content).toContain('stroke-width="1"');
  });

  it('circle is centered on the node bounding box', () => {
    const node = makeNode({ kind: 'start', id: 'start', x: 50, y: 50, width: 20, height: 20 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    // Center should be at x + width/2 = 60, y + height/2 = 60
    expect(result).toContain('cx="60"');
    expect(result).toContain('cy="60"');
  });
});

// ---------------------------------------------------------------------------
// Test 2: stop node is a bullseye (two circles)
// ---------------------------------------------------------------------------

describe('renderActivity — stop node', () => {
  it('renders two <ellipse> elements for a bullseye', () => {
    const node = makeNode({ kind: 'stop', id: 'stop-0', x: 50, y: 50, width: 28, height: 28 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const ellipseCount = (content.match(/<ellipse/g) ?? []).length;
    expect(ellipseCount).toBeGreaterThanOrEqual(2);
  });

  it('outer circle has fill="none" and inner is filled in the resolved circle ink', () => {
    const node = makeNode({ kind: 'stop', id: 'stop-0', x: 50, y: 50, width: 28, height: 28 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('fill="none"');
    expect(content).toContain('fill="#222"');
  });
});

// ---------------------------------------------------------------------------
// Test 3: action is a rounded rectangle
// ---------------------------------------------------------------------------

describe('renderActivity — action node', () => {
  it('renders a <rect> with rx attribute', () => {
    const node = makeNode({ kind: 'action', id: 'action-0', label: 'Do work', x: 50, y: 50, width: 120, height: 36 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    expect(result).toContain('<rect');
    expect(result).toContain('rx="');
  });

  it('renders the label text inside the action', () => {
    const node = makeNode({ kind: 'action', id: 'action-0', label: 'Do work', x: 50, y: 50, width: 120, height: 36 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    expect(result).toContain('Do work');
  });

  it('renders multiline label as one <text> per line, positioned by x (D2, not text-anchor)', () => {
    const node = makeNode({
      kind: 'action',
      id: 'action-0',
      label: 'A\non\nseveral\nlines',
      x: 50,
      y: 50,
      width: 80,
      height: 80,
    });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    // D2 (FtileBox.java:224-233): the jar emits NO text-anchor; every line
    // sits at `rect.x + padding` (LEFT, the only reachable tier today) --
    // node.x (50) + activityPadding('activity') (10) = 60.
    expect(result).not.toContain('text-anchor');
    expect(result).toContain('x="60"');
    expect(result).not.toContain('<tspan');
    expect((content.match(/<text /g) ?? []).length).toBe(4);
    expect(result).toContain('A');
    expect(result).toContain('several');
  });
});

// ---------------------------------------------------------------------------
// Test 4: fork/join bar is a thick filled rectangle
// ---------------------------------------------------------------------------

describe('renderActivity — fork-bar node', () => {
  it('renders a <rect> for the fork bar', () => {
    const node = makeNode({ kind: 'fork-bar', id: 'fork-bar-0', x: 50, y: 50, width: 200, height: 6 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('<rect');
  });

  // `activityBar { BackgroundColor #5 }` (plantuml.skin:387) -- `#555555`,
  // shortened by `svg-format.ts#shortenColor` to `#555` on emission, NOT
  // `theme.colors.border` (`#181818`, the jar's own outline colour;
  // apc-T3/D4). Was pinned to the wrong colour before this task.
  //
  // T3a (garuga-34-debe901): `FtileBlackBlock#drawU`'s `ug.apply(colorBar)
  // .apply(colorBar.bg()).draw(rect)` (`FtileBlackBlock.java:110`) strokes
  // AND fills in the SAME resolved colour -- stroke is never absent.
  it('fork bar fill is the resolved activityBar colour (#555), rounded, stroked in the same colour', () => {
    const node = makeNode({ kind: 'fork-bar', id: 'fork-bar-0', x: 50, y: 50, width: 200, height: 6 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    expect(result).toContain('fill="#555"');
    expect(result).toContain('rx="2.5"');
    expect(result).toContain('ry="2.5"');
    expect(result).toContain('stroke="#555"');
    expect(result).toContain('stroke-width="1"');
  });
});

// ---------------------------------------------------------------------------
// Test 4b: the split top/join line is a stroked <line>, not a <rect>
// ---------------------------------------------------------------------------

describe('renderActivity — split-bar / split-join-bar node', () => {
  it('renders a <line>, not a <rect>, for the split top line', () => {
    const node = makeNode({ kind: 'split-bar', id: 'split-bar-0', x: 50, y: 55, width: 200, height: 1.5 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('<line');
    expect(content).not.toContain('<rect');
  });

  it('the split line spans x..x+width at the SAME y (top of its band, not centred)', () => {
    const node = makeNode({ kind: 'split-bar', id: 'split-bar-0', x: 50, y: 55, width: 200, height: 1.5 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    expect(result).toContain('x1="50"');
    expect(result).toContain('y1="55"');
    expect(result).toContain('x2="250"');
    expect(result).toContain('y2="55"');
    expect(result).toContain('stroke-width="1.5"');
  });

  it('split-join-bar also renders a <line>, in the arrow colour', () => {
    const node = makeNode({ kind: 'split-join-bar', id: 'split-join-bar-0', x: 76.025, y: 127, width: 43.35 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('<line');
    expect(result).toContain(`stroke="${noGradient(theme.colors.arrow)}"`);
  });
});

// ---------------------------------------------------------------------------
// Test 5: swimlane chrome -- dividers, transparent band, floating titles
// (T6, `activity-swimlane-rendering`: replaces the old boxed-header model)
// ---------------------------------------------------------------------------

/** A two-lane geometry shaped like `assignCoordinates`'s own output
 *  (`contentX`/`contentWidth`/`titleWidth` populated, plus the derived
 *  `swimlaneBand`/`swimlaneDividerY`) -- renderer tests exercise the
 *  renderer given realistic layout output, not the layout engine itself. */
function makeSwimlaneGeo(): ActivityGeometry {
  return makeGeo({
    swimlanes: [
      { name: 'Alice', x: 20, width: 100, contentX: 26, contentWidth: 88, titleWidth: 30 },
      { name: 'Bob', x: 120, width: 150, contentX: 126, contentWidth: 138, titleWidth: 25 },
    ],
    swimlaneBand: { x: 20, y: 17.5, width: 249, height: 18 },
    swimlaneDividerY: { y1: 17.5, y2: 182.5 },
    totalWidth: 300,
    totalHeight: 200,
    nodes: [],
    edges: [],
  });
}

describe('renderActivity — swimlanes', () => {
  it('renders exactly three <line> dividers for two lanes', () => {
    const result = contentAfterDefs(assembleSvg(renderActivity(makeSwimlaneGeo(), theme)));
    expect((result.match(/<line /g) ?? []).length).toBe(3);
  });

  it('renders a fill="none" band rect (D3) by default', () => {
    const result = contentAfterDefs(assembleSvg(renderActivity(makeSwimlaneGeo(), theme)));
    expect(result).toContain('<rect');
    expect(result).toContain('fill="none"');
  });

  it('renders swimlane titles, not bold, without text-anchor', () => {
    const result = assembleSvg(renderActivity(makeSwimlaneGeo(), theme));
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
    expect(result).not.toContain('font-weight="bold"');
  });

  it('draws titles AFTER every divider and edge, in document order (D5)', () => {
    const geo = makeSwimlaneGeo();
    geo.edges = [
      {
        points: [
          { x: 60, y: 20 },
          { x: 60, y: 50 },
        ],
      },
    ];
    const result = contentAfterDefs(assembleSvg(renderActivity(geo, theme)));
    const lastDividerIdx = result.lastIndexOf('<line ');
    const edgeIdx = result.indexOf('<line ');
    const titleIdx = result.indexOf('Alice');
    expect(titleIdx).toBeGreaterThan(lastDividerIdx);
    expect(edgeIdx).toBeGreaterThan(-1);
  });

  it('a single lane draws no band, no dividers, and no titles', () => {
    const geo = makeGeo({
      swimlanes: [{ name: 'Solo', x: 12, width: 100, contentX: 12, contentWidth: 100, titleWidth: 20 }],
      nodes: [],
      edges: [],
    });
    const result = contentAfterDefs(assembleSvg(renderActivity(geo, theme)));
    expect(result).not.toContain('<line');
    expect(result).not.toContain('<rect');
    expect(result).not.toContain('Solo');
  });

  it('zero lanes renders byte-identical output to a diagram with an empty swimlanes array', () => {
    const withoutLanes = assembleSvg(renderActivity(makeGeo({ swimlanes: [], nodes: [], edges: [] }), theme));
    const explicit = assembleSvg(renderActivity(makeGeo({ nodes: [], edges: [] }), theme));
    expect(withoutLanes).toBe(explicit);
  });
});

// ---------------------------------------------------------------------------
// Test 6: diamond node (if-split) renders a polygon
// ---------------------------------------------------------------------------

describe('renderActivity — diamond node (if-split)', () => {
  it('renders a diamond (4-point polygon) when there is no label', () => {
    const node = makeNode({ kind: 'if-split', id: 'if-split-0', x: 50, y: 50, width: 20, height: 20 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('<polygon');
  });

  it('renders a hexagon (6-point polygon) with label text when label is provided', () => {
    // T3k: the own label is its own `'if-own-label'` node (a REAL walker
    // -- `walk-if-down.ts#pushDiamondOwnLabel` et al. -- always pushes one
    // alongside a labelled `'if-split'`); this test provides that sibling
    // directly rather than through a walker, same scope as the rest of
    // this file's node-level renderer tests.
    const node = makeNode({ kind: 'if-split', id: 'if-split-1', label: 'Ready?', x: 50, y: 50, width: 80, height: 40 });
    const ownLabel = makeNode({
      kind: 'if-own-label',
      id: 'if-own-label-1',
      label: 'Ready?',
      x: 50,
      y: 50,
      width: 80,
      height: 40,
    });
    const geo = makeGeo({ nodes: [node, ownLabel] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('Ready?');
    expect(content).toContain('<text');
    // Hexagon has 6 DISTINCT coordinate pairs, but `Hexagon.asPolygon(
    // shadowing, width, height)` (`Hexagon.java:65-74`) calls `addPoint`
    // SEVEN times, re-adding the first point `(hexagonHalfSize, 0)` as the
    // closing point after `(0, height/2)` (`Hexagon.java:68,74`) --
    // `UPolygon` does not close itself on draw, so the emitted `points`
    // carries 7 pairs (T2f mechanism 1, `daxare-39-buci637`). The attribute
    // is FLAT comma-separated, as the jar writes it (`svg-shapes.ts
    // #polygon`), so the pairs are counted from the number of values
    // rather than from spaces.
    const pointsMatch = content.match(/points="([^"]+)"/);
    const values = pointsMatch?.[1]?.trim().split(',').length ?? 0;
    expect(values / 2).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Test 7: note node renders a polygon body and label text
// ---------------------------------------------------------------------------

describe('renderActivity — note node', () => {
  it('renders a path element for the note body', () => {
    const node = makeNode({ kind: 'note', id: 'note-0', label: 'Important', x: 50, y: 50, width: 120, height: 40 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('<path');
  });

  it('renders the note label text', () => {
    const node = makeNode({ kind: 'note', id: 'note-0', label: 'Important', x: 50, y: 50, width: 120, height: 40 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    expect(result).toContain('Important');
  });

  it('renders multiline note content as one <text> per line (aeg-T3)', () => {
    const node = makeNode({
      kind: 'note',
      id: 'note-0',
      label: 'line one\nline two\nline three',
      x: 50,
      y: 50,
      width: 200,
      height: 80,
    });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(result).not.toContain('<tspan');
    expect((content.match(/<text /g) ?? []).length).toBe(3);
    expect(result).toContain('line one');
    expect(result).toContain('line two');
    expect(result).toContain('line three');
  });
});

// ---------------------------------------------------------------------------
// Test 8: action node with custom color uses the node color as fill
// ---------------------------------------------------------------------------

describe('renderActivity — action node with custom color', () => {
  it('uses the node color as fill for the action rect', () => {
    const node = makeNode({
      kind: 'action',
      id: 'action-colored',
      label: 'Step',
      color: '#ff0000',
      x: 50,
      y: 50,
      width: 120,
      height: 36,
    });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    // G1c: hex colors canonicalize to uppercase (HColorSet.java's %02X format).
    expect(result).toContain('fill="#F00"');
  });
});

// ---------------------------------------------------------------------------
// Test 9: end nodes render a crossed circle; kill/detach draw nothing (T2b)
// ---------------------------------------------------------------------------

describe('renderActivity — end nodes', () => {
  it('end renders a circle with an X (two diagonal lines)', () => {
    const node = makeNode({ kind: 'end', id: 'end-0', x: 50, y: 50, width: 28, height: 28 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const ellipseCount = (content.match(/<ellipse/g) ?? []).length;
    const lineCount = (content.match(/<line /g) ?? []).length;
    // end = single bordered circle with 2 crossing lines (the X)
    expect(ellipseCount).toBeGreaterThanOrEqual(1);
    expect(lineCount).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Test 10: join-bar renders a filled rect, same shape as fork-bar (D4:
// `split-bar`/`split-join-bar` are lines, covered above under Test 4b)
// ---------------------------------------------------------------------------

describe('renderActivity — join-bar', () => {
  it('join-bar renders a filled rect', () => {
    const node = makeNode({ kind: 'join-bar', id: 'join-bar-0', x: 50, y: 50, width: 200, height: 6 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('<rect');
  });
});

// ---------------------------------------------------------------------------
// Test 11: edge with label renders the label text
// ---------------------------------------------------------------------------

describe('renderActivity — edge with label', () => {
  it('renders the edge label text in the SVG', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 50 },
            { x: 100, y: 150 },
          ],
          label: 'yes',
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    expect(result).toContain('yes');
  });
});

// ---------------------------------------------------------------------------
// if-merge node renders the rhombus rendered.Hexagon.asPolygon(shadowing)
// (Hexagon.java:49-56, D2); if-label draws its text (D3).
// ---------------------------------------------------------------------------

describe('renderActivity — if-merge node', () => {
  it('renders one rhombus polygon at (x+12,y) (x+24,y+12) (x+12,y+24) (x,y+12), closed', () => {
    const node = makeNode({ kind: 'if-merge', x: 10, y: 20, width: 24, height: 24 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const pointsMatch = content.match(/points="([^"]+)"/);
    // `Hexagon.asPolygon(double)` (`Hexagon.java:48-55`) calls `addPoint`
    // FIVE times, re-adding `(12,0)` as the closing point after `(0,12)`
    // (`Hexagon.java:51,55`) -- `UPolygon` does not close itself on draw
    // (T2f mechanism 1, `daxare-39-buci637`).
    expect(pointsMatch?.[1]).toBe('22,20,34,32,22,44,10,32,22,20');
  });

  it('carries the diamond bucket line thickness (`activityLineThickness(theme, "diamond")`)', () => {
    // `FtileDiamond.java:89`'s `.apply(getStyle().getStroke())` -- the same
    // diamond-style stroke `renderHexagon` already resolves explicitly, not
    // silently defaulted. `ELEMENT_LINE_THICKNESS = 0.5`
    // (`activity-style-defaults.ts:207`) is the diamond bucket's default.
    const node = makeNode({ kind: 'if-merge', x: 10, y: 20, width: 24, height: 24 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('stroke-width="0.5"');
  });
});

describe('renderActivity — if-label node', () => {
  it('renders one left-aligned <text> at the arrow SName font size', () => {
    const node = makeNode({ kind: 'if-label', label: 'yes', x: 10, y: 20 });
    const geo = makeGeo({ nodes: [node] });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const textCount = (content.match(/<text/g) ?? []).length;
    expect(textCount).toBe(1);
    // Q5: baseline = node.y + ARROW_FONT_SIZE(11) * ASCENT_FRACTION(1-1/4.5),
    // left-aligned starting at node.x (ConditionalBuilder.java:280).
    const textMatch = content.match(/<text x="([^"]+)" y="([^"]+)"[^>]*>yes<\/text>/);
    expect(textMatch).not.toBeNull();
    expect(Number(textMatch![1])).toBe(10);
    expect(Number(textMatch![2])).toBeCloseTo(20 + 11 * (1 - 1 / 4.5), 2);
  });

  // T1b follow-up (D1): if-label now draws through `drawActivityText`, so
  // its 3-char "yes" label carries a real textLength (upstream's own
  // `text.length() > 1` guard) instead of core/svg.ts#text's unset one.
  it('carries a real textLength (D1 — routed through DriverTextSvg)', () => {
    const node = makeNode({ kind: 'if-label', label: 'yes', x: 10, y: 20 });
    const geo = makeGeo({ nodes: [node] });
    const content = contentAfterDefs(assembleSvg(renderActivity(geo, theme)));
    expect(content).toMatch(/<text[^>]*textLength="[\d.]+"[^>]*>yes<\/text>/);
  });
});

// ---------------------------------------------------------------------------
// Unknown node kind falls back to plain rect
// ---------------------------------------------------------------------------

describe('renderActivity — unknown node kind', () => {
  it('unknown node kind renders a fallback rect', () => {
    const node = makeNode({ kind: 'unknown-node-type' });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderActivity(geo, theme));
    // Fallback rect should be present
    expect(svg.trimStart()).toMatch(/^<svg/);
    expect(svg).toContain('<rect');
  });
});

// ---------------------------------------------------------------------------
// repeat-start node renders as diamond
// ---------------------------------------------------------------------------

describe('renderActivity — repeat-start node', () => {
  it('renders a <polygon> element (diamond), not a <rect>', () => {
    const node = makeNode({ kind: 'repeat-start', id: 'repeat-start-0', x: 50, y: 50, width: 40, height: 40 });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(svg);
    expect(content).toContain('<polygon');
  });

  it('does not render an action rounded <rect rx=...> for repeat-start', () => {
    const node = makeNode({ kind: 'repeat-start', id: 'repeat-start-0', x: 50, y: 50, width: 40, height: 40 });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(svg);
    // Background rect is present; ensure no action-style rounded rect (rx=) is rendered for the node
    expect(content).not.toContain('rx=');
  });
});

// ---------------------------------------------------------------------------
// Test 12: edge with color renders a filled <rect> pill behind the label
// ---------------------------------------------------------------------------

describe('renderActivity — edge with colored label pill', () => {
  it('AC5: renders a <rect> with the specified fill color', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 50 },
            { x: 100, y: 150 },
          ],
          label: 'no3',
          color: 'red',
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    // G1c: named colors resolve to their canonical jar hex.
    expect(result).toContain('fill="#F00"');
    expect(result).toContain('<rect');
  });

  it('AC5: renders the label text "no3" on top of the pill', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 50 },
            { x: 100, y: 150 },
          ],
          label: 'no3',
          color: 'red',
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    expect(result).toContain('no3');
  });

  it('AC5: the pill rect uses stroke="none"', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 50 },
            { x: 100, y: 150 },
          ],
          label: 'pill',
          color: '#00FF00',
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    // The pill rect should have stroke="none"
    expect(result).toContain('stroke="none"');
  });
});

// ---------------------------------------------------------------------------
// Test 13: edge with label but no color renders plain text only (no rect)
// ---------------------------------------------------------------------------

describe('renderActivity — edge with label but no color', () => {
  it('AC6: does not emit a pill <rect> when color is absent', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 50 },
            { x: 100, y: 150 },
          ],
          label: 'plain',
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    // The background rect from the SVG root is present; but no pill-specific rect
    // after defs. We check that stroke="none" is absent (only used for pills).
    expect(content).not.toContain('stroke="none"');
    expect(content).toContain('plain');
  });
});

// ---------------------------------------------------------------------------
// Test 14: `emphasize` draws an extra arrowhead at the FIRST matching
// segment's midpoint (Worm.java:138-139,178-183) -- not the longest segment.
// ---------------------------------------------------------------------------

describe('renderActivity — edge with emphasize', () => {
  it('renders two <polygon> arrowheads when emphasize matches a segment', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 200 },
            { x: 50, y: 200 },
            { x: 50, y: 50 },
            { x: 100, y: 50 },
          ],
          emphasize: 'up',
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    // One polygon for the terminal arrowhead, one for the emphasized segment
    const polygonCount = (content.match(/<polygon/g) ?? []).length;
    expect(polygonCount).toBe(2);
  });

  it('renders only one arrowhead when emphasize is absent', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 200 },
            { x: 50, y: 200 },
            { x: 50, y: 50 },
            { x: 100, y: 50 },
          ],
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const polygonCount = (content.match(/<polygon/g) ?? []).length;
    expect(polygonCount).toBe(1);
  });

  it('places the emphasized arrow on the FIRST matching segment, not the longest', () => {
    // (0,0)->(0,30) DOWN len 30; (0,30)->(50,30) RIGHT len 50;
    // (50,30)->(50,90) DOWN len 60 (longest). First DOWN segment is the
    // first one, midpoint (0,15) -- Worm.java:138-139's `drawn == false`
    // guard only ever fires the FIRST matching segment.
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 30 },
            { x: 50, y: 30 },
            { x: 50, y: 90 },
          ],
          emphasize: 'down',
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const polygons = content.match(/<polygon[^>]*points="([^"]*)"/g) ?? [];
    expect(polygons.length).toBe(2);
    // The emphasized arrow's tip point is (0, 15) -- `arrowHeadPoints('down')`
    // includes the tip at its own local (0,0), translated by the segment
    // midpoint.
    const hasMidpointTip = polygons.some((p) => p.includes('0,15'));
    expect(hasMidpointTip).toBe(true);
  });

  // T3a: `Worm#drawInternalOneColor`'s per-segment loop (`ftile/Worm.java:
  // 134-144`) draws the emphasize decoration BEFORE the matching segment's
  // OWN `ULine`, interleaved with the other plain segment lines -- never
  // before or after the whole run. The terminal (`endDecoration`) draw sits
  // BELOW that loop (`:164-171`), after every segment.
  it('draws the emphasis arrowhead before its own segment, terminal arrowhead last', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 30 },
            { x: 50, y: 30 },
            { x: 50, y: 90 },
          ],
          emphasize: 'down',
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const tags = [...content.matchAll(/<(line|polygon)/g)].map((m) => m[1]);
    // emphasize polygon, THEN its segment's line, THEN the other two
    // segment lines, THEN the terminal polygon -- never segments-then-both-
    // arrowheads.
    expect(tags).toEqual(['polygon', 'line', 'line', 'line', 'polygon']);
  });

  // b3/T3a (family B/ORD): `UGraphicCompressOnXorY#drawLine`
  // (`klimt/compress/UGraphicCompressOnXorY.java:142-146`) swaps a line's
  // own endpoints whenever `y1 > y2`, unconditionally, for every line the
  // activity engine draws -- not just the end-cross diagonal
  // `activity-renderer-terminals.ts#orderedLine` already ported.
  it('an upward segment (y1 > y2) is emitted with its endpoints swapped', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 10, y: 100 },
            { x: 10, y: 20 },
          ],
          arrowhead: false,
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const line = content.match(/<line[^>]*\/>/)![0];
    expect(line).toContain('y1="20"');
    expect(line).toContain('y2="100"');
  });

  it('a downward segment (y1 <= y2) is emitted unchanged', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 10, y: 20 },
            { x: 10, y: 100 },
          ],
          arrowhead: false,
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const line = content.match(/<line[^>]*\/>/)![0];
    expect(line).toContain('y1="20"');
    expect(line).toContain('y2="100"');
  });

  // b3/T3a (family C/EMMID): the emphasize arrow draws at `edge.emphasizeAt`
  // (the PRE-compression segment midpoint, `compress-geometry.ts
  // #withEmphasizeAnchor`'s own doc) when the geometry carries it, never a
  // midpoint recomputed from `points` at render time.
  it('places the emphasized arrow at emphasizeAt when present, not the segment midpoint', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 30 },
          ],
          emphasize: 'down',
          emphasizeAt: { x: 0, y: 12 },
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const polygons = content.match(/<polygon[^>]*points="([^"]*)"/g) ?? [];
    expect(polygons.length).toBe(2);
    // `arrowHeadPoints('down')`'s own tip is its local (0,0), translated by
    // `emphasizeAt` -- NOT the segment's own geometric midpoint (0, 15).
    expect(polygons.some((p) => p.includes('0,12'))).toBe(true);
    expect(polygons.some((p) => p.includes('0,15'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 15: `arrowhead: false` skips the end decoration entirely
// (D6 -- `cond/FtileIfWithLinks.java:96-101`'s `null` end decoration).
// ---------------------------------------------------------------------------

describe('renderActivity — edge with arrowhead: false', () => {
  it('renders the <line>s but no <polygon> tip', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 30 },
          ],
          arrowhead: false,
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    expect(content).toContain('<line');
    expect(content).not.toContain('<polygon');
  });
});

// ---------------------------------------------------------------------------
// Test 16: `midArrowAt` draws exactly one extra arrowhead at its own point
// (D4, mission `activity-loop-lane-translate` T1 --
// `FtileWhile.ConnectionBackSimple#drawTranslate`'s `asToUp` at
// `(xx, (y1 + y2) / 2)`, which `emphasize`'s segment search cannot place).
// ---------------------------------------------------------------------------

describe('renderActivity — edge with midArrowAt', () => {
  it('renders two <polygon> arrowheads when midArrowAt is present', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
          midArrowAt: { x: 50, y: 20, dir: 'up' },
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const polygonCount = (content.match(/<polygon/g) ?? []).length;
    expect(polygonCount).toBe(2);
  });

  it('renders only the terminal arrowhead when midArrowAt is absent -- byte-identical to before D4', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    const polygonCount = (content.match(/<polygon/g) ?? []).length;
    expect(polygonCount).toBe(1);
  });

  it('places the extra arrowhead tip AT midArrowAt.{x,y}, oriented by .dir', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
          midArrowAt: { x: 50, y: 20, dir: 'up' },
        },
      ],
    });
    const result = assembleSvg(renderActivity(geo, theme));
    const content = contentAfterDefs(result);
    // `arrowHeadPoints('up')` includes the tip at its own local (0, 0),
    // translated by (50, 20) -- same fixture convention as the emphasize
    // test above (`0,15` for a 'down' tip at (0, 15)).
    const polygons = content.match(/<polygon[^>]*points="([^"]*)"/g) ?? [];
    const hasTipAtPoint = polygons.some((p) => p.includes('50,20'));
    expect(hasTipAtPoint).toBe(true);
  });
});

describe('stereotype action shapes', () => {
  function renderStereotypeNode(stereotype: string): string {
    const geo: ActivityGeometry = {
      totalWidth: 200,
      totalHeight: 100,
      swimlanes: [],
      nodes: [makeNode({ kind: 'action', label: 'Test', width: 100, height: 32, stereotype })],
      edges: [],
    };
    return contentAfterDefs(assembleSvg(renderActivity(geo, theme)));
  }

  it('<<input>> renders a polygon (chevron-left shape)', () => {
    const svg = renderStereotypeNode('input');
    expect(svg).toContain('<polygon');
    expect(svg).not.toContain('rx=');
    expect(svg).toContain('Test');
  });

  it('<<output>> renders a polygon (chevron-right shape)', () => {
    const svg = renderStereotypeNode('output');
    expect(svg).toContain('<polygon');
    expect(svg).not.toContain('rx=');
    expect(svg).toContain('Test');
  });

  it('<<save>> renders a polygon (hexagon shape)', () => {
    const svg = renderStereotypeNode('save');
    expect(svg).toContain('<polygon');
    expect(svg).not.toContain('rx=');
    expect(svg).toContain('Test');
  });

  it('action without stereotype renders a rounded rect', () => {
    const svg = renderStereotypeNode('');
    expect(svg).toContain('rx=');
    expect(svg).not.toContain('<polygon');
  });

  it('unknown stereotype renders a rounded rect (plain action)', () => {
    const svg = renderStereotypeNode('unknown');
    expect(svg).toContain('rx=');
    expect(svg).not.toContain('<polygon');
  });
});

// ---------------------------------------------------------------------------
// renderActivity — activity-specific theme colors
// ---------------------------------------------------------------------------

describe('renderActivity — activity theme colors', () => {
  const activityTheme = deepMergeTheme(defaultTheme, {
    colors: {
      ...defaultTheme.colors,
      arrow: 'red',
      graph: {
        ...defaultTheme.colors.graph,
        activity: {
          background: 'cornsilk',
          border: 'navy',
          barColor: 'green',
          startColor: 'blue',
          endColor: 'yellow',
          diamondBackground: 'lavender',
          diamondBorder: 'purple',
        },
      },
    },
  });

  it('start node uses activityStartColor', () => {
    const geo = makeGeo({ nodes: [makeNode({ kind: 'start', width: 16, height: 16 })] });
    const svg = assembleSvg(renderActivity(geo, activityTheme));
    expect(svg).toContain('fill="#00F"');
  });

  it('end node uses activityEndColor; stop does NOT (separate skinparam targets)', () => {
    // `FromSkinparamToStyle.java:138-139`: `activityEndColor` ->
    // `SName.circle, SName.end`; `activityStopColor` -> `SName.circle,
    // SName.stop` (own, unwired skinparam). T2f mechanism 7.
    const endGeo = makeGeo({ nodes: [makeNode({ kind: 'end', width: 16, height: 16 })] });
    const endSvg = assembleSvg(renderActivity(endGeo, activityTheme));
    expect(endSvg).toContain('#FF0');

    const stopGeo = makeGeo({ nodes: [makeNode({ kind: 'stop', width: 16, height: 16 })] });
    const stopSvg = assembleSvg(renderActivity(stopGeo, activityTheme));
    expect(stopSvg).not.toContain('#FF0');
  });

  it('action node uses activityBackgroundColor', () => {
    const geo = makeGeo({ nodes: [makeNode({ kind: 'action', label: 'A' })] });
    const svg = assembleSvg(renderActivity(geo, activityTheme));
    // G1c: named colors resolve to their canonical jar hex.
    expect(svg).toContain('fill="#FFF8DC"');
  });

  it('action node uses activityBorderColor for stroke', () => {
    const geo = makeGeo({ nodes: [makeNode({ kind: 'action', label: 'A' })] });
    const svg = assembleSvg(renderActivity(geo, activityTheme));
    // G1c: named colors resolve to their canonical jar hex.
    expect(svg).toContain('stroke="#000080"');
  });

  it('fork-bar uses activityBarColor', () => {
    const geo = makeGeo({ nodes: [makeNode({ kind: 'fork-bar', width: 100, height: 4 })] });
    const svg = assembleSvg(renderActivity(geo, activityTheme));
    // G1c: named colors resolve to their canonical jar hex.
    expect(svg).toContain('fill="#008000"');
  });

  it('edges use arrow color (activityArrowColor)', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 10, y: 10 },
            { x: 10, y: 50 },
          ],
        },
      ],
    });
    const svg = assembleSvg(renderActivity(geo, activityTheme));
    expect(svg).toContain('stroke="#F00"');
  });

  it('diamond node uses activityDiamondBackground', () => {
    const geo = makeGeo({ nodes: [makeNode({ kind: 'if-split', label: '?' })] });
    const svg = assembleSvg(renderActivity(geo, activityTheme));
    expect(svg).toContain('fill="#E6E6FA"');
  });
});

// ---------------------------------------------------------------------------
// renderActivity — <code> block action
// ---------------------------------------------------------------------------

describe('renderActivity — <code> block action', () => {
  const codeLabel = '<code>\n"data": {\n    "item": "value"\n}\n</code>';

  it('renders a rounded <rect> box', () => {
    const geo = makeGeo({ nodes: [makeNode({ kind: 'action', label: codeLabel, width: 160, height: 80 })] });
    const svg = assembleSvg(renderActivity(geo, theme));
    expect(svg).toContain('rx=');
  });

  it('renders content in monospace font', () => {
    const geo = makeGeo({ nodes: [makeNode({ kind: 'action', label: codeLabel, width: 160, height: 80 })] });
    const svg = assembleSvg(renderActivity(geo, theme));
    expect(svg).toContain('font-family="monospace"');
  });

  it('does not emit <code> or </code> literal tags as visible text', () => {
    const geo = makeGeo({ nodes: [makeNode({ kind: 'action', label: codeLabel, width: 160, height: 80 })] });
    const svg = assembleSvg(renderActivity(geo, theme));
    expect(svg).not.toContain('&lt;code&gt;');
    expect(svg).not.toContain('&lt;/code&gt;');
  });

  it('does emit the JSON content', () => {
    const geo = makeGeo({ nodes: [makeNode({ kind: 'action', label: codeLabel, width: 160, height: 80 })] });
    const svg = assembleSvg(renderActivity(geo, theme));
    expect(svg).toContain('"data"');
    expect(svg).toContain('"item"');
  });

  it('runs code content through the same emittedTextForm as every other text() draw (aeg-T3)', () => {
    // T3 replaced the bespoke `multilineText`/`<tspan>` pipeline (raw
    // `escapeXmlText`, no trim, no NBSP) with per-line `text()` calls --
    // the SAME primitive every other single-line label in this codebase
    // already uses, which runs content through `emittedTextForm`
    // (`svg-text-font.ts`), a cited port of `DriverTextSvg#draw`. Two
    // effects on this monospace code block, both now consistent with
    // every other `text()` call site rather than special-cased:
    // (1) each line's leading/trailing whitespace is trimmed -- the 4
    //     leading spaces before `"item"` are gone;
    // (2) `nbspIfMonospace` turns every remaining space into NBSP (U+00A0)
    //     under a monospace/courier family (`SvgGraphics.java:720-728`),
    //     so the space between `:` and `"value"` is NBSP, not U+0020.
    // No cached activity fixture exercises a `<code>` block to jar-verify
    // this either way (grepped `test-results/dot-cache/activity/*/in.puml`
    // for `<code>`, none found) -- this pins the new, more CONSISTENT
    // behavior rather than asserting it is jar-correct.
    const geo = makeGeo({ nodes: [makeNode({ kind: 'action', label: codeLabel, width: 200, height: 100 })] });
    const svg = assembleSvg(renderActivity(geo, theme));
    expect(svg).toContain('"item":\u00a0"value"');
    expect(svg).not.toContain('    "item"');
  });
});

// ---------------------------------------------------------------------------
// activity-style-defaults T6 — edges and swimlane titles at their skin values
// ---------------------------------------------------------------------------

describe('T6 — edge stroke, arrow decoration, and swimlane title', () => {
  const edge = {
    id: 'e0',
    from: 'a',
    to: 'b',
    points: [
      { x: 10, y: 10 },
      { x: 10, y: 60 },
    ],
  };

  it('an edge line draws stroke-width 1, not the port s old 1.5', () => {
    // `activityDiagram { arrow { LineThickness 1 } }` (plantuml.skin:374).
    // `Worm#drawInternalOneColor` takes the LINE's stroke from
    // `style.getStroke()` (ftile/Worm.java:129).
    const content = contentAfterDefs(assembleSvg(renderActivity(makeGeo({ edges: [edge] }), theme)));
    expect(content).toMatch(/<line[^>]*stroke-width="1"/);
    expect(content).not.toMatch(/<line[^>]*stroke-width="1\.5"/);
  });

  it('the arrow DECORATION strokes at 1.0 — the 1.5 in Worm.java never reaches output', () => {
    // ftile/Worm.java:154 and :161 apply `UStroke.withThickness(1.5)` to
    // `ug`, but each decoration is then drawn through
    // `.apply(UStroke.simple())` (:159, :166), and `UStroke.simple()` is
    // `new UStroke(0, 0, 1.0)` (klimt/UStroke.java:75-77). So the 1.5 is
    // overridden before the draw and is dead upstream. The decoration is
    // also FILLED and STROKED in the same colour: `arrowHeadColor` is
    // applied to both foreground and background (Worm.java:152-153).
    const content = contentAfterDefs(assembleSvg(renderActivity(makeGeo({ edges: [edge] }), theme)));
    expect(content).toMatch(/<polygon[^>]*stroke-width="1"/);
    expect(content).not.toMatch(/<polygon[^>]*stroke-width="1\.5"/);
    expect(content).toMatch(/<polygon[^>]*stroke="/);
  });

  it('an edge LABEL draws font-size 11 — the activity-scoped arrow block beats the root 13', () => {
    // `activityDiagram { arrow { FontSize 11 } }` (plantuml.skin:373) is
    // more specific than the root `arrow { FontSize 13 }` (:317), and an
    // activity edge resolves `of(root, element, activityDiagram, arrow)`
    // (decoration/HtmlColorAndStyle.java:83).
    const labelled = { ...edge, label: 'yes' };
    const content = contentAfterDefs(assembleSvg(renderActivity(makeGeo({ edges: [labelled] }), theme)));
    expect(content).toContain('font-size="11"');
    expect(content).not.toContain('font-size="13"');
  });

  it('a swimlane title draws font-size 18 — the ROOT swimlane { FontSize 18 } block', () => {
    // plantuml.skin:313, resolved by ftile/Swimlanes.java:127. T6 replaced
    // the boxed-header visual model; requires 2+ lanes to draw any chrome
    // at all (`Swimlanes.java:275`'s own `size() > 1` guard).
    const geo = makeGeo({
      swimlanes: [
        { name: 'Lane A', x: 20, width: 100, contentX: 26, contentWidth: 88, titleWidth: 30 },
        { name: 'Lane B', x: 120, width: 100, contentX: 126, contentWidth: 88, titleWidth: 30 },
      ],
      swimlaneBand: { x: 20, y: 17.5, width: 199, height: 18 },
      swimlaneDividerY: { y1: 17.5, y2: 182.5 },
    });
    const content = contentAfterDefs(assembleSvg(renderActivity(geo, theme)));
    expect(content).toContain('font-size="18"');
    expect(content).toContain('Lane A');
  });
});

// ---------------------------------------------------------------------------
// akc-T1 — the terminal and mid-segment arrowheads draw ArrowsRegular's
// 4-point, 10-long, ±4 polygon (ArrowsRegular.java:41-86), translated to
// the tip, replacing the port's old 3-point, 8-long, ±3.2 triangle.
// ---------------------------------------------------------------------------

describe('renderActivity — arrowhead is ArrowsRegular (akc-T1)', () => {
  it('a downward edge draws asToDown translated to the tip (10,60)', () => {
    // Segment (10,10) -> (10,60): dx=0, dy=50 -> down (Direction.java:118-120).
    // asToDown relative to the tip: (-4,-10),(0,0),(4,-10),(0,-6)
    // (ArrowsRegular.java:56-64); translated by the tip (10,60):
    // (6,50),(10,60),(14,50),(10,54).
    const edge = {
      points: [
        { x: 10, y: 10 },
        { x: 10, y: 60 },
      ],
    };
    const content = contentAfterDefs(assembleSvg(renderActivity(makeGeo({ edges: [edge] }), theme)));
    const pointsMatch = content.match(/<polygon[^>]*points="([^"]+)"/);
    expect(pointsMatch?.[1]).toBe('6,50,10,60,14,50,10,54');
  });

  it('a rightward edge draws asToRight translated to the tip (100,10)', () => {
    // Segment (10,10) -> (100,10): dx=90, dy=0 -> right (Direction.java:123-125).
    // asToRight relative to the tip: (-10,-4),(0,0),(-10,4),(-6,0)
    // (ArrowsRegular.java:66-74); translated by the tip (100,10):
    // (90,6),(100,10),(90,14),(94,10).
    const edge = {
      points: [
        { x: 10, y: 10 },
        { x: 100, y: 10 },
      ],
    };
    const content = contentAfterDefs(assembleSvg(renderActivity(makeGeo({ edges: [edge] }), theme)));
    const pointsMatch = content.match(/<polygon[^>]*points="([^"]+)"/);
    expect(pointsMatch?.[1]).toBe('90,6,100,10,90,14,94,10');
  });

  it("four points, not the old triangle's three", () => {
    const edge = {
      points: [
        { x: 10, y: 10 },
        { x: 10, y: 60 },
      ],
    };
    const content = contentAfterDefs(assembleSvg(renderActivity(makeGeo({ edges: [edge] }), theme)));
    const pointsMatch = content.match(/<polygon[^>]*points="([^"]+)"/);
    const coordCount = pointsMatch?.[1]?.split(',').length ?? 0;
    expect(coordCount).toBe(8); // 4 points x (x, y)
  });
});

// ---------------------------------------------------------------------------
// T1b (decisions.md#D4) — `skinparam style strictuml` selects `ArrowsTriangle`
// (SkinParam.java:1306-1309): a 3-point polygon, byte-identical in every
// OTHER regard (fill/stroke/stroke-width) to the ArrowsRegular draw above.
// ---------------------------------------------------------------------------

describe('renderActivity — ArrowsTriangle under skinparam style strictuml (D4)', () => {
  const edge = {
    points: [
      { x: 10, y: 10 },
      { x: 10, y: 60 },
    ],
  };

  it('a downward edge draws the 3-point asToDown triangle translated to the tip (10,60)', () => {
    // asToDown relative to the tip: (-4,-10),(4,-10),(0,0) (ArrowsTriangle
    // .java:57-61); translated by the tip (10,60): (6,50),(14,50),(10,60).
    const strictTheme = { ...theme, strictUml: true };
    const content = contentAfterDefs(assembleSvg(renderActivity(makeGeo({ edges: [edge] }), strictTheme)));
    const pointsMatch = content.match(/<polygon[^>]*points="([^"]+)"/);
    expect(pointsMatch?.[1]).toBe('6,50,14,50,10,60');
  });

  it("three points, not ArrowsRegular's four, under strictuml", () => {
    const strictTheme = { ...theme, strictUml: true };
    const content = contentAfterDefs(assembleSvg(renderActivity(makeGeo({ edges: [edge] }), strictTheme)));
    const pointsMatch = content.match(/<polygon[^>]*points="([^"]+)"/);
    const coordCount = pointsMatch?.[1]?.split(',').length ?? 0;
    expect(coordCount).toBe(6); // 3 points x (x, y)
  });

  it('a non-strictuml fixture keeps the byte-identical ArrowsRegular 4-point draw', () => {
    const content = contentAfterDefs(assembleSvg(renderActivity(makeGeo({ edges: [edge] }), theme)));
    const pointsMatch = content.match(/<polygon[^>]*points="([^"]+)"/);
    expect(pointsMatch?.[1]).toBe('6,50,10,60,14,50,10,54');
  });
});

// ---------------------------------------------------------------------------
// amb-T4 — edge labels resolve `activityFontColor(theme, 'arrow')` (D3),
// never `theme.colors.text`. `ftile/vcompact/FtileFactoryDelegator.java:84`
// resolves an activity edge label through `of(root, element,
// activityDiagram, arrow)`, the same signature `activityFontSize(theme,
// 'arrow')` already uses for its size.
// ---------------------------------------------------------------------------

describe('renderActivity — edge label colour (D3)', () => {
  it('ACTIVITY_FONT_COLOR resolves black -- resolvePaint shortens it to #000 on emission', () => {
    expect(ACTIVITY_FONT_COLOR).toBe('#000000');
  });

  it('an uncoloured edge label draws the root black, not theme.colors.text', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 50 },
            { x: 100, y: 150 },
          ],
          label: 'yes',
        },
      ],
    });
    const content = contentAfterDefs(assembleSvg(renderActivity(geo, theme)));
    expect(content).toContain('fill="#000"');
  });

  it('a colored-pill edge label text draws the root black, not theme.colors.text', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 50 },
            { x: 100, y: 150 },
          ],
          label: 'no3',
          color: 'red',
        },
      ],
    });
    const content = contentAfterDefs(assembleSvg(renderActivity(geo, theme)));
    expect(content).toContain('fill="#000"');
  });

  it('`<style> activityDiagram { arrow { FontColor blue } }` colours the edge label', () => {
    const arrowBlue = themeWithArrowFontColor('blue');
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 100, y: 50 },
            { x: 100, y: 150 },
          ],
          label: 'yes',
        },
      ],
    });
    const content = contentAfterDefs(assembleSvg(renderActivity(geo, arrowBlue)));
    expect(content).toContain('fill="#00F"');
  });
});

// ---------------------------------------------------------------------------
// T2c: `skinparam ArrowHeadColor` -- `FromSkinparamToStyle.java:153`
// (`PName.HeadColor` on `SName.arrow`), applied by `Worm
// #drawInternalOneColor` to the decoration only, AFTER the line segments
// drew in the LINE's own colour (`activitydiagram3/ftile/Worm.java:
// 126-127,146-154`). Pins farexi-86-xanu521/zanudo-86-seco241/
// fofele-65-lozo631/naroji-40-nuke022 (jar-verified exact match).
// ---------------------------------------------------------------------------

describe('renderActivity — edge with ArrowHeadColor', () => {
  function themeWithArrowHeadColor(color: string): typeof theme {
    return { ...theme, colors: { ...theme.colors, arrowHead: color } };
  }

  it('absent: the arrowhead polygon draws in the LINE colour (theme.colors.arrow)', () => {
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 30 },
          ],
        },
      ],
    });
    const content = contentAfterDefs(assembleSvg(renderActivity(geo, theme)));
    const polygon = /<polygon[^>]*>/.exec(content)?.[0];
    expect(polygon).toContain(`fill="${noGradient(theme.colors.arrow)}"`);
    expect(polygon).toContain(`stroke="${noGradient(theme.colors.arrow)}"`);
  });

  it('set: the arrowhead polygon draws in ArrowHeadColor, the LINE stays theme.colors.arrow', () => {
    const red = themeWithArrowHeadColor('#F00');
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 30 },
          ],
        },
      ],
    });
    const content = contentAfterDefs(assembleSvg(renderActivity(geo, red)));
    const line = /<line[^>]*>/.exec(content)?.[0];
    const polygon = /<polygon[^>]*>/.exec(content)?.[0];
    expect(line).toContain(`stroke="${noGradient(theme.colors.arrow)}"`);
    expect(polygon).toContain('fill="#F00"');
    expect(polygon).toContain('stroke="#F00"');
  });

  it('`ArrowHeadColor none` draws fill="none" stroke="none" with no stroke-width (SvgGraphics.java:630-637 rule 4)', () => {
    const none = themeWithArrowHeadColor('none');
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 30 },
          ],
        },
      ],
    });
    const content = contentAfterDefs(assembleSvg(renderActivity(geo, none)));
    const polygon = /<polygon[^>]*>/.exec(content)?.[0];
    expect(polygon).toContain('fill="none"');
    expect(polygon).toContain('stroke="none"');
    expect(polygon).not.toContain('stroke-width');
  });

  it('a midArrowAt decoration also draws in ArrowHeadColor, not the line colour', () => {
    const red = themeWithArrowHeadColor('#F00');
    const geo = makeGeo({
      edges: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
          midArrowAt: { x: 50, y: 20, dir: 'up' },
        },
      ],
    });
    const content = contentAfterDefs(assembleSvg(renderActivity(geo, red)));
    const polygons = content.match(/<polygon[^>]*>/g) ?? [];
    expect(polygons).toHaveLength(2);
    expect(polygons.every((p) => p.includes('fill="#F00"'))).toBe(true);
  });
});
