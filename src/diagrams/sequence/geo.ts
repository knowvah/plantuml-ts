/**
 * GEOMETRY types for PlantUML sequence diagrams — the output of the layout
 * stage and the sole input of the renderer.
 *
 * Split out of `ast.ts` when that file passed this repo's 500-line cap
 * (mission `sequence-text-and-y-convergence`, batch 1). The seam is the one
 * `ast.ts` already marked with a `Geometry Types (consumed by layout stage)`
 * banner, so this is a pure move: every type keeps its name, its fields and
 * its doc comment.
 *
 * `ast.ts` re-exports this module in full, so no import site had to change and
 * `from './ast.js'` keeps working for both halves. The two modules reference
 * each other — `geo.ts` needs {@link ParticipantType} for
 * {@link ParticipantGeo.type} — but every edge in both directions is
 * `import type` / `export type`, which TypeScript erases entirely. There is no
 * runtime cycle, and therefore none of the temporal-dead-zone hazard a VALUE
 * cycle carries (`.agent-notes/si20-object-election-text-and-import-cycle.md`).
 *
 * The two stages are genuinely different vocabularies: an AST type describes
 * what the SOURCE said, a geometry type describes where the jar PUTS it. Only
 * `layout.ts` reads both.
 */

import type { Paint } from '../../core/paint.js';
import type { ScaleSpec } from '../../core/scale-command.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import type { MessageExoType, ParticipantType } from './ast.js';
import type { TextRun } from './text-block-geo.js';

export type { TextRun };

/**
 * A participant's stereotype BADGE, in `StereotypeDecoration`'s two forms.
 *
 * `Display#createStereotype` picks between them on `stereotype.isSpotted()`:
 * a `CircledCharacter` for `<<(C,#color) Label>>`, otherwise the sprite from
 * `stereotype.getSprite(...)` (`Display.java:671-689`). Both occupy a box the
 * name block is pushed right of, so both carry `width`/`height`.
 */
export type ParticipantBadge =
  | { readonly kind: 'sprite'; readonly dataUri: string; readonly width: number; readonly height: number }
  /** The jar draws the circle and NOT the character: across
   *  `nimoxu-60-xale291`, `fakova-98-suze610` and `xakuro-97-tado489` no
   *  `<text>` carries the declared letter, only a filled `<ellipse>`. */
  | { readonly kind: 'char'; readonly color: string | undefined; readonly width: number; readonly height: number };

export interface ParticipantGeo {
  id: string;
  display: string;
  type: ParticipantType;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  /** Displayed form of {@link Participant.stereotype}: one guillemet-wrapped
   *  entry per `<<...>>` chunk, badge specs already stripped
   *  (`core/stereotype-decoration.ts`). Absent when there is none, when every
   *  chunk is invisible, or when the style hides it. */
  stereotypeLines?: readonly string[];
  /**
   * The box's resolved fill and stroke.
   *
   * `Participant#getUsedStyles` merges the kind's style signature -- `root,
   * element, sequenceDiagram, <kind>` for every kind
   * (`ParticipantType.java:55-80`) -- and then lets the participant's OWN
   * colours override it (`eventuallyOverride(getColors())`, `:88`). So the
   * precedence is inline `#color` > `<style> <kind> {}` bucket > theme
   * default, resolved in layout so the sprite badge's gradient can start
   * from the same value the box is painted with.
   */
  background: Paint;
  border: Paint;
  /** The rasterised sprite badge a `<<($name) Label>>` stereotype declares,
   *  drawn LEFT of the name block (`TextBlockSprited.java:65-77`). Absent
   *  when there is none, or when the name does not resolve in the registry. */
  badge?: ParticipantBadge;
}

