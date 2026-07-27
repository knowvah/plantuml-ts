/**
 * Member-tip (`note <left|right> of Class::member`) notch resolution, plain/
 * dropped note geo building, and the `mapNoteGeos` entry point that maps a
 * completed dot layout back to `NoteGeo[]` for the renderer. Depends on
 * `note-layout-measure.ts` (`NoteMeasurement`) and `note-layout-groups.ts`
 * (`NoteGroup`, `OPALE_Y_SPACING`) -- never the reverse.
 */
import type { ClassNote, NotePosition } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { EdgeGeo } from './layout.js';
import { getBestMatchRow, buildOpaleNoteGeo, type OpalePoint } from './note-opale.js';
import { ROW_TEXT_LEFT_MARGIN } from './class-layout-helpers.js';
import type { NoteGeo, ClassifierAnchor } from './note-layout-types.js';
import type { NoteMeasurement } from './note-layout-measure.js';
import { type NoteGroup, OPALE_Y_SPACING } from './note-layout-groups.js';

// Local interfaces grouped at the top of the file (lizard NLOC quirk: an
// interface declared immediately before a function gets swept into that
// function's own NLOC count).

/** Per-group constants `tipAnchor`/`buildTipNoteGeo` need, resolved once per
 *  group rather than threaded as separate parameters (complexity-hook
 *  param cap). */
interface TipContext {
  direction: 'left' | 'right';
  host: ClassifierAnchor;
  notePos: { x: number; y: number };
  baselineOffset: number;
  rowHeight: number;
}

/** `notes`/`measurements` are always threaded together — bundled into one
 *  parameter (complexity-hook param cap). */
interface NoteDataset {
  notes: ClassNote[];
  measurements: Map<string, NoteMeasurement>;
}

/** One member-tip note's own identity + measurement + stacked position —
 *  bundled into one parameter for `resolveTipMember` (complexity-hook
 *  param cap). */
interface TipMember {
  note: ClassNote;
  m: NoteMeasurement;
  origin: { x: number; y: number };
}

/** One member-tip candidate's resolution within `mapGroupNoteGeos`'s
 *  stacking loop -- bundled into one parameter (complexity-hook param cap). */
interface TipStepInput {
  note: ClassNote;
  m: NoteMeasurement;
  origin: { x: number; y: number };
  tipCtx: TipContext;
  aborted: boolean;
  tipHeightAccum: number;
}

/** One group member's inputs for `mapGroupNoteGeos`'s stacking loop --
 *  bundled into one parameter (complexity-hook param cap). */
interface GroupStepInput {
  memberOrder: number;
  note: ClassNote;
  m: NoteMeasurement;
  origin: { x: number; y: number };
  isSingleton: boolean;
  connectorPoints: Array<{ x: number; y: number }>;
  tipCtx: TipContext | undefined;
  strictUml: boolean;
  aborted: boolean;
  tipHeightAccum: number;
}

/** `pos`/`connectorPoints`/`tipCtx`/`strictUml` are always threaded together
 *  from `mapNoteGeos` -- bundled into one parameter (complexity-hook param
 *  cap). */
interface GroupLayoutContext {
  pos: { x: number; y: number };
  connectorPoints: Array<{ x: number; y: number }>;
  tipCtx: TipContext | undefined;
  strictUml: boolean;
}

/** Everything one group's geo resolution needs from `mapNoteGeos`'s own
 *  once-per-call setup -- bundled into one parameter (complexity-hook
 *  param cap). */
interface NoteMapContext {
  posMap: Map<string, { x: number; y: number }>;
  classifierById: ReadonlyMap<string, ClassifierAnchor>;
  result: DotLayoutResult;
  baselineOffset: number;
  rowHeight: number;
  strictUml: boolean;
  freestandingConnectors: ReadonlyMap<string, EdgeGeo> | undefined;
}

/**
 * G2 N47: a host's member rows for `::member` tip-note matching --
 * `host.rows.slice(1)` (drops the header row) for a classic-body
 * classifier, or `host.enhancedBody`'s OWN flattened row list for an
 * enhanced-body one (whose `host.rows` carries no member content at all,
 * see {@link ClassifierAnchor.enhancedBody}'s doc comment). Tree rows
 * (`EnhancedTreePart`) participate too -- a tree leaf's row is exactly as
 * matchable as a plain enhanced row, same `{text, y, indent, width}` shape.
 */
