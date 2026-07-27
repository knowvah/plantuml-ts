/**
 * Shared geometry, context, and result types for the activity diagram
 * layout engine (see `layout.old.ts`).
 */

import type { ActivityNode } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';

// ---------------------------------------------------------------------------
// Public geometry types
// ---------------------------------------------------------------------------

export interface ActivityNodeGeo {
  id: string;
  kind: string;
  label?: string;
  color?: string;
  stereotype?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** For note nodes: which side the note sits on relative to its action. */
  notePosition?: 'left' | 'right';
  /** For note nodes: absolute coordinates of the balloon spike tip. */
  spikeTip?: { x: number; y: number };
}

export interface ActivityEdgeGeo {
  points: Array<{ x: number; y: number }>;
  label?: string;
  color?: string;
  midArrow?: boolean;
}

export interface SwimlaneGeo {
  name: string;
  x: number;
  width: number;
}

export interface ActivityGeometry {
  totalWidth: number;
  totalHeight: number;
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  swimlanes: SwimlaneGeo[];
}

// ---------------------------------------------------------------------------
// Branch layout result
// ---------------------------------------------------------------------------

export interface BranchResult {
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  /** y of the bottom of the last placed element. */
  bottomY: number;
  /** Width consumed by this branch column. */
  width: number;
  /** Id of first node in branch (for edge connections). */
  firstId: string | undefined;
  /** Id of last node in branch (for edge connections). undefined when node has multiple exits. */
  lastId: string | undefined;
  /**
   * When a composite node (if) has multiple open exits (non-terminal branches),
   * all their IDs are listed here. The caller uses these to fan-in to the next node.
   * Only present when exitIds.length > 1.
   */
  exitIds?: string[];
  /**
   * Geo nodes emitted by `break` statements inside this branch.
   * layoutRepeat drains these and wires them to the break-exit diamond.
   */
  breakGeos?: ActivityNodeGeo[];
}

/**
 * Extended BranchResult used internally to signal break-stop to layoutSequence.
 * The `kind` field is not part of the public BranchResult interface.
 */
export type BranchResultInternal = BranchResult & { kind?: 'break-stop' };

// ---------------------------------------------------------------------------
// Internal layout context
// ---------------------------------------------------------------------------

/**
 * Recursively lays out a sequence of ActivityNodes. Threaded through
 * `LayoutCtx` (rather than imported directly by composite-node layout
 * modules) so that if/fork/while/repeat layouts can call back into sequence
 * layout for their branches without a module import cycle back to
 * `activity-layout-sequence.ts` (which itself imports them for dispatch).
 */
export type LayoutSequenceFn = (
  nodes: readonly ActivityNode[],
  startY: number,
  centerX: number,
  ctx: LayoutCtx,
) => BranchResult;

export interface LayoutCtx {
  theme: Theme;
  measurer: StringMeasurer;
  /** Maps swimlane name → left x of the lane. Empty when no swimlanes. */
  laneX: Map<string, number>;
  /** Width of each lane. 0 when no swimlanes. */
  laneWidth: number;
  /** Total canvas width. */
  canvasWidth: number;
  /** Counters for sequential node ids. */
  counters: Map<string, number>;
  /** Reference to `layoutSequence`, see {@link LayoutSequenceFn}. */
  layoutSequenceFn: LayoutSequenceFn;
}
