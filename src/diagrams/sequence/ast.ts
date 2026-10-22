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
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import type { MessageEvent, MessageExoEvent } from './ast-message.js';
import type { NoteEvent } from './ast-note.js';
import type { FrameEvent } from './ast-frame.js';

export type { MessageExoType, AbstractMessageEvent, MessageEvent, MessageExoEvent } from './ast-message.js';
export type { NoteShape, NoteEvent } from './ast-note.js';
export type { FrameEvent } from './ast-frame.js';

// ---------------------------------------------------------------------------
// AST Types
// ---------------------------------------------------------------------------

export type ParticipantType =
  'participant' | 'actor' | 'boundary' | 'control' | 'entity' | 'database' | 'collections' | 'queue';

export interface Participant {
  id: string;
  display: string;
  type: ParticipantType;
  color?: string;
  order: number; // first-appearance order (0-based)
  /** The declared `order N` (`Participant#getOrder`, `CommandParticipant
   *  .java:154-155`); absent = 0. {@link order} stays the resulting list index. */
  declaredOrder?: number;
  /** The INNERMOST box open when this participant was created -- upstream's
   *  `participantEnglobers2.put(p, participantEnglober)`
   *  (`SequenceDiagram.java:132,174`). Its ancestors are reached through
   *  {@link BoxGroup.parentId}, the way `Dolls` walks `getGenealogy()`. */
  boxId?: string;
  /** The `<<...>>` run as written, guillemets included -- `CommandParticipant`
   *  stores it on the Participant rather than in its code
   *  (`CommandParticipant.java:174-181`). Rendered above the name unless
   *  {@link stereotypeHidden}; merged into the style either way. */
  stereotype?: string;
  /** `hiddenPortions.contains(EntityPortion.STEREOTYPE)`: `hide stereotype`
   *  drops the stereotype from `getDisplay` only (`Participant.java:125-135`);
   *  `getUsedStyles` still merges it (`:82-91`). */
  stereotypeHidden?: boolean;
  /**
   * The participant's own `[[url{tooltip}]]`, resolved (B3).
   *
   * `LivingSpace#drawHeadOrTail:205-212` wraps the head component in
   * `ug.startUrl(url)` / `ug.closeUrl()`, so the jar emits an `<a>` around the
   * whole head — label and glyph both. This is NOT the message-level url on
   * {@link AbstractMessageEvent.url}, which the jar parses and never draws.
   */
  url?: ParticipantUrl;
  /** The builder current at the participant's creation, explicit or implicit
   *  (`SequenceDiagram.java:129-130,171-172`); merged at use time
   *  (`Participant.java:82-91`). sdd1 D2. */
  readonly styleBuilder: StyleBuilder;
}

export interface ActivationEvent {
  kind: 'activate' | 'deactivate';
  participantId: string;
  color?: string;
  /**
   * `LifeEventType.DESTROY` (`CommandActivate.java:63-65`), which this port
   * otherwise widens into a plain `deactivate`.
   *
   * It is kept because the two reserve different heights. A destroy that
   * upstream could not bind to a message —
   * `LifeEventTile#isDestroyWithoutMessage:124-126` — reserves the cross's own
   * `crossSize * 2` = 18 (`:132-136`, `ComponentRoseDestroy:57,68-70`); every
   * other life event reserves 0 (`:137`). The cross, and where the lifeline
   * stops, are `sequence-layout-life-event.ts`'s.
   */
  destroy?: true;
  /** `LifeEvent`'s builder (`SequenceDiagram.java:371-372`), read per
   *  segment by `LifeLine.java:235-240`. sdd1 D2. */
  readonly styleBuilder: StyleBuilder;
}

export interface DividerEvent {
  kind: 'divider';
  text: string;
  /** Merged in the constructor (`SequenceDiagram.java:270`,
   *  `Divider.java:59-61`). sdd1 D2. */
  readonly styleBuilder: StyleBuilder;
}

