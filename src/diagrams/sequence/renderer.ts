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
  NewpageGeo,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
// No `text` import: D3 -- every `<text>` this file emits goes through
// `sequenceText`, and dropping the direct import is what makes that
// structural rather than a convention.
import { rect, line, noteBox } from '../../core/svg.js';
import { sequenceText } from './sequence-text.js';
import { REFERENCE_FONT_SIZE, type TextRun } from './text-block-geo.js';
import { NOTE_FONT_SIZE } from './sequence-layout-shared.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { fmt } from '../../core/svg-format.js';
import { renderMessage } from './renderer-message.js';
import { renderParticipantBox, renderFooterBox } from './renderer-participant-shapes.js';
import { renderLifelinePass } from './renderer-lifeline.js';
import { renderFrameBlotter } from './renderer-frame-blotter.js';
import { renderGroupingHeaderBackground, renderGroupingHeaderForeground } from './renderer-frame-header.js';
import { GROUP_FONT_SIZE, GROUP_FONT_BOLD } from './frame-style.js';
import {
  DIVIDER_BACKGROUND,
  DIVIDER_BAND_HEIGHT,
  DIVIDER_FONT_BOLD,
  DIVIDER_FONT_SIZE,
  DIVIDER_LABEL_DELTA_X,
  DIVIDER_LINE_COLOR,
  DIVIDER_LINE_THICKNESS,
} from './divider-style.js';
import type { ScaledTheme } from './scale-geo.js';
import { scaleSequenceGeometry, scaleSequenceTheme, scaledDashPattern } from './scale-geo.js';
import { paginateSequence } from './sequence-page.js';
import {
  NEWPAGE_DASH_UNIT,
  NEWPAGE_LINE_COLOR,
  NEWPAGE_LINE_THICKNESS,
  NEWPAGE_MARGIN_Y,
} from './newpage-style.js';

/**
 * ONE creole run as a `<text>`, at the caller's ambient font wherever creole
 * set none -- `renderRefBody`'s shape (C5), shared by the two sites C6 added
 * rather than copied a third and fourth time. `DriverTextSvg#draw` reads
 * `font-weight`, `font-style`, `fill` and the assembled `text-decoration` off
 * ONE `FontConfiguration` per `UText` (`:104-160,177-180`), and
 * `SvgGraphics#openLink`/`closeLink` (`:1105-1150`) WRAP the drawn shape rather
 * than decorating it -- so the url reaches `sequence-text.ts`, the single `<a>`
 * emitter, and no measurer is acquired here (D1, D5). `boldFallback` is the
 * component STYLE's own weight, which a run that set its own beats -- exactly
 * as `renderBranchSeparators` resolves the group style's. */
