/**
 * `CommandArrow` (`SequenceDiagramFactory.java:111`) — ONE upstream command,
 * rebuilt here from the composed named groups of `sequence-arrow-regex.ts`
 * rather than from an enumerated token table (`->`, `-->>`, `->>`, `-->`).
 * The enumerated form could not express seven of the named groups upstream
 * concatenates: PARALLEL, ANCHOR, PART1's four alternatives, the full
 * ARROW_DRESSING1/2 alternations, ARROW_STYLE1/2, MULTICAST and the
 * PART1ANCHOR/PART2ANCHOR pair.
 *
 * **Two registry entries, one grammar.** `SEQUENCE_COMMANDS` registers this
 * family twice (positions 20 and 36) and that order is frozen (D2). The split
 * is upstream's own `RegexOptional(RegexOr("ARROW_DRESSING1", …))`
 * (`CommandArrow.java:98-103`) taken one branch at a time: `arrowCommand`
 * carries the pattern with ARROW_DRESSING1 **absent**, `decoratedArrowCommand`
 * the same pattern with it **mandatory**. Their union is exactly upstream's
 * language and they are disjoint — nothing that reaches the dashes without a
 * left dressing can also be read as carrying one, because every
 * ARROW_DRESSING1 alternative starts with `<`, `/`, `\`, `(n)` or a SPACE
 * followed by `o`/`x`, none of which `PART1CODE` can absorb. Both entries run
 * the same `executeArrow`, so the split is a dispatch-position artefact, not
 * two behaviours.
 *
 * **What this module does NOT carry yet.** `withPart(TOP_PART/BOTTOM_PART)`
 * (`:361-365`), `withInclination` (`:393`), `applyStyle`'s `withColor` and
 * `ArrowBody.HIDDEN` (`:496-503`), `config.reverseDefine()` (`:389-390`),
 * LIFECOLOR (`:427`), STEREOTYPE (`:137-140`) and the URL (`:133-135`) are
 * MATCHED — so a line carrying them is recognised rather than refused — and
 * then discarded, because this port's `ArrowConfiguration`
 * (`sequence-arrowhead.ts:84`) has no field for the first four and T12 owns
 * wiring the trailing modifiers onto the AST. `PART1ANCHOR`/`PART2ANCHOR`
 * (`:418-419`) are matched and dropped for the same reason: `MessageEvent`
 * declares one `anchor`, which carries the leading `ANCHOR` group.
 *
 * Upstream's `executeArg` returns `CommandExecutionResult.error("Illegal
 * sequence arrow")` when neither dressing carries a direction (`:314`). This
 * port's `Command.execute` has no failure channel — see `parser.ts`'s note on
 * the `execution` refusal point — so that case consumes the line and emits
 * nothing.
 *
 * `CommandReturn` (`:129`) lives here too. Upstream registers it in the
 * `CommandActivate2`/`CommandReturn` block after `CommandGrouping`, not
 * beside `CommandArrow`; it is filed here because it emits the same reply
 * `MessageEvent` off the same `lastMessageFrom`/`lastMessageTo` state the
 * arrow rules maintain (`CommandReturn.java:105-160` reverses the activating
 * message). Its registry position is unchanged by that filing.
 *
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:87-133,296-430
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:111,129
 */

import type { MessageEvent } from './ast.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import {
  ARROW_DRESSING1,
  ARROW_SKELETON_SOURCE,
  LIFECOLOR,
} from './sequence-arrow-regex.js';
import {
  activationFlags,
  applyAutonumber,
  arrowConfigurationOf,
  emit,
  ensureParticipant,
  type ArrowSpec,
  type Command,
  type ParseState,
} from './sequence-parse-helpers.js';

// ---------------------------------------------------------------------------
// return
// ---------------------------------------------------------------------------

