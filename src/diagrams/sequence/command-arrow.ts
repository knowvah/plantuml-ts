/**
 * `CommandArrow` (`SequenceDiagramFactory.java:111`) — ONE upstream command
 * covering both directions, split here into a forward-only rule and a
 * reverse/decorated rule (see each one's own notes). Registered directly
 * after the participant declarations and BEFORE `CommandExoArrowLeft`/
 * `CommandExoArrowRight` (`:113-114`): `CommandArrow` declines `[-> Bob`
 * because its PART1 group is absent entirely, which is why the exo commands
 * get that line. Neither exo command is ported yet, so this module has no
 * exo sibling.
 *
 * `CommandReturn` (`:129`) lives here too. Upstream registers it in the
 * `CommandActivate2`/`CommandReturn` block after `CommandGrouping`, not
 * beside `CommandArrow`; it is filed here because it emits the same reply
 * `MessageEvent` off the same `lastMessageFrom`/`lastMessageTo` state the
 * arrow rules maintain (`CommandReturn.java:105-160` reverses the activating
 * message). Its registry position is unchanged by that filing.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:111,129
 */

import type { MessageEvent } from './ast.js';
import {
  activationFlags,
  applyAutonumber,
  arrowConfigurationOf,
  emit,
  ensureParticipant,
  type Command,
} from './sequence-parse-helpers.js';

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
    // yet, so it emits the dotted plain-head arrow the spike always emitted;
    // carrying the inheritance is T7's, not this representation change's.
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

// 17. Arrow messages — must come after frame keywords to avoid conflicts.
//     Supports: ->, -->, ->>, -->>, ->?, ?->
//     Optionally: ++/--/**/!!/--++/++-- (activation spec) after target
//     Optionally: : label
//     T13 (mission dispatch-by-parse-attempt): the two separate `++`/`--`
//     optional groups widened to one combined ACTIVATION group accepting
//     `**`/`!!`/the two 4-char combos too, mirroring
//     `CommandArrow.java:126` (`(\+\+|\*\*|!!|--|--\+\+|\+\+--)?`) --
//     `**`/`!!` (create/destroy life events) still only ACTIVATE/
//     DEACTIVATE here, since this port's `ActivationEvent.kind` has no
//     CREATE/DESTROY variant (`manageActivations`, `:446-467`).
export const arrowCommand: Command = {
  // T13: `(?:&\s*)?` accepts the leading PARALLEL marker (`& A -> B`,
  // `CommandArrow.java:90`), discarded (see `decoratedArrowCommand` below,
  // the sibling rule that also drops it).
  // Quoted endpoints (`"Application thread" -> "DB connection"`) are
  // unquoted at use.
  //
  // The unquoted endpoint is upstream's own participant code,
  // `PART1CODE`/`PART2CODE` = `([%pLN_.@]+)` (`CommandArrow.java:93,96`):
  // Unicode letters and digits, `_`, `.`, `@`. NOT `\S+`, which let the
  // token absorb a leading dash of the arrow itself -- greedy backtracking
  // made `C-->B` parse as `C-` `->` `B`, inventing a participant named
  // `C-`. Jar-verified: `B->C` / `C-->B` declares exactly B and C.
  // Anything outside that class has to be quoted upstream too.
  pattern:
    /^(?:&\s*)?("[^"]+"|[\p{L}\p{N}_.@]+)\s*(->|-->>|->>|-->|->\?|\?->)\s*("[^"]+"|[\p{L}\p{N}_.@]+?)(\s*(?:\+\+|--\+\+|\+\+--|--|\*\*|!!))?\s*(?::\s*(.*))?$/u,
  execute(state, match) {
    const from = match[1]!.replace(/^"(.*)"$/, '$1');
    const arrowToken = match[2]!;
    const to = match[3]!.replace(/^"(.*)"$/, '$1');
    const activation = match[4]?.trim() ?? '';
    const label = match[5]?.trim() ?? '';

    // The dressings, read off the token the way `executeArg` reads them off
    // ARROW_DRESSING1/2: a `--` shaft is `dotted` (`getLength(arg) > 1`,
    // `CommandArrow.java:340`) and a `>>` head is `sync2`
    // (`contains(dressing2, ">>", …)`, `:330,337`). The pattern above admits
    // only the six enumerated tokens, so no other dressing can reach here.
    const arrow = arrowConfigurationOf({
      dashed: (arrowToken.match(/-/g) ?? []).length > 1,
      async2: arrowToken.endsWith('>>'),
    });

    ensureParticipant(state, from);
    ensureParticipant(state, to);

    let msg: MessageEvent = {
      kind: 'message',
      from,
      to,
      label,
      arrow,
      ...activationFlags(activation, from, to),
    };
    msg = applyAutonumber(state, msg);

    state.lastMessageFrom = from;
    state.lastMessageTo = to;

    emit(state, msg);
  },
};

