/**
 * State-diagram note materialization + rendering (mission G4 S10 — "notes
 * never render", the largest remaining zero-diff family named in S9's own
 * queue).
 *
 * Notes materialize as `StateNodeGeo` entries (`kind: 'note'`) sharing the
 * SAME creation-index sort/uid/ink-shift machinery every other state node
 * already uses (`state-geo-types.ts#StateNodeGeo`'s own `noteLines`/
 * `noteOpale` doc comments) rather than a parallel array + a separate
 * document-order mechanism the class engine's own `NoteGeo[]` needs — this
 * mission's `creationIndex` threading (S7) is exact enough that folding
 * notes into the SAME array + the SAME `sortSpecsByCreationIndex` walk
 * reproduces jar's real interleaved document order for free, and the
 * generic `shiftStateNode`/`buildStateUidPlan` walks (layout.ts,
 * renderer-uid.ts) need ZERO note-specific changes as a result.
 *
 * Two shapes only (jar-verified `labono-83-nega255`/`xodazu-26-cube992`/
 * `gedude-95-subi666`, byte-exact `<path d="...">` derivation against each
 * fixture's own raw SVG):
 *  - A FREESTANDING note (no host) draws jar's `EntityImageNote#drawNormal`
 *    shape — a plain folded-corner `<path>` box, ASYMMETRIC stroke-width
 *    (0.5 on the main outline, 1 — `UStroke`'s bare default — on the fold
 *    triangle): `drawNormal` strokes only the main polygon draw call
 *    (`stroked.draw(polygon)`), the corner draw (`ug.draw(getCorner(...))`)
 *    reuses the UN-stroked `ug`.
 *  - An ATTACHED note (`of X` / implicit-position) ALWAYS resolves to jar's
 *    Opale zigzag-notch MERGED shape (`EntityImageNote#drawU`'s
 *    `opaleLine`/`isOpale()` branch) — state's note-to-host connector edge
 *    always routes through this merge in every sampled fixture (no
 *    plain-box-plus-separate-dashed-line case reachable from this corpus,
 *    unlike class's own richer note taxonomy with namespace/member-tip
 *    targets). Both outline+corner draw with the SAME stroke-width (0.5) in
 *    this branch (`Opale.drawU` strokes both with one shared `ug`, unlike
 *    `drawNormal`'s asymmetric split above).
 *
 * Reuses `core/svek/image/Opale.ts`'s geometry functions
 * (`opalePolygonLeft/Right/Up/Down`/`opaleCorner`/`resolveOpaleConnector`) —
 * byte-exact ports of `Opale.java`, the SAME upstream mechanism regardless
 * of diagram type: upstream builds every cuca diagram's note through one
 * `EntityImageNote` (`svek/GeneralImageBuilder.java:118-119`).
 *
 * Those functions used to live in `../class/note-opale.ts`, and this module
 * imported them across an engine boundary — justified at the time by
 * `state-render-colors.ts`'s own `../class/` precedent. That was backwards:
 * a diagram-agnostic port of an `svek/image/` class does not belong inside
 * the class engine. It now sits in the package upstream puts it in, and
 * neither engine reaches into the other for it.
 *
 * NOT built this iteration (queued in full, `plans/g4-state-svg/ledger.md`
 * S10): `note ... on link` (embedded in the transition's OWN `<g
 * class="link">`, no host `<g class="entity">` at all — a THIRD,
 * structurally different shape, jar-verified `vateco-92-pece508`); creole
 * markup / table content inside a note body (`fatupo-62-bemu777`); `#color`
 * overrides on notes (the grammar's own `NOTE_COLOR` capture group is
 * non-capturing today, `state-notes.ts`'s own doc comment); the composite
 * pipeline's own note materialization (`state-composite-pass.ts` never
 * calls into this module yet — every target fixture this iteration is
 * FLAT, `layout.ts#hasAnyComposite` false for all three).
 */
