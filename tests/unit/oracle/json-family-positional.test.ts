import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  PIN_EPSILON,
  checkRow,
  conformantRows,
  hasStructuralDiff,
  listCachedRows,
  measureResidue,
  measureSvgResidue,
  readPin,
  toPinRow,
} from '../../oracle/svg-conformance/json-family-positional.js';
import type { PositionalResidue } from '../../oracle/svg-conformance/json-family-positional.js';

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const svg = (body: string, w = 100, h = 50): string =>
  `<svg ${NS} width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}"><g>${body}</g></svg>`;
const rect = (x: number, extra = ''): string => `<rect x="${x}" y="10" width="20" height="8" fill="#fff"${extra}/>`;
const path = (d: string): string => `<path d="${d}" fill="none"/>`;

const aligned = (nodeMax: number, pathMax: number, dw = 0, dh = 0): PositionalResidue => ({
  aligned: true,
  nodeMax,
  pathMax,
  canvas: { dw, dh },
  byAttr: {},
});
const unaligned: PositionalResidue = { ...aligned(0, 0), aligned: false };

describe('measureSvgResidue — synthetic pairs', () => {
  it('reports all zeros and aligned for identical documents', () => {
    const doc = svg(rect(10) + path('M 1 2 C 3 4 5 6 7 8'));
    expect(measureSvgResidue(doc, doc)).toEqual({
      aligned: true,
      nodeMax: 0,
      pathMax: 0,
      canvas: { dw: 0, dh: 0 },
      byAttr: {
        'rect/@x': 0,
        'rect/@y': 0,
        'rect/@width': 0,
        'rect/@height': 0,
        'path/@d': 0,
        'svg/@width': 0,
        'svg/@height': 0,
        'svg/@viewBox[2]': 0,
        'svg/@viewBox[3]': 0,
      },
    });
  });

  it('takes nodeMax from the largest element coordinate offset and names its attribute', () => {
    const r = measureSvgResidue(svg(rect(10.5) + rect(30)), svg(rect(10) + rect(29.25)));
    expect(r.aligned).toBe(true);
    expect(r.nodeMax).toBe(0.75);
    expect(r.pathMax).toBe(0);
    expect(r.byAttr['rect/@x']).toBe(0.75);
    expect(r.byAttr['rect/@y']).toBe(0);
  });

  it('takes pathMax token by token from path d', () => {
    const r = measureSvgResidue(svg(path('M 1 2 C 3 4 5 9.5 7 8')), svg(path('M 1 2 C 3 4 5 6 7 8')));
    expect(r.aligned).toBe(true);
    expect(r.pathMax).toBe(3.5);
    expect(r.nodeMax).toBe(0);
    expect(r.byAttr['path/@d']).toBe(3.5);
  });

  it('measures polygon points as path coordinates', () => {
    const poly = (p: string): string => `<polygon points="${p}" fill="#000"/>`;
    const r = measureSvgResidue(svg(poly('0,0 10,0 10,10')), svg(poly('0,0 10,0 10,7')));
    expect(r.aligned).toBe(true);
    expect(r.pathMax).toBe(3);
    expect(r.byAttr['polygon/@points']).toBe(3);
  });

  it('is unaligned when a path has an extra coordinate token', () => {
    const r = measureSvgResidue(svg(path('M 1 2 L 3 4 L 5 6')), svg(path('M 1 2 L 3 4')));
    expect(r.aligned).toBe(false);
    expect(r.pathMax).toBe(0);
  });

  it('is unaligned when path commands differ at the same token count', () => {
    expect(measureSvgResidue(svg(path('M 1 2 L 3 4')), svg(path('M 1 2 M 3 4'))).aligned).toBe(false);
  });

  it('reads a canvas change into dw and dh, from width/height and viewBox', () => {
    const r = measureSvgResidue(svg(rect(10), 101, 50), svg(rect(10), 100, 47));
    expect(r.canvas).toEqual({ dw: 1, dh: 3 });
    expect(r.nodeMax).toBe(0);
    expect(r.byAttr['svg/@viewBox[2]']).toBe(1);
    expect(r.byAttr['svg/@height']).toBe(3);
  });

  it('is unaligned when the child counts differ', () => {
    expect(measureSvgResidue(svg(rect(10) + rect(20)), svg(rect(10))).aligned).toBe(false);
  });

  it('is unaligned when the tags differ at the same position', () => {
    expect(measureSvgResidue(svg(rect(10)), svg('<ellipse cx="1" cy="2" rx="3" ry="4"/>')).aligned).toBe(false);
  });

  it('is unaligned when a coordinate attribute exists on one side only', () => {
    expect(measureSvgResidue(svg('<rect y="10" width="20" height="8"/>'), svg(rect(10))).aligned).toBe(false);
  });

  it('is unaligned when a non-positional attribute differs (the structural gate predicate)', () => {
    const r = measureSvgResidue(svg(rect(10, ' stroke="red"')), svg(rect(10, ' stroke="blue"')));
    expect(r.aligned).toBe(false);
    expect(hasStructuralDiff(svg(rect(10)), svg(rect(10.5)))).toBe(false);
  });

  it('takes the alignment verdict from the caller when one is supplied', () => {
    const doc = svg(rect(10));
    expect(measureSvgResidue(doc, doc, false).aligned).toBe(false);
    expect(measureSvgResidue(svg(rect(10, ' stroke="a"')), svg(rect(10, ' stroke="b"')), true).aligned).toBe(true);
  });

  it('is unaligned when the root lacks a dimension the oracle has, and tolerates both lacking a viewBox', () => {
    const bare = (attrs: string): string => `<svg ${NS} ${attrs}><g>${rect(10)}</g></svg>`;
    expect(measureSvgResidue(bare('height="50"'), bare('width="100" height="50"')).aligned).toBe(false);
    const same = measureSvgResidue(bare('width="100" height="50"'), bare('width="100" height="50"'));
    expect(same.aligned).toBe(true);
    expect(Object.keys(same.byAttr)).not.toContain('svg/@viewBox[2]');
  });

  it('is unaligned when a coordinate attribute is not numeric', () => {
    const nonNumeric = '<rect x="auto" y="10" width="20" height="8" fill="#fff"/>';
    expect(measureSvgResidue(svg(nonNumeric), svg(rect(10))).aligned).toBe(false);
  });

  it('is unaligned when a path d exists on one side only, and treats an empty d as zero tokens', () => {
    expect(measureSvgResidue(svg('<path fill="none"/>'), svg(path('M 1 2'))).aligned).toBe(false);
    expect(measureSvgResidue(svg(path('')), svg(path(''))).aligned).toBe(true);
  });

  it('is unaligned when an element faces a text node', () => {
    expect(
      measureSvgResidue(svg('<text x="1" y="2">a</text>'), svg('<text x="1" y="2"><tspan>a</tspan></text>')).aligned,
    ).toBe(false);
  });

  it('does not descend text nodes and ignores textLength-style attributes', () => {
    const t = (n: string): string => `<text x="5" y="6" textLength="${n}">hello</text>`;
    const r = measureSvgResidue(svg(t('10')), svg(t('10')));
    expect(r.aligned).toBe(true);
    expect(r.nodeMax).toBe(0);
  });
});

