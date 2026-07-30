/**
 * EntityImageDescriptionSupport.test.ts — T7 (`plans/svg-sprite-nanoparser/
 * batch-2/`): `drawAtoms`'s `drawable` branch.
 *
 * `drawAtoms` is private (not exported); every test here drives it
 * indirectly through the exported `buildTextBlock`, the same pattern
 * `tests/unit/creole-img-render.test.ts` already establishes for the
 * `image` variant. `resolveAtomImage` is a plain function under test
 * control, so it can return ADR-2's `drawable` variant even though no
 * production producer builds one until T9 (`plans/svg-sprite-nanoparser/
 * batch-4/`) — see that mission's README for why this batch's branch is
 * unreachable from any fixture.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java#drawU
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Footprint.java#drawPath
 */
import { describe, expect, test } from 'vitest';
import { buildTextBlock } from '../../../../../src/core/svek/image/EntityImageDescriptionSupport.js';
import type { AtomImageResolver, InlineAtomToken } from '../../../../../src/core/creole-atoms.js';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';
import { UPath } from '../../../../../src/core/klimt/shape/UPath.js';
import { UGraphicSvg } from '../../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import { encodePng, toBase64DataUri } from '../../../../../src/core/klimt/sprite/png-encoder.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
const measurer = new DeterministicMeasurer();

const driverBounder: DriverStringBounder = {
  calculateDimension(font, text) {
    return { width: measurer.measure(text, font).width };
  },
};

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driverBounder, measurer);
}

/** A tiny deterministic PNG data URI, only used to give `<img:...>` markup
 *  something to parse into an `InlineAtomToken` -- the resolver under test
 *  ignores the token's own dims entirely and returns its own fixed geometry. */
const TINY_PNG_URI = toBase64DataUri(encodePng(new Uint8Array(2 * 2 * 4).fill(0xff), 2, 2));

/** DECLARED box is 16x16; the two primitives' own ink is a small 1..5 square
 *  (4x4) -- deliberately much smaller than the declared box, so a test that
 *  asserts the cursor advanced by ink (4) instead of the declared width (16)
 *  fails loudly. */
const DECLARED_WIDTH = 16;
const DECLARED_HEIGHT = 16;

function inkSquarePath(): UPath {
  const p = UPath.none();
  p.moveTo(1, 1);
  p.lineTo(5, 1);
  p.lineTo(5, 5);
  p.lineTo(1, 5);
  return p;
}

function inkDotPath(): UPath {
  const p = UPath.none();
  p.moveTo(2, 2);
  p.lineTo(3, 3);
  return p;
}

function drawableResolver(primitives: UPath[]): AtomImageResolver {
  return (_atom: InlineAtomToken) => ({
    kind: 'drawable',
    primitives,
    width: DECLARED_WIDTH,
    height: DECLARED_HEIGHT,
  });
}

function pathDs(svg: string): string[] {
  return [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]!);
}