export interface MessageGeo {
  kind: 'message';
  fromX: number;
  toX: number;
  y: number;
  label: string;
  /** The message's `ArrowConfiguration`, carried through from
   *  {@link AbstractMessageEvent.arrow} unchanged — it is drawing vocabulary,
   *  not geometry, so `scaleSequenceGeometry` passes it through untouched. */
  arrow: ArrowConfiguration;
  sequenceNumber?: number;
  /** `AutoNumber#getNextMessageNumber`'s formatted text
   *  (`DottedNumber#format`), when the source's `autonumber` carries a dotted
   *  start or a quoted `FORMAT`; the renderer prefers this over the bare
   *  `sequenceNumber` when present. */
  sequenceLabel?: string;
  /**
   * The label as PLACED text: one entry per source line, each with its own
   * `x`/`y`. Positioned in layout rather than at render time for the same
   * reason `FrameGeo.refBody` is -- the jar emits a computed `x` and no
   * `text-anchor`, and computing one needs the measurer. Empty when the
   * message has no label: `AbstractTextualComponent` maps an empty display to
   * a `TextBlockEmpty`, which draws nothing
   * (`AbstractTextualComponent.java:84-85`).
   */
  labelLines: readonly TextRun[];
  /** The autonumber, when present -- its OWN `<text>` beside the label lines,
   *  vertically centred against them, with no `": "` joining the two
   *  (`Display.java:703-712`). */
  labelNumber?: TextRun;
  arrowDirection: 'right' | 'left' | 'self';
  /** {@link AbstractMessageEvent.url}, carried to the renderer. */
  url?: string;
  /** {@link AbstractMessageEvent.stereotype}, carried to the renderer. */
  stereotype?: string;
  /** {@link AbstractMessageEvent.lifeColor}, carried to the renderer. */
  lifeColor?: string;
  /** Exo geometry only: `MessageExoArrow` anchors one end at the border this
   *  type names (`isLeftBorder`/`isRightBorder`), which the renderer cannot
   *  re-derive from `fromX`/`toX`. */
  exoType?: MessageExoType;
  /** {@link MessageExoEvent.shortArrow}, likewise exo-only. */
  shortArrow?: boolean;
  /**
   * SELF messages only: the x the RETURNING (lower) horizontal segment
   * starts at, where {@link fromX} is the OUTGOING (upper) one's.
   *
   * The two differ. `ComponentRoseSelfArrow#drawRightSide` opens with
   * ```java
   * double x1 = area.getDeltaX1() < 0 ? area.getDeltaX1() : 0;
   * double x2 = area.getDeltaX1() > 0 ? -area.getDeltaX1() : 1;
   * ```
   * (`:92-93`) — so even with no live participant at all the returning
   * segment starts ONE pixel right of the outgoing one, and when the message
   * opens or closes an activation the two split by a whole
   * `LIVE_DELTA_SIZE`. Jar-verified on `jobadi-87-jegi648`
   * (`34.469`/`35.469`, the bare +1) and `gesiba-07-rise357`
   * (`60.044`/`66.044`, a `B -> B ++` straddling its own new bar).
   *
   * Absent on every non-self message.
   */
  selfReturnX?: number;
}

export interface NoteGeo {
  kind: 'note';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color?: string;
  shape?: 'rect';
}

export interface ActivationGeo {
  kind: 'activation';
  participantId: string;
  lifelineX: number;
  y: number;
  height: number;
  /**
   * How deeply this bar is nested, 1-based — upstream's `Step#getIndent`,
   * the value `LiveBoxes#drawBoxes` loops `for (int i = 1; i <= max; i++)`
   * over (`:342-346`). A COUNT, not a length: it is what the renderer
   * multiplies the half-width by, so it must not be scaled.
   *
   * `drawOneLevel` offsets each level by
   * `(levelToDraw - 1) * drawer.getWidth() / 2` (`:365-368`) — derived from
   * the box's own width, which is why the renderer computes it from
   * `ACTIVATION_HALF_WIDTH` rather than from a separate 5.
   */
  level: number;
  color?: string;
}

