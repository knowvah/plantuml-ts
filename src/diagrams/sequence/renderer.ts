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
  EventGeo,
  ActivationGeo,
  NoteGeo,
  FrameGeo,
  DividerGeo,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { rect, line, text, noteBox } from '../../core/svg.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { renderMessage } from './renderer-message.js';
import { renderParticipantBox, renderFooterBox } from './renderer-participant-shapes.js';
import { renderLifelinePass } from './renderer-lifeline.js';
import { renderFrameBlotter } from './renderer-frame-blotter.js';
import { renderGroupingHeaderBackground, renderGroupingHeaderForeground } from './renderer-frame-header.js';
import { GROUP_FONT_SIZE } from './frame-style.js';
import {
  DIVIDER_BACKGROUND,
  DIVIDER_BAND_HEIGHT,
  DIVIDER_FONT_BOLD,
  DIVIDER_FONT_SIZE,
  DIVIDER_LABEL_DELTA_X,
  DIVIDER_LINE_COLOR,
  DIVIDER_LINE_THICKNESS,
  DIVIDER_PADDING,
} from './divider-style.js';
import type { ScaledTheme } from './scale-geo.js';
import { scaleSequenceGeometry, scaleSequenceTheme, scaledDashPattern } from './scale-geo.js';

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

/** `ComponentRoseGroupingHeader.java:79`'s `style.value(PName.RoundCorner)`,
 *  cascading to `root`'s default of `0` (`plantuml.skin:12`) -- the SAME
 *  style read `GroupingTile#drawBackground` makes for its own `Blotter`
 *  construction (`GroupingTile.java:303-304`). */
const FRAME_ROUND_CORNER = 0;

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
 * `frame.tabHeight` in place of the measured `textHeaderHeight` because that
 * is the band this port actually draws -- resolved in LAYOUT (T1/T5), where
 * the measurer lives, not `ComponentRoseReference`'s own header. Keying the
 * body to the drawn tab is what keeps the two from colliding; the `x` needs
 * no such substitution, so it comes straight from layout.
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseReference.java#drawInternalU
 */
function renderRefBody(frame: FrameGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const lineHeight = theme.fontSize + 2 * k;
  const top = frame.y + frame.tabHeight + theme.fontSize;
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

/**
 * `GroupingTile#drawU`'s foreground half (`:267`): `comp.drawU(...)`,
 * dispatched with `isBackground()` false, reaches `drawInternalU` --
 * `renderGroupingHeaderForeground` (T4). `drawNotes` + child tiles
 * (`:268-274`) are `renderRefBody`/`renderBranchSeparators`, same order.
 */
function renderFrame(frame: FrameGeo, theme: ScaledTheme): string {
  return (
    renderGroupingHeaderForeground(frame, theme) +
    renderRefBody(frame, theme) +
    renderBranchSeparators(frame, theme)
  );
}

/**
 * `GroupingTile#drawU`'s background half (`:262-263, :301-309`): the
 * `Blotter` bands (`renderFrameBlotter`, T3), THEN `drawBackgroundInternalU`
 * -- the plain outline (`renderGroupingHeaderBackground`, T4), upstream's
 * own order.
 */
function renderFrameBackground(frame: FrameGeo, theme: ScaledTheme): string {
  return (
    renderFrameBlotter(frame, FRAME_ROUND_CORNER * theme.scaleK) +
    renderGroupingHeaderBackground(frame, theme)
  );
}

/** The dashed rule + bracketed condition each `else` branch opens with. */
function renderBranchSeparators(frame: FrameGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const labelFontSize = GROUP_FONT_SIZE * k;
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
          fontSize: labelFontSize,
          fill: theme.colors.text,
        })
      );
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Divider helpers
// ---------------------------------------------------------------------------

