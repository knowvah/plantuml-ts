/**
 * unwind2-S9: the grouping frames' drop shadow, pinned against jar renders.
 *
 * `ComponentRoseGroupingHeader#drawBackgroundInternalU` shadows a frame's
 * background rect with the `group` style's `getDeltaShadow()`
 * (`ComponentRoseGroupingHeader.java:126-133`), and
 * `ComponentRoseReference#drawInternalU` shadows a `ref`'s body rect with
 * the `reference` style's (`ComponentRoseReference.java:89-96`). Nothing
 * else in a frame is shadowed: not the foreground rect (`:144-147`), not the
 * `groupHeader` corner (`:142`), not `ComponentRoseGroupingElse`'s line
 * (`ComponentRoseGroupingElse.java:75-113`).
 *
 * Each `tests/fixtures/unwind2-S9/*.puml` sits beside the jar's own render
 * (`scripts/oracle-render.sh`). Frame geometry is the diff-baseline
 * ratchet's, not this file's, and the jar's PARTICIPANT shadows are not
 * ported (filed separately), so this pins what the frames own: which rects
 * carry the shadow, in document order, and the `<defs>` filter itself --
 * id included, since `svg-defs-seeded.ts` mints the jar's `f<seed>`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S9');

/** A shadowed `<rect>` and the tag of the element that follows it. */
const RE_SHADOWED_RECT = /<rect ([^>]*)filter="url\(#([^)]*)\)"[^>]*\/>(?=<([a-z]+))/g;
const RE_DEFS = /<defs>(.*?)<\/defs>|<defs\/>/;

/**
 * The shadowed FRAME rects, as `<kind>` in document order: a frame's
 * background rect (`group`) is followed by the next tile's ink, a `ref`'s
 * body rect by its corner `<path>` (`ComponentRoseReference.java:96,122`). A
 * participant box is followed by its name's `<text>` and is not a frame's.
 */
function shadowedFrames(svg: string): string[] {
  return [...svg.matchAll(RE_SHADOWED_RECT)]
    .filter((m) => m[3] !== 'text')
    .map((m) => (m[3] === 'path' ? `ref#${m[2]}` : `group#${m[2]}`));
}

function jar(name: string): string {
  return readFileSync(join(FIXTURES, `${name}.svg`), 'utf-8');
}

function ours(name: string): string {
  return renderSync(readFileSync(join(FIXTURES, `${name}.puml`), 'utf-8'), { measurer: new WidthTableMeasurer() });
}

describe('unwind2-S9 grouping-frame shadow (jar fixtures)', () => {
  it.each([
    // `skinparam shadowing true`: root Shadowing 3 beats element's 0.0.
    'sk-shadowing',
    'teoz-sk',
    // `<style>` on the frame's own selectors, and on its ancestors.
    'style-group',
    'style-group-top',
    'style-reference',
    'style-root',
    'style-seq-element',
    // A skin and a theme that turn shadowing on.
    'skin-rose',
    'theme-materia',
    // No frame shadow: `groupHeader` is not the background rect's style; the
    // jar has no `sequenceGroupShadowing` skinparam; a later `group {
    // Shadowing 0 }` beats `skinparam shadowing true`; nothing set.
    'style-groupheader',
    'sk-seq-shadow',
    'style-group-zero-after-root',
    'noshadow-reference',
  ])('%s shadows the same frame rects as the jar', (name) => {
    expect(shadowedFrames(ours(name))).toEqual(shadowedFrames(jar(name)));
  });

  it.each(['sk-shadowing', 'teoz-sk', 'style-group', 'style-group-top', 'style-reference', 'style-root'])(
    "%s emits the jar's own <defs> filter, seeded id included (SvgGraphics.java:1070-1090)",
    (name) => {
      expect(RE_DEFS.exec(ours(name))?.[0]).toBe(RE_DEFS.exec(jar(name))?.[0]);
    },
  );

  it('narrows the ref rect by the delta its preferred width added (ComponentRoseReference.java:89,155-159)', () => {
    // The long `ref over A` is as wide as its body: the jar keeps the rect's
    // width and moves the centred body text right by half the delta.
    const rectWidth = (svg: string): string | undefined =>
      [...svg.matchAll(/<rect [^>]*width="([\d.]+)" height="[\d.]+" fill="none"[^>]*\/><path/g)].at(-1)?.[1];
    const bodyX = (svg: string): number => Number(/<text x="([\d.]+)"[^>]*>a much longer/.exec(svg)?.[1]);
    const [plain, shadowed] = [ours('noshadow-reference'), ours('style-reference')];
    const [jarPlain, jarShadowed] = [jar('noshadow-reference'), jar('style-reference')];
    expect(rectWidth(shadowed)).toBe(rectWidth(plain));
    expect(rectWidth(jarShadowed)).toBe(rectWidth(jarPlain));
    expect(bodyX(shadowed) - bodyX(plain)).toBeCloseTo(bodyX(jarShadowed) - bodyX(jarPlain), 6);
  });
});
