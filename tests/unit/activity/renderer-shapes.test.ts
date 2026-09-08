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
import { describe, it, expect } from 'vitest';
import {
  renderAction,
  renderDiamond,
  renderEnd,
  renderNote,
  renderStart,
  renderStop,
} from '../../../src/diagrams/activity/activity-renderer-shapes.js';
import { GtileAction } from '../../../src/diagrams/activity/tiles/gtile-action.js';
import { GtileDiamond } from '../../../src/diagrams/activity/tiles/gtile-diamond.js';
import { GtileNote } from '../../../src/diagrams/activity/tiles/gtile-note.js';
import type { StringBounder as TileStringBounder } from '../../../src/diagrams/activity/tiles/tile.js';
import type { ActivityNodeGeo } from '../../../src/diagrams/activity/layout.old.js';
import { resolveTheme, deepMergeTheme, defaultTheme } from '../../../src/core/theme.js';

const theme = resolveTheme('default');

function makeNode(overrides: Partial<ActivityNodeGeo> & Pick<ActivityNodeGeo, 'kind'>): ActivityNodeGeo {
  return { id: 'node1', x: 50, y: 50, width: 20, height: 20, ...overrides };
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
  it('emits exactly two <ellipse> elements (bullseye), never a <circle>', () => {
    const node = makeNode({ kind: 'stop', width: 28, height: 28 });
    const svg = renderStop(node, theme);
    expect(svg).not.toContain('<circle');
    expect((svg.match(/<ellipse/g) ?? []).length).toBe(2);
  });

  it('outer ellipse is unfilled and stroked in the resolved circle ink; inner is filled', () => {
    // `activityDiagram { circle { start, stop, end { LineColor #2;
    // BackgroundColor #2; LineThickness 1 } } }` (plantuml.skin:378-380).
    // Was `theme.colors.border` (#181818) at stroke-width 2, neither of
    // which came from upstream. `#2` resolves through HColorSet to
    // #222222, which the SVG layer shortens to #222 -- the exact spelling
    // the jar emits (SvgGraphics#shortenColor).
    const node = makeNode({ kind: 'stop', width: 28, height: 28 });
    const svg = renderStop(node, theme);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('fill="#222"');
    expect(svg).toContain('stroke="#222"');
    expect(svg).toContain('stroke-width="1"');
    expect(svg).not.toContain('stroke-width="2"');
  });

  it('inner radius is 0.55x the outer, both cx/cy centered on the node', () => {
    const node = makeNode({ kind: 'stop', x: 50, y: 50, width: 28, height: 28 });
    const svg = renderStop(node, theme);
    expect(svg).toContain('cx="64"');
    expect(svg).toContain('cy="64"');
    expect(svg).toContain('rx="14"');
    expect(svg).toContain('rx="7.7"');
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

describe('renderEnd', () => {
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
    const end = renderEnd(makeNode({ kind: 'end', width: 28, height: 28 }), theme);
    expect(end).toContain('stroke-width="1.5"');
    const stop = renderStop(makeNode({ kind: 'stop', width: 28, height: 28 }), theme);
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