/**
 * Reverse and/or decorated arrows: `A <- B`, `A <-- B`, `A <<- B`,
 * `A <<-- B`, and the `o`/`x` circle/cross decorations on either end
 * (`Alice ->o Bob`, `x-> Alice`, `<-o`, …). `COMMANDS`'s rule 17 already
 * handles plain undecorated forward arrows, so this rule only needs to
 * cover what it does not: a leading `<` (reverse), or an `o`/`x` adjacent
 * to the shaft on either side. `[^\s[\]]+` (not `\S+`) deliberately EXCLUDES
 * bracket-containing tokens, so the exo-arrow forms (`[->`, `->]`, `[o<-x`,
 * …) fall through unmatched rather than being mis-parsed as a literal
 * participant named e.g. `"[o<-x"` — `CommandExoArrowLeft`/
 * `CommandExoArrowRight`/`CommandExoArrowAny` are a distinct, unported
 * command family (T13's report lists them as a residual).
 *
 * Decoration side mapping: a decoration written next to the FIRST token
 * (`leadDecor`) belongs to whichever participant ends up as `from`/`to`
 * after the reverse swap below — mirrors `CommandArrow`'s own
 * `circleAtStart`/`circleAtEnd` swap under `reverseDefine`
 * (`CommandArrow.java:322-338`).
 * @see sequencediagram/command/CommandArrow.java:296-338
 */
interface DecoratedArrowMatch {
  readonly tokenA: string;
  readonly leadDecor: string | undefined;
  readonly leftAngle: string | undefined;
  readonly dashes: string;
  readonly rightAngle: string | undefined;
  readonly trailDecor: string | undefined;
  readonly tokenB: string;
  readonly label: string;
}

/** Endpoints and `ArrowConfiguration` resolved from a `DecoratedArrowMatch`
 *  — the pure half of `decoratedArrowCommand`, split out to stay under the
 *  complexity hook's per-function limit. Mirrors `CommandArrow`'s
 *  `reverseDefine` swap of `circleAtStart`/`circleAtEnd`
 *  (`CommandArrow.java:322-338`), so the spec it hands
 *  {@link arrowConfigurationOf} is already in the arrow's own orientation. */
function resolveDecoratedArrow(m: DecoratedArrowMatch): Omit<MessageEvent, 'kind'> {
  const reversed = m.leftAngle !== undefined;
  const head = reversed ? m.leadDecor : m.trailDecor;
  const tail = reversed ? m.trailDecor : m.leadDecor;

  return {
    from: reversed ? m.tokenB : m.tokenA,
    to: reversed ? m.tokenA : m.tokenB,
    label: m.label,
    arrow: arrowConfigurationOf({
      dashed: m.dashes.length > 1,
      // `sync2` off the LEFT dressing, which is where a reverse-defined
      // arrow's head lives (`sync2 = contains(dressing1, "<<", …)`,
      // `CommandArrow.java:329`). Only when the RIGHT dressing is absent:
      // with both angles present upstream's `hasDressing2butx` forces
      // `reverseDefine` false (`:306-307`), a case the enumerated table
      // never covered and T7 rebuilds properly rather than guessing at here.
      async2: reversed && m.rightAngle === undefined && m.leftAngle === '<<',
      circle1: tail === 'o',
      circle2: head === 'o',
      cross1: tail === 'x',
      cross2: head === 'x',
    }),
  };
}

