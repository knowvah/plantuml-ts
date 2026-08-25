/**
 * Sequence diagram SVG renderer.
 *
 * Pure function: SequenceGeometry + Theme → SVG string.
 * No DOM, no async.
 *
 * T13 (dispatch-by-parse-attempt): `scale ...` is applied at the
 * layout→render boundary, mirroring `json/renderer.ts` — `scale-geo.ts`
 * scales `SequenceGeometry` and `Theme.fontSize` as pure data BEFORE this
 * module ever sees them, and every OTHER local pixel-literal constant this
 * file owns (`ACTIVATION_HALF_WIDTH`, `SELF_LOOP_WIDTH`/`HEIGHT`,
 * `BOX_LABEL_FONT_SIZE`/`PADDING`, and the small inline offsets throughout)
 * is scaled at its point of use via the `ScaledTheme.scaleK` this module
 * threads everywhere `theme` already flowed. See `scale-geo.ts`'s header
 * for the full rationale and the jar measurements this replaces (a
 * `<g transform="scale(...)">` wrap around unscaled coordinates, which
 * upstream never emits for a document body — `manageScale`,
 * `SvgGraphics.java:1035-1051`, is for embedded sprites only).
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
import { rect, line, text, path, noteBox } from '../../core/svg.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { arrowConfigurationFor } from './sequence-arrowhead.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import {
  applyMessageDecorations,
  renderFlatMessageArrow,
  renderSelfMessageHead,
} from './renderer-arrowhead.js';
import { renderActorShape, renderDatabaseShape } from './renderer-participant-shapes.js';
import type { ScaledTheme } from './scale-geo.js';
import { scaleSequenceGeometry, scaleSequenceTheme, scaledDashPattern } from './scale-geo.js';

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

function renderParticipantBox(p: ParticipantGeo, theme: ScaledTheme): string {
  const labelYOffset = theme.fontSize / 2 + 4 * theme.scaleK;
  if (p.type === 'actor') {
    return (
      renderActorShape(p.centerX, p.y, p.height, theme) +
      renderLabel(p.centerX, p.y + p.height - labelYOffset, p.display, theme)
    );
  }
  if (p.type === 'database') {
    return (
      renderDatabaseShape(p.x, p.y, p.width, p.height, theme) +
      renderLabel(p.centerX, p.y + p.height - labelYOffset, p.display, theme)
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
  theme: ScaledTheme,
): string {
  // Rectangular participants: box starts at lifelineEndY, label inside.
  // Non-rectangular (actor, database): label above the shape at lifelineEndY,
  // shape starts at footerShapeY (= lifelineEndY + label-zone height).
  const labelY = lifelineEndY + theme.fontSize / 2 + 4 * theme.scaleK;
  if (p.type === 'actor') {
    return (
      renderLabel(p.centerX, labelY, p.display, theme) +
      renderActorShape(p.centerX, footerShapeY, p.height, theme)
    );
  }
  if (p.type === 'database') {
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
  theme: ScaledTheme,
): string {
  const startY = p.y + p.height;
  return line(p.centerX, startY, p.centerX, lifelineEndY, {
    stroke: theme.colors.lifeline,
    strokeDasharray: scaledDashPattern(theme.scaleK),
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
  theme: ScaledTheme,
): string {
  const k = theme.scaleK;
  const x1 = msg.fromX;
  const y1 = msg.y;
  const loopWidth = SELF_LOOP_WIDTH * k;
  const loopHeight = SELF_LOOP_HEIGHT * k;
  const d =
    `M ${x1} ${y1} ` +
    `H ${x1 + loopWidth} ` +
    `V ${y1 + loopHeight} ` +
    `H ${x1}`;
  const loop = path(d, {
    stroke: theme.colors.arrow,
    strokeWidth: 1 * k,
    ...(configuration.dashed ? { strokeDasharray: scaledDashPattern(k) } : {}),
  });
  return loop + renderSelfMessageHead(msg, configuration, theme, y1 + loopHeight);
}

/** The message's label. Upstream draws it last, after the arrow
 *  (`ComponentRoseArrow.java:175`, `ComponentRoseSelfArrow.java:88`). */
