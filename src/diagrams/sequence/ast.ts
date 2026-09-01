/**
 * AST and Geometry type definitions for PlantUML sequence diagrams.
 */

import type { Paint } from '../../core/paint.js';
import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ScaleSpec } from '../../core/scale-command.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';

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
  /** The `<<...>>` run as written, guillemets included -- `CommandParticipant`
   *  stores it on the Participant rather than in its code
   *  (`CommandParticipant.java:174-181`). Rendered above the name unless
   *  `hide stereotype` is in force. */
  stereotype?: string;
}

/**
 * Which border an exo message crosses, and which way it points.
 * `isLeftBorder()` is `FROM_LEFT || TO_LEFT`, `isRightBorder()` is
 * `FROM_RIGHT || TO_RIGHT`, and `getDirection()` is `+1` for
 * `FROM_LEFT`/`TO_RIGHT`, `-1` for the other two.
 * @see sequencediagram/MessageExoType.java:38-64
 */
export type MessageExoType = 'FROM_LEFT' | 'TO_LEFT' | 'FROM_RIGHT' | 'TO_RIGHT';

/**
 * What `AbstractMessage` holds for every message kind, exo or not — upstream's
 * own split, with `Message` and `MessageExo` as its two subclasses.
 *
 * `parallel` and `anchor` are parsed, stored and NOT drawn (D4): every
 * upstream consumer of `isParallel()`/`getAnchor()` lives under
 * `sequencediagram/teoz/`, and the classic `sequencediagram/graphic/`
 * renderer reads neither. That is upstream's behavior, not a divergence.
 *
 * @see sequencediagram/AbstractMessage.java:81-121
 */
export interface AbstractMessageEvent {
  label: string;
  /** The whole arrow, as `CommandArrow.executeArg` builds it: a pair of
   *  `ArrowDressing`s plus a per-side `ArrowDecoration`, a dashed body and an
   *  inclination. Replaces the spike's flat six-value style enum, which
   *  could not carry the dressing grammar (D1). */
  arrow: ArrowConfiguration;
  sequenceNumber?: number;
  /** See `MessageGeo.sequenceLabel`'s doc comment — populated by
   *  `applyAutonumber` from `SequenceDiagramAST.autonumber`'s `prefix`/
   *  `format`. */
  sequenceLabel?: string;
  /** `[[http://example.com]]` — `UrlBuilder.OPTIONAL` at
   *  `CommandArrow.java:130`, applied at `:133-135`. */
  url?: string;
  /** The `<<...>>` run as written, guillemets included
   *  (`StereotypePattern.optional("STEREOTYPE")`, `CommandArrow.java:129`,
   *  applied at `:137-140`). */
  stereotype?: string;
  /** `LIFECOLOR` (`CommandArrow.java:128`) — the colour applied to the
   *  activation bar this message starts, NOT to the arrow (`:427-430`). */
  lifeColor?: string;
  /** The leading `&` PARALLEL marker (`CommandArrow.java:90`,
   *  `msg.goParallel()` at `:143-145`). Stored, not drawn — see this
   *  interface's doc comment. */
  parallel?: boolean;
  /** `{name}` (`CommandArrow.java:417`). Stored, not drawn. */
  anchor?: string;
}

export interface MessageEvent extends AbstractMessageEvent {
  kind: 'message';
  from: string; // participant id
  to: string; // participant id
  activates?: string; // participant id to auto-activate (++ shorthand)
  deactivates?: string; // participant id to auto-deactivate (-- shorthand)
  /** The extra targets of `A -> B, C, D : msg` — `getMulticasts`
   *  (`CommandArrow.java:139-155`), `msg.setMulticast(...)` at `:404`. */
  multicast?: readonly string[];
}

/**
 * `MessageExo` — a message with ONE participant, whose other end is the
 * diagram border (`[-> Bob`, `Bob ->]`, …). Its own `SequenceEvent` member
 * rather than a `MessageEvent` with `from === to`, because `isSelfMessage()`
 * returns FALSE despite `getParticipant1() == getParticipant2()`
 * (`:72-86,99-101`) — every "not a self message" guard would otherwise skip
 * it silently (D3).
 * @see sequencediagram/MessageExo.java:43-101
 */
