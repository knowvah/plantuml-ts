/**
 * Flat state-diagram DOT-graph construction.
 *
 * Builds the `DotInputGraph` (nodes + edges — no clusters; composites are
 * T4's concern) consumed by the shared dot layout engine from a
 * `StateDiagramAST` whose states carry no children/concurrentRegions
 * anywhere (verified by the caller, ./layout.ts's `hasAnyComposite` guard).
 * Split out of ./layout.ts to keep both files under the project's per-file
 * size cap — mirrors class engine's class-dot-graph.ts (D1, duplicate
 * consciously, do not extract a shared base).
 *
 * @see ~/git/plantuml/.../svek/GeneralImageBuilder.java (per-kind image dispatch)
 * @see ~/git/plantuml/.../statediagram/StateDiagram.java#getStart/getEnd (per-scope shared [*] anchor)
 * @see ~/git/plantuml/.../svek/SvekEdge.java (minlen = arrow length - 1)
 * @see ~/git/plantuml/.../svek/DotStringFactory.java (nodesep/ranksep floors + rankdir)
 */

import type { State, StateDiagramAST, Transition } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { DotInputGraph, DotInputNode, DotInputEdge } from '../../core/graph-layout.js';
import { measureState, CIRCLE_START_SIZE, CIRCLE_END_SIZE } from './state-sizing.js';
import { buildNoteGraphPartsByScope } from './state-note-layout.js';
import type { ReservedLabelBox } from '../../core/edge-label-box.js';
import { computeReservedLabelBox, computeMergedLabelBox } from '../../core/edge-label-box.js';
// `EntityImageNoteLink`'s real dimension — shared-seam-extraction T6, D1:
// ONE port, `core/svek/image/EntityImageNoteLink.ts`, replacing this file's
// former private copy. See that module's doc comment for the full
// `ComponentRoseNote`/Opale derivation.
import { measureLinkNoteDim } from '../../core/svek/image/EntityImageNoteLink.js';

// ---------------------------------------------------------------------------
// [*] pseudostate anchors — one shared start/end node per (flat) diagram,
// mirroring StateDiagram#getStart/getEnd's per-scope quark caching.
// ---------------------------------------------------------------------------

export const INITIAL_ID = '__initial__';
export const FINAL_ID = '__final__';

/**
 * T7/D3/D4: the transition/edge-label font, resolved through the shared
 * resolver -- `GraphvizImageBuilder.java:234-235`'s `labelFont`, distinct
 * from `STATE(14, normal)` (body/entity-name text, `theme.fontSize`'s own
 * default). Mission G5/C0 jar-verified the size-14-vs-13 gap this replaced
 * (`bemena-23-zebu249`'s `"EvNewValueSaved"`: 120.05px at 14 vs jar's real
 * 111.475px at 13); `resolveArrowLabelFont` now also bridges
 * `<style> arrow { ... }` / `skinparam arrowFont*` (D3), which the bare
 * `ARROW_LABEL_FONT_SIZE` constant this replaces could not.
 */
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';

/** Resolve a transition endpoint id, redirecting the anonymous `[*]` token
 *  to the shared start (`from` position) or end (`to` position) anchor.
 *  Exported: `./layout.ts#buildFlatTransitionGeos` (mission G4 S2) reuses
 *  this SAME resolution for `TransitionGeo.from`/`to` -- previously that
 *  function pushed the RAW, unresolved AST endpoint string (`'[*]'`
 *  verbatim) instead, so `renderer.ts#svgEndpointId`'s `INITIAL_ID`/
 *  `FINAL_ID` check could never match a `[*]`-originating/-terminating
 *  flat-pipeline transition's `<path id="...">` value -- jar-verified
 *  broken on gefefe-91-xoge233/moleco-69-sida106 (`id="[*]-to-IDLE"`
 *  instead of jar's `id="*start*-to-IDLE"`). */
export function endpointId(raw: string, isFrom: boolean): string {
  if (raw !== '[*]') return raw;
  return isFrom ? INITIAL_ID : FINAL_ID;
}

function usesInitial(transitions: readonly Transition[]): boolean {
  return transitions.some((t) => t.from === '[*]');
}

