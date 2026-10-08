/**
 * add4-T3f (labala-74-juki864): the start/stop circles read the MERGED
 * `root.element.activityDiagram.circle.{start,stop}` style
 * (`VCompactFactory.java:99-121`). Every style value carries the
 * declaration counter as its priority (`ValueImpl.java:51-55`) and a merge
 * keeps the higher one (`DarkString.java:54-57,73-78`), so the LATER
 * declaration wins whatever its selector's specificity
 * (`StyleStorage.java:101-115`): a theme's `root` beats plantuml.skin's
 * `activityDiagram circle start, stop` rule (`plantuml.skin:376-381`), and
 * `circle` then `root` paints root while `root` then `circle` paints circle.
 * Goldens via `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T3f');

/** Every `<ellipse>` tag in `svg`, in document order. */
function ellipses(svg: string): string[] {
  return [...svg.matchAll(/<ellipse[^>]*>/g)].map((m) => m[0]);
}

/** Fixture -> the jar's three circle ellipses' fill / stroke, in order
 *  (start, stop outer, stop inner). */
const CASES: ReadonlyArray<readonly [string, readonly (readonly [string, string])[]]> = [
  [
    'theme-amiga',
    [
      ['#0B58A8', '#FFF'],
      ['none', '#FFF'],
      ['#0B58A8', '#FFF'],
    ],
  ],
  [
    'skin-rose',
    [
      ['#000', '#000'],
      ['none', '#000'],
      ['#000', '#000'],
    ],
  ],
  [
    'style-root',
    [
      ['#FC0', '#00F'],
      ['none', '#00F'],
      ['#FC0', '#00F'],
    ],
  ],
  [
    'style-circle-then-root',
    [
      ['#FC0', '#00F'],
      ['none', '#00F'],
      ['#FC0', '#00F'],
    ],
  ],
  [
    'style-root-then-circle',
    [
      ['#F00', '#0F0'],
      ['none', '#0F0'],
      ['#F00', '#0F0'],
    ],
  ],
  [
    'skinparam-bg',
    [
      ['#222', '#222'],
      ['none', '#222'],
      ['#222', '#222'],
    ],
  ],
  [
    'skin-rose-style-root',
    [
      ['#FC0', '#00F'],
      ['none', '#00F'],
      ['#FC0', '#00F'],
    ],
  ],
  [
    'skinparam-start-stop',
    [
      ['#F00', '#222'],
      ['none', '#0F0'],
      ['#222', '#0F0'],
    ],
  ],
];

describe('activity start/stop circle colours follow style priority', () => {
  it.each(CASES)('%s: circles carry the jar fill/stroke', (slug, expected) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, slug);
    const drawn = ellipses(ours).map((e) => [/fill="([^"]*)"/.exec(e)?.[1], /stroke(?::|=")([^;"]*)/.exec(e)?.[1]]);
    expect(drawn).toEqual(expected);
    expect(ellipses(ours).length).toBe(ellipses(golden).length);
  });

  it.each(CASES.map(([slug]) => slug))('%s: no ellipse attribute differs from the jar', (slug) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, slug);
    const paths = compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path);
    // The action box / arrows / rose shadows have their own open diffs
    // (not this mechanism, see .agent-notes/add4-T3f.md); only the circles
    // are asserted here.
    expect(paths.filter((p) => p.includes('/ellipse[') && !p.endsWith('@filter'))).toEqual([]);
  });

  it.each(['theme-amiga', 'skinparam-bg', 'skinparam-start-stop'])('%s: whole document equals the jar', (slug) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, slug);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
