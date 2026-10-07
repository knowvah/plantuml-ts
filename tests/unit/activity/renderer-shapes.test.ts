/**
 * Direct unit tests for `src/diagrams/activity/activity-renderer-shapes.ts`
 * (aeg-T2). No test previously imported this module by name -- coverage was
 * only indirect, through `renderer.test.ts`'s full `renderActivity` pipeline
 * and the conformance corpus. This file calls `renderStart`/`renderStop`/
 * `renderEnd` directly.
 *
 * T2 replaced their `circle()` calls with `ellipse(cx, cy, r, r, ...)` --
 * upstream's start/end/kill nodes are all `<ellipse>` (`DriverEllipseSvg`),
 * never `<circle>` (`plans/activity-element-granularity/decisions.md` D2).
 */
import { noGradient } from '../../../src/core/paint.js';
import { describe, it, expect } from 'vitest';
import {
  renderAction,
  renderChevronLeft,
  renderChevronRight,
  renderDiamond,
  renderEnd,
  renderHexagon,
  renderLabel,
  renderNode,
  renderNote,
  renderParallelogram,
  renderSpot,
  renderStart,
  renderStop,
} from '../../../src/diagrams/activity/activity-renderer-shapes.js';
import { renderBar, renderSplitLine } from '../../../src/diagrams/activity/activity-renderer-bars.js';
import { GtileAction } from '../../../src/diagrams/activity/tiles/gtile-action.js';
import { GtileDiamond } from '../../../src/diagrams/activity/tiles/gtile-diamond.js';
import { GtileNote } from '../../../src/diagrams/activity/tiles/gtile-note.js';
import type { StringBounder as TileStringBounder } from '../../../src/diagrams/activity/tiles/tile.js';
import type { ActivityNodeGeo } from '../../../src/diagrams/activity/activity-geometry.types.js';
import { resolveTheme, deepMergeTheme, defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import { ACTIVITY_FONT_COLOR } from '../../../src/diagrams/activity/activity-text-style.js';
import { measureLineWidth, centeredLineX } from '../../../src/diagrams/activity/activity-text-placement.js';

const theme = resolveTheme('default');

function makeNode(overrides: Partial<ActivityNodeGeo> & Pick<ActivityNodeGeo, 'kind'>): ActivityNodeGeo {
  return { id: 'node1', x: 50, y: 50, width: 20, height: 20, ...overrides };
}

/** A theme carrying one `<style>`/`skinparam` bucket `FontColor` override
 *  (amb-T1's cascade front-end, tested end-to-end elsewhere) -- standing in
 *  for `<style> activityDiagram { <sname> { FontColor ... } } </style>`. */
function themeWithFontColor(sname: string, color: string): Theme {
  return {
    ...theme,
    colors: { ...theme.colors, elements: { ...theme.colors.elements, [sname]: { font: color } } },
  };
}

describe('renderStart', () => {
  it('emits exactly one <ellipse> with rx === ry, never a <circle>', () => {
    const node = makeNode({ kind: 'start', width: 20, height: 20 });
    const svg = renderStart(node, theme);
    expect(svg).not.toContain('<circle');
    expect((svg.match(/<ellipse/g) ?? []).length).toBe(1);
    expect(svg).toContain('rx="10"');
    expect(svg).toContain('ry="10"');
  });

  it('centers on the node bounding box, radius half the height', () => {
    const node = makeNode({ kind: 'start', x: 50, y: 50, width: 20, height: 20 });
    const svg = renderStart(node, theme);
    expect(svg).toContain('cx="60"');
    expect(svg).toContain('cy="60"');
    expect(svg).toContain('rx="10"');
  });

  it("resolves a named theme color to hex, matching circle()'s old pipeline", () => {
    // The gap T2 had to close explicitly: ellipse()'s own `extraAttrs`
    // only shortens an ALREADY-hex string; it does not resolve a raw CSS
    // name like "blue". `renderStart` pre-resolves via `resolvePaint` so
    // this stays byte-identical to what `circle()` produced.
    const activityTheme = deepMergeTheme(defaultTheme, {
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          activity: { startColor: 'blue' },
        },
      },
    });
    const svg = renderStart(makeNode({ kind: 'start' }), activityTheme);
    expect(svg).toContain('fill="#00F"');
  });

  // T2d-a (row DARK-CIRCLE): the stroke follows `circleInk` (dark-seeded),
  // never the fixed light-mode `CIRCLE_INK` constant -- jar-verified
  // against `levuma-67-cego489`'s own dark-mode SVG (`stroke="#DDD"`).
  it('strokes in `theme.colors.graph.activity.circleInk` when set, not the fixed light default', () => {
    const activityTheme = deepMergeTheme(defaultTheme, {
      colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, activity: { circleInk: '#DDDDDD' } } },
    });
    const svg = renderStart(makeNode({ kind: 'start' }), activityTheme);
    expect(svg).toContain('stroke="#DDD"');
    expect(svg).not.toContain('stroke="#222"');
  });
});

describe('renderStop', () => {
  // `FtileCircleStop#drawU` (`:87-89`) delegates to `CircleEnd`
  // (`svek/image/CircleEnd.java:55,72-103`): tile SIZE=22 (`gtile-stop.ts`),
  // outer r=11, inner delta=5 so inner r=6 (T1c, D3) -- not the old
  // unsourced `outerR * 0.55`.
  it('emits exactly two <ellipse> elements (bullseye), never a <circle>', () => {
    const node = makeNode({ kind: 'stop', width: 22, height: 22 });
    const svg = renderStop(node, theme);
    expect(svg).not.toContain('<circle');
    expect((svg.match(/<ellipse/g) ?? []).length).toBe(2);
  });

  it('outer ellipse is unfilled and stroked in the resolved circle ink; inner is filled AND stroked the same', () => {
    // `activityDiagram { circle { start, stop, end { LineColor #2;
    // BackgroundColor #2; LineThickness 1 } } }` (plantuml.skin:378-380).
    // Was `theme.colors.border` (#181818) at stroke-width 2, neither of
    // which came from upstream. `#2` resolves through HColorSet to
    // #222222, which the SVG layer shortens to #222 -- the exact spelling
    // the jar emits (SvgGraphics#shortenColor).
    //
    // The inner ellipse ALSO carries this stroke -- jar-verified against
    // `bareka-88-fusu160`/`numalo-91-pole243`'s own oracle SVGs, both of
    // which show `stroke:#222;stroke-width:1` on BOTH ellipses, not fill
    // alone on the inner one (`CircleEnd.java:102`'s own chain reads as
    // bare, but the rendered bytes settle it).
    const node = makeNode({ kind: 'stop', width: 22, height: 22 });
    const svg = renderStop(node, theme);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('fill="#222"');
    expect((svg.match(/stroke="#222"/g) ?? []).length).toBe(2);
    expect((svg.match(/stroke-width="1"/g) ?? []).length).toBe(2);
    expect(svg).not.toContain('stroke-width="2"');
  });

  it('outer radius is 11, inner is 6 (outer - delta 5), both cx/cy centered on the node', () => {
    const node = makeNode({ kind: 'stop', x: 50, y: 50, width: 22, height: 22 });
    const svg = renderStop(node, theme);
    expect(svg).toContain('cx="61"');
    expect(svg).toContain('cy="61"');
    expect(svg).toContain('rx="11"');
    expect(svg).toContain('rx="6"');
    expect(svg).not.toContain('rx="14"');
    expect(svg).not.toContain('rx="7.7"');
  });

  it('does NOT inherit `ActivityEndColor` -- `activityStopColor` is a separate skinparam target', () => {
    // `FromSkinparamToStyle.java:138-139`: `activityEndColor` converts to
    // `PName.LineColor` on `SName.circle, SName.end`; `activityStopColor`
    // converts to the SAME `PName` but on `SName.circle, SName.stop` --
    // two independent style targets. Reusing `actColors(theme).endFill`
    // here made `stop` wrongly red under `skinparam ActivityEndColor red`
    // with no `ActivityStopColor` set (T2f mechanism 7, jar-verified on
    // `poraji-17-goke817`: `stop` stays `#222`).
    const activityTheme = deepMergeTheme(defaultTheme, {
      colors: {
        ...defaultTheme.colors,
        graph: { ...defaultTheme.colors.graph, activity: { endColor: 'yellow' } },
      },
    });
    const svg = renderStop(makeNode({ kind: 'stop' }), activityTheme);
    expect(svg).not.toContain('#FF0');
    expect((svg.match(/stroke="#222"/g) ?? []).length).toBe(2);
    expect(svg).toContain('fill="#222"');
  });

  // T2d-a (row DARK-CIRCLE): both ellipses' fill+stroke follow `circleInk`
  // (dark-seeded), never the fixed light-mode `CIRCLE_INK` constant --
  // jar-verified against `levuma-67-cego489`'s own dark-mode SVG (both
  // ellipses `fill`/`stroke` `#DDD`).
  it('both ellipses follow `theme.colors.graph.activity.circleInk` when set', () => {
    const activityTheme = deepMergeTheme(defaultTheme, {
      colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, activity: { circleInk: '#DDDDDD' } } },
    });
    const svg = renderStop(makeNode({ kind: 'stop', width: 22, height: 22 }), activityTheme);
    expect((svg.match(/stroke="#DDD"/g) ?? []).length).toBe(2);
    expect(svg).toContain('fill="#DDD"');
    expect(svg).not.toContain('#222');
  });
});

