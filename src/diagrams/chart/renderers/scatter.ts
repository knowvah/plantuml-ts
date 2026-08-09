/**
 * ScatterRenderer — draws a scatter chart series as an SVG fragment.
 *
 * Ported from ScatterRenderer.java (net.sourceforge.plantuml.chart).
 * Key distinction from line: scatter draws isolated markers at each
 * data point with NO connecting line segments.
 *
 * @module
 */

import type { ScatterSeriesGeo, DataPoint } from '../layout.js';
import type { Theme } from '../../../core/theme.js';
import { circle, rect, polygon, text } from '../../../core/svg.js';

// ---------------------------------------------------------------------------
// Marker drawing helpers
// ---------------------------------------------------------------------------

function drawCircleMarker(p: DataPoint, color: string, r: number): string {
  return circle(p.x, p.y, r, { fill: color, stroke: color });
}

function drawSquareMarker(p: DataPoint, color: string, r: number): string {
  const size = r * 2;
  return rect(p.x - r, p.y - r, size, size, { fill: color, stroke: color });
}

function drawTriangleMarker(p: DataPoint, color: string, r: number): string {
  // Upward-pointing triangle: apex at y-(r+1), base at y+(r-1), width ±r.
  // Matches ScatterRenderer.java proportions at default size (r=4).
  return polygon(
    [
      { x: p.x, y: p.y - (r + 1) },
      { x: p.x - r, y: p.y + (r - 1) },
      { x: p.x + r, y: p.y + (r - 1) },
    ],
    { fill: color, stroke: color },
  );
}

function drawMarker(
  p: DataPoint,
  shape: ScatterSeriesGeo['markerShape'],
  color: string,
  r: number,
): string {
  switch (shape) {
    case 'square':
      return drawSquareMarker(p, color, r);
    case 'triangle':
      return drawTriangleMarker(p, color, r);
    default:
      return drawCircleMarker(p, color, r);
  }
}

// ---------------------------------------------------------------------------
// Data label helper
// ---------------------------------------------------------------------------

function drawLabel(p: DataPoint): string {
  return text(p.x + 6, p.y - 4, String(p.value), { fontSize: 10 });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Draw a single scatter series as an SVG fragment (no `<svg>` wrapper).
 *
 * Renders isolated markers (circle / square / triangle) at every data
 * point. Unlike line charts, NO connecting line segments are drawn —
 * this is the defining characteristic of scatter charts in upstream.
 *
 * Pixel coordinates come pre-computed from `geo.points`; this function
 * performs no axis-to-pixel math. Coordinate-pair mode (xValue set on
 * points) is transparent — layout has already resolved pixel positions.
 */
export function drawScatter(geo: ScatterSeriesGeo, _theme: Theme): string {
  if (geo.points.length === 0) return '';

  // markerSize is the full diameter; we draw using the radius
  const r = geo.markerSize / 2;
  const parts: string[] = [];

  for (const p of geo.points) {
    parts.push(drawMarker(p, geo.markerShape, geo.color, r));
    if (geo.showLabels) {
      parts.push(drawLabel(p));
    }
  }

  return parts.join('\n');
}
