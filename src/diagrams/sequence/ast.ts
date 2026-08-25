/**
 * AST and Geometry type definitions for PlantUML sequence diagrams.
 */

import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ScaleSpec } from '../../core/scale-command.js';

// ---------------------------------------------------------------------------
// AST Types
// ---------------------------------------------------------------------------

export type ParticipantType =
  | 'participant'
  | 'actor'
  | 'boundary'
  | 'control'
  | 'entity'
  | 'database'
  | 'collections'
  | 'queue';

export interface Participant {
  id: string;
  display: string;
  type: ParticipantType;
  color?: string;
  order: number; // first-appearance order (0-based)
  /** Box group id this participant belongs to (from `box` / `end box`). */
  boxId?: string;
}

export type MessageStyle =
  | 'sync'
  | 'async'
  | 'reply'
  | 'replyAsync'
  | 'lost'
  | 'found';

export interface MessageEvent {
  kind: 'message';
  from: string; // participant id
  to: string; // participant id
  label: string;
  style: MessageStyle;
  activates?: string; // participant id to auto-activate (++ shorthand)
  deactivates?: string; // participant id to auto-deactivate (-- shorthand)
  sequenceNumber?: number;
  /** See `MessageGeo.sequenceLabel`'s doc comment — populated by
   *  `applyAutonumber` from `SequenceDiagramAST.autonumber`'s `prefix`/
   *  `format`. */
  sequenceLabel?: string;
  /**
   * T13 (mission dispatch-by-parse-attempt): the `o`/`x` arrow decorations
   * from `CommandArrow.java:99-116` (`ARROW_DRESSING1`/`ARROW_DRESSING2`),
   * scoped to the two literal forms the corpus bucket actually carries
   * (`->o`/`->x` at the head, `o->`/`x->` at the tail) rather than the full
   * dressing grammar (multi-char `<<`/`\\`/`//` async heads, inclination,
   * per-side `[style]` brackets — not ported; see T13's report). Fed into
   * `arrowConfigurationFor`'s override at render time.
   * @see sequencediagram/command/CommandArrow.java:229-235
   */
  headCircle?: boolean;
  tailCircle?: boolean;
  headCross?: boolean;
  tailCross?: boolean;
}

export interface NoteEvent {
  kind: 'note';
  position: 'left' | 'right' | 'over';
  participants: string[];
  text: string;
  color?: string;
  /**
   * `rnote`/`hnote` vs. plain `note` (`FactorySequenceNoteCommand.java:81`,
   * `NoteStyle.java`). This port draws both non-default shapes as a plain
   * rectangle (no folded corner) — the RECTANGLE/HEXAGON distinction upstream
   * makes between them is not carried further, a documented simplification
   * (T13, dispatch-by-parse-attempt) rather than a full hexagon-path port.
   */
  shape?: 'rect';
}

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
     *  as a one-branch, label-only frame; see `sequence-commands-2.ts`. */
    | 'ref';
  label: string;
  branches: SequenceEvent[][]; // alt has multiple; others have one
  /**
   * Condition text per branch, index-aligned with `branches`.
   * `branchLabels[0]` is the frame's own `label`; entries 1..n are the
   * `else <condition>` labels. Upstream draws each as a bracketed
   * `[condition]`, the first beside the frame's type tab and the rest beside
   * a dashed separator (`Displayable`/`GroupingTile`), which is why they must
   * survive parsing rather than collapse into `label`.
   */
  branchLabels: string[];
}

export interface ActivationEvent {
  kind: 'activate' | 'deactivate';
  participantId: string;
  color?: string;
}

export interface DividerEvent {
  kind: 'divider';
  text: string;
}

export interface DelayEvent {
  kind: 'delay';
  text?: string;
}

export interface SpaceEvent {
  kind: 'space';
  pixels: number;
}

export type SequenceEvent =
  | MessageEvent
  | NoteEvent
  | FrameEvent
  | ActivationEvent
  | DividerEvent
  | DelayEvent
  | SpaceEvent;

/**
 * A named group of participants enclosed by `box` / `end box`.
 * Rendered as a colored background rectangle in the diagram header zone.
 */
export interface BoxGroup {
  id: string;
  label: string;
  color: string;
  participantIds: string[];
}

