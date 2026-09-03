/**
 * Unit tests for `scripts/label-box-triage.ts`'s pure functions (T2,
 * edge-label-box-backlog). Only the comparator (`boxesOfKind`,
 * `mismatchesForGraph`) and the formatting layer (`renderSlugLines`,
 * `statsFromReports`, `formatStats`) are exercised here — the fixture I/O and
 * render plumbing (`triageSlug`, `captureGraphs`) is exercised by the real
 * harness run against the committed `oracle/goldens/<type>/<slug>/` goldens,
 * mirroring `tests/unit/scripts/measure-description-size-deltas.test.ts`'s
 * own split. No Java / oracle jar is invoked anywhere in this file.
 */
import { describe, it, expect } from 'vitest';
import type { StructuralEdge, StructuralGraph } from '../../oracle/svek-dot.js';
import {
  boxesOfKind,
  mismatchesForGraph,
  renderMismatchLine,
  renderSlugLines,
  statsFromReports,
  formatStats,
  type Mismatch,
  type SlugReport,
} from '../../../scripts/label-box-triage.js';

function edge(overrides: Partial<StructuralEdge> = {}): StructuralEdge {
  return {
    from: 'a',
    to: 'b',
    fromPort: undefined,
    toPort: undefined,
    minlen: 1,
    hasLabel: false,
    hasTailLabel: false,
    hasHeadLabel: false,
    hasXLabel: false,
    labelBox: undefined,
    tailLabelBox: undefined,
    headLabelBox: undefined,
    xLabelBox: undefined,
    sametail: undefined,
    constraint: false,
    invis: false,
    ...overrides,
  };
}

function graph(edges: StructuralEdge[]): StructuralGraph {
  return {
    nodes: [],
    edges,
    clusters: [],
    nodesep: undefined,
    ranksep: undefined,
    remincross: false,
    searchsize: undefined,
    rankdir: undefined,
    splines: undefined,
    forcelabels: false,
  };
}

describe('boxesOfKind', () => {
  it('sorts numerically by width then height, not alphabetically', () => {
    const g = graph([edge({ labelBox: '125x54' }), edge({ labelBox: '23x10' })]);
    // Alphabetic string sort would put "125x54" first ('1' < '2').
    expect(boxesOfKind(g, 'labelBox')).toEqual(['23x10', '125x54']);
  });

  it('breaks a width tie by height', () => {
    const g = graph([edge({ labelBox: '10x20' }), edge({ labelBox: '10x5' })]);
    expect(boxesOfKind(g, 'labelBox')).toEqual(['10x5', '10x20']);
  });

  it('excludes edges with no box of the requested kind', () => {
    const g = graph([edge({ labelBox: '10x5' }), edge({ headLabelBox: '7x13' })]);
    expect(boxesOfKind(g, 'labelBox')).toEqual(['10x5']);
    expect(boxesOfKind(g, 'headLabelBox')).toEqual(['7x13']);
  });
});