describe('drawAtoms — the `drawable` variant (T7, ADR-2)', () => {
  test('draws each UPath primitive as its own <path> element, at the atom origin', () => {
    const ug = newGraphic();
    const resolve = drawableResolver([inkSquarePath(), inkDotPath()]);
    buildTextBlock(`<img:${TINY_PNG_URI}>`, FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const svg = ug.getSvgString();

    const ds = pathDs(svg);
    expect(ds).toHaveLength(2);
    // The atom is the line's only content (LEFT align => origin.x = 0,
    // origin.y = 0 for a single line) -- each primitive's own local
    // coordinates pass through untranslated.
    expect(ds[0]).toBe('M1,1 L5,1 L5,5 L1,5');
    expect(ds[1]).toBe('M2,2 L3,3');
    expect(svg).not.toContain('<image');
  });

  test('emits NO <image> element for a drawable atom -- the image branch is untouched', () => {
    const ug = newGraphic();
    const resolve = drawableResolver([inkSquarePath()]);
    buildTextBlock(`<img:${TINY_PNG_URI}>`, FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    expect(ug.getSvgString()).not.toContain('<image');
  });

  test('cursor advances by the DECLARED width (16), never by ink extent (4) -- the defect this task fixes', () => {
    const ug = newGraphic();
    const resolve = drawableResolver([inkSquarePath()]);
    // Two drawable atoms back to back: the second atom's own primitive,
    // drawn untranslated in its LOCAL coordinate space, must land at
    // DECLARED_WIDTH + its own local x -- not ink-width + local x.
    buildTextBlock(`<img:${TINY_PNG_URI}><img:${TINY_PNG_URI}>`, FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const ds = pathDs(ug.getSvgString());
    expect(ds).toHaveLength(2);
    expect(ds[0]).toBe('M1,1 L5,1 L5,5 L1,5');
    // Second atom's translate is DECLARED_WIDTH (16), not the ink width (4):
    // local x=1 lands at 16+1=17, not 4+1=5.
    expect(ds[1]).toBe('M17,1 L21,1 L21,5 L17,5');
  });

  test('calculateDimension reports the DECLARED width, matching drawU\'s own advance', () => {
    const resolve = drawableResolver([inkSquarePath()]);
    const bounder = new MeasurerStringBounder(measurer);
    const dim = buildTextBlock(`<img:${TINY_PNG_URI}>`, FONT, HorizontalAlignment.LEFT, resolve).calculateDimension(
      bounder,
    );
    expect(dim.getWidth()).toBe(DECLARED_WIDTH);
  });

  test('two-line display: line 2 stacks on the DECLARED height (16), not the ink height (4)', () => {
    const ug = newGraphic();
    const resolve = drawableResolver([inkSquarePath()]);
    buildTextBlock(`<img:${TINY_PNG_URI}>\n<img:${TINY_PNG_URI}>`, FONT, HorizontalAlignment.LEFT, resolve).drawU(
      ug,
    );
    const ds = pathDs(ug.getSvgString());
    expect(ds).toHaveLength(2);
    expect(ds[0]).toBe('M1,1 L5,1 L5,5 L1,5');
    // Line 2's own translate.y is DECLARED_HEIGHT (16), not the ink height
    // (4): local y=1 lands at 16+1=17, not 4+1=5.
    expect(ds[1]).toBe('M1,17 L5,17 L5,21 L1,21');

    const bounder = new MeasurerStringBounder(measurer);
    const dim = buildTextBlock(
      `<img:${TINY_PNG_URI}>\n<img:${TINY_PNG_URI}>`,
      FONT,
      HorizontalAlignment.LEFT,
      resolve,
    ).calculateDimension(bounder);
    expect(dim.getHeight()).toBe(DECLARED_HEIGHT * 2);
  });

  test('an `image` atom (monochrome sprite / <img> / LaTeX) is unaffected -- still emits <image>, not <path>', () => {
    const ug = newGraphic();
    const resolve: AtomImageResolver = () => ({ kind: 'image', href: TINY_PNG_URI, width: 8, height: 8 });
    buildTextBlock(`<img:${TINY_PNG_URI}>`, FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const svg = ug.getSvgString();
    expect(svg).toContain('<image');
    expect(pathDs(svg)).toHaveLength(0);
  });

  test('a drawable atom with zero primitives draws nothing but still advances the cursor by the declared width', () => {
    const ug = newGraphic();
    const resolve = drawableResolver([]);
    buildTextBlock(`<img:${TINY_PNG_URI}>X`, FONT, HorizontalAlignment.LEFT, resolve).drawU(ug);
    const svg = ug.getSvgString();
    expect(pathDs(svg)).toHaveLength(0);
    // "X" (the trailing text run) is translated past the declared width.
    expect(svg).toContain(`x="${DECLARED_WIDTH}"`);
  });
});