/**
 * `ComponentRoseDivider#drawSep` (`:91-95`) — the full-width band every
 * divider draws, labelled or not: a 3px `URectangle` at `dy - 1` under
 * `UStroke.simple()`, then TWO `ULine.hline` at `dy - 1` and `dy + 2` at half
 * the style's thickness. `dy` is the component's own vertical midpoint.
 *
 * The band spans the tile's `Area` width, not `getPreferredWidth`
 * (`:67`, `DividerTile.java`'s `Area.create(border2 - border1 - xorigin, …)`),
 * which is `totalWidth` here.
 */
function renderDividerBand(divider: DividerGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const midY = divider.y + divider.height / 2;
  const { bandX: x, bandWidth: w } = divider;
  const band = rect(x, midY - 1 * k, w, DIVIDER_BAND_HEIGHT * k, {
    fill: DIVIDER_BACKGROUND,
    stroke: DIVIDER_BACKGROUND,
    strokeWidth: 1 * k,
  });
  const ruleStyle = {
    stroke: DIVIDER_LINE_COLOR,
    strokeWidth: (DIVIDER_LINE_THICKNESS / 2) * k,
  };
  return (
    band +
    line(x, midY - 1 * k, x + w, midY - 1 * k, ruleStyle) +
    line(x, midY + 2 * k, x + w, midY + 2 * k, ruleStyle)
  );
}

/**
 * The label box and its text (`:73-87`). Absent for the empty `====` form,
 * which upstream branches away from at `:69-70` on
 * `stringsToDisplay.get(0).length() == 0`.
 *
 * `xpos = (width - textWidth - deltaX) / 2` and `ypos = (height - textHeight)
 * / 2`; the box is `textWidth + deltaX` wide and the text starts `deltaX`
 * inside it, with `getOldPaddingY()` of vertical inset.
 */
function renderDividerLabel(divider: DividerGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const deltaX = DIVIDER_LABEL_DELTA_X * k;
  const xpos = divider.bandX + (divider.bandWidth - divider.textWidth - deltaX) / 2;
  const ypos = divider.y + (divider.height - divider.textHeight) / 2;
  const box = rect(xpos, ypos, divider.textWidth + deltaX, divider.textHeight, {
    fill: DIVIDER_BACKGROUND,
    stroke: DIVIDER_LINE_COLOR,
    strokeWidth: DIVIDER_LINE_THICKNESS * k,
  });
  // One `<text>` per line, as the jar's own multi-line text block emits.
  // `textBlock.drawU` places the block's TOP-LEFT and `text()` takes a
  // baseline, hence `dominantBaseline: 'hanging'` -- the same adaptation
  // `renderNote` makes for its body lines.
  const lineHeight = (divider.textHeight - DIVIDER_PADDING * 2 * k) / divider.lines.length;
  const top = ypos + DIVIDER_PADDING * k;
  const label = divider.lines
    .map((l, i) =>
      text(xpos + deltaX, top + i * lineHeight, l, {
        fontFamily: theme.fontFamily,
        fontSize: DIVIDER_FONT_SIZE * k,
        // `'700'`, not `'bold'` -- the jar emits the numeric form, and
        // `renderer-frame-header.ts#boldFontWeight` already set that convention.
        fontWeight: DIVIDER_FONT_BOLD ? ('700' as const) : ('normal' as const),
        fill: theme.colors.text,
        dominantBaseline: 'hanging',
      }),
    )
    .join('');
  return box + label;
}

/**
 * `== label ==` and the empty `====`.
 *
 * This used to emit ONE `<line>` and one `<text>` where
 * `ComponentRoseDivider#drawInternalU` emits five elements -- a band rect, two
 * rules, a label box and the text -- and to stroke the rule with
 * `theme.colors.divider` (`#999999`, this port's own invention) where upstream
 * is `LineColor black` (`plantuml.skin:170`). `theme.colors.divider` had no
 * other reader.
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseDivider.java:64-95
 */
function renderDivider(divider: DividerGeo, theme: ScaledTheme): string {
  const band = renderDividerBand(divider, theme);
  return divider.text.length === 0 ? band : band + renderDividerLabel(divider, theme);
}

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

