/**
 * Note-on-entity DOT node + connector-edge construction for state diagrams
 * (mission A4 Phase L iter 9) — shared by both the flat (state-dot-graph.ts)
 * and composite (state-composite-pass.ts) DOT builders. A `StateDiagramAST`'s
 * `notes` array is diagram-wide (no State-tree membership of its own), so
 * this module is factored out of both consumers rather than duplicated —
 * unlike class/state's D1 duplication (which is about NOT sharing across
 * diagram TYPES), this is sharing within state's own two DOT-building paths.
 *
 * Mirrors class engine's `../class/note-layout.ts` (same upstream svek
 * mechanism — `EntityImageNote`/`Cluster` note handling has no diagram-type
 * branch) with two state-specific additions:
 *  (1) placement is PER SCOPE (`StateNote.scopeId`) — a state diagram's
 *      notes route into whichever svek pass owns their declaring scope,
 *      unlike class's single flat pass. Same-side/same-host merging
 *      (mirrors class's `NoteGroup`) is scoped too: merge keys include
 *      `scopeId`, so two notes can only merge when they share the same
 *      declaring scope (conservative — no fixture in this corpus exercises
 *      a genuine cross-scope merge, so this is the safer default).
 *  (2) note-position rotation under `left to right direction`
 *      (`Position.withRankdir`, utils/Position.java:49-66): RIGHT->BOTTOM,
 *      LEFT->TOP, BOTTOM->RIGHT, TOP->LEFT.
 *
 * NOT wired into `classifyDiagram`'s autarkic/zaent predicates this
 * iteration: `Entity.isAutarkic` (abel/Entity.java:702) iterates
 * `this.diagram.getLinks()` unconditionally — a note-to-host `Link` IS a
 * real diagram link upstream and CAN affect autonom/cluster classification
 * (e.g. a note declared INSIDE a composite's own scope, targeting a sibling
 * also inside that scope). No fixture in the corpus exercises this
 * interaction (the observed fixtures' notes are declared at the SAME scope
 * as their host or outside it entirely, which the "notes never disqualify"
 * simplification below already gets right); left as a named follow-up
 * (see state-composite-pass.ts's wiring comment).
 *
 * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnEntity.java
 *      (leaf + Link creation: dashed decor, `LinkArg.noDisplay`, no arrowheads)
 * @see ~/git/plantuml/.../command/note/CommandFactoryNote.java (freestanding)
 */

import type { NotePosition, StateNote } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { DotInputNode } from '../../core/graph-layout.js';
import type { FontConfiguration, FontStyle } from '../../core/klimt/shape/UText.js';
import { buildNoteBody } from '../../core/svek/image/leaf-sizing.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { creoleTextLines, type CreoleTextLine } from '../../core/svek/image/creole-text-lines.js';
import type { PureNoteTextDim } from '../../core/svek/image/EntityImageNoteLink.js';
// SI30 T5: the SAME per-run size/dy/tab-stop conversion the header/body
// path uses -- one core-vs-state-local seam, not a second one for notes
// (`state-sizing-creole.ts#toStyledLine`'s own doc comment).
import { toStyledLine, type StateStyledTextLine } from './state-sizing-creole.js';

/**
 * mission G4 S10: `Opale.java`'s real `EntityImageNote`/`Opale` margin
 * constants (`marginX1=6`/`marginX2=15`/`marginY=5`, `Opale.java:53`'s own
 * `cornersize=10` doubles as the SAME allowance the pre-S10 `NOTE_HPAD*2 +
 * NOTE_FOLD` approximation was reaching for, imprecisely) — jar-verified
 * against `labono-83-nega255` (single line, `textLength=108.4688` ->
 * `width=129.4688 === 108.4688 + 6 + 15` exactly) and `gedude-95-subi666`
 * (2 lines, `height=36 === 2*13 + 2*5` exactly, confirming NO `*1.4`
 * line-height multiplier — a note's own `BodyFactory`/`Sea` line stack uses
 * the PLAIN font size per line, unlike this port's other multi-line body
 * conventions elsewhere). The note's own font is a FIXED 13pt
 * (`plantuml.skin`'s `note { FontSize 13 }` default), NOT `theme.fontSize`
 * (the diagram's general 14pt body font) — the pre-S10 formula measured at
 * the WRONG size entirely, jar-verified via `labono`'s own `font-size="13"`.
 * `<style>`/`skinparam noteFontSize` overrides are a separate, unimplemented
 * cascade (mirrors class engine's `NOTE_FONT_SIZE` default-only precedent
 * before its own G2 N39) — not modeled here, `plans/g4-state-svg/ledger.md`
 * S10 queue.
 */
