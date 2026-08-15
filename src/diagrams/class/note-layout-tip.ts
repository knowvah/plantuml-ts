/**
 * Note geo building: maps a completed dot layout back to `NoteGeo[]` for the
 * two draw passes (`mapNoteGeos`, the entry point), one geo per ORIGINAL
 * note, stacked within its group's laid-out box. Depends on
 * `note-layout-measure.ts` (`NoteMeasurement`) and `note-layout-groups.ts`
 * (`NoteGroup`, `OPALE_Y_SPACING`) -- never the reverse.
 *
 * Mission `note-leaf-model` D3: this module used to ALSO resolve a
 * member-tip (`::member`) note's notch here, which needed every host
 * classifier's position + row text BEFORE a note geo could exist -- the
 * layout-time phase dependency upstream does not have. A `'TIPS'` leaf now
 * leaves here carrying only its INPUTS (`NoteGeo.tipRequest`) and its
 * stacked position; `note-tips-resolve.ts#resolveTips` produces the notch
 * (or drops the tip) inside the draw passes, as `EntityImageTips#drawU`
 * does. Nothing in this module reads a classifier.
 */
import type { ClassNote } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { EdgeGeo } from './layout.js';
import { buildOpaleNoteGeo } from './note-opale.js';
import type { NoteGeo, TipRequest } from './note-layout-types.js';
import type { NoteMeasurement } from './note-layout-measure.js';
import { type NoteGroup, OPALE_Y_SPACING } from './note-layout-groups.js';

// Local interfaces grouped at the top of the file (lizard NLOC quirk: an
// interface declared immediately before a function gets swept into that
// function's own NLOC count).

/** `notes`/`measurements` are always threaded together — bundled into one
 *  parameter (complexity-hook param cap). */
interface NoteDataset {
  notes: ClassNote[];
  measurements: Map<string, NoteMeasurement>;
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
  /** Set iff this group is a member-tip (`group.invis`) group -- the two
   *  font metrics every `'TIPS'` geo in it bakes into its `tipRequest`. */
  tipMetrics: { baselineOffset: number; rowHeight: number } | undefined;
  strictUml: boolean;
}

/** `pos`/`connectorPoints`/`tipMetrics`/`strictUml` are always threaded
 *  together from `mapNoteGeos` -- bundled into one parameter (complexity-
 *  hook param cap). */
interface GroupLayoutContext {
  pos: { x: number; y: number };
  connectorPoints: Array<{ x: number; y: number }>;
  tipMetrics: { baselineOffset: number; rowHeight: number } | undefined;
  strictUml: boolean;
}

/** Everything one group's geo resolution needs from `mapNoteGeos`'s own
 *  once-per-call setup -- bundled into one parameter (complexity-hook
 *  param cap). */
interface NoteMapContext {
  posMap: Map<string, { x: number; y: number }>;
  result: DotLayoutResult;
  baselineOffset: number;
  rowHeight: number;
  strictUml: boolean;
  freestandingConnectors: ReadonlyMap<string, EdgeGeo> | undefined;
}

/** The parse-side fields every note kind copies onto its geo verbatim. */
function copiedNoteFields(note: ClassNote): Pick<NoteGeo, 'target' | 'color' | 'stereotype' | 'url'> {
  return {
    ...(note.target !== undefined ? { target: note.target } : {}),
    ...(note.color !== undefined ? { color: note.color } : {}),
    ...(note.stereotype !== undefined ? { stereotype: note.stereotype } : {}),
    ...(note.url !== undefined ? { url: note.url } : {}),
  };
}

/**
 * One member-tip note's geo -- upstream's `LeafType.TIPS` leaf, one geo per
 * tip INSIDE it (G2/N13: each tip's OWN drawn width/height is its
 * INDIVIDUAL measurement, not the shared group's reserved column width --
 * jar-verified `tenobo-24-liga464`, two right-side tips at the SAME x but
 * DIFFERENT widths, 160.425 and 248.0938). Carries `tipRequest`, never a
 * resolved notch: `note-tips-resolve.ts` does that at draw time.
 */
function tipNoteGeo(note: ClassNote, m: NoteMeasurement, origin: { x: number; y: number }, req: TipRequest): NoteGeo {
  return {
    id: note.id, leafType: 'TIPS', x: origin.x, y: origin.y, width: m.width, height: m.height, lines: m.lines,
    lineWidths: m.lineWidths,
    lineAtoms: m.lineAtoms,
    lineHeights: m.lineHeights,
    connector: [],
    tipRequest: req,
    ...copiedNoteFields(note),
  };
}

/** A plain (non-tip) note's geo — the shared shape both the tip and
 *  non-tip stacking branches would otherwise repeat inline. */
function plainNoteGeo(note: ClassNote, m: NoteMeasurement, origin: { x: number; y: number }, connector: Array<{ x: number; y: number }>): NoteGeo {
  return {
    id: note.id, leafType: 'NOTE', x: origin.x, y: origin.y, width: m.width, height: m.height, lines: m.lines, lineWidths: m.lineWidths,
    lineAtoms: m.lineAtoms,
    lineHeights: m.lineHeights,
    connector,
    ...(note.creationIndex !== undefined ? { creationIndex: note.creationIndex } : {}),
    ...(note.phantomSlot !== undefined ? { phantomSlot: note.phantomSlot } : {}),
    ...copiedNoteFields(note),
  };
}

