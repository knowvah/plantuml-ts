/**
 * Sequence diagram SVG renderer.
 *
 * Pure function: SequenceGeometry + Theme → SVG string.
 * No DOM, no async.
 */

import type {
  BoxGeo,
  SequenceGeometry,
  ParticipantGeo,
  EventGeo,
  MessageGeo,
  NoteGeo,
  ActivationGeo,
  FrameGeo,
  DividerGeo,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import {
  rect,
  line,
  ellipse,
  text,
  path,
  noteBox,
  circle,
} from '../../core/svg.js';
import { fmt } from '../../core/svg-format.js';
import { arrowConfigurationFor } from './sequence-arrowhead.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import {
  renderFlatMessageArrow,
  renderSelfMessageHead,
} from './renderer-arrowhead.js';

// ---------------------------------------------------------------------------
// Activation constants
// ---------------------------------------------------------------------------

const ACTIVATION_HALF_WIDTH = 5; // activationWidth / 2

// ---------------------------------------------------------------------------
// Participant helpers
// ---------------------------------------------------------------------------

function renderLabel(cx: number, cy: number, label: string, theme: Theme): string {
  return text(cx, cy, label, {
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fill: theme.colors.text,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
  });
}

function renderActorShape(cx: number, topY: number, height: number, theme: Theme): string {
  const headR = 10;
  const bodyTop = topY + headR * 2 + 2;
  const bodyLen = height * 0.35;
  const bodyBot = bodyTop + bodyLen;
  const armY = bodyTop + bodyLen * 0.3;
  const armSpan = 14;
  const legSpan = 12;
  const parts: string[] = [];
  // Head
  parts.push(circle(cx, topY + headR, headR, { fill: theme.colors.background, stroke: theme.colors.border, strokeWidth: 1.5 }));
  // Body
  parts.push(line(cx, bodyTop, cx, bodyBot, { stroke: theme.colors.border, strokeWidth: 1.5 }));
  // Arms
  parts.push(line(cx - armSpan, armY, cx + armSpan, armY, { stroke: theme.colors.border, strokeWidth: 1.5 }));
  // Legs — end 8px above the label zone so the label has clear breathing room
  parts.push(line(cx, bodyBot, cx - legSpan, topY + height - theme.fontSize - 8, { stroke: theme.colors.border, strokeWidth: 1.5 }));
  parts.push(line(cx, bodyBot, cx + legSpan, topY + height - theme.fontSize - 8, { stroke: theme.colors.border, strokeWidth: 1.5 }));
  return parts.join('');
}

function renderDatabaseShape(x: number, topY: number, width: number, height: number, theme: Theme): string {
  // With sweep=1 the arc nadir sits capRy below bodyBot. labelH must satisfy
  // labelH > 1.15*(capRy_fraction*height) + fontSize + 4 to keep the label
  // top clear of the arc. fontSize+12 gives ~3 px of clearance at fontSize=14.
  const labelH = theme.fontSize + 14;
  const bodyH = height - labelH;
  const capRy = Math.max(4, bodyH * 0.15);
  const bodyTop = topY + capRy;
  const bodyBot = topY + bodyH;
  const cx = x + width / 2;
  const rx = width / 2 - 2;
  const parts: string[] = [];
  // Body rect
  parts.push(rect(x + 2, bodyTop, width - 4, bodyH - capRy, {
    fill: theme.colors.background,
    stroke: 'none',
  }));
  // Top ellipse (full, visible)
  parts.push(ellipse(cx, bodyTop, rx, capRy, {
    fill: theme.colors.background,
    stroke: theme.colors.border,
    'stroke-width': '1.5',
  }));
  // Side lines
  parts.push(line(x + 2, bodyTop, x + 2, bodyBot, { stroke: theme.colors.border, strokeWidth: 1.5 }));
  parts.push(line(x + width - 2, bodyTop, x + width - 2, bodyBot, { stroke: theme.colors.border, strokeWidth: 1.5 }));
  // Bottom arc — sweep=0 (counter-clockwise from left to right) routes through
  // (cx, bodyBot+capRy), bowing the arc downward for a convex cylinder bottom.
  parts.push(
    path(`M ${fmt(x + 2)},${fmt(bodyBot)} A ${fmt(rx)},${fmt(capRy)} 0 0,0 ${fmt(x + width - 2)},${fmt(bodyBot)}`, {
      fill: theme.colors.background,
      stroke: theme.colors.border,
      strokeWidth: 1.5,
    }),
  );
  return parts.join('');
}

