/**
 * Chart layout core vocabulary: plot-area / axis / series / legend geometry
 * interfaces plus the shared value->pixel, axis-value formatting, and series
 * color helpers. Split out of `layout.ts` (line cap); a leaf everything imports.
 */

import type { GridMode, SeriesType } from './ast.js';
import type {} from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';

export const CHART_MARGIN = 20;
export const TITLE_SPACE = 30;
export const LEGEND_MARGIN = 10;
export const LEGEND_SYMBOL_SIZE = 12;
export const LEGEND_TEXT_SPACING = 5;
export const LEGEND_ITEM_SPACING = 15;
export const X_AXIS_TITLE_EXTRA = 20;
export const BAR_WIDTH_RATIO = 0.6; // from BarRenderer.java
export const MIN_PLOT_WIDTH = 400;
export const PLOT_HEIGHT = 300;

export const AXIS_LABEL_SPACE = 40;

const DEFAULT_COLORS: readonly string[] = [
  '#8888FF',
  '#FF8888',
  '#88FF88',
  '#FFAA00',
  '#AA88FF',
  '#FF88AA',
];

export interface PlotArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TickMark {
  /** Data value (NaN for categorical ticks). */
  value: number;
  /** Display string. */
  label: string;
  /** Pixel coordinate along the axis. */
  pixelPos: number;
}

export interface AxisGeometry {
  min: number;
  max: number;
  ticks: TickMark[];
  title: string;
  titlePos: { x: number; y: number; rotate: boolean };
  /** Empty when gridMode is 'off'. */
  gridPixels: number[];
  /** Pixel coord of axis min value. */
  pixelMin: number;
  /** Pixel coord of axis max value. */
  pixelMax: number;
}

export interface BarRect {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Original data value (for labels). */
  value: number;
}

export interface DataPoint {
  /** Pixel x coordinate. */
  x: number;
  /** Pixel y coordinate. */
  y: number;
  /** Original y data value (for labels). */
  value: number;
  /** Original x data value (coordinate-pair mode only). */
  xValue?: number;
}

export interface BarSeriesGeo {
  type: 'bar';
  name: string;
  color: string;
  showLabels: boolean;
  rects: BarRect[];
  horizontal: boolean;
}

export interface LineSeriesGeo {
  type: 'line';
  name: string;
  color: string;
  showLabels: boolean;
  markerShape: 'circle' | 'square' | 'triangle';
  points: DataPoint[];
}

export interface AreaSeriesGeo {
  type: 'area';
  name: string;
  color: string;
  showLabels: boolean;
  points: DataPoint[];
  /** Bottom edge — zero-line or previous stacked area top. */
  baselinePoints: DataPoint[];
}

export interface ScatterSeriesGeo {
  type: 'scatter';
  name: string;
  color: string;
  showLabels: boolean;
  markerShape: 'circle' | 'square' | 'triangle';
  markerSize: number; // diameter in px; default 8
  points: DataPoint[];
}

export type SeriesGeo =
  | BarSeriesGeo
  | LineSeriesGeo
  | AreaSeriesGeo
  | ScatterSeriesGeo;

export interface LegendEntry {
  name: string;
  color: string;
  seriesType: SeriesType;
  /** Scatter-only: marker shape for the legend swatch. */
  markerShape?: 'circle' | 'square' | 'triangle';
  /** Scatter-only: marker diameter for the legend swatch. */
  markerSize?: number;
}

export interface LegendGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  entries: LegendEntry[];
  /** Which side the legend sits on — drives vertical vs horizontal stacking. */
  position: 'left' | 'right' | 'top' | 'bottom';
}

export interface AnnotationGeometry {
  text: string;
  labelX: number;
  labelY: number;
  hasArrow: boolean;
  arrowTargetX?: number;
  arrowTargetY?: number;
}

export interface ChartGeometry {
  svgWidth: number;
  svgHeight: number;
  plotArea: PlotArea;
  hAxis: AxisGeometry;
  vAxis: AxisGeometry;
  v2Axis?: AxisGeometry;
  series: SeriesGeo[];
  legend?: LegendGeometry;
  annotations: AnnotationGeometry[];
  orientation: 'vertical' | 'horizontal';
  gridH: GridMode;
  gridV: GridMode;
  bgColor: string;
}

// ---------------------------------------------------------------------------
// Param-object bundles (keep per-function param counts <= 5; see
// chart-layout-series.ts / layout.ts)
// ---------------------------------------------------------------------------

/** Shared category/plot/axis context for line/scatter/area point building. */
export interface PointContext {
  categoryCount: number;
  plotArea: PlotArea;
  vAxis: AxisGeometry;
  hAxis: AxisGeometry;
}

/** Bundled inputs for buildBarRectsGrouped. */
export interface BarSpec {
  values: number[];
  seriesIndex: number;
  barSeriesCount: number;
  categoryCount: number;
  plotArea: PlotArea;
  vAxisMin: number;
  vAxisMax: number;
}

/** Bundled geometry/measure inputs for buildLegendGeometry (ast stays a
 * separate positional param since it also drives the early-return check). */
export interface LegendSpec {
  plotArea: PlotArea;
  colors: string[];
  measurer: StringMeasurer;
  font: { family: string; size: number };
  leftMargin: number;
  topMargin: number;
  hasY2: boolean;
}

/** Bundled inputs for buildAreaBaseline. */
export interface AreaBaselineSpec {
  zeroY: number;
  currentPoints: DataPoint[];
  prevCumulativeValues: number[] | null;
  xValues: number[] | null;
  ctx: PointContext;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a data value to a pixel coordinate using the ChartAxis.java formula:
 *
 *   pixelMin + (value - axisMin) / (axisMax - axisMin) * (pixelMax - pixelMin)
 *
 * For the v-axis (y), pass pixelMin = plotArea bottom and pixelMax = plotArea top
 * so that larger values map to smaller pixel y (SVG y grows downward).
 */
export function valueToPixel(
  value: number,
  pixelMin: number,
  pixelMax: number,
  axisMin: number,
  axisMax: number,
): number {
  if (axisMax === axisMin) return pixelMin;
  return pixelMin + ((value - axisMin) / (axisMax - axisMin)) * (pixelMax - pixelMin);
}

/**
 * Format a numeric value for axis tick labels — mirrors ChartRenderer.java formatAxisValue().
 */
export function formatAxisValue(value: number): string {
  if (Math.abs(value) < 0.01 && value !== 0) {
    return value.toExponential(2);
  }
  if (value === Math.trunc(value)) {
    return String(Math.trunc(value));
  }
  return value.toFixed(1);
}

/**
 * Resolve a color with fallback from the default palette.
 */
export function resolveColor(rawColor: string | null, index: number): string {
  if (rawColor !== null && rawColor.length > 0) return rawColor;
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length]!;
}

// ---------------------------------------------------------------------------
// Axis tick generation
// ---------------------------------------------------------------------------
