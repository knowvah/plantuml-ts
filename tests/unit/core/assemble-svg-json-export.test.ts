/**
 * jff-T2a (decisions.md D1): the json/yaml/hcl finalize runs the
 * `TextBlockExporter#exportTo` tail when the producer hands over its RAW
 * chromed block (`RenderFragment.exportMargin`). Synthetic fragments only --
 * no renderer sets `exportMargin` yet (T2b does).
 *
 * Upstream path (`UgDiagram.java:123-139`): `getTextBlock` (`JsonDiagram
 * .java:140-142`, `this`), `addChrome` (`:128`), `TextBlockUtils.addBackcolor`
 * (`:130-132`) -- which draws nothing; it only carries the colour
 * (`TextBlockUtils.java:152-174`) into `TextBlockExporter.Builder`
 * (`TextBlockExporter.java:427-428`, `:491`) -- then `exportTo`
 * (`TextBlockExporter.java:159-177`):
 *
 * - `dim = calculateFinalDimension()` = block + margin (`:199-203`);
 * - `factor = scale.getScale(dim.w, dim.h) * dpi / 96` (`:205-209`), dpi 96
 *   for json (D5: `StyleExtractor` drops `skinparam dpi`);
 * - `createUGraphic(dim, factor)` (`:169`, `:281-286`): `SvgGraphics`'
 *   constructor runs `ensureVisible(minDim)` (`SvgGraphics.java:142-143`,
 *   `maxX = (int)(x + 1)`, `:129-135`) and paints the back colour
 *   (`:176-192`, `paintBackcolor` `:207-212`) as the root `<g>`'s first
 *   child, at (0,0), BEFORE the margin translate (`TextBlockExporter.java:173`);
 * - the block is drawn translated by (left, top) (`:173`, `:177`), every
 *   number `format`-ed times the scale (`SvgGraphics.java:468-475`);
 * - `finalizeRootAttributes` writes the root and the back-colour rect as
 *   `format(maxX)` x `format(maxY)` (`SvgGraphics.java:800-822`).
 *
 * Jar check of the back-colour rule (scratch oracles, `scripts/oracle-render
 * .sh`, `<style> jsonDiagram { document { BackgroundColor Silver } }`):
 * `scale 1.5` -> root `width="85.5px" height="60px"`, first child
 * `<rect x="0" y="0" width="85.5" height="60" fill="#C0C0C0" .../>`; `scale 2`
 * + `title foo` -> root `122px x 150px`, rect `122 x 150`, ahead of the
 * title's `<g class="title">`. The rect is the scaled CANVAS, not the block.
 */
import { describe, expect, it } from 'vitest';
import { assembleSvg } from '../../../src/core/assemble-svg.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';
import { ClockwiseTopRightBottomLeft } from '../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { ROOT_GROUP_OPEN } from '../../../src/core/svg.js';

/** `TitledDiagram#getDefaultMargins()` (`TitledDiagram.java:274-277`), the
 *  `Builder#calculateMargin` fallback (`TextBlockExporter.java:510-516`). */
const JSON_MARGIN = ClockwiseTopRightBottomLeft.same(10);
const BLOCK_W = 50.5;
const BLOCK_H = 30.25;
const INNER = '<text x="1" y="2">A</text>';
const SOLID = '#0B58A8';
const SCALE_2 = { kind: 'simple', factor: 2 } as const;

function rawBlock(overrides: Partial<RenderFragment> = {}): RenderFragment {
  return {
    body: ROOT_GROUP_OPEN + INNER + '</g>',
    width: BLOCK_W,
    height: BLOCK_H,
    bodyWrapped: true,
    exportMargin: JSON_MARGIN,
    diagramType: 'JSON',
    ...overrides,
  };
}

/** The no-chrome hand-over: the block's own primitives, no content `<g>`. */
function unwrappedBlock(overrides: Partial<RenderFragment> = {}): RenderFragment {
  const { bodyWrapped: _wrapped, ...rest } = rawBlock({ body: INNER, ...overrides });
  return rest;
}

/** The root `<svg>` open tag's `width`/`height` attribute values. */
function rootSize(svg: string): { width: string; height: string } {
  const open = /^<svg[^>]*>/.exec(svg)?.[0] ?? '';
  return {
    width: /\swidth="([^"]*)"/.exec(open)?.[1] ?? '',
    height: /\sheight="([^"]*)"/.exec(open)?.[1] ?? '',
  };
}

