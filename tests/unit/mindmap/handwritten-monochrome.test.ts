/**
 * The mindmap export's `handwritten` and `monochrome` arms against the jar's
 * cached goldens (`test-results/dot-cache/mindmap/<slug>/in.svg`).
 *
 * `handwritten` is exercised by drawing `MindMapDiagram#getTextBlock`
 * through `UGraphicHandwritten` exactly as `TextBlockExporter#exportTo` does
 * (margin translate, then the decorator, java:173-175) — the export does not
 * wire it yet, because both goldens also need the deprecation banner (below)
 * that the port's chrome does not draw.
 *
 * - `handwritten`: `TextBlockExporter#exportTo` wraps the export graphic in
 *   `UGraphicHandwritten` (TextBlockExporter.java:174-175), whose `apply`
 *   builds a NEW decorator with a fresh `new Random(424242L)`
 *   (UGraphicHandwritten.java:54,114-116) — so every node box becomes the
 *   same-seeded `URectangleHand` polygon and every link the same-seeded
 *   `UPathHand` polyline.
 * - `monochrome true`: `TitledDiagram#muteColorMapper` → `ColorMapper.MONOCHROME`
 *   (TitledDiagram.java:291-297), which the SVG background passes through
 *   (`backcolor.toSvg(option.getColorMapper())`, SvgGraphics.java:187-188).
 *
 * Both goldens also carry the `skinparam handwritten` deprecation banner
 * (CommandSkinParam.java:92-93 → DiagramChromeFactory.java:176-200), drawn
 * ABOVE the diagram, which shifts every diagram shape down by the banner
 * height. The banner is not this export path; the shapes are compared with
 * that shift removed. `BANNER_HEIGHT` is `WarningBannerBlock#calculateDimension`
 * (DiagramChromeFactory.java:252-266): one monospace-10 line (the golden's
 * banner text baseline sits at y 22 = margin 10 + translate 2 + line 10)
 * plus 10 — then times the dpi factor `300 / 96` (TextBlockExporter.java:207)
 * for `zirabo`.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { UGraphicHandwritten } from '../../../src/core/klimt/drawing/hand/UGraphicHandwritten.js';
import { basicSvgOption } from '../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { Rankdir } from '../../../src/core/klimt/geom/Rankdir.js';
import { renderSync } from '../../../src/index.js';
import { parseMindMap } from './helpers/mindmap-skin.js';

const measurer = new WidthTableMeasurer();
/** `TitledDiagram#getDefaultMargins` = `same(10)` (TitledDiagram.java:274-277). */
const MARGIN = 10;

/** DiagramChromeFactory.java:252-266 at dpi 96 (see the module doc). */
const BANNER_HEIGHT = 20;
/** `skinparam dpi 300` / 96 (TextBlockExporter.java:207). */
const ZIRABO_DPI_FACTOR = 300 / 96;

function fixture(slug: string): { markup: string; golden: string } {
  const dir = `test-results/dot-cache/mindmap/${slug}`;
  return { markup: readFileSync(`${dir}/in.puml`, 'utf8'), golden: readFileSync(`${dir}/in.svg`, 'utf8') };
}

/** Every `<path d>` / `<polygon points>` value, in document order. */
function shapes(svg: string): string[] {
  return [...svg.matchAll(/<(?:path d|polygon points)="([^"]*)"/g)].map((m) => m[1]!);
}

