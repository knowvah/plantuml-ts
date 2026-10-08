/**
 * Activity node-shape rendering: per-shape SVG emitters (start/stop/end,
 * action -- plain or `BoxStyle`d, `activity-renderer-signal-shapes.ts` --,
 * bar, diamond, hexagon, note) plus the
 * renderNode dispatcher and shared label/color helpers. Split out of
 * `renderer.ts` (line cap); text `x` math lives in `activity-text-placement`.
 */

import type { ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import type { Paint } from '../../core/paint.js';
import type {} from '../../core/dispatcher.js';
import { rect, path } from '../../core/svg.js';
import { renderComposite as renderCompositeFrame } from './activity-renderer-composite.js';
import {
  noteFoldPath,
  noteBodyNormal,
  noteBodySpikeRight,
  noteBodySpikeLeft,
  noteFillOf,
} from './activity-renderer-note-shapes.js';
import {
  ACTIVITY_BAR_FILL,
  CIRCLE_INK,
  NOTE_LINE_THICKNESS,
  activityFontSize,
  activityLineThickness,
  activityRoundCorner,
} from './activity-style-defaults.js';
import { renderBar, renderSplitLine } from './activity-renderer-bars.js';
import {
  renderIfMerge,
  renderIfLabel,
  renderDiamond,
  renderHexagonPolygon,
  renderHexagonOwnLabel,
  renderIfSplitShape,
  diamondColors,
} from './activity-renderer-if-shapes.js';
import { renderBoxStyleAction } from './activity-renderer-signal-shapes.js';
import { renderStart, renderStop, renderEnd, renderSpot } from './activity-renderer-terminals.js';
import { boxStyleName } from './tiles/gtile-action.js';
import { renderActionLabel, renderNoteLabel } from './activity-creole-sheet.js';

// Pure-move re-exports (500-line splits T1c/T3f): these symbols now live in
// `activity-renderer-terminals.ts`/`activity-renderer-if-shapes.ts`
// respectively, each importing `actColors`/
// `centeredFirstBaselineY` BACK from this file (safe circularity: function
// definitions only, never called at module-load time) -- existing importers
// of these names are unchanged.
export { renderStart, renderStop, renderEnd, renderSpot };
export { renderDiamond };
/** `rx`/`ry` are each HALF the resolved `RoundCorner` (`URectangle#build()
 *  .rounded()`'s halving, D4). `activityDiagram { activity { RoundCorner
 *  25 } }` (plantuml.skin:362) makes both axes 12.5 -- was a bare unsourced
 *  `rx = 8` with no `ry` at all. */
function actionCornerRadius(theme: Theme): number {
  return activityRoundCorner(theme, 'activity') / 2;
}

// ---------------------------------------------------------------------------
// Multi-line labels: one <text> per line, T3 (aeg)
// ---------------------------------------------------------------------------

/**
 * The per-line baseline ADVANCE, and the ASCENT fraction used to place a
 * centred block's first line -- T3's D4 citation. Verified on
 * `boxoto-53-sifo232`: the jar's two label lines sit at y=139.333 and
 * y=151.333, 12.0 apart at `font-size="12"` -- an advance of EXACTLY 1x
 * font size, not the `fontSize * 1.4` this file used before T3.
 * @see net/sourceforge/plantuml/klimt/drawing/font/StringBounderFromWidthTable.java:71
 *      -- `calculateDimension`'s returned height is `size` (the raw font
 *      size), unconditionally: `final double height = size;`.
 * @see net/sourceforge/plantuml/klimt/font/StringBounder.java:47 -- the
 *      default `getDescent` is `font.getSize2D() / 4.5`.
 * This port's own `WidthTableMeasurer` (`src/core/measurer.ts`) already
 * carries both as `measure(text, font).height === font.size` and
 * `getDescent(font, text) === font.size / 4.5`, and sequence's own
 * multi-line note bodies use exactly this formula
 * (`sequence-layout-events.ts#noteBodyRuns`). Activity's per-line advance
 * mirrors it: `ASCENT_FRACTION = 1 - 1/4.5 = 7/9`, replacing the old
 * `lh * 0.8` approximation (0.8 was already close to 7/9 ≈ 0.7778 --
 * likely someone's earlier hand-rounding of the same ratio, never cited).
 */
export const ASCENT_FRACTION = 1 - 1 / 4.5;

/** First baseline Y so an N-line block is vertically centred around `cy`,
 *  using the cited advance/ascent above instead of the old `lh * 0.8`.
 *  `lineCount = 1` is this same formula's reduction to a SINGLE centred
 *  line (`cy + lineHeight * (ASCENT_FRACTION - 1/2)`) -- jar-verified
 *  against `rerovo-62-nazo755`'s hexagon label (`cy=27`, `fontSize=11`:
 *  jar `y=30.056`, exactly `27 + 11 * 5/18`) and `rarodo-65-fudu505`'s
 *  action-box label once expressed relative to `rect.y` (D1, exported for
 *  `renderer.ts`'s edge-label use, which centres on the same formula). */
export function centeredFirstBaselineY(cy: number, lineHeight: number, lineCount: number): number {
  return cy - (lineHeight * lineCount) / 2 + lineHeight * ASCENT_FRACTION;
}

// ---------------------------------------------------------------------------
// Activity-specific color resolution
// ---------------------------------------------------------------------------

export interface ActivityColors {
  nodeFill: Paint; // add2 T3h (family PAINT): gradients, not solid-only
  nodeBorder: string;
  barFill: string;
  startFill: string;
  endFill: string;
  diamondFill: Paint; // shares activityBackground's fallback tier
  diamondBorder: string;
}

export function actColors(theme: Theme): ActivityColors {
  const act = theme.colors.graph.activity;
  return {
    nodeFill: act?.background ?? theme.colors.nodeBackground,
    nodeBorder: act?.border ?? theme.colors.border,
    // `activityBar { BackgroundColor #5 }` (plantuml.skin:387, D4).
    barFill: act?.barColor ?? ACTIVITY_BAR_FILL,
    // `circle { start,stop,end { LineColor #2; BackgroundColor #2 } } }`
    // (plantuml.skin:379-380) -- SAME token for stroke/fill, `#2` resolved
    // through the ported `HColorSet` digit-length parser (D5). A user's
    // `skinparam ActivityStartColor` still wins (last tier, not first).
    startFill: act?.startColor ?? CIRCLE_INK,
    endFill: act?.endColor ?? CIRCLE_INK,
    diamondFill: diamondColors(act, theme).fill,
    diamondBorder: diamondColors(act, theme).border,
  };
}

// ---------------------------------------------------------------------------
// Node shape renderers
// ---------------------------------------------------------------------------
// `renderStart`/`renderStop`/`renderEnd` live in
// `activity-renderer-terminals.ts` (T1c, 500-line hook) -- re-exported
// above.

export function renderAction(node: ActivityNodeGeo, theme: Theme): string {
  // `activityDiagram { activity { FontSize 12 } }` (plantuml.skin:361) --
  // the SAME value `tiles/gtile-action.ts` measured this box at, so the
  // renderer draws into exactly the space the sizer reserved.
  const actionSize = activityFontSize(theme, 'activity');
  const c = actColors(theme);
  const fill = node.color ?? c.nodeFill;
  const box = rect(node.x, node.y, node.width, node.height, {
    fill,
    stroke: c.nodeBorder,
    strokeWidth: activityLineThickness(theme, 'activity'),
    rx: actionCornerRadius(theme),
    ry: actionCornerRadius(theme),
  });
  // D5 Sheet spike (`FtileBox.java:178-181`); `renderActionLabel` doc.
  return box + renderActionLabel(node.label ?? '', theme, actionSize, node);
}

/** `FtileBox#drawU`'s `boxStyle.drawMe` (`FtileBox.java:222`): PLAIN is the
 *  rounded rectangle ({@link renderAction}); every other `BoxStyle`
 *  (`Stereogroup#getBoxStyle`, `BoxStyle.java:126-133`) draws its own
 *  outline (`activity-renderer-signal-shapes.ts`). */
function renderActionBox(node: ActivityNodeGeo, theme: Theme): string {
  const style = boxStyleName(node.stereotype);
  return style === undefined ? renderAction(node, theme) : renderBoxStyleAction(node, theme, style);
}

export function renderNote(node: ActivityNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const noteFill = noteFillOf(node, theme); // add4-T1c: a note's own `#color`
  const stroke = theme.colors.border;
  const spike = node.spikeTip;
  const paint = { fill: noteFill, stroke, strokeWidth: NOTE_LINE_THICKNESS };
  // `node.notePosition === 'left'` means the NOTE sits left of its target,
  // so the spike protrudes from the note's RIGHT edge (`getPolygonRight`);
  // `'right'` is the mirror (`getPolygonLeft`, spike on the LEFT edge).
  let bodyD: string;
  if (spike !== undefined && node.notePosition === 'left') {
    bodyD = noteBodySpikeRight(x, y, w, h, spike);
  } else if (spike !== undefined && node.notePosition === 'right') {
    bodyD = noteBodySpikeLeft(x, y, w, h, spike);
  } else {
    bodyD = noteBodyNormal(x, y, w, h);
  }
  // `Opale#drawU` (`:126`) draws the fold as its OWN filled `<path>`
  // unconditionally -- same shape whether or not the note has a spike.
  const body = path(bodyD, paint) + path(noteFoldPath(x, y, w), paint);

  const label = node.label ?? '';

  // add3-T3d: `FtileWithNoteOpale.java:147-150` draws via the real creole
  // Sheet -- `renderNoteLabel`'s own doc.
  return body + renderNoteLabel(label, theme, { x, y, width: w, height: h }, stroke);
}

/** The root `composite { LineColor black; BackgroundColor transparent;
 *  LineThickness 1.5 }` block (`plantuml.skin:364-368`) -- a `partition`/
 *  `package`/`rectangle`/`card`/`group` frame (`group-dispatch.ts`'s
 *  `GROUP_TYPES`, all mapped to ONE `composite` SName by `FromSkinparam
 *  ToStyle.java:131-132`'s `PartitionBorderColor`/`PartitionBackground
 *  Color` converts). `node.kind` had no case here at all, so every group/
 *  partition fell through `renderNode`'s `default:` fallback and drew the
 *  generic node fill/border instead (T2f mechanism 6, `caciva-80-
 *  kene990`: ours `fill="#F1F1F1" stroke="#181818"`, jar `fill="none"
 *  stroke="#000"`). No `skinparam Partition*Color` override hook exists
 *  yet (would need a `core/theme-graph-colors-b.ts` field, out of this
 *  task's write-set) -- the plain default is drawn unconditionally, which
 *  is also what every cohort row needs (none sets that skinparam).
 *  T3g (family PART): the title tab + text now draw too, ported in
 *  `activity-renderer-composite.ts` (this file was at the line cap) --
 *  this is a one-line delegate so existing callers are unchanged. */
function renderComposite(node: ActivityNodeGeo, theme: Theme): string {
  return renderCompositeFrame(node, theme);
}

export function renderNode(node: ActivityNodeGeo, theme: Theme): string {
  switch (node.kind) {
    case 'start':
      return renderStart(node, theme);
    case 'stop':
      return renderStop(node, theme);
    case 'end':
      return renderEnd(node, theme);
    case 'action':
      return renderActionBox(node, theme);
    case 'break':
      // `break` is a flow-control marker — it has no visible glyph in
      // upstream PlantUML. The layout still places a zero-area anchor for
      // edge routing, but rendering produces no shape.
      return '';
    case 'repeat-start':
      return renderDiamond(node, theme);
    // #lizard forgives -- one dispatch arm per node kind (D4).
    case 'fork-bar':
    case 'join-bar':
      return renderBar(node, theme);
    case 'split-bar':
    case 'split-join-bar':
      return renderSplitLine(node, theme);
    case 'if-split':
    case 'repeat-cond':
      // T3k/add3-T3c: see `renderIfSplitShape`'s own doc comment
      // (`activity-renderer-if-shapes.ts`, split out there to keep this
      // function under the file's complexity cap).
      return renderIfSplitShape(node, theme);
    case 'while-header':
      // `FtileWhile.create` picks diamond1 by conditionStyle exactly as an
      // if does: INSIDE_HEXAGON -> FtileDiamondInside, INSIDE_DIAMOND ->
      // FtileDiamondSquare, EMPTY_DIAMOND -> FtileDiamond
      // (`vcompact/FtileWhile.java:130-140`); same shape dispatch as above.
      return renderIfSplitShape(node, theme);
    case 'if-merge':
      // add4-T2d: a switch's diamond2 is an `FtileDiamondInside` hexagon
      // (`FtileFactoryDelegatorSwitch.java:159-160`), not `FtileDiamond`'s
      // rhombus -- `walk-switch.ts#SWITCH_DIAMOND_SHAPE`.
      return node.diamondShape === 'inside' ? renderHexagonPolygon(node, theme) : renderIfMerge(node, theme);
    case 'if-label':
      return renderIfLabel(node, theme);
    case 'if-own-label':
      return renderHexagonOwnLabel(node, theme);
    case 'note':
      return renderNote(node, theme);
    case 'group':
    case 'partition':
      return renderComposite(node, theme);
    case 'spot':
      return renderSpot(node, theme);
    case 'label': // `FtileEmpty#drawU` is empty -- `ast.ts`'s own doc.
    case 'goto':
      return '';
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