/** The content root `<g …>` and everything after it. */
function content(svg: string): string {
  const at = svg.indexOf(ROOT_GROUP_OPEN);
  return at === -1 ? '' : svg.slice(at);
}

function backgroundRects(svg: string): string[] {
  return svg.match(new RegExp(`<rect [^>]*fill="${SOLID}"[^>]*/>`, 'g')) ?? [];
}

describe('assembleSvg -- json exportMargin arm: dimension, factor, canvas', () => {
  it('scale 2 + same(10): canvas trunc(W + 20 + 1) x 2, body shifted (10,10) then x2', () => {
    // dim = (50.5 + 20, 30.25 + 20) = (70.5, 50.25)       TextBlockExporter.java:199-203
    // factor = ScaleSimple 2 (ScaleSimple.java:46-48), clamp (ScaleProtected.java:42-51),
    //          x 96/96 (TextBlockExporter.java:205-209)  = 2
    // maxX = (int)(70.5 + 1) = 71, maxY = (int)(50.25 + 1) = 51   SvgGraphics.java:129-135
    // root = format(maxX) = 142, format(maxY) = 102                SvgGraphics.java:810-811
    // text x = (1 + 10) * 2 = 22, y = (2 + 10) * 2 = 24            TextBlockExporter.java:173
    const svg = assembleSvg(rawBlock({ scaleSpec: SCALE_2 }));
    expect(rootSize(svg)).toEqual({ width: '142px', height: '102px' });
    expect(svg).toContain('viewBox="0 0 142 102"');
    expect(content(svg)).toBe(ROOT_GROUP_OPEN + '<text x="22" y="24">A</text></g></svg>');
  });

  it('scale max N width resolves over W + 20 (the margined, chromed dim), not over W', () => {
    // W = 100: dim.w = 100 + 20 = 120; ScaleMaxWidth(60) = min(1, 60 / 120) = 0.5
    // (ScaleMaxWidth.java:46-52). Over the bare block it would be 60 / 100 = 0.6.
    // maxX = (int)(121) = 121 -> format(121 * 0.5) = 60.5; H = 40: (int)(61) = 61 -> 30.5
    const svg = assembleSvg(rawBlock({ width: 100, height: 40, scaleSpec: { kind: 'maxWidth', target: 60 } }));
    expect(rootSize(svg)).toEqual({ width: '60.5px', height: '30.5px' });
    // text x = (1 + 10) * 0.5 = 5.5, y = (2 + 10) * 0.5 = 6
    expect(content(svg)).toContain('<text x="5.5" y="6">A</text>');
  });

  it('no scale and dpi unset: factor is exactly 1 (no dpi term, D5), canvas trunc(dim + 1)', () => {
    // factor = 1 * 96 / 96 = 1 (TextBlockExporter.java:206-208, json never sets dpi);
    // maxX = (int)(70.5 + 1) = 71, maxY = (int)(50.25 + 1) = 51
    const fragment = rawBlock();
    expect(fragment.dpi).toBeUndefined();
    const svg = assembleSvg(fragment);
    expect(rootSize(svg)).toEqual({ width: '71px', height: '51px' });
    expect(content(svg)).toBe(ROOT_GROUP_OPEN + '<text x="11" y="12">A</text></g></svg>');
  });

  it('an asymmetric margin shifts by (left, top) and grows the dim by both sides', () => {
    // margin top 1, right 2, bottom 3, left 4: dim = (50.5 + 6, 30.25 + 4) = (56.5, 34.25)
    // maxX = (int)(57.5) = 57, maxY = (int)(35.25) = 35; text at (1 + 4, 2 + 1) = (5, 3)
    const svg = assembleSvg(rawBlock({ exportMargin: ClockwiseTopRightBottomLeft.topRightBottomLeft(1, 2, 3, 4) }));
    expect(rootSize(svg)).toEqual({ width: '57px', height: '35px' });
    expect(content(svg)).toContain('<text x="5" y="3">A</text>');
  });

  it('a deferred body is formatted once, after the shift (SvgGraphics.java:468-475)', () => {
    // x = 1.23456 + 10 = 11.23456 -> format = 11.235 (HALF_UP, 3 decimals)
    const svg = assembleSvg(
      rawBlock({ body: ROOT_GROUP_OPEN + '<text x="1.23456" y="2">A</text></g>', numbersDeferred: true }),
    );
    expect(content(svg)).toContain('<text x="11.235" y="12">A</text>');
  });
});