describe('renderEnd', () => {
  // `FtileCircleEndCross#drawU` (`:98-117`) draws itself: SIZE=20 (`:61`),
  // outer r=10; cross `thickness=2.5` (hardcoded, `:110`),
  // `size2=(SIZE-thickness)/sqrt(2)`, `delta=(SIZE-size2)/2` (`:111-112`) --
  // not the old unsourced `r * SQRT1_2` tip-to-border construction.
  it('emits one <ellipse> border plus two crossing <line>s, never a <circle>', () => {
    const node = makeNode({ kind: 'end', width: 20, height: 20 });
    const svg = renderEnd(node, theme);
    expect(svg).not.toContain('<circle');
    expect((svg.match(/<ellipse/g) ?? []).length).toBe(1);
    expect((svg.match(/<line /g) ?? []).length).toBe(2);
  });

  it('ellipse is unfilled with the border stroke, rx === ry', () => {
    const node = makeNode({ kind: 'end', width: 20, height: 20 });
    const svg = renderEnd(node, theme);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('rx="10"');
    expect(svg).toContain('ry="10"');
    expect(svg).toContain('stroke-width="1.5"');
  });

  it('the cross is inset by delta=3.813 from the bounding box, size2=12.374 per side', () => {
    // size=20, thickness=2.5: size2=(20-2.5)/sqrt(2)=12.374368...,
    // delta=(20-size2)/2=3.812815... -- jar-cited formula, not fitted.
    const node = makeNode({ kind: 'end', x: 50, y: 50, width: 20, height: 20 });
    const svg = renderEnd(node, theme);
    const lines = [...svg.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g)];
    expect(lines).toHaveLength(2);
    const [l1, l2] = lines as [RegExpMatchArray, RegExpMatchArray];
    expect(Number(l1[1])).toBeCloseTo(53.813, 3);
    expect(Number(l1[2])).toBeCloseTo(53.813, 3);
    expect(Number(l1[3])).toBeCloseTo(66.187, 3);
    expect(Number(l1[4])).toBeCloseTo(66.187, 3);
    // The second diagonal's `dy` is negative (`-size2`): the jar's own
    // compress pass (`UGraphicCompressOnXorY#drawLine`,
    // `klimt/compress/UGraphicCompressOnXorY.java:142-148`) swaps a
    // line's endpoints whenever `y1 > y2` before drawing, so the emitted
    // `x1`/`y1` is the point with the SMALLER y, not the translate
    // origin (T2f mechanism 2, verified byte-exact against
    // `fabexi-81-dife869`'s jar SVG).
    expect(Number(l2[1])).toBeCloseTo(66.187, 3);
    expect(Number(l2[2])).toBeCloseTo(53.813, 3);
    expect(Number(l2[3])).toBeCloseTo(53.813, 3);
    expect(Number(l2[4])).toBeCloseTo(66.187, 3);
  });

  it('cross stroke-width is 2.5, independent of the ellipse stroke-width 1.5', () => {
    const svg = renderEnd(makeNode({ kind: 'end', width: 20, height: 20 }), theme);
    expect(svg).toContain('stroke-width="2.5"');
    expect(svg).toContain('stroke-width="1.5"');
  });
});

describe('renderSpot (mission add2-T2g)', () => {
  // `FtileCircleSpot.java:60,84-109`: a fixed 20x20 circle, border/fill
  // from the PLAIN root ink (no `circle,spot` skinparam convert exists --
  // `activity-renderer-terminals.ts#renderSpot`'s own doc), stroke-width
  // the ELEMENT tier (0.5), never `circle,start/stop/end`'s own 1.
  it('emits a 20x20 ellipse at the plain root ink, stroke-width 0.5', () => {
    const node = makeNode({ kind: 'spot', x: 50, y: 50, width: 20, height: 20, label: 'A' });
    const svg = renderSpot(node, theme);
    expect(svg).toContain('rx="10"');
    expect(svg).toContain('ry="10"');
    expect(svg).toContain('cx="60"');
    expect(svg).toContain('cy="60"');
    expect(svg).toContain(`fill="${theme.colors.nodeBackground}"`);
    expect(svg).toContain(`stroke="${theme.colors.border}"`);
    expect(svg).toContain('stroke-width="0.5"');
  });

  it('an inline `color` overrides ONLY the fill, never the border', () => {
    const node = makeNode({ kind: 'spot', width: 20, height: 20, label: 'B', color: '#00F' });
    const svg = renderSpot(node, theme);
    expect(svg).toContain('fill="#00F"');
    expect(svg).toContain(`stroke="${theme.colors.border}"`);
  });

  // T3g: a captured letter (A/B/G) now draws the jar's own AWT glyph
  // OUTLINE as a `<path>`, not a `<text>` substitute -- see
  // `activity-spot-glyph-data.ts`'s doc comment for the scraped-fixture
  // citation and `activity-spot-glyph.ts#spotGlyphPath` for the translate.
  it('draws the circled character as a jar-scraped <path>, never <text>', () => {
    const node = makeNode({ kind: 'spot', x: 50, y: 50, width: 20, height: 20, label: 'A' });
    const svg = renderSpot(node, theme);
    expect(svg).not.toContain('<text');
    expect(svg).toContain(
      'd="M61.432,60.631 L59.709,56.27 L57.98,60.631 Z M62.95,64.5 L61.849,61.697 L57.563,61.697 ' +
        'L56.449,64.5 L55.116,64.5 L59.128,54.383 L60.55,54.383 L64.501,64.5 Z"',
    );
    // `#000000` shortens to `#000` at emission (`shortenColor`) -- byte-
    // identical to every scraped fixture's own glyph `fill` attribute.
    expect(ACTIVITY_FONT_COLOR).toBe('#000000');
    expect(svg).toContain('fill="#000"');
  });

  it('resolves the letter case-insensitively (lowercase parses to the same captured glyph)', () => {
    const upper = renderSpot(makeNode({ kind: 'spot', x: 50, y: 50, width: 20, height: 20, label: 'A' }), theme);
    const lower = renderSpot(makeNode({ kind: 'spot', x: 50, y: 50, width: 20, height: 20, label: 'a' }), theme);
    expect(lower).toBe(upper);
  });

  // An UNCAPTURED letter falls back to upstream's own deterministic-text
  // branch geometry (`DriverCenteredCharacterSvg.java:64-69`) rather than
  // drawing nothing -- `activity-spot-glyph.ts`'s own doc comment.
  it("falls back to upstream's deterministic <text> geometry for an uncaptured letter", () => {
    const node = makeNode({ kind: 'spot', x: 50, y: 50, width: 20, height: 20, label: 'Z' });
    const svg = renderSpot(node, theme);
    expect(svg).not.toContain('<path');
    expect(svg).toContain('<text x="55" y="65" font-family="monospace" font-size="14"');
    expect(svg).toContain('>Z</text>');
  });

  it('draws no glyph element at all when the character is empty', () => {
    const node = makeNode({ kind: 'spot', width: 20, height: 20, label: '' });
    const svg = renderSpot(node, theme);
    expect(svg).not.toContain('<text');
    expect(svg).not.toContain('<path');
  });
});

