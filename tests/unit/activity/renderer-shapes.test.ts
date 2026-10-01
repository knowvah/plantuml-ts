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
  renderKill,
  renderLabel,
  renderNote,
  renderParallelogram,
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

  it('resolves a named theme color to hex on both ellipses', () => {
    const activityTheme = deepMergeTheme(defaultTheme, {
      colors: {
        ...defaultTheme.colors,
        graph: { ...defaultTheme.colors.graph, activity: { endColor: 'yellow' } },
      },
    });
    const svg = renderStop(makeNode({ kind: 'stop' }), activityTheme);
    expect(svg).toContain('stroke="#FF0"');
    expect(svg).toContain('fill="#FF0"');
  });
});

describe('renderKill', () => {
  // `kill` is decoupled from `stop` at T1c (D3): it keeps the PRE-FIX
  // unsourced `outerR * 0.55` ratio (now `KILL_INNER_RATIO`) at its own
  // unchanged tile size (28), so its pixels stay byte-identical across
  // this task. `kill`'s own upstream mechanism is out of scope (T2b).
  it('emits exactly two <ellipse> elements (bullseye), never a <circle>', () => {
    const node = makeNode({ kind: 'kill', width: 28, height: 28 });
    const svg = renderKill(node, theme);
    expect(svg).not.toContain('<circle');
    expect((svg.match(/<ellipse/g) ?? []).length).toBe(2);
  });

  it('preserves the pre-T1c outer=14/inner=7.7 geometry, unchanged by the stop fix', () => {
    const node = makeNode({ kind: 'kill', x: 50, y: 50, width: 28, height: 28 });
    const svg = renderKill(node, theme);
    expect(svg).toContain('cx="64"');
    expect(svg).toContain('cy="64"');
    expect(svg).toContain('rx="14"');
    expect(svg).toContain('rx="7.7"');
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#222"');
    expect(svg).toContain('stroke-width="1"');
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
    expect(Number(l2[1])).toBeCloseTo(53.813, 3);
    expect(Number(l2[2])).toBeCloseTo(66.187, 3);
    expect(Number(l2[3])).toBeCloseTo(66.187, 3);
    expect(Number(l2[4])).toBeCloseTo(53.813, 3);
  });

  it('cross stroke-width is 2.5, independent of the ellipse stroke-width 1.5', () => {
    const svg = renderEnd(makeNode({ kind: 'end', width: 20, height: 20 }), theme);
    expect(svg).toContain('stroke-width="2.5"');
    expect(svg).toContain('stroke-width="1.5"');
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

  it('`<style> activityDiagram { activity { FontColor red } }` colours a single-line action, not a single-line diamond label', () => {
    const activityRed = themeWithFontColor('activity', 'red');
    const actionSvg = renderAction(makeNode({ kind: 'action', label: 'go', width: 120, height: 32 }), activityRed);
    expect(actionSvg).toContain('fill="#F00"');
    const hexSvg = renderHexagon(makeNode({ kind: 'diamond', label: 'yes', width: 60, height: 40 }), activityRed);
    expect(hexSvg).toContain('fill="#000"');
    expect(hexSvg).not.toContain('fill="#F00"');
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

  it('`<style> activityDiagram { activity { FontColor red } }` colours a multi-line action, not the diamond', () => {
    const activityRed = themeWithFontColor('activity', 'red');
    const actionSvg = renderAction(makeNode({ kind: 'action', label: 'l1\nl2', width: 120, height: 40 }), activityRed);
    expect(actionSvg).toContain('fill="#F00"');
    const diamondSvg = renderDiamond(makeNode({ kind: 'diamond', label: 'yes', width: 40, height: 40 }), activityRed);
    expect(diamondSvg).toContain('fill="#000"');
    expect(diamondSvg).not.toContain('fill="#F00"');
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

  it('a labelled hexagon condition centres each line on its own width, no text-anchor', () => {
    const svg = renderHexagon(makeNode({ kind: 'diamond', label: 'yes\nno', width: 60, height: 40 }), theme);
    expect(svg).not.toContain('text-anchor');
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
  it('renders a rounded rect, fill only, no stroke attribute', () => {
    const svg = renderBar(makeNode({ kind: 'fork-bar', x: 10, y: 20, width: 100, height: 6 }), theme);
    expect(svg).toContain('<rect');
    expect(svg).toContain('x="10"');
    expect(svg).toContain('y="20"');
    expect(svg).toContain('width="100"');
    expect(svg).toContain('height="6"');
    expect(svg).toContain('rx="2.5"');
    expect(svg).toContain('ry="2.5"');
    expect(svg).not.toContain('stroke=');
  });

  it('fill defaults to the resolved activityBar colour, not theme.colors.border', () => {
    const svg = renderBar(makeNode({ kind: 'join-bar', width: 50, height: 6 }), theme);
    expect(svg).toContain('fill="#555"');
    expect(svg).not.toContain(`fill="${theme.colors.border}"`);
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
