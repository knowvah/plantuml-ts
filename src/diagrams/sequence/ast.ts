/**
 * AST type definitions for PlantUML sequence diagrams — the output of the
 * parse stage.
 *
 * The GEOMETRY types that used to sit below these now live in `./geo.ts`,
 * moved when this file passed the repo's 500-line cap (mission
 * `sequence-text-and-y-convergence`, batch 1) at the `Geometry Types
 * (consumed by layout stage)` banner that already marked the seam. They are
 * re-exported below, so `from './ast.js'` still resolves both halves and no
 * import site changed.
 */

import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ParticipantUrl } from './sequence-parse-helpers.js';
export type { ParticipantUrl };
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
  /**
   * The participant's own `[[url{tooltip}]]`, resolved (B3).
   *
   * `LivingSpace#drawHeadOrTail:205-212` wraps the head component in
   * `ug.startUrl(url)` / `ug.closeUrl()`, so the jar emits an `<a>` around the
   * whole head — label and glyph both. This is NOT the message-level url on
   * {@link AbstractMessageEvent.url}, which the jar parses and never draws.
   */
  url?: ParticipantUrl;
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
// Geometry types
// ---------------------------------------------------------------------------

/**
 * The layout stage's own vocabulary, re-exported verbatim from `./geo.ts`.
 *
 * `export type *` rather than a hand-maintained name list: the two halves were
 * one file until batch 1 of `sequence-text-and-y-convergence`, so anything a
 * caller could previously reach through `./ast.js` must still be reachable
 * through it, including types added to `geo.ts` later. A name list would
 * silently stop re-exporting the next one.
 */
export type * from './geo.js';
