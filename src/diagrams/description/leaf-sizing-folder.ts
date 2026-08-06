/**
 * `folder` / `package` leaf sizing — `USymbolFolder(sname, showTitle)`.
 *
 * Split out of `leaf-sizing.ts` to keep that file under the project's
 * 500-line cap (S1L-f part 2b). Self-contained: one exported entry point
 * (`measureFolderLeaf`) plus the three `mergeTB` block helpers it composes.
 */

import type { DescriptiveNode } from './ast.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import { textBlockHeight, maxLineWidth, atomHeightBonus } from './leaf-sizing-text.js';
import { measureShownFolderTitle } from './leaf-sizing-folder-title.js';
import {
  type BoxSizingOpts,
  BOX_MIN_WIDTH_DEFAULT,
  DEFAULT_BOX_MARGIN,
  FOLDER_FAMILY_SHOW_TITLE,
  FOLDER_TAB_HEIGHT,
  FOLDER_TAB_WIDTH,
  LINE_HEIGHT_FACTOR,
  STEREO_MARGIN,
  SYMBOL_BOX_MARGIN,
  type Dim,
} from './leaf-sizing-consts.js';

/**
 * `folder` / `package` leaf — `USymbolFolder(sname, showTitle)`, the one
 * symbol class behind both (USymbols.java:79/86). Its `asSmall`
 * `calculateDimension` is
 *
 *   getMargin().addDimension(dimName.mergeTB(dimStereo, dimLabel))
 *
 * with `getMargin() = Margin(10, 10+10, 10+3, 10)` -> `[30 h, 23 v]` and
 * `dimName = showTitle ? title.calculateDimension() : XDimension2D(40, 15)`
 * (USymbolFolder.java:146/172/177-183). `mergeTB` stacks: width is the MAX of
 * the three blocks, height their SUM. That single formula explains both
 * forms, which is why they share this function:
 *
 * - `folder` (showTitle=false): the tab is the FIXED (40, 15) block, so 40
 *   FLOORS the content width and 15 adds to the height, while the element's
 *   text rides in the LABEL slot. The floor is the part this port was
 *   missing (`folder b` measured 37.79 vs the jar's 70.00 = max(40, 7.79) +
 *   30); it only ever bites on a short name, which is why no corpus fixture
 *   caught it until now.
 * - `package` (showTitle=true): `dimName` is the real title block, and the
 *   title is the element's CODE while the LABEL carries its display when the
 *   two differ. Verified against the jar across every form:
 *   `package "a b c d e f g"` (code == display, so label empty) 91.787 =
 *   49.7875 + 12 + 30 at height 37 = 14 + 23; `package pp as "Display Here"`
 *   106.387 at height 51 = 14 + 14 + 23, the label winning the width max;
 *   `package "Disp Two" as dd` 84.600 at height 51, likewise.
 *
 * SI1 T12 (ADR-4): the shown title block is now the FAITHFUL
 * `BodyFactory.create2` → `BodyEnhanced1` route
 * (`leaf-sizing-folder-title.ts`) — the `+ 12` in the verified numbers
 * above is `BodyEnhanced1`'s `getMarginX()=6` both sides
 * (BodyEnhancedAbstract.java:107-109), no longer the measured-but-untraced
 * `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` flat constant (deleted).
 */
export function measureFolderLeaf(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  opts: BoxSizingOpts | undefined,
  sprites: SpriteDimsLookup | undefined,
): Dim {
  const symbol = node.symbol;
  const [marginH, marginV] = SYMBOL_BOX_MARGIN[symbol] ?? DEFAULT_BOX_MARGIN;
  const lineH = fontSpec.size * LINE_HEIGHT_FACTOR;
  const showTitle = FOLDER_FAMILY_SHOW_TITLE[symbol] === true;
  // showTitle puts the CODE in the title slot and the display in the label
  // only when it differs; !showTitle leaves the title fixed (40, 15) and the
  // display is the whole label. The shown title is the faithful
  // `BodyFactory.create2`→`BodyEnhanced1` block (SI1 T12/ADR-4 — see
  // `leaf-sizing-folder-title.ts`; upstream `getDimTitle` never measures
  // `title` when `showTitle` is false, USymbolFolder.java:172).
  const [titleW, titleH] = showTitle
    ? measureShownFolderTitle(node.id, fontSpec, measurer, opts, sprites)
    : [FOLDER_TAB_WIDTH, FOLDER_TAB_HEIGHT];
  const labelText = showTitle && node.display === node.id ? '' : node.display;
  const [labelW, labelH] = folderTextBlock(labelText, fontSpec, measurer, sprites);
  const [stereoW, stereoH] = folderStereoBlock(node, fontSpec, measurer, lineH);

  // `MinimumWidth` floors the CONTENT width before margin, exactly as in
  // `measureBox` — S1L-g wired `skinparam minClassWidth` / scoped `<style>
  // <sname> { MinimumWidth }` through `ClassifyCtx#minimumWidthFor`, and
  // `package` is one of its consumers (zotiru-33-legi180).
  const minContentW = opts?.minimumWidth ?? BOX_MIN_WIDTH_DEFAULT;
  return {
    width: Math.max(minContentW, titleW, labelW, stereoW) + marginH,
    height: titleH + labelH + stereoH + marginV,
  };
}

/** `dimLabel` — an EMPTY label contributes a zero block, not a blank line
 *  (`''.split('\n')` would otherwise bill it one `lineH`). */
function folderTextBlock(
  text: string,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  sprites: SpriteDimsLookup | undefined,
): readonly [number, number] {
  if (text === '') return [0, 0];
  const lineH = fontSpec.size * LINE_HEIGHT_FACTOR;
  return [
    maxLineWidth(text, fontSpec, measurer, sprites),
    textBlockHeight(text, lineH) + atomHeightBonus(text, fontSpec, sprites),
  ];
}

/** `dimStereo` — the third mergeTB block: widest guillemet label, one line of
 *  height per tag (the same rule `measureBox` applies). */
function folderStereoBlock(
  node: DescriptiveNode,
  fontSpec: FontSpec,
  measurer: StringMeasurer,
  lineH: number,
): readonly [number, number] {
  const tags = node.stereotype;
  if (tags === undefined || tags.length === 0) return [0, 0];
  const widest = Math.max(...tags.map((s) => measurer.measure(`«${s}»`, fontSpec).width));
  return [widest + STEREO_MARGIN, lineH * tags.length];
}