export interface SequenceDiagramAST {
  participants: Participant[];
  events: SequenceEvent[];
  /**
   * `current`/`start` are `DottedNumber.incrementMinor`'s LAST segment only
   * (`DottedNumber.java:75-79`); `prefix` carries every segment before it
   * verbatim (e.g. `"1."` for a `1.1` start) so a dotted start renders as
   * `1.1`, `1.2`, `1.3`, … without this port modelling the full
   * multi-segment increment (`incrementIntermediate`, never called by the
   * message-numbering path — `AutoNumber.java:75-79`). `format`, when set,
   * is `CommandAutonumber.java`'s quoted FORMAT group, applied by
   * {@link import('./sequence-parse-helpers.js').formatAutonumber} — only
   * the `DecimalFormat` `0`-run (zero-pad) subset is honoured, not the full
   * `java.text.DecimalFormat` pattern language.
   * @see sequencediagram/command/CommandAutonumber.java:58-74
   */
  autonumber: {
    enabled: boolean;
    start: number;
    current: number;
    step: number;
    prefix: string;
    format?: string;
  };
  options: {
    hideFootbox: boolean;
    messageAlign: 'left' | 'center' | 'right';
    /** `hide unlinked` / `show unlinked` (`CommandHideUnlinked.java`) —
     *  participants not referenced by any event are dropped post-parse
     *  (`applyHideUnlinked`, `parser.ts`). */
    hideUnlinked?: boolean;
  };
  /** `scale ...` (`command/CommandScale*.java`, 6 forms via
   *  `CommonCommands#addCommonScaleCommands`) — resolved to a factor and
   *  applied by multiplying the GEOMETRY AND THEME at the layout→render
   *  boundary (`scale-geo.ts`), which is arithmetically what upstream's
   *  `SvgGraphics#format` does on the way out. No `transform` is emitted:
   *  jar-measured, `scale 2` doubles every coordinate, font size and the
   *  root dimensions, and emits zero transforms.
   *  @see scale-geo.ts
   *  @see scale-command.ts */
  scale?: ScaleSpec;
  /** Box groups declared with `box` / `end box`. */
  boxes: BoxGroup[];
  /**
   * title/caption/legend/header/footer/mainframe chrome, populated by
   * {@link matchAnnotationCommand} at the parser's command-dispatch position
   * (mission G0b, decisions.md D3). Optional (unlike `participants`/`events`)
   * so pre-existing hand-authored AST literal fixtures compile unchanged; a
   * real `parseSequence()` call always sets it via `createAnnotations()` —
   * `isEmpty()` distinguishes "no chrome present" from "not yet populated".
   */
  annotations?: DiagramAnnotations;
  /**
   * `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4),
   * populated by {@link matchSpriteCommand} at the SAME dispatch position
   * as {@link matchAnnotationCommand} (tried immediately after it, mirroring
   * upstream's `CommonCommands.addTitleCommands` then `addCommonCommands2`
   * registration order). Optional so hand-authored AST literal fixtures
   * compile unchanged; a real `parseSequence()` call always sets it via
   * `createSpriteRegistry()`.
   */
  sprites?: SpriteRegistry;
}

// ---------------------------------------------------------------------------
// Geometry Types (consumed by layout stage)
// ---------------------------------------------------------------------------

export interface ParticipantGeo {
  id: string;
  display: string;
  type: ParticipantType;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
}

export interface MessageGeo {
  kind: 'message';
  fromX: number;
  toX: number;
  y: number;
  label: string;
  style: MessageStyle;
  sequenceNumber?: number;
  /** `AutoNumber#getNextMessageNumber`'s formatted text
   *  (`DottedNumber#format`), when the source's `autonumber` carries a dotted
   *  start or a quoted `FORMAT`; the renderer prefers this over the bare
   *  `sequenceNumber` when present. */
  sequenceLabel?: string;
  arrowDirection: 'right' | 'left' | 'self';
  headCircle?: boolean;
  tailCircle?: boolean;
  headCross?: boolean;
  tailCross?: boolean;
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
  /** `else` branch boundaries: the y of each dashed separator and the
   *  bracketed condition drawn beside it. Empty for single-branch frames
   *  (`loop`, `opt`, `group`, …). */
  branchSeparators: { y: number; label: string }[];
  /**
   * A `ref over` frame's body, one entry per source line, each with its own
   * pre-centred `x`. Positioned HERE rather than with `text-anchor="middle"`
   * at render time because that is what the jar emits: its body lines carry a
   * computed `x` and no anchor (`x="74.3"` / `x="76.962"` for a box centred on
   * 108.7), and the anchor attribute would be one more attribute per line than
   * upstream has. Centring needs the measurer, which layout has and the
   * renderer does not. Empty for every other frame type.
   */
  refBody: { text: string; x: number }[];
}

export interface DividerGeo {
  kind: 'divider';
  text: string;
  y: number;
  totalWidth: number;
}

export interface SpaceGeo {
  kind: 'space';
  y: number;
  height: number;
}

export type EventGeo =
  | MessageGeo
  | NoteGeo
  | ActivationGeo
  | FrameGeo
  | DividerGeo
  | SpaceGeo;

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
