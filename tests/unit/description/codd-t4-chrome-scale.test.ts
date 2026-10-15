/**
 * codd-T4: `TextBlockExporter#exportTo` (`core/TextBlockExporter.java:159-177`)
 * draws the chrome-composed block through ONE `UGraphic` scaled by
 * `computeScaleFactor(calculateFinalDimension())` (`:204-208`, `scale` times
 * `skinparam dpi / 96`), so a title is scaled with the body
 * (`unknown/deroxu-29-gude369`: `skinparam dpi 60`, `font-size="8.75"`).
 * The description chrome path composed the title around an already-scaled
 * (or, for the chromed fragment, unscaled) klimt document and dropped the
 * factor. Expected values are jar renders of the same sources
 * (`scripts/oracle-render.sh`).
 */
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(body: string): string {
  return renderSync(`@startuml\n${body}\n@enduml`, { measurer: new DeterministicMeasurer() });
}

function rootAttributes(svg: string): string {
  const m = /<svg[^>]* style="([^"]*)" width="([^"]*)" height="([^"]*)" viewBox="([^"]*)"/.exec(svg);
  return `${m?.[1]} | ${m?.[2]} ${m?.[3]} | ${m?.[4]}`;
}

describe('codd-T4 scale and dpi are applied after chrome', () => {
  it('skinparam dpi 60 with a title scales the title, the body and the canvas', () => {
    const svg = render('title T\nskinparam dpi 60\n[a] --> [b]');
    expect(rootAttributes(svg)).toBe('width:42px;height:127px;background:#FFFFFF; | 42.5px 127.5px | 0 0 42 127');
    expect(svg).toContain('<text x="16.629" y="13.056" fill="#000" font-size="8.75" font-weight="700">T</text>');
    expect(svg).toContain('<rect x="4.375" y="26.25" width="29.867" height="27.5"');
  });

  it('a degenerate single leaf under a title takes the same factor', () => {
    const svg = render('title T\nskinparam dpi 60\n[a]');
    expect(rootAttributes(svg)).toBe('width:41px;height:61px;background:#FFFFFF; | 41.875px 61.875px | 0 0 41 61');
    expect(svg).toContain('<text x="16.316" y="13.056" fill="#000" font-size="8.75" font-weight="700">T</text>');
  });

  it('centres a title over the margin-less degenerate block (EntityImageDegenerated), not the margined canvas', () => {
    const svg = render('title T\n[a]');
    expect(rootAttributes(svg)).toBe('width:67px;height:99px;background:#FFFFFF; | 67px 99px | 0 0 67 99');
    expect(svg).toContain('<text x="26.106" y="20.889" fill="#000" font-size="14" font-weight="700">T</text>');
  });

  it('a "scale 2" directive with a title scales the chromed canvas', () => {
    const svg = render('title T\nscale 2\n[a] --> [b]');
    expect(rootAttributes(svg)).toBe('width:136px;height:408px;background:#FFFFFF; | 136px 408px | 0 0 136 408');
    expect(svg).toContain('<text x="53.213" y="41.778" fill="#000" font-size="28" font-weight="700">T</text>');
  });

  it('leaves an unchromed dpi document where renderDescription scaled it', () => {
    expect(rootAttributes(render('skinparam dpi 60\n[a] --> [b]'))).toBe(
      'width:42px;height:105px;background:#FFFFFF; | 42.5px 105.625px | 0 0 42 105',
    );
  });
});
