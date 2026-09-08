/**
 * layoutChart() — pixel geometry for chart diagrams.
 *
 * Converts a ChartDiagramAST into a ChartGeometry that sub-renderers
 * (bar, line, area, scatter) consume directly without re-doing any math.
 *
 * Constants are sourced from ChartRenderer.java and BarRenderer.java.
 *
 * @module
 */

import type { ChartDiagramAST, ChartAnnotationDef } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { resolveColor, AXIS_LABEL_SPACE } from './chart-layout-core.js';
import type {
  PlotArea,
  BarRect,
  SeriesGeo,
  AnnotationGeometry,
  ChartGeometry,
  AxisGeometry,
  LegendGeometry,
} from './chart-layout-core.js';
import { valueToPixel } from './chart-layout-core.js';
import { buildVAxisGeometry, buildHAxisGeometry } from './chart-layout-axes.js';
import { buildLegendGeometry, buildBarRectsStacked } from './chart-layout-series.js';
import {
  CHART_MARGIN,
  TITLE_SPACE,
  LEGEND_MARGIN,
  LEGEND_SYMBOL_SIZE,
  LEGEND_TEXT_SPACING,
  LEGEND_ITEM_SPACING,
  X_AXIS_TITLE_EXTRA,
  MIN_PLOT_WIDTH,
  PLOT_HEIGHT,
} from './chart-layout-core.js';
// Per-series-type geometry dispatch (buildSeriesGeometries and its private
// helpers) split out to layout-series-dispatch.ts — 500-line cap; a pure
// move, zero behavior change.
import { buildSeriesGeometries } from './layout-series-dispatch.js';

export type {
  PlotArea,
  TickMark,
  AxisGeometry,
  BarRect,
  DataPoint,
  BarSeriesGeo,
  LineSeriesGeo,
  AreaSeriesGeo,
  ScatterSeriesGeo,
  SeriesGeo,
  LegendEntry,
  LegendGeometry,
  AnnotationGeometry,
  ChartGeometry,
} from './chart-layout-core.js';

// ---------------------------------------------------------------------------
// Module-private param/return bundles.
//
// Kept together at the top of the file, ahead of every function: lizard's
// TS parser mis-attributes an `interface` declaration placed *between* two
// functions to the NLOC/length of the preceding function (verified via a
// minimal repro), so these must not be interleaved with the functions below.
// ---------------------------------------------------------------------------

/** Estimated legend footprint, used both for margins and svg dimensions. */
interface LegendEstimate {
  width: number;
  height: number;
}

interface SvgDimensionInput {
  ast: ChartDiagramAST;
  plotWidth: number;
  plotHeight: number;
  hasY2: boolean;
  legendEstimate: LegendEstimate;
}

/** Per-series-index bookkeeping for the 'bar' series type. */
interface BarSeriesInfo {
  barSeriesIndices: number[];
  barSeriesValues: number[][];
  barSeriesCount: number;
}

interface AssembleChartGeometryInput {
  ast: ChartDiagramAST;
  theme: Theme;
  svgWidth: number;
  svgHeight: number;
  plotArea: PlotArea;
  hAxisGeo: AxisGeometry;
  vAxisGeo: AxisGeometry;
  v2AxisGeo: AxisGeometry | undefined;
  seriesGeos: SeriesGeo[];
  legend: LegendGeometry | undefined;
  annotations: AnnotationGeometry[];
}

// ---------------------------------------------------------------------------
// layoutChart() — orchestration only; each concern lives in its own helper.
// ---------------------------------------------------------------------------

export function layoutChart(ast: ChartDiagramAST, theme: Theme, measurer: StringMeasurer): ChartGeometry {
  const font = { family: theme.fontFamily, size: theme.fontSize };
  const isHorizontal = ast.orientation === 'horizontal';
  const { categoryCount, plotWidth, plotHeight } = computePlotDimensions(ast, isHorizontal);
  const colors = ast.series.map((s, i) => resolveColor(s.color, i));
  const legendEstimate = estimateLegendSize(ast, measurer, font);
  const { leftMargin, topMargin } = computeMargins(ast, legendEstimate);
  const plotArea: PlotArea = { x: leftMargin, y: topMargin, width: plotWidth, height: plotHeight };
  const hasY2 = ast.v2Axis !== null;
  const { svgWidth, svgHeight } = computeSvgDimensions({ ast, plotWidth, plotHeight, hasY2, legendEstimate });
  const { hAxisGeo, vAxisGeo, v2AxisGeo } = buildAxisGeometries(ast, plotArea);
  const barInfo = computeBarSeriesInfo(ast);
  const stackedBarRects = computeStackedBarRects(ast, categoryCount, plotArea, isHorizontal, barInfo);
  const seriesGeos = buildSeriesGeometries({
    ast,
    categoryCount,
    plotArea,
    isHorizontal,
    colors,
    vAxisGeo,
    v2AxisGeo,
    hAxisGeo,
    barSeriesIndices: barInfo.barSeriesIndices,
    barSeriesCount: barInfo.barSeriesCount,
    stackedBarRects,
  });
  const legend = buildLegendGeometry(ast, { plotArea, colors, measurer, font, leftMargin, topMargin, hasY2 });
  const annotations = buildAnnotations(ast, plotArea, hAxisGeo, vAxisGeo);

  return assembleChartGeometry({
    ast,
    theme,
    svgWidth,
    svgHeight,
    plotArea,
    hAxisGeo,
    vAxisGeo,
    v2AxisGeo,
    seriesGeos,
    legend,
    annotations,
  });
}