import { NOTE_FONT_SIZE } from '../../core/klimt/font/FontParam.js';
import { OPALE_MARGIN_X1 as NOTE_MARGIN_X1 } from '../../core/svek/image/Opale.js';
import { OPALE_MARGIN_X2 as NOTE_MARGIN_X2 } from '../../core/svek/image/Opale.js';
import { OPALE_MARGIN_Y as NOTE_MARGIN_Y } from '../../core/svek/image/Opale.js';

/** One measured line's own styled runs (SI30 T5: {@link StateStyledTextLine},
 *  the SAME per-run size/dy shape the header/body path draws with) — the
 *  DOT-sizing consumer (`buildScopeParts`) only reads the aggregate
 *  `width`/`height` below. `text`/`runs` are the RENDER-time approximation
 *  (see {@link buildRenderLines}'s own doc comment) — the authoritative
 *  content dimension the box is actually sized to is `NoteMeasurement.width`/
 *  `.height` below (T7, SI28 `findings/note.md`), not a sum/max of these. */
interface NoteMeasurement {
  readonly lines: readonly StateStyledTextLine[];
  readonly width: number;
  readonly height: number;
}

/** `note { FontSize 13 }`'s plain style set (`plantuml.skin` default,
 *  `EntityImageNote.java` never applies bold/italic/underline to the note's
 *  OWN base font — per-run styling comes from creole markup INSIDE the body,
 *  not the base `FontConfiguration`) — same empty-set precedent
 *  `leaf-sizing.ts`'s own (private, description-engine) `NOTE_FONT_STYLES`
 *  constant already establishes for the identical jar font. */
const NOTE_FONT_STYLES: ReadonlySet<FontStyle> = new Set();

/**
 * SI28 `findings/note.md` (fatupo-62-bemu777, xeziki-47-zomo866#a): the note
 * body's CONTENT dimension now routes through `buildNoteBody`
 * (`core/svek/image/leaf-sizing.ts`) — the SAME `BodyFactory.create3` ->
 * `BodyEnhanced2` real creole/table pipeline `EntityImageNote.java:114-118`
 * itself calls (`AtomTable.java:90-96`'s column/row-max grid box,
 * `StripeTable.java:82-84`'s `AtomWithMargin(table,2,2)` for a `|=…|` table
 * body; `StripeSimple`/`CreoleParser`'s `<color:…>` tag recognizer for plain
 * styled text) — replacing the RAW `text.split('\n')` + literal
 * `measurer.measure` model that measured pipe-table syntax and `<color:…>`
 * tags as literal glyphs. `leaf-sizing.ts`'s own doc comment already
 * jar-pins this exact call shape for the description engine's notes
 * (`"Hello" 50.74x23`, unchanged from the old flat model for markup-free
 * text — the swap is a NO-OP for every plain note, only markup/table bodies
 * move); this task reuses it rather than re-deriving the same pipeline a
 * second time inside `diagrams/state/`, per D1's "one core seam" principle
 * (this seam sits in `core/`, not the class engine, so no D8 cross-engine
 * import). Margins stay state's own `Opale.java`-derived constants (module
 * doc comment above) — `buildNoteBody`'s returned `TextBlock` is the PURE
 * (un-padded) content box, `EntityImageNote.java:176-181`'s own split.
 */
export function measureNote(text: string, theme: Theme, measurer: StringMeasurer): NoteMeasurement {
  const pure = measureNotePureText(text, theme.fontFamily, measurer);
  return {
    lines: buildRenderLines(text, theme, measurer),
    width: pure.width + NOTE_MARGIN_X1 + NOTE_MARGIN_X2,
    height: pure.height + NOTE_MARGIN_Y * 2,
  };
}

/**
 * The note body's PURE (un-padded) content dimension — the shared half of
 * {@link measureNote} above. Exported (not yet consumed elsewhere) as the
 * ready-made `pureText` strategy for `core/svek/image/EntityImageNoteLink.ts
 * #measureLinkNoteDim` (`shared-seam-extraction`/SI27's D1 extension point):
 * NOT wired into `state-composite-edge-label.ts`'s own `measureLinkNoteDim`
 * call this task, because `state-dot-graph.ts` (the FLAT pipeline's
 * byte-identical call, `computeEdgeLabelBox`, out of this task's write-set)
 * would then diverge from it — wiring only one of the two note-on-link call
 * sites breaks sizer/renderer LOCKSTEP (D1) between the flat and composite
 * pipelines, worse than the naive-default status quo both already share.
 * `state-composite-edge-label.ts`'s own SI28-flagged "duplicate" was already
 * resolved by SI27 into `EntityImageNoteLink.ts`'s one shared body (this
 * file's own top-of-file comment); the ONLY remaining gap is that shared
 * body's naive default for state, and closing it is a task for whoever owns
 * BOTH `state-dot-graph.ts` and `state-composite-edge-label.ts` at once. A
 * no-op today regardless: `EntityImageNoteLink.ts`'s own doc comment records
 * that no `note ... on link` fixture in the corpus carries creole markup. */
