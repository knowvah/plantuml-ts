/**
 * Sequential node-list layout and per-node dispatch for the activity
 * diagram layout engine (see `layout.old.ts`). This is the recursive core:
 * `layoutSequence` walks a node list top-to-bottom, and `layoutNode`
 * dispatches each node to its leaf (start/stop/action/break/note/
 * arrow-label) or composite (if/fork/split/while/repeat) layout.
 */

import type {
  ActivityAction,
  ActivityArrowLabel,
  ActivityBreak,
  ActivityDetach,
  ActivityEnd,
  ActivityFork,
  ActivityIf,
  ActivityKill,
  ActivityNode,
  ActivityNote,
  ActivityRepeat,
  ActivitySplit,
  ActivityStart,
  ActivityStop,
  ActivityWhile,
} from './ast.js';
import type {
  ActivityEdgeGeo,
  ActivityNodeGeo,
  BranchResult,
  BranchResultInternal,
  LayoutCtx,
} from './activity-layout-types.js';
import { NODE_MARGIN_Y, NOTE_SIDE_GAP } from './activity-layout-constants.js';
import { nextId, noteSize, orthogonalPoints } from './activity-layout-helpers.js';
import type { LayoutActionParams } from './activity-layout-leaf.js';
import { layoutAction, layoutBreak, layoutStart, layoutStop } from './activity-layout-leaf.js';
import { layoutIf } from './activity-layout-if.js';
import { layoutFork, layoutSplit } from './activity-layout-fork.js';
import { layoutWhile } from './activity-layout-while.js';
import { layoutRepeat } from './activity-layout-repeat.js';

type LeafNode =
  | ActivityStart
  | ActivityStop
  | ActivityEnd
  | ActivityKill
  | ActivityDetach
  | ActivityAction
  | ActivityBreak
  | ActivityNote
  | ActivityArrowLabel;

type CompositeNode = ActivityIf | ActivityFork | ActivitySplit | ActivityWhile | ActivityRepeat;

/**
 * Mutable accumulator threaded through one `layoutSequence` call. Mirrors
 * the local variables of the original monolithic loop.
 */
interface SequenceState {
  outNodes: ActivityNodeGeo[];
  outEdges: ActivityEdgeGeo[];
  currentY: number;
  firstId: string | undefined;
  lastId: string | undefined;
  /** exitIds carried from the previous node (multiple-exit nodes like if). */
  lastExitIds: string[] | undefined;
  /** Accumulated break geos from child nodes. */
  accBreakGeos: ActivityNodeGeo[];
  /** Pending label/color to attach to the next edge created. */
  pendingLabel: { label: string; color?: string } | undefined;
  /** Geo of the most recently placed main-flow node (used for note placement). */
  lastMainNodeGeo: ActivityNodeGeo | undefined;
}

function initSequenceState(startY: number): SequenceState {
  return {
    outNodes: [],
    outEdges: [],
    currentY: startY,
    firstId: undefined,
    lastId: undefined,
    lastExitIds: undefined,
    accBreakGeos: [],
    pendingLabel: undefined,
    lastMainNodeGeo: undefined,
  };
}

function processArrowLabelNode(node: ActivityArrowLabel, state: SequenceState): void {
  state.pendingLabel = { label: node.label, ...(node.color !== undefined ? { color: node.color } : {}) };
}

function computeNoteY(currentY: number, lastMainNodeGeo: ActivityNodeGeo | undefined): number {
  return lastMainNodeGeo !== undefined ? lastMainNodeGeo.y : currentY - NODE_MARGIN_Y;
}

function computeNoteX(
  position: 'left' | 'right',
  centerX: number,
  noteWidth: number,
  lastMainNodeGeo: ActivityNodeGeo | undefined,
): number {
  if (position === 'left') {
    return lastMainNodeGeo !== undefined
      ? lastMainNodeGeo.x - NOTE_SIDE_GAP - noteWidth
      : centerX - noteWidth - NOTE_SIDE_GAP;
  }
  return lastMainNodeGeo !== undefined
    ? lastMainNodeGeo.x + lastMainNodeGeo.width + NOTE_SIDE_GAP
    : centerX + NOTE_SIDE_GAP;
}

function computeNoteSpikeTip(
  position: 'left' | 'right',
  noteY: number,
  noteHeight: number,
  lastMainNodeGeo: ActivityNodeGeo,
): { x: number; y: number } {
  const connY = noteY + Math.min(noteHeight, lastMainNodeGeo.height) / 2;
  return position === 'left'
    ? { x: lastMainNodeGeo.x, y: connY }
    : { x: lastMainNodeGeo.x + lastMainNodeGeo.width, y: connY };
}