describe('assembleSvg -- json exportMargin arm: back colour', () => {
  it('draws exactly one rect, the content first child, at (0,0) sized format(maxX) x format(maxY)', () => {
    // SvgGraphics.java:207-211 paints it at construction, before the (10,10) translate
    // (TextBlockExporter.java:169 vs :173); :819-821 sizes it to the root's 142 x 102.
    const svg = assembleSvg(rawBlock({ scaleSpec: SCALE_2, background: SOLID }));
    expect(backgroundRects(svg)).toEqual([
      `<rect x="0" y="0" width="142" height="102" fill="${SOLID}" stroke="none"/>`,
    ]);
    expect(content(svg)).toBe(
      ROOT_GROUP_OPEN +
        `<rect x="0" y="0" width="142" height="102" fill="${SOLID}" stroke="none"/>` +
        '<text x="22" y="24">A</text></g></svg>',
    );
    expect(svg).toContain(`background:${SOLID};`);
  });

  it('a non-integer scaled canvas keeps its decimals in the rect, as the root does', () => {
    // scale 1.5: maxX 71 -> 106.5, maxY 51 -> 76.5 (jar oracle: rect width 85.5 == root 85.5px)
    const svg = assembleSvg(rawBlock({ scaleSpec: { kind: 'simple', factor: 1.5 }, background: SOLID }));
    expect(rootSize(svg)).toEqual({ width: '106.5px', height: '76.5px' });
    expect(backgroundRects(svg)).toEqual([
      `<rect x="0" y="0" width="106.5" height="76.5" fill="${SOLID}" stroke="none"/>`,
    ]);
  });

  it('an unwrapped (chrome-less) body gets the content <g>, rect first', () => {
    const svg = assembleSvg(unwrappedBlock({ background: SOLID }));
    expect(content(svg)).toBe(
      ROOT_GROUP_OPEN +
        `<rect x="0" y="0" width="71" height="51" fill="${SOLID}" stroke="none"/>` +
        '<text x="11" y="12">A</text></g></svg>',
    );
  });

  it('an unwrapped body without a back colour is wrapped and shifted only', () => {
    const svg = assembleSvg(unwrappedBlock());
    expect(content(svg)).toBe(ROOT_GROUP_OPEN + '<text x="11" y="12">A</text></g></svg>');
  });

  it.each([['#FFFFFF'], ['white'], ['transparent']])('draws no rect for %s', (background) => {
    const svg = assembleSvg(rawBlock({ scaleSpec: SCALE_2, background }));
    expect(content(svg)).toBe(ROOT_GROUP_OPEN + '<text x="22" y="24">A</text></g></svg>');
  });

  it('canonicalizes a named background into the root style and the rect fill', () => {
    // `silver` -> #C0C0C0 (the jar writes `background:#C0C0C0;`, gipoxa-19-bico146)
    const svg = assembleSvg(rawBlock({ background: 'silver' }));
    expect(svg).toContain('background:#C0C0C0;');
    expect(content(svg)).toContain('<rect x="0" y="0" width="71" height="51" fill="#C0C0C0" stroke="none"/>');
  });

  it.each([['YAML'], ['HCL']])('%s takes the same arm', (diagramType) => {
    const svg = assembleSvg(rawBlock({ scaleSpec: SCALE_2, background: SOLID, diagramType }));
    expect(svg).toContain(`data-diagram-type="${diagramType}"`);
    expect(rootSize(svg)).toEqual({ width: '142px', height: '102px' });
    expect(backgroundRects(svg)).toHaveLength(1);
  });
});

describe('assembleSvg -- json without exportMargin is untouched', () => {
  it('a scaleSpec without exportMargin neither scales nor shifts (the producer already did)', () => {
    const svg = assembleSvg({
      body: INNER,
      width: 50,
      height: 30,
      scaleSpec: SCALE_2,
      background: SOLID,
      diagramType: 'JSON',
    });
    expect(rootSize(svg)).toEqual({ width: '50px', height: '30px' });
    expect(content(svg)).toBe(
      ROOT_GROUP_OPEN +
        `<rect x="0" y="0" width="50" height="30" fill="${SOLID}" stroke="none"/>` +
        INNER +
        '</g></svg>',
    );
  });
});