// ---------------------------------------------------------------------------
// activity-style-defaults T5 — the shapes draw at their RESOLVED style
// values, and at the SAME values the sizer measured them at.
// ---------------------------------------------------------------------------

describe('T5 — resolved font, corner radius and circle ink', () => {
  /** Records every size the SIZER asks for, so the renderer's emitted
   *  `font-size` can be compared against it directly rather than by eye —
   *  which is what T5's acceptance criterion requires. Height is returned
   *  as the size itself, matching the cited 1x advance. */
  function recordingBounder(): { bounder: TileStringBounder; sizes: number[] } {
    const sizes: number[] = [];
    return {
      sizes,
      bounder: {
        getDimension: (text: string, size: number) => {
          sizes.push(size);
          return { width: text.length * 10, height: size };
        },
      },
    };
  }

  it('an action box draws font-size 12 and rx = ry = 12.5', () => {
    // plantuml.skin:361 (FontSize 12) and :362 (RoundCorner 25, halved onto
    // BOTH axes per D4). The port previously emitted font-size 14, rx="8"
    // and no ry at all.
    const svg = renderAction(makeNode({ kind: 'action', label: 'hello', width: 120, height: 32 }), theme);
    expect(svg).toContain('font-size="12"');
    expect(svg).toContain('rx="12.5"');
    expect(svg).toContain('ry="12.5"');
    expect(svg).not.toContain('rx="8"');
  });

  it('a diamond label draws font-size 11, not the old `theme.fontSize - 2`', () => {
    const svg = renderDiamond(makeNode({ kind: 'diamond', label: 'yes', width: 40, height: 40 }), theme);
    expect(svg).toContain('font-size="11"');
    expect(svg).not.toContain(`font-size="${theme.fontSize - 2}"`);
  });

  it('closes the rhombus (5-point polygon, first point repeated) with stroke-width 0.5 and the shared miter join (FtileDiamond.java:89, Hexagon.java:48-55)', () => {
    // `Hexagon.asPolygon(shadowing)` -- `FtileDiamond#drawU`'s shape for the
    // repeat-entry node AND the label-less `if-split`/`while-header`
    // diamond -- `addPoint`s the first corner again as the LAST point
    // (`Hexagon.java:51,55`); `UPolygon` does not close itself on draw, and
    // the shared `polygon()` emitter adds `stroke-linejoin:miter;
    // stroke-miterlimit:10` unconditionally, matching every other closed
    // activity polygon (`SvgGraphics.java:658`).
    const svg = renderDiamond(makeNode({ kind: 'diamond', width: 24, height: 24 }), theme);
    const points = /<polygon points="([^"]+)"/.exec(svg)?.[1]?.split(',') ?? [];
    expect(points.length).toBe(10); // 5 points x,y pairs
    expect([points[0], points[1]]).toEqual([points[8], points[9]]);
    expect(svg).toContain('stroke-width="0.5"');
    expect(svg).toContain('stroke-linejoin="miter"');
    expect(svg).toContain('stroke-miterlimit="10"');
  });

  it('add4-T2d: a north-labelled EMPTY_DIAMOND box draws the rhombus at its bottom, below suppY1', () => {
    // `FtileDiamond#drawU` translates by `dy(suppY1)` before drawing the
    // 24x24 `Hexagon.asPolygon` (`FtileDiamond.java:87-89`); the box is
    // `(24, 24 + suppY1)` (`:108-110`). suppY1 = 11 here (one 11 pt line).
    const svg = renderDiamond(makeNode({ kind: 'if-split', x: 156, y: 159, width: 24, height: 35 }), theme);
    const points = /<polygon points="([^"]+)"/.exec(svg)?.[1];
    expect(points).toBe('168,170,180,182,168,194,156,182,168,170');
  });

  it('a note draws font-size 13 and stroke-width 0.5', () => {
    // The ROOT note block, plantuml.skin:323 and :325.
    const svg = renderNote(makeNode({ kind: 'note', label: 'n', width: 60, height: 40 }), theme);
    expect(svg).toContain('font-size="13"');
    expect(svg).toContain('stroke-width="0.5"');
  });

  it('an `end` terminal strokes at 1.5 while `stop` strokes at 1', () => {
    // The `start, stop, end` block sets LineThickness 1 (:378); `end`
    // ALONE overrides it to 1.5 (:383), and upstream gives the two
    // distinct StyleSignatures (VCompactFactory.java:97 vs :101).
    const end = renderEnd(makeNode({ kind: 'end', width: 20, height: 20 }), theme);
    expect(end).toContain('stroke-width="1.5"');
    const stop = renderStop(makeNode({ kind: 'stop', width: 22, height: 22 }), theme);
    expect(stop).toContain('stroke-width="1"');
    expect(stop).not.toContain('stroke-width="1.5"');
  });

  it('the RENDERER draws at exactly the size the SIZER measured — asserted, not eyeballed', () => {
    // T5's acceptance criterion. This is the mission's second defect (D6's
    // class: "a feature reaches the renderer and the sizer keeps measuring
    // something else"), so the agreement is pinned rather than assumed.
    const cases = [
      { label: 'hello', Tile: GtileAction, node: { kind: 'action' as const }, render: renderAction },
      { label: 'yes', Tile: GtileDiamond, node: { kind: 'diamond' as const }, render: renderDiamond },
    ];
    for (const c of cases) {
      const { bounder, sizes } = recordingBounder();
      if (c.Tile === GtileAction) new GtileAction({ kind: 'action', label: c.label }, bounder, theme);
      else new GtileDiamond(c.label, bounder, theme);
      const measured = sizes[0];
      expect(measured, 'the sizer must request exactly one size per label').toBeDefined();
      const svg = c.render(makeNode({ ...c.node, label: c.label, width: 120, height: 40 }), theme);
      expect(svg, `renderer must draw ${c.label} at the size the sizer measured`).toContain(
        `font-size="${String(measured)}"`,
      );
    }
  });

  it('a note draws at the size GtileNote measured it at', () => {
    const { bounder, sizes } = recordingBounder();
    new GtileNote({ kind: 'note', text: 'n', position: 'right' }, bounder, theme);
    const svg = renderNote(makeNode({ kind: 'note', label: 'n', width: 60, height: 40 }), theme);
    expect(svg).toContain(`font-size="${String(sizes[0])}"`);
  });
});