import { lineTo, moveTo } from '../../core/svg-path-builder.js';
import type { StateDiagramAST, StateNote } from './ast.js';
import type { StateNodeGeo, StateTextLine } from './state-geo-types.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { DotLayoutResult } from '../../core/graph-layout.types.js';
import { path, text as svgText } from '../../core/svg.js';
import { measureNote } from './state-note-layout.js';
import { resolveStateFill, textAscent } from './state-render-colors.js';
import {
  opalePolygonLeft,
  opalePolygonRight,
  opalePolygonUp,
  opalePolygonDown,
  opaleCorner,
  resolveOpaleConnector,
} from '../../core/svek/image/Opale.js';

// ---------------------------------------------------------------------------
// Constants — Opale.java's real jar values (see module doc comment for the
// jar-verified derivation against labono-83-nega255/gedude-95-subi666).
// ---------------------------------------------------------------------------

import { NOTE_FONT_SIZE } from '../../core/klimt/font/FontParam.js';
import { OPALE_MARGIN_X1 as NOTE_MARGIN_X1 } from '../../core/svek/image/Opale.js';
import { OPALE_MARGIN_Y as NOTE_MARGIN_Y } from '../../core/svek/image/Opale.js';
/** `Opale.java`'s `cornersize` — the folded-corner triangle size, SAME
 *  constant `../class/note-opale.ts#OPALE_CORNER_SIZE` already uses. */
import { OPALE_CORNERSIZE as NOTE_FOLD } from '../../core/svek/image/Opale.js';
/** `ColorParam.noteBackground`'s plantuml.skin default — the fallback when
 *  a note has no `#color` override (mission G4 S12: resolved via
 *  `resolveStateFill`, the SAME fill-only override precedent
 *  `state-render-colors.ts` already establishes for state boxes/
 *  pseudostates — `<style>`-bucket override support remains out of scope,
 *  module doc comment). */
const NOTE_FILL = '#FEFFDD';
const NOTE_STROKE_WIDTH = 0.5;
/** `UStroke`'s bare default width — `drawNormal`'s UN-stroked corner draw
 *  call (module doc comment's freestanding-shape derivation). */
const NOTE_CORNER_DEFAULT_STROKE_WIDTH = 1;

// ---------------------------------------------------------------------------
// Geo materialization (post-DOT-layout)
// ---------------------------------------------------------------------------

type DotNode = DotLayoutResult['nodes'][number];
type DotEdge = DotLayoutResult['edges'][number];

/** Resolve an attached note's Opale notch direction/anchors from its own
 *  routed connector-edge spline (`state-note-layout.ts#buildNoteGraphPartsByScope`
 *  already contributes a `__noteedge_<id>` DOT edge for every singleton
 *  attached-note group — `mergeKey`'s own doc comment; this mission's target
 *  fixtures never exercise a MULTI-member group, so `group.id === note.id`
 *  always holds here). `undefined` when the connector edge never resolved
 *  (freestanding note, or an edge id genuinely absent from this pass's own
 *  result set) — the caller falls back to the plain folded-corner box. */
function resolveNoteOpale(
  note: StateNote,
  pos: Pick<DotNode, 'x' | 'y' | 'width' | 'height'>,
  edgePosMap: ReadonlyMap<string, DotEdge>,
): StateNodeGeo['noteOpale'] {
  if (note.target === undefined) return undefined;
  const edge = edgePosMap.get(`__noteedge_${note.id}`);
  if (edge === undefined) return undefined;
  return resolveOpaleConnector({ width: pos.width, height: pos.height }, { x: pos.x, y: pos.y }, edge.points);
}

/** Parameter bundle for {@link buildFlatNoteGeos} — collapsed from 5
 *  positional args into one object to stay inside this project's
 *  per-function param-count budget (mirrors `renderer-group.ts
 *  #WrapLinkInfo`'s own precedent). */
