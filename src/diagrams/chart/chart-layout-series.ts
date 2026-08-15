/**
 * Chart series geometry: legend layout plus grouped/stacked/horizontal bar
 * rects, scatter/line data points, and area baselines. Split out of
 * `layout.ts` (line cap); imports core helpers/types, consumed by layoutChart.
 */

import type { ChartDiagramAST } from './ast.js';
import type {} from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';

import { valueToPixel } from './chart-layout-core.js';
import type { PlotArea, BarRect, DataPoint, LegendEntry, LegendGeometry, PointContext, BarSpec, LegendSpec, AreaBaselineSpec } from './chart-layout-core.js';
import { CHART_MARGIN, LEGEND_MARGIN, LEGEND_SYMBOL_SIZE, LEGEND_TEXT_SPACING, LEGEND_ITEM_SPACING, BAR_WIDTH_RATIO, AXIS_LABEL_SPACE } from './chart-layout-core.js';

// ---------------------------------------------------------------------------
// Module-private param/return bundles.
//
// Kept together at the top of the file, ahead of every function: lizard's
// TS parser mis-attributes an `interface` declaration placed *between* two
// functions to the NLOC/length of the preceding function (verified via a
// minimal repro), so these must not be interleaved with the functions below.
// ---------------------------------------------------------------------------

/** Per-legend-position measured extents, feeding computeLegendPosition. */
interface LegendMeasurements {
  maxLabelWidth: number;
  totalItemHeight: number;
  totalItemWidth: number;
  maxLabelHeight: number;
}

