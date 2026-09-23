/**
 * renderer-classifier-map-dividers.ts — `mapColumnDividerEntries`, split
 * out of `renderer-classifier-box.ts` when cdd-T29 round 2's `scaleK`
 * threading pushed that file back over the 500-line hook cap (pre-
 * authorised split, same precedent as that file's own prior `renderer-
 * classifier-badge-tag.ts`/`renderer-classifier-header-split.ts` splits) --
 * a pure move, re-imported back unchanged.
 */
import { line } from '../../core/svg.js';
import type { ClassifierGeo } from './layout.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { MAP_CELL_MARGIN_X } from './class-map-sizing.js';
import { classBorderLine, MAP_JSON_DIVIDER_STROKE_WIDTH } from './renderer-classifier-colors.js';
import type { UrlTaggedPrimitive } from './renderer-url.js';

/**
 * Map-only: the column-B vertical divider per non-linked data row
 * (`TextBlockMap#drawU`'s per-row `ULine.vline`, drawn immediately after
 * that row's key+value text). Returns Y-tagged entries (NOT a joined
 * string, G3/O3) so `buildBodyPrimitives` can merge them into its own
 * stable Y-sort at the CORRECT interleaved position -- jar draws
 * `[hline, key, value, vline]` per row, never batching every vline after
 * every row (this port's pre-O3 bug: the old string-returning form was
 * appended as one extra primitive at the very end of `renderClassifierBox`,
 * after every row's own text). Each entry's sort `y` is deliberately the
 * row's OWN text baseline -- identical to the value text primitive's own
 * `y` -- so the stable sort preserves jar's `[key, value, vline]` relative
 * order for that row without needing a secondary sort key (both were
 * pushed into `buildBodyPrimitives`' array via the SAME `memberRows` loop
 * iteration order, key then value, before this function's own entries are
 * appended).
 *
 * Row/column geometry is reconstructed from rows[]/dividerYs alone (no
 * ClassifierGeo schema change — see class-map-sizing.ts#buildMapRowGeo for
 * why): every data row contributes exactly two rows[] entries (key, value)
 * after the header entries (those with y below dividerYs[0]); a linked
 * row's value entry has empty text and is skipped (upstream never draws
 * that cell either).
 *
 * NOT used for `json` — a json entries area can nest arbitrarily deep, so it
 * does not fit the "exactly two rows[] entries per data row" invariant this
 * relies on; see class-json-sizing.ts's file doc for the documented
 * rendering simplification (row/column TEXT is exact at every depth, only
 * the vertical divider lines are omitted).
 */
export function mapColumnDividerEntries(
  geo: ClassifierGeo,
  theme: ScaledTheme,
): Array<{ y: number; item: UrlTaggedPrimitive }> {
  if (geo.kind !== 'map' || geo.dividerYs.length === 0) return [];
  const dataRows = geo.rows.filter((r) => r.y >= geo.dividerYs[0]!);
  const entries: Array<{ y: number; item: UrlTaggedPrimitive }> = [];
  for (let i = 0; i < geo.dividerYs.length; i++) {
    const value = dataRows[2 * i + 1];
    if (value === undefined || value.text === '') continue; // linked/point row
    const top = geo.dividerYs[i]!;
    const bottom = geo.dividerYs[i + 1] ?? geo.height;
    const dividerX = geo.x + value.indent - MAP_CELL_MARGIN_X;
    entries.push({
      y: value.y,
      item: {
        url: geo.url,
        body: line(dividerX, geo.y + top, dividerX, geo.y + bottom, {
          stroke: classBorderLine(geo, theme),
          strokeWidth: MAP_JSON_DIVIDER_STROKE_WIDTH * theme.scaleK,
        }),
      },
    });
  }
  return entries;
}
