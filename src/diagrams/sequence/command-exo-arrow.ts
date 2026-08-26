/**
 * `CommandExoArrowLeft` (`SequenceDiagramFactory.java:113`) and
 * `CommandExoArrowRight` (`:114`) over the shared `CommandExoArrowAny` base —
 * an **exogenous** message, one endpoint on a participant and the other on the
 * diagram border: `[-> Bob`, `Bob ->]`, `[<-> Bob`, `?-> Bob`.
 *
 * The two commands differ in exactly two places, which is why upstream splits
 * them and this module keeps that split: the regex puts the border token
 * BEFORE the body (`CommandExoArrowLeft.java:60`) or AFTER it
 * (`CommandExoArrowRight.java:75`), and `getMessageExoType` therefore reads a
 * `]` (left form) or a `[` (right form) as "the OTHER border"
 * (`CommandExoArrowLeft.java:175-200`, `CommandExoArrowRight.java:175-200`).
 * Everything else — `executeArg`, the decoration algebra, the short-arrow
 * rule — is `CommandExoArrowAny`'s and is shared here as
 * {@link executeExoArrow}.
 *
 * **Registry position is load-bearing.** Both entries sit AFTER the two
 * `CommandArrow` entries, mirroring upstream registering `CommandArrow`
 * (`:111`) before them. `CommandArrow` declines `[-> Bob` because its `PART1`
 * group is absent entirely — a leading bare arrow has no left participant —
 * which is why the exo commands get the line at all. See
 * `sequence-command-registry.ts`.
 *
 * **Refusal, not a throw.** Upstream's `getMessageExoType` ends each branch
 * with `throw new IllegalArgumentException()` when neither dressing group
 * participated. The regex makes that unreachable (both `RegexOr` branches
 * require their dressing), and this port has no exception channel out of
 * `Command.execute`, so the port returns `undefined` and
 * {@link executeExoArrow} emits nothing. A line that genuinely carries no
 * dressing never matches the pattern in the first place, so the command
 * declines it and dispatch continues.
 *
 * **Not ported, deliberately:** the `else if (diagram.isAutoactivate())`
 * branch (`CommandExoArrowAny.java:167-174`). `autoactivate on` is recognised
 * and write-only in this port (`command-misc.ts:149-155`), exactly as it is
 * for `CommandArrow`; there is no flag to read. Nothing else in `executeArg`
 * is dropped.
 *
 * @see ~/git/plantuml/.../sequencediagram/command/CommandExoArrowAny.java:62-220
 * @see ~/git/plantuml/.../sequencediagram/command/CommandExoArrowLeft.java:50-206
 * @see ~/git/plantuml/.../sequencediagram/command/CommandExoArrowRight.java:50-200
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:113-114
 */

import type { ActivationEvent, MessageExoEvent, MessageExoType } from './ast.js';
import type { ArrowConfiguration, ArrowPart } from './sequence-arrowhead.js';
import { getRegexp, transform } from '../../core/url/UrlBuilder.js';
import { eventuallyRemoveStartingAndEndingDoubleQuote } from '../../core/url/Url.js';
import {
  ARROW_SUPPCIRCLE1_LEFT,
  ARROW_SUPPCIRCLE1_RIGHT,
  ARROW_SUPPCIRCLE2_LEFT,
  ARROW_SUPPCIRCLE2_RIGHT,
  LIFECOLOR,
  anchor,
  colorOrStylePattern,
} from './sequence-arrow-regex.js';
import {
  applyAutonumber,
  arrowConfigurationOf,
  emit,
  ensureParticipant,
  type ArrowSpec,
  type Command,
  type ParseState,
  urlOf,
} from './sequence-parse-helpers.js';

// ---------------------------------------------------------------------------
// The leaves the two exo regexes do not share with CommandArrow
// ---------------------------------------------------------------------------

/** `RegexLeaf.spaceZeroOrMore()`.
 *  @see ~/git/plantuml/.../regex/RegexLeaf.java (spaceZeroOrMore) */
const SPACE0 = `${transform('[%s]')}*`;

