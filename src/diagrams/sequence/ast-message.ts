/**
 * Message events of the sequence AST: the shared `AbstractMessage` fields and
 * its two subclasses. Split out of `ast.ts` (pure move, mission sdd2 T0d);
 * `ast.ts` re-exports every name here, so no import site changed.
 *
 * @see sequencediagram/AbstractMessage.java:58
 * @see sequencediagram/Message.java:46
 * @see sequencediagram/MessageExo.java:43
 * @see sequencediagram/MessageExoType.java:38
 */

import type { ArrowConfiguration } from './sequence-arrowhead.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';

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
 * The jar's sequence engine is always teoz (`SequenceDiagram.java:311-312`,
 * `GlobalConfig.java:47` `FORCE_TEOZ`), so both `teoz/` readers apply:
 * `parallel` builds the tile with `YGauge.createParallel`
 * (`CommunicationTile.java:114-117`; `sequence-layout-events.ts`), and
 * `anchor` is what a `LinkAnchor` finds the tile by (`PlayingSpace.java:
 * 129-134`).
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
   *  `msg.goParallel()` at `:143-145`): the tile shares the previous one's
   *  arrow line (`YGauge.java:124-145`). */
  parallel?: boolean;
  /** `{name}` (`CommandArrow.java:417`): how a `LinkAnchor` finds this
   *  message's tile (`AbstractTile#matchAnchor:68-74`, read by
   *  `PlayingSpace#getFromAnchor:146-152`). */
  anchor?: string;
  /** `AbstractMessage#isCreate` (`:169-171`): this message took the pending
   *  `CREATE` life event (`SequenceDiagram.java:207-214`). */
  create?: true;
  /** The builder current at the arrow's command (`CommandArrow.java:401`,
   *  `CommandExoArrowAny.java:136`, `CommandReturn.java:129-132`), merged in
   *  the constructor (`AbstractMessage.java:66-77`). sdd1 D2. */
  readonly styleBuilder: StyleBuilder;
}

export interface MessageEvent extends AbstractMessageEvent {
  kind: 'message';
  from: string; // participant id
  to: string; // participant id
  activates?: string; // participant id to auto-activate (++ shorthand)
  deactivates?: string; // participant id to auto-deactivate (-- shorthand)
  /** Participant id destroyed by the `!!` shorthand: a `LifeEventType.DESTROY`
   *  bound to this message (`CommandArrow.java`, `SequenceDiagram.java#activate`).
   *  sdd1: declared ahead of T3d, which sets and reads it. */
  destroys?: string;
  /** The extra targets of `A -> B, C, D : msg` — `getMulticasts`
   *  (`CommandArrow.java:139-155`), `msg.setMulticast(...)` at `:404`. */
  multicast?: readonly string[];
  /** `skinparam ResponseMessageBelowArrow true` (`Rose.java:340`,
   *  `param.responseMessageBelowArrow()`), the `belowForResponse` argument
   *  of `ComponentRoseArrow`. It takes effect only on a reverse-defined
   *  (`A <- B`) flat arrow (`ComponentRoseArrow.java:195-197`); set by the
   *  post-parse pass `sequence-response-below.ts`, because the skin parameter
   *  is read at tile time, after every declaration has executed. */
  belowForResponse?: true;
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