function usesFinal(transitions: readonly Transition[]): boolean {
  return transitions.some((t) => t.to === '[*]');
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

function buildStateNode(
  state: State,
  hideEmptyDescription: boolean,
  theme: Theme,
  measurer: StringMeasurer,
  rankdir: 'TB' | 'LR',
): DotInputNode {
  const measured = measureState(state, hideEmptyDescription, theme, measurer, rankdir);
  return { id: state.id, width: measured.width, height: measured.height, shape: measured.shape };
}

function buildDotNodes(
  ast: StateDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  rankdir: 'TB' | 'LR',
): DotInputNode[] {
  const hideEmptyDescription = ast.hideEmptyDescription ?? false;
  const nodes = ast.states.map((s) => buildStateNode(s, hideEmptyDescription, theme, measurer, rankdir));
  if (usesInitial(ast.transitions)) {
    nodes.push({ id: INITIAL_ID, width: CIRCLE_START_SIZE, height: CIRCLE_START_SIZE, shape: 'circle' });
  }
  if (usesFinal(ast.transitions)) {
    nodes.push({ id: FINAL_ID, width: CIRCLE_END_SIZE, height: CIRCLE_END_SIZE, shape: 'circle' });
  }
  return nodes;
}

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

/** Guard/action/plain label text for a transition — same precedence as the
 *  legacy layout code (kept here so both the flat and composite paths agree
 *  on label text derivation; ./layout.ts re-exports it for the legacy path). */
export function transitionLabelText(t: Transition): string | undefined {
  if (t.label !== undefined) return t.label;
  if (t.guard !== undefined && t.action !== undefined) return `[${t.guard}] / ${t.action}`;
  if (t.guard !== undefined) return `[${t.guard}]`;
  if (t.action !== undefined) return `/ ${t.action}`;
  return undefined;
}

/**
 * `EntityImageNoteLink`'s own dimension — a DIFFERENT upstream component
 * from the one `state-note-layout.ts#measureNote` sizes (`EntityImageNote`/
 * `Opale`, for a plain `note right of X`): `note on link` builds a
 * `ComponentRoseNote` via `Rose#createComponentNote`
 * (`svek/image/EntityImageNoteLink.java:61-66`), not an `Opale`. Ported once,
 * shared across engines, at `core/svek/image/EntityImageNoteLink.ts`
 * (shared-seam-extraction T6, D1) — see that module's doc comment for the
 * full `ComponentRoseNote`/Opale padding derivation; state supplies no
 * `pureText` strategy, so the core port's naive fontFamily-only fallback
 * reproduces this file's former private copy byte-identically.
 *
 * Numerically confirmed against BOTH of `fotigo-12-gufu949`'s notes
 * (`oracle/goldens/state/fotigo-12-gufu949/svek-1.dot`): "Should be red"
 * measures 73.775px wide at the note font (13pt — `EntityImageNoteLink`
 * resolves its style through `ComponentType.NOTE`'s signature, same as
 * `measureNote`'s own `NOTE_FONT_SIZE`) -> `Math.floor(73.775 + 31) ===
 * 104`, the oracle's own `WIDTH="104"`; "Should be blue" at 79.625 ->
 * `Math.floor(79.625 + 31) === 110`, oracle's `WIDTH="110"`. Height: one
 * line at 13 -> `13 + 2*5 + 2*5 === 33`, both oracle boxes' `HEIGHT="33"`.
 *
 * `halfWidth`/`hasMiddleDecor` (see the `computeMergedLabelBox` call below)
 * are always false for state: `NoteLinkStrategy.HALF_*` is wired ONLY by
 * `objectdiagram/AbstractClassOrObjectDiagram.java:283-286` (a hidden-point
 * split-link mechanism state never uses — `abel/CucaNote.java:57`'s own
 * factory default is `NORMAL`), and state's link construction
 * (`statediagram/command/CommandLinkStateCommon.java:186`) only ever calls
 * `LinkType`'s 2-arg constructor, which fixes `middleDecor = NONE`
 * (`decoration/LinkType.java:73`) — the `goCircle`/`goSubset`/`goSuperset`
 * builders that produce a non-`NONE` middle decor are never reached from a
 * state diagram.
 */

/** Edge label attrs (HTML-table label, svek convention — mirrors class
 *  engine's edgeLabelAttrs). Widths/heights are ASSERTED by the DOT gate
 *  since 2026-08-15 (`svek-dot.ts#labelSizeOk`, edge-label-box D7) — the
 *  earlier "measured but tolerant, presence only" note here was the blind
 *  spot that let a 19x13-vs-21x15 box through (`buniva-95-zije634`).
 *
 *  Both `labelWidth`/`labelHeight` (the DOT-gate's `label=` table) and
 *  `labelBoxWidth`/`labelBoxHeight` (the REAL `@knowvah/dot-engine` layout
 *  input, `graph-layout-build-edges.ts`'s `hasLabelBox` gate) are always set
 *  together from the SAME box now — including when a `note on link` is
 *  attached, closing the gap the previous "scoped to note-free labels...
 *  the merged label+note margin story is still unverified" comment named:
 *  T9 verifies it (see `measureLinkNoteDim`'s doc). */
/** `SvekEdge.java:302-325`: upstream margin-wraps the label block BEFORE any
 *  note is merged onto it (`addVisibilityModifier`, `:372-373`) —
 *  `computeMergedLabelBox` already does this internally, so the plain and
 *  note-attached arms both route through a single `ReservedLabelBox`. Split
 *  out of `edgeLabelAttrs` to keep that function's own branching (text vs.
 *  note presence, both optional) separate from this one's (which formula). */
function computeEdgeLabelBox(
  t: Transition,
  text: string | undefined,
  font: { family: string; size: number },
  measurer: StringMeasurer,
): ReservedLabelBox {
  if (t.linkNote === undefined) return computeReservedLabelBox(text!, font, measurer, t.from === t.to);
  return computeMergedLabelBox({
    label: text ?? '',
    noteDim: measureLinkNoteDim(t.linkNote, { family: font.family }, measurer),
    position: t.linkNotePosition ?? 'bottom',
    halfWidth: false,
    hasMiddleDecor: false,
    font,
    measurer,
  });
}

function edgeLabelAttrs(
  t: Transition,
  font: { family: string; size: number },
  measurer: StringMeasurer,
): NonNullable<DotInputEdge['attributes']> {
  const text = transitionLabelText(t);
  if (text === undefined && t.linkNote === undefined) return {};
  const box = computeEdgeLabelBox(t, text, font, measurer);
  return {
    label: text ?? t.linkNote ?? '',
    labelWidth: box.reservedWidth,
    labelHeight: box.reservedHeight,
    labelBoxWidth: box.reservedWidth,
    labelBoxHeight: box.reservedHeight,
  };
}

/** Under `skinparam linetype ortho`, svek routes the main edge label through
 *  `xlabel` instead of `label` (SvekEdge.java:434-441: dotSplines == ORTHO
 *  branch) — taillabel/headlabel are unaffected (upstream only tests
 *  `dotMode`/`dotSplines` in the `hasNoteLabelText()` branch). Mutates in
 *  place; called only when linetype is ortho. Mirrors class engine's
 *  class-dot-graph.ts#moveLabelToXlabel (duplicated per this file's D1). */
function moveLabelToXlabel(attrs: NonNullable<DotInputEdge['attributes']>): void {
  if (attrs.label === undefined) return;
  attrs.xlabel = attrs.label;
  attrs.xlabelWidth = attrs.labelWidth!;
  attrs.xlabelHeight = attrs.labelHeight!;
  delete attrs.label;
  delete attrs.labelWidth;
  delete attrs.labelHeight;
}

function buildDotEdges(
  ast: StateDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): DotInputEdge[] {
  const font = resolveArrowLabelFont(theme);
  return ast.transitions.map((t, i) => {
    // minlen = arrow dash-count - 1 (SvekEdge.java) — shared convention with
    // class/object, not state-specific (mechanisms.md §4).
    const attributes: NonNullable<DotInputEdge['attributes']> = {
      minLen: (t.length ?? 2) - 1,
      ...edgeLabelAttrs(t, font, measurer),
    };
    if (theme.linetype === 'ortho') moveLabelToXlabel(attributes);
    // T2/B33: upstream inverts the Link when the arrow carries a `left`/`up`
    // direction word -- `statediagram/command/CommandLinkStateCommon.java
    // :205-206`, `if (dir == Direction.LEFT || dir == Direction.UP) link =
    // link.getInv();` -- the SAME rule `CommandLinkClass.java:362-363` applies
    // to class. dot ranks on edge direction, so emitting the un-inverted order
    // put `susena-02-gusa448` and `xupine-90-cupu906`'s targets on the wrong
    // rank. The reverse-arrow form (`B <-- A`) is NOT handled here: its
    // endpoints are already swapped at parse time, which is this port's
    // equivalent of `CommandLinkStateReverse#getDefaultDirection`'s LEFT
    // default (`CommandLinkStateReverse.java:77-79`).
    const inverted = t.direction === 'left' || t.direction === 'up';
    const tail = inverted ? t.to : t.from;
    const head = inverted ? t.from : t.to;
    return { id: `edge-${i}`, from: endpointId(tail, true), to: endpointId(head, false), attributes };
  });
}

// ---------------------------------------------------------------------------
// Graph attrs
// ---------------------------------------------------------------------------

/** nodesep=35pt / ranksep=60pt floors (DotStringFactory.java) — same floors
 *  as class/object, applied via the shared emitter's resolveSep; explicit
 *  skinparam overrides skip the floor (mirrors class-dot-graph.ts's sepAttrs). */
function sepAttrs(theme: Theme): Partial<DotInputGraph> {
  return {
    nodeSep: theme.nodeSep ?? 35,
    rankSep: theme.rankSep ?? 60,
    ...(theme.nodeSep !== undefined ? { nodeSepExplicit: true } : {}),
    ...(theme.rankSep !== undefined ? { rankSepExplicit: true } : {}),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the flat-diagram DOT input graph. Caller (./layout.ts) guarantees no
 * state in `ast` carries children/concurrentRegions — composites route
 * through the legacy path until T4 lands child passes + cluster envelopes.
 */
/** Notes have no `State.children` membership, so they route into the flat
 *  graph separately, keyed on the diagram's OWN scope (`''` — the only scope
 *  a note can ever declare in when `hasAnyComposite` is false, mission A4
 *  Phase L iter 9). Mutates `nodes`/`edges` in place. */
function addNotes(
  ast: StateDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  rankdir: 'TB' | 'LR',
  nodes: DotInputNode[],
  edges: DotInputEdge[],
): void {
  const parts = buildNoteGraphPartsByScope(ast.notes ?? [], theme, measurer, rankdir).get('');
  if (parts === undefined) return;
  nodes.push(...parts.nodes);
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const cand of parts.candidates) {
    if (!nodeIds.has(cand.target)) continue; // "Nothing to note to" already filtered at parse time
    edges.push({
      id: cand.id,
      from: cand.fromNote ? cand.noteId : cand.target,
      to: cand.fromNote ? cand.target : cand.noteId,
      attributes: { minLen: cand.minLen },
    });
  }
  // #lizard forgives -- pre-existing (6 params): the cohesive note-graph
  // mutation context (ast/theme/measurer/rankdir + the two flat-pipeline
  // accumulators it mutates in place) threaded from buildDotGraph's own
  // single call site, not new here (mission G5/C1).
}

export function buildDotGraph(
  ast: StateDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): DotInputGraph {
  const rankdir: 'TB' | 'LR' = ast.rankdir === 'left-to-right' ? 'LR' : 'TB';
  const nodes = buildDotNodes(ast, theme, measurer, rankdir);
  const edges = buildDotEdges(ast, theme, measurer);
  addNotes(ast, theme, measurer, rankdir, nodes, edges);
  return {
    nodes,
    edges,
    rankDir: rankdir,
    ...sepAttrs(theme),
    // mission G4 S8 (mechanism 19, mirrors G2 N29's identical class-engine
    // fix): state draws every transition's arrowhead as an inline
    // \x22<polygon>\x22 at the raw spline endpoint (mission G4 S1 mechanism 3),
    // not an SVG \x22<marker>\x22 -- jar's own svek-DOT emitter unconditionally
    // writes arrowtail=none,arrowhead=none on every edge line
    // (svek-dot-emit.ts, corpus-wide). Without this flag,
    // graph-layout-build.ts#addEdges defaults to arrowhead=normal and
    // @knowvah/dot-engine reserves a ~10-11px arrow-clip gap when solving the
    // spline, stopping every routed transition well short of its target
    // node's boundary -- verified against real `dot -Tplain` on
    // nelupe-49-xova546's own pinned svek-3.dot golden (see
    // tests/unit/state/state-manual-arrowheads.test.ts's doc comment for
    // the full derivation).
    manualArrowheads: true,
  };
}
