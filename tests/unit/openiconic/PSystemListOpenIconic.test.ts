/**
 * `PSystemListOpenIconic` (openiconic/PSystemListOpenIconic.java): 4 header
 * lines (java:61-65) and `<&name> name` per `all.txt` icon (java:66-73), split
 * by `PSystemDonors.getCols(lines, 7, 0)` (java:74) into `GraphicStrings`
 * columns laid side by side top-aligned (java:75).
 *
 * Jar values: `unknown/fotete-48-viga126` (`listopeniconic`, the cached corpus
 * oracle, 894x407). Authored probes `listopeniconicfoo` and `LISTOPENICONIC`
 * render byte-identical pages (`<?plantuml-src?>` aside).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { stringBounderFor } from '../../../src/core/UgDiagram.js';
import { PSystemListOpenIconic } from '../../../src/diagrams/openiconic/PSystemListOpenIconic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const measurer = new DeterministicMeasurer();
const FOTETE = 'test-results/dot-cache/unknown/fotete-48-viga126/in.svg';

function list(): PSystemListOpenIconic {
  return new PSystemListOpenIconic({ lines: [], type: 'sequence' }, new PreprocessingArtifact());
}

/** Every `<text>` content of an SVG, in document order. */
function texts(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]!);
}

describe('PSystemListOpenIconic — the jar page', () => {
  it('matches the cached fotete-48 oracle with zero diffs', () => {
    const actual = list().exportDiagram(0, measurer);
    expect(compareSvg(actual, readFileSync(FOTETE, 'utf8'), 'deterministic').diffs).toEqual([]);
  });

  it('draws the 894x407 canvas, 227 lines and 223 glyph paths', () => {
    const svg = list().exportDiagram(0, measurer);
    expect(svg).toContain('width="894px" height="407px"');
    expect(texts(svg)).toHaveLength(227);
    expect(svg.match(/<path /g)).toHaveLength(223);
    expect(texts(svg).slice(0, 5)).toEqual([
      'List Open Iconic',
      'Credit to',
      'https://useiconic.com/open',
      '\u00a0', // the `" "` line, written as `&#160;` (ufp-T0e note)
      'account-login',
    ]);
  });

  it('renders identically three times', () => {
    const outputs = [0, 1, 2].map(() => list().exportDiagram(0, measurer));
    expect(new Set(outputs).size).toBe(1);
  });
});

describe('PSystemListOpenIconic — members', () => {
  it('lays 7 columns of (227 + 6) / 7 = 33 lines side by side', () => {
    const sb = stringBounderFor(measurer);
    const dim = list().getTextBlock(0, sb).calculateDimension(sb);
    // 33 lines x 12 + 2 x 5 (GraphicStrings margin) = 406; the canvas adds 1.
    expect(dim.getHeight()).toBe(406);
  });

  it('keeps same(0) margins and the "(Open iconic)" description', () => {
    const p = list();
    const m = p.getDefaultMargins();
    expect([m.getTop(), m.getRight(), m.getBottom(), m.getLeft()]).toEqual([0, 0, 0, 0]);
    expect(p.getDescription()).toBe('(Open iconic)');
  });
});