// ---------------------------------------------------------------------------
// amb-T3 — the `element` line-thickness tier (D4): the action box and the
// diamond/hexagon-family shapes stroke at 0.5, not the port's old literal 1.
// ---------------------------------------------------------------------------

describe('T3 — element-tier stroke width (D4)', () => {
  it('an action box strokes at 0.5, not the old literal 1 (FtileBox.java:208, plantuml.skin:93)', () => {
    const svg = renderAction(makeNode({ kind: 'action', label: 'go', width: 120, height: 32 }), theme);
    expect(svg).toContain('stroke-width="0.5"');
    expect(svg).not.toContain('stroke-width="1"');
  });

  it('a labelled hexagon condition strokes at 0.5 (FtileDiamondInside.java:88, diamond SName)', () => {
    const svg = renderHexagon(makeNode({ kind: 'diamond', label: 'yes\nno', width: 60, height: 40 }), theme);
    expect(svg).toContain('stroke-width="0.5"');
    expect(svg).not.toContain('stroke-width="1"');
  });

  it('the SDL chevrons stroke at 0.5, resolving `activity` like the plain box (FtileBox.java:97-99)', () => {
    const node = makeNode({ kind: 'action', label: 'go', width: 60, height: 30 });
    expect(renderChevronLeft(node, theme)).toContain('stroke-width="0.5"');
    expect(renderChevronRight(node, theme)).toContain('stroke-width="0.5"');
  });

  it('a parallelogram (SDL_SAVE) strokes at 0.5, resolving `activity` like the plain box', () => {
    const svg = renderParallelogram(makeNode({ kind: 'action', label: 'go', width: 60, height: 30 }), theme);
    expect(svg).toContain('stroke-width="0.5"');
    expect(svg).not.toContain('stroke-width="1"');
  });
});

// ---------------------------------------------------------------------------
// amb-T4 — every activity text resolves `activityFontColor` (D3), never
// `theme.colors.text` (#181818). Root `FontColor black` (plantuml.skin:9).
// ---------------------------------------------------------------------------

describe('T4 — text colour cascade (D3)', () => {
  it('ACTIVITY_FONT_COLOR resolves black -- resolvePaint shortens it to #000 on emission', () => {
    expect(ACTIVITY_FONT_COLOR).toBe('#000000');
  });

  // `renderLabel` (single-line path) resolves its own colour locally rather
  // than delegating to `core/latex.ts#renderNodeLabel` (which hardcodes
  // `theme.colors.text`) -- only a `<latex>` label still delegates there.

  it('a single-line action label draws the root black, not theme.colors.text', () => {
    const svg = renderAction(makeNode({ kind: 'action', label: 'go', width: 120, height: 32 }), theme);
    expect(svg).toContain('fill="#000"');
  });

  it('a single-line diamond-family label (renderLabel path) draws the root black', () => {
    const svg = renderHexagon(makeNode({ kind: 'diamond', label: 'yes', width: 60, height: 40 }), theme);
    expect(svg).toContain('fill="#000"');
  });

  it('`<style> activityDiagram { activity { FontColor red } }` colours a single-line action and the diamond label', () => {
    const activityRed = themeWithFontColor('activity', 'red');
    const actionSvg = renderAction(makeNode({ kind: 'action', label: 'go', width: 120, height: 32 }), activityRed);
    expect(actionSvg).toContain('fill="#F00"');
    // add4-T2d: `activityDiamond()` nests `SName.activity`
    // (`StyleSignatureBasic.java:271-273`), so the activity rule reaches the
    // diamond label -- jar-verified, tests/fixtures/activity/add4-T2d/
    // style-activity-fontcolor ("cond?" is #F00).
    const hexSvg = renderHexagon(makeNode({ kind: 'diamond', label: 'yes', width: 60, height: 40 }), activityRed);
    expect(hexSvg).toContain('fill="#F00"');
    expect(hexSvg).not.toContain('fill="#000"');
  });

  it('a <latex> label still delegates to renderNodeLabel (permanent divergence)', () => {
    const svg = renderLabel('<latex>x^2</latex>', 60, 60, theme, { sname: 'activity' });
    expect(svg).not.toContain('fill="#000"');
  });

  it('a multi-line action label draws the resolved colour (#000, shortened), not theme.colors.text', () => {
    const svg = renderAction(makeNode({ kind: 'action', label: 'l1\nl2', width: 120, height: 40 }), theme);
    expect((svg.match(/fill="#000"/g) ?? []).length).toBe(2);
  });

  it('a <code> block action label draws the resolved colour', () => {
    const node = makeNode({ kind: 'action', label: '<code>\nx\n</code>', width: 160, height: 60 });
    const svg = renderAction(node, theme);
    expect(svg).toContain('fill="#000"');
  });

  it('a diamond label draws the root black (FtileDiamondInside label)', () => {
    const svg = renderDiamond(makeNode({ kind: 'diamond', label: 'yes', width: 40, height: 40 }), theme);
    expect(svg).toContain('fill="#000"');
  });

  it('a note label (single-line, FtileWithNoteOpale.java:89) draws the root black', () => {
    const svg = renderNote(makeNode({ kind: 'note', label: 'n', width: 60, height: 40 }), theme);
    expect(svg).toContain('fill="#000"');
  });

  it('a multi-line note label draws the resolved colour on every line', () => {
    const svg = renderNote(makeNode({ kind: 'note', label: 'a\nb', width: 60, height: 40 }), theme);
    expect((svg.match(/fill="#000"/g) ?? []).length).toBe(2);
  });

  it('`<style> activityDiagram { activity { FontColor red } }` colours a multi-line action and the diamond', () => {
    const activityRed = themeWithFontColor('activity', 'red');
    const actionSvg = renderAction(makeNode({ kind: 'action', label: 'l1\nl2', width: 120, height: 40 }), activityRed);
    expect(actionSvg).toContain('fill="#F00"');
    // add4-T2d: `activityDiamond()` nests `SName.activity`
    // (`StyleSignatureBasic.java:271-273`), so the activity rule reaches the
    // diamond label -- jar-verified, tests/fixtures/activity/add4-T2d/
    // style-activity-fontcolor ("cond?" is #F00).
    const diamondSvg = renderDiamond(makeNode({ kind: 'diamond', label: 'yes', width: 40, height: 40 }), activityRed);
    expect(diamondSvg).toContain('fill="#F00"');
    expect(diamondSvg).not.toContain('fill="#000"');
  });

  it('a labelled hexagon (diamond SName, gtile-diamond.ts sizing) resolves the diamond bucket', () => {
    const diamondBlue = themeWithFontColor('diamond', 'blue');
    const svg = renderHexagon(makeNode({ kind: 'diamond', label: 'yes\nno', width: 60, height: 40 }), diamondBlue);
    expect(svg).toContain('fill="#00F"');
  });

  it('a parallelogram (activity SName, FtileBox.java:97-99) resolves the activity bucket, not diamond', () => {
    const diamondBlue = themeWithFontColor('diamond', 'blue');
    const svg = renderParallelogram(makeNode({ kind: 'action', label: 'l1\nl2', width: 80, height: 40 }), diamondBlue);
    expect(svg).toContain('fill="#000"');
    expect(svg).not.toContain('fill="#00F"');
  });

  it('an SDL chevron label (activity SName) resolves the activity bucket on both lines', () => {
    const activityGreen = themeWithFontColor('activity', 'green');
    const single = renderChevronLeft(makeNode({ kind: 'action', label: 'go', width: 60, height: 30 }), activityGreen);
    expect(single).toContain('fill="#008000"');
    const multi = renderChevronRight(
      makeNode({ kind: 'action', label: 'l1\nl2', width: 60, height: 30 }),
      activityGreen,
    );
    expect(multi).toContain('fill="#008000"');
  });
});