// 16. return — sends a reply back to the most recent message sender
export const returnCommand: Command = {
  pattern: /^return(?:\s+(.+))?\s*$/i,
  execute(state, match) {
    const label = match[1]?.trim() ?? '';
    const from = state.lastMessageTo ?? '';
    const to = state.lastMessageFrom ?? '';
    ensureParticipant(state, from);
    ensureParticipant(state, to);
    // Upstream inherits the ACTIVATING message's configuration and only dots
    // its body -- `message1.getArrowConfiguration().withBody(DOTTED)`
    // (`CommandReturn.java:120`). This port has no `getActivatingMessage()`
    // yet, so it emits the dotted plain-head arrow the spike always emitted.
    // @see sequencediagram/command/CommandReturn.java:109-133
    let msg: MessageEvent = {
      kind: 'message',
      from,
      to,
      label,
      arrow: arrowConfigurationOf({ dashed: true }),
    };
    msg = applyAutonumber(state, msg);
    emit(state, msg);
  },
};

// ---------------------------------------------------------------------------
// The two fragments `sequence-arrow-regex.ts` deliberately leaves out
// ---------------------------------------------------------------------------

/**
 * `%s` — normal or non-breaking space, as a bare char list so it can also be
 * spelled inside a NEGATED class (`[^%s…]`, which `UrlBuilder` uses four
 * times). `sequence-arrow-regex.ts` keeps its own copy private.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:57
 */
const S_CHARS = '\\s\\u00A0';

/** `[%s]` — one such space. */
const S = `[${S_CHARS}]`;

/**
 * `%g` — the quote characters: ASCII double quote, the two curly double
 * quotes, and `Jaws.BLOCK_E1_INVISIBLE_QUOTE` (U+E121).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:59
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jaws/Jaws.java:55
 */
const G_CHARS = '"\\u201c\\u201d\\uE121';

/**
 * `StereotypePattern.optional("STEREOTYPE")` — `spaceZeroOrMore`, an optional
 * `mandatory` leaf `(\<\<.+?\>\>)`, then `spaceZeroOrMore` again.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/StereotypePattern.java:52-58,67-69
 */
const STEREOTYPE_OPTIONAL = `${S}*(?:(?<STEREOTYPE><<.+?>>))?${S}*`;

/** `UrlBuilder.START_PART` / `END_PART`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:51-52 */
const URL_START = `\\[\\[${S}*`;
const URL_END = `${S}*\\]\\]`;

/** The optional `{tooltip}` and the optional trailing label, shared verbatim
 *  by `S_QUOTED` and `S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:56-57,78-79 */
const URL_OPT_TOOLTIP = `(?:${S}*\\{([^{}]*)\\})?`;
const URL_OPT_LABEL = `(?:${S}([^${S_CHARS}{}\\[\\]][^\\[\\]]*))?`;

/**
 * `UrlBuilder.getRegexp()` — its five alternatives in upstream's order, with
 * upstream's eleven inner groups kept (the twelfth is the `URL` group itself,
 * which is why `MANDATORY` declares `new RegexLeaf(12, URL_KEY, …)`).
 * `executeArg` reads only group 0, the whole `[[…]]` run, and hands it back to
 * `UrlBuilder#getUrl` to re-parse (`CommandArrow.java:133-136`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:48-49,54-87
 */
const URL_REGEXP =
  `${URL_START}[${G_CHARS}]([^${G_CHARS}]+)[${G_CHARS}]${URL_OPT_TOOLTIP}${URL_OPT_LABEL}${URL_END}` +
  `|${URL_START}\\{(.*)\\}${URL_END}` +
  `|${URL_START}\\{([^{}]*)\\}${S}*([^\\[${S_CHARS}{}\\[\\]][^\\[\\]]*)${URL_END}` +
  `|${URL_START}([^\\s${G_CHARS}{}\\[\\]]+?)${S}*\\{(.+)\\}${URL_END}` +
  `|${URL_START}([^${S_CHARS}${G_CHARS}\\[\\]]+?)${URL_OPT_TOOLTIP}${URL_OPT_LABEL}${URL_END}`;