function renderParticipantBox(p: ParticipantGeo, theme: Theme): string {
  const labelY = p.y + p.height - theme.fontSize / 2 - 4;
  if (p.type === 'actor') {
    return (
      renderActorShape(p.centerX, p.y, p.height, theme) +
      renderLabel(p.centerX, labelY, p.display, theme)
    );
  }
  if (p.type === 'database') {
    return (
      renderDatabaseShape(p.x, p.y, p.width, p.height, theme) +
      renderLabel(p.centerX, p.y + p.height - theme.fontSize / 2 - 4, p.display, theme)
    );
  }
  const box = rect(p.x, p.y, p.width, p.height, {
    fill: theme.colors.background,
    stroke: theme.colors.border,
  });
  return box + renderLabel(p.centerX, p.y + p.height / 2, p.display, theme);
}

function renderFooterBox(
  p: ParticipantGeo,
  lifelineEndY: number,
  footerShapeY: number,
  theme: Theme,
): string {
  // Rectangular participants: box starts at lifelineEndY, label inside.
  // Non-rectangular (actor, database): label above the shape at lifelineEndY,
  // shape starts at footerShapeY (= lifelineEndY + label-zone height).
  if (p.type === 'actor') {
    const labelY = lifelineEndY + theme.fontSize / 2 + 4;
    return (
      renderLabel(p.centerX, labelY, p.display, theme) +
      renderActorShape(p.centerX, footerShapeY, p.height, theme)
    );
  }
  if (p.type === 'database') {
    const labelY = lifelineEndY + theme.fontSize / 2 + 4;
    return (
      renderLabel(p.centerX, labelY, p.display, theme) +
      renderDatabaseShape(p.x, footerShapeY, p.width, p.height, theme)
    );
  }
  const box = rect(p.x, lifelineEndY, p.width, p.height, {
    fill: theme.colors.background,
    stroke: theme.colors.border,
  });
  return box + renderLabel(p.centerX, lifelineEndY + p.height / 2, p.display, theme);
}

function renderLifeline(
  p: ParticipantGeo,
  lifelineEndY: number,
  theme: Theme,
): string {
  const startY = p.y + p.height;
  return line(p.centerX, startY, p.centerX, lifelineEndY, {
    stroke: theme.colors.lifeline,
    strokeDasharray: '5,5',
  });
}

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

/**
 * The self-message loop's own geometry. Upstream's is `arrowWidth = 45` with
 * the vertical stroke at `xRight = 42` (`ComponentRoseSelfArrow.java:59-60`);
 * this port keeps the spike's 40 (Gap SQ-5, out of this task's scope), so the
 * loop is 5 px narrower than the jar's and the head below is placed against
 * THIS loop's returning segment rather than against upstream's `x2`.
 */
const SELF_LOOP_WIDTH = 40;
const SELF_LOOP_HEIGHT = 20;

/**
 * The self branch: three strokes clockwise off the lifeline and back, then
 * the head at the foot. Upstream draws the strokes FIRST and the head after
 * (`ComponentRoseSelfArrow.java:124-126` then `:131-173`) -- the reverse of
 * the flat component's order, and the order `botoku-28-cupe920` shows.
 *
 * Emitted as one `<path>` where upstream emits three `<line>`s; that is the
 * spike's existing shape, left alone here because this task owns the HEADS.
 */
function renderSelfMessage(
  msg: MessageGeo,
  configuration: ArrowConfiguration,
  theme: Theme,
): string {
  const x1 = msg.fromX;
  const y1 = msg.y;
  const d =
    `M ${x1} ${y1} ` +
    `H ${x1 + SELF_LOOP_WIDTH} ` +
    `V ${y1 + SELF_LOOP_HEIGHT} ` +
    `H ${x1}`;
  const loop = path(d, {
    stroke: theme.colors.arrow,
    strokeWidth: 1,
    ...(configuration.dashed ? { strokeDasharray: '5,5' } : {}),
  });
  return loop + renderSelfMessageHead(msg, configuration, theme, y1 + SELF_LOOP_HEIGHT);
}

