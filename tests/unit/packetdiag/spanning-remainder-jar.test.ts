/**
 * Spanning-field remainder block, mirrored from the jar (unwind2-S1).
 *
 * `PacketDiagram#adjustLayout` (`packetdiag/PacketDiagram.java:416-440`) sizes
 * the remainder block of a spanning item with
 * `p.toPacketBlock(remainRowWidth, true, false, ...)` (`:430`), i.e.
 * `Math.min(newWidth, width)` (`:526`) -- `width` being the carried item's
 * width, `newWidth` the reset `colWidth` -- while only the row accounting
 * uses `remain` (`:431`). The block therefore spans a full row (or the whole
 * carried width) and later items land to its right, widening the canvas
 * (`getTextBlock#calculateDimension`, `:143-178`). Each fixture's `.svg` is the
 * pinned jar render (`scripts/oracle-render.sh`).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S1');
const CASES = ['entry-example', 'exact-fill', 'exact-multi', 'exact-end', 'span-from-start', 'span-three'];

function rects(svg: string): string[] {
  // Block rects only: ours carries an extra root-background rect (no x/y).
  return (svg.match(/<rect[^>]* x="[^>]*>/g) ?? []).map((r) =>
    ['x', 'y', 'width', 'height'].map((a) => new RegExp(` ${a}="([^"]*)"`).exec(r)?.[1]).join(','),
  );
}
const viewBox = (svg: string): string | undefined => /viewBox="([^"]*)"/.exec(svg)?.[1];

function ours(name: string): string {
  const out = renderSync(readFileSync(join(DIR, `${name}.puml`), 'utf-8'));
  return typeof out === 'string' ? out : String((out as { svg: string }).svg);
}

describe('packetdiag spanning remainder block vs jar', () => {
  for (const name of CASES) {
    const jar = readFileSync(join(DIR, `${name}.svg`), 'utf-8');
    it(`${name}: block geometry and canvas equal the jar's`, () => {
      expect(rects(ours(name))).toEqual(rects(jar));
      expect(viewBox(ours(name))).toBe(viewBox(jar));
    });
    it(`${name}: compareSvg reports no rect or root-size diff`, () => {
      // Other packet residuals (text baseline, extra child) are outside this
      // mechanism; the geometry the remainder block controls must be clean.
      const paths = compareSvg(ours(name), jar, 'deterministic').diffs.map((d) => d.path);
      expect(paths.filter((p) => /rect|svg\/@(width|height|viewBox)/.test(p))).toEqual([]);
    });
  }

  it('entry-example: the third row is a full-width Payload block, as the jar draws it', () => {
    expect(rects(ours('entry-example')).slice(-1)).toEqual(['10,124,672,34']);
  });

  it('exact-multi: Tail lands right of the full-width remainder and widens the canvas', () => {
    expect(rects(ours('exact-multi')).slice(-1)).toEqual(['682,124,336,34']);
    expect(viewBox(ours('exact-multi'))).toBe('0 0 1029 169');
  });
});
