/**
 * unwind2-S9b: a `ref over` frame is a `ReferenceTile` drawing
 * `ComponentRoseReference`, pinned against jar renders.
 *
 * `ReferenceTile#init` (`teoz/ReferenceTile.java:96-115`) spans the
 * referenced boxes' outer edges and pushes the rightmost one until the
 * component's preferred width fits; `getMinX`/`getMaxX` (`:163-180`) make
 * that span the tile's footprint, so a wide `ref` widens the document. The
 * component draws its body rect and corner tab `xMargin` inside the area,
 * the `ref` keyword at `(15, 2)` and the body centred in the area
 * (`skin/rose/ComponentRoseReference.java:83-137`), and the tile is exactly
 * the component's preferred height (`ReferenceTile.java:73,153-157`).
 *
 * Each `tests/fixtures/unwind2-S9b/r-*.puml` sits beside its jar render
 * (`scripts/oracle-render.sh`). The geometry pinned is every participant box,
 * every frame rect, corner path and text, and the document width -- the
 * attributes a `ref` moves, not the stroke spellings the conformance ratchet
 * owns.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S9b');

const RE_SHAPE = /<(rect|path|text)\b([^>]*)>(?:([^<]*)<\/text>)?/g;

function attr(attrs: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1];
}

/** Boxes, frames and texts, as their geometry; hover targets dropped. */
function geometry(svg: string): string[] {
  const width = /<svg[^>]*\bwidth="([^"]*)"/.exec(svg)?.[1];
  const shapes = [...svg.matchAll(RE_SHAPE)]
    .filter((m) => !m[2]!.includes('fill-opacity'))
    .map((m) => {
      if (m[1] === 'path') return `path ${attr(m[2]!, 'd')}`;
      if (m[1] === 'text') return `text ${attr(m[2]!, 'x')},${attr(m[2]!, 'y')} ${m[3]}`;
      return `rect ${['x', 'y', 'width', 'height'].map((k) => attr(m[2]!, k)).join(',')}`;
    });
  return [`width ${width}`, ...shapes];
}

function jar(name: string): string {
  return readFileSync(join(FIXTURES, `${name}.svg`), 'utf-8');
}

function ours(name: string): string {
  return renderSync(readFileSync(join(FIXTURES, `${name}.puml`), 'utf-8'), { measurer: new DeterministicMeasurer() });
}

describe('unwind2-S9b ref tile (jar fixtures)', () => {
  it.each(['r-two', 'r-span', 'r-multi', 'r-single', 'r-teoz'])('%s lays its refs out as the jar', (name) => {
    expect(geometry(ours(name))).toEqual(geometry(jar(name)));
  });

  it('places a ref inside a group against its own participants (r-group)', () => {
    // The group frame's own x/width are `GroupingTile`'s, not this file's; the
    // ref sits `xMargin` inside the first box it spans, wherever that box is.
    const refOffset = (svg: string): string[] => {
      const g = geometry(svg);
      const firstBox = Number(g.find((s) => s.startsWith('rect') && s.endsWith(',28'))!.split(/[ ,]/)[1]);
      const refRect = g.filter((s) => s.startsWith('rect') && s.endsWith(',35'));
      return refRect.map((s) => {
        const [x, y, w, h] = s.slice(5).split(',').map(Number);
        return `${x! - firstBox},${y},${w},${h}`;
      });
    };
    expect(refOffset(ours('r-group'))).toEqual(refOffset(jar('r-group')));
  });
});
