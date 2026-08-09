/**
 * SVG shape markup has exactly one emission seam.
 *
 * Upstream has no per-diagram hand-rolled markup at all: every shape goes
 * through `SvgGraphics.svgRectangle/svgLine/svgPolygon/svgEllipse/svgPath/
 * svgImage`, reached via the `Driver*Svg` classes. This port had drifted --
 * 45 shape elements were built as template literals across the activity,
 * chart, json, sequence and dot engines, so none of the six output-size
 * rules reached them and the same color could render two different ways in
 * one document depending on which site emitted it.
 *
 * This guard keeps that from coming back. It is textual, like the other
 * guards in this directory.
 *
 * SHAPES are what `SvgGraphics` owns and what the rules act on (geometry
 * and paint). CONTAINERS -- `<svg>`, `<g>`, `<defs>`, `<clipPath>`,
 * `<marker>`, `<filter>` and the `<fe*>` filter primitives -- are document
 * structure that upstream also assembles outside `SvgGraphics`, so they are
 * deliberately NOT covered. If a container ever gains a computed coordinate
 * or color, route that value through `svg-format.ts` rather than widening
 * this list.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Elements that carry geometry or paint -- the emitters' exclusive domain. */
const SHAPE_ELEMENTS = [
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'path',
  'text',
  'tspan',
  'image',
];

/**
 * The emission seam itself, plus the klimt `SvgGraphics` port. These are the
 * files ALLOWED to write shape markup -- they are the thing every other file
 * must go through.
 */
const SEAM = ['src/core/svg.ts', 'src/core/svg-shapes.ts', 'src/core/svg-markers.ts'];

function isSeam(rel: string): boolean {
  return SEAM.includes(rel) || rel.startsWith('src/core/klimt/');
}

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsFiles(p));
    else if (name.endsWith('.ts')) out.push(p);
  }
  return out;
}

/**
 * Blank out comments, preserving line numbering. JSDoc in this repo quotes
 * SVG markup constantly (`` `<text>` `` in prose); without this the guard is
 * all false positives. Only block comments and whole-line `//` comments are
 * stripped -- never string contents, so a real emission site cannot hide.
 */
function stripComments(src: string): string {
  const noBlocks = src.replace(new RegExp('/\\*[^]*?\\*/', 'g'), (m) =>
    m.replace(new RegExp('[^\\n]', 'g'), ' '),
  );
  return noBlocks
    .split('\n')
    .map((l) => (l.trimStart().startsWith('//') ? '' : l))
    .join('\n');
}

// Built as a string, not a literal: the complexity checker miscounts regex
// literals containing `<`/`>` (same workaround as paint.ts and svg.ts).
const OPEN_TAG = new RegExp('`<(' + SHAPE_ELEMENTS.join('|') + ')[ />]', 'g');

describe('SVG shape markup has one emission seam', () => {
  it('no file outside core/svg*.ts or core/klimt/ opens a shape element', () => {
    const offenders: string[] = [];
    for (const file of tsFiles(join(REPO, 'src'))) {
      const rel = file.slice(REPO.length + 1);
      if (isSeam(rel)) continue;
      const src = stripComments(readFileSync(file, 'utf8'));
      for (const m of src.matchAll(OPEN_TAG)) {
        const line = src.slice(0, m.index).split('\n').length;
        offenders.push(`${rel}:${line} -- <${m[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
