/**
 * Unit tests for `scripts/activity-probe-align.ts`'s pure functions (mission
 * `activity-if-tile-port`, T1/Q6). Split from `activity-probe.test.ts`
 * because the flag's logic itself lives in a sibling module -- see that
 * module's doc comment for why.
 */
import { describe, it, expect } from 'vitest';
import {
  taggedElementsOf,
  perTagCounts,
  alignmentOf,
  alignReport,
  type TagLane,
} from '../../../scripts/activity-probe-align.js';

const SVG_A =
  '<svg><g><polygon points="0,0 10,0 10,10 0,10" fill="#F1F1F1" stroke="#181818"/>' +
  '<line x1="0" y1="0" x2="10" y2="0" stroke="#181818"/>' +
  '<text x="5" y="5">a</text></g></svg>';

const SVG_B =
  '<svg><g><polygon points="0,0 10,0 10,10 0,10" fill="#F1F1F1" stroke="#181818"/>' +
  '<line x1="0" y1="0" x2="10" y2="0" stroke="#181818"/>' +
  '<line x1="0" y1="0" x2="10" y2="0" stroke="#181818"/></g></svg>';

describe('taggedElementsOf', () => {
  it('returns one entry per ALIGN_TAGS element in document order', () => {
    const result = taggedElementsOf(SVG_A);
    expect(result.map((r) => r.tag)).toEqual(['polygon', 'line', 'text']);
  });

  it('excludes tags outside polygon/line/text/rect (e.g. ellipse)', () => {
    const svg = '<svg><ellipse cx="5" cy="5" rx="1" ry="1"/><rect x="0" y="0" width="1" height="1"/></svg>';
    const result = taggedElementsOf(svg);
    expect(result.map((r) => r.tag)).toEqual(['rect']);
  });

  it('is empty for an svg with no matching elements', () => {
    expect(taggedElementsOf('<svg><ellipse cx="1" cy="1" rx="1" ry="1"/></svg>')).toEqual([]);
  });
});

describe('perTagCounts', () => {
  it('counts each of the four ALIGN_TAGS on both sides, zero when absent', () => {
    const ours: TagLane[] = [
      { tag: 'polygon', lane: null },
      { tag: 'line', lane: null },
    ];
    const jar: TagLane[] = [
      { tag: 'polygon', lane: null },
      { tag: 'polygon', lane: null },
    ];
    expect(perTagCounts(ours, jar)).toEqual({
      polygon: { ours: 1, jar: 2 },
      line: { ours: 1, jar: 0 },
      text: { ours: 0, jar: 0 },
      rect: { ours: 0, jar: 0 },
    });
  });

  it('is all-zero for two empty sides', () => {
    expect(perTagCounts([], [])).toEqual({
      polygon: { ours: 0, jar: 0 },
      line: { ours: 0, jar: 0 },
      text: { ours: 0, jar: 0 },
      rect: { ours: 0, jar: 0 },
    });
  });
});

describe('alignmentOf', () => {
  it('matches fully when both sides agree at every index', () => {
    const a: TagLane[] = [
      { tag: 'polygon', lane: 0 },
      { tag: 'line', lane: 1 },
    ];
    expect(alignmentOf(a, a)).toEqual({ matched: 2, total: 2 });
  });

  it('counts only the indices that agree on both tag and lane', () => {
    const ours: TagLane[] = [
      { tag: 'polygon', lane: 0 },
      { tag: 'line', lane: 1 },
    ];
    const jar: TagLane[] = [
      { tag: 'polygon', lane: 0 },
      { tag: 'line', lane: 0 },
    ];
    expect(alignmentOf(ours, jar)).toEqual({ matched: 1, total: 2 });
  });

  it('uses the longer side as the denominator, never dropping extra elements', () => {
    const ours: TagLane[] = [{ tag: 'polygon', lane: null }];
    const jar: TagLane[] = [
      { tag: 'polygon', lane: null },
      { tag: 'line', lane: null },
      { tag: 'text', lane: null },
    ];
    expect(alignmentOf(ours, jar)).toEqual({ matched: 1, total: 3 });
  });

  it('is 0/0 for two empty sides', () => {
    expect(alignmentOf([], [])).toEqual({ matched: 0, total: 0 });
  });
});

describe('alignReport', () => {
  it('combines perTagCounts and alignmentOf for two raw svg strings', () => {
    const report = alignReport(SVG_A, SVG_B);
    expect(report.perTag['polygon']).toEqual({ ours: 1, jar: 1 });
    expect(report.perTag['line']).toEqual({ ours: 1, jar: 2 });
    expect(report.perTag['text']).toEqual({ ours: 1, jar: 0 });
    // index 0 polygon matches, index 1 line matches, index 2 (ours=text,
    // jar=line) does not -- 2/3.
    expect(report.alignment).toEqual({ matched: 2, total: 3 });
  });
});