/**
 * `PlayingSpace#drawBackground`/`#drawForeground` share `drawUInternal`
 * (`PlayingSpace.java:109-117`); only the `UGraphicInterceptorTile
 * #isBackground` flag they wrap `ug` in differs (that class suppresses
 * nothing itself, it only carries the flag). `frame` is the one event kind
 * whose component overrides `drawBackgroundInternalU`; every other kind
 * inherits `AbstractComponent`'s empty default (`:139-140`), so messages,
 * notes, activations, dividers and spaces draw nothing here.
 */
function renderEvent(event: EventGeo, theme: ScaledTheme, isBackground: boolean): string {
  if (event.kind === 'frame') {
    return isBackground ? renderFrameBackground(event, theme) : renderFrame(event, theme);
  }
  if (isBackground) return '';
  switch (event.kind) {
    case 'message':
      return renderMessage(event, theme);
    case 'activation':
      // Drawn in the lifeline pass (step 2), not here -- see the comment
      // there and `LivingSpace#drawLineAndLiveboxes`.
      return '';
    case 'note':
      return renderNote(event, theme);
    case 'divider':
      return renderDivider(event, theme);
    case 'space':
      // Space geos add no visible elements
      return '';
  }
}

/** One event-walk pass -- see {@link renderEvent}; mirrors the one
 *  `drawUInternal` both drawBackground/drawForeground share. */
function renderEventPass(events: readonly EventGeo[], theme: ScaledTheme, isBackground: boolean): string[] {
  return events.map((event) => renderEvent(event, theme, isBackground));
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

  // 1. Background pass -- `playingSpace.drawBackground(ugBody)`
  //    (`PlayingSpaceWithParticipants.java:218`), the FIRST of the five
  //    passes. Walks the SAME `scaledGeo.events` array, in the same order,
  //    as step 5 below -- `PlayingSpace#drawBackground`/`#drawForeground`
  //    both delegate to the identical `drawUInternal` (`PlayingSpace.java:
  //    109-117`), differing only in the `isBackground` flag `renderEvent`
  //    now takes. Everything but a frame's own band+outline is silent here.
  children.push(...renderEventPass(scaledGeo.events, scaledTheme, true));

  // 2. Lifelines AND liveboxes -- one pass, per participant.
  //    `PlayingSpaceWithParticipants#drawU:221` calls
  //    `livingSpaces.drawLifeLines(...)` here, and `LivingSpace
  //    #drawLineAndLiveboxes` draws each participant's line followed by that
  //    participant's own activation boxes. Activations are therefore NOT part
  //    of the event pass below, however naturally they read as events.
  children.push(
    renderLifelinePass(
      scaledGeo.participants,
      scaledGeo.events.filter((e): e is ActivationGeo => e.kind === 'activation'),
      scaledGeo.lifelineEndY,
      scaledTheme,
    ),
  );

  // 3. Participant header boxes
  for (const p of scaledGeo.participants) {
    children.push(renderParticipantBox(p, scaledTheme));
  }

  // 4. Footer boxes, unless suppressed -- BEFORE the foreground tiles.
  //    `PlayingSpaceWithParticipants#drawU:223-227` draws the footbox row
  //    immediately after the heads and only then calls
  //    `playingSpace.drawForeground(ugBody)`, so upstream lets an arrow paint
  //    OVER a footbox. Emitting it last, as this renderer used to, inverts
  //    that z-order as well as shifting every following child index.
  //    `SequenceDiagram#isShowFootbox` (`SequenceDiagram.java:474-486`) is
  //    resolved once at layout, which is also where the space for this row is
  //    (not) reserved -- see `layout.ts#isShowFootbox`.
  if (scaledGeo.showFootbox) {
    for (const p of scaledGeo.participants) {
      children.push(renderFooterBox(p, scaledGeo.lifelineEndY, scaledTheme));
    }
  }

  // 5. Foreground tiles -- messages, notes, frames, dividers.
  //    `playingSpace.drawForeground(ugBody)` (`:227`), the LAST of the five
  //    passes. Activations are absent here by design; see step 2.
  children.push(...renderEventPass(scaledGeo.events, scaledTheme, false));

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