function assembleChartGeometry(input: AssembleChartGeometryInput): ChartGeometry {
  const { ast, theme, svgWidth, svgHeight, plotArea, hAxisGeo, vAxisGeo, v2AxisGeo, seriesGeos, legend, annotations } =
    input;
  return {
    svgWidth,
    svgHeight,
    plotArea,
    hAxis: hAxisGeo,
    vAxis: vAxisGeo,
    ...(v2AxisGeo !== undefined ? { v2Axis: v2AxisGeo } : {}),
    series: seriesGeos,
    ...(legend !== undefined ? { legend } : {}),
    annotations,
    orientation: ast.orientation,
    gridH: ast.hAxis.gridMode,
    gridV: ast.vAxis.gridMode,
    bgColor: theme.colors.background,
  };
}

// ---------------------------------------------------------------------------
// Plot dimensions — mirrors ChartRenderer.java getPlotWidth/getPlotHeight.
//
// In horizontal mode categories are rows (vAxis.labels); in vertical mode
// categories are columns (hAxis.labels).
// ---------------------------------------------------------------------------

function computePlotDimensions(
  ast: ChartDiagramAST,
  isHorizontal: boolean,
): { categoryCount: number; plotWidth: number; plotHeight: number } {
  const categoryCount = isHorizontal ? ast.vAxis.labels.length : ast.hAxis.labels.length;
  const plotWidth = Math.max(MIN_PLOT_WIDTH, categoryCount * 60);
  return { categoryCount, plotWidth, plotHeight: PLOT_HEIGHT };
}

// ---------------------------------------------------------------------------
// Legend size estimate + margins — adapted from ChartRenderer.java
// calculateDimension().
// ---------------------------------------------------------------------------

function estimateLegendSize(
  ast: ChartDiagramAST,
  measurer: StringMeasurer,
  font: { family: string; size: number },
): LegendEstimate {
  if (ast.legendPosition === 'none' || ast.series.length === 0) return { width: 0, height: 0 };

  let maxLabelW = 0;
  let totalH = 0;
  let totalW = 0;
  let maxH = 0;
  const isVertical = ast.legendPosition === 'left' || ast.legendPosition === 'right';

  for (const s of ast.series) {
    const dim = measurer.measure(s.name, font);
    if (isVertical) {
      maxLabelW = Math.max(maxLabelW, dim.width);
      totalH += dim.height + LEGEND_ITEM_SPACING;
    } else {
      totalW += dim.width + LEGEND_SYMBOL_SIZE + LEGEND_TEXT_SPACING + LEGEND_ITEM_SPACING;
      maxH = Math.max(maxH, dim.height);
    }
  }

  if (isVertical) {
    return { width: maxLabelW + LEGEND_SYMBOL_SIZE + LEGEND_TEXT_SPACING + LEGEND_MARGIN * 2, height: totalH };
  }
  return { width: totalW, height: maxH + LEGEND_MARGIN * 2 };
}

function computeMargins(
  ast: ChartDiagramAST,
  legendEstimate: LegendEstimate,
): { leftMargin: number; topMargin: number } {
  let leftMargin = CHART_MARGIN + AXIS_LABEL_SPACE;
  let topMargin = CHART_MARGIN + TITLE_SPACE;

  if (ast.legendPosition === 'left') {
    leftMargin += legendEstimate.width + LEGEND_MARGIN;
  } else if (ast.legendPosition === 'top') {
    topMargin += legendEstimate.height + LEGEND_MARGIN;
  }

  return { leftMargin, topMargin };
}

// ---------------------------------------------------------------------------
// SVG dimensions
// ---------------------------------------------------------------------------