/** `new RegexLeaf(1, "PARALLEL", "(&[%s]*)?")` — the LEADING `&`, unlike
 *  `CommandArrow`'s identical leaf only in that this one has no `MULTICAST`
 *  sibling to be confused with.
 *  @see ~/git/plantuml/.../command/CommandExoArrowLeft.java:58 */
const PARALLEL = transform('(?<PARALLEL>&[%s]*)?');

/**
 * `new RegexLeaf(1, "PARTICIPANT", "([%pLN_.@]+|[%g][^%g]+[%g])")` — the ONE
 * endpoint. Its bare-code alternative is upstream's `[%pLN_.@]+`, NOT `\S+`:
 * a `\S+` here backtracks into the arrow's own dashes and swallows the `[`,
 * inventing a participant named `[` (measured — fifteen exo fixtures drew a
 * wrong diagram instead of refusing). Never widen it.
 * @see ~/git/plantuml/.../command/CommandExoArrowLeft.java:75
 */
const PARTICIPANT = transform('(?<PARTICIPANT>[%pLN_.@]+|[%g][^%g]+[%g])');

/**
 * `new RegexLeaf(1, "ACTIVATION", "(?:([+*!-]+)?)")`. Deliberately NOT
 * `CommandArrow`'s `ACTIVATION` (`sequence-arrow-regex.ts:281`), which
 * enumerates the DOUBLED tokens `++|**|!!|--`: the exo form is a run of
 * single characters and `executeArg` reads only `charAt(0)`.
 * @see ~/git/plantuml/.../command/CommandExoArrowLeft.java:77
 */
const ACTIVATION = '(?:(?<ACTIVATION>[+*!-]+)?)';

/** `UrlBuilder.OPTIONAL` = `RegexOptional(new RegexLeaf(12, URL_KEY,
 *  getRegexp()))`, taken from the ported `UrlBuilder` rather than respelled.
 *  @see ~/git/plantuml/.../url/UrlBuilder.java:48-49,82-88 */
const URL_OPTIONAL = `(?:(?<URL>${transform(getRegexp())}))?`;

/** `RegexOptional(RegexConcat(RegexLeaf(":"), spaceZeroOrMore, LABEL))`.
 *  @see ~/git/plantuml/.../command/CommandExoArrowLeft.java:85-90 */
const LABEL = `(?::${SPACE0}(?<LABEL>.*))?`;

/**
 * The unnamed `RegexOr` of the two body spellings, identical in both exo
 * commands. Branch A is written left-to-right and ends in `ARROW_DRESSING1`;
 * branch B is written right-to-left and opens with `ARROW_DRESSING2`. Note
 * these dressings are NOT `CommandArrow`'s: no `(n)` inclination, no `_`
 * no-rank marker and no `o`/`x` alternative — the exo decorations live in
 * `ARROW_SUPPCIRCLE1`/`2` instead. `ARROW_BOTHDRESSING`, on branch A only, is
 * a leading `<` (or `/`, `\`) before the body: an arrow in both directions.
 * @see ~/git/plantuml/.../command/CommandExoArrowLeft.java:62-72
 */
const EXO_BODY_OR =
  `(?:(?<ARROW_BOTHDRESSING><<?|//?|\\\\\\\\?)?` +
  `(?<ARROW_BODYA1>-+)${colorOrStylePattern('ARROW_STYLE1')}(?<ARROW_BODYB1>-*)` +
  `(?<ARROW_DRESSING1>>>?|//?|\\\\\\\\?)` +
  `|(?<ARROW_DRESSING2><<?|//?|\\\\\\\\?)` +
  `(?<ARROW_BODYB2>-*)${colorOrStylePattern('ARROW_STYLE2')}(?<ARROW_BODYA2>-+))`;

// ---------------------------------------------------------------------------
// The two getRegexConcat()s
// ---------------------------------------------------------------------------

/** `CommandExoArrowLeft.getRegexConcat()`, leaf for leaf in upstream's order:
 *  the border token LEADS.
 *  @see ~/git/plantuml/.../command/CommandExoArrowLeft.java:56-91 */
