/**
 * T2b (ink-walk-reuses-draw, D5): `measureFolderLeafInk` -- a `folder`/
 * `package` specific `LimitFinder` walk over the REAL `decoration/symbol/
 * USymbolFolder.ts#asSmall`, fed the SAME title/label/stereo dims
 * `measureFolderLeaf` itself derives (`folderBlockDims`), so `asSmall`'s
 * own internal `calculateDimension()` matches `measureFolderLeaf`'s box
 * exactly and the walked ink is bounded by the SAME box the classifier was
 * laid out at.
 *
 * Also covers `folderTextBlock`'s embed branch (rojida-14-fuli428
 * mechanism 2): a `{{ ... }}` label routes through the real
 * `EmbeddedDiagram` machinery (always (42, 42) today, per that class's own
 * doc comment), not literal text-line measurement.
 */
import { describe, expect, test } from 'vitest';
import { measureFolderLeaf, measureFolderLeafInk } from '../../../../../src/core/svek/image/leaf-sizing-folder.js';
import type { LeafSizingSubject } from '../../../../../src/core/svek/image/LeafSizingSubject.js';
import { WidthTableMeasurer } from '../../../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
const fontSpec = { family: 'sans-serif', size: 14 };

describe('measureFolderLeafInk (T2b)', () => {
  test('a `folder` (showTitle=false) leaf inks its own (0,0)-(width,height) box, no addRectInk (-1,-1) shift', () => {
    const node: LeafSizingSubject = { id: 'fb', display: 'fb', symbol: 'folder' };
    const dim = measureFolderLeaf(node, fontSpec, measurer, undefined, undefined);
    const ink = measureFolderLeafInk(node, fontSpec, measurer, undefined, undefined);
    expect(ink).toBeDefined();
    // USymbolFolder.ts#folderPath's arced outline bbox is exactly
    // (0,0)-(width,height) -- no `-1` inset the way `addRectInk`'s bordered
    // `URectangle` rule would give a bare box.
    expect(ink).toEqual({ minX: 0, minY: 0, maxX: dim.width, maxY: dim.height });
  });

  test('a `package` (showTitle=true) leaf inks its own (0,0)-(width,height) box too', () => {
    const node: LeafSizingSubject = { id: 'Application', display: 'Application', symbol: 'package' };
    const dim = measureFolderLeaf(node, fontSpec, measurer, undefined, undefined);
    const ink = measureFolderLeafInk(node, fontSpec, measurer, undefined, undefined);
    expect(ink).toEqual({ minX: 0, minY: 0, maxX: dim.width, maxY: dim.height });
  });

  test('a `{{ }}` embedded-diagram label contributes a FIXED 42-tall block, not `lineCount * lineH`', () => {
    // `measureFolderLeaf`'s total height = titleH + labelH + stereoH +
    // marginV (23). titleH is the SAME "Application" `BodyEnhanced1` block
    // for both rows below, and stereoH is 0 (no stereotype) -- so any
    // height DELTA between the two isolates labelH exactly.
    const threeLineEmbed: LeafSizingSubject = {
      id: 'Application',
      display: '{{\n  class class\n}}',
      symbol: 'package',
    };
    const fourLineEmbed: LeafSizingSubject = {
      id: 'Application',
      display: '{{\n  a\n  b\n}}',
      symbol: 'package',
    };
    const dim3 = measureFolderLeaf(threeLineEmbed, fontSpec, measurer, undefined, undefined);
    const dim4 = measureFolderLeaf(fourLineEmbed, fontSpec, measurer, undefined, undefined);
    // Pre-fix: 3 lines * 14 = 42 (coincidence) vs 4 lines * 14 = 56 -- a
    // Δ14 the literal-text-line measurement produced. Post-fix: both route
    // through the SAME `EmbeddedDiagram` (42, 42) fallback regardless of
    // line count, so the two rows' total heights are IDENTICAL.
    expect(dim4.height).toBe(dim3.height);
  });
});