/** Notes float beside the preceding node rather than appearing inline. */
function computeNoteGeo(
  node: ActivityNote,
  centerX: number,
  currentY: number,
  lastMainNodeGeo: ActivityNodeGeo | undefined,
  ctx: LayoutCtx,
): ActivityNodeGeo {
  const sz = noteSize(node.text, ctx);
  const id = nextId(ctx, 'note');
  const noteY = computeNoteY(currentY, lastMainNodeGeo);
  const noteX = computeNoteX(node.position, centerX, sz.width, lastMainNodeGeo);
  const noteGeo: ActivityNodeGeo = {
    id,
    kind: 'note',
    label: node.text,
    x: noteX,
    y: noteY,
    width: sz.width,
    height: sz.height,
    notePosition: node.position,
  };
  if (lastMainNodeGeo !== undefined) {
    noteGeo.spikeTip = computeNoteSpikeTip(node.position, noteY, sz.height, lastMainNodeGeo);
  }
  return noteGeo;
}

function processNoteNode(node: ActivityNote, centerX: number, state: SequenceState, ctx: LayoutCtx): void {
  const noteGeo = computeNoteGeo(node, centerX, state.currentY, state.lastMainNodeGeo, ctx);
  state.outNodes.push(noteGeo);
  // Advance currentY only if the note extends beyond the preceding node's bottom.
  const noteBottom = noteGeo.y + noteGeo.height;
  if (noteBottom + NODE_MARGIN_Y > state.currentY) {
    state.currentY = noteBottom + NODE_MARGIN_Y;
  }
}

function appendNodeResult(result: BranchResultInternal, state: SequenceState): void {
  state.outNodes.push(...result.nodes);
  state.outEdges.push(...result.edges);
  if (result.breakGeos !== undefined && result.breakGeos.length > 0) {
    state.accBreakGeos.push(...result.breakGeos);
  }
}

/** Builds and pushes the connecting edge from fromNode to toNode, consuming any pending label. */
function pushConnectionEdge(fromNode: ActivityNodeGeo, toNode: ActivityNodeGeo, state: SequenceState): void {
  const edgeProps: ActivityEdgeGeo = {
    points: orthogonalPoints(
      fromNode.x + fromNode.width / 2,
      fromNode.y + fromNode.height,
      toNode.x + toNode.width / 2,
      toNode.y,
    ),
  };
  if (state.pendingLabel !== undefined) {
    edgeProps.label = state.pendingLabel.label;
    if (state.pendingLabel.color !== undefined) {
      edgeProps.color = state.pendingLabel.color;
    }
    state.pendingLabel = undefined;
  }
  state.outEdges.push(edgeProps);
}

/** Connect previous exit(s) to this node's first, consuming any pending label. */
function connectToNode(result: BranchResultInternal, state: SequenceState): void {
  if (result.firstId === undefined) return;
  const toNode = state.outNodes.find((n) => n.id === result.firstId);
  if (toNode === undefined) return;
  const prevExits =
    state.lastExitIds !== undefined
      ? state.lastExitIds
      : state.lastId !== undefined
        ? [state.lastId]
        : [];
  for (const exitId of prevExits) {
    const fromNode = state.outNodes.find((n) => n.id === exitId);
    if (fromNode !== undefined) {
      pushConnectionEdge(fromNode, toNode, state);
    }
  }
}

function updateSequenceState(result: BranchResultInternal, state: SequenceState): void {
  if (state.firstId === undefined) {
    state.firstId = result.firstId;
  }
  // When a break node returns lastId === undefined, stop advancing lastId
  // so subsequent nodes in the sequence are not connected to the break.
  if (result.lastId !== undefined) {
    state.lastId = result.lastId;
    state.lastExitIds = result.exitIds;
    const geo = result.nodes.find((n) => n.id === result.lastId);
    if (geo !== undefined) state.lastMainNodeGeo = geo;
  } else if (result.kind === 'break-stop') {
    // Break node: lastId stays undefined so nothing connects after it. We
    // deliberately do not update lastId here — the break geo has no
    // outgoing flow edge.
    state.lastId = undefined;
    state.lastExitIds = undefined;
  }
}

function finalizeSequenceResult(state: SequenceState, startY: number): BranchResult {
  const bottomY = state.currentY > startY ? state.currentY - NODE_MARGIN_Y : startY;

  let maxRight = 0;
  let minLeft = Infinity;
  for (const n of state.outNodes) {
    if (n.x < minLeft) minLeft = n.x;
    if (n.x + n.width > maxRight) maxRight = n.x + n.width;
  }
  const width = state.outNodes.length > 0 ? maxRight - minLeft : 0;

  // Propagate exitIds if the last node had multiple open exits
  const resultExitIds =
    state.lastExitIds !== undefined && state.lastExitIds.length > 1 ? state.lastExitIds : undefined;

  return {
    nodes: state.outNodes,
    edges: state.outEdges,
    bottomY,
    width,
    firstId: state.firstId,
    lastId: state.lastId,
    ...(resultExitIds !== undefined ? { exitIds: resultExitIds } : {}),
    ...(state.accBreakGeos.length > 0 ? { breakGeos: state.accBreakGeos } : {}),
  };
}