export interface FlatNoteGeoCtx {
  readonly posMap: ReadonlyMap<string, DotNode>;
  readonly edgePosMap: ReadonlyMap<string, DotEdge>;
  readonly theme: Theme;
  readonly measurer: StringMeasurer;
}

/** One note -> a renderable `StateNodeGeo`, or `undefined` when it has no
 *  own DOT-layout position (composite-scoped notes this iteration, or a
 *  genuinely orphaned note — see {@link buildFlatNoteGeos}'s own doc
 *  comment). Split out purely to keep {@link buildFlatNoteGeos} under this
 *  project's per-function NLOC cap. */
function buildOneNoteGeo(note: StateNote, ctx: FlatNoteGeoCtx): StateNodeGeo | undefined {
  const pos = ctx.posMap.get(note.id);
  if (pos === undefined) return undefined;
  const m = measureNote(note.text, ctx.theme, ctx.measurer);
  const opale = resolveNoteOpale(note, pos, ctx.edgePosMap);
  return {
    id: note.id,
    kind: 'note',
    display: '',
    x: pos.x,
    y: pos.y,
    width: pos.width,
    height: pos.height,
    children: [],
    transitions: [],
    noteLines: m.lines,
    ...(opale !== undefined ? { noteOpale: opale } : {}),
    ...(note.creationIndex !== undefined ? { creationIndex: note.creationIndex } : {}),
    ...(note.color !== undefined ? { color: note.color } : {}),
  };
}

/**
 * Map the diagram's OWN top-level notes (`StateNote.scopeId === ''`) into
 * renderable `StateNodeGeo` entries — the flat pipeline's own note
 * materialization (`layout.ts#buildFlatStateGeos`'s missing piece named by
 * S9's own diagnosis). A composite-scoped note (`scopeId !== ''`) is
 * skipped entirely — the composite pipeline's own materialization is a
 * separate, unbuilt piece this iteration (module doc comment).
 */
