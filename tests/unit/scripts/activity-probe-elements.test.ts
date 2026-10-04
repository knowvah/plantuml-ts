/**
 * Unit tests for `scripts/activity-probe-elements.ts`'s pure functions
 * (mission `activity-divergence-drive-2`, T0a). Inline SVG pairs only; the
 * render/CLI path is exercised by the b0 run recorded in the mission ledger.
 */
import { describe, it, expect } from 'vitest';
import {
  tagCounts,
  elementDelta,
  shapeClassOf,
  summarize,
  type ElementRow,
} from '../../../scripts/activity-probe-elements.js';

const LINE = '<line x1="0" y1="0" x2="0" y2="10"/>';
const ARROW = '<polygon points="0,0 4,4 0,8"/>';
const TEXT = '<text x="1" y="2">a</text>';
const RECT = '<rect x="0" y="0" width="5" height="5"/>';

function svg(...body: string[]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg"><g>${body.join('')}</g></svg>`;
}

describe('tagCounts', () => {
  it('counts every census tag, nested included, zero for absent tags', () => {
    expect(tagCounts(svg(LINE, LINE, ARROW, `<g>${TEXT}</g>`))).toEqual({
      rect: 0,
      polygon: 1,
      line: 2,
      path: 0,
      ellipse: 0,
      text: 1,
    });
  });
});

describe('elementDelta', () => {
  it('reports ours minus jar per tag, omitting zero entries', () => {
    expect(elementDelta(svg(RECT, LINE, LINE, ARROW, ARROW), svg(RECT, LINE, ARROW, TEXT))).toEqual({
      line: 1,
      polygon: 1,
      text: -1,
    });
  });

  it('is empty when both sides draw the same counts', () => {
    expect(elementDelta(svg(RECT, LINE), svg(LINE, RECT))).toEqual({});
  });
});

describe('shapeClassOf', () => {
  it.each([
    [{}, 'exact'],
    [{ line: 2, polygon: 2 }, 'extra line+arrow'],
    [{ line: 1, polygon: 2, text: -4 }, 'extra line+arrow'],
    [{ polygon: 1 }, 'extra arrow only'],
    [{ line: 2 }, 'extra line only'],
    [{ line: -4, polygon: -1 }, 'missing line+arrow'],
    [{ text: -2 }, 'text-only'],
    [{ line: -5 }, 'mixed'],
    [{ line: 1, polygon: -1 }, 'mixed'],
    [{ rect: 1, text: 1 }, 'mixed'],
  ] as const)('%j -> %s', (delta, expected) => {
    expect(shapeClassOf(delta)).toBe(expected);
  });
});

describe('summarize', () => {
  it('counts rows and sums ws per class and overall', () => {
    const rows: ElementRow[] = [
      { slug: 'a', ws: 10, delta: { line: 1, polygon: 1 } },
      { slug: 'b', ws: 5, delta: { line: 2, polygon: 1 } },
      { slug: 'c', ws: 3, delta: {} },
    ];
    const s = summarize(rows);
    expect(s.rows).toBe(3);
    expect(s.ws).toBe(18);
    expect(s.classes['extra line+arrow']).toEqual({ count: 2, ws: 15 });
    expect(s.classes.exact).toEqual({ count: 1, ws: 3 });
    expect(s.classes.mixed).toEqual({ count: 0, ws: 0 });
  });
});