export function measureNotePureText(text: string, fontFamily: string, measurer: StringMeasurer): PureNoteTextDim {
  const font: FontConfiguration = { family: fontFamily, size: NOTE_FONT_SIZE, color: null, styles: NOTE_FONT_STYLES };
  const dim = buildNoteBody(text, font).calculateDimension(new MeasurerStringBounder(measurer));
  return { width: dim.getWidth(), height: dim.getHeight() };
}

/** `SkinParam#getTabSize` default (`SkinParam.java:1073`) — notes have no
 *  `theme.tabSize` cascade of their own threaded to this path (pre-existing
 *  scope limit, unchanged by SI30 T5); restated locally per this codebase's
 *  established per-module constant convention (`state-sizing-creole.ts`'s
 *  own `DEFAULT_TAB_SIZE`). */
const NOTE_TAB_SIZE_NB = 8;

/**
 * Per-visible-line render runs for {@link renderStateNote}'s per-run
 * `<text>` draw (`renderer-note.ts#renderNoteTextLines`) — kept separate
 * from the authoritative content dimension above because a note's own
 * `BodyFactory`/real-grid `AtomTable` pipeline ({@link measureNotePureText})
 * and this render-time approximation are independently derived (module doc
 * comment). Reuses the SAME {@link toStyledLine} conversion the header/body
 * path draws with (SI30 T5) for a TEXT/HR line's own per-run size/dy/color/
 * bold/italic/underline — a genuine, jar-ward improvement over the pre-T5
 * markup-stripped-and-joined single run (xeziki-47's own target shape). A
 * TABLE-kind line (T1's own `tableRowLine` doc comment: "T7 owns per-cell
 * parsing") still draws as its markup-stripped cells joined by two spaces,
 * unchanged by this task (SI29 T7 precedent: do not regress) — closer to
 * jar than the literal `|= a | b |` text, though still NOT jar's real
 * bordered grid (`AtomTable#drawU`'s per-cell rule lines), a named, deferred
 * gap since a real grid draw needs per-cell/per-column geometry
 * `StateTextLine` cannot carry without a `state-geo-types.ts` change outside
 * this task's write-set.
 */
function buildRenderLines(
  text: string,
  theme: Theme,
  measurer: StringMeasurer,
): readonly StateStyledTextLine[] {
  const font: FontSpec = { family: theme.fontFamily, size: NOTE_FONT_SIZE };
  return creoleTextLines(text, font, measurer).map((ln) =>
    ln.kind === 'table-row' ? tableRowRenderLine(ln, font, measurer) : toStyledLine(ln, font, measurer, NOTE_TAB_SIZE_NB),
  );
}

/** `StringTokenizer(line, "|")` (`StripeTable.java:139`, ported once already
 *  as `StripeTable.ts`'s own private `tokenizeByPipe` — duplicated here, not
 *  imported, since that helper is module-private and this is a SEPARATE,
 *  render-only per-cell join, not the real grid `StripeTable`/`AtomTable`
 *  builds (module doc comment)). Never produces an empty token, matching
 *  Java `StringTokenizer`'s own no-empty-token contract. */
function tokenizeByPipe(line: string): string[] {
  return line.split('|').filter((t) => t.length > 0);
}

/** One raw `|cell|cell|` line -> its cells' markup-stripped visible text
 *  (`= `-header marker stripped per `StripeTable.java:150-151`, width-inert
 *  per this module's doc comment — header BOLD styling is not drawn, same
 *  named gap), joined with two spaces standing in for jar's real column
 *  rules, wrapped as ONE run at the note's own font size (`dy: 0` — a table
 *  row line is never a `<sup>`/`<sub>` in this corpus). */
function tableRowRenderLine(
  ln: CreoleTextLine,
  font: FontSpec,
  measurer: StringMeasurer,
): StateStyledTextLine {
  const raw = ln.runs[0]?.text ?? '';
  const cells = tokenizeByPipe(raw).map((cell) => (cell.startsWith('=') ? cell.slice(1) : cell));
  const visible = cells.map((cell) => toStyledLine(creoleTextLines(cell, font, measurer)[0] ?? emptyLine(), font, measurer, NOTE_TAB_SIZE_NB).text);
  const joined = visible.join('  ');
  const width = measurer.measure(joined, font).width;
  return {
    text: joined,
    width,
    height: font.size,
    runs: [{ text: joined, width, bold: false, italic: false, underline: false, strike: false, size: font.size, dy: 0 }],
  };
}

