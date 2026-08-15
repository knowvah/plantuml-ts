/**
 * Activity node-shape rendering: per-shape SVG emitters (start/stop/end,
 * action, bar, diamond, chevrons, hexagon, parallelogram, note) plus the
 * renderNode dispatcher and shared label/color helpers. Split out of
 * `renderer.ts` (line cap); leaf consumed by edge/swimlane rendering.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type {} from '../../core/dispatcher.js';
import { rect, text, diamond, noteBox, circle, line, path, polygon, multilineText } from '../../core/svg.js';
import { renderNodeLabel } from '../../core/latex.js';
import { ACTION_H_PAD, NOTE_FOLD } from './activity-layout-constants.js';

const ACTION_RX = 8;

export function renderLabel(label: string, cx: number, cy: number, theme: Theme): string {
  return renderNodeLabel(label, cx, cy, theme);
}

export function renderMultilineText(
  lines: string[],
  cx: number,
  cy: number,
  theme: Theme,
): string {
  const lh = theme.fontSize * 1.4;
  const totalH = lh * lines.length;
  // y of first line baseline so the block is vertically centred around cy
  const y = cy - totalH / 2 + lh * 0.8;
  return multilineText(lines, cx, y, lh, {
    textAnchor: 'middle',
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fill: theme.colors.text,
  });
}

// ---------------------------------------------------------------------------
// Activity-specific color resolution
// ---------------------------------------------------------------------------

export interface ActivityColors {
  nodeFill: string;
  nodeBorder: string;
  barFill: string;
  startFill: string;
  endFill: string;
  diamondFill: string;
  diamondBorder: string;
}

export function actColors(theme: Theme): ActivityColors {
  const act = theme.colors.graph.activity;
  return {
    nodeFill: act?.background ?? theme.colors.nodeBackground,
    nodeBorder: act?.border ?? theme.colors.border,
    barFill: act?.barColor ?? theme.colors.border,
    startFill: act?.startColor ?? theme.colors.border,
    endFill: act?.endColor ?? theme.colors.border,
    diamondFill: act?.diamondBackground ?? theme.colors.nodeBackground,
    diamondBorder: act?.diamondBorder ?? theme.colors.border,
  };
}

// ---------------------------------------------------------------------------
// Node shape renderers
// ---------------------------------------------------------------------------

export function renderStart(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const r = node.height / 2;
  return circle(cx, cy, r, { fill: actColors(theme).startFill });
}

export function renderStop(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const outerR = node.height / 2;
  const innerR = outerR * 0.55;
  const c = actColors(theme);
  return (
    circle(cx, cy, outerR, { fill: 'none', stroke: c.endFill, strokeWidth: 2 }) +
    circle(cx, cy, innerR, { fill: c.endFill })
  );
}

/**
 * Renders an `end` node as a circle with an X through it, matching upstream
 * PlantUML's distinction between `stop` (bullseye) and `end` (crossed circle).
 */
export function renderEnd(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const r = node.height / 2;
  // Diagonal length so the X tips reach the circle border at 45°
  const d = r * Math.SQRT1_2;
  const endFill = actColors(theme).endFill;
  return (
    circle(cx, cy, r, { fill: 'none', stroke: endFill, strokeWidth: 1.5 }) +
    line(cx - d, cy - d, cx + d, cy + d, { stroke: endFill, strokeWidth: 1.5 }) +
    line(cx - d, cy + d, cx + d, cy - d, { stroke: endFill, strokeWidth: 1.5 })
  );
}

const CODE_BLOCK_RE = /^<code>([\s\S]*?)<\/code>$/i;

export function renderAction(node: ActivityNodeGeo, theme: Theme): string {
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  const box = rect(node.x, node.y, node.width, node.height, {
    fill,
    stroke: c.nodeBorder,
    strokeWidth: 1,
    rx: ACTION_RX,
  });
  const label = node.label ?? '';
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;

  // <code>...</code> block — render left-aligned in monospace, strip the tags.
  const codeMatch = CODE_BLOCK_RE.exec(label.trim());
  if (codeMatch !== null) {
    const codeContent = codeMatch[1]!.replace(/^\n/, '').replace(/\n$/, '');
    const codeLines = codeContent.split('\n');
    const monoFamily = 'monospace';
    const lh = theme.fontSize * 1.4;
    const totalH = lh * codeLines.length;
    const lineY = cy - totalH / 2 + lh * 0.8;
    const labelX = node.x + ACTION_H_PAD;
    const labelText = multilineText(codeLines, labelX, lineY, lh, {
      textAnchor: 'start',
      fontFamily: monoFamily,
      fontSize: theme.fontSize,
      fill: theme.colors.text,
    });
    return box + labelText;
  }

  const lines = label.split('\n');
  let labelEl: string;
  if (lines.length > 1) {
    const lh = theme.fontSize * 1.4;
    const totalH = lh * lines.length;
    const lineY = cy - totalH / 2 + lh * 0.8;
    const labelX = node.x + ACTION_H_PAD;
    const labelText = multilineText(lines, labelX, lineY, lh, {
      textAnchor: 'start',
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      fill: theme.colors.text,
    });
    labelEl = labelText;
  } else {
    labelEl = renderLabel(label, cx, cy + theme.fontSize / 3, theme);
  }
  return box + labelEl;
}

