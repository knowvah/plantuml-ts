/**
 * Chart axis rendering: grid lines + horizontal/vertical axis drawing
 * (ticks, tick labels, axis titles). Split out of `renderer.ts` (line cap);
 * self-contained leaf consumed by the chart renderer.
 */

import type { ChartGeometry, AxisGeometry } from './layout.js';
import type { Theme } from '../../core/theme.js';
import { line, text } from '../../core/svg.js';
import { fmt } from '../../core/svg-format.js';
import type {} from '../../core/dispatcher.js';
import {} from './renderers/bar.js';
import {} from './renderers/line.js';
import {} from './renderers/area.js';
import {} from './renderers/scatter.js';

export const TICK_SIZE = 5;
export const TICK_LABEL_FONT_SIZE = 11;
export const AXIS_TITLE_FONT_SIZE = 12;

/**
 * Draw horizontal grid lines across the plot area at every v-axis grid pixel.
 */
export function drawHorizontalGridLines(geo: ChartGeometry): string {
  if (geo.vAxis.gridPixels.length === 0) return '';
  const parts: string[] = [];
  for (const py of geo.vAxis.gridPixels) {
    parts.push(
      line(geo.plotArea.x, py, geo.plotArea.x + geo.plotArea.width, py, {
        stroke: '#CCCCCC',
        strokeWidth: 1,
        strokeDasharray: '4 2',
      }),
    );
  }
  return parts.join('\n');
}

/**
 * Draw vertical grid lines down the plot area at every h-axis grid pixel.
 */
export function drawVerticalGridLines(geo: ChartGeometry): string {
  if (geo.hAxis.gridPixels.length === 0) return '';
  const parts: string[] = [];
  for (const px of geo.hAxis.gridPixels) {
    parts.push(
      line(px, geo.plotArea.y, px, geo.plotArea.y + geo.plotArea.height, {
        stroke: '#CCCCCC',
        strokeWidth: 1,
        strokeDasharray: '4 2',
      }),
    );
  }
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Axis rendering
// ---------------------------------------------------------------------------

/**
 * Draw the horizontal (category / x) axis:
 *  - Axis line along the bottom of the plot area
 *  - A short vertical tick below the axis for each tick mark
 *  - A centered label below each tick
 *  - An optional title centered below the axis
 */
export function drawHAxis(axis: AxisGeometry, geo: ChartGeometry, theme: Theme): string {
  const parts: string[] = [];
  const plotBottom = geo.plotArea.y + geo.plotArea.height;

  // Axis line
  parts.push(
    line(geo.plotArea.x, plotBottom, geo.plotArea.x + geo.plotArea.width, plotBottom, {
      stroke: theme.colors.border,
      strokeWidth: 1,
    }),
  );

  // Tick marks and labels
  for (const tick of axis.ticks) {
    parts.push(
      line(tick.pixelPos, plotBottom, tick.pixelPos, plotBottom + TICK_SIZE, {
        stroke: theme.colors.border,
        strokeWidth: 1,
      }),
    );
    parts.push(
      text(tick.pixelPos, plotBottom + TICK_SIZE + 4, tick.label, {
        fontFamily: theme.fontFamily,
        fontSize: TICK_LABEL_FONT_SIZE,
        fill: theme.colors.text,
        textAnchor: 'middle',
        dominantBaseline: 'hanging',
      }),
    );
  }

  // Axis title
  if (axis.title.length > 0) {
    if (axis.titlePos.rotate) {
      parts.push(
        text(axis.titlePos.x, axis.titlePos.y, axis.title, {
          fontFamily: theme.fontFamily,
          fontSize: AXIS_TITLE_FONT_SIZE,
          fill: theme.colors.text,
          textAnchor: 'middle',
          transform: `rotate(-90,${fmt(axis.titlePos.x)},${fmt(axis.titlePos.y)})`,
        }),
      );
    } else {
      parts.push(
        text(axis.titlePos.x, axis.titlePos.y, axis.title, {
          fontFamily: theme.fontFamily,
          fontSize: AXIS_TITLE_FONT_SIZE,
          fill: theme.colors.text,
          textAnchor: 'middle',
        }),
      );
    }
  }

  return parts.join('\n');
}

/**
 * Draw a vertical (y) axis — either primary (left) or secondary (right).
 *
 * leftSide=true  → axis on left edge, ticks extend left, labels right-aligned left of ticks
 * leftSide=false → axis on right edge, ticks extend right, labels left-aligned right of ticks
 */
export function drawVAxis(
  axis: AxisGeometry,
  geo: ChartGeometry,
  theme: Theme,
  leftSide: boolean,
): string {
  const parts: string[] = [];
  const axisX = leftSide ? geo.plotArea.x : geo.plotArea.x + geo.plotArea.width;

  // Axis line
  parts.push(
    line(axisX, geo.plotArea.y, axisX, geo.plotArea.y + geo.plotArea.height, {
      stroke: theme.colors.border,
      strokeWidth: 1,
    }),
  );

  // Tick marks and labels
  for (const tick of axis.ticks) {
    if (leftSide) {
      parts.push(
        line(axisX - TICK_SIZE, tick.pixelPos, axisX, tick.pixelPos, {
          stroke: theme.colors.border,
          strokeWidth: 1,
        }),
      );
      parts.push(
        text(axisX - TICK_SIZE - 3, tick.pixelPos, tick.label, {
          fontFamily: theme.fontFamily,
          fontSize: TICK_LABEL_FONT_SIZE,
          fill: theme.colors.text,
          textAnchor: 'end',
          dominantBaseline: 'middle',
        }),
      );
    } else {
      parts.push(
        line(axisX, tick.pixelPos, axisX + TICK_SIZE, tick.pixelPos, {
          stroke: theme.colors.border,
          strokeWidth: 1,
        }),
      );
      parts.push(
        text(axisX + TICK_SIZE + 3, tick.pixelPos, tick.label, {
          fontFamily: theme.fontFamily,
          fontSize: TICK_LABEL_FONT_SIZE,
          fill: theme.colors.text,
          textAnchor: 'start',
          dominantBaseline: 'middle',
        }),
      );
    }
  }

  // Axis title: left axis rotates -90° (reads bottom-to-top),
  //             right axis rotates +90° (reads top-to-bottom, letters face outward)
  if (axis.title.length > 0) {
    const rotateDeg = leftSide ? -90 : 90;
    parts.push(
      text(axis.titlePos.x, axis.titlePos.y, axis.title, {
        fontFamily: theme.fontFamily,
        fontSize: AXIS_TITLE_FONT_SIZE,
        fill: theme.colors.text,
        textAnchor: 'middle',
        transform: `rotate(${fmt(rotateDeg)},${fmt(axis.titlePos.x)},${fmt(axis.titlePos.y)})`,
      }),
    );
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Legend rendering
// ---------------------------------------------------------------------------