describe('checkRow', () => {
  const pinned = { nodeMax: 0.5, pathMax: 2, dw: 1, dh: 0 };

  it('passes a row at or below every ceiling', () => {
    expect(checkRow('json/a', aligned(0.5, 1.9, 1, 0), pinned, false)).toEqual([]);
  });

  it('allows float noise up to PIN_EPSILON and fails just above it', () => {
    expect(checkRow('json/a', aligned(0.5 + PIN_EPSILON / 2, 2, 1, 0), pinned, false)).toEqual([]);
    expect(checkRow('json/a', aligned(0.51, 2, 1, 0), pinned, false)).toEqual([
      'json/a: nodeMax 0.51 exceeds its pinned ceiling 0.5',
    ]);
  });

  it('names every field that regressed', () => {
    const v = checkRow('yaml/b', aligned(0.5, 2.5, 1, 0.25), pinned, false);
    expect(v).toEqual([
      'yaml/b: pathMax 2.5 exceeds its pinned ceiling 2',
      'yaml/b: dh 0.25 exceeds its pinned ceiling 0',
    ]);
  });

  it('fails a pinned-aligned row that lost alignment', () => {
    expect(checkRow('json/a', unaligned, pinned, false)[0]).toContain('json/a: lost structural alignment');
  });

  it('fails an absent, non-conformant row as unpinned', () => {
    expect(checkRow('json/new', aligned(0, 0), undefined, false)).toEqual(['unpinned residue row json/new']);
  });

  it('holds a conformant row to the comparator band (0.01), not to a pin', () => {
    expect(checkRow('json/c', aligned(0.001, 0), undefined, true)).toEqual([]);
    expect(checkRow('json/c', aligned(0.02, 0), undefined, true)).toEqual([
      'json/c: nodeMax 0.02 exceeds its pinned ceiling 0.01',
    ]);
  });

  it('passes an {aligned:false} row while it stays unaligned and demands a re-seed once it aligns', () => {
    expect(checkRow('json/t', unaligned, { aligned: false }, false)).toEqual([]);
    expect(checkRow('json/t', aligned(1, 1), { aligned: false }, false)).toEqual([
      'json/t: now aligned — re-seed the pin from residue.mts',
    ]);
  });
});