/** `UrlBuilder.OPTIONAL` = `RegexOptional(MANDATORY)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:48-49 */
const URL_OPTIONAL = `(?:(?<URL>${URL_REGEXP}))?`;

// ---------------------------------------------------------------------------
// The composed pattern
// ---------------------------------------------------------------------------

/**
 * `getRegexConcat()` in full: T3's skeleton with STEREOTYPE and URL spliced
 * back in at their upstream position, immediately after LIFECOLOR and before
 * the final `spaceZeroOrMore` + MESSAGE (`CommandArrow.java:128-132`). The
 * splice is anchored on the LIFECOLOR fragment, which occurs exactly once, so
 * the concatenation order stays owned by `sequence-arrow-regex.ts`.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:87-133
 */
export const ARROW_SOURCE = ARROW_SKELETON_SOURCE.replace(
  LIFECOLOR,
  () => `${LIFECOLOR}${STEREOTYPE_OPTIONAL}${URL_OPTIONAL}`,
);

/**
 * {@link ARROW_SOURCE} with the ARROW_DRESSING1 fragment removed — the
 * "optional group not taken" branch of `RegexOptional`
 * (`regex/RegexOptional.java:46-52`).
 */
export const UNDRESSED_ARROW_SOURCE = ARROW_SOURCE.replace(ARROW_DRESSING1, '');

/**
 * {@link ARROW_SOURCE} with ARROW_DRESSING1 made mandatory — the other branch.
 * The fragment is exactly `(?:…)?`, so dropping its final character is the
 * `RegexOr` inside the `RegexOptional`.
 */
export const DRESSED_ARROW_SOURCE = ARROW_SOURCE.replace(ARROW_DRESSING1, () =>
  ARROW_DRESSING1.slice(0, -1),
);

/** `i` because upstream compiles every command with `Pattern.CASE_INSENSITIVE`
 *  (`regex/Pattern2.java:114`); `u` for `\p{L}`/`\p{N}`. */
const UNDRESSED_ARROW_RE = new RegExp(UNDRESSED_ARROW_SOURCE, 'iu');
const DRESSED_ARROW_RE = new RegExp(DRESSED_ARROW_SOURCE, 'iu');

// ---------------------------------------------------------------------------
// executeArg's own helpers, under upstream's names
// ---------------------------------------------------------------------------

/** A `RegExpExecArray`'s named groups. */
type Groups = Readonly<Record<string, string | undefined>>;

/** @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:178-183 */
function contains(value: string, ...totest: readonly string[]): boolean {
  return totest.some((t) => value.includes(t));
}

/**
 * `CommandLinkClass.notNull(value)`, then `_` stripped and lower-cased — the
 * `_` of `<_`/`_>` marks a "no rank" arrow and is not part of the dressing.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:185-190
 */
function getDressing(value: string | undefined): string {
  return (value ?? '').replace(/_/g, '').toLowerCase();
}

/**
 * The `(n)` pixel offset inside a dressing. Ported for completeness — nothing
 * consumes the sum yet (see the module header).
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:192-203
 */
export function getInclination(key: string | undefined): number {
  if (key === undefined) return 0;
  const x1 = key.indexOf('(');
  if (x1 === -1) return 0;
  const x2 = key.indexOf(')');
  if (x2 === -1) return 0;
  return Number.parseInt(key.slice(x1 + 1, x2), 10);
}

/**
 * `getLength` — total dash count across whichever ARROW_BODY branch matched.
 * `??` is `RegexResult#getLazzy(key, 0)`: the first group whose name starts
 * with the key and whose value is non-null (`RegexResult.java:91-110`).
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:469-478
 */
function getLength(g: Groups): number {
  const sa = g['ARROW_BODYA1'] ?? g['ARROW_BODYA2'] ?? '';
  const sb = g['ARROW_BODYB1'] ?? g['ARROW_BODYB2'] ?? '';
  return sa.length + sb.length;
}

