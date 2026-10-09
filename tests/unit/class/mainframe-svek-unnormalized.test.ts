/**
 * mainframe-svek-unnormalized.test.ts — cdd6 T3b: under `mainframe`, the
 * class body is framed UN-normalized.
 *
 * `SvekResult#calculateDimension` is the only caller of `clusterManager
 * .moveDelta(6 - minX, 6 - minY)` (`svek/SvekResult.java:130-135`), and the
 * mainframe wrapper never calls it (`core/DiagramChromeFactory.java:278-337`
 * sizes through `frame.calculateDimension` only). `BigFrame` sizes the body
 * from the raw LimitFinder extent (`klimt/shape/BigFrame.java:80,88`: `ww =
 * minX >= 0 ? maxX : width`) and `decorateWithFrame` draws the body at
 * `margin + padding + delta` (`:301`, `computeDelta` `:332-337`).
 *
 * `unknown/rivino-95-midu088`: jar body `a` rect at (11, 43), `b` at y 151,
 * frame rect height 204, canvas 158x230 (`test-results/dot-cache/unknown/
 * rivino-95-midu088/in.svg`) — raw svek a (0, 8), b (0, 116).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const measurer = new DeterministicMeasurer();

const RIVINO = ['@startuml', 'mainframe This is a **mainframe**', '', 'a -- b', '@enduml'].join('\n');

function entityRect(svg: string, name: string): { x: number; y: number } {
  const m = new RegExp(`data-qualified-name="${name}"[^>]*><rect x="([\\d.]+)" y="([\\d.]+)"`).exec(svg);
  if (m === null) throw new Error(`no entity rect for ${name}`);
  return { x: Number(m[1]), y: Number(m[2]) };
}

describe('mainframe frames the raw svek body (SvekResult.java:130-135 never runs)', () => {
  it('unknown/rivino-95: bodies at the raw svek coordinates plus margin + padding + delta', () => {
    const svg = renderSync(RIVINO, { measurer });
    expect(entityRect(svg, 'a')).toEqual({ x: 11, y: 43 });
    expect(entityRect(svg, 'b')).toEqual({ x: 11, y: 151 });
  });

  it('unknown/rivino-95: frame height = 25 + 14 + raw maxY 164 + 1, canvas 158x230', () => {
    const svg = renderSync(RIVINO, { measurer });
    expect(svg).toMatch(/<rect x="5" y="10" width="142\.063" height="204"/);
    expect(svg).toContain('width="158px" height="230px"');
  });

  it('without a mainframe the body is still moveDelta-normalized (rect at 7, 7)', () => {
    const svg = renderSync(['@startuml', 'a -- b', '@enduml'].join('\n'), { measurer });
    expect(entityRect(svg, 'a')).toEqual({ x: 7, y: 7 });
  });
});