/**
 * G2 N53: splice `ClassNote.tipGroupPhantomIndex` onto its produced
 * `NoteGeo` -- applied uniformly across every branch of {@link
 * mapGroupNoteGeos}'s loop since the numbering consequence is independent of
 * which shape ends up drawn.
 */
function withTipGroupPhantom(geo: NoteGeo, note: ClassNote): NoteGeo {
  return note.tipGroupPhantomIndex !== undefined
    ? { ...geo, tipGroupPhantomIndex: note.tipGroupPhantomIndex }
    : geo;
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

/** One group member's resolved geo + stacking advance -- the per-iteration
 *  body of {@link mapGroupNoteGeos}'s loop, split out for the complexity-hook
 *  CCN cap. A member-tip group advances by `EntityImageTips#drawU`'s own
 *  `dim.getHeight() + ySpacing` per tip; a plain group by the member's
 *  height alone. */
function resolveGroupStep(input: GroupStepInput): { geo: NoteGeo; advance: number } {
  const { memberOrder, note, m, origin, isSingleton, connectorPoints, tipMetrics, strictUml } = input;
  if (tipMetrics !== undefined && note.targetPort !== undefined && note.position !== undefined) {
    const req: TipRequest = { member: note.targetPort, position: note.position, ...tipMetrics };
    return { geo: withTipGroupPhantom(tipNoteGeo(note, m, origin, req), note), advance: m.height + OPALE_Y_SPACING };
  }
  const geo = isSingleton
    ? singletonNoteGeo(note, m, origin, connectorPoints, strictUml)
    : plainNoteGeo(note, m, origin, memberOrder === 0 ? connectorPoints : []);
  return { geo: withTipGroupPhantom(geo, note), advance: m.height };
}

/**
 * One group's members, stacked. Each member's origin is the group's laid-out
 * top-left plus the running advance of every earlier member -- for a
 * member-tip group that is `EntityImageTips#drawU`'s own `ug.apply(UTranslate
 * .dy(dim.getHeight() + ySpacing))` per tip, so a `'TIPS'` geo's `y` already
 * carries the `height` term the draw-time anchor needs (`note-tips-resolve
 * .ts#tipAnchor`).
 */
function mapGroupNoteGeos(group: NoteGroup, data: NoteDataset, ctx: GroupLayoutContext): NoteGeo[] {
  const { pos, connectorPoints, tipMetrics, strictUml } = ctx;
  const out: NoteGeo[] = [];
  let yOffset = 0;
  const isSingleton = group.memberIndices.length === 1;
  for (const [memberOrder, i] of group.memberIndices.entries()) {
    const note = data.notes[i]!;
    const m = data.measurements.get(note.id)!;
    const origin = { x: pos.x, y: pos.y + yOffset };
    const step = resolveGroupStep({ memberOrder, note, m, origin, isSingleton, connectorPoints, tipMetrics, strictUml });
    out.push(step.geo);
    yOffset += step.advance;
  }
  return out;
}

/** One group's member geos -- split out of `mapNoteGeos` for the complexity-
 *  hook CCN/NLOC caps; see `mapGroupNoteGeos` for the stacking rule. */
function resolveGroupGeos(group: NoteGroup, data: NoteDataset, ctx: NoteMapContext): NoteGeo[] {
  const pos = ctx.posMap.get(group.id);
  if (pos === undefined) return [];
  const noteEdge = ctx.result.edges.find((e) => e.id === `__noteedge_${group.id}`);
  const points = noteEdge?.points ?? ctx.freestandingConnectors?.get(group.id)?.points ?? [];
  const tipMetrics = group.invis ? { baselineOffset: ctx.baselineOffset, rowHeight: ctx.rowHeight } : undefined;
  return mapGroupNoteGeos(group, data, { pos, connectorPoints: points, tipMetrics, strictUml: ctx.strictUml });
}

/**
 * Map the dot layout result back to `NoteGeo[]` for the draw passes. Each
 * original note keeps its own visual box — a merged group's members stack
 * vertically within the group's laid-out bounding rect (matches the oracle
 * SVG: same-side notes render as separate folded-corner boxes flush against
 * each other, sharing one reserved layout column); see `mapGroupNoteGeos`
 * for the per-member stacking rule. Reads NO classifier (mission
 * `note-leaf-model` D3): `theme`/`measurer` are here only to bake the two
 * font metrics a `'TIPS'` geo's `tipRequest` carries.
 */
export function mapNoteGeos(
  notes: ClassNote[],
  result: DotLayoutResult,
  noteParts: { measurements: Map<string, NoteMeasurement>; groups: NoteGroup[] },
  metricsCtx: { theme: Theme; measurer: StringMeasurer },
  /** G2/N16 Kind B: a freestanding note's ONE real relationship connector,
   *  keyed by note id (`note-freestanding.ts`); consulted only when the
   *  group has no synthetic `__noteedge_*` (a freestanding note has no
   *  `target`/`position`). */
  freestandingConnectors?: ReadonlyMap<string, EdgeGeo>,
): NoteGeo[] {
  const { measurements, groups } = noteParts;
  const { theme, measurer } = metricsCtx;
  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  const ctx: NoteMapContext = {
    posMap: new Map(result.nodes.map((n) => [n.id, n])),
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
