/**
 * Per-series-type geometry dispatch (bar/line/area/scatter) for chart
 * diagrams.
 *
 * Split out of `layout.ts` to keep that file under this project's 500-line
 * cap — a pure move, zero behavior change. `buildSeriesGeometries` is the
 * only entry point `layout.ts#layoutChart` calls; every other symbol here
 * is a private helper of that dispatch.
 */

import type { ChartSeriesDef, ChartDiagramAST } from './ast.js';
import type { PlotArea, BarRect, SeriesGeo, AxisGeometry, PointContext } from './chart-layout-core.js';
import { valueToPixel } from './chart-layout-core.js';
import {
  buildBarRectsGrouped,
  buildBarRectsHorizontal,
  buildDataPoints,
  buildAreaBaseline,
} from './chart-layout-series.js';

/** Shared read-only context threaded through per-series-type geometry
 * dispatch (buildSeriesGeometries and its per-type helpers). */
interface SeriesBuildContext {
  ast: ChartDiagramAST;
  categoryCount: number;
  plotArea: PlotArea;
  isHorizontal: boolean;
  colors: string[];
  vAxisGeo: AxisGeometry;
  v2AxisGeo: AxisGeometry | undefined;
  hAxisGeo: AxisGeometry;
  barSeriesIndices: number[];
  barSeriesCount: number;
  stackedBarRects: BarRect[][] | null;
}

/** Per-series dispatch payload: the series itself plus its resolved index,
 * color, and active v-axis (primary or secondary). */
interface SeriesDispatchInput {
  series: ChartSeriesDef;
  index: number;
  color: string;
  activeVAxis: AxisGeometry;
}

/** Mutable area-stacking state threaded across the series loop. */
interface AreaStackState {
  cumulativeValues: number[] | null;
  baselineMap: Map<number, number[] | null>;
}

// ---------------------------------------------------------------------------
// Per-series-type geometry dispatch
// ---------------------------------------------------------------------------

function resolveActiveVAxis(s: ChartSeriesDef, ctx: SeriesBuildContext): AxisGeometry {
  return s.useSecondaryAxis && ctx.v2AxisGeo !== undefined ? ctx.v2AxisGeo : ctx.vAxisGeo;
}

export function buildSeriesGeometries(ctx: SeriesBuildContext): SeriesGeo[] {
  const seriesGeos: SeriesGeo[] = [];
  const areaState: AreaStackState = { cumulativeValues: null, baselineMap: new Map() };

  for (let i = 0; i < ctx.ast.series.length; i++) {
    const s = ctx.ast.series[i]!;
    const input: SeriesDispatchInput = {
      series: s,
      index: i,
      color: ctx.colors[i]!,
      activeVAxis: resolveActiveVAxis(s, ctx),
    };

    switch (s.type) {
      case 'bar':
        seriesGeos.push(buildBarSeriesGeo(input, ctx));
        break;
      case 'line':
        seriesGeos.push(buildLineSeriesGeo(input, ctx));
        break;
      case 'area':
        seriesGeos.push(buildAreaSeriesGeo(input, ctx, areaState));
        break;
      case 'scatter':
        seriesGeos.push(buildScatterSeriesGeo(input, ctx));
        break;
    }
  }

  return seriesGeos;
}

function computeBarRectsForSeries(
  s: ChartSeriesDef,
  index: number,
  catCount: number,
  ctx: SeriesBuildContext,
): BarRect[] {
  if (ctx.isHorizontal) {
    // In horizontal mode v-axis holds category labels; numeric range for
    // bar widths comes from hAxis (the horizontal numeric axis).
    return buildBarRectsHorizontal(s.values, catCount, ctx.plotArea, ctx.ast.hAxis.min, ctx.ast.hAxis.max);
  }
  const barIdx = ctx.barSeriesIndices.indexOf(index);
  if (ctx.stackedBarRects !== null) {
    return ctx.stackedBarRects[barIdx] ?? [];
  }
  // Grouped (or single)
  return buildBarRectsGrouped({
    values: s.values,
    seriesIndex: barIdx,
    barSeriesCount: ctx.barSeriesCount,
    categoryCount: catCount,
    plotArea: ctx.plotArea,
    vAxisMin: ctx.ast.vAxis.min,
    vAxisMax: ctx.ast.vAxis.max,
  });
}

function buildBarSeriesGeo(input: SeriesDispatchInput, ctx: SeriesBuildContext): SeriesGeo {
  const s = input.series;
  const catCount = ctx.categoryCount > 0 ? ctx.categoryCount : s.values.length;
  const rects = computeBarRectsForSeries(s, input.index, catCount, ctx);

  return {
    type: 'bar',
    name: s.name,
    color: input.color,
    showLabels: s.showLabels,
    rects,
    horizontal: ctx.isHorizontal,
  };
}

function pointContextFor(s: ChartSeriesDef, activeVAxis: AxisGeometry, ctx: SeriesBuildContext): PointContext {
  const catCount = ctx.categoryCount > 0 ? ctx.categoryCount : s.values.length;
  return { categoryCount: catCount, plotArea: ctx.plotArea, vAxis: activeVAxis, hAxis: ctx.hAxisGeo };
}

function buildLineSeriesGeo(input: SeriesDispatchInput, ctx: SeriesBuildContext): SeriesGeo {
  const s = input.series;
  const points = buildDataPoints(s.values, s.xValues, pointContextFor(s, input.activeVAxis, ctx));
  return {
    type: 'line',
    name: s.name,
    color: input.color,
    showLabels: s.showLabels,
    markerShape: s.markerShape,
    points,
  };
}

function buildScatterSeriesGeo(input: SeriesDispatchInput, ctx: SeriesBuildContext): SeriesGeo {
  const s = input.series;
  const points = buildDataPoints(s.values, s.xValues, pointContextFor(s, input.activeVAxis, ctx));
  return {
    type: 'scatter',
    name: s.name,
    color: input.color,
    showLabels: s.showLabels,
    markerShape: s.markerShape,
    markerSize: s.markerSize ?? 8,
    points,
  };
}

/** Mutates `areaState` in place: appends this series' values onto the
 * running cumulative total for the next stacked area's baseline. */
function updateAreaCumulative(prev: number[] | null, values: number[]): number[] {
  if (prev === null) return [...values];
  const next = [...prev];
  for (let j = 0; j < Math.min(values.length, next.length); j++) {
    next[j] = (next[j] ?? 0) + (values[j] ?? 0);
  }
  for (let j = next.length; j < values.length; j++) {
    next.push(values[j] ?? 0);
  }
  return next;
}

function buildAreaSeriesGeo(input: SeriesDispatchInput, ctx: SeriesBuildContext, areaState: AreaStackState): SeriesGeo {
  const s = input.series;
  const pointCtx = pointContextFor(s, input.activeVAxis, ctx);
  const points = buildDataPoints(s.values, s.xValues, pointCtx);

  const activeZeroY = valueToPixel(
    0,
    input.activeVAxis.pixelMin,
    input.activeVAxis.pixelMax,
    input.activeVAxis.min,
    input.activeVAxis.max,
  );
  const baselineValues = areaState.baselineMap.get(input.index) ?? areaState.cumulativeValues;
  const baselinePoints = buildAreaBaseline({
    zeroY: activeZeroY,
    currentPoints: points,
    prevCumulativeValues: baselineValues ?? null,
    xValues: s.xValues,
    ctx: pointCtx,
  });

  areaState.cumulativeValues = updateAreaCumulative(areaState.cumulativeValues, s.values);

  return { type: 'area', name: s.name, color: input.color, showLabels: s.showLabels, points, baselinePoints };
}
