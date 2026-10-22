/**
 * Frame (grouping / `ref`) event of the sequence AST. Split out of `ast.ts`
 * (pure move, mission sdd2 T0d); `ast.ts` re-exports it, so no import site
 * changed.
 *
 * @see sequencediagram/Grouping.java:47
 * @see sequencediagram/GroupingStart.java:48
 */

import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import type { SequenceEvent } from './ast.js';

export interface FrameEvent {
  kind: 'frame';
  frameType:
    | 'loop'
    | 'alt'
    | 'opt'
    | 'par'
    | 'par2'
    | 'break'
    | 'critical'
    | 'group'
    /** `ref over A, B : text` (`CommandReferenceOverSeveral.java`) — modelled
     *  as a one-branch, label-only frame; see `command-misc.ts`. */
    | 'ref';
  label: string;
  /** The header title `CommandGrouping` rewrote a `group T [c]` line to:
   *  `type = m.group(1)` (`CommandGrouping.java:143-148`), kept verbatim (its
   *  space before the bracket included, possibly empty). Absent where the
   *  title is the keyword itself -- every other line -- which `GroupingTile`
   *  reads as `getTitle()` (`GroupingTile.java:126-127`). */
  title?: string;
  branches: SequenceEvent[][]; // alt has multiple; others have one
  /** Condition text per branch, index-aligned with `branches`: entry 0 is
   *  the frame's own `label`, 1..n are `else <condition>` labels, drawn
   *  bracketed beside the tab (0) or a dashed separator (1..n,
   *  `Displayable`/`GroupingTile`) — why they survive parsing separately. */
  branchLabels: string[];
  /** The `&` PARALLEL marker on a grouping line
   *  (`CommandGrouping.java`, `GroupingTile.java:145,864` under `teoz/`).
   *  Read by teoz -- the group starts at the previous tile's min and its max
   *  dominates the previous one's (`GroupingTile.java:145-154,229-236`) --
   *  but not yet laid out here: `sequence-layout-frame.ts` chains every group
   *  below the previous tile. */
  parallel?: boolean;
  /** `COLORS` 0/1, raw, resolved late — see `frame-style.ts`.
   *  @see CommandGrouping.java:134-135 */
  backColorElement?: string;
  backColorGeneral?: string;
  /** Per-branch `else #color` background, raw and resolved late (same rule
   *  as {@link backColorGeneral} above) — index-aligned with
   *  {@link branchLabels}: entry 0 is the frame's own COLORS-index-1 value
   *  (mirrors `backColorGeneral`, kept separately since a bare `group`/`alt`
   *  line and its first branch are the same COLORS capture), 1..n are each
   *  `else`'s own captured color, or `undefined` where none was given.
   *  `Blotter#getBackColorGeneral` falls back to the group color when a
   *  band has none (`GroupingTile.java:326-332`) — `sequence-layout-events
   *  .ts#handleFrameEvent` carries this array onto `FrameGeo
   *  .branchSeparators` for `renderer-frame-blotter.ts` to read (D10). */
  branchColors?: (string | undefined)[];
  /** A `ref`'s own participants, as written (`Reference.java:104-106`,
   *  `CommandReferenceOverSeveral.java:67-82`): `ReferenceTile#init` spans
   *  their boxes (`teoz/ReferenceTile.java:96-115`). Absent for a group. */
  participants?: string[];
  /** The builder current at the opener: `GroupingStart`
   *  (`SequenceDiagram.java:427-428`) or `Reference`
   *  (`CommandReferenceOverSeveral.java:140-141`,
   *  `CommandReferenceMultilinesOverSeveral.java:152-153`, captured at the
   *  multi-line opener). sdd1 D2. */
  readonly styleBuilder: StyleBuilder;
  /** Per-branch builder, index-aligned with {@link branchLabels}: entry 0 is
   *  {@link styleBuilder}, 1..n each `else`'s own `GroupingLeaf` builder
   *  (`SequenceDiagram.java:431-432`), read by `ElseTile.java:98`. The `end`
   *  leaf's builder is not kept: `GroupingTile.java:162` reads only its
   *  type. sdd1 D2. */
  branchStyleBuilders: StyleBuilder[];
}
