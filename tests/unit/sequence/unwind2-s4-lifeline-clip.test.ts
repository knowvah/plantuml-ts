/**
 * unwind2-S4: on a `newpage` page that is not the last, the jar's lifelines
 * end ONE PIXEL BELOW the footbox row's top.
 *
 * `PlayingSpaceWithParticipants#drawU` draws the lifelines over the whole
 * diagram (`livingSpaces.drawLifeLines(ugBody, fullHeight, context)`, :221)
 * inside `new UClip(-1000, ymin, Double.MAX_VALUE, pageHeight + 1)`
 * (:213-216), and places the footbox row at `dy(pageHeight + headHeight)`
 * (:225-226). `UClip#getClippedLine` clamps a vertical line to the clip
 * (`UClip.java:131-157`), and `getClippedRectangle` the hover rect
 * (:121-127), so both reach the clip's `+ 1`.
 *
 * Each `tests/fixtures/unwind2-S4/<name>.puml` sits beside the jar's own
 * page images, `<name>.svg`, `<name>_001.svg`, ... rendered by
 * `scripts/oracle-render.sh` (deterministic text). The sequence engine is not
 * yet `compareSvg`-conformant (diff-baseline ratchet), so this pins exactly
 * the geometry the two quantities feed: every lifeline's hover rect and
 * dashed line, every footbox participant rect's `y`, and the image height.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderPagesSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S4');

/** A lifeline: the transparent hover rect followed by its dashed line. */
const RE_LIFELINE =
  /<rect[^>]*y="([\d.]+)"[^>]*height="([\d.]+)"[^>]*fill-opacity="0"[^>]*\/><line[^>]*y1="([\d.]+)"[^>]*y2="([\d.]+)"/g;
const RE_HEIGHT = /height="(\d+)px"/;
const RE_PARTICIPANT_RECT = /<rect[^>]*y="([\d.]+)"[^>]*fill="#E2E2F0"/g;

interface PageGeometry {
  height: string | undefined;
  lifelines: string[];
  participantRectYs: string[];
}

function geometryOf(svg: string): PageGeometry {
  return {
    height: RE_HEIGHT.exec(svg)?.[1],
    lifelines: [...svg.matchAll(RE_LIFELINE)].map((m) => m.slice(1).join(',')),
    participantRectYs: [...svg.matchAll(RE_PARTICIPANT_RECT)].map((m) => m[1]!),
  };
}

function jarPage(name: string, index: number): string {
  const suffix = index === 0 ? '' : `_${String(index).padStart(3, '0')}`;
  return readFileSync(join(FIXTURES, `${name}${suffix}.svg`), 'utf-8');
}

function ourPages(name: string): string[] {
  const source = readFileSync(join(FIXTURES, `${name}.puml`), 'utf-8');
  return renderPagesSync(source, { measurer: new WidthTableMeasurer() });
}

function expectPagesLikeJar(name: string, pageCount: number): void {
  const pages = ourPages(name);
  expect(pages).toHaveLength(pageCount);
  pages.forEach((ours, i) => {
    expect(geometryOf(ours)).toEqual(geometryOf(jarPage(name, i)));
  });
}

describe('unwind2-S4: lifelines run to the page clip, the footbox sits at pageHeight', () => {
  it('two pages, plain participants', () => {
    expectPagesLikeJar('two-pages', 2);
  });

  it('three pages with actor and database feet', () => {
    expectPagesLikeJar('three-pages-actor', 3);
  });

  it('an activation open across the page break', () => {
    expectPagesLikeJar('activation-across-page', 2);
  });

  it('hide footbox: the lifelines still reach the clip edge', () => {
    expectPagesLikeJar('hide-footbox-pages', 2);
  });

  // The jar's own numbers, stated: page 0 of `two-pages` has its footbox at
  // y=95 and its lifelines ending at y=96; the LAST page has none of the gap.
  it('separates the two quantities by exactly one pixel on an inner page', () => {
    const [first, last] = ourPages('two-pages').map(geometryOf);
    expect(first!.lifelines).toEqual(['39,57,39,96', '39,57,39,96']);
    expect(first!.participantRectYs.slice(2)).toEqual(['95', '95']);
    expect(last!.lifelines).toEqual(['39,58,39,97', '39,58,39,97']);
    expect(last!.participantRectYs.slice(2)).toEqual(['97', '97']);
  });
});