export const EXO_ARROW_LEFT_SOURCE =
  `^${PARALLEL}${anchor('ANCHOR')}${ARROW_SUPPCIRCLE2_LEFT}${EXO_BODY_OR}` +
  `${ARROW_SUPPCIRCLE1_LEFT}${SPACE0}${PARTICIPANT}${SPACE0}${ACTIVATION}` +
  `${SPACE0}${LIFECOLOR}${SPACE0}${URL_OPTIONAL}${SPACE0}${LABEL}$`;

/** `CommandExoArrowRight.getRegexConcat()`: the participant leads and the
 *  border token TRAILS.
 *  @see ~/git/plantuml/.../command/CommandExoArrowRight.java:56-91 */
export const EXO_ARROW_RIGHT_SOURCE =
  `^${PARALLEL}${anchor('ANCHOR')}${PARTICIPANT}${SPACE0}${ARROW_SUPPCIRCLE1_RIGHT}` +
  `${EXO_BODY_OR}${ARROW_SUPPCIRCLE2_RIGHT}${SPACE0}${ACTIVATION}` +
  `${SPACE0}${LIFECOLOR}${SPACE0}${URL_OPTIONAL}${SPACE0}${LABEL}$`;

/** `i` because upstream compiles every command with `Pattern.CASE_INSENSITIVE`
 *  (`regex/Pattern2.java:114`); `u` for `\p{L}`/`\p{N}`. */
const EXO_ARROW_LEFT_RE = new RegExp(EXO_ARROW_LEFT_SOURCE, 'iu');
const EXO_ARROW_RIGHT_RE = new RegExp(EXO_ARROW_RIGHT_SOURCE, 'iu');

// ---------------------------------------------------------------------------
// getMessageExoType — the one method the two subclasses override
// ---------------------------------------------------------------------------

/** A `RegExpExecArray`'s named groups, i.e. upstream's `RegexResult`. */
type Groups = Readonly<Record<string, string | undefined>>;

/** `abstract MessageExoType getMessageExoType(RegexResult)`. `undefined` is
 *  upstream's `IllegalArgumentException` — see the module header on why this
 *  port refuses instead of throwing.
 *  @see ~/git/plantuml/.../command/CommandExoArrowAny.java:202 */
type GetMessageExoType = (g: Groups) => MessageExoType | undefined;

/**
 * A `]` in the LEADING border token means the arrow crosses the RIGHT border
 * even though it was written on the left of the participant; otherwise the
 * left border. `ARROW_DRESSING1` (branch A, arrow pointing at the
 * participant) means the message comes FROM that border.
 * @see ~/git/plantuml/.../command/CommandExoArrowLeft.java:174-200
 */
const getMessageExoTypeLeft: GetMessageExoType = (g) => {
  const start = g['ARROW_SUPPCIRCLE2'];
  const dressing1 = g['ARROW_DRESSING1'];
  const dressing2 = g['ARROW_DRESSING2'];
  if (start !== undefined && start.includes(']')) {
    if (dressing1 !== undefined) return 'FROM_RIGHT';
    if (dressing2 !== undefined) return 'TO_RIGHT';
    return undefined;
  }
  if (dressing1 !== undefined) return 'FROM_LEFT';
  if (dressing2 !== undefined) return 'TO_LEFT';
  return undefined;
};

/**
 * The mirror: a `[` in the TRAILING border token means the arrow crosses the
 * LEFT border. Here `ARROW_DRESSING1` points AWAY from the participant, so it
 * is a message going TO the border.
 * @see ~/git/plantuml/.../command/CommandExoArrowRight.java:174-200
 */
const getMessageExoTypeRight: GetMessageExoType = (g) => {
  const start = g['ARROW_SUPPCIRCLE2'];
  const dressing1 = g['ARROW_DRESSING1'];
  const dressing2 = g['ARROW_DRESSING2'];
  if (start !== undefined && start.includes('[')) {
    if (dressing1 !== undefined) return 'TO_LEFT';
    if (dressing2 !== undefined) return 'FROM_LEFT';
    return undefined;
  }
  if (dressing1 !== undefined) return 'TO_RIGHT';
  if (dressing2 !== undefined) return 'FROM_RIGHT';
  return undefined;
};

// ---------------------------------------------------------------------------
// executeArg's helpers
// ---------------------------------------------------------------------------

/** `MessageExoType.getDirection()`.
 *  @see ~/git/plantuml/.../sequencediagram/MessageExoType.java:41-53 */