/**
 * `applyStyle` — `dashed`/`dotted` dot the body and `bold` is a deliberate
 * no-op upstream. `hidden` (`ArrowBody.HIDDEN`) and the colour fallback have
 * no field on this port's `ArrowConfiguration`, so they are parsed and
 * dropped rather than approximated.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:480-505
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

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** One resolved endpoint: the participant CODE and the `Display` upstream
 *  builds beside it. */
interface Endpoint {
  readonly code: string;
  readonly display: string;
}

/**
 * `getOrCreateParticipant(location, system, arg, n)` — the four PART
 * alternatives in upstream's own order. `"Long" as Code` takes its code from
 * the second group and its display from the first; `Code as "Long"` the other
 * way round.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:157-176
 */
function endpointOf(g: Groups, n: 'PART1' | 'PART2'): Endpoint {
  const code = g[`${n}CODE`];
  if (code !== undefined) return { code, display: code };
  const long = g[`${n}LONG`];
  if (long !== undefined) return { code: long, display: long };
  const longCode = g[`${n}LONGCODE`];
  if (longCode !== undefined) return { code: g[`${n}LONGCODE1`]!, display: longCode };
  const codeLong = g[`${n}CODELONG`];
  if (codeLong !== undefined) return { code: codeLong, display: g[`${n}CODELONG1`]! };
  // Upstream's own `throw new IllegalStateException()` (`:175`): PART1/PART2
  // is a mandatory RegexOr, so one alternative always participated.
  throw new Error(`CommandArrow: ${n} matched with no alternative group`);
}

/**
 * `getMulticasts` — the extra `& target` recipients, split on `&`, blanks
 * skipped, each one declared through `getOrCreateParticipant`.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:139-155
 */
function getMulticasts(state: ParseState, multicast: string | undefined): readonly string[] {
  if (multicast === undefined) return [];
  const result: string[] = [];
  for (const raw of multicast.split('&')) {
    const s = raw.trim();
    if (s.length === 0) continue;
    ensureParticipant(state, s);
    result.push(s);
  }
  return result;
}

// ---------------------------------------------------------------------------
// The dressing algebra
// ---------------------------------------------------------------------------

/**
 * The five facts `executeArg` derives from the two dressings before it can
 * name either end (`CommandArrow.java:300-314`). `reverseDefine` means the
 * arrow was WRITTEN right-to-left, so PART1 is the message's target.
 */
interface DressingFacts {
  readonly dressing1: string;
  readonly dressing2: string;
  readonly reverseDefine: boolean;
  readonly hasDressing1butx: boolean;
  readonly hasDressing2butx: boolean;
  readonly xInDressing1: boolean;
  readonly xInDressing2: boolean;
}

/**
 * `null` is upstream's `CommandExecutionResult.error("Illegal sequence
 * arrow")` — a body with no direction on either end, e.g. `A - B`.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:300-314
 */
function resolveDressings(dressing1: string, dressing2: string): DressingFacts | null {
  const hasDressing1butx = contains(dressing1, '<', '\\', '/');
  const xInDressing1 = dressing1.includes('x');
  const hasDressing2butx = contains(dressing2, '>', '\\', '/');
  const xInDressing2 = dressing2.includes('x');
  let reverseDefine: boolean;
  if (hasDressing2butx || (xInDressing1 && xInDressing2)) reverseDefine = false;
  else if (hasDressing1butx) reverseDefine = true;
  else if (xInDressing1 || xInDressing2) reverseDefine = false;
  else return null;
  return {
    dressing1,
    dressing2,
    reverseDefine,
    hasDressing1butx,
    hasDressing2butx,
    xInDressing1,
    xInDressing2,
  };
}

/**
 * `circleAtStart`/`circleAtEnd`/`sync1`/`sync2` and the CROSSX remap, all
 * already swapped into MESSAGE orientation when the arrow was written
 * right-to-left — upstream does the same swap in the `reverseDefine` branch
 * so that `new Message(p1, p2, …)` still reads sender-to-receiver.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:315-390
 */