function renderMessageLabel(msg: MessageGeo, theme: ScaledTheme): string {
  const label =
    msg.sequenceLabel !== undefined
      ? `${msg.sequenceLabel}: ${msg.label}`
      : msg.sequenceNumber !== undefined
        ? `${msg.sequenceNumber}: ${msg.label}`
        : msg.label;
  const midX = msg.arrowDirection === 'self'
    ? msg.fromX + 20 * theme.scaleK
    : (msg.fromX + msg.toX) / 2;
  return text(midX, msg.y - 5 * theme.scaleK, label, {
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
function renderMessage(msg: MessageGeo, theme: ScaledTheme): string {
  const configuration = applyMessageDecorations(arrowConfigurationFor(msg.style), msg);
  const arrow =
    msg.arrowDirection === 'self'
      ? renderSelfMessage(msg, configuration, theme)
      : renderFlatMessageArrow(msg, configuration, theme);
  return arrow + renderMessageLabel(msg, theme);
}

// ---------------------------------------------------------------------------
// Activation helpers
// ---------------------------------------------------------------------------

function renderActivation(act: ActivationGeo, theme: ScaledTheme): string {
  const half = ACTIVATION_HALF_WIDTH * theme.scaleK;
  const x = act.lifelineX - half;
  const fill = act.color ?? theme.colors.activation;
  return rect(x, act.y, half * 2, act.height, {
    fill,
    stroke: theme.colors.border,
  });
}

// ---------------------------------------------------------------------------
// Note helpers
// ---------------------------------------------------------------------------

function renderNote(note: NoteGeo, theme: ScaledTheme): string {
  const fill = note.color ?? theme.colors.noteBackground;
  const { x, y, width: w, height: h } = note;
  const strokeWidth = 1.5 * theme.scaleK;
  // T13: `rnote`/`hnote` (`NoteEvent.shape`) draw as a plain rectangle,
  // never the folded-corner `note` shape -- see `ast.ts`'s `NoteEvent.shape`
  // doc comment for the hexagon-vs-rectangle scope cut.
  const noteShape =
    note.shape === 'rect'
      ? rect(x, y, w, h, { fill, stroke: theme.colors.border, strokeWidth })
      : noteBox(x, y, w, h, { fill, stroke: theme.colors.border, strokeWidth });
  const lines = note.text.split('\n');
  const lineHeight = theme.fontSize * 1.4; // ratio of an already-scaled fontSize: self-scaling
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

/** The tab's own geometry -- factored out so {@link renderFrame} stays
 *  under the 30-NLOC function cap. */
interface FrameTabGeo {
  readonly tabWidth: number;
  readonly tabHeight: number;
  readonly labelFontSize: number;
}

function computeFrameTabGeo(frame: FrameGeo, theme: ScaledTheme): FrameTabGeo {
  const k = theme.scaleK;
  return {
    tabWidth: Math.min(80 * k, frame.width),
    tabHeight: 20 * k,
    labelFontSize: theme.fontSize - 2 * k,
  };
}

/** The tab rectangle + its TYPE label + the first branch's `[condition]`. */
function renderFrameTab(frame: FrameGeo, tab: FrameTabGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const rectEl = rect(frame.x, frame.y, tab.tabWidth, tab.tabHeight, {
    fill: theme.colors.frame,
    stroke: theme.colors.frame,
  });
  // Upstream keeps the frame TYPE in the tab and draws the branch condition
  // beside it as a bracketed `[condition]` -- two separate runs, not one
  // `alt first case` string. Each subsequent `else` repeats that condition
  // form against a dashed separator (`GroupingTile`).
  const typeEl = text(frame.x + 4 * k, frame.y + tab.tabHeight - 4 * k, frame.frameType, {
    fontFamily: theme.fontFamily,
    fontSize: tab.labelFontSize,
    fill: theme.colors.background,
  });
  // A `ref` frame's label is BODY CONTENT, not a condition -- it is drawn
  // inside the box by `renderRefBody`, so no bracketed run belongs here.
  const condition = frame.frameType === 'ref' ? '' : frame.label.trim();
  const conditionEl =
    condition === ''
      ? ''
      : text(frame.x + tab.tabWidth + 6 * k, frame.y + tab.tabHeight - 4 * k, `[${condition}]`, {
          fontFamily: theme.fontFamily,
          fontSize: tab.labelFontSize,
          fill: theme.colors.text,
        });
  return rectEl + typeEl + conditionEl;
}

/**
 * A `ref over` frame's body: its source lines, ONE `<text>` each, centred in
 * the box below the header tab.
 *
 * `ComponentRoseReference#drawInternalU` draws the header at `(15, 2)` and
 * then the body as its own text block at `(textPos, oldPaddingY +
 * textHeaderHeight)` (`:125-136`) -- below the header, and horizontally per
 * the component's alignment. The jar's own output for a two-line ref centres
 * them: box x=70.3 w=76.775, lines at x=74.3 and x=76.962, i.e. each centred
 * on 108.7.
 *
 * This used to emit the whole body as ONE `<text>` containing a literal
 * newline, bracketed like an `alt` condition -- `[This can be on\nseveral
 * lines]`. SVG collapses that newline, so it drew as a single run of text
 * beside the tab, and it cost one child where the jar spends one per line.
 *
 * The `y` here is upstream's `getOldPaddingY() + textHeaderHeight` with two
 * deliberate substitutions: `+ theme.fontSize` because an SVG `<text>` y is a
 * BASELINE where upstream's translate is the block's top-left, and
 * `tab.tabHeight` in place of the measured `textHeaderHeight` because that is
 * the band this port actually draws -- one shared `20 * k` across every frame
 * type, not `ComponentRoseReference`'s own header. Keying the body to the
 * drawn tab is what keeps the two from colliding; the `x` needs no such
 * substitution, so it comes straight from layout.
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseReference.java#drawInternalU
 */
function renderRefBody(frame: FrameGeo, tab: FrameTabGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const lineHeight = theme.fontSize + 2 * k;
  const top = frame.y + tab.tabHeight + theme.fontSize;
  return frame.refBody
    .map((line, i) =>
      text(line.x, top + i * lineHeight, line.text, {
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        fill: theme.colors.text,
      }),
    )
    .join('');
}

function renderFrame(frame: FrameGeo, theme: ScaledTheme): string {
  const border = rect(frame.x, frame.y, frame.width, frame.height, {
    fill: 'none',
    stroke: theme.colors.frame,
    strokeDasharray: scaledDashPattern(theme.scaleK),
  });
  const tab = computeFrameTabGeo(frame, theme);
  return (
    border +
    renderFrameTab(frame, tab, theme) +
    renderRefBody(frame, tab, theme) +
    renderBranchSeparators(frame, tab, theme)
  );
}

/** The dashed rule + bracketed condition each `else` branch opens with. */
function renderBranchSeparators(frame: FrameGeo, tab: FrameTabGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  return frame.branchSeparators
    .map((sep) => {
      const rule = line(frame.x, sep.y, frame.x + frame.width, sep.y, {
        stroke: theme.colors.frame,
        strokeDasharray: scaledDashPattern(k),
      });
      const condition = sep.label.trim();
      if (condition === '') return rule;
      return (
        rule +
        text(frame.x + 6 * k, sep.y + theme.fontSize, `[${condition}]`, {
          fontFamily: theme.fontFamily,
          fontSize: tab.labelFontSize,
          fill: theme.colors.text,
        })
      );
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Divider helpers
// ---------------------------------------------------------------------------

function renderDivider(divider: DividerGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const lineEl = line(0, divider.y, divider.totalWidth, divider.y, {
    stroke: theme.colors.divider,
    strokeWidth: 1 * k,
  });
  const midX = divider.totalWidth / 2;
  const textEl = text(midX, divider.y - 4 * k, divider.text, {
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

function renderEvent(event: EventGeo, theme: ScaledTheme): string {
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

function renderBoxBackground(box: BoxGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const fill = box.color !== '' ? box.color : BOX_DEFAULT_COLOR;
  const boxRect = rect(box.x, box.y, box.width, box.height, {
    fill,
    stroke: theme.colors.border,
  });
  if (box.label === '') return boxRect;
  const padding = BOX_LABEL_PADDING * k;
  const labelFontSize = BOX_LABEL_FONT_SIZE * k;
  const labelEl = text(
    box.x + padding,
    box.y + labelFontSize + padding,
    box.label,
    {
      fontFamily: theme.fontFamily,
      fontSize: labelFontSize,
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
  // T13: `resolveScaleFactor` needs the UNSCALED document dims -- `geo`
  // itself, before `scaleSequenceGeometry` runs below.
  const k = resolveScaleFactor(geo.scale, geo.totalWidth, geo.totalHeight);
  const scaledGeo = scaleSequenceGeometry(geo, k);
  const scaledTheme = scaleSequenceTheme(theme, k);
  const children: string[] = [];

  // 0. Box backgrounds (lowest z-order — behind lifelines and participants)
  for (const box of scaledGeo.boxes) {
    children.push(renderBoxBackground(box, scaledTheme));
  }

  // 1. Lifelines (behind everything else)
  for (const p of scaledGeo.participants) {
    children.push(renderLifeline(p, scaledGeo.lifelineEndY, scaledTheme));
  }

  // 2. Participant header boxes
  for (const p of scaledGeo.participants) {
    children.push(renderParticipantBox(p, scaledTheme));
  }

  // 3. Events (messages, activations, notes, frames, dividers)
  for (const event of scaledGeo.events) {
    children.push(renderEvent(event, scaledTheme));
  }

  // 4. Footer boxes, unless suppressed. `SequenceDiagram#isShowFootbox`
  //    (`SequenceDiagram.java:474-486`) is resolved once at layout, which is
  //    also where the space for this row is (not) reserved -- see
  //    `layout.ts#isShowFootbox`.
  if (scaledGeo.showFootbox) {
    for (const p of scaledGeo.participants) {
      children.push(renderFooterBox(p, scaledGeo.lifelineEndY, scaledGeo.footerShapeY, scaledTheme));
    }
  }

  return {
    body: children.join(''),
    width: scaledGeo.totalWidth,
    height: scaledGeo.totalHeight,
    background: theme.colors.background,
    // T2's `finalizeSequenceBody` (`core/assemble-svg.ts`) owns the content
    // `<g>` wrap and the background rect, so the body is handed over bare.
    diagramType: DIAGRAM_TYPE_SEQUENCE,
  };
}