export interface DelayEvent {
  kind: 'delay';
  text?: string;
  /** Merged in the constructor (`SequenceDiagram.java:289`,
   *  `Delay.java:59-61`). sdd1 D2. */
  readonly styleBuilder: StyleBuilder;
}

/** `HSpace` takes no builder (`HSpace.java:42`), so this event carries none. */
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
  /** `new Newpage(getCurrentStyleBuilder())` (`SequenceDiagram.java:248`,
   *  `Newpage.java:56`). sdd1 D2. */
  readonly styleBuilder: StyleBuilder;
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
  /** The enclosing box, when this one was opened inside another:
   *  `ParticipantEnglober#newChild` (`SequenceDiagram.java:502-507`,
   *  `ParticipantEnglober.java:62-64`). Absent for a root box. */
  parentId?: string;
  /** The `<<...>>` run as written, guillemets included: `CommandBoxStart`'s
   *  STEREO group (`CommandBoxStart.java:75,119-123`), held by the
   *  `ParticipantEnglober` and merged by `Doll#getUsedStyles`
   *  (`Doll.java:107-114`). */
  stereotype?: string;
  /**
   * The builder a `Doll` reads: `tileArguments.getSkinParam()
   * .getCurrentStyleBuilder()` at TILE time (`Doll.java:81-83`, built by
   * `Dolls.java:68-70`), i.e. after every command has executed — not the
   * builder current at the `box` line (`ParticipantEnglober` holds none,
   * `ParticipantEnglober.java:59-63`). A getter over the parse's style
   * dispatch, read after the parse completes. sdd1 D2.
   */
  readonly styleBuilder: StyleBuilder;
  /**
   * The raw `boxPadding` skinparam a `Doll` reads, `tileArguments
   * .getSkinParam().getPaddingTOBEREMOVED(PaddingParam.BOX)` (`Doll.java
   * :271-273`), i.e. `SkinParam#getValue("boxPadding")` (`SkinParam.java
   * :1153-1164`, `PaddingParam.java:43-45`) at TILE time; `null` when never
   * declared. A getter over the parse's legacy `params`, read after the parse
   * completes, like {@link styleBuilder}. Optional so hand-built AST literals
   * compile unchanged; absent reads as never declared.
   */
  readonly boxPadding?: string | null;
}

/**
 * `{a1} <-> {a2} : label` (`CommandLinkAnchor.java:55-63,85-90`): not an
 * event but an entry of `SequenceDiagram#linkAnchors`
 * (`SequenceDiagram.java:617-626`), drawn after every tile by
 * `PlayingSpace#drawUInternal:129-134`. `message` is the optional `:` text
 * as written (`RegexLeaf(1, "MESSAGE", "(?::[%s]*(.*))?")`), `undefined` when
 * the line carries no colon.
 */
export interface LinkAnchor {
  readonly anchor1: string;
  readonly anchor2: string;
  readonly message: string | undefined;
}

export interface SequenceDiagramAST {
  participants: Participant[];
  events: SequenceEvent[];
  /** Every `{a} <-> {b}` line, in source order -- see {@link LinkAnchor}.
   *  Optional so hand-authored AST literals compile unchanged. */
  linkAnchors?: LinkAnchor[];
  /**
   * `skinParam.getCurrentStyleBuilder()` read at TILE time, i.e. after every
   * command and every trailing declaration has executed: the builder a
   * lifeline (`MutingLine.java:70`, built by `LivingSpace.java:147`) and a
   * destroy cross (`LiveBoxesDrawer.java:78-81`, `LifeEventTile.java:107-110`)
   * merge from. Set by `parseSequence`; absent only on an AST built without a
   * parse, which `layoutSequence` refuses (`sequence-layout-lifeline.ts`).
   * sdd1 D2.
   */
  readonly styleBuilder?: StyleBuilder;
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
    /** `!pragma sequenceMessageSpan true` (`AbstractCommunicationTile.java:52-54`):
     *  message tiles register no participant-span constraint. */
    sequenceMessageSpan?: boolean;
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