function getDirection(type: MessageExoType): number {
  return type === 'FROM_LEFT' || type === 'TO_RIGHT' ? 1 : -1;
}

/** `getArrowPart(dressing, messageExoType)` — a half-arrow `/` or `\` head
 *  keeps only one half of the triangle, and WHICH half depends on the
 *  message's direction.
 *  @see ~/git/plantuml/.../command/CommandExoArrowAny.java:186-200 */
function getArrowPart(dressing: string, type: MessageExoType): ArrowPart {
  if (dressing.includes('/')) return getDirection(type) === 1 ? 'BOTTOM_PART' : 'TOP_PART';
  if (dressing.includes('\\')) return getDirection(type) === 1 ? 'TOP_PART' : 'BOTTOM_PART';
  return 'FULL';
}

/**
 * `ArrowConfiguration.withPart(part)` — it lands on `dressing2` unless that
 * side has no head at all. Applied here AFTER {@link arrowConfigurationOf}
 * rather than at upstream's position (`CommandExoArrowAny.java:100`, before
 * the CROSSX heads) because the two are equivalent: every `withDirection*`
 * gives `dressing2` a NORMAL head, and no later call can turn a head back
 * into NONE, so the branch below picks `dressing2` at either point.
 * @see ~/git/plantuml/.../skin/ArrowConfiguration.java:152-159
 */
function withPart(config: ArrowConfiguration, part: ArrowPart): ArrowConfiguration {
  if (config.dressing2.head !== 'NONE')
    return { ...config, dressing2: { ...config.dressing2, part } };
  return { ...config, dressing1: { ...config.dressing1, part } };
}

/**
 * `CommandArrow.applyStyle(arrowStyle, config)`. A verbatim copy of the same
 * six lines in `command-arrow.ts:251-260` — upstream shares ONE static, but
 * that file is owned by another task this batch and the helper is private to
 * it; hoisting it into `sequence-parse-helpers.ts` is a follow-on.
 * @see ~/git/plantuml/.../command/CommandArrow.java:480-505
 */
function applyStyle(
  arrowStyle: string | undefined,
  config: ArrowConfiguration,
): ArrowConfiguration {
  if (arrowStyle === undefined) return config;
  const dotted = arrowStyle
    .split(',')
    .some((s) => s.toLowerCase() === 'dashed' || s.toLowerCase() === 'dotted');
  return dotted ? { ...config, dashed: true } : config;
}

/** The `o`/`x` run on each side of the arrow, already resolved to the
 *  MESSAGE's own orientation. */
interface ExoDressingFacts {
  /** `dressing.length() == 2` — a doubled `>>`/`//`/`\\` head. */
  readonly sync: boolean;
  /** `ARROW_BOTHDRESSING` participated. */
  readonly both: boolean;
  /** `body.contains("--")`. */
  readonly dotted: boolean;
}

/**
 * The decoration/CROSSX branch: for a message going TO the border,
 * `ARROW_SUPPCIRCLE1` (the participant side) is end 1 and `ARROW_SUPPCIRCLE2`
 * (the border side) is end 2; for one coming FROM the border they swap. The
 * ASYNC head only reaches end 1 when that end HAS a head, i.e. when the arrow
 * is bidirectional — `withHead` leaves an `ArrowHead.NONE` dressing alone.
 * @see ~/git/plantuml/.../command/CommandExoArrowAny.java:106-134
 * @see ~/git/plantuml/.../skin/ArrowConfiguration.java:124-136
 */
function exoArrowSpec(g: Groups, type: MessageExoType, facts: ExoDressingFacts): ArrowSpec {
  const towardsBorder = type === 'TO_RIGHT' || type === 'TO_LEFT';
  const end1 = g[towardsBorder ? 'ARROW_SUPPCIRCLE1' : 'ARROW_SUPPCIRCLE2'] ?? '';
  const end2 = g[towardsBorder ? 'ARROW_SUPPCIRCLE2' : 'ARROW_SUPPCIRCLE1'] ?? '';
  return {
    dashed: facts.dotted,
    both: facts.both,
    circle1: end1.includes('o'),
    cross1: end1.includes('x'),
    circle2: end2.includes('o'),
    cross2: end2.includes('x'),
    async1: facts.sync && facts.both,
    async2: facts.sync,
  };
}

