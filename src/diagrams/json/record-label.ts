/**
 * The graphviz record label a json-family node is laid out with -- the port
 * of `SmetanaForJson#getDotLabelArray` / `#getDotLabelMap`. Split out of
 * `TextBlockJson.ts` (node MEASURING) to keep that file under the 500-line
 * cap; this is the graph-encoding half.
 */
import type { MeasuredNode } from './TextBlockJson.js';

/**
 * graphviz's `#define GAP 4` — "whitespace in POINTS around labels and between
 * peripheries" (`~/git/graphviz/lib/common/const.h:251`). A record field adds
 * it on each side, which is why upstream pre-subtracts `2 * GAP` from the
 * column widths it encodes: `getDotLabelArray(colAwidth - 8, colBwidth - 8, …)`
 * (`SmetanaForJson.java:249-252`).
 */
const RECORD_FIELD_GAP = 4;

/**
 * The graphviz record label for one node, carrying a `<Pn>` port per row.
 *
 * @see ~/git/plantuml/.../jsondiagram/SmetanaForJson.java#getDotLabelArray
 * @see ~/git/plantuml/.../jsondiagram/SmetanaForJson.java#getDotLabelMap
 *
 * Cell sizes travel as `_dim_<height>_<width>_` sentinels rather than as real
 * text: the caller already knows every dimension and must not have graphviz
 * re-derive it from the label. `core/dot-engine-measurer.ts` decodes them,
 * exactly as `smetana/core/Macro.java#hackInitDimensionFromLabel` does for
 * upstream. Group order is upstream's — height first.
 *
 * An ARRAY node is a flat row of ported cells; a MAP node is column A (one
 * full-height cell) beside a nested stack of ported column-B cells.
 */
export function recordLabelFor(m: MeasuredNode): string {
  // Compensate for the padding OUR engine applies, on BOTH axes.
  //
  // `size_reclbl` pads every leaf field by `XPAD` (`d.x += 4*GAP` = 16) and
  // `YPAD` (`d.y += 2*GAP` = 8) — `~/git/graphviz/lib/common/macros.h:27-29`.
  // Encoding a cell at its intended size therefore overshoots by exactly that,
  // so the encoded value is the intended size MINUS the padding.
  //
  // Upstream subtracts only the `YPAD` half (`colAwidth - 8`), and that is not
  // an oversight on its part: Smetana does not reproduce `XPAD`, so upstream
  // has nothing to compensate there. `@knowvah/dot-engine` DOES — verified
  // against the installed `dot` 15.1.1, which returns byte-identical record
  // geometry for the same label. Per CLAUDE.md ("Smetana is NOT a porting
  // target") this port follows the faithful engine, which means compensating
  // both axes rather than copying a compensation calibrated to a transpile
  // that pads once.
  //
  // Sourced, not fitted: both terms come from `macros.h`, the same place
  // upstream's own `- 8` comes from.
  const heightPad = 4 * RECORD_FIELD_GAP;
  const widthA = m.keyColWidth - 2 * RECORD_FIELD_GAP;
  const widthB = m.valueColWidth - 2 * RECORD_FIELD_GAP;
  const cell = (height: number, width: number): string => `_dim_${height - heightPad}_${width}_`;
  const ported = (i: number, height: number, width: number): string => `<P${i}>${cell(height, width)}`;

  if (m.rows.length === 0) return '';
  if (m.rows[0]!.arrayEntry) {
    return m.rows.map((r, i) => ported(i, r.height, widthA)).join('|');
  }
  const totalHeight = m.rows.reduce((acc, r) => acc + r.height, 0);
  const colB = m.rows.map((r, i) => ported(i, r.height, widthB)).join('|');
  return `{${cell(totalHeight, widthA)}|{${colB}}}`;
}