export function renderBar(node: ActivityNodeGeo, theme: Theme): string {
  return rect(node.x, node.y, node.width, node.height, {
    fill: actColors(theme).barFill,
  });
}

export function renderDiamond(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const size = node.width / 2;
  const c = actColors(theme);
  const shape = diamond(cx, cy, size, {
    fill: c.diamondFill,
    stroke: c.diamondBorder,
  });
  if (node.label === undefined || node.label === '') return shape;
  const label = text(cx, cy, node.label, {
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize - 2,
    fill: theme.colors.text,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
  });
  return shape + label;
}

export function renderSignalLabel(label: string, x: number, cy: number, theme: Theme): string {
  const labelX = x + ACTION_H_PAD;
  const lines = label.split('\n');
  if (lines.length === 1) {
    return text(labelX, cy, label, {
      fill: theme.colors.text,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      textAnchor: 'start',
      dominantBaseline: 'central',
    });
  }
  const lh = theme.fontSize * 1.4;
  const totalH = lh * lines.length;
  const lineY = cy - totalH / 2 + lh * 0.8;
  const labelText = multilineText(lines, labelX, lineY, lh, {
    textAnchor: 'start',
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fill: theme.colors.text,
  });
  return labelText;
}

export function renderChevronLeft(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  // <<input>> = UML receive signal: flat left side (right-angle corners at
  // top-left and bottom-left). Right side: two lines from top-right and
  // bottom-right corners go inward/left at 60° to horizontal, meeting at
  // the midpoint of the right edge → concave right notch pointing left.
  // dent = (h/2) / tan(60°) = h / (2√3)
  const dent = h / (2 * Math.sqrt(3));
  const shape = polygon([
    { x: x, y: y },
    { x: x + w, y: y },
    { x: x + w - dent, y: y + h / 2 },
    { x: x + w, y: y + h },
    { x: x, y: y + h },
  ], { fill, stroke: c.nodeBorder, strokeWidth: 1 });
  return shape + renderSignalLabel(node.label ?? '', x, y + h / 2, theme);
}

export function renderChevronRight(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  // 60° to horizontal: dent = (h/2) / tan(60°) = h / (2√3)
  const dent = h / (2 * Math.sqrt(3));
  // <<output>> = right-pointing arrow: body rectangle indented on right,
  // vertex pointing right at the midpoint of the right edge.
  const shape = polygon([
    { x: x, y: y },
    { x: x + w - dent, y: y },
    { x: x + w, y: y + h / 2 },
    { x: x + w - dent, y: y + h },
    { x: x, y: y + h },
  ], { fill, stroke: c.nodeBorder, strokeWidth: 1 });
  return shape + renderSignalLabel(node.label ?? '', x, y + h / 2, theme);
}

export function renderHexagon(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.diamondFill;
  const dent = h / 2;
  const shape = polygon([
    { x: x + dent, y: y },
    { x: x + w - dent, y: y },
    { x: x + w, y: y + h / 2 },
    { x: x + w - dent, y: y + h },
    { x: x + dent, y: y + h },
    { x: x, y: y + h / 2 },
  ], { fill, stroke: c.diamondBorder, strokeWidth: 1 });
  const cx = x + w / 2;
  const cy = y + h / 2;
  const lines = (node.label ?? '').split('\n');
  const labelEl =
    lines.length > 1
      ? renderMultilineText(lines, cx, cy, theme)
      : renderLabel(node.label ?? '', cx, cy + theme.fontSize / 3, theme);
  return shape + labelEl;
}

export function renderParallelogram(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  // Right-leaning parallelogram: interior angles 75° (acute) / 105° (obtuse).
  // tan(75°) = h/d  →  d = h / (2 + √3) = h · (2 − √3)
  const d = h * (2 - Math.sqrt(3));
  const shape = polygon([
    { x: x + d, y: y },
    { x: x + w, y: y },
    { x: x + w - d, y: y + h },
    { x: x, y: y + h },
  ], { fill, stroke: c.nodeBorder, strokeWidth: 1 });
  const cx = x + w / 2;
  const cy = y + h / 2;
  const lines = (node.label ?? '').split('\n');
  const labelEl =
    lines.length > 1
      ? renderMultilineText(lines, cx, cy, theme)
      : renderLabel(node.label ?? '', cx, cy + theme.fontSize / 3, theme);
  return shape + labelEl;
}