function arrowSpecOf(f: DressingFacts, dotted: boolean): ArrowSpec {
  const rev = f.reverseDefine;
  const tail = rev ? f.dressing2 : f.dressing1;
  const head = rev ? f.dressing1 : f.dressing2;
  return {
    dashed: dotted,
    both: f.hasDressing1butx && f.hasDressing2butx,
    circle1: tail.includes('o'),
    circle2: head.includes('o'),
    async1: contains(tail, rev ? '>>' : '<<', '\\\\', '//'),
    async2: contains(head, rev ? '<<' : '>>', '\\\\', '//'),
    cross1: rev ? f.xInDressing2 : f.xInDressing1,
    cross2: rev ? f.xInDressing1 : f.xInDressing2,
  };
}

// ---------------------------------------------------------------------------
// executeArg
// ---------------------------------------------------------------------------

/**
 * The AST fields that only some arrows carry. `parallel` and `anchor` are
 * stored and NOT drawn: every upstream consumer of `isParallel()` and
 * `getAnchor()` lives under `sequencediagram/teoz/`, and the classic renderer
 * reads neither (D4). `PART1ANCHOR`/`PART2ANCHOR` have no AST field.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:404,413-419
 */
function optionalFields(
  state: ParseState,
  g: Groups,
): Pick<MessageEvent, 'multicast' | 'parallel' | 'anchor'> {
  const multicast = getMulticasts(state, g['MULTICAST']);
  const anchor = g['ANCHOR1'];
  return {
    ...(multicast.length > 0 ? { multicast } : {}),
    ...(g['PARALLEL'] !== undefined ? { parallel: true } : {}),
    ...(anchor !== undefined ? { anchor } : {}),
  };
}

/**
 * `executeArg` (`CommandArrow.java:296-437`). PART1 is created BEFORE PART2 in
 * both branches — upstream's reverse branch assigns `p2 = …("PART1")` first
 * (`:322-323`), so a right-to-left arrow still declares its left-hand
 * participant first and therefore leftmost.
 */
function executeArrow(state: ParseState, match: RegExpExecArray): void {
  const g: Groups = match.groups ?? {};
  const facts = resolveDressings(
    getDressing(g['ARROW_DRESSING1']),
    getDressing(g['ARROW_DRESSING2']),
  );
  if (facts === null) return;

  const part1 = endpointOf(g, 'PART1');
  const part2 = endpointOf(g, 'PART2');
  ensureParticipant(state, part1.code, 'participant', { display: part1.display });
  ensureParticipant(state, part2.code, 'participant', { display: part2.display });

  const from = facts.reverseDefine ? part2.code : part1.code;
  const to = facts.reverseDefine ? part1.code : part2.code;
  const msg = applyAutonumber(state, {
    kind: 'message',
    from,
    to,
    label: g['MESSAGE'] ?? '',
    arrow: applyStyle(
      g['ARROW_STYLE1'] ?? g['ARROW_STYLE2'],
      arrowConfigurationOf(arrowSpecOf(facts, getLength(g) > 1)),
    ),
    ...optionalFields(state, g),
    ...activationFlags(g['ACTIVATION'] ?? '', from, to),
  });

  state.lastMessageFrom = from;
  state.lastMessageTo = to;
  emit(state, msg);
}

// ---------------------------------------------------------------------------
// The two registry entries
// ---------------------------------------------------------------------------

/**
 * 17. Arrows written with no left-hand dressing: `A -> B`, `A -->> B`,
 * `A ->o B`, `A -[#red]-> B`, `A -> "Bob" as B & C : hi`.
 */
export const arrowCommand: Command = {
  pattern: UNDRESSED_ARROW_RE,
  execute: executeArrow,
};

/**
 * The same grammar with ARROW_DRESSING1 present: `A <- B`, `A <<-- B`,
 * `A <-> B`, `A x-> B`, `A o<- B`, `A \\- B`. Registered last, which is where
 * this port has always dispatched them.
 */
export const decoratedArrowCommand: Command = {
  pattern: DRESSED_ARROW_RE,
  execute: executeArrow,
};
