/**
 * Tests for description/link-edge-attrs.ts's graph-spacing computation —
 * DotStringFactory.createDotString's nodesep/ranksep formula, including the
 * `!pragma kermor on` ranksep variant (DotStringFactory.java:111-114,
 * 247-249). See description-dot-100 decision-journal.md I2.
 */
import { describe, it, expect } from 'vitest';
import {
  computeGraphSpacing,
  buildLinkEdgeAttributes,
  type EdgeFontSpecs,
} from '../../../src/diagrams/description/link-edge-attrs.js';
import type { DescriptiveLink } from '../../../src/diagrams/description/ast.js';
import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';

const fontSpec: FontSpec = { family: 'Helvetica', size: 12 };
const measurer: StringMeasurer = {
  measure: () => ({ width: 0, height: 0 }),
  getDescent: () => 0,
};

describe('computeGraphSpacing — kermor ranksep variant', () => {
  it('floors ranksep at 60 (non-kermor) with no links', () => {
    const { nodeSep, rankSep } = computeGraphSpacing([], fontSpec, measurer);
    expect(nodeSep).toBe(35);
    expect(rankSep).toBe(60);
  });

  it('floors ranksep at 40 under kermor with no links — DotStringFactory.getMinRankSep():247-249', () => {
    const { nodeSep, rankSep } = computeGraphSpacing([], fontSpec, measurer, true);
    expect(nodeSep).toBe(35); // getMinNodeSep never checks kermor
    expect(rankSep).toBe(40);
  });

  it('divides vertical dzeta by 100 (not 10) under kermor — DotStringFactory.getVerticalDzeta():111-114', () => {
    const links: DescriptiveLink[] = [
      { from: 'a', to: 'b', length: 2, arrowHead: 'none', label: 'x' } as DescriptiveLink,
    ];
    const wideMeasurer: StringMeasurer = {
      measure: () => ({ width: 0, height: 5000 }),
      getDescent: () => 0,
    };
    const nonKermor = computeGraphSpacing(links, fontSpec, wideMeasurer, false);
    const kermor = computeGraphSpacing(links, fontSpec, wideMeasurer, true);
    // Both have the SAME decorDzeta+label height input; only the divisor differs.
    expect(nonKermor.rankSep).toBeCloseTo(kermor.rankSep * 10, 5);
  });
});

// M4 cause D (`.agent-notes/m4-single-line-width.md`, T12c): the
// description engine had NO magic-arrow handling at all before this task --
// a label carrying a `<`/`>` token was measured as raw text, counting the
// token itself as a visible glyph and reserving no triangle block.
describe('buildLinkEdgeAttributes — magic-arrow main label (M4 cause D)', () => {
  const arrowFontSpec: FontSpec = { family: 'Helvetica', size: 13 };
  const fonts: EdgeFontSpecs = { label: arrowFontSpec, cardinality: arrowFontSpec };
  const charMeasurer: StringMeasurer = {
    measure: (s: string) => ({ width: s.length * 7, height: 13 }),
    getDescent: () => 3,
  };

  it('reserves ONLY the arrow font size for a bare ">" label -- no marginLabel', () => {
    // `Display.isNull` arm (`SvekEdge.java:281-285`): the arrow block is the
    // WHOLE reservation, `addVisibilityModifier` is never called.
    const link = { from: 'a', to: 'b', length: 1, arrowHead: 'none', label: '>' } as DescriptiveLink;
    const attrs = buildLinkEdgeAttributes(link, fonts, charMeasurer);
    expect(attrs.labelWidth).toBe(13);
    expect(attrs.labelHeight).toBe(13);
  });

  it('reserves the arrow font size plus the margined stripped text for "read >"', () => {
    // `addVisibilityModifier` (margin) runs on "read" BEFORE the arrow
    // block is merged on (`SvekEdge.java:302,304`): 'read'.length(4)*7=28,
    // +2*marginLabel(1) = 30, then +13 for the arrow block = 43.
    const link = { from: 'a', to: 'b', length: 1, arrowHead: 'none', label: 'read >' } as DescriptiveLink;
    const attrs = buildLinkEdgeAttributes(link, fonts, charMeasurer);
    expect(attrs.labelWidth).toBe(43);
    expect(attrs.labelHeight).toBe(15); // max(13, 13 + 2) -- the text side wins
  });

  it('a label with no arrow token keeps the plain (unmargined-arrow) measurement', () => {
    const link = { from: 'a', to: 'b', length: 1, arrowHead: 'none', label: 'demo' } as DescriptiveLink;
    const attrs = buildLinkEdgeAttributes(link, fonts, charMeasurer);
    expect(attrs.labelWidth).toBe(30); // 'demo'.length(4)*7=28 + 2*1
    expect(attrs.labelHeight).toBe(15); // 13 + 2*1
  });
});
