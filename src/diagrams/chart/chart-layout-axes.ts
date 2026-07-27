/**
 * Chart axis geometry: categorical + numeric tick construction and the
 * vertical/horizontal axis geometry builders. Split out of `layout.ts` (line
 * cap); imports core helpers/types, consumed by layoutChart.
 */

import type { ChartAxisDef } from './ast.js';
import type {} from '../../core/theme.js';
import type {} from '../../core/measurer.js';
import { valueToPixel, formatAxisValue, AXIS_LABEL_SPACE } from './chart-layout-core.js';
import type { PlotArea, TickMark, AxisGeometry } from './chart-layout-core.js';
import {} from './chart-layout-core.js';


/**
 * Build ticks for a categorical h-axis (hAxis.labels is non-empty).
 *
 * All category positions are always computed for bar layout, but only
 * every tickSpacing-th entry appears in the returned TickMark array when
 * tickSpacing is set.
 */
const AUTO_TICK_COUNT = 5;

export function buildCategoricalTicks(
  labels: string[],
  plotWidth: number,
  tickSpacing: number | null,
): TickMark[] {
  const spacing = tickSpacing !== null && tickSpacing > 0 ? tickSpacing : 1;
  const ticks: TickMark[] = [];
  for (let i = 0; i < labels.length; i++) {
    if (i % spacing !== 0) continue;
    const pixelPos = (i + 0.5) * (plotWidth / labels.length);
    ticks.push({ value: NaN, label: labels[i]!, pixelPos });
  }
  return ticks;
}

/**
 * Build ticks for a numeric axis.
 *
 * Priority:
 *   1. customTicks map
 *   2. tickSpacing interval
 *   3. Auto ~5 ticks
 */
export function buildNumericTicks(
  axis: ChartAxisDef,
  pixelMin: number,
  pixelMax: number,
): TickMark[] {
  const { customTicks, tickSpacing } = axis;

  // 1. Custom ticks map
  if (customTicks !== null && customTicks.size > 0) {
    return buildCustomTicks(axis, pixelMin, pixelMax);
  }
  // 2. Explicit tick spacing
  if (tickSpacing !== null && tickSpacing > 0) {
    return buildSpacedTicks(axis, pixelMin, pixelMax);
  }
  // 3. Automatic — target AUTO_TICK_COUNT ticks
  return buildAutoTicks(axis, pixelMin, pixelMax);
}

/** Ticks from an explicit ChartAxisDef.customTicks map (priority 1). */
function buildCustomTicks(
  axis: ChartAxisDef,
  pixelMin: number,
  pixelMax: number,
): TickMark[] {
  const { min, max } = axis;
  const ticks: TickMark[] = [];
  for (const [value, label] of axis.customTicks!) {
    const pixelPos = valueToPixel(value, pixelMin, pixelMax, min, max);
    ticks.push({ value, label, pixelPos });
  }
  return ticks.sort((a, b) => a.value - b.value);
}

/** Ticks at an explicit tickSpacing interval (priority 2). */
function buildSpacedTicks(
  axis: ChartAxisDef,
  pixelMin: number,
  pixelMax: number,
): TickMark[] {
  const { min, max } = axis;
  const spacing = axis.tickSpacing!;
  const ticks: TickMark[] = [];
  const start = Math.ceil(min / spacing) * spacing;
  for (let v = start; v <= max + spacing * 0.01; v += spacing) {
    if (v > max + spacing * 0.01) break;
    const clamped = Math.min(v, max);
    const pixelPos = valueToPixel(clamped, pixelMin, pixelMax, min, max);
    ticks.push({ value: clamped, label: formatAxisValue(clamped), pixelPos });
  }
  return ticks;
}

/** Automatic ~AUTO_TICK_COUNT evenly-spaced ticks (priority 3, fallback). */
function buildAutoTicks(
  axis: ChartAxisDef,
  pixelMin: number,
  pixelMax: number,
): TickMark[] {
  const { min, max } = axis;
  const ticks: TickMark[] = [];
  for (let i = 0; i <= AUTO_TICK_COUNT; i++) {
    const value = min + ((max - min) * i) / AUTO_TICK_COUNT;
    const pixelPos = valueToPixel(value, pixelMin, pixelMax, min, max);
    ticks.push({ value, label: formatAxisValue(value), pixelPos });
  }
  return ticks;
}

// ---------------------------------------------------------------------------
// AxisGeometry builders
// ---------------------------------------------------------------------------

export function buildVAxisGeometry(
  axis: ChartAxisDef,
  plotArea: PlotArea,
  leftSide: boolean,
): AxisGeometry {
  // V-axis: pixelMin = bottom of plot, pixelMax = top of plot (inverted y).
  const pixelMin = plotArea.y + plotArea.height;
  const pixelMax = plotArea.y;

  // Categorical labels on v-axis: used in horizontal bar mode where vAxis
  // defines the row categories (e.g. v-axis [Product A, Product B, Product C]).
  const ticks: TickMark[] =
    axis.labels.length > 0
      ? axis.labels.map((label, i) => ({
          value: NaN,
          label,
          pixelPos: plotArea.y + (i + 0.5) * (plotArea.height / axis.labels.length),
        }))
      : buildNumericTicks(axis, pixelMin, pixelMax);
  const gridPixels: number[] =
    axis.gridMode === 'major' ? ticks.map((t) => t.pixelPos) : [];

  // Title position: centered vertically, to the left (or right for v2Axis)
  const titleX = leftSide
    ? plotArea.x - AXIS_LABEL_SPACE
    : plotArea.x + plotArea.width + AXIS_LABEL_SPACE;
  const titleY = plotArea.y + plotArea.height / 2;

  return {
    min: axis.min,
    max: axis.max,
    ticks,
    title: axis.title,
    titlePos: { x: titleX, y: titleY, rotate: true },
    gridPixels,
    pixelMin,
    pixelMax,
  };
}

export function buildHAxisGeometry(
  axis: ChartAxisDef,
  plotArea: PlotArea,
): AxisGeometry {
  // H-axis: pixelMin = left of plot, pixelMax = right of plot.
  const pixelMin = plotArea.x;
  const pixelMax = plotArea.x + plotArea.width;

  const ticks: TickMark[] =
    axis.labels.length > 0
      ? buildCategoricalTicks(axis.labels, plotArea.width, axis.tickSpacing).map(
          (t) => ({ ...t, pixelPos: t.pixelPos + plotArea.x }),
        )
      : buildNumericTicks(axis, pixelMin, pixelMax);

  const gridPixels: number[] =
    axis.gridMode === 'major' ? ticks.map((t) => t.pixelPos) : [];

  // Title position: centered horizontally below the plot
  const titleX = plotArea.x + plotArea.width / 2;
  const titleY = plotArea.y + plotArea.height + AXIS_LABEL_SPACE + 10;

  return {
    min: axis.min,
    max: axis.max,
    ticks,
    title: axis.title,
    titlePos: { x: titleX, y: titleY, rotate: false },
    gridPixels,
    pixelMin,
    pixelMax,
  };
}

// ---------------------------------------------------------------------------
// Legend geometry
// ---------------------------------------------------------------------------
