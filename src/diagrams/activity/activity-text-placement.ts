/**
 * Render-time line width for the activity renderer (mission
 * `activity-min-box-width`, T5, D2).
 *
 * isw-T2-act F1: measured through the render's own string bounder
 * (`activity-string-bounder.ts`), the one the layout sized with -- this
 * module no longer builds a measurer of its own.
 *
 * add4-T3j: the per-line X placement (`activityTextLineX`, `centeredLineX`)
 * and the single-row creole table helpers (`isTableRowLine`,
 * `tableRowCellsOf`) lost their last callers with the legacy text drawer;
 * every label now draws through a creole `Sheet` (`activity-text-sheet.ts`).
 */
import type { Theme } from '../../core/theme.js';
import { activityMeasurer } from './activity-string-bounder.js';

/** Proportional-font line width, in the same metric system the deterministic
 *  conformance harness sizes every activity box in. */
export function measureLineWidth(theme: Theme, fontSize: number, line: string): number {
  return activityMeasurer(theme).measure(line, { family: theme.fontFamily, size: fontSize }).width;
}
