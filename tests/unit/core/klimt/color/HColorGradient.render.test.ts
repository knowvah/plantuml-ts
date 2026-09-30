/**
 * A gradient node `BackgroundColor` (`#cc33cc-#0c33ac`) drawn through the
 * mindmap engine: `FtileBoxOld#drawU`'s `ug.apply(backColor.bg())`
 * (FtileBoxOld.java) reaching `DriverRectangleSvg`'s `HColorGradient` arm
 * (DriverRectangleSvg.java:87-90), against the jar's cached
 * `vacofo-66-puno159` golden.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WidthTableMeasurer } from '../../../../../src/core/measurer.js';
import { renderSync } from '../../../../../src/index.js';

const VACOFO_DIR = 'test-results/dot-cache/mindmap/vacofo-66-puno159';

describe('vacofo-66-puno159: a gradient node BackgroundColor draws the jar def', () => {
  const golden = readFileSync(`${VACOFO_DIR}/in.svg`, 'utf8');
  const svg = renderSync(readFileSync(`${VACOFO_DIR}/in.puml`, 'utf8'), { measurer: new WidthTableMeasurer() });
  const gradientDef = (s: string): string | undefined => /<linearGradient[^>]*>.*?<\/linearGradient>/.exec(s)?.[0];
  const urlFills = (s: string): string[] => [...s.matchAll(/fill="(url\([^"]*\))"/g)].map((m) => m[1] as string);

  it('the <linearGradient> def equals the golden byte for byte', () => {
    expect(gradientDef(golden)).toBe(
      '<linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="g17vc0uq9epmht0"><stop stop-color="#C3C" offset="0%"/><stop stop-color="#0C33AC" offset="100%"/></linearGradient>',
    );
    expect(gradientDef(svg)).toBe(gradientDef(golden));
  });

  it('the two gradient-filled boxes reference it, as the golden does', () => {
    expect(urlFills(svg)).toEqual(['url(#g17vc0uq9epmht0)', 'url(#g17vc0uq9epmht0)']);
    expect(urlFills(svg)).toEqual(urlFills(golden));
  });
});