/**
 * Lay out a sequence of ActivityNodes starting at `startY`, horizontally
 * centered at `centerX`. Returns nodes, edges, and the y below the last node.
 */
export function layoutSequence(
  nodes: readonly ActivityNode[],
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  const state = initSequenceState(startY);

  for (const node of nodes) {
    // arrow-label is a flow annotation, not a layout node.
    // Capture it as pending style for the next edge and skip layout.
    if (node.kind === 'arrow-label') {
      processArrowLabelNode(node, state);
      continue;
    }
    if (node.kind === 'note') {
      processNoteNode(node, centerX, state, ctx);
      continue;
    }

    const result = layoutNode(node, state.currentY, centerX, ctx);
    appendNodeResult(result, state);
    connectToNode(result, state);
    updateSequenceState(result, state);
    state.currentY = result.bottomY + NODE_MARGIN_Y;
  }

  return finalizeSequenceResult(state, startY);
}

function isCompositeNode(node: ActivityNode): node is CompositeNode {
  return (
    node.kind === 'if' ||
    node.kind === 'fork' ||
    node.kind === 'split' ||
    node.kind === 'while' ||
    node.kind === 'repeat'
  );
}

function layoutCompositeNode(
  node: CompositeNode,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResult {
  switch (node.kind) {
    case 'if':
      return layoutIf(node, startY, centerX, ctx);
    case 'fork':
      return layoutFork(node, startY, centerX, ctx);
    case 'split':
      return layoutSplit(node, startY, centerX, ctx);
    case 'while':
      return layoutWhile(node, startY, centerX, ctx);
    case 'repeat':
      return layoutRepeat(node, startY, centerX, ctx);
  }
}

function layoutStandaloneNote(
  node: ActivityNote,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResultInternal {
  const id = nextId(ctx, 'note');
  const sz = noteSize(node.text, ctx);
  const geo: ActivityNodeGeo = {
    id,
    kind: 'note',
    label: node.text,
    x: centerX - sz.width / 2,
    y: startY,
    width: sz.width,
    height: sz.height,
  };
  return {
    nodes: [geo],
    edges: [],
    bottomY: startY + sz.height,
    width: sz.width,
    firstId: id,
    lastId: id,
  };
}

function layoutArrowLabelStub(startY: number): BranchResultInternal {
  // Defensive: arrow-label is handled in layoutSequence before reaching here.
  // Return an empty result to satisfy type exhaustiveness.
  return {
    nodes: [],
    edges: [],
    bottomY: startY,
    width: 0,
    firstId: undefined,
    lastId: undefined,
  };
}

function toLayoutActionParams(
  node: ActivityAction,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): LayoutActionParams {
  return {
    label: node.label,
    color: node.color,
    stereotype: node.stereotype,
    swimlane: node.swimlane,
    startY,
    centerX,
    ctx,
  };
}

/**
 * Lay out a single leaf ActivityNode at the given position. 'note' and
 * 'arrow-label' are intercepted by layoutSequence before reaching here;
 * their cases exist only for type exhaustiveness (see layoutStandaloneNote
 * / layoutArrowLabelStub).
 */
function layoutLeafNode(
  node: LeafNode,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResultInternal {
  switch (node.kind) {
    case 'start':
      return layoutStart(node.swimlane, startY, centerX, ctx);
    case 'stop':
    case 'end':
    case 'kill':
      return layoutStop(node.kind, node.swimlane, startY, centerX, ctx);
    case 'detach':
      return layoutStop('stop', node.swimlane, startY, centerX, ctx);
    case 'action':
      return layoutAction(toLayoutActionParams(node, startY, centerX, ctx));
    case 'break':
      return layoutBreak(node, startY, centerX, ctx);
    case 'note':
      return layoutStandaloneNote(node, startY, centerX, ctx);
    case 'arrow-label':
      return layoutArrowLabelStub(startY);
  }
}

/**
 * Lay out a single ActivityNode at the given position.
 * Returns the placed node(s), generated edges, the bottom y, and
 * the first/last node ids for edge connection purposes.
 */
function layoutNode(
  node: ActivityNode,
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
): BranchResultInternal {
  if (isCompositeNode(node)) {
    return layoutCompositeNode(node, startY, centerX, ctx);
  }
  return layoutLeafNode(node, startY, centerX, ctx);
}