export function buildFlatNoteGeos(ast: StateDiagramAST, ctx: FlatNoteGeoCtx): StateNodeGeo[] {
  const geos: StateNodeGeo[] = [];
  for (const note of ast.notes ?? []) {
    if (note.scopeId !== '') continue;
    const geo = buildOneNoteGeo(note, ctx);
    if (geo !== undefined) geos.push(geo);
  }
  return geos;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Note body text, one `<text>` per line, LEFT-anchored — mirrors
 *  `../class/renderer-note.ts#renderNoteText`'s plain (no creole atoms)
 *  fallback shape; no target fixture this iteration carries inline markup
 *  in a note body (module doc comment). */
function renderNoteTextLines(node: StateNodeGeo, theme: Theme): string {
  const lines = node.noteLines ?? [];
  const parts: string[] = [];
  let lineTop = node.y + NOTE_MARGIN_Y;
  for (const ln of lines) {
    const y = lineTop + textAscent(NOTE_FONT_SIZE);
    parts.push(
      svgText(node.x + NOTE_MARGIN_X1, y, ln.text, {
        fontFamily: theme.fontFamily,
        fontSize: NOTE_FONT_SIZE,
        fill: '#000000',
        lengthAdjust: 'spacing',
        textLength: ln.width,
      }),
    );
    lineTop += NOTE_FONT_SIZE;
  }
  return parts.join('');
}

/** Freestanding note: `Opale.getPolygonNormal`/`getCorner` at `roundCorner
 *  === 0` (module doc comment's `drawNormal` derivation) — a plain
 *  rectangle-with-cut-corner `<path>` PLUS a separate filled corner
 *  triangle `<path>`, asymmetric stroke-width. */
export function renderStateNoteFreestanding(node: StateNodeGeo, theme: Theme): string {
  const { x, y, width: w, height: h } = node;
  const c = NOTE_FOLD;
  const fill = resolveStateFill(node, NOTE_FILL);
  const outline = [
    moveTo(x, y), lineTo(x, y + h), lineTo(x + w, y + h),
    lineTo(x + w, y + c), lineTo(x + w - c, y), lineTo(x, y),
  ].join(' ');
  const corner = [
    moveTo(x + w - c, y), lineTo(x + w - c, y + c),
    lineTo(x + w, y + c), lineTo(x + w - c, y),
  ].join(' ');
  return (
    path(outline, { fill, stroke: theme.colors.border, strokeWidth: NOTE_STROKE_WIDTH }) +
    path(corner, { fill, stroke: theme.colors.border, strokeWidth: NOTE_CORNER_DEFAULT_STROKE_WIDTH }) +
    renderNoteTextLines(node, theme)
  );
}

const OPALE_OUTLINE_FN = {
  left: opalePolygonLeft,
  right: opalePolygonRight,
  up: opalePolygonUp,
  down: opalePolygonDown,
} as const;

/** Attached note, resolved to a real host connector: `Opale.drawU`'s
 *  merged zigzag-notch shape (module doc comment) — SAME stroke-width on
 *  both the outline and corner `<path>`s, unlike the freestanding shape
 *  above. */
export function renderStateNoteOpale(node: StateNodeGeo, theme: Theme): string {
  const opale = node.noteOpale!;
  const box = { origin: { x: node.x, y: node.y }, width: node.width, height: node.height };
  const connector = { pp1: opale.pp1, pp2: opale.pp2 };
  const outline = OPALE_OUTLINE_FN[opale.direction](box, connector);
  const corner = opaleCorner({ x: node.x, y: node.y }, node.width);
  const fill = resolveStateFill(node, NOTE_FILL);
  return (
    path(outline, { fill, stroke: theme.colors.border, strokeWidth: NOTE_STROKE_WIDTH }) +
    path(corner, { fill, stroke: theme.colors.border, strokeWidth: NOTE_STROKE_WIDTH }) +
    renderNoteTextLines(node, theme)
  );
}

/** Dispatch by shape — {@link StateNodeGeo.noteOpale} present ⇒ the merged
 *  notch (attached, resolved host); absent ⇒ the plain folded-corner box
 *  (freestanding, or an attached note whose connector never resolved). */
export function renderStateNote(node: StateNodeGeo, theme: Theme): string {
  return node.noteOpale !== undefined ? renderStateNoteOpale(node, theme) : renderStateNoteFreestanding(node, theme);
}

// ---------------------------------------------------------------------------
// `note ... on link` (T4, `note-on-link`/`state-declared-size-fix`) — drawn
// INSIDE the transition's own `<g class="link">`, no host `<g class="entity">`
// at all: the THIRD note shape this module's own top doc comment queued
// (`vateco-92-pece508`).
// ---------------------------------------------------------------------------

/** `Rose.java:65-66` — `paddingX`/`paddingY`, both 5, `Rose#createComponentNote`
 *  passes into every `ComponentRoseNote` (`Rose.java:114-115`); the SAME
 *  constant `core/rose-note-dim.ts`'s own (unexported) `ROSE_NOTE_PADDING`
 *  sizes into `measureLinkNoteDim`'s box — duplicated here (not exported
 *  cross-file, D1) because the renderer additionally needs it as a DRAW
 *  offset, not just a dimension term. */
const ROSE_NOTE_PADDING = 5;

/** `ComponentRoseNote#drawInternalU` (`skin/rose/ComponentRoseNote.java`):
 *  `box` is `TransitionGeo.label`'s own `{x,y,width,height}` — already the
 *  FULL preferred box (`core/rose-note-dim.ts#roseNoteDim`'s derivation,
 *  `pure + 31` wide / `pure + 20` tall). The polygon+corner are inset by
 *  {@link ROSE_NOTE_PADDING} on every side (`getPolygonNormal`/`getCorner`
 *  draw at `x2 = getTextWidth`, `textHeight = getTextHeight` — both already
 *  `2 * ROSE_NOTE_PADDING` SMALLER than the preferred box); the text a
 *  further `NOTE_MARGIN_X1`/`NOTE_MARGIN_Y` inside that (`drawInternalU`'s
 *  `position === LEFT` translate by `(getOldPaddingX1, getOldPaddingY)` —
 *  state's own default `noteTextAlignment`, non-CENTER). BOTH `<path>`s
 *  share ONE stroke-width (0.5) — `drawInternalU` draws the polygon AND the
 *  corner through the SAME `ug` (`symbolContext.apply(ug)`), unlike
 *  {@link renderStateNoteFreestanding}'s asymmetric split (module doc
 *  comment) — jar-verified against `vateco-92-pece508`'s own canonical SVG
 *  (both `<path>`s there carry `stroke-width:0.5`).
 *
 *  Scoped to this task's sole target (tumaba-64-tosu281): a single-line note
 *  merged with an EMPTY inline label, where `labelText` reduces to the RAW
 *  `EntityImageNoteLink` block (`TransitionGeo.label`'s own doc comment) and
 *  `drawInternalU`'s `x2` never stretches past `getTextWidth` (`area.width >
 *  getPreferredWidth` never holds). A note merged with a NON-empty inline
 *  label — where the polygon DOES stretch — is out of scope, same residue
 *  `computeMergedLabelBox`'s own doc comment already flags for the merge
 *  term; no note fill/color override either (`Transition.linkNoteColor`
 *  gap, `state-notes.ts`'s own doc comment). */
export function renderNoteOnLink(
  box: { x: number; y: number; width: number; height: number },
  lines: readonly StateTextLine[],
  theme: Theme,
): string {
  const px = box.x + ROSE_NOTE_PADDING;
  const py = box.y + ROSE_NOTE_PADDING;
  const pw = box.width - 2 * ROSE_NOTE_PADDING;
  const ph = box.height - 2 * ROSE_NOTE_PADDING;
  const c = NOTE_FOLD;
  const outline = [
    moveTo(px, py), lineTo(px, py + ph), lineTo(px + pw, py + ph),
    lineTo(px + pw, py + c), lineTo(px + pw - c, py), lineTo(px, py),
  ].join(' ');
  const corner = [
    moveTo(px + pw - c, py), lineTo(px + pw - c, py + c),
    lineTo(px + pw, py + c), lineTo(px + pw - c, py),
  ].join(' ');
  const shapeMarkup =
    path(outline, { fill: NOTE_FILL, stroke: theme.colors.border, strokeWidth: NOTE_STROKE_WIDTH }) +
    path(corner, { fill: NOTE_FILL, stroke: theme.colors.border, strokeWidth: NOTE_STROKE_WIDTH });
  return shapeMarkup + renderNoteOnLinkTextLines(px, py, lines, theme);
}

/** Split out of {@link renderNoteOnLink} to stay under this project's
 *  per-function NLOC cap — the note body text, one `<text>` per line,
 *  LEFT-anchored (mirrors {@link renderNoteTextLines}'s own loop, offset
 *  from the INSET polygon origin `(px, py)` rather than a `StateNodeGeo`'s
 *  own `x`/`y`). */
function renderNoteOnLinkTextLines(
  px: number,
  py: number,
  lines: readonly StateTextLine[],
  theme: Theme,
): string {
  const parts: string[] = [];
  let lineTop = py + NOTE_MARGIN_Y;
  for (const ln of lines) {
    const y = lineTop + textAscent(NOTE_FONT_SIZE);
    parts.push(
      svgText(px + NOTE_MARGIN_X1, y, ln.text, {
        fontFamily: theme.fontFamily,
        fontSize: NOTE_FONT_SIZE,
        fill: '#000000',
        lengthAdjust: 'spacing',
        textLength: ln.width,
      }),
    );
    lineTop += NOTE_FONT_SIZE;
  }
  return parts.join('');
}