describe('mismatchesForGraph', () => {
  it('reports nothing for identical label boxes', () => {
    const oracle = graph([edge({ labelBox: '33x15' })]);
    const candidate = graph([edge({ labelBox: '33x15' })]);
    expect(mismatchesForGraph(oracle, candidate)).toEqual([]);
  });

  it('reports a size mismatch tagged by the DOT attr name', () => {
    const oracle = graph([edge({ headLabelBox: '23x10' })]);
    const candidate = graph([edge({ headLabelBox: '31x13' })]);
    expect(mismatchesForGraph(oracle, candidate)).toEqual([
      { kind: 'headlabel', oracle: '23x10', ours: '31x13' },
    ]);
  });

  it('tags tail and xlabel boxes correctly', () => {
    const oracle = graph([edge({ tailLabelBox: '7x13' }), edge({ xLabelBox: '19x13' })]);
    const candidate = graph([edge({ tailLabelBox: '9x13' }), edge({ xLabelBox: '21x13' })]);
    expect(mismatchesForGraph(oracle, candidate)).toEqual([
      { kind: 'taillabel', oracle: '7x13', ours: '9x13' },
      { kind: 'xlabel', oracle: '19x13', ours: '21x13' },
    ]);
  });

  it('reports an oracle box with no counterpart against "-"', () => {
    const oracle = graph([edge({ labelBox: '10x5' }), edge({ labelBox: '20x8' })]);
    const candidate = graph([edge({ labelBox: '10x5' })]);
    expect(mismatchesForGraph(oracle, candidate)).toEqual([
      { kind: 'label', oracle: '20x8', ours: '-' },
    ]);
  });

  it('orders combined mismatches label, taillabel, headlabel, xlabel', () => {
    const oracle = graph([
      edge({ xLabelBox: '1x1', headLabelBox: '2x2', labelBox: '3x3', tailLabelBox: '4x4' }),
    ]);
    const candidate = graph([
      edge({ xLabelBox: '9x9', headLabelBox: '8x8', labelBox: '7x7', tailLabelBox: '6x6' }),
    ]);
    expect(mismatchesForGraph(oracle, candidate).map((m) => m.kind)).toEqual([
      'label',
      'taillabel',
      'headlabel',
      'xlabel',
    ]);
  });
});

describe('renderMismatchLine', () => {
  it('formats as "kind oracle=WxH ours=WxH"', () => {
    const m: Mismatch = { kind: 'headlabel', oracle: '23x10', ours: '31x13' };
    expect(renderMismatchLine(m)).toBe('  headlabel oracle=23x10 ours=31x13');
  });
});

describe('renderSlugLines', () => {
  it('reports CLEARABLE for a slug whose boxes now match', () => {
    const r: SlugReport = { clearable: true, mismatches: [] };
    expect(renderSlugLines('class', 'bitove-03-sanu160', r)).toEqual([
      'class/bitove-03-sanu160   CLEARABLE',
    ]);
  });

  it('reports COUNT-MISMATCH before checking mismatches, with the detail', () => {
    const r: SlugReport = {
      clearable: false,
      mismatches: [{ kind: 'label', oracle: '1x1', ours: '2x2' }],
      countMismatch: 'expected 2 captured layout graph(s), got 1',
    };
    expect(renderSlugLines('state', 'xupefu-98-roni234', r)).toEqual([
      'state/xupefu-98-roni234   COUNT-MISMATCH (expected 2 captured layout graph(s), got 1)',
    ]);
  });

  it('reports the slug header followed by one line per mismatch', () => {
    const r: SlugReport = {
      clearable: false,
      mismatches: [
        { kind: 'headlabel', oracle: '23x10', ours: '31x13' },
        { kind: 'headlabel', oracle: '41x20', ours: '71x13' },
      ],
    };
    expect(renderSlugLines('class', 'camuna-58-veca254', r)).toEqual([
      'class/camuna-58-veca254',
      '  headlabel oracle=23x10 ours=31x13',
      '  headlabel oracle=41x20 ours=71x13',
    ]);
  });
});

describe('statsFromReports / formatStats', () => {
  it('counts an empty report set as all zeros', () => {
    expect(statsFromReports([])).toEqual({ slugs: 0, clearable: 0, mismatchBoxes: 0 });
    expect(formatStats('class', statsFromReports([]))).toBe(
      'class: 0 slugs, 0 clearable, 0 mismatched box(es)',
    );
  });

  it('tallies slugs, clearable, and total mismatched boxes', () => {
    const reports: SlugReport[] = [
      { clearable: true, mismatches: [] },
      { clearable: false, mismatches: [{ kind: 'label', oracle: '1x1', ours: '2x2' }] },
      {
        clearable: false,
        mismatches: [],
        countMismatch: 'expected 1 captured layout graph(s), got 0',
      },
    ];
    expect(statsFromReports(reports)).toEqual({ slugs: 3, clearable: 1, mismatchBoxes: 1 });
    expect(formatStats('TOTAL', statsFromReports(reports))).toBe(
      'TOTAL: 3 slugs, 1 clearable, 1 mismatched box(es)',
    );
  });
});
