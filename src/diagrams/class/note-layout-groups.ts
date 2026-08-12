/**
 * Same-side/same-host note grouping + the seam nodes/edges that go into the
 * svek dot graph. One-way dependency on `note-layout-measure.ts` (for
 * `NoteMeasurement`/`measureNote`) -- the tip/geo cluster
 * (`note-layout-tip.ts`) depends on this module, never the reverse.
 */
import type { ClassNote, NotePosition } from './ast.js';
import type { DotInputNode, DotInputEdge } from '../../core/graph-layout.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { measureNote, type NoteMeasurement } from './note-layout-measure.js';

/** `EntityImageTips.java`'s `ySpacing` — vertical gap between stacked
 *  member-tip notes merged onto the same (host, side). */
export const OPALE_Y_SPACING = 10;

/** Edge direction + minlen per note position (Svek note-on-entity). */
const NOTE_EDGE: Record<NotePosition, { fromNote: boolean; minLen: number }> = {
  left: { fromNote: true, minLen: 0 },
  right: { fromNote: false, minLen: 0 },
  top: { fromNote: true, minLen: 1 },
  bottom: { fromNote: false, minLen: 1 },
};

/**
 * A run of one or more `ClassNote`s that collapse into a single svek node —
 * upstream merges every note attached to the SAME SIDE of the SAME HOST into
 * one graphviz box, even when each targets a different `::member` suffix
 * (verified against the oracle: kugasi-68-josu446, sanusa-54-keda128,
 * tenobo-24-liga464 each have 2+ `note left/right of Host::member`
 * statements on one side of one host, and the oracle svek DOT emits exactly
 * ONE node for that side, not one per statement). Freestanding notes (no
 * target/position) and notes on different sides or hosts never merge — each
 * gets its own singleton group.
 */
export interface NoteGroup {
  /** Dot node id — the first member note's id, reused so downstream
   *  position lookups have a stable key. */
  id: string;
  target?: string;
  position?: NotePosition;
  /**
   * Member-anchored (`Class::member`) notes route as an invisible
   * layout-only edge; plain-classifier notes (including package anchors)
   * get a visible connector — verified against the oracle (kugasi/sanusa/
   * tenobo's `::member` notes are `style=invis`; dibinu/cejili's
   * plain-entity notes and pecabi/sanixi's package notes are not).
   */
  invis: boolean;
  /** Indices into the original `notes` array, in stacking order. */
  memberIndices: number[];
}

/** A singleton group for a freestanding note or a note's first appearance
 *  on a given (host, side). */
function newGroup(note: ClassNote, i: number): NoteGroup {
  return {
    id: note.id,
    ...(note.target !== undefined ? { target: note.target } : {}),
    ...(note.position !== undefined ? { position: note.position } : {}),
    invis: note.target !== undefined && note.targetPort !== undefined,
    memberIndices: [i],
  };
}

/** Only an EXPLICIT `of <Entity>` note is merge-eligible — a bare
 *  `note <pos>` (implicitTarget, falls back to lastEntity) never merges,
 *  even onto the same (host, side) as an explicit one (zepeki-75-pifo352). */
function mergeKey(note: ClassNote): string | undefined {
  if (note.target === undefined || note.position === undefined) return undefined;
  if (note.implicitTarget === true) return undefined;
  return `${note.target}|${note.position}`;
}

export function groupNotes(notes: ClassNote[]): NoteGroup[] {
  const groups: NoteGroup[] = [];
  const bySameSideHost = new Map<string, NoteGroup>();
  for (const [i, note] of notes.entries()) {
    const key = mergeKey(note);
    const existing = key === undefined ? undefined : bySameSideHost.get(key);
    if (existing !== undefined) {
      existing.memberIndices.push(i);
      continue;
    }
    const group = newGroup(note, i);
    if (key !== undefined) bySameSideHost.set(key, group);
    groups.push(group);
  }
  return groups;
}