/**
 * `diagram.activate(p, …)` for the trailing `+`/`-`/`!`, run AFTER the
 * message is added (`:152-166`). `CREATE` (`*`) is NOT here — it fires before
 * `addMessage` and is emitted by the caller. `DESTROY` collapses onto
 * deactivate for the same reason `activationFlags` does: `ActivationEvent`
 * has no CREATE/DESTROY variant.
 * @see ~/git/plantuml/.../command/CommandExoArrowAny.java:148-166
 */
function activationEventOf(
  spec: string | undefined,
  participantId: string,
  color: string | undefined,
): ActivationEvent | undefined {
  switch (spec?.charAt(0)) {
    case '+':
      return { kind: 'activate', participantId, ...(color !== undefined ? { color } : {}) };
    case '-':
    case '!':
      return { kind: 'deactivate', participantId };
    default:
      return undefined;
  }
}

/**
 * `diagram.getNextMessageNumber()` (`:137`): take the current autonumber and
 * advance the counter. `applyAutonumber` is declared over `MessageEvent`, and
 * `sequence-parse-helpers.ts` is outside this task's write-set, so the number
 * is drawn through a probe carrying THIS message's own participant and
 * configuration. Widening the helper to `AbstractMessageEvent` is a follow-on.
 * @see ~/git/plantuml/.../sequencediagram/AutoNumber.java:75-81
 */
function getNextMessageNumber(
  state: ParseState,
  participant: string,
  arrow: ArrowConfiguration,
): Pick<MessageExoEvent, 'sequenceNumber' | 'sequenceLabel'> {
  const probe = applyAutonumber(state, {
    kind: 'message',
    from: participant,
    to: participant,
    label: '',
    arrow,
  });
  return {
    ...(probe.sequenceNumber !== undefined ? { sequenceNumber: probe.sequenceNumber } : {}),
    ...(probe.sequenceLabel !== undefined ? { sequenceLabel: probe.sequenceLabel } : {}),
  };
}

// ---------------------------------------------------------------------------
// executeArg
// ---------------------------------------------------------------------------

/** The `ArrowConfiguration` `executeArg` hands to `new MessageExo(...)`, in
 *  upstream's own build order: direction, body, ASYNC head, part, style, then
 *  the per-side circles and CROSSX heads.
 *  @see ~/git/plantuml/.../command/CommandExoArrowAny.java:79-104 */
function exoArrowConfiguration(g: Groups, type: MessageExoType, dressing: string): ArrowConfiguration {
  const body = (g['ARROW_BODYA1'] ?? g['ARROW_BODYA2'] ?? '') + (g['ARROW_BODYB1'] ?? g['ARROW_BODYB2'] ?? '');
  const spec = exoArrowSpec(g, type, {
    sync: dressing.length === 2,
    both: g['ARROW_BOTHDRESSING'] !== undefined,
    dotted: body.includes('--'),
  });
  return applyStyle(
    g['ARROW_STYLE1'] ?? g['ARROW_STYLE2'],
    withPart(arrowConfigurationOf(spec), getArrowPart(dressing, type)),
  );
}

/**
 * The AST fields only some exo messages carry. `parallel` and `anchor` are
 * stored and NOT drawn -- a deliberate, filed residual, NOT upstream's
 * behaviour. An earlier version of this comment said the consumers "live
 * under `sequencediagram/teoz/`, and the classic renderer reads neither";
 * there IS no classic renderer (`SequenceDiagram.java:306-309` builds Teoz
 * unconditionally), so those consumers are live. See D4 as amended
 * 2026-08-26 and follow-on `sequence-parallel-anchor-draw`.
 * `PART1ANCHOR`/`PART2ANCHOR` (`:146-147`) have no AST field, so they are
 * matched and dropped as they are for `CommandArrow`.
 * @see ~/git/plantuml/.../command/CommandExoArrowAny.java:138-147
 */