// ---------------------------------------------------------------------------
// T2f — `AtomTable` grid lines for an all-table-rows action label
// (`AtomTable.java:150-158`). Jar-verified against `niletu-83-lego826`/
// `activity-creole-table` (`:|Creole Table Line1|\n|Line2|;`, box
// x=16 y=16 width=114.875 height=48): 3 horizontal rules (row boundaries
// at y=28/40/52) + 2 vertical rules (x=26/120.875) bounding the single
// column.
// ---------------------------------------------------------------------------

describe('renderAction — AtomTable grid (T2f)', () => {
  it('draws 3 horizontal + 2 vertical grid lines for a 2-row, 1-column table', () => {
    const node = makeNode({
      kind: 'action',
      label: '|Creole Table Line1|\n|Line2|',
      x: 16,
      y: 16,
      width: 114.875,
      height: 48,
    });
    const svg = renderAction(node, theme);
    expect(svg).toContain('x1="26" y1="28" x2="120.875" y2="28"');
    expect(svg).toContain('x1="26" y1="40" x2="120.875" y2="40"');
    expect(svg).toContain('x1="26" y1="52" x2="120.875" y2="52"');
    expect(svg).toContain('x1="26" y1="28" x2="26" y2="52"');
    expect(svg).toContain('x1="120.875" y1="28" x2="120.875" y2="52"');
    expect((svg.match(/<line/g) ?? []).length).toBe(5);
    expect(svg).toContain('>Creole Table Line1<');
    expect(svg).toContain('>Line2<');
    expect(svg).not.toContain('|');
  });

  it('draws no grid lines for a plain (non-table) multi-line label', () => {
    const svg = renderAction(makeNode({ kind: 'action', label: 'l1\nl2', width: 120, height: 40 }), theme);
    expect(svg).not.toContain('<line');
  });

  it('draws no grid lines when only SOME physical lines are table rows', () => {
    const svg = renderAction(makeNode({ kind: 'action', label: '|a|\nplain', width: 120, height: 40 }), theme);
    expect(svg).not.toContain('<line');
  });
});

// ---------------------------------------------------------------------------
// amb-T5 — every activity text is positioned by `x` (D2), never
// `text-anchor`. `FtileBox.java:224-233` (LEFT at `padding.left`, the only
// reachable root tier today); `FtileDiamondInside.java:94-96` /
// `GtileHexagonInside.java:117` (geometric centring, diamond/hexagon).
// ---------------------------------------------------------------------------

describe('amb-T5 — text positioned by x, not text-anchor (D2)', () => {
  it('a single-line action label sits at rect.x + padding (LEFT, plantuml.skin:360)', () => {
    const svg = renderAction(makeNode({ kind: 'action', label: 'go', x: 50, width: 120, height: 32 }), theme);
    expect(svg).not.toContain('text-anchor');
    expect(svg).toContain('x="60"');
  });

  it('a multi-line action label positions EVERY line at rect.x + padding', () => {
    const svg = renderAction(makeNode({ kind: 'action', label: 'l1\nl2', x: 50, width: 120, height: 40 }), theme);
    expect(svg).not.toContain('text-anchor');
    expect((svg.match(/x="60"/g) ?? []).length).toBe(2);
  });

  it('a diamond label centres on its OWN measured width (FtileDiamondInside.java:94-96)', () => {
    const node = makeNode({ kind: 'diamond', label: 'yes', x: 40, width: 40, height: 40 });
    const svg = renderDiamond(node, theme);
    const cx = node.x + node.width / 2;
    const fontSize = 11; // plantuml.skin:370
    const expectedX = centeredLineX(cx, measureLineWidth(theme, fontSize, 'yes'));
    const actualX = Number(/<text x="([\d.]+)"/.exec(svg)?.[1]);
    expect(svg).not.toContain('text-anchor');
    expect(actualX).toBeCloseTo(expectedX, 2);
  });

  it('a labelled hexagon condition left-aligns every line to ONE shared block x, no text-anchor (IFNL, T3d)', () => {
    // root's default HorizontalAlignment left (plantuml.skin:12, diamond {}
    // never overrides it) positions every Sheet stripe at the label
    // TextBlock's own local x=0; the whole block is centred ONCE
    // (FtileDiamondInside.java:94-96), not each line on its own width --
    // verified against vaxiki-78-nice114's jar SVG (all 3 lines share one x).
    const svg = renderHexagon(makeNode({ kind: 'diamond', label: 'yes\nno', width: 60, height: 40 }), theme);
    expect(svg).not.toContain('text-anchor');
    const xs = [...svg.matchAll(/<text x="([\d.]+)"/g)].map((m) => m[1]);
    expect(xs).toHaveLength(2);
    expect(xs[0]).toBe(xs[1]);
  });

  it('SDL chevron labels (single and multi-line) carry no text-anchor', () => {
    const single = renderChevronLeft(makeNode({ kind: 'action', label: 'go', width: 60, height: 30 }), theme);
    const multi = renderChevronRight(makeNode({ kind: 'action', label: 'l1\nl2', width: 60, height: 30 }), theme);
    expect(single).not.toContain('text-anchor');
    expect(multi).not.toContain('text-anchor');
  });

  it('a note label carries no text-anchor and sits at x + 6 (Opale.java:56, marginX1)', () => {
    const single = renderNote(makeNode({ kind: 'note', label: 'n', x: 50, width: 60, height: 40 }), theme);
    const multi = renderNote(makeNode({ kind: 'note', label: 'a\nb', x: 50, width: 60, height: 40 }), theme);
    expect(single).not.toContain('text-anchor');
    expect(multi).not.toContain('text-anchor');
    expect(single).toContain('x="56"');
    expect((multi.match(/x="56"/g) ?? []).length).toBe(2);
  });

  it('renderLabel throws for an "activity" sname with no width (broken caller contract)', () => {
    expect(() => renderLabel('go', 60, 60, theme, { sname: 'activity' } as never)).toThrow(/width is required/);
  });
});

