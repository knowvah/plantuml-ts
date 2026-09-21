import { rect, line, text, attrs } from '../../core/svg.js';
import type { BoardGeometry } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { CELL_H } from './layout.js';
import { hashString } from '../../core/paint.js';

// `CardBox.calculateDimension` (`board/CardBox.java:68-70`) — fixed 150x70 box.
const CARD_W = 150;
const CARD_H = 70;
const BOARD_MARGIN = 10;

/**
 * Stable input for the shadow filter's id hash: every card's label and
 * position plus the row count, so identical board sources hash identically
 * (byte-identical SVG on repeat renders) and boards with different content
 * hash differently. `Math.random()` (the code-review-flagged defect) had no
 * such property and could also collide across two renders in the same
 * process (duplicate-id risk when a document embeds two board diagrams).
 */
function shadowIdInput(geo: BoardGeometry): string {
  const activityKeys = geo.activities
    .map((a) => `${a.xOffset}:${a.fullWidth}:${a.cards.map((c) => `${c.label}|${c.dx}|${c.dy}`).join(',')}`)
    .join(';');
  return `${activityKeys}#${geo.maxStage}`;
}

/**
 * Upstream draws this shadow as `URectangle#setDeltaShadow(1)` — a solid
 * offset-rectangle shadow (`board/CardBox.java:74`), not an SVG filter. This
 * port's Gaussian-blur `<filter>` is a pre-existing, not-yet-reconciled
 * rendering-technique divergence (out of scope for this fix, which only
 * addresses the filter id's non-determinism); see CLAUDE.md's divergence
 * policy.
 */
function buildShadowDefs(shadowId: string): string {
  return (
    `<filter${attrs([
      ['id', shadowId],
      ['x', -1],
      ['y', -1],
      ['width', '300%'],
      ['height', '300%'],
    ])}>` +
    `<feGaussianBlur result="blurOut" stdDeviation="2"/>` +
    `<feColorMatrix type="matrix" in="blurOut" result="blurOut2" ` +
    `values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .4 0"/>` +
    `<feOffset result="blurOut3" in="blurOut2" dx="4" dy="4"/>` +
    `<feBlend in="SourceGraphic" in2="blurOut3" mode="normal"/>` +
    `</filter>`
  );
}

function renderCard(cx: number, cy: number, label: string, shadowId: string): string {
  const box = rect(cx, cy, CARD_W, CARD_H, {
    fill: '#D3D3D3',
    stroke: '#000000',
    strokeWidth: 1,
    filter: `url(#${shadowId})`,
  });
  const labelEl = text(cx + 3, cy + 3, label, {
    fontFamily: 'sans-serif',
    fontSize: 14,
    dominantBaseline: 'hanging',
    fill: '#000000',
  });
  return box + labelEl;
}

export function renderBoard(geo: BoardGeometry, theme: Theme): RenderFragment {
  const shadowId = `board-card-shadow-${hashString(shadowIdInput(geo))}`;
  const parts: string[] = [];

  for (const activity of geo.activities) {
    const ox = activity.xOffset;
    const headerLabel = activity.cards[0]?.label ?? '';

    // Header card drawn first (mirrors Java Activity.getBox().drawU()) — Decision E
    parts.push(renderCard(ox + BOARD_MARGIN, BOARD_MARGIN, headerLabel, shadowId));

    // All BArray cards, including root at (dx=0, dy=0) — root drawn twice per Decision E
    for (const card of activity.cards) {
      parts.push(renderCard(ox + card.dx + BOARD_MARGIN, card.dy + BOARD_MARGIN, card.label, shadowId));
    }
  }

  // Horizontal dashed row separator lines (BoardDiagram.drawMe)
  for (let i = 0; i < geo.maxStage; i++) {
    const y = (i + 1) * CELL_H - 10 + BOARD_MARGIN;
    parts.push(
      line(BOARD_MARGIN, y, geo.totalWidth + BOARD_MARGIN, y, {
        stroke: '#000000',
        strokeWidth: 0.5,
        strokeDasharray: '5 5',
      }),
    );
  }

  const width = (geo.totalWidth || 10) + 2 * BOARD_MARGIN;
  const height = ((geo.maxStage + 1) * CELL_H || 10) + 2 * BOARD_MARGIN;
  return {
    body: parts.join(''),
    width,
    height,
    background: theme.colors.background,
    extraDefs: buildShadowDefs(shadowId),
  };
}