/**
 * Merged box for a group: as wide as its widest member, tall enough to
 * stack all of them (the renderer draws each member as its own
 * folded-corner box within this reserved column — see mapNoteGeos).
 *
 * G2 N34: a member-tip group (`group.invis`, `EntityImageTips.java`'s
 * `calculateDimensionSlow`) reserves `dim.getHeight() + ySpacing` PER TIP,
 * unconditionally — even a LONE tip gets one `ySpacing` (10px) added, not
 * just a between-tips gap. jar-verified via the cached DOT (`gerima-02-
 * fade831`'s single-tip node: `height=0.458333in` = 33px = 23 (this port's
 * own `measureNote` height) + 10 (`OPALE_Y_SPACING`), NOT 23 alone) and the
 * rendered SVG gap between two stacked tips (`tenobo-24-liga464`: box 1
 * spans y=19-42, box 2 starts at y=52 — a 10px gap, not flush). A plain
 * (non-tip) merged group has no such term — `EntityImageNote.java`'s own
 * `calculateDimensionSlow` is bare `getPreferredHeight` (no `ySpacing`
 * add) — so this only applies when `group.invis` is true.
 */
function groupNodeSize(
  group: NoteGroup,
  notes: ClassNote[],
  measurements: Map<string, NoteMeasurement>,
): { width: number; height: number } {
  const sizes = group.memberIndices.map((i) => measurements.get(notes[i]!.id)!);
  const spacingPerMember = group.invis ? OPALE_Y_SPACING : 0;
  return {
    width: Math.max(...sizes.map((m) => m.width)),
    height: sizes.reduce((sum, m) => sum + m.height + spacingPerMember, 0),
  };
}

/**
 * The group's connector edge, or `undefined` for a freestanding note (no
 * host/position — any connector for it is a regular relationship line). A
 * package/namespace target routes to its `zaent-*` point anchor.
 *
 * G2/N14: `noArrow: true` always -- a note connector NEVER draws a real
 * arrowhead (merged into the note's own Opale outline when opalisable, a
 * bare undecorated dashed line otherwise, `renderer-note.ts#renderNote`'s
 * own connector draw has no marker) -- without it, @knowvah/dot-engine reserves its
 * default ~10-11px arrowhead-clip gap when trimming the routed spline to
 * the note's box boundary (`core/graph-layout.ts#addEdges`'s own doc
 * comment), which made `resolveOpaleConnector`'s notch anchor land ~11px
 * short of the real box edge (jar-verified wrong against `fezugi-39-
 * fujo327` before this fix).
 */
function groupEdge(group: NoteGroup, anchors: ReadonlyMap<string, string>): DotInputEdge | undefined {
  if (group.target === undefined || group.position === undefined) return undefined;
  const dir = NOTE_EDGE[group.position];
  const to = anchors.get(group.target) ?? group.target;
  const attributes: NonNullable<DotInputEdge['attributes']> = { minLen: dir.minLen, noArrow: true };
  if (group.invis) attributes.invis = true;
  return {
    id: `__noteedge_${group.id}`,
    from: dir.fromNote ? group.id : to,
    to: dir.fromNote ? to : group.id,
    attributes,
  };
}

/**
 * Build the seam nodes + connector edges for note-on-entity.
 *
 * `anchors` maps a package/namespace id to its `zaent-*` point-anchor id
 * (see class-shield-helpers.ts's `packageEndpointAnchors`) — a
 * `note <pos> of <package>` target routes its connector to that anchor
 * instead of the package's own id, the same substitution relationship
 * edges get when a package is used as an endpoint.
 */
export function buildNoteGraphParts(
  notes: ClassNote[],
  theme: Theme,
  measurer: StringMeasurer,
  anchors: ReadonlyMap<string, string>,
  sprites?: SpriteRegistry,
): {
  nodes: DotInputNode[];
  edges: DotInputEdge[];
  measurements: Map<string, NoteMeasurement>;
  groups: NoteGroup[];
} {
  const measurements = new Map<string, NoteMeasurement>();
  // A2s R2h: `sprites` threads the diagram's registry into the note creole
  // path so a `<$name>` note atom resolves like a member-row one (rotisi-30).
  for (const note of notes) measurements.set(note.id, measureNote(note.text, theme, measurer, sprites));

  const groups = groupNotes(notes);
  const nodes: DotInputNode[] = groups.map((group) => ({
    id: group.id,
    ...groupNodeSize(group, notes, measurements),
  }));
  const edges: DotInputEdge[] = [];
  for (const group of groups) {
    const edge = groupEdge(group, anchors);
    if (edge !== undefined) edges.push(edge);
  }
  return { nodes, edges, measurements, groups };
}