// ---------------------------------------------------------------------------
// T2f mechanism 3 -- note body path order, fold, and first-line baseline
// (Opale.java). `Opale#getPolygonNormal` (`:149-157`, no link, roundCorner
// 0): top-left -> bottom-left -> bottom-right -> right-edge-below-fold ->
// fold-top -> close -- the OPPOSITE traversal of the old `noteBox()`-backed
// emission. The fold is Opale#getCorner (`:134-147`), drawn as its OWN
// filled `<path>` unconditionally -- never unfilled border lines.
// ---------------------------------------------------------------------------

describe('renderNote -- body path order and baseline (Opale.java)', () => {
  it('standalone (no link): body path visits TL, BL, BR, right-below-fold, fold-top, close', () => {
    const node = makeNode({ kind: 'note', label: 'n', x: 15, y: 15, width: 70, height: 23 });
    const svg = renderNote(node, theme);
    const bodyD = svg.match(/<path d="([^"]+)"/)?.[1];
    // NOTE_CORNER_SIZE = 10 (Opale.java:53), not the old NOTE_FOLD = 8.
    expect(bodyD).toBe('M15,15 L15,38 L85,38 L85,25 L75,15 L15,15');
  });

  it('standalone: fold is a second filled <path>, not unfilled <line>s', () => {
    const node = makeNode({ kind: 'note', label: 'n', x: 15, y: 15, width: 70, height: 23 });
    const svg = renderNote(node, theme);
    expect((svg.match(/<path /g) ?? []).length).toBe(2);
    expect(svg).not.toContain('<line');
    const foldD = [...svg.matchAll(/<path d="([^"]+)"/g)][1]?.[1];
    expect(foldD).toBe('M75,15 L75,25 L85,25 L75,15');
  });

  it('standalone: first-line baseline is y + marginY(5) + fontSize * ASCENT_FRACTION(7/9)', () => {
    // Jar-verified on volefo-41-tolo996: y=15, fontSize=13 -> 30.111, not
    // the old unsourced `y + NOTE_FOLD(8) + fontSize` (= 36).
    const node = makeNode({ kind: 'note', label: 'n', x: 15, y: 15, width: 70, height: 23 });
    const svg = renderNote(node, theme);
    const textY = svg.match(/<text[^>]*\by="([\d.]+)"/)?.[1];
    expect(Number(textY)).toBeCloseTo(30.111, 2);
  });

  it('spike right (notePosition "left"): zero-radius arcs follow the two corner lineTos', () => {
    // Opale#getPolygonRight (`:198-219`): y1's floor is `cornersize`.
    // Jar-verified byte-exact against cubida-55-meku256.
    const node = makeNode({
      kind: 'note',
      label: 'n',
      x: 15,
      y: 59.5,
      width: 83.156,
      height: 23,
      notePosition: 'left',
      spikeTip: { x: 118.156, y: 71 },
    });
    const svg = renderNote(node, theme);
    const bodyD = svg.match(/<path d="([^"]+)"/)?.[1];
    expect(bodyD).toBe(
      'M15,59.5 L15,82.5 A0,0 0 0 0 15,82.5 L98.156,82.5 A0,0 0 0 0 98.156,82.5 ' +
        'L98.156,77.5 L118.156,71 L98.156,69.5 L98.156,69.5 L88.156,59.5 L15,59.5 A0,0 0 0 0 15,59.5',
    );
  });

  it('spike left (notePosition "right"): y1 floor is 0, not cornersize', () => {
    // Opale#getPolygonLeft (`:175-196`) -- mirror of getPolygonRight, with
    // the spike and the fold on OPPOSITE edges so y1's floor stays 0.
    // spike.y=64.5 -> relY=5, y1=relY-delta(4)=1 (unclamped, within [0,15]).
    const node = makeNode({
      kind: 'note',
      label: 'n',
      x: 15,
      y: 59.5,
      width: 83.156,
      height: 23,
      notePosition: 'right',
      spikeTip: { x: -20, y: 64.5 },
    });
    const svg = renderNote(node, theme);
    const bodyD = svg.match(/<path d="([^"]+)"/)?.[1];
    expect(bodyD).toBe(
      'M15,59.5 L15,60.5 L-20,64.5 L15,68.5 ' +
        'L15,82.5 A0,0 0 0 0 15,82.5 L98.156,82.5 A0,0 0 0 0 98.156,82.5 ' +
        'L98.156,69.5 L88.156,59.5 L15,59.5 A0,0 0 0 0 15,59.5',
    );
  });
});

// ---------------------------------------------------------------------------
// T1b (decisions.md#D1/#D4) — every activity `<text>` goes through the
// klimt `DriverTextSvg`: `textLength` is real, and the single-line baseline
// is `rect.y + padding + fontSize * ASCENT_FRACTION`, jar-verified on
// `rarodo-65-fudu505` (`rect.y=55`, `fontSize=12`: `text.y=74.333`, i.e.
// `rect.y + 19.333`) -- NOT the old `cy + fontSize/3` (would give +20).
// ---------------------------------------------------------------------------

describe('T1b — klimt text driver (D1)', () => {
  it('a single-line action label carries textLength and sits at rect.y + 19.333 (rarodo-65-fudu505)', () => {
    // Height 32 = fontSize(12) + 2*padding(10), matching `textNodeHeight`'s
    // own formula -- the SAME box shape `rarodo` sizes its action at.
    const node = makeNode({ kind: 'action', label: 'first', x: 16, y: 55, width: 39.275, height: 32 });
    const svg = renderAction(node, theme);
    expect(svg).toMatch(/<text[^>]*textLength="[\d.]+"[^>]*>first<\/text>/);
    const y = Number(/<text[^>]*\sy="([\d.]+)"/.exec(svg)?.[1]);
    expect(y - node.y).toBeCloseTo(19.333, 2);
  });

  it('a single-char label carries no textLength (upstream text.length() > 1 guard)', () => {
    const svg = renderAction(makeNode({ kind: 'action', label: 'a', x: 0, y: 0, width: 30, height: 32 }), theme);
    expect(svg).not.toContain('textLength');
  });

  it('a diamond label carries no dominant-baseline, baseline from centeredFirstBaselineY', () => {
    const node = makeNode({ kind: 'diamond', label: 'yes', x: 40, y: 40, width: 40, height: 40 });
    const svg = renderDiamond(node, theme);
    expect(svg).not.toContain('dominant-baseline');
    const cy = node.y + node.height / 2;
    const y = Number(/<text[^>]*\sy="([\d.]+)"/.exec(svg)?.[1]);
    const fontSize = 11; // plantuml.skin:370
    expect(y).toBeCloseTo(cy + fontSize * (7 / 9 - 0.5), 2);
  });

  it('a hexagon condition label carries textLength and no dominant-baseline', () => {
    const node = makeNode({ kind: 'diamond', label: 'test', x: 0, y: 0, width: 48, height: 24 });
    const svg = renderHexagon(node, theme);
    expect(svg).not.toContain('dominant-baseline');
    expect(svg).toMatch(/<text[^>]*textLength="[\d.]+"[^>]*>test<\/text>/);
  });

  // Follow-up push-forward: activity-renderer-signal-shapes.ts's chevron/
  // parallelogram single-line labels carried the SAME `dominant-baseline:
  // 'central'` / `cy + boxSize/3` approximations as the action/diamond
  // boxes above -- fixed identically (same file, same mechanism, D1/D9).
  it('a chevron (<<input>>) label carries textLength and no dominant-baseline', () => {
    const node = makeNode({ kind: 'action', label: 'go now', stereotype: 'input', x: 0, y: 0, width: 80, height: 32 });
    const svg = renderChevronLeft(node, theme);
    expect(svg).not.toContain('dominant-baseline');
    expect(svg).toMatch(/<text[^>]*textLength="[\d.]+"[^>]*>go now<\/text>/);
    const cy = node.y + node.height / 2;
    const y = Number(/<text[^>]*\sy="([\d.]+)"/.exec(svg)?.[1]);
    const size = 12; // activityFontSize(theme, 'activity')
    expect(y).toBeCloseTo(cy + size * (7 / 9 - 0.5), 2);
  });

  it('a parallelogram (<<save>>) label carries textLength and no dominant-baseline/box-centre hack', () => {
    const node = makeNode({ kind: 'action', label: 'store', stereotype: 'save', x: 0, y: 0, width: 80, height: 32 });
    const svg = renderParallelogram(node, theme);
    expect(svg).not.toContain('dominant-baseline');
    expect(svg).toMatch(/<text[^>]*textLength="[\d.]+"[^>]*>store<\/text>/);
    const cy = node.y + node.height / 2;
    const y = Number(/<text[^>]*\sy="([\d.]+)"/.exec(svg)?.[1]);
    const size = 12;
    expect(y).toBeCloseTo(cy + size * (7 / 9 - 0.5), 2);
  });
});