/** The message's label. Upstream draws it last, after the arrow
 *  (`ComponentRoseArrow.java:175`, `ComponentRoseSelfArrow.java:88`). */
function renderMessageLabel(msg: MessageGeo, theme: Theme): string {
  const label =
    msg.sequenceNumber !== undefined
      ? `${msg.sequenceNumber}: ${msg.label}`
      : msg.label;
  const midX = msg.arrowDirection === 'self'
    ? msg.fromX + 20
    : (msg.fromX + msg.toX) / 2;
  return text(midX, msg.y - 5, label, {
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fill: theme.colors.text,
    textAnchor: 'middle',
  });
}

/**
 * One message: its arrow, then its label. The arrow's heads are inline
 * polygons/strokes, never an SVG `<marker>` reference -- `assembleDocument
 * Shell` injects no marker defs, and the jar's own sequence corpus contains
 * none either.
 */
function renderMessage(msg: MessageGeo, theme: Theme): string {
  const configuration = arrowConfigurationFor(msg.style);
  const arrow =
    msg.arrowDirection === 'self'
      ? renderSelfMessage(msg, configuration, theme)
      : renderFlatMessageArrow(msg, configuration, theme);
  return arrow + renderMessageLabel(msg, theme);
}

// ---------------------------------------------------------------------------
// Activation helpers
// ---------------------------------------------------------------------------

function renderActivation(act: ActivationGeo, theme: Theme): string {
  const x = act.lifelineX - ACTIVATION_HALF_WIDTH;
  const fill = act.color ?? theme.colors.activation;
  return rect(x, act.y, ACTIVATION_HALF_WIDTH * 2, act.height, {
    fill,
    stroke: theme.colors.border,
  });
}

// ---------------------------------------------------------------------------
// Note helpers
// ---------------------------------------------------------------------------

