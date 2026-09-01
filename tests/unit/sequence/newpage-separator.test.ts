/**
 * The `newpage` SEPARATOR — the one shape `ComponentRoseNewpage` draws.
 *
 * Batch 3 of `plans/sequence-newpage-pagination`. `drawInternalU` is three
 * statements: take the style's stroke and line colour, then
 * `ug.draw(ULine.hline(dimensionToUse.getWidth()))` (`:59-64`). No box, no
 * text, no second rule — which is what separates it from a divider, whose
 * component draws five shapes.
 *
 * Every value asserted here is checked against the jar's own golden for
 * `digula-66-dipe776`, which carries exactly one such line:
 *   `<line x1="44.959" y1="327" x2="190.003" y2="327"
 *          style="stroke:#181818;stroke-width:0.5;stroke-dasharray:2,2;"/>`
 */
import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { renderSequence, renderSequencePage } from '../../../src/diagrams/sequence/renderer.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import {
  NEWPAGE_DASH_UNIT,
  NEWPAGE_LINE_COLOR,
  NEWPAGE_LINE_THICKNESS,
  NEWPAGE_MARGIN_Y,
} from '../../../src/diagrams/sequence/newpage-style.js';
import { newpageTilesOf } from '../../../src/diagrams/sequence/sequence-page.js';
import type { SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';

const measurer = new FixedMeasurer(8, 16);

function layout(lines: string[]): SequenceGeometry {
  const ast = parseSequence(lines);
  if ('refused' in ast) throw new Error(`refused: ${ast.message}`);
  return layoutSequence(ast, defaultTheme, measurer);
}

const SOURCE = ['Alice -> Bob : a', 'newpage', 'Alice -> Bob : b'];

/** Every dashed `2,2` line in a rendered body — the separator's signature,
 *  and not a lifeline's, which dashes `5,5` from `lifeLine { LineStyle 5 }`. */
function separatorLines(body: string): string[] {
  return [...body.matchAll(/<line[^>]*stroke-dasharray="2,2"[^>]*\/>/g)].map((m) => m[0]);
}

describe('newpage separator', () => {
  it('draws exactly one dashed line per surviving tile', () => {
    const { body } = renderSequence(layout(SOURCE), defaultTheme);
    expect(separatorLines(body)).toHaveLength(1);
  });

  /** `root { LineColor #181818 }`, `element { LineThickness 0.5 }`,
   *  `newpage { LineStyle 2 }` — the three segments of
   *  `ComponentType.NEWPAGE.getStyleSignature()` that set anything. */
  it('carries the cascade`s stroke, thickness and dash unit', () => {
    const { body } = renderSequence(layout(SOURCE), defaultTheme);
    const [sep] = separatorLines(body);
    expect(sep).toContain(`stroke="${NEWPAGE_LINE_COLOR}"`);
    expect(sep).toContain(`stroke-width="${String(NEWPAGE_LINE_THICKNESS)}"`);
    expect(sep).toContain(`stroke-dasharray="${String(NEWPAGE_DASH_UNIT)},${String(NEWPAGE_DASH_UNIT)}"`);
  });

  it('sits MARGINY below the tile top and spans the tile band', () => {
    const geo = layout(SOURCE);
    const [tile] = newpageTilesOf(geo);
    const { body } = renderSequence(geo, defaultTheme);
    const [sep] = separatorLines(body);
    // Page 0 of this document needs no translation: ymin is headHeight.
    const y = tile!.y + NEWPAGE_MARGIN_Y;
    expect(sep).toContain(`y1="${String(y)}"`);
    expect(sep).toContain(`y2="${String(y)}"`);
    expect(sep).toContain(`x1="${String(tile!.bandX)}"`);
    expect(sep).toContain(`x2="${String(tile!.bandX + tile!.bandWidth)}"`);
  });

  /** "the pages slightly overlap on the newpage separator, so that the
   *  dashed line is visible at the bottom of the page ending there and at
   *  the top of the page starting there" —
   *  `PlayingSpaceWithParticipants.java:78-80`. */
  it('is drawn on BOTH pages the tile divides', () => {
    const geo = layout(SOURCE);
    expect(separatorLines(renderSequencePage(geo, defaultTheme, 0).body)).toHaveLength(1);
    expect(separatorLines(renderSequencePage(geo, defaultTheme, 1).body)).toHaveLength(1);
  });

  it('shows only its OWN separator on a middle page', () => {
    const geo = layout(['Alice -> Bob : a', 'newpage', 'Alice -> Bob : b', 'newpage', 'Alice -> Bob : c']);
    // Page 1 is bounded by both tiles, so both separators are on it.
    expect(separatorLines(renderSequencePage(geo, defaultTheme, 1).body)).toHaveLength(2);
    expect(separatorLines(renderSequencePage(geo, defaultTheme, 0).body)).toHaveLength(1);
    expect(separatorLines(renderSequencePage(geo, defaultTheme, 2).body)).toHaveLength(1);
  });

  it('draws nothing when the document has no newpage', () => {
    const { body } = renderSequence(layout(['Alice -> Bob : a']), defaultTheme);
    expect(separatorLines(body)).toEqual([]);
  });
});
