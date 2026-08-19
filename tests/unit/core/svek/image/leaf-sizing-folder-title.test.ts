/**
 * SI1 T12 (ADR-4) — the folder/package SHOWN-title un-narrowing: the
 * title block now measures through the REAL `BodyFactory.create2` →
 * `BodyEnhanced1` route (`leaf-sizing-folder-title.ts`), replacing the
 * measured-but-untraced `FOLDER_SHOWN_TITLE_EXTRA_WIDTH = 12` flat
 * constant (deleted) — the 12 IS `BodyEnhanced1`'s separator-free
 * `decorate` margin, `getMarginX()=6` both sides
 * (BodyEnhancedAbstract.java:107-109).
 *
 * Every dimension asserted here is jar-pinned: the three probe diagrams
 * were run through the deterministic oracle jar
 * (`-DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT`, SI1 T12
 * probes, 2026-08-06) and the DOT node sizes hand-reconciled against the
 * BodyEnhanced1 expressions before the gate was touched.
 */
import { describe, it, expect } from 'vitest';
import { measureLeafNode } from '../../../../../src/core/svek/image/leaf-sizing.js';
import { measureShownFolderTitle } from '../../../../../src/core/svek/image/leaf-sizing-folder-title.js';
import { WidthTableMeasurer } from '../../../../../src/core/measurer.js';
import type { FontSpec } from '../../../../../src/core/measurer.js';
import type { DescriptiveNode } from '../../../../../src/diagrams/description/ast.js';

const fontSpec: FontSpec = { family: 'Helvetica', size: 14 };
const measurer = new WidthTableMeasurer();

function node(id: string, display: string, symbol: DescriptiveNode['symbol']): DescriptiveNode {
  return { id, display, symbol, children: [] };
}

describe('SI1 T12 — folder/package title via create2/BodyEnhanced1 (jar-pinned probes)', () => {
  it('package with code==display: jar 2.388021x0.513889in = 171.9375x37px', () => {
    // title = 129.9375 ("Elektronisk dokument") + 6 + 6 (getMarginX both
    // sides); label slot EMPTY (upstream's empty-desc package branch);
    // + USymbolFolder margin [30, 23]; height 14 + 23.
    const d = measureLeafNode(node('Elektronisk dokument', 'Elektronisk dokument', 'package'), fontSpec, measurer);
    expect(d.width).toBeCloseTo(171.9375, 3);
    expect(d.height).toBeCloseTo(37, 3);
  });

  it('package pp as "Display Here": jar 1.477604x0.708333in = 106.3875x51px', () => {
    // title = 15.575 ("pp") + 12; label = 76.3875 ("Display Here") WINS the
    // mergeTB width max; height 14 + 14 + 23.
    const d = measureLeafNode(node('pp', 'Display Here', 'package'), fontSpec, measurer);
    expect(d.width).toBeCloseTo(106.3875, 3);
    expect(d.height).toBeCloseTo(51, 3);
  });

  it('folder fb (showTitle=false — create2 never measured): jar 0.972222x0.722222in = 70x52px', () => {
    // dimName is the FIXED (40, 15) tab (USymbolFolder.java:172): 40 floors
    // the 11.6375 label; height 15 + 14 + 23.
    const d = measureLeafNode(node('fb', 'fb', 'folder'), fontSpec, measurer);
    expect(d.width).toBeCloseTo(70, 3);
    expect(d.height).toBeCloseTo(52, 3);
  });

  it('title block = creole text width + getMarginX()=6 both sides, one line high', () => {
    const [w, h] = measureShownFolderTitle('Elektronisk dokument', fontSpec, measurer, undefined, undefined);
    expect(w).toBeCloseTo(measurer.measure('Elektronisk dokument', fontSpec).width + 12, 6);
    expect(h).toBeCloseTo(14, 6);
  });

  it('a literal \\n escape in the code splits the title (Display.getWithNewlines), stacking lines', () => {
    // Upstream codeDisplay = Display.getWithNewlines(pragma, entity.getName())
    // — the two-char escape scanner. Width = widest line + 12; height = 2
    // lines. (Expression-derived from the jar-verified single-line pins
    // above; the flat path billed such a code ONE line.)
    const [w, h] = measureShownFolderTitle('ab\\ncd', fontSpec, measurer, undefined, undefined);
    const lineW = Math.max(measurer.measure('ab', fontSpec).width, measurer.measure('cd', fontSpec).width);
    expect(w).toBeCloseTo(lineW + 12, 6);
    expect(h).toBeCloseTo(28, 6);
  });

  // SI30/T2: `titleAtomOps`'s text-atom `getStartingAltitude`/muted-font
  // measurement — the same `Sea#doAlign` math
  // `EntityImageDescriptionDelegates.test.ts` derives for `descAtomOps`
  // ('x' NORMAL spans [-14,0]; '2' EXPOSANT muted-height-11 spans [-17,-6];
  // getHeight = 0 - (-17) = 17, decisions.md#D1/D2).
  it('title x<sup>2</sup>: EXPOSANT altitude grows height 14->17; <sup> measures at the muted width', () => {
    const [w, h] = measureShownFolderTitle('x<sup>2</sup>', fontSpec, measurer, undefined, undefined);
    const expectedTextWidth =
      measurer.measure('x', fontSpec).width + measurer.measure('2', { family: fontSpec.family, size: 11 }).width;
    expect(w).toBeCloseTo(expectedTextWidth + 12, 6);
    expect(h).toBeCloseTo(17, 6);
  });
});