export interface FrameGeo {
  kind: 'frame';
  frameType: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** `COLORS` 0/1, raw, resolved late — see `FrameEvent` above. */
  backColorElement?: string;
  backColorGeneral?: string;
  /** `else` branch boundaries: y + bracketed condition. Each MAY carry its
   *  own resolved BODY-band fill. Empty for single-branch frames. */
  branchSeparators: { y: number; label: string; backColorGeneral?: string }[];
  /** `ref over` body lines, pre-centred `x` (needs the measurer, layout-only,
   *  same rationale as `x`/`y` above). Empty for every other frame type. */
  refBody: { text: string; x: number }[];
  /**
   * The header tab did not survive the page clip, so it is not drawn.
   *
   * Set ONLY by `sequence-page.ts`, and only when a frame straddles a
   * `newpage` boundary such that its body rectangle is still (partly) on
   * this page but its top is not. The tab is a `UPath` (all-or-nothing on
   * its bbox corners, `DriverPathSvg:58-60`) while the body it hangs off is
   * a `URectangle` (clamped, `DriverRectangleSvg:66-74`) -- the one place
   * upstream's per-shape rules genuinely disagree within one kind. Absent
   * on every un-paginated geometry.
   */
  headerClipped?: boolean;
  /** Header Display, resolved in LAYOUT (no measurer at render time).
   *  @see GroupingTile.java:126-127, `frame-style.ts#groupingHeaderDisplay` */
  tabText: string;
  tabComment?: string;
  tabTextWidth: number;
  tabWidth: number;
  tabHeight: number;
}

export interface DividerGeo {
  kind: 'divider';
  text: string;
  /** `text` split on `\n` (`Display.getWithNewlines`). The empty `====` form
   *  is `['']`, which still occupies one line box upstream. */
  lines: readonly string[];
  /** The tile's TOP, as with every other geo here — not the band's own y,
   *  which sits at `y + height / 2` (`ComponentRoseDivider.java:68,79`). */
  y: number;
  /** The band's span: `[border1, border2]`, not `[0, totalWidth]`. */
  bandX: number;
  bandWidth: number;
  /** `#getPreferredHeight` (`:127-129`). */
  height: number;
  /** `AbstractTextualComponent#getTextWidth`/`#getTextHeight` — the text
   *  block plus the component's `topRightBottomLeft(4, 4, 4, 4)`. */
  textWidth: number;
  textHeight: number;
}
// Every field above is resolved in LAYOUT and only read by the renderer; see
// `divider-style.ts` for each one's derivation and the jar measurements
// behind it. That split is the point -- a divider's drawn box and the space
// reserved for it must come from one measurement, which is the defect class
// `planning/sizer-renderer-parity.md` names.

export interface SpaceGeo {
  kind: 'space';
  y: number;
  height: number;
}

/**
 * `NewpageTile` (`teoz/NewpageTile.java`) — the page boundary, as laid out.
 *
 * It is a tile like any other: it occupies vertical space, the tiles after it
 * stack below it, and `PlayingSpace#yNewPages` reads back each one's
 * `getYGauge().getMin()` to build the page list (`:338-345`). Carrying it as
 * an `EventGeo` rather than as a bare number on {@link SequenceGeometry} is
 * what makes that true here too: the y comes out of the same cursor walk
 * every other tile's does, including inside a `group`/`alt` branch, which is
 * the recursion `PlayingSpace#getNewpageTiles` performs through
 * `GroupingTile#addNewpageTiles` (`:326-336`).
 */
export interface NewpageGeo {
  kind: 'newpage';
  /** The tile's TOP — `getYGauge().getMin()`, the value `yNewPages`
   *  collects. The separator itself is drawn `MARGINY` (10) below it. */
  y: number;
  /** `NewpageTile#getPreferredHeight` — `ComponentRoseNewpage
   *  #getPreferredHeight`'s `1` plus `2 * MARGINY`
   *  (`NewpageTile.java:50,94-96`, `ComponentRoseNewpage.java:68-71`), so
   *  21. This is why page k extends 21px past the newpage's own y and the
   *  separator belongs to both adjacent pages. */
  height: number;
  /** The separator's span: `[border1, border2]`, back-filled once
   *  `totalWidth` is known, exactly as {@link DividerGeo.bandX} is.
   *  `NewpageTile#drawU` translates by `border1` and hands the component an
   *  `Area` of `border2 - border1 - xOrigin` (`:83-90`). */
  bandX: number;
  bandWidth: number;
}

export type EventGeo =
  | MessageGeo
  | NoteGeo
  | ActivationGeo
  | FrameGeo
  | DividerGeo
  | SpaceGeo
  | NewpageGeo;

/**
 * Geometry for a single box group background rectangle.
 * Spans from y=0 to totalHeight, covering all participant columns in the group.
 */
export interface BoxGeo {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
}

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
  lifelineEndY: number;
  /** Y where non-rectangular footer shapes (actor, database) start.
   *  Equals lifelineEndY + label-zone height so the label appears above the shape. */
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