// ---------------------------------------------------------------------------
// renderBar / renderSplitLine (apc-T3, activity-renderer-bars.ts) --
// FtileBlackBlock.java:101-110 (fork/join bar) vs FtileThinSplit.java
// :87-96 (split top/join line): two different shapes for two different
// upstream tiles, dispatched on node.kind by `renderNode`.
// ---------------------------------------------------------------------------

describe('renderBar — fork/join bar (FtileBlackBlock)', () => {
  // T3a (garuga-34-debe901): `ug.apply(colorBar).apply(colorBar.bg())
  // .draw(rect)` (`FtileBlackBlock.java:110`) strokes AND fills the rect in
  // the SAME resolved colour -- stroke is never absent.
  it('renders a rounded rect, stroked AND filled in the same colour', () => {
    const svg = renderBar(makeNode({ kind: 'fork-bar', x: 10, y: 20, width: 100, height: 6 }), theme);
    expect(svg).toContain('<rect');
    expect(svg).toContain('x="10"');
    expect(svg).toContain('y="20"');
    expect(svg).toContain('width="100"');
    expect(svg).toContain('height="6"');
    expect(svg).toContain('rx="2.5"');
    expect(svg).toContain('ry="2.5"');
    expect(svg).toContain('fill="#555"');
    expect(svg).toContain('stroke="#555"');
    expect(svg).toContain('stroke-width="1"');
  });

  it('fill AND stroke default to the resolved activityBar colour, not theme.colors.border', () => {
    const svg = renderBar(makeNode({ kind: 'join-bar', width: 50, height: 6 }), theme);
    expect(svg).toContain('fill="#555"');
    expect(svg).toContain('stroke="#555"');
    expect(svg).not.toContain(`fill="${theme.colors.border}"`);
  });

  // N (add2 T3i): `end fork {label}` -- FtileBlackBlock.java:84-92,
  // 110-112, zafoxu-20-xofe568.
  it('draws no label text when node.label is unset', () => {
    const svg = renderBar(makeNode({ kind: 'fork-bar', x: 16, y: 55, width: 225.5, height: 6 }), theme);
    expect(svg).not.toContain('<text');
  });

  it('draws the label to the right of the bar, vertically centred on its top edge', () => {
    const svg = renderBar(makeNode({ kind: 'join-bar', x: 16, y: 133, width: 225.5, height: 6, label: '{or}' }), theme);
    expect(svg).toContain('x="246.5"');
    expect(svg).toContain('y="136.056"');
    expect(svg).toContain('font-size="11"');
    expect(svg).toContain('>{or}<');
  });
});

describe('renderSplitLine — split top/join line (FtileThinSplit)', () => {
  it('renders a <line> from x,y to x+width,y (top of its band, not centred)', () => {
    const svg = renderSplitLine(makeNode({ kind: 'split-bar', x: 32.675, y: 55, width: 86.7 }), theme);
    expect(svg).toContain('<line');
    expect(svg).toContain('x1="32.675"');
    expect(svg).toContain('y1="55"');
    expect(svg).toContain('x2="119.375"');
    expect(svg).toContain('y2="55"');
  });

  it('stroke-width is 1.5 (FtileThinSplit.java:95), colour is the theme arrow colour', () => {
    const svg = renderSplitLine(makeNode({ kind: 'split-join-bar', x: 0, y: 0, width: 40 }), theme);
    expect(svg).toContain('stroke-width="1.5"');
    expect(svg).toContain(`stroke="${noGradient(theme.colors.arrow)}"`);
  });
});

// ---------------------------------------------------------------------------
// T2f mechanism 6 -- `group`/`partition` frame (plantuml.skin:364-368's
// root `composite` block). `renderNode` had no case for either kind, so
// both fell through the `default:` fallback and drew the generic node
// fill/border instead of the composite frame.
// ---------------------------------------------------------------------------