export function renderNote(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const noteFill = theme.colors.noteBackground;
  const stroke = theme.colors.border;
  // Opale balloon spike geometry (matches Opale.java: delta=4, cornersize=NOTE_FOLD)
  const DELTA = 4;
  const spike = node.spikeTip;
  let bodyPath = '';
  if (spike !== undefined && node.notePosition === 'left') {
    // Note is LEFT of action → spike protrudes from the RIGHT side of the box
    const relY = spike.y - y;
    const y1 = Math.max(NOTE_FOLD, Math.min(relY - DELTA, h - 2 * DELTA));
    bodyPath =
      `M${x},${y} ` +
      `L${x},${y + h} ` +
      `L${x + w},${y + h} ` +
      `L${x + w},${y + y1 + 2 * DELTA} ` +
      `L${spike.x},${spike.y} ` +
      `L${x + w},${y + y1} ` +
      `L${x + w},${y + NOTE_FOLD} ` +
      `L${x + w - NOTE_FOLD},${y} Z`;
  } else if (spike !== undefined && node.notePosition === 'right') {
    // Note is RIGHT of action → spike protrudes from the LEFT side of the box
    const relY = spike.y - y;
    const y1 = Math.max(0, Math.min(relY - DELTA, h - 2 * DELTA));
    bodyPath =
      `M${x},${y} ` +
      `L${x},${y + y1} ` +
      `L${spike.x},${spike.y} ` +
      `L${x},${y + y1 + 2 * DELTA} ` +
      `L${x},${y + h} ` +
      `L${x + w},${y + h} ` +
      `L${x + w},${y + NOTE_FOLD} ` +
      `L${x + w - NOTE_FOLD},${y} Z`;
  }
  // Build the note body — spike cases use the custom path; standalone uses the shared primitive
  const body =
    spike === undefined
      ? noteBox(x, y, w, h, { fill: noteFill, stroke, dogEar: NOTE_FOLD })
      : path(bodyPath, { fill: noteFill, stroke, strokeWidth: 1 }) +
        line(x + w - NOTE_FOLD, y, x + w - NOTE_FOLD, y + NOTE_FOLD, { stroke }) +
        line(x + w - NOTE_FOLD, y + NOTE_FOLD, x + w, y + NOTE_FOLD, { stroke });

  const label = node.label ?? '';
  const lines = label.split('\n');
  const lh = theme.fontSize * 1.4;
  const labelX = x + 4;
  let labelEl: string;
  if (lines.length > 1) {
    labelEl = multilineText(lines, labelX, y + NOTE_FOLD + theme.fontSize, lh, {
      textAnchor: 'start',
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      fill: theme.colors.text,
    });
  } else {
    labelEl = text(labelX, y + NOTE_FOLD + theme.fontSize, label, {
      fill: theme.colors.text,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
    });
  }
  return body + labelEl;
}

export function renderNode(node: ActivityNodeGeo, theme: Theme): string {
  switch (node.kind) {
    case 'start':
      return renderStart(node, theme);
    case 'stop':
    case 'kill':
      return renderStop(node, theme);
    case 'end':
      return renderEnd(node, theme);
    case 'action':
      if (node.stereotype === 'input') return renderChevronLeft(node, theme);
      if (node.stereotype === 'output') return renderChevronRight(node, theme);
      if (node.stereotype === 'save') return renderParallelogram(node, theme);
      return renderAction(node, theme);
    case 'break':
      // `break` is a flow-control marker — it has no visible glyph in
      // upstream PlantUML. The layout still places a zero-area anchor for
      // edge routing, but rendering produces no shape.
      return '';
    case 'repeat-start':
      return renderDiamond(node, theme);
    case 'fork-bar':
    case 'split-bar':
    case 'join-bar':
      return renderBar(node, theme);
    case 'if-split':
    case 'while-header':
      return (node.label !== undefined && node.label !== '')
        ? renderHexagon(node, theme)
        : renderDiamond(node, theme);
    case 'repeat-cond':
      return renderHexagon(node, theme);
    case 'if-merge':
      return '';
    case 'note':
      return renderNote(node, theme);
    default: {
      // Unknown kind: render a plain rect as a fallback
      const c = actColors(theme);
      return rect(node.x, node.y, node.width, node.height, {
        fill: c.nodeFill,
        stroke: c.nodeBorder,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Edge renderer
// ---------------------------------------------------------------------------
