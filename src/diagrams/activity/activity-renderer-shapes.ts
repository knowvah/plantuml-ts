/**
 * Activity node-shape rendering: per-shape SVG emitters (start/stop/end,
 * action, bar, diamond, chevrons, hexagon, parallelogram, note) plus the
 * renderNode dispatcher and shared label/color helpers. Split out of
 * `renderer.ts` (line cap); leaf consumed by edge/swimlane rendering.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type {} from '../../core/dispatcher.js';
import { rect, text, diamond, noteBox } from '../../core/svg.js';
import { renderNodeLabel } from '../../core/latex.js';

const ACTION_RX = 8;
const ACTION_H_PAD = 16;
const NOTE_FOLD = 8;

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
  let y = cy - totalH / 2 + lh * 0.8;
  const attrs = `text-anchor="middle" font-family="${theme.fontFamily}" font-size="${theme.fontSize}" fill="${theme.colors.text}"`;
  const tspans = lines
    .map((ln) => {
      const el = `<tspan x="${cx}" y="${y.toFixed(1)}">${ln.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`;
      y += lh;
      return el;
    })
    .join('');
  return `<text ${attrs}>${tspans}</text>`;
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
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${actColors(theme).startFill}"/>`;
}

export function renderStop(node: ActivityNodeGeo, theme: Theme): string {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const outerR = node.height / 2;
  const innerR = outerR * 0.55;
  const c = actColors(theme);
  return (
    `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${c.endFill}" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="${c.endFill}"/>`
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
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${endFill}" stroke-width="1.5"/>` +
    `<line x1="${cx - d}" y1="${cy - d}" x2="${cx + d}" y2="${cy + d}" stroke="${endFill}" stroke-width="1.5"/>` +
    `<line x1="${cx - d}" y1="${cy + d}" x2="${cx + d}" y2="${cy - d}" stroke="${endFill}" stroke-width="1.5"/>`
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
    let lineY = cy - totalH / 2 + lh * 0.8;
    const labelX = node.x + ACTION_H_PAD;
    const attrs = `text-anchor="start" font-family="${monoFamily}" font-size="${theme.fontSize}" fill="${theme.colors.text}"`;
    const tspans = codeLines
      .map((ln) => {
        const el = `<tspan x="${labelX}" y="${lineY.toFixed(1)}">${ln.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`;
        lineY += lh;
        return el;
      })
      .join('');
    return box + `<text ${attrs}>${tspans}</text>`;
  }

  const lines = label.split('\n');
  let labelEl: string;
  if (lines.length > 1) {
    const lh = theme.fontSize * 1.4;
    const totalH = lh * lines.length;
    let lineY = cy - totalH / 2 + lh * 0.8;
    const labelX = node.x + ACTION_H_PAD;
    const attrs = `text-anchor="start" font-family="${theme.fontFamily}" font-size="${theme.fontSize}" fill="${theme.colors.text}"`;
    const tspans = lines
      .map((ln) => {
        const el = `<tspan x="${labelX}" y="${lineY.toFixed(1)}">${ln.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`;
        lineY += lh;
        return el;
      })
      .join('');
    labelEl = `<text ${attrs}>${tspans}</text>`;
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
  let lineY = cy - totalH / 2 + lh * 0.8;
  const attrs = `text-anchor="start" font-family="${theme.fontFamily}" font-size="${theme.fontSize}" fill="${theme.colors.text}"`;
  const tspans = lines
    .map((ln) => {
      const el = `<tspan x="${labelX}" y="${lineY.toFixed(1)}">${ln.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`;
      lineY += lh;
      return el;
    })
    .join('');
  return `<text ${attrs}>${tspans}</text>`;
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
  const points = [
    `${x},${y}`,
    `${x + w},${y}`,
    `${x + w - dent},${y + h / 2}`,
    `${x + w},${y + h}`,
    `${x},${y + h}`,
  ].join(' ');
  const shape = `<polygon points="${points}" fill="${fill}" stroke="${c.nodeBorder}" stroke-width="1"/>`;
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
  const points = [
    `${x},${y}`,
    `${x + w - dent},${y}`,
    `${x + w},${y + h / 2}`,
    `${x + w - dent},${y + h}`,
    `${x},${y + h}`,
  ].join(' ');
  const shape = `<polygon points="${points}" fill="${fill}" stroke="${c.nodeBorder}" stroke-width="1"/>`;
  return shape + renderSignalLabel(node.label ?? '', x, y + h / 2, theme);
}

export function renderHexagon(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = actColors(theme);
  const fill = node.color ?? c.diamondFill;
  const dent = h / 2;
  const points = [
    `${x + dent},${y}`,
    `${x + w - dent},${y}`,
    `${x + w},${y + h / 2}`,
    `${x + w - dent},${y + h}`,
    `${x + dent},${y + h}`,
    `${x},${y + h / 2}`,
  ].join(' ');
  const shape = `<polygon points="${points}" fill="${fill}" stroke="${c.diamondBorder}" stroke-width="1"/>`;
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
  const points = [
    `${x + d},${y}`,
    `${x + w},${y}`,
    `${x + w - d},${y + h}`,
    `${x},${y + h}`,
  ].join(' ');
  const shape = `<polygon points="${points}" fill="${fill}" stroke="${c.nodeBorder}" stroke-width="1"/>`;
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
      : `<path d="${bodyPath}" fill="${noteFill}" stroke="${stroke}" stroke-width="1"/>` +
        `<line x1="${x + w - NOTE_FOLD}" y1="${y}" x2="${x + w - NOTE_FOLD}" y2="${y + NOTE_FOLD}" stroke="${stroke}"/>` +
        `<line x1="${x + w - NOTE_FOLD}" y1="${y + NOTE_FOLD}" x2="${x + w}" y2="${y + NOTE_FOLD}" stroke="${stroke}"/>`;

  const label = node.label ?? '';
  const lines = label.split('\n');
  const lh = theme.fontSize * 1.4;
  const labelX = x + 4;
  let labelEl: string;
  if (lines.length > 1) {
    const attrs = `text-anchor="start" font-family="${theme.fontFamily}" font-size="${theme.fontSize}" fill="${theme.colors.text}"`;
    let lineY = y + NOTE_FOLD + theme.fontSize;
    const tspans = lines
      .map((ln) => {
        const el = `<tspan x="${labelX}" y="${lineY.toFixed(1)}">${ln.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`;
        lineY += lh;
        return el;
      })
      .join('');
    labelEl = `<text ${attrs}>${tspans}</text>`;
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