/** The numbers of one `d`/`points` value. */
function numbers(value: string): number[] {
  return [...value.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
}

/**
 * Our shapes against the golden's (banner polygon dropped), golden y moved
 * up by `dy`. Tolerance 0.001: both sides are rounded to 3 decimals BEFORE
 * the shift, so an exact half (zirabo's y 107.1875 = 169.6875 − 62.5)
 * rounds on different sides of the tie — one unit in the last place.
 */
function expectShapesShifted(ours: string, golden: string, dy: number): void {
  const actual = shapes(ours).map(numbers);
  const expected = shapes(golden).slice(1).map(numbers);
  expect(actual.map((a) => a.length)).toEqual(expected.map((e) => e.length));
  actual.forEach((a, k) =>
    a.forEach((v, i) => {
      const e = expected[k]![i]! - (i % 2 === 1 ? dy : 0);
      expect(
        Math.abs(v - e),
        `shape ${String(k)} number ${String(i)}: ${String(v)} vs ${String(e)}`,
      ).toBeLessThanOrEqual(0.001 + 1e-9);
    }),
  );
}

/** The text block drawn at the margin through `UGraphicHandwritten`, at the
 *  dpi `scale` (TextBlockExporter.java:165-175). */
function drawHandwritten(markup: string, scale: number): string {
  const diagram = parseMindMap(markup, Rankdir.LEFT_TO_RIGHT);
  const driver = {
    calculateDimension: (font: { family: string; size: number }, text: string) => measurer.measure(text, font),
  };
  const ug = UGraphicSvg.build(0, basicSvgOption({ scale }), '$version$', driver, measurer);
  diagram.getTextBlock().drawU(new UGraphicHandwritten(ug.apply(new UTranslate(MARGIN, MARGIN))));
  return ug.getSvgString();
}

describe('mindmap handwritten drawing (zature-18-vidu755)', () => {
  const { markup, golden } = fixture('zature-18-vidu755');
  const ours = drawHandwritten(markup, 1);

  it('draws node boxes as hand polygons and links as hand polylines, in the golden order', () => {
    // golden: banner polygon, then root/first/link/second/link.
    expect(shapes(ours)).toHaveLength(5);
    expectShapesShifted(ours, golden, BANNER_HEIGHT);
  });

  it('the root link starts with the jar jiggle of Random(424242)', () => {
    const link = /<path d="([^"]*)"/.exec(ours)?.[1] ?? '';
    expect(link.startsWith('M54.063,64 L54.063,64.187 L56.063,63.632 L58.063,64.172')).toBe(true);
  });

  it('draws no <rect>: every node box is a polygon', () => {
    expect([...ours.matchAll(/<rect /g)]).toHaveLength(0);
  });
});

describe('mindmap monochrome export (zirabo-51-lera821)', () => {
  const { markup, golden } = fixture('zirabo-51-lera821');
  const rendered = renderSync(markup, { measurer });

  it('maps the #EEEBDC background through ColorMapper.MONOCHROME to the golden #EAEAEA', () => {
    const goldenBackground = /background:(#[0-9A-F]+);/.exec(golden)?.[1];
    expect(goldenBackground).toBe('#EAEAEA');
    expect(/background:(#[0-9A-F]+);/.exec(rendered)?.[1]).toBe(goldenBackground);
    expect(/<rect [^>]*fill="(#[0-9A-F]+)"/.exec(rendered)?.[1]).toBe(goldenBackground);
  });
});

describe('mindmap handwritten drawing at dpi 300 (zirabo-51-lera821)', () => {
  const { markup, golden } = fixture('zirabo-51-lera821');
  const ours = drawHandwritten(markup, ZIRABO_DPI_FACTOR);

  it('keeps the grey node fills #F1F1F1 / #AAA the golden draws', () => {
    const fills = [...ours.matchAll(/<polygon [^>]*fill="(#[0-9A-F]+)"/g)].map((m) => m[1]);
    expect(fills).toEqual(['#F1F1F1', '#F1F1F1', '#AAA']);
  });

  it('draws the golden hand shapes', () => {
    expect(shapes(ours)).toHaveLength(5);
    expectShapesShifted(ours, golden, BANNER_HEIGHT * ZIRABO_DPI_FACTOR);
  });
});

describe('mindmap monochrome reverse export (authored)', () => {
  // Jar value from `scripts/oracle-render.sh` over this exact source
  // (1.2026.8beta1): `background:#151515` = 255 − grey(#EEEBDC)
  // (ColorMapper.java:86-91, ColorUtils.java:72-75).
  const markup =
    '@startmindmap\nskinparam backgroundColor #EEEBDC\nskinparam monochrome reverse\n* root\n** first\n@endmindmap\n';

  it('maps the background through ColorMapper.MONOCHROME_REVERSE', () => {
    const rendered = renderSync(markup, { measurer });
    expect(/background:(#[0-9A-F]+);/.exec(rendered)?.[1]).toBe('#151515');
  });

  it('`monochrome` is case-sensitive ("true".equals, TitledDiagram.java:296): TRUE maps nothing', () => {
    const rendered = renderSync(markup.replace('monochrome reverse', 'monochrome TRUE'), { measurer });
    expect(/background:(#[0-9A-F]+);/.exec(rendered)?.[1]).toBe('#EEEBDC');
  });
});