describe('renderNode -- group/partition frame (composite SName)', () => {
  it('partition: unfilled rect, black stroke, LineThickness 1.5 -- not the generic node fill', () => {
    const node = makeNode({ kind: 'partition', x: 16, y: 45, width: 138.4, height: 122 });
    const svg = renderNode(node, theme);
    // Mission `activity-divergence-drive-2` T3g: `USymbolFrame#drawFrame`
    // (`decoration/symbol/USymbolFrame.java:68-97`) also draws the title-tab
    // underline `<path>` unconditionally, even with no title (`node.label`
    // unset here) -- `getWTitle`'s own untitled fallback, `width/3`.
    expect(svg).toBe(
      '<rect x="16" y="45" width="138.4" height="122" fill="none" stroke="#000" stroke-width="1.5"/>' +
        '<path d="M62.133,45 L62.133,50 L55.133,57 L16,57" fill="none" stroke="#000" stroke-width="1.5"/>',
    );
  });

  it('group: same composite styling as partition (FromSkinparamToStyle.java:131-132, ONE SName for both)', () => {
    const node = makeNode({ kind: 'group', x: 0, y: 0, width: 50, height: 50 });
    const svg = renderNode(node, theme);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain('stroke-width="1.5"');
    expect(svg).not.toContain(theme.colors.nodeBackground);
  });

  it('Partition* skinparams colour the frame, tab and title (add4-T2b, FtileGroup.java:99-102)', () => {
    const styled: Theme = {
      ...theme,
      colors: {
        ...theme.colors,
        graph: {
          ...theme.colors.graph,
          partitionBorder: 'green',
          partitionBackground: 'lightblue',
          partitionFontColor: 'yellow',
        },
      },
    };
    const svg = renderNode(makeNode({ kind: 'partition', x: 0, y: 0, width: 80, height: 50, label: 'P' }), styled);
    expect(svg).toContain('fill="#ADD8E6" stroke="#008000"');
    expect(svg).toMatch(/<path d="[^"]*" fill="none" stroke="#008000" stroke-width="1.5"\/>/);
    expect(svg).toContain('fill="#FF0"');
  });

  // add4-T2b (GROUP-USYMBOL): CommandPartition3.java:89-106; geometry from
  // somome-34-nori033's jar SVG (frame 63.325 wide, title "Action" 38.938).
  it('package draws the USymbolFolder tab polygon and its hline (USymbolFolder.java:85-124)', () => {
    const node = makeNode({
      kind: 'partition',
      x: 25,
      y: 133.611,
      width: 63.325,
      height: 86,
      label: 'Action',
      usymbol: 'package',
    });
    const svg = renderNode(node, theme);
    expect(svg).toContain(
      '<polygon points="25,133.611,69.938,133.611,76.938,153.611,88.325,153.611,88.325,219.611,25,219.611,25,133.611" fill="none" stroke="#000" stroke-width="1.5"',
    );
    expect(svg).toContain('<line x1="25" y1="153.611" x2="76.938" y2="153.611" stroke="#000" stroke-width="1.5"/>');
    expect(svg).toMatch(/<text x="29" y="146.5"[^>]*>Action<\/text>/);
  });

  it('card draws a rect, a full-width line at title height + 4, and a centred title (USymbolCard.java:59-66,120-135)', () => {
    const node = makeNode({
      kind: 'partition',
      x: 25,
      y: 229.611,
      width: 63.325,
      height: 86,
      label: 'Action',
      usymbol: 'card',
    });
    const svg = renderNode(node, theme);
    expect(svg).toContain(
      '<rect x="25" y="229.611" width="63.325" height="86" fill="none" stroke="#000" stroke-width="1.5"/>',
    );
    expect(svg).toContain('<line x1="25" y1="247.611" x2="88.325" y2="247.611"');
    expect(svg).toMatch(/<text x="37.194" y="242.5"[^>]*>Action<\/text>/);
  });

  it('rectangle draws a bare rect and a centred title, no tab (USymbolRectangle.java:65-71,104-134)', () => {
    const node = makeNode({
      kind: 'partition',
      x: 25,
      y: 325.611,
      width: 63.325,
      height: 86,
      label: 'Action',
      usymbol: 'rectangle',
    });
    const svg = renderNode(node, theme);
    expect(svg).not.toContain('<path');
    expect(svg).not.toContain('<line');
    expect(svg).toMatch(/<text x="37.194" y="338.5"[^>]*>Action<\/text>/);
  });

  it('partition #color fills the frame (add4-T2b, FtileGroup.java:101)', () => {
    const node = makeNode({ kind: 'partition', x: 0, y: 0, width: 50, height: 50, color: '#LightSkyBlue' });
    expect(renderNode(node, theme)).toContain('<rect x="0" y="0" width="50" height="50" fill="#87CEFA"');
  });
});

// ---------------------------------------------------------------------------
// add2 T3h (family CSTYLE): `renderNode`'s `'if-split'` case picks the
// square polygon under `skinparam ConditionStyle InsideDiamond`, the
// hexagon otherwise -- `'while-header'` is unaffected (T3f's family).
// ---------------------------------------------------------------------------

describe("renderNode -- 'if-split' ConditionStyle dispatch (add2 T3h)", () => {
  it('draws the 7-point hexagon by default (no conditionStyle set)', () => {
    const node = makeNode({ kind: 'if-split', x: 25, y: 15, width: 41.669, height: 35 });
    const svg = renderNode(node, theme);
    expect(svg).toContain('25,32.5,37,15');
  });

  it('draws the unclosed 4-point rhombus under ConditionStyle InsideDiamond (carapo-31-bisi880)', () => {
    const insideDiamond: Theme = { ...theme, conditionStyle: 'insideDiamond' };
    const node = makeNode({ kind: 'if-split', x: 25, y: 15, width: 41.669, height: 35 });
    const svg = renderNode(node, insideDiamond);
    expect(svg).toContain('<polygon points="45.835,15,66.669,32.5,45.835,50,25,32.5"');
  });

  // add4-T2f: `FtileWhile.create` builds `FtileDiamondSquare` under
  // INSIDE_DIAMOND (`vcompact/FtileWhile.java:134-136`), as an if does.
  it("'while-header' draws the 4-point rhombus under ConditionStyle InsideDiamond", () => {
    const insideDiamond: Theme = { ...theme, conditionStyle: 'insideDiamond' };
    const node = makeNode({ kind: 'while-header', x: 25, y: 15, width: 41.669, height: 35 });
    const svg = renderNode(node, insideDiamond);
    expect(svg).toContain('<polygon points="45.835,15,66.669,32.5,45.835,50,25,32.5"');
  });
});

// add3-T3c: `node.diamondShape` (set by `walk-if-down.ts`/`walk-if-with-
// links.ts`) now picks the shape directly -- `renderIfSplitShape`'s own
// doc comment for why this replaces the `label === ''` inference below
// it for the case that inference could not distinguish: an EMPTY_DIAMOND
// `with-links` if, whose condition text is a real, non-empty `north`
// label (never this node's own `label`, always `''` for that shape).
describe("renderNode -- 'if-split' diamondShape dispatch (add3-T3c)", () => {
  it("diamondShape 'empty' draws the fixed rhombus even with a non-empty label (the ambiguous case T3d's heuristic could not resolve)", () => {
    const node = makeNode({
      kind: 'if-split',
      x: 25,
      y: 15,
      width: 24,
      height: 24,
      label: 'not empty',
      diamondShape: 'empty',
    });
    const svg = renderNode(node, theme);
    // renderDiamond's own fixed rhombus point list for a 24x24 box
    // centred at (37, 27): size = 12.
    expect(svg).toContain('<polygon points="37,15,49,27,37,39,25,27,37,15"');
    // `label === 'not empty'` must NOT suppress the rhombus (it would
    // under the pre-T3c `node.label === ''` heuristic).
    expect(svg).toContain('<polygon');
  });

  it("diamondShape 'square' draws the square polygon regardless of theme.conditionStyle", () => {
    const node = makeNode({ kind: 'if-split', x: 25, y: 15, width: 41.669, height: 35, diamondShape: 'square' });
    const svg = renderNode(node, theme); // no conditionStyle set at all
    expect(svg).toContain('<polygon points="45.835,15,66.669,32.5,45.835,50,25,32.5"');
  });

  it("diamondShape 'inside' falls back to the hexagon when theme.conditionStyle is unset", () => {
    const node = makeNode({ kind: 'if-split', x: 25, y: 15, width: 41.669, height: 35, diamondShape: 'inside' });
    const svg = renderNode(node, theme);
    expect(svg).toContain('25,32.5,37,15');
  });

  it("diamondShape undefined (repeat-cond, walk-repeat*.ts not this task's write-set) keeps the pre-existing label === '' heuristic", () => {
    const emptyDiamond: Theme = { ...theme, conditionStyle: 'emptyDiamond' };
    const node = makeNode({ kind: 'repeat-cond', x: 25, y: 15, width: 24, height: 24, label: '' });
    const svg = renderNode(node, emptyDiamond);
    expect(svg).toContain('<polygon points="37,15,49,27,37,39,25,27,37,15"');
  });
});
