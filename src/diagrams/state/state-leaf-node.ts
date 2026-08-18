/**
 * Leaf-node DOT sizing/shape (mission A4/T4 + Phase L Gap 1) — originally a
 * pure move out of state-composite-pass.ts to keep that file under the
 * repo's 500-line cap (`buildLeafNode` grew past the cap once the Gap 1
 * border-point plaintext/rect shape branch was added). SI28/state-declared-
 * size-fix T2 (G7) later ported EXPANSION_INPUT/EXPANSION_OUTPUT's
 * rankdir-swapped dimension (G9 deferred — see `buildLeafNode`).
 *
 * @see ~/git/plantuml/.../svek/image/EntityImageStateBorder.java
 * @see ~/git/plantuml/.../svek/SvekNode.java#appendLabelHtmlSpecialForPort
 */

import type { State } from './ast.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { DotInputNode } from '../../core/graph-layout.js';
import { measureState } from './state-sizing.js';
import {
  getEntityPosition,
  usesPortShape,
  getBorderPointDimension,
  BORDER_POINT_SIZE,
  PORT_LABEL_WIDE_THRESHOLD,
  PORT_TABLE_PAD_FLOOR,
} from './state-entity-position.js';

/** The subset of `DiagramCtx` (state-composite-pass.ts) `buildLeafNode`
 *  actually reads — kept narrow/structural rather than importing the full
 *  `DiagramCtx` type to avoid a needless coupling to that module's other
 *  (pass-bookkeeping) fields. `DiagramCtx` satisfies this structurally (it
 *  carries every field below plus more), so `buildTopLevelPass`'s call site
 *  needs no separate construction. */
export interface LeafNodeCtx {
  theme: Theme;
  measurer: StringMeasurer;
  rankdir: 'TB' | 'LR';
}

/** A leaf node's DOT sizing — normal-kind measurement or the fixed
 *  border-point box (EntityPosition != NORMAL overrides StateKind sizing
 *  regardless of stereotype-derived kind — mechanisms.md §1). */
export function buildLeafNode(s: State, ctx: LeafNodeCtx): DotInputNode {
  const pos = getEntityPosition(s);
  if (pos !== 'normal') {
    if (!usesPortShape(pos)) {
      // INPUT_PIN/OUTPUT_PIN/EXPANSION_* — EntityPosition.getShapeType()
      // stays plain RECTANGLE; no :P suffix (usePortP() false). Dimensions:
      // fixed BORDER_POINT_SIZE square for INPUT_PIN/OUTPUT_PIN;
      // rankdir-swapped for EXPANSION_INPUT/EXPANSION_OUTPUT — see
      // getBorderPointDimension (state-entity-position.ts,
      // EntityPosition.java:120-128, G7).
      const { width, height } = getBorderPointDimension(pos, ctx.rankdir);
      return { id: s.id, width, height, shape: 'rect' };
    }
    // ENTRY_POINT/EXIT_POINT: isPort stays true regardless of the shape
    // branch below (EntityPosition.usePortP() — drives the `:P` edge-ref
    // suffix AND the cluster emitter's port/rank-group placement,
    // state-entity-position.ts, resolveClusterComposite in
    // state-composite-pass.ts).
    // SvekNode#appendLabelHtmlSpecialForPort (EntityImageStateBorder
    // #getMaxWidthFromLabelForEntryExit): the entity's OWN display-text
    // width picks plaintext HTML port table (>40px) vs a plain small rect.
    const font: FontSpec = { family: ctx.theme.fontFamily, size: ctx.theme.fontSize };
    const labelWidth = ctx.measurer.measure(s.display, font).width;
    const node: DotInputNode = {
      id: s.id, width: BORDER_POINT_SIZE, height: BORDER_POINT_SIZE, isPort: true, shape: 'rect',
    };
    if (labelWidth > PORT_LABEL_WIDE_THRESHOLD) {
      node.shape = 'plaintext';
      node.portPad = Math.max(PORT_TABLE_PAD_FLOOR, labelWidth - PORT_LABEL_WIDE_THRESHOLD);
    }
    return node;
  }
  // G9 (SI28 findings/pseudo-state.md, bitaxo-18-tamo974) is deliberately
  // NOT threaded here yet: `GeneralImageBuilder.java:135-136` routes a real
  // LeafType.STATE leaf through `EntityImageStateEmptyDescription` (50x40)
  // when `hide empty description` is set, but a childless GROUP
  // (`state B {}`) short-circuits in `GroupMakerState.java:113-114` to a
  // plain `EntityImageState` (50x50). This port's AST discards "declared
  // with `{`" once children resolve to [] (`state-parse-state.ts#makeState`),
  // so this function cannot tell A from B; passing the flag would move
  // bitaxo's 10 px from A to B rather than remove it. Needs an
  // explicit-composite marker on `State` — SI29 decision-journal T2.
  const measured = measureState(s, false, ctx.theme, ctx.measurer, ctx.rankdir);
  return { id: s.id, width: measured.width, height: measured.height, shape: measured.shape };
}