/** `creoleTextLines('')` reports NO lines (module doc comment: "an empty
 *  `display` reports NO lines") — an empty table CELL still needs one, so
 *  this stands in for that case in {@link tableRowRenderLine}'s per-cell map. */
function emptyLine(): CreoleTextLine {
  return { runs: [], width: 0, height: 0, kind: 'text' };
}

/** `Position.withRankdir` (utils/Position.java:49-66) — under `left to right
 *  direction`, a note position rotates 90 degrees. No fixture in this
 *  corpus's note set uses LR, but `ctx.rankdir` is free to read at every
 *  call site, so this is ported alongside the base mechanism rather than
 *  deferred. */
function rotateForRankdir(position: NotePosition, rankdir: 'TB' | 'LR'): NotePosition {
  if (rankdir === 'TB') return position;
  const ROTATE: Record<NotePosition, NotePosition> = { right: 'bottom', left: 'top', bottom: 'right', top: 'left' };
  return ROTATE[position];
}

/** Edge direction + minlen per (rotated) note position — Svek note-on-entity,
 *  identical table to class engine's `note-layout.ts#NOTE_EDGE` (verified
 *  against the oracle on fatupo-62-bemu777/xodazu-26-cube992/gedude-95-
 *  subi666: right/left/bottom all match exactly). */
const NOTE_EDGE: Record<NotePosition, { fromNote: boolean; minLen: number }> = {
  left: { fromNote: true, minLen: 0 },
  right: { fromNote: false, minLen: 0 },
  top: { fromNote: true, minLen: 1 },
  bottom: { fromNote: false, minLen: 1 },
};

/** A run of one or more `StateNote`s attached to the SAME scope + host +
 *  side that collapse into a single svek node — mirrors class engine's
 *  `NoteGroup` (see this module's doc for the scoping addition). */
interface NoteGroup {
  /** Dot node id — the first member note's id. */
  id: string;
  target?: string;
  position?: NotePosition;
  /** Indices into the SAME per-scope note array passed to `groupNotes`. */
  memberIndices: number[];
}

function newGroup(note: StateNote, i: number): NoteGroup {
  return {
    id: note.id,
    ...(note.target !== undefined ? { target: note.target } : {}),
    ...(note.position !== undefined ? { position: note.position } : {}),
    memberIndices: [i],
  };
}

/** Only an EXPLICIT `of <State>` note is merge-eligible — mirrors class
 *  engine's `mergeKey` (zepeki-75-pifo352 precedent: an implicit-target note
 *  never merges, even onto the same (host, side) as an explicit one). */
function mergeKey(note: StateNote): string | undefined {
  if (note.target === undefined || note.position === undefined) return undefined;
  if (note.implicitTarget === true) return undefined;
  return `${note.target}|${note.position}`;
}

