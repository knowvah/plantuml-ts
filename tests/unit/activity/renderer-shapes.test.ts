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
  renderStart,
  renderStop,
  renderEnd,
} from '../../../src/diagrams/activity/activity-renderer-shapes.js';
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

  it('resolves a named theme color to hex, matching circle()\'s old pipeline', () => {
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

  it('outer ellipse is unfilled with the border stroke; inner is filled', () => {
    const node = makeNode({ kind: 'stop', width: 28, height: 28 });
    const svg = renderStop(node, theme);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain(`fill="${theme.colors.border}"`);
    expect(svg).toContain('stroke-width="2"');
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
