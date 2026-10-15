/**
 * codd-T4: `TextBlockExporter.Builder#calculateMargin`
 * (`core/TextBlockExporter.java:510-516`): the merged `{root, document}`
 * style's `Margin` when it has one, else `getDefaultMargins()`
 * (`CucaDiagram.java:741-745`, `(0, 5, 5, 0)`). `exportTo` translates the
 * drawing by `(margin.left, margin.top)` and `calculateFinalDimension` adds
 * both sides (`TextBlockExporter.java:159-176,198-203`). Expected canvases and
 * positions are the pinned jar's, rendered from the same sources
 * (`scripts/oracle-render.sh`); `component/zosuje-43-zebi775` and
 * `unknown/rufopi-30-roro642` carry the same style in the corpus.
 */
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const DOCUMENT_MARGIN = '<style>\ndocument {\n  Margin 10 20 30 40\n}\n</style>\n';
const ROOT_MARGIN_ZERO = '<style>\nroot {\n  Margin 0\n}\n</style>\n';

function render(body: string): string {
  return renderSync(`@startuml\n${body}\n@enduml`, { measurer: new DeterministicMeasurer() });
}

function canvas(svg: string): { width: number; height: number } {
  const m = /<svg[^>]* width="(\d+)px" height="(\d+)px"/.exec(svg);
  return { width: Number(m?.[1]), height: Number(m?.[2]) };
}

function firstEntityRect(svg: string): { x: number; y: number } {
  const m = /<rect x="([\d.]+)" y="([\d.]+)" width="47\.787"/.exec(svg);
  return { x: Number(m?.[1]), y: Number(m?.[2]) };
}

describe('codd-T4 document style Margin', () => {
  it('a four-sided document Margin moves the drawing and grows the canvas (svek body)', () => {
    const svg = render(`${DOCUMENT_MARGIN}[a] --> [b]`);
    expect(canvas(svg)).toEqual({ width: 123, height: 204 });
    expect(firstEntityRect(svg)).toEqual({ x: 47, y: 17 });
  });

  it('applies to the degenerate single-leaf path as well', () => {
    const svg = render(`${DOCUMENT_MARGIN}[a]`);
    expect(canvas(svg)).toEqual({ width: 122, height: 99 });
    expect(firstEntityRect(svg)).toEqual({ x: 47, y: 17 });
  });

  it('is the margin the chrome is composed inside (title)', () => {
    const svg = render(`${DOCUMENT_MARGIN}[a] --> [b]\ntitle T`);
    expect(canvas(svg)).toEqual({ width: 140, height: 269 });
    expect(firstEntityRect(svg)).toEqual({ x: 55.394, y: 82 });
  });

  it('root Margin 0 removes the cuca default right/bottom margin', () => {
    const svg = render(`${ROOT_MARGIN_ZERO}[a] --> [b]`);
    expect(canvas(svg)).toEqual({ width: 63, height: 164 });
    expect(firstEntityRect(svg)).toEqual({ x: 7, y: 7 });
  });

  it('keeps the cuca default (0, 5, 5, 0) when no style declares a Margin', () => {
    expect(canvas(render('[a] --> [b]'))).toEqual({ width: 68, height: 169 });
  });
});