describe('toPinRow / readPin', () => {
  it('maps an aligned residue to ceilings and an unaligned one to {aligned:false}', () => {
    expect(toPinRow(aligned(0.25, 1.5, 1, 2))).toEqual({ aligned: true, nodeMax: 0.25, pathMax: 1.5, dw: 1, dh: 2 });
    expect(toPinRow(unaligned)).toEqual({ aligned: false });
  });

  it('returns undefined for a missing pin file and parses an existing one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jfp-pin-'));
    expect(readPin(join(dir, 'absent.json'))).toBeUndefined();
    const file = join(dir, 'pin.json');
    writeFileSync(file, JSON.stringify({ rows: { 'json/x': { aligned: false } } }));
    expect(readPin(file)).toEqual({ rows: { 'json/x': { aligned: false } } });
  });
});

describe('corpus rows (acceptance, needs test-results/dot-cache)', () => {
  const TIMEOUT_MS = 60_000;

  it('lists 92 cached rows, 22 of them conformant', () => {
    expect(listCachedRows()).toHaveLength(92);
    expect(conformantRows().size).toBe(22);
  });

  it('measures json/bavize-88-jumu158 aligned with the fixtures.md magnitudes', { timeout: TIMEOUT_MS }, () => {
    const r = measureResidue('json', 'bavize-88-jumu158');
    expect(r.aligned).toBe(true);
    expect(r.nodeMax).toBeCloseTo(0.225, 3);
    expect(Math.abs(r.pathMax - 1.9)).toBeLessThan(0.1);
    expect(r.canvas).toEqual({ dw: 0, dh: 0 });
  });

  it('measures a conformant row inside the comparator band', { timeout: TIMEOUT_MS }, () => {
    const r = measureResidue('json', 'babico-87-soxo095');
    expect(r.aligned).toBe(true);
    expect(r.nodeMax).toBe(0.001);
    expect(r.pathMax).toBe(0);
  });

  it('flags json/timafu-94-bixe774 (37 structural diffs) as unaligned', { timeout: TIMEOUT_MS }, () => {
    expect(measureResidue('json', 'timafu-94-bixe774').aligned).toBe(false);
  });

  it('throws naming the row when no cached fixture exists', () => {
    expect(() => measureResidue('json', 'no-such-slug')).toThrow('no cached fixture json/no-such-slug');
  });
});
