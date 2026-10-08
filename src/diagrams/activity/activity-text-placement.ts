/**
 * Render-time line width for the activity renderer (mission
 * `activity-min-box-width`, T5, D2).
 *
 * MEASUREMENT SEAM. `renderNode`'s contract (`(node, theme) => string`)
 * carries no measurer, and `ActivityNodeGeo` no per-line width, so this
 * module instantiates its OWN `WidthTableMeasurer` (`core/measurer.ts`) --
 * the SAME class the conformance harness re-exports as
 * `DeterministicMeasurer` (`core/measurer-deterministic.ts`) and injects at
 * the layout stage (`tests/oracle/svg-conformance/render-fixture-activity.ts`),
 * so a width computed at RENDER time matches what the layout sized under the
 * oracle harness. A module-level instance (stateless, table-lookup only, no
 * DOM) is the established pattern for a measurer-blind renderer --
 * `sequence/renderer-participant-symbol.ts:196` does the same.
 *
 * add4-T3j: the per-line X placement (`activityTextLineX`, `centeredLineX`)
 * and the single-row creole table helpers (`isTableRowLine`,
 * `tableRowCellsOf`) lost their last callers with the legacy text drawer;
 * every label now draws through a creole `Sheet` (`activity-text-sheet.ts`).
 */
import type { Theme } from '../../core/theme.js';
import { WidthTableMeasurer } from '../../core/measurer.js';

const MEASURER = new WidthTableMeasurer();

/** Proportional-font line width, in the same metric system the deterministic
 *  conformance harness sizes every activity box in. */
export function measureLineWidth(theme: Theme, fontSize: number, line: string): number {
  return MEASURER.measure(line, { family: theme.fontFamily, size: fontSize }).width;
}