function exoOptionalFields(
  g: Groups,
): Pick<MessageExoEvent, 'url' | 'lifeColor' | 'parallel' | 'anchor'> {
  const url = urlOf(g['URL']);
  const lifeColor = g['LIFECOLOR'];
  const anchorName = g['ANCHOR1'];
  return {
    ...(url !== undefined ? { url } : {}),
    ...(lifeColor !== undefined ? { lifeColor } : {}),
    ...(g['PARALLEL'] !== undefined ? { parallel: true } : {}),
    ...(anchorName !== undefined ? { anchor: anchorName } : {}),
  };
}

/** `diagram.getOrCreateParticipant(location, PARTICIPANT)` — the quoted
 *  alternative captures its own quotes, hence the strip.
 *  @see ~/git/plantuml/.../command/CommandExoArrowAny.java:76-78 */
function getOrCreateParticipant(state: ParseState, g: Groups): string {
  const code = eventuallyRemoveStartingAndEndingDoubleQuote(
    g['PARTICIPANT'] ?? '',
    '"([:',
  ) as string;
  ensureParticipant(state, code);
  return code;
}

/** `new MessageExo(styleBuilder, p, type, labels, config, messageNumber,
 *  isShortArrow(arg), location)`, plus the URL and the two teoz-only fields
 *  upstream sets on it immediately after (`:138-147`).
 *  @see ~/git/plantuml/.../command/CommandExoArrowAny.java:136-147 */
function messageExoOf(
  state: ParseState,
  g: Groups,
  type: MessageExoType,
  participant: string,
): MessageExoEvent {
  const arrow = exoArrowConfiguration(g, type, g['ARROW_DRESSING1'] ?? g['ARROW_DRESSING2'] ?? '');
  return {
    kind: 'messageExo',
    participant,
    exoType: type,
    shortArrow: g['ARROW_SUPPCIRCLE2']?.includes('?') === true,
    label: g['LABEL'] ?? '',
    arrow,
    ...getNextMessageNumber(state, participant, arrow),
    ...exoOptionalFields(g),
  };
}

/**
 * `CommandExoArrowAny.executeArg` (`:71-184`). `getMessageExoType` is hoisted
 * ahead of `getOrCreateParticipant` so a refusal leaves the diagram
 * untouched; upstream's ordering is unobservable because its own
 * `IllegalArgumentException` cannot be reached through either regex.
 *
 * `state.lastMessageFrom`/`lastMessageTo` are deliberately NOT updated: they
 * back this port's `return` rule, and upstream's `CommandReturn` reaches for
 * `getActivatingMessage()` rather than the previous message, so an exo
 * message has no defined answer to give them.
 * @see ~/git/plantuml/.../command/CommandExoArrowAny.java:71-184
 */
function executeExoArrow(
  state: ParseState,
  match: RegExpExecArray,
  getMessageExoType: GetMessageExoType,
): void {
  const g: Groups = match.groups ?? {};
  const type = getMessageExoType(g);
  if (type === undefined) return;

  const participant = getOrCreateParticipant(state, g);
  const activation = g['ACTIVATION'];
  if (activation?.startsWith('*') === true)
    emit(state, { kind: 'activate', participantId: participant });

  emit(state, messageExoOf(state, g, type, participant));

  const post = activationEventOf(activation, participant, g['LIFECOLOR']);
  if (post !== undefined) emit(state, post);
}

// ---------------------------------------------------------------------------
// The two registry entries
// ---------------------------------------------------------------------------

/** `[-> Bob`, `[<- Bob`, `?-> Bob`, `[o->o Bob : hello` — the border token
 *  leads. @see ~/git/plantuml/.../command/CommandExoArrowLeft.java:50-54 */
export const exoArrowLeftCommand: Command = {
  pattern: EXO_ARROW_LEFT_RE,
  execute(state, match) {
    executeExoArrow(state, match, getMessageExoTypeLeft);
  },
};

/** `Bob ->]`, `Bob <-]`, `Bob ->?`, `Bob o<-o[ : hello` — the border token
 *  trails. @see ~/git/plantuml/.../command/CommandExoArrowRight.java:50-54 */
export const exoArrowRightCommand: Command = {
  pattern: EXO_ARROW_RIGHT_RE,
  execute(state, match) {
    executeExoArrow(state, match, getMessageExoTypeRight);
  },
};