/** Strip one layer of matching double quotes, as `StringUtils
 *  #eventuallyRemoveStartingAndEndingDoubleQuote` does for every quoted
 *  participant token upstream reads. */
function unquote(token: string): string {
  return token.replace(/^"(.*)"$/, '$1');
}

export const decoratedArrowCommand: Command = {
  // T13: `(?:&\s*)?` accepts the leading PARALLEL marker
  // (`CommandArrow.java:90`, `ARROW_DRESSING1` group's sibling `PARALLEL`)
  // discarded here — `MessageEvent.parallel` is declared but T7 populates
  // it. `(?:\[[^\]]*\])?` skips an inline `[#color]`/`[bold]` style bracket
  // between the dash run and the arrowhead (`CommandArrow.java:106`,
  // `getColorOrStylePattern`) — matched and discarded, same scope cut as
  // the `ref`/`box` color groups elsewhere in this file. Quoted endpoints
  // (`"Application thread" -> "DB connection"`) are unquoted via
  // {@link unquote}. The decoration groups also accept `/`/`//`/`\`/`\\`
  // (upstream's TOP_PART/BOTTOM_PART half-head dressings,
  // `CommandArrow.java:361-365`) so a line carrying one is recognised
  // rather than refused; only `o`/`x` reach the `ArrowConfiguration` below,
  // so the half-head effect itself is not reproduced (an `ArrowPart` this
  // port's `sequence-arrowhead.ts` already models but nothing in the parser
  // has fed yet — T12 wires it).
  // T20 (defect 5 of `diagnosis-24-score-rises.md`): the endpoints are
  // upstream's own `PART1CODE`/`PART2CODE` = `([%pLN_.@]+)`
  // (`CommandArrow.java:93,119`), and an `ACTIVATION` group
  // `(\+\+|\*\*|!!|--|--\+\+|\+\+--)?` follows PART2 (`:126`) exactly as it
  // does on the `->`-only sibling `arrowCommand` above. Without both,
  // `Alice <- Bob--: 500` let `--` be absorbed into the target token and
  // declared a phantom participant named `Bob--`; the loose `[^\s[\]]+`
  // class did the same for any endpoint abutting punctuation.
  pattern:
    /^(?:&\s*)?("[^"]+"|[\p{L}\p{N}_.@]+)\s*([ox]|\\{1,2}|\/{1,2})?(<<?)?(-+)(?:\[[^\]]*\])?(>>?)?([ox]|\\{1,2}|\/{1,2})?\s*("[^"]+"|[\p{L}\p{N}_.@]+?)(\s*(?:\+\+|--\+\+|\+\+--|--|\*\*|!!))?\s*(?::\s*(.*))?$/u,
  execute(state, match) {
    if (match[3] === undefined && match[5] === undefined) return; // not an arrow

    const resolved = resolveDecoratedArrow({
      tokenA: unquote(match[1]!),
      leadDecor: match[2],
      leftAngle: match[3],
      dashes: match[4]!,
      rightAngle: match[5],
      trailDecor: match[6],
      tokenB: unquote(match[7]!),
      label: match[9]?.trim() ?? '',
    });

    ensureParticipant(state, resolved.from);
    ensureParticipant(state, resolved.to);
    // The ACTIVATION suffix applies on this path too -- upstream has ONE
    // `CommandArrow` for both directions, and `manageActivations` reads the
    // RESOLVED p1/p2, i.e. the message's source and target after the
    // reverse-define swap (`CommandArrow.java:315-338,443-456`).
    const msg = applyAutonumber(state, {
      kind: 'message',
      ...resolved,
      ...activationFlags(match[8] ?? '', resolved.from, resolved.to),
    });
    state.lastMessageFrom = resolved.from;
    state.lastMessageTo = resolved.to;
    emit(state, msg);
  },
};

