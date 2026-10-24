/**
 * sdd3-T2d -- end to end: `<style> document { Margin ... } </style>` reaches
 * the sequence exporter margin (`core/TextBlockExporter.java:510-516`).
 * Expected canvases and positions are jar output of `Bob -> Alice : hello`
 * (`scripts/oracle-render.sh`); see `renderer-document-margin.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const MEASURER = new DeterministicMeasurer();
const HELLO = 'Bob -> Alice : hello';

function render(margin: string | undefined, ...lines: string[]): string {
  const style = margin === undefined ? [] : ['<style>', 'document {', `  Margin ${margin}`, '}', '</style>'];
  return renderFixtureSequence(['@startuml', ...lines, ...style, HELLO, '@enduml'].join('\n'), MEASURER);
}

function canvas(svg: string): string {
  return /style="width:(\d+)px;height:(\d+)px;/.exec(svg)?.slice(1).join('x') ?? '';
}

describe('sequence document Margin style (TextBlockExporter.java:510-516)', () => {
  it('no style margin keeps the 114 x 124 canvas', () => {
    expect(canvas(render(undefined))).toBe('114x124');
  });

  it('Margin 10 renders the jar canvas 124 x 134 and moves the lifeline hit rect to (82.663, 44)', () => {
    const svg = render('10');
    expect(canvas(svg)).toBe('124x134');
    expect(svg).toContain('<rect x="82.663" y="44" width="8" height="45"');
  });

  it('Margin "2 7 11 3" renders 114 x 127 with the hit rect at (75.663, 36)', () => {
    const svg = render('2 7 11 3');
    expect(canvas(svg)).toBe('114x127');
    expect(svg).toContain('<rect x="75.663" y="36" width="8" height="45"');
  });

  it('scale 2 + Margin 10 renders 248 x 268 with the hit rect at (165.325, 88)', () => {
    const svg = render('10', 'scale 2');
    expect(canvas(svg)).toBe('248x268');
    expect(svg).toContain('<rect x="165.325" y="88" width="16" height="90"');
  });
});