function computeSvgDimensions(input: SvgDimensionInput): { svgWidth: number; svgHeight: number } {
  const { ast, plotWidth, plotHeight, hasY2, legendEstimate } = input;
  const hasXTitle = ast.hAxis.title !== '' && ast.hAxis.title !== undefined;

  let svgWidth = CHART_MARGIN + AXIS_LABEL_SPACE + plotWidth + (hasY2 ? AXIS_LABEL_SPACE : 0) + CHART_MARGIN;
  let svgHeight = CHART_MARGIN + TITLE_SPACE + plotHeight + AXIS_LABEL_SPACE + CHART_MARGIN;

  if (hasXTitle) svgHeight += X_AXIS_TITLE_EXTRA;

  if (ast.legendPosition === 'left' || ast.legendPosition === 'right') {
    svgWidth += legendEstimate.width + LEGEND_MARGIN;
  } else if (ast.legendPosition === 'top' || ast.legendPosition === 'bottom') {
    svgHeight += legendEstimate.height + LEGEND_MARGIN;
  }

  return { svgWidth, svgHeight };
}

// ---------------------------------------------------------------------------
// Axis geometries
// ---------------------------------------------------------------------------

function buildAxisGeometries(
  ast: ChartDiagramAST,
  plotArea: PlotArea,
): { hAxisGeo: AxisGeometry; vAxisGeo: AxisGeometry; v2AxisGeo: AxisGeometry | undefined } {
  const hAxisGeo = buildHAxisGeometry(ast.hAxis, plotArea);
  const vAxisGeo = buildVAxisGeometry(ast.vAxis, plotArea, /* leftSide */ true);
  const v2AxisGeo = ast.v2Axis !== null ? buildVAxisGeometry(ast.v2Axis, plotArea, /* leftSide */ false) : undefined;
  return { hAxisGeo, vAxisGeo, v2AxisGeo };
}

// ---------------------------------------------------------------------------
// Bar-series bookkeeping (grouped/stacked share the bar-only index list)
// ---------------------------------------------------------------------------

function computeBarSeriesInfo(ast: ChartDiagramAST): BarSeriesInfo {
  const barSeriesIndices: number[] = [];
  const barSeriesValues: number[][] = [];
  for (let i = 0; i < ast.series.length; i++) {
    if (ast.series[i]!.type === 'bar') {
      barSeriesIndices.push(i);
      barSeriesValues.push(ast.series[i]!.values);
    }
  }
  return { barSeriesIndices, barSeriesValues, barSeriesCount: barSeriesIndices.length };
}

function computeStackedBarRects(
  ast: ChartDiagramAST,
  categoryCount: number,
  plotArea: PlotArea,
  isHorizontal: boolean,
  barInfo: BarSeriesInfo,
): BarRect[][] | null {
  if (ast.stackMode !== 'stacked' || barInfo.barSeriesCount <= 1 || isHorizontal) return null;

  const count = categoryCount > 0 ? categoryCount : Math.max(...barInfo.barSeriesValues.map((v) => v.length));
  return buildBarRectsStacked(barInfo.barSeriesValues, count, plotArea, ast.vAxis.min, ast.vAxis.max);
}

// ---------------------------------------------------------------------------
// Annotations
// ---------------------------------------------------------------------------

function computeAnnotationLabelX(
  ann: ChartAnnotationDef,
  ast: ChartDiagramAST,
  plotArea: PlotArea,
  hAxisGeo: AxisGeometry,
): number {
  if (typeof ann.xPos === 'number') {
    // Numeric h-axis
    return valueToPixel(ann.xPos, hAxisGeo.pixelMin, hAxisGeo.pixelMax, hAxisGeo.min, hAxisGeo.max);
  }
  // Categorical h-axis — find matching label
  const idx = ast.hAxis.labels.indexOf(ann.xPos);
  if (idx < 0) return 0;
  return plotArea.x + (idx + 0.5) * (plotArea.width / ast.hAxis.labels.length);
}

function buildOneAnnotation(
  ann: ChartAnnotationDef,
  ast: ChartDiagramAST,
  plotArea: PlotArea,
  hAxisGeo: AxisGeometry,
  vAxisGeo: AxisGeometry,
): AnnotationGeometry {
  const labelX = computeAnnotationLabelX(ann, ast, plotArea, hAxisGeo);
  // yPos always numeric, maps via primary vAxis
  const dataY = valueToPixel(ann.yPos, vAxisGeo.pixelMin, vAxisGeo.pixelMax, vAxisGeo.min, vAxisGeo.max);

  // Label sits 28px above the data point; arrow points from label down to data point
  const ANNOTATION_OFFSET = 28;
  return {
    text: ann.text,
    labelX,
    labelY: dataY - ANNOTATION_OFFSET,
    hasArrow: ann.hasArrow,
    ...(ann.hasArrow ? { arrowTargetX: labelX, arrowTargetY: dataY } : {}),
  };
}

function buildAnnotations(
  ast: ChartDiagramAST,
  plotArea: PlotArea,
  hAxisGeo: AxisGeometry,
  vAxisGeo: AxisGeometry,
): AnnotationGeometry[] {
  return ast.annotations.map((ann) => buildOneAnnotation(ann, ast, plotArea, hAxisGeo, vAxisGeo));
}