function groupNotes(notes: readonly StateNote[]): NoteGroup[] {
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

/** Merged box for a group: as wide as its widest member, tall enough to
 *  stack all of them (mirrors class engine's `groupNodeSize` — the renderer
 *  side of this, one folded-corner box per member, is a follow-up: this
 *  iteration is DOT-node/edge parity only, per `dot-parity-before-visual-
 *  qa` convention). */
function groupNodeSize(
  group: NoteGroup,
  notes: readonly StateNote[],
  measurements: Map<string, NoteMeasurement>,
): { width: number; height: number } {
  const sizes = group.memberIndices.map((i) => measurements.get(notes[i]!.id)!);
  return {
    width: Math.max(...sizes.map((m) => m.width)),
    height: sizes.reduce((sum, m) => sum + m.height, 0),
  };
}

/** An attached note group's not-yet-resolved connector edge — `target` is
 *  the RAW host id (a composite target may need `resolveEndpoint` at the
 *  caller, e.g. redirected to a `zaent` anchor); `noteId`/`target` are
 *  resolved against whichever pass's node set actually contains them (see
 *  state-composite-pass.ts's orphan-sweep wiring — same opportunistic,
 *  try-at-every-pass model iter 6 already established for regular
 *  transitions, since a note-to-host `Link` is, upstream, indistinguishable
 *  from any other `Link` for pass-attachment purposes). */
export interface NoteEdgeCandidate {
  id: string;
  noteId: string;
  target: string;
  fromNote: boolean;
  minLen: number;
}

export interface ScopeNoteParts {
  nodes: DotInputNode[];
  candidates: NoteEdgeCandidate[];
}

function measureAllNotes(notes: readonly StateNote[], theme: Theme, measurer: StringMeasurer): Map<string, NoteMeasurement> {
  const measurements = new Map<string, NoteMeasurement>();
  for (const note of notes) measurements.set(note.id, measureNote(note.text, theme, measurer));
  return measurements;
}

function partitionByScope(notes: readonly StateNote[]): Map<string, StateNote[]> {
  const byScope = new Map<string, StateNote[]>();
  for (const note of notes) {
    const list = byScope.get(note.scopeId);
    if (list === undefined) byScope.set(note.scopeId, [note]);
    else list.push(note);
  }
  return byScope;
}

/** One scope's note groups -> DOT nodes + connector-edge candidates
 *  (freestanding groups contribute a node only, no candidate). */
function buildScopeParts(
  scopeNotes: readonly StateNote[],
  measurements: Map<string, NoteMeasurement>,
  rankdir: 'TB' | 'LR',
): ScopeNoteParts {
  const groups = groupNotes(scopeNotes);
  const nodes: DotInputNode[] = groups.map((g) => ({ id: g.id, ...groupNodeSize(g, scopeNotes, measurements) }));
  const candidates: NoteEdgeCandidate[] = [];
  for (const group of groups) {
    if (group.target === undefined || group.position === undefined) continue; // freestanding — no connector
    const dir = NOTE_EDGE[rotateForRankdir(group.position, rankdir)];
    candidates.push({
      id: `__noteedge_${group.id}`,
      noteId: group.id,
      target: group.target,
      fromNote: dir.fromNote,
      minLen: dir.minLen,
    });
  }
  return { nodes, candidates };
}

/**
 * Build every scope's note DOT nodes + connector-edge candidates in one pass
 * over `notes`, grouped by `scopeId` (see this module's doc). Empty for a
 * scope with no notes (`.get(scopeId)` returns `undefined` — callers treat
 * that as "nothing to add", same convention as `ClassifyResult.kindOf`).
 */
export function buildNoteGraphPartsByScope(
  notes: readonly StateNote[],
  theme: Theme,
  measurer: StringMeasurer,
  rankdir: 'TB' | 'LR',
): Map<string, ScopeNoteParts> {
  const measurements = measureAllNotes(notes, theme, measurer);
  const byScope = partitionByScope(notes);
  const out = new Map<string, ScopeNoteParts>();
  for (const [scopeId, scopeNotes] of byScope) out.set(scopeId, buildScopeParts(scopeNotes, measurements, rankdir));
  return out;
}

/** Minimal structural shape a pass accumulator must satisfy for the sweep
 *  below — deliberately NOT `PassAccumulator` (state-composite-pass.ts) to
 *  avoid a value-level import back into that module; any accumulator whose
 *  `nodes`/`edges` are structurally compatible (both flat and composite
 *  paths' real accumulators are) works here. */
export interface NoteEdgeSweepTarget {
  nodes: readonly { id: string }[];
  edges: { id: string; from: string; to: string; attributes?: { minLen?: number } }[];
}

/**
 * Attempt every not-yet-consumed note-edge candidate against THIS pass's own
 * node set, resolving the host id via `resolveTarget` (the caller's
 * `resolveEndpoint`, e.g. redirecting a cluster composite to its zaent
 * anchor) — mirrors `state-composite-pass.ts#sweepOrphanEdges`'s
 * opportunistic per-pass attach model 1:1 (same upstream mechanism: a note's
 * `Link` is attempted at every `GraphvizImageBuilder#buildImage` pass and
 * silently dropped where an endpoint has no `SvekNode`). A candidate's OWN
 * note node exists in exactly one pass (fixed at note-node build time), so
 * this can only ever succeed at that one pass, regardless of call order.
 */
export function sweepOrphanNoteEdges(
  acc: NoteEdgeSweepTarget,
  pool: readonly NoteEdgeCandidate[],
  consumed: Set<NoteEdgeCandidate>,
  resolveTarget: (id: string) => string,
): void {
  const nodeIds = new Set(acc.nodes.map((n) => n.id));
  for (const cand of pool) {
    if (consumed.has(cand)) continue;
    if (!nodeIds.has(cand.noteId)) continue;
    const hostId = resolveTarget(cand.target);
    if (!nodeIds.has(hostId)) continue;
    acc.edges.push({
      id: cand.id,
      from: cand.fromNote ? cand.noteId : hostId,
      to: cand.fromNote ? hostId : cand.noteId,
      attributes: { minLen: cand.minLen },
    });
    consumed.add(cand);
  }
}
