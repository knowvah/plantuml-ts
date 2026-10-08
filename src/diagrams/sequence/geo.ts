/**
 * GEOMETRY for PlantUML sequence diagrams — the output of the layout stage and
 * the sole input of the renderer.
 *
 * Split out of `ast.ts` when that file passed this repo's 500-line cap
 * (mission `sequence-text-and-y-convergence`, batch 1), then split again along
 * renderer lines (D8) so that each Phase A task owns exactly one geometry
 * module and no two contend on one file:
 *
 * | module | pairs with | Phase A owner |
 * |---|---|---|
 * | `geo-participant.ts` | `renderer-participant-shapes.ts` | A3 |
 * | `geo-message.ts`     | `renderer-message.ts`            | A2 |
 * | `geo-frame.ts`       | `renderer-frame-header.ts`       | A4 |
 * | `geo-annotation.ts`  | `renderer.ts` itself             | A5 |
 *
 * What stays HERE is the part no single renderer owns: the {@link EventGeo}
 * union over four of those modules, and {@link SequenceGeometry}, the whole
 * document. Both are aggregates, so neither belongs to a task.
 *
 * This module re-exports all four, and `ast.ts` re-exports this module, so
 * every pre-existing `from './ast.js'` import still resolves both stages and
 * no import site had to change through either split. The modules reference
 * each other — `geo-participant.ts` needs {@link ParticipantType} from
 * `ast.ts` — but every edge in every direction is `import type` / `export
 * type`, which TypeScript erases entirely. There is no runtime cycle, and
 * therefore none of the temporal-dead-zone hazard a VALUE cycle carries
 * (`.agent-notes/si20-object-election-text-and-import-cycle.md`).
 *
 * The AST and geometry stages are genuinely different vocabularies: an AST
 * type describes what the SOURCE said, a geometry type describes where the jar
 * PUTS it. Only `layout.ts` reads both.
 */

import type { ScaleSpec } from '../../core/scale-command.js';
import type { TextRun } from './text-block-geo.js';
import type { ParticipantGeo } from './geo-participant.js';
import type { MessageGeo, ActivationGeo } from './geo-message.js';
import type { FrameGeo } from './geo-frame.js';
import type { NoteGeo, DividerGeo, SpaceGeo, NewpageGeo, BoxGeo, DelayGeo, LifelineSegment } from './geo-annotation.js';

export type { TextRun };
export type * from './geo-participant.js';
export type * from './geo-message.js';
export type * from './geo-frame.js';
export type * from './geo-annotation.js';

export type EventGeo = MessageGeo | NoteGeo | ActivationGeo | FrameGeo | DividerGeo | SpaceGeo | NewpageGeo | DelayGeo;

export interface SequenceGeometry {
  totalWidth: number;
  totalHeight: number;
  participants: ParticipantGeo[];
  events: EventGeo[];
  /**
   * `LivingSpaces#getHeadHeight(stringBounder)` — the height of the
   * participant head row, which is where this port's body geometry starts
   * (upstream's body starts at 0 and the heads are drawn above it, un-
   * translated). `PlayingSpaceWithParticipants#drawU` reads it three times:
   * to translate the body, to place the footbox row, and to size the image
   * (`:213,217,225`, `:80-86`). Equal to `max(p.y + p.height + headSlack)`
   * over the participants — their reserved AREAS are bottom-aligned in this
   * row, which is upstream's `VerticalAlignment.BOTTOM` at `:224`, and a
   * plain participant's area is one pixel taller than its painted box
   * (`sequence-layout-participants.ts#headSlackOf`) — but stored rather than
   * re-derived
   * because the page transform is the one reader that must not disagree with
   * layout about where the body begins.
   */
  headHeight: number;
  /**
   * Where every lifeline (and its hover rect) stops. Upstream draws the
   * lifelines over the WHOLE diagram (`livingSpaces.drawLifeLines(ugBody,
   * fullHeight, context)`, `PlayingSpaceWithParticipants.java:221`) and lets
   * the page's `UClip` trim them (`:213-216`), so on a `newpage` page this is
   * the clip's bottom edge, `pageHeight + 1` below the page top, and NOT the
   * footbox row's top -- see `footerShapeY`.
   */
  lifelineEndY: number;
  /**
   * The lifeline cut at every delay (`MutingLine#drawLine`), present only
   * when the diagram has a delay. Absent means one `PARTICIPANT_LINE` from
   * `headHeight` to `lifelineEndY`.
   */
  lifelineSegments?: readonly LifelineSegment[];
  /**
   * The top of the footbox row: `UTranslate.dy(pageHeight + headHeight)`
   * (`PlayingSpaceWithParticipants.java:225-226`). Equal to `lifelineEndY`
   * except on a `newpage` page that is not the last, where the clip's `+ 1`
   * leaves the lifelines one pixel BELOW it.
   */
  footerShapeY: number;
  /** Background rectangles for box groups (rendered at z=0, behind lifelines). */
  boxes: BoxGeo[];
  /**
   * `SequenceDiagram#isShowFootbox` (`SequenceDiagram.java:474-486`), resolved
   * ONCE at layout so the renderer cannot disagree with the height that was
   * reserved. False suppresses the footer participant row entirely — the jar
   * reserves no space for it either.
   */
  showFootbox: boolean;
  /** Passthrough of `SequenceDiagramAST.scale` — resolved to a factor and
   *  applied at `renderSequence` (see that field's doc comment). */
  scale?: ScaleSpec;
}