function memberAnchorRows(
  host: ClassifierAnchor,
): ReadonlyArray<{ text: string; y: number; width?: number; indent: number }> {
  if (host.enhancedBody === undefined) return host.rows.slice(1);
  const out: Array<{ text: string; y: number; width?: number; indent: number }> = [];
  for (const part of host.enhancedBody.parts) {
    if (part.kind === 'rows' || part.kind === 'tree') out.push(...part.rows);
  }
  return out;
}

/**
 * Resolve a member-tip group's shared direction + host offset once (every
 * member in the group targets the SAME host+side, `mergeKey`'s own
 * invariant) — `EntityImageTips.java`'s `getPosition()`/`reverseDirection()`
 * plus its one-sided flip correction.
 * @see ~/git/plantuml/.../svek/image/EntityImageTips.java#drawU
 */
function resolveTipDirection(
  position: NotePosition,
  hostX: number,
  noteX: number,
): 'left' | 'right' {
  // Position.LEFT.reverseDirection() === RIGHT; Position.RIGHT.reverseDirection() === LEFT.
  const initial: 'left' | 'right' = position === 'left' ? 'right' : 'left';
  const xRaw = hostX - noteX;
  return initial === 'right' && xRaw < 0 ? 'left' : initial;
}

/**
 * `group.invis`'s host + direction, or `undefined` for any group that isn't
 * a resolvable member-tip group (freestanding, host-less, or a host that no
 * longer exists post `remove`/`hide`).
 * @see ~/git/plantuml/.../svek/image/EntityImageTips.java#drawU
 */
function resolveGroupTipContext(
  group: NoteGroup,
  pos: { x: number; y: number },
  classifierById: ReadonlyMap<string, ClassifierAnchor>,
  baselineOffset: number,
  rowHeight: number,
): TipContext | undefined {
  if (!group.invis || group.target === undefined || group.position === undefined) return undefined;
  const host = classifierById.get(group.target);
  if (host === undefined) return undefined;
  const direction = resolveTipDirection(group.position, host.x, pos.x);
  return { direction, host, notePos: pos, baselineOffset, rowHeight };
}

/**
 * The zigzag notch's host-side anchor point (`pp2`, LOCAL to the note's own
 * frame) for one resolved member-tip row.
 * @see ~/git/plantuml/.../svek/image/EntityImageTips.java#drawU
 */
function tipAnchor(
  ctx: TipContext,
  row: { y: number; width?: number; indent: number },
  heightAccum: number,
): OpalePoint {
  const { direction, host, notePos, baselineOffset, rowHeight } = ctx;
  const rowCenterY = row.y - baselineOffset + rowHeight / 2;
  // G2 N34: jar's real anchor is the row's OWN rendered bounding box
  // (`memberPosition.getMinX()`/`getMaxX()`, `EntityImageTips.java#drawU`).
  // `getMinX()` is the ROW's own left edge -- the icon-zone reservation
  // STARTS there whether or not this particular row has an icon, so it
  // stays the flat `ROW_TEXT_LEFT_MARGIN` constant regardless (jar-verified
  // `sanusa-54-keda128`: icon rows, anchor lands at `host.x + 6`, NOT
  // `host.x + row.indent`). `getMaxX()` is the row's TEXT run's own right
  // edge -- `row.indent` (icon-zone-aware) + the text's own measured
  // width (jar-verified `rubuxe-58-peba652`: `+attribute`, anchor lands at
  // `host.x + row.indent + row.width`, NOT `host.x + ROW_TEXT_LEFT_MARGIN +
  // row.width`). The two ends of the SAME row's bounding box are simply
  // measured from different reference points upstream -- not a symmetric
  // pair.
  const rowMinX = ROW_TEXT_LEFT_MARGIN;
  const rowMaxX = row.indent + (row.width ?? 0);
  const xRaw = host.x - notePos.x;
  return {
    x: xRaw + (direction === 'left' ? rowMaxX : rowMinX),
    y: host.y - notePos.y - heightAccum + rowCenterY,
  };
}

