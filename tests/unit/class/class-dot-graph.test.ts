/**
 * Mission G5/C1, site 4: `class-dot-graph.ts#buildDotGraph`'s `labelFont`
 * (feeding `class-layout-helpers.ts#edgeLabelAttrs` for every relationship
 * label) must measure at upstream's `FontParam.ARROW` default size (13),
 * not `theme.fontSize` (14, `FontParam.CLASS`'s body-text default) —
 * `plans/g5-measurer-calibration/ledger.md` §C0's jar-verified diagnosis.
 * This exact gap was already flagged as a KNOWN, deliberately-unfixed spot
 * in `class-layout-helpers.ts`'s own `CARDINALITY_FONT_SIZE` doc comment
 * ("NOT the same font `edgeLabelAttrs` below measures with for DOT-gate
 * sizing... a pre-existing, separate, NOT-fixed-this-iteration mismatch").
 *
 * `bejusa-95-gafo325`'s `PCAN_DRV "1" *-left- "1" Bus_Control : contains`
 * is the corpus's real oracle fixture exercising this exact call site: its
 * cached `in.svg` reports `<text font-size="13"
 * textLength="48.425">contains</text>` — jar's own ground truth.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../test-results/dot-cache/class',
);

const measurer = new WidthTableMeasurer();

function captureAll(puml: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

describe('class-dot-graph.ts buildDotGraph — relationship-label font size', () => {
  it('measures "contains" at font-size 13 (jar-exact 48.425px), not 14 (bejusa-95-gafo325)', () => {
    const puml = readFileSync(join(CACHE, 'bejusa-95-gafo325', 'in.puml'), 'utf8');
    const graphs = captureAll(puml);
    const edge = graphs
      .flatMap((g) => g.edges)
      .find((e) => e.attributes?.label === 'contains');
    expect(edge, 'expected a DOT edge labeled "contains"').toBeDefined();
    const expectedAt13 = measurer.measure('contains', { family: 'sans-serif', size: 13 }).width;
    const expectedAt14 = measurer.measure('contains', { family: 'sans-serif', size: 14 }).width;
    expect(expectedAt13).toBeCloseTo(48.425, 3);
    expect(expectedAt14).not.toBeCloseTo(expectedAt13, 3);
    // `labelWidth` now carries SvekEdge#addVisibilityModifier's all-round
    // `withMargin(block, 1, 1)` (svek/SvekEdge.java:372-373), so the assertion
    // is the measurement PLUS 2. The jar agrees exactly: this fixture's own
    // svek-1.dot emits `label=<<TABLE ... WIDTH="50" HEIGHT="15"` for a
    // 48.425x13 block -- trunc(48.425 + 2) = 50, 13 + 2 = 15 -- while its
    // taillabel/headlabel stay 7x13, unmargined, exactly as upstream's single
    // `addVisibilityModifier` call site (SvekEdge.java:302) predicts.
    const LINK_LABEL_MARGIN_BOTH_SIDES = 2;
    expect(edge!.attributes!.labelWidth).toBeCloseTo(expectedAt13 + LINK_LABEL_MARGIN_BOTH_SIDES, 6);
    expect(edge!.attributes!.labelWidth).not.toBeCloseTo(expectedAt14 + LINK_LABEL_MARGIN_BOTH_SIDES, 3);
  });
});
