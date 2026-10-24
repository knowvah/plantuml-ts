/**
 * sdd3-T3b: a sequence document is exported through the ONE
 * `TextBlockExporter#exportTo` tail, so chrome (title, sprite, header, footer)
 * and body share a single scale factor derived from the CHROMED dimension:
 * `UgDiagram.java:128` adds the chrome, `TextBlockExporter.java:160,165`
 * reads `calculateFinalDimension()` of THAT block, and `computeScaleFactor`
 * (`:205-209`) is `scale.getScale(dim.w, dim.h) * dpi / 96`.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';

const TITLE = 'title A much longer title here';
const BODY = 'Bob -> Alice : hi';
/** The unscaled `<text font-size>` of the title and a participant name (`font-size 14`). */
const BASE_FONT_SIZE = 14;

function render(...lines: string[]): string {
  return renderSync(['@startuml', ...lines, '@enduml'].join('\n'), { measurer: new DeterministicMeasurer() });
}

function fontSizes(svg: string): number[] {
  return [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
}

function canvasWidth(svg: string): number {
  const m = /viewBox="0 0 (\d+) \d+"/.exec(svg);
  if (m === null) throw new Error('no viewBox');
  return Number(m[1]);
}

describe('sequence export scale is derived from the chromed dimension', () => {
  it('`scale 100 width` with a wide title: one factor for title and body, from the chromed width', () => {
    const unscaled = render(TITLE, BODY);
    // `(int)(dim + 1)` of the chromed, margined block (`SvgGraphics.java:129-135`).
    const chromedCanvas = canvasWidth(unscaled);
    const scaled = render('scale 100 width', TITLE, BODY);
    const [titleSize, ...bodySizes] = fontSizes(scaled);
    const factor = (titleSize ?? 0) / BASE_FONT_SIZE;
    // ScaleWidth.java:46-48: `maxWidth / width`, width = the chromed dimension in (canvas - 1, canvas].
    expect(factor).toBeGreaterThan(100 / chromedCanvas);
    expect(factor).toBeLessThanOrEqual(100 / (chromedCanvas - 1));
    // Chrome and body share it: every participant name is drawn at the title's size.
    expect(bodySizes.slice(0, 4)).toEqual([titleSize, titleSize, titleSize, titleSize]);
    // The canvas is `(int)(dim + 1) * factor` (`SvgGraphics.java:800-813`) -- not the unchromed body's.
    const rootWidth = Number(/<svg [^>]*? width="([\d.]+)px"/.exec(scaled)?.[1]);
    expect(rootWidth).toBeCloseTo(chromedCanvas * factor, 0);
    // The jar's `scale 100 width` canvas is ~100 wide; the unchromed body's factor would give ~0.88 * the width.
    expect(rootWidth).toBeCloseTo(100, 0);
  });

  it('`scale 2` multiplies the chromed canvas: title and body both at 28', () => {
    const unscaled = render(TITLE, BODY);
    const scaled = render('scale 2', TITLE, BODY);
    expect(canvasWidth(scaled)).toBe(canvasWidth(unscaled) * 2);
    expect(new Set(fontSizes(scaled).slice(0, 5))).toEqual(new Set([28]));
  });

  it('`skinparam dpi 192` scales chrome and body by dpi / 96 = 2 (:208)', () => {
    const scaled = render('skinparam dpi 192', TITLE, BODY);
    expect(canvasWidth(scaled)).toBe(canvasWidth(render(TITLE, BODY)) * 2);
    expect(new Set(fontSizes(scaled).slice(0, 5))).toEqual(new Set([28]));
  });
});