export interface MessageExoEvent extends AbstractMessageEvent {
  kind: 'messageExo';
  /** `MessageExo.getParticipant()` (`:82-84`) — the single endpoint. */
  participant: string;
  exoType: MessageExoType;
  /** `MessageExo.isShortArrow()` (`:57-59`) — the short forms, which size
   *  themselves from `getPreferredWidth` instead of reaching the border. */
  shortArrow: boolean;
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
  /** The note keyword as written. `NoteStyle.getNoteStyle` maps `hnote` to
   *  HEXAGONAL, `rnote` to BOX and anything else to NORMAL
   *  (`NoteStyle.java:46-54`); the keyword is kept rather than the resolved
   *  enum so the style-signature lookup (`:70-78`) can be driven from it.
   *  Distinct from {@link NoteEvent.shape}, which is what this port DRAWS. */
  style?: 'note' | 'hnote' | 'rnote';
  /** The leading `/` VMERGE marker (`FactorySequenceNoteCommand.java:79,96`)
   *  — upstream's `tryMerge` argument to `diagram.addNote(note, tryMerge)`
   *  (`:230,252`): merge this note vertically with the previous one. */
  vmerge?: boolean;
  /** The `&` PARALLEL marker (`FactorySequenceNoteCommand.java:231,249-251`,
   *  `note.goParallel()`). Stored, not drawn — see
   *  {@link AbstractMessageEvent}'s doc comment and D4. */
  parallel?: boolean;
  /** The `<<...>>` run as written, guillemets included — upstream's
   *  `STEREO` group, `note.setStereotype(...)` at
   *  `FactorySequenceNoteCommand.java:234-241`. */
  stereotype?: string;
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
     *  as a one-branch, label-only frame; see `command-misc.ts`. */
    | 'ref';
  label: string;
  branches: SequenceEvent[][]; // alt has multiple; others have one
  /** Condition text per branch, index-aligned with `branches`: entry 0 is
   *  the frame's own `label`, 1..n are `else <condition>` labels, drawn
   *  bracketed beside the tab (0) or a dashed separator (1..n,
   *  `Displayable`/`GroupingTile`) — why they survive parsing separately. */
  branchLabels: string[];
  /** The `&` PARALLEL marker on a grouping line
   *  (`CommandGrouping.java`, `GroupingTile.java:145,864` under `teoz/`).
   *  Stored, not drawn — see {@link AbstractMessageEvent} and D4. */
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

/**
 * `newpage [label]` — `Newpage` (`sequencediagram/Newpage.java:44-63`), an
 * ordinary `Event`: `SequenceDiagram#newpage` appends one to the same
 * `events` list a message goes into (`:243-250`). It is NOT a marker the
 * parser consumes — the page split is a LAYOUT fact, because the split
 * position is the y its tile lands on.
 */
export interface NewpageEvent {
  kind: 'newpage';
  /** `CommandNewpage`'s optional `LABEL` group, already through
   *  `Display.getWithNewlines` (`:80-92`) — hence a line ARRAY, not a raw
   *  string, matching `DisplayPositioned.display`.
   *
   *  Upstream files it as the TITLE of the page this command STARTS:
   *  `titles.add(title)` (`SequenceDiagram.java:247`), read back by
   *  `getTitle(index)` as `titles.get(index - 1)` (`:111-115`) and
   *  substituted by `TitledDiagram#addChrome` for `index > 0` (`:469-476`).
   *  So page 0 keeps the diagram's own title and page k takes the k-th
   *  newpage's. Absent when the command carried none, which is upstream's
   *  `Display.NULL` and draws no title at all. */
  title?: readonly string[];
}

export type SequenceEvent =
  | MessageEvent
  | MessageExoEvent
  | NoteEvent
  | FrameEvent
  | ActivationEvent
  | DividerEvent
  | DelayEvent
  | SpaceEvent
  | NewpageEvent;

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
    /** `autoactivate on|off` (`CommandAutoactivate`, `SequenceDiagram
     *  #setAutoactivate:556-563`). While on, an arrow that carries NO
     *  explicit `++`/`--`/`!` suffix gets one implicitly: a solid arrow
     *  activates its RECEIVER, a dotted one deactivates its SENDER, and only
     *  for a `NORMAL` or `ASYNC` head (`CommandArrow.java:435-439`,
     *  `CommandExoArrowAny.java:174-180`). Positional like
     *  {@link ignoreNewpage} — it governs the arrows that follow it. */
    autoactivate?: boolean;
    /** `ignorenewpage` (`CommandIgnoreNewpage`) — once issued, every LATER
     *  `newpage` is dropped on the floor: `SequenceDiagram#newpage` returns
     *  before touching `titles`/`events`/`countNewpage`
     *  (`SequenceDiagram.java:243-250,252-257`). Read by `newpageCommand`
     *  during the parse walk, not post-parse, because the suppression is
     *  positional. */
    ignoreNewpage?: boolean;
    /** `hide stereotype` -- registered for sequence diagrams too, via
     *  `SequenceDiagramFactory:100` -> `CommonCommands#addCommonCommands1`
     *  -> `addCommonHides` (`CommonCommands.java:103-106`) ->
     *  `CommandHideShowByGender` (`:195`). Suppresses the participant
     *  stereotype run; the jar's goldens confirm it both ways
     *  (secida-27-jaco323 hides, birocu-87-xubi808 shows `«APIGateway»`). */
    hideStereotype?: boolean;
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

import type { TextRun } from './text-block-geo.js';
export type { TextRun };

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