/**
 * One resolved member-tip note's geo, or `undefined` when its `::member`
 * target didn't match any host row (the caller marks it — and every later
 * member in the group — `dropped` instead).
 */
function buildTipNoteGeo(
  note: ClassNote,
  m: NoteMeasurement,
  origin: { x: number; y: number },
  ctx: TipContext,
  heightAccum: number,
): NoteGeo | undefined {
  const match = getBestMatchRow(memberAnchorRows(ctx.host), note.targetPort!);
  if (match === undefined) return undefined;
  const pp2 = tipAnchor(ctx, match, heightAccum);
  return {
    id: note.id, x: origin.x, y: origin.y, width: m.width, height: m.height, lines: m.lines,
    lineWidths: m.lineWidths,
    lineAtoms: m.lineAtoms,
    lineHeights: m.lineHeights,
    connector: [],
    tip: { direction: ctx.direction, pp1: { x: 0, y: m.height / 2 }, pp2 },
    ...(note.color !== undefined ? { color: note.color } : {}),
    ...(note.stereotype !== undefined ? { stereotype: note.stereotype } : {}),
    ...(note.url !== undefined ? { url: note.url } : {}),
  };
}


/** One dropped (unresolved `::member`) note's geo — no box, no notch, no
 *  text; kept in the output only so ink-extent walkers and uid assignment
 *  have a stable slot to skip. */
function droppedNoteGeo(note: ClassNote, m: NoteMeasurement, origin: { x: number; y: number }): NoteGeo {
  return { id: note.id, x: origin.x, y: origin.y, width: m.width, height: m.height, lines: m.lines, lineWidths: m.lineWidths, lineAtoms: m.lineAtoms, lineHeights: m.lineHeights, connector: [], dropped: true };
}

/** A plain (non-tip) note's geo — the shared shape both the tip and
 *  non-tip stacking branches would otherwise repeat inline. */
function plainNoteGeo(note: ClassNote, m: NoteMeasurement, origin: { x: number; y: number }, connector: Array<{ x: number; y: number }>): NoteGeo {
  return {
    id: note.id, x: origin.x, y: origin.y, width: m.width, height: m.height, lines: m.lines, lineWidths: m.lineWidths,
    lineAtoms: m.lineAtoms,
    lineHeights: m.lineHeights,
    connector,
    ...(note.creationIndex !== undefined ? { creationIndex: note.creationIndex } : {}),
    ...(note.phantomSlot !== undefined ? { phantomSlot: note.phantomSlot } : {}),
    ...(note.color !== undefined ? { color: note.color } : {}),
    ...(note.stereotype !== undefined ? { stereotype: note.stereotype } : {}),
    ...(note.url !== undefined ? { url: note.url } : {}),
  };
}

/** One member-tip note's outcome within its group's stacking loop — either
 *  its resolved geo, or a dropped placeholder plus the abort signal every
 *  LATER member in the same group must also honor. */
function resolveTipMember(
  member: TipMember,
  tipCtx: TipContext,
  aborted: boolean,
  heightAccum: number,
): { geo: NoteGeo; dropped: boolean } {
  const { note, m, origin } = member;
  const geo = aborted ? undefined : buildTipNoteGeo(note, m, origin, tipCtx, heightAccum);
  return geo === undefined ? { geo: droppedNoteGeo(note, m, origin), dropped: true } : { geo, dropped: false };
}

/**
 * G2 N53: splice `ClassNote.tipGroupPhantomIndex` onto its produced
 * `NoteGeo` -- applied uniformly across every branch of {@link
 * mapGroupNoteGeos}'s loop (tip/opale/plain/dropped) since a tip group's
 * LEADER can, in principle, fall through to a non-tip branch when its host
 * doesn't resolve (`tipCtx === undefined`) while still having burned its
 * parse-time phantom ranks -- the numbering consequence is independent of
 * which shape ends up drawn.
 */
function withTipGroupPhantom(geo: NoteGeo, note: ClassNote): NoteGeo {
  return note.tipGroupPhantomIndex !== undefined
    ? { ...geo, tipGroupPhantomIndex: note.tipGroupPhantomIndex }
    : geo;
}