function creoleRunText(run: TextRun, theme: ScaledTheme, fontSize: number, boldFallback = false): string {
  return sequenceText({
    leftX: run.x,
    baselineY: run.y,
    text: run.text,
    width: run.textWidth,
    fontFamily: run.fontFamily ?? theme.fontFamily,
    fontSize: run.fontSize ?? fontSize,
    fill: run.color ?? theme.colors.text,
    // `'700'`, not `'bold'` -- the jar emits the numeric form, and
    // `renderer-frame-header.ts#boldFontWeight` already set that convention.
    ...(run.bold ?? boldFallback ? { fontWeight: '700' as const } : {}),
    ...(run.italic === true ? { fontStyle: 'italic' as const } : {}),
    ...(run.decoration !== undefined ? { textDecoration: run.decoration } : {}),
    ...(run.url !== undefined ? { url: run.url } : {}),
    // A `<math>`/`<latex>` run draws its image instead of a `<text>`
    // (`sequence-text.ts#SequenceRunImage`, `AtomMath.java:78-97`).
    ...(run.image !== undefined ? { image: run.image } : {}),
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
  // A5: placed and measured in layout (D1). The block is LEFT-aligned at the
  // box's padding -- `ComponentRoseNoteBox#drawInternalU:105` translates it by
  // `(getOldPaddingX1() + diffX / 2, getOldPaddingY())` -- where this used to
  // centre it with a `text-anchor`, and its line advance is now the MEASURED
  // line height where it used to be a `fontSize * 1.4` ratio. C6: one run per
  // creole atom, at `note { FontSize 13 }` (`plantuml.skin:312-316`) scaled,
  // the same spec layout measured the box with.
  const textEls = note.textRuns
    .map((run) => creoleRunText(run, theme, NOTE_FONT_SIZE * theme.scaleK))
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
 * A `ref over` frame's body: one `<text>` per creole atom, centred in the box
 * below the header tab.
 *
 * `ComponentRoseReference#drawInternalU` draws the header at `(15, 2)` and
 * then the body as its own text block at `(textPos, oldPaddingY +
 * textHeaderHeight)` (`:125-136`) -- below the header, per the component's
 * alignment. The jar's two-line ref centres them: box x=70.3 w=76.775, lines
 * at x=74.3 and x=76.962, each on 108.7. This used to emit the whole body as
 * ONE `<text>` holding a literal newline, bracketed like an `alt` condition;
 * SVG collapses it, so it drew as one run where the jar spends one per line.
 *
 * The `y` is upstream's `getOldPaddingY() + textHeaderHeight` with two
 * deliberate substitutions: `+ theme.fontSize` because an SVG `<text>` y is a
 * BASELINE where upstream's translate is the block's top-left, and
 * `frame.tabHeight` for the measured `textHeaderHeight` because that is the
 * band this port draws -- both resolved in LAYOUT (T1/T5), as is the `x`.
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseReference.java#drawInternalU
 */
function renderRefBody(frame: FrameGeo, theme: ScaledTheme): string {
  // A4: x, baseline and width come off the run; C5: so does its STYLE, where
  // creole set one -- one `FontConfiguration` per `UText` (`DriverTextSvg
  // .java:104-160,177-180`). `cikoca-19-feji527`'s
  // `[[http://www.google.com]] Foo2` is two runs, the first linked; a
  // markup-free body is one run at the ambient pair, emitting what it emitted
  // before. `url` WRAPS rather than decorates (`SvgGraphics#openLink`/
  // `closeLink`, `:1105-1150`) and `sequence-text.ts` owns that wrap: no
  // second `<a>` emitter, no measurer (D1, D5).
  // C7: through `creoleRunText`, the helper this very block's shape was
  // extracted into -- every field it built inline is the one that helper
  // builds, at `reference { FontSize 12 }` (`plantuml.skin:145-151`), which
  // is what the run beside it was measured at and must agree with.
  return frame.refBody
    .map((run) => creoleRunText(run, theme, REFERENCE_FONT_SIZE * theme.scaleK))
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
      // A5: the runs are empty exactly when the branch carries no condition,
      // which is the case that draws the rule alone. C5: several runs where
      // creole styled the condition, each its own `<text>` (D3).
      return (
        rule +
        sep.runs
          .map((run) =>
            sequenceText({
              leftX: run.x,
              baselineY: run.y,
              text: run.text,
              width: run.textWidth,
              fontFamily: run.fontFamily ?? theme.fontFamily,
              fontSize: run.fontSize ?? labelFontSize,
              // `ComponentRoseGroupingElse` reads the GROUP style, whose
              // `FontStyle bold` the jar emits as `font-weight="700"` --
              // confirmed on `bovugo-63-lazo401`'s `[sinon]`. A creole run
              // that set its own weight wins over the style default.
              fontWeight: (run.bold ?? GROUP_FONT_BOLD) ? '700' : 'normal',
              fill: run.color ?? theme.colors.text,
              ...(run.italic === true ? { fontStyle: 'italic' as const } : {}),
              ...(run.decoration !== undefined ? { textDecoration: run.decoration } : {}),
              ...(run.url !== undefined ? { url: run.url } : {}),
              ...(run.image !== undefined ? { image: run.image } : {}),
            }),
          )
          .join('')
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
  // One `<text>` per creole atom, as the jar's own multi-line text block emits
  // (C6). A5: each run carries a real BASELINE, resolved in layout against the
  // label box's own top-left; the `dominantBaseline: 'hanging'` that stood in
  // for one is gone, and with it the last such adaptation in this file. The
  // separator style's `FontStyle bold` (`plantuml.skin:174-175`) reaches every
  // run through the `FontSpec` the seam's `FontConfiguration` was built from,
  // so `DIVIDER_FONT_BOLD` here only covers a run that carries no weight.
  const label = divider.labelRuns
    .map((run) => creoleRunText(run, theme, DIVIDER_FONT_SIZE * k, DIVIDER_FONT_BOLD))
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

/**
 * The page separator: ONE `ULine.hline(areaWidth)`, and nothing else.
 *
 * `ComponentRoseNewpage#drawInternalU` is three statements -- take the
 * style's stroke and line colour, draw a horizontal line the width of the
 * `Area` (`:59-64`) -- and `NewpageTile#drawU` hands it an `Area` spanning
 * `border1 … border2`, translated by `dy(MARGINY)` inside the tile
 * (`:83-90`). So the line sits 10px below the tile's top, which is what puts
 * it inside BOTH adjacent page bands.
 *
 * It draws nothing in the background pass -- `drawU` returns early on
 * `isBackground` (`NewpageTile.java:79-81`) -- which `renderEvent`'s
 * `isBackground` guard already provides.
 */
function renderNewpage(newpage: NewpageGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const y = newpage.y + NEWPAGE_MARGIN_Y * k;
  const unit = fmt(NEWPAGE_DASH_UNIT * k);
  return line(newpage.bandX, y, newpage.bandX + newpage.bandWidth, y, {
    stroke: NEWPAGE_LINE_COLOR,
    strokeWidth: NEWPAGE_LINE_THICKNESS * k,
    strokeDasharray: `${unit},${unit}`,
  });
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
    case 'newpage':
      return renderNewpage(event, theme);
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
/** See `layout.ts#boxLabelRun`, which measures at this same size and owns
 *  the divergence note for it. */
const BOX_LABEL_FONT_SIZE = 11;

function renderBoxBackground(box: BoxGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const fill = box.color !== '' ? box.color : BOX_DEFAULT_COLOR;
  const boxRect = rect(box.x, box.y, box.width, box.height, {
    fill,
    stroke: theme.colors.border,
  });
  return (
    boxRect +
    box.labelRuns.map((run) => creoleRunText(run, theme, BOX_LABEL_FONT_SIZE * k)).join('')
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** The jar's `data-diagram-type` value for this engine
 *  (`TextBlockExporter.java:293`), which routes `assembleSvg` through
 *  `assembleDocumentShell` instead of the generic `svgRoot`. */
const DIAGRAM_TYPE_SEQUENCE = 'SEQUENCE';

/**
 * Render ONE PAGE of a sequence diagram geometry into an SVG string.
 *
 * `SequenceDiagramFileMakerTeoz#getTextBlock(num, …)` sets the page index on
 * the body and only then draws it (`:127-146`), so the page selection sits
 * exactly here: between layout and render, ahead of the scale multiply,
 * because upstream paginates in layout space and applies `scale` on the way
 * out (`SvgGraphics#format`).
 *
 * `paginateSequence` returns `geo` by reference when the document has no
 * `newpage`, which is every document but 35 of the oracle corpus.
 */
export function renderSequencePage(
  geo: SequenceGeometry,
  theme: Theme,
  pageIndex: number,
): RenderFragment {
  return renderPaginated(paginateSequence(geo, pageIndex), theme);
}

/**
 * Render a sequence diagram geometry into an SVG string — PAGE 1 of it.
 *
 * The jar writes `f.svg`, `f_001.svg`, … for a multi-page document; this
 * port's render entry point returns one string, so it returns the first
 * page and {@link renderSequencePage} reaches the rest. See
 * `plans/sequence-newpage-pagination/decisions.md` D5.
 */
export function renderSequence(geo: SequenceGeometry, theme: Theme): RenderFragment {
  return renderSequencePage(geo, theme, 0);
}

function renderPaginated(geo: SequenceGeometry, theme: Theme): RenderFragment {
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
      scaledGeo.headHeight,
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
