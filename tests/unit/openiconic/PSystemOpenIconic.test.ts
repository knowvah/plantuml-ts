/**
 * `PSystemOpenIconic` (openiconic/PSystemOpenIconic.java): one glyph through
 * `OpenIconic#asTextBlock(HColors.BLACK, factor)` (OpenIconic.java:196-209),
 * `same(5)` margins (java:64-67).
 *
 * Jar values (1.2026.8beta1, `scripts/oracle-render.sh`):
 * - `unknown/bamudi-49-caxo996` (`openiconic lightbulb`, cached corpus oracle);
 * - authored probes `openiconic x`, `openiconic caret-right` (`translate(2)`)
 *   and `openiconic euro` (its `translate(-1)` the jar's pattern drops), each
 *   a 19x19 canvas (`(int)(8 + 2*5 + 1)`) with one `<path fill="#000">`.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { stringBounderFor } from '../../../src/core/UgDiagram.js';
import { PSystemOpenIconic } from '../../../src/diagrams/openiconic/PSystemOpenIconic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const measurer = new DeterministicMeasurer();
const BAMUDI = 'test-results/dot-cache/unknown/bamudi-49-caxo996/in.svg';

/** The jar's root up to the drawing `<g>`, for a 19x19 page. */
const HEAD_19 =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" style="width:19px;height:19px;background:#FFFFFF;" width="19px" height="19px" viewBox="0 0 19 19" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css"><?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing">';

function jarPage(d: string): string {
  return `${HEAD_19}<path d="${d}" fill="#000"/></g></svg>`;
}

/** Authored jar probes: the `<path d>` of each 19x19 page. */
const JAR_D = {
  x: 'M6.41,5 L5,6.41 L5.72,7.13 L7.5,8.94 L5.72,10.72 L5,11.41 L6.41,12.85 L7.13,12.13 L8.94,10.32 L10.72,12.13 L11.41,12.85 L12.85,11.41 L12.13,10.72 L10.32,8.94 L12.13,7.13 L12.85,6.41 L11.41,5 L10.72,5.72 L8.94,7.5 L7.13,5.72 L6.41,5',
  'caret-right': 'M7,5 L7,13 L11,9 L7,5',
  euro: 'M11,5 C9.14,5 7.6,6.28 7.16,8 L5.25,8 L5,9 L7.01,9 C7.01,9.35 7.08,9.68 7.17,10 L5.2,10 L5.01,11 L7.57,11 C8.27,12.19 9.54,13 11.01,13 C11.74,13 12.42,12.79 13.01,12.44 L13.01,11.22 C12.48,11.7 11.79,12 11.01,12 C10.12,12 9.34,11.61 8.79,11 L11.01,11 L11.17,10 L8.2,10 C8.09,9.68 8.01,9.36 8.01,9 L11.35,9 L11.51,8 L8.2,8 C8.61,6.84 9.71,6 11.01,6 C11.67,6 12.27,6.21 12.76,6.56 L12.92,5.5 C12.35,5.19 11.71,5 11.01,5',
} as const;

function page(iconName: string, factor = 1.0): PSystemOpenIconic {
  return new PSystemOpenIconic({ lines: [], type: 'sequence' }, iconName, factor, new PreprocessingArtifact());
}

describe('PSystemOpenIconic — the jar page', () => {
  it('matches the cached bamudi-49 oracle (lightbulb, translate(1)) with zero diffs', () => {
    const actual = page('lightbulb').exportDiagram(0, measurer);
    expect(compareSvg(actual, readFileSync(BAMUDI, 'utf8'), 'deterministic').diffs).toEqual([]);
  });

  it.each(Object.entries(JAR_D))('draws %s byte for byte as the jar does', (name, d) => {
    expect(page(name).exportDiagram(0, measurer)).toBe(jarPage(d));
  });

  it('renders identically three times', () => {
    const outputs = [0, 1, 2].map(() => page('lightbulb').exportDiagram(0, measurer));
    expect(new Set(outputs).size).toBe(1);
  });
});

describe('PSystemOpenIconic — members', () => {
  it('sizes the block 8*factor square (getDimension, OpenIconic.java:174-178)', () => {
    const sb = stringBounderFor(measurer);
    const dim = page('x', 2).calculateDimension(sb);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([16, 16]);
  });

  it('scales the path by factor', () => {
    // 16 + 2*5 = 26 -> (int)(26 + 1) = 27. caret-right `M0 0v8l4-4-4-4z`, translate(2):
    // every coordinate x2, the translate x2 (4), then the 5px margin.
    const svg = page('caret-right', 2).exportDiagram(0, measurer);
    expect(svg).toContain('width="27px" height="27px"');
    expect(svg).toContain('<path d="M9,5 L9,21 L17,13 L9,5" fill="#000"/>');
  });

  it('has same(5) margins and the "(Open iconic)" description', () => {
    const p = page('x');
    const m = p.getDefaultMargins();
    expect([m.getTop(), m.getRight(), m.getBottom(), m.getLeft()]).toEqual([5, 5, 5, 5]);
    expect(p.getDescription()).toBe('(Open iconic)');
  });

  it('throws for an unknown icon, as the jar NPEs into its crash page (probe `openiconic foo`)', () => {
    expect(() => page('foo')).toThrow('Cannot invoke "OpenIconic.asTextBlock(HColor, double)" because "icon" is null');
  });
});