/** One tip-branch step's outcome: the produced geo plus the updated
 *  abort/height-accumulator state for the NEXT member in the group. */
function stepTipMember(input: TipStepInput): { geo: NoteGeo; aborted: boolean; tipHeightAccum: number; advanceExtra: number } {
  const { note, m, origin, tipCtx, aborted, tipHeightAccum } = input;
  const { geo, dropped } = resolveTipMember({ note, m, origin }, tipCtx, aborted, tipHeightAccum);
  return dropped
    ? { geo, aborted: true, tipHeightAccum, advanceExtra: 0 }
    : { geo, aborted: false, tipHeightAccum: tipHeightAccum + m.height + OPALE_Y_SPACING, advanceExtra: OPALE_Y_SPACING };
}

/** A singleton group's real-connector geo — try the general opalisable
 *  mechanism first, fall back to the plain fold box when the connector
 *  doesn't resolve (freestanding note, degenerate spline).
 *
 * G2 N57 item 37: `strictUml` skips the Opale attempt entirely --
 * `GraphvizImageBuilder.java#isOpalisable`'s FIRST guard clause --
 * `if (dotData.getSkinParam().strictUmlStyle()) return false;` --
 * `skinparam style strictuml` disables the Opale merge UNCONDITIONALLY for
 * every single-link note, forcing the plain folded-corner box + separate
 * dashed connector shape instead (jar-verified: `fogexa-30-zupo141`'s real
 * golden SVG has `<path stroke-dasharray:7,7 .../>` as a SEPARATE element,
 * not a merged notch -- its `in.puml` carries `skinparam style strictuml`).
 * Every OTHER `isOpalisable` condition (leafType==NOTE, exactly-one-link,
 * other-end-not-a-note) is already faithfully reproduced by
 * `findUniqueTouching`/this function's own singleton-group branch below --
 * this was the ONE missing guard.
 */
function singletonNoteGeo(
  note: ClassNote,
  m: NoteMeasurement,
  origin: { x: number; y: number },
  connectorPoints: Array<{ x: number; y: number }>,
  strictUml: boolean,
): NoteGeo {
  return strictUml
    ? plainNoteGeo(note, m, origin, connectorPoints)
    : (buildOpaleNoteGeo(note, m, origin, connectorPoints) ?? plainNoteGeo(note, m, origin, connectorPoints));
}

/** One group member's resolved geo + advance/loop-state deltas -- the
 *  per-iteration body of {@link mapGroupNoteGeos}'s stacking loop, split out
 *  for the complexity-hook CCN cap. */
function resolveGroupStep(
  input: GroupStepInput,
): { geo: NoteGeo; advance: number; aborted: boolean; tipHeightAccum: number } {
  const { memberOrder, note, m, origin, isSingleton, connectorPoints, tipCtx, strictUml, aborted, tipHeightAccum } = input;
  if (tipCtx !== undefined && note.targetPort !== undefined) {
    const step = stepTipMember({ note, m, origin, tipCtx, aborted, tipHeightAccum });
    return {
      geo: withTipGroupPhantom(step.geo, note),
      advance: m.height + step.advanceExtra,
      aborted: step.aborted,
      tipHeightAccum: step.tipHeightAccum,
    };
  }
  const geo = isSingleton
    ? singletonNoteGeo(note, m, origin, connectorPoints, strictUml)
    : plainNoteGeo(note, m, origin, memberOrder === 0 ? connectorPoints : []);
  return { geo: withTipGroupPhantom(geo, note), advance: m.height, aborted, tipHeightAccum };
}

/**
 * One group's members, stacked. G2/N13: a member-tip note's OWN drawn
 * width/height is its INDIVIDUAL measurement (`m.width`/`m.height`), not
 * the shared group's `pos.width` — upstream stacks each tip as its own
 * independently-sized box within the group's reserved (max-width) DOT
 * column, left-aligned, not stretched to a common width (jar-verified:
 * `tenobo-24-liga464`'s two right-side tips draw at the SAME x but
 * DIFFERENT widths, 160.425 and 248.0938). A member-tip row that matches
 * NOTHING marks the note (and every LATER member in the same group)
 * `dropped` — mirrors `EntityImageTips#drawU`'s mid-loop early return,
 * which leaves already-drawn tips alone but aborts every remaining one.
 */