function renderNote(note: NoteGeo, theme: Theme): string {
  const fill = note.color ?? theme.colors.noteBackground;
  const { x, y, width: w, height: h } = note;
  const noteShape = noteBox(x, y, w, h, {
    fill,
    stroke: theme.colors.border,
    strokeWidth: 1.5,
  });
  const lines = note.text.split('\n');
  const lineHeight = theme.fontSize * 1.4;
  const textCenterX = x + w / 2;
  const textEls = lines
    .map((lineText, i) =>
      text(textCenterX, y + lineHeight + i * lineHeight, lineText, {
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        fill: theme.colors.text,
        textAnchor: 'middle',
      }),
    )
    .join('');
  return noteShape + textEls;
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

function renderFrame(frame: FrameGeo, theme: Theme): string {
  const border = rect(frame.x, frame.y, frame.width, frame.height, {
    fill: 'none',
    stroke: theme.colors.frame,
    strokeDasharray: '5,5',
  });
  // Small tab at top-left for label
  const tabWidth = Math.min(80, frame.width);
  const tabHeight = 20;
  const tab = rect(frame.x, frame.y, tabWidth, tabHeight, {
    fill: theme.colors.frame,
    stroke: theme.colors.frame,
  });
  // Upstream keeps the frame TYPE in the tab and draws the branch condition
  // beside it as a bracketed `[condition]` -- two separate runs, not one
  // `alt first case` string. Each subsequent `else` repeats that condition
  // form against a dashed separator (`GroupingTile`).
  const typeEl = text(frame.x + 4, frame.y + tabHeight - 4, frame.frameType, {
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize - 2,
    fill: theme.colors.background,
  });
  const condition = frame.label.trim();
  const conditionEl =
    condition === ''
      ? ''
      : text(frame.x + tabWidth + 6, frame.y + tabHeight - 4, `[${condition}]`, {
          fontFamily: theme.fontFamily,
          fontSize: theme.fontSize - 2,
          fill: theme.colors.text,
        });

  return border + tab + typeEl + conditionEl + renderBranchSeparators(frame, theme);
}

/** The dashed rule + bracketed condition each `else` branch opens with. */
function renderBranchSeparators(frame: FrameGeo, theme: Theme): string {
  return frame.branchSeparators
    .map((sep) => {
      const rule = line(frame.x, sep.y, frame.x + frame.width, sep.y, {
        stroke: theme.colors.frame,
        strokeDasharray: '5,5',
      });
      const condition = sep.label.trim();
      if (condition === '') return rule;
      return (
        rule +
        text(frame.x + 6, sep.y + theme.fontSize, `[${condition}]`, {
          fontFamily: theme.fontFamily,
          fontSize: theme.fontSize - 2,
          fill: theme.colors.text,
        })
      );
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Divider helpers
// ---------------------------------------------------------------------------

function renderDivider(divider: DividerGeo, theme: Theme): string {
  const lineEl = line(0, divider.y, divider.totalWidth, divider.y, {
    stroke: theme.colors.divider,
    strokeWidth: 1,
  });
  const midX = divider.totalWidth / 2;
  const textEl = text(midX, divider.y - 4, divider.text, {
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fill: theme.colors.text,
    textAnchor: 'middle',
  });
  return lineEl + textEl;
}

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

function renderEvent(event: EventGeo, theme: Theme): string {
  switch (event.kind) {
    case 'message':
      return renderMessage(event, theme);
    case 'activation':
      return renderActivation(event, theme);
    case 'note':
      return renderNote(event, theme);
    case 'frame':
      return renderFrame(event, theme);
    case 'divider':
      return renderDivider(event, theme);
    case 'space':
      // Space geos add no visible elements
      return '';
  }
}

// ---------------------------------------------------------------------------
// Box background helpers
// ---------------------------------------------------------------------------

const BOX_DEFAULT_COLOR = '#EEEEEE';
const BOX_LABEL_FONT_SIZE = 11;
const BOX_LABEL_PADDING = 4;

function renderBoxBackground(box: BoxGeo, theme: Theme): string {
  const fill = box.color !== '' ? box.color : BOX_DEFAULT_COLOR;
  const boxRect = rect(box.x, box.y, box.width, box.height, {
    fill,
    stroke: theme.colors.border,
  });
  if (box.label === '') return boxRect;
  const labelEl = text(
    box.x + BOX_LABEL_PADDING,
    box.y + BOX_LABEL_FONT_SIZE + BOX_LABEL_PADDING,
    box.label,
    {
      fontFamily: theme.fontFamily,
      fontSize: BOX_LABEL_FONT_SIZE,
      fill: theme.colors.text,
    },
  );
  return boxRect + labelEl;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** The jar's `data-diagram-type` value for this engine
 *  (`TextBlockExporter.java:293`), which routes `assembleSvg` through
 *  `assembleDocumentShell` instead of the generic `svgRoot`. */
const DIAGRAM_TYPE_SEQUENCE = 'SEQUENCE';

/**
 * Render a sequence diagram geometry into an SVG string.
 */
export function renderSequence(geo: SequenceGeometry, theme: Theme): RenderFragment {
  const children: string[] = [];

  // 0. Box backgrounds (lowest z-order — behind lifelines and participants)
  for (const box of geo.boxes) {
    children.push(renderBoxBackground(box, theme));
  }

  // 1. Lifelines (behind everything else)
  for (const p of geo.participants) {
    children.push(renderLifeline(p, geo.lifelineEndY, theme));
  }

  // 2. Participant header boxes
  for (const p of geo.participants) {
    children.push(renderParticipantBox(p, theme));
  }

  // 3. Events (messages, activations, notes, frames, dividers)
  for (const event of geo.events) {
    children.push(renderEvent(event, theme));
  }

  // 4. Footer boxes (always emitted — see design note in task spec)
  for (const p of geo.participants) {
    children.push(renderFooterBox(p, geo.lifelineEndY, geo.footerShapeY, theme));
  }

  return {
    body: children.join(''),
    width: geo.totalWidth,
    height: geo.totalHeight,
    background: theme.colors.background,
    // T2's `finalizeSequenceBody` (`core/assemble-svg.ts`) owns the content
    // `<g>` wrap and the background rect, so the body is handed over bare.
    diagramType: DIAGRAM_TYPE_SEQUENCE,
  };
}