interface LegendPositionGeom {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Geometry constants shared across all categories of a stacked-bar layout. */
interface StackedBarLayout {
  categoryWidth: number;
  barWidth: number;
  barOffset: number;
  plotArea: PlotArea;
  vAxisMin: number;
  vAxisMax: number;
  zeroYAbsolute: number;
}

/** Mutable running tops for stacked bars: positive grows up, negative down. */
interface StackedBarCumulative {
  positive: number;
  negative: number;
}

// ---------------------------------------------------------------------------
// Legend geometry
// ---------------------------------------------------------------------------

export function buildLegendGeometry(
  ast: ChartDiagramAST,
  spec: LegendSpec,
): LegendGeometry | undefined {
  if (ast.legendPosition === 'none' || ast.series.length === 0) return undefined;

  const entries = buildLegendEntries(ast, spec.colors);
  const measurements = measureLegendEntries(ast.legendPosition, entries, spec.measurer, spec.font);
  const geom = computeLegendPosition(ast.legendPosition, spec, measurements);
  if (geom === undefined) return undefined;

  return { ...geom, entries, position: ast.legendPosition };
}

function buildLegendEntries(ast: ChartDiagramAST, colors: string[]): LegendEntry[] {
  return ast.series.map((s, i) => ({
    name: s.name,
    color: colors[i]!,
    seriesType: s.type,
    ...(s.type === 'scatter'
      ? { markerShape: s.markerShape, markerSize: s.markerSize ?? 8 }
      : {}),
  }));
}

function measureLegendEntries(
  legendPosition: ChartDiagramAST['legendPosition'],
  entries: LegendEntry[],
  measurer: StringMeasurer,
  font: { family: string; size: number },
): LegendMeasurements {
  let maxLabelWidth = 0;
  let totalItemHeight = 0;
  let totalItemWidth = 0;
  let maxLabelHeight = 0;

  for (const entry of entries) {
    const dim = measurer.measure(entry.name, font);
    if (legendPosition === 'left' || legendPosition === 'right') {
      maxLabelWidth = Math.max(maxLabelWidth, dim.width);
      totalItemHeight += dim.height + LEGEND_ITEM_SPACING;
    } else {
      totalItemWidth +=
        dim.width + LEGEND_SYMBOL_SIZE + LEGEND_TEXT_SPACING + LEGEND_ITEM_SPACING;
      maxLabelHeight = Math.max(maxLabelHeight, dim.height);
    }
  }

  return { maxLabelWidth, totalItemHeight, totalItemWidth, maxLabelHeight };
}

function computeLegendPosition(
  legendPosition: ChartDiagramAST['legendPosition'],
  spec: LegendSpec,
  m: LegendMeasurements,
): LegendPositionGeom | undefined {
  const { plotArea, leftMargin, topMargin, hasY2 } = spec;
  const leftRightWidth = m.maxLabelWidth + LEGEND_SYMBOL_SIZE + LEGEND_TEXT_SPACING + LEGEND_MARGIN * 2;
  const topBottomHeight = m.maxLabelHeight + LEGEND_MARGIN * 2;
  const rightX = leftMargin + plotArea.width + (hasY2 ? AXIS_LABEL_SPACE : 0) + LEGEND_MARGIN;
  const bottomY = topMargin + plotArea.height + AXIS_LABEL_SPACE + LEGEND_MARGIN;

  switch (legendPosition) {
    case 'left':
      return { x: CHART_MARGIN, y: topMargin, width: leftRightWidth, height: m.totalItemHeight };
    case 'right':
      return { x: rightX, y: topMargin, width: leftRightWidth, height: m.totalItemHeight };
    case 'top':
      return { x: leftMargin, y: CHART_MARGIN, width: m.totalItemWidth, height: topBottomHeight };
    case 'bottom':
      return { x: leftMargin, y: bottomY, width: m.totalItemWidth, height: topBottomHeight };
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Bar geometry — vertical grouped
// ---------------------------------------------------------------------------

/** zeroY in plot-relative coords first, then offset to SVG (grouped bars). */
function computeGroupedZeroY(plotArea: PlotArea, vAxisMin: number, vAxisMax: number): number {
  const zeroYRelative = Math.max(
    0,
    Math.min(
      plotArea.height,
      plotArea.height - ((0 - vAxisMin) / (vAxisMax - vAxisMin)) * plotArea.height,
    ),
  );
  return plotArea.y + zeroYRelative;
}

/** Value-Y math + plot-area clamping shared by grouped bar rects. */
function clampedBarGeometry(
  value: number,
  zeroY: number,
  plotArea: PlotArea,
  vAxisMin: number,
  vAxisMax: number,
): { clampedY: number; clampedHeight: number } {
  const plotBottom = plotArea.y + plotArea.height;
  const plotTop = plotArea.y;
  const valueYRelative =
    plotArea.height - ((value - vAxisMin) / (vAxisMax - vAxisMin)) * plotArea.height;
  const valueY = plotArea.y + valueYRelative;

  const barY = Math.min(zeroY, valueY);
  const barHeight = Math.abs(valueY - zeroY);

  const clampedY = Math.max(plotTop, Math.min(plotBottom, barY));
  const clampedHeight = Math.max(0, Math.min(plotBottom - clampedY, barHeight));

  return { clampedY, clampedHeight };
}

export function buildBarRectsGrouped(spec: BarSpec): BarRect[] {
  const { values, seriesIndex, barSeriesCount, categoryCount, plotArea, vAxisMin, vAxisMax } = spec;
  const categoryWidth = plotArea.width / categoryCount;
  const groupBarWidth = (categoryWidth * BAR_WIDTH_RATIO) / barSeriesCount;
  const rects: BarRect[] = [];
  const zeroY = computeGroupedZeroY(plotArea, vAxisMin, vAxisMax);

  for (let i = 0; i < Math.min(values.length, categoryCount); i++) {
    const value = values[i]!;
    const x =
      plotArea.x +
      i * categoryWidth +
      ((1 - BAR_WIDTH_RATIO) / 2) * categoryWidth +
      seriesIndex * groupBarWidth;

    const { clampedY, clampedHeight } = clampedBarGeometry(value, zeroY, plotArea, vAxisMin, vAxisMax);

    rects.push({ x, y: clampedY, width: groupBarWidth, height: clampedHeight, value });
  }

  return rects;
}

// ---------------------------------------------------------------------------
// Bar geometry — vertical stacked
// ---------------------------------------------------------------------------

/** Value-Y math + clamping for one series' bar within a stacked category. */
function computeStackedBarRect(
  value: number,
  x: number,
  cumulative: StackedBarCumulative,
  layout: StackedBarLayout,
): BarRect {
  const { plotArea, vAxisMin, vAxisMax, barWidth, zeroYAbsolute } = layout;
  const plotBottom = plotArea.y + plotArea.height;
  const plotTop = plotArea.y;
  const valueYRelative =
    plotArea.height - ((value - vAxisMin) / (vAxisMax - vAxisMin)) * plotArea.height;
  const valueY = plotArea.y + valueYRelative;
  const barHeight = Math.abs(valueY - zeroYAbsolute);

  let barY: number;
  if (value < 0) {
    barY = cumulative.negative;
    cumulative.negative += barHeight;
  } else {
    cumulative.positive -= barHeight;
    barY = cumulative.positive;
  }

  const clampedY = Math.max(plotTop, Math.min(plotBottom, barY));
  const clampedHeight = Math.max(0, Math.min(plotBottom - clampedY, barHeight));

  return { x, y: clampedY, width: barWidth, height: clampedHeight, value };
}

/** Pushes this category's per-series rects into `result` (mutated in place). */
function stackCategoryBars(
  barSeriesValues: number[][],
  catIdx: number,
  layout: StackedBarLayout,
  result: BarRect[][],
): void {
  const x = layout.plotArea.x + catIdx * layout.categoryWidth + layout.barOffset;
  const cumulative: StackedBarCumulative = { positive: layout.zeroYAbsolute, negative: layout.zeroYAbsolute };

  for (let si = 0; si < barSeriesValues.length; si++) {
    const values = barSeriesValues[si]!;
    if (catIdx >= values.length) continue;

    result[si]!.push(computeStackedBarRect(values[catIdx]!, x, cumulative, layout));
  }
}

export function buildBarRectsStacked(
  barSeriesValues: number[][],
  categoryCount: number,
  plotArea: PlotArea,
  vAxisMin: number,
  vAxisMax: number,
): BarRect[][] {
  const categoryWidth = plotArea.width / categoryCount;
  const barWidth = categoryWidth * BAR_WIDTH_RATIO;
  const barOffset = (categoryWidth - barWidth) / 2;

  // One rect array per series
  const result: BarRect[][] = barSeriesValues.map(() => []);
  const zeroYRelative =
    plotArea.height - ((0 - vAxisMin) / (vAxisMax - vAxisMin)) * plotArea.height;
  const layout: StackedBarLayout = {
    categoryWidth,
    barWidth,
    barOffset,
    plotArea,
    vAxisMin,
    vAxisMax,
    zeroYAbsolute: plotArea.y + zeroYRelative,
  };

  for (let catIdx = 0; catIdx < categoryCount; catIdx++) {
    stackCategoryBars(barSeriesValues, catIdx, layout, result);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Bar geometry — horizontal
// ---------------------------------------------------------------------------

export function buildBarRectsHorizontal(
  values: number[],
  categoryCount: number,
  plotArea: PlotArea,
  hAxisMin: number,
  hAxisMax: number,
): BarRect[] {
  const categoryHeight = plotArea.height / categoryCount;
  const barThickness = categoryHeight * BAR_WIDTH_RATIO;
  const barOffset = (categoryHeight - barThickness) / 2;
  const rects: BarRect[] = [];

  for (let i = 0; i < Math.min(values.length, categoryCount); i++) {
    const value = values[i]!;
    const y = plotArea.y + i * categoryHeight + barOffset;
    const barWidth = Math.abs(
      ((value - hAxisMin) / (hAxisMax - hAxisMin)) * plotArea.width,
    );
    const x = plotArea.x;
    rects.push({ x, y, width: barWidth, height: barThickness, value });
  }

  return rects;
}

// ---------------------------------------------------------------------------
// Line / Scatter / Area point geometry
// ---------------------------------------------------------------------------

export function buildDataPoints(
  values: number[],
  xValues: number[] | null,
  ctx: PointContext,
): DataPoint[] {
  const { categoryCount, plotArea, vAxis, hAxis } = ctx;
  const points: DataPoint[] = [];

  if (xValues !== null) {
    // Coordinate-pair mode
    for (let i = 0; i < values.length; i++) {
      const yVal = values[i]!;
      const xVal = xValues[i]!;
      const px = valueToPixel(xVal, hAxis.pixelMin, hAxis.pixelMax, hAxis.min, hAxis.max);
      const py = valueToPixel(yVal, vAxis.pixelMin, vAxis.pixelMax, vAxis.min, vAxis.max);
      points.push({ x: px, y: py, value: yVal, xValue: xVal });
    }
  } else {
    // Index-based categorical
    const count = categoryCount > 0 ? categoryCount : values.length;
    const categoryWidth = plotArea.width / count;
    for (let i = 0; i < Math.min(values.length, count); i++) {
      const yVal = values[i]!;
      const px = plotArea.x + (i + 0.5) * categoryWidth;
      const py = valueToPixel(yVal, vAxis.pixelMin, vAxis.pixelMax, vAxis.min, vAxis.max);
      points.push({ x: px, y: py, value: yVal });
    }
  }

  return points;
}

// ---------------------------------------------------------------------------
// Area baseline computation
// ---------------------------------------------------------------------------

export function buildAreaBaseline(spec: AreaBaselineSpec): DataPoint[] {
  const { zeroY, currentPoints, prevCumulativeValues, xValues, ctx } = spec;

  if (prevCumulativeValues === null) {
    // Non-stacked or first stacked area: baseline is the zero line
    return currentPoints.map((p) => ({
      x: p.x,
      y: zeroY,
      value: 0,
      ...(p.xValue !== undefined ? { xValue: p.xValue } : {}),
    }));
  }

  // Stacked: baseline is previous area's top edge
  return buildDataPoints(prevCumulativeValues, xValues, ctx);
}