function mapGroupNoteGeos(group: NoteGroup, data: NoteDataset, ctx: GroupLayoutContext): NoteGeo[] {
  const { pos, connectorPoints, tipCtx, strictUml } = ctx;
  const out: NoteGeo[] = [];
  let yOffset = 0;
  let tipHeightAccum = 0;
  let aborted = false;
  const isSingleton = group.memberIndices.length === 1;
  for (const [memberOrder, i] of group.memberIndices.entries()) {
    const note = data.notes[i]!;
    const m = data.measurements.get(note.id)!;
    const origin = { x: pos.x, y: pos.y + yOffset };
    const step = resolveGroupStep({
      memberOrder, note, m, origin, isSingleton, connectorPoints, tipCtx, strictUml, aborted, tipHeightAccum,
    });
    out.push(step.geo);
    aborted = step.aborted;
    tipHeightAccum = step.tipHeightAccum;
    yOffset += step.advance;
  }
  return out;
}

/** One group's resolved member geos, `hostId`-stamped when its target
 *  resolved to a drawn classifier -- split out of `mapNoteGeos` for the
 *  complexity-hook CCN/NLOC caps; see that function's own doc comment for
 *  the per-member stacking/tip-resolution rules `mapGroupNoteGeos` applies. */
function resolveGroupGeos(group: NoteGroup, data: NoteDataset, ctx: NoteMapContext): NoteGeo[] {
  const pos = ctx.posMap.get(group.id);
  if (pos === undefined) return [];
  const noteEdge = ctx.result.edges.find((e) => e.id === `__noteedge_${group.id}`);
  const points = noteEdge?.points ?? ctx.freestandingConnectors?.get(group.id)?.points ?? [];
  const tipCtx = resolveGroupTipContext(group, pos, ctx.classifierById, ctx.baselineOffset, ctx.rowHeight);
  const geos = mapGroupNoteGeos(group, data, { pos, connectorPoints: points, tipCtx, strictUml: ctx.strictUml });
  // G2 N52: `NoteGeo.hostId`'s own doc comment -- only meaningful when the
  // target actually resolved to a drawn classifier (`ctx.classifierById`
  // mirrors the SAME lookup `resolveGroupTipContext` above already made).
  if (group.target !== undefined && ctx.classifierById.has(group.target)) {
    for (const g of geos) g.hostId = group.target;
  }
  return geos;
}

/**
 * Map the dot layout result back to `NoteGeo[]` for the renderer. Each
 * original note keeps its own visual box — a merged group's members stack
 * vertically within the group's laid-out bounding rect (matches the oracle
 * SVG: same-side notes render as separate folded-corner boxes flush against
 * each other, sharing one reserved layout column); see `mapGroupNoteGeos`
 * for the per-member stacking/tip-resolution rules.
 */
export function mapNoteGeos(
  notes: ClassNote[],
  result: DotLayoutResult,
  noteParts: { measurements: Map<string, NoteMeasurement>; groups: NoteGroup[] },
  anchorCtx: { classifiers: ReadonlyArray<ClassifierAnchor>; theme: Theme; measurer: StringMeasurer },
  /** G2/N16 Kind B: a freestanding note's ONE real relationship connector,
   *  keyed by note id (`note-freestanding.ts`); consulted only when the
   *  group has no synthetic `__noteedge_*` (a freestanding note has no
   *  `target`/`position`). */
  freestandingConnectors?: ReadonlyMap<string, EdgeGeo>,
): NoteGeo[] {
  const { measurements, groups } = noteParts;
  const { classifiers, theme, measurer } = anchorCtx;
  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  const ctx: NoteMapContext = {
    posMap: new Map(result.nodes.map((n) => [n.id, n])),
    classifierById: new Map(classifiers.map((c) => [c.id, c])),
    result,
    baselineOffset: fontSpec.size - measurer.getDescent(fontSpec, ''),
    rowHeight: fontSpec.size,
    strictUml: theme.strictUml === true,
    freestandingConnectors,
  };
  const data: NoteDataset = { notes, measurements };
  const out: NoteGeo[] = [];
  for (const group of groups) out.push(...resolveGroupGeos(group, data, ctx));
  return out;
}
