/**
 * The `participant`-family declaration grammar shared by
 * `CommandParticipantA`/`A2`/`A3`/`A4` (`SequenceDiagramFactory.java:106`) --
 * split out of `sequence-parse-helpers.ts` purely to stay under the
 * 500-line file cap (the same reason that file was itself split out of
 * `parser.ts`); `sequence-parse-helpers.ts` re-exports every symbol here so
 * `command-participant.ts`/`ast.ts` need no import changes.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandParticipantA.java:52-69
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandParticipantA2.java:51-65
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandParticipantA3.java:51-65
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandParticipantA4.java:51-61
 */

import { UrlBuilder } from '../../core/url/UrlBuilder.js';
import { UrlMode } from '../../core/url/UrlMode.js';
import { SequenceCommandRefusal } from './sequence-parse-helpers.js';
import { SEQUENCE_COLOR } from './sequence-color-grammar.js';

/** Parsed `participant`-family declaration: id, display name, and optional
 *  color, resolved from the various supported syntaxes (`participant
 *  Alice`, `participant "Alice Smith" as A #pink`, …). */
export interface ParticipantDeclaration {
  id: string;
  display: string;
  color: string | undefined;
  /** The `<<...>>` run, guillemets INCLUDED as upstream captures them
   *  (`StereotypePattern.mandatory` = `(\<\<.+?\>\>)`), or undefined. */
  stereotype: string | undefined;
  /** The participant's `[[url{tooltip}]]`, RESOLVED (B3). Carries the tooltip
   *  because the jar's `<a title=...>` is `Url#getTooltip()`, which falls back
   *  to the url itself when none was written (`core/url/Url.ts:35-36`) —
   *  `sefako-72-jono850` emits both forms side by side. */
  url: ParticipantUrl | undefined;
}

/** A resolved participant hyperlink: the href and the tooltip the jar puts in
 *  both `title` and `xlink:title`. Shaped for `core/svg.ts#linkWrap`. */
export interface ParticipantUrl {
  readonly url: string;
  readonly tooltip: string;
}

/** `([%pLN_.@]+)` -- upstream's participant CODE class, the same one
 *  `CommandArrow`'s PART1CODE/PART2CODE use
 *  (`CommandParticipantA.java:63`). */
const CODE = String.raw`[\p{L}\p{N}_.@]+`;

/** `["%g"][^%g]+["%g"]` -- upstream's quoted FULL/display class, the same
 *  one every `CommandParticipantA*` grammar spells `[%g]([^%g]+)[%g]`
 *  (`CommandParticipantA.java:58`). Plain ASCII double quote only, matching
 *  this file's own pre-existing quote handling (no curly-quote support was
 *  ported here). */
const QUOTED = `"[^"]+"`;

/**
 * `"FULL" <<STEREO>> as CODE` -- a token order NO registered
 * `CommandParticipantA*` subclass accepts. Every one of the four upstream
 * grammars places `StereotypePattern.optional("STEREO")` immediately after
 * its CODE leaf, never between a quoted display and `as`:
 * `CommandParticipantA` reads `["FULL" as] CODE STEREO?` (the quoted FULL,
 * when present, precedes `as` with NOTHING allowed between it and `as`);
 * `A2` reads `CODE as "FULL" STEREO?` (FULL is quoted but sits AFTER `as`,
 * not before it); `A3` reads `FULL(unquoted) as CODE STEREO?`; `A4` reads
 * `"CODE" STEREO?` with no `as` clause at all. So `"DB 2" <<&file>> as Db2`
 * -- a quoted display, a stereotype, THEN `as CODE` -- matches none of the
 * four: bisected against the real jar (`scripts/oracle-render.sh`,
 * `database "DB 2" <<&file>> as Db2` / `<<$SpriteUsb>>` / `<<plain>>`, all
 * three stereotype shapes) renders `DESCRIPTION`, not `SEQUENCE`, for every
 * one -- confirming the refusal is the ORDERING, not the stereotype's
 * content. `database Db2 <<plain>>` (unquoted, no `as`, stereotype trailing
 * CODE per every grammar above) still renders `SEQUENCE`.
 *
 * This port's `parseParticipantDeclaration` previously had no such
 * restriction: {@link stripParticipantTail}'s stereo peel only recognises a
 * `<<...>>` run at the very END of the string, so `"DB 2" <<&file>> as Db2`
 * (stereotype in the MIDDLE) skipped that peel entirely and fell through
 * {@link parseParticipantName}'s unstructured last-resort branch, which
 * accepts ANY string verbatim as a literal id -- silently creating a
 * participant named `"DB 2" <<&file>> as Db2` rather than refusing the
 * line.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandParticipantA.java:52-69
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandParticipantA2.java:51-65
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandParticipantA3.java:51-65
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandParticipantA4.java:51-61
 */
const MISPLACED_STEREOTYPE_RE = new RegExp(String.raw`^${QUOTED}\s*<<.+?>>\s*as\s+${CODE}`, 'iu');

/**
 * Strip the tail every participant form shares, right to left.
 *
 * All four of `CommandParticipantA`/`A2`/`A3`/`A4` end with the same run:
 * `StereotypePattern.optional("STEREO")`, `getOrderRegex()`,
 * `UrlBuilder.OPTIONAL`, then `ColorParser.exp1()`
 * (`CommandParticipantA.java:63-69`, and the identical tails on the other
 * three). Peeling it off first is what lets the NAME forms below stay simple
 * -- and is why `participant Alice <<alice>>` used to fall through to the
 * bare-name branch and take the stereotype into the participant's identity,
 * so a later `Alice -> Bob` created a SECOND participant.
 */
function stripParticipantTail(rest: string): {
  head: string;
  color: string | undefined;
  stereotype: string | undefined;
  url: string | undefined;
} {
  let head = rest.trim();
  let color: string | undefined;
  let stereotype: string | undefined;
  let url: string | undefined;
  // `ColorParser.exp1()` (`CommandParticipantA.java:69`) is the SAME
  // `COLORS_REGEXP` the note-command family carries (T11, ubrr:
  // `sequence-color-grammar.ts`) -- a plain `#word`, a gradient
  // `#word<sep>word`, or the compound `key:value(;key:value)*` form, none
  // requiring a leading space (upstream has no `spaceOneOrMore()` leaf
  // between the previous group and COLOR). The narrower `/^(.*?)\s+(#\w+)$/`
  // this used to be missed every gradient/compound colour, silently
  // absorbing it into the fallback bare-CODE id instead -- jar-verified via
  // `xeroce-52-moso281`'s `participant bob #green|blue`.
  const colorRun = new RegExp(`^(.*?)\\s*(${SEQUENCE_COLOR})$`, 'u').exec(head);
  if (colorRun !== null) {
    head = colorRun[1]!.trim();
    color = colorRun[2];
  }
  // B3: the `[[...]]` run is CAPTURED now, not just peeled off. It was
  // discarded here and in both callers, which is why all 89 `<a>` elements in
  // the corpus were missing.
  const urlRun = /^(.*?)\s*(\[\[.*\]\])$/.exec(head);
  if (urlRun !== null) {
    head = urlRun[1]!.trim();
    url = urlRun[2];
  }
  const order = /^(.*?)\s+order\s+-?\d{1,7}$/i.exec(head);
  if (order !== null) head = order[1]!.trim();
  const stereo = /^(.*?)\s*(<<.+?>>)$/.exec(head);
  if (stereo !== null) {
    head = stereo[1]!.trim();
    stereotype = stereo[2];
  }
  return { head, color, stereotype, url };
}

/** `^([%pLN_.@]+)$` -- the bare-CODE form every one of `CommandParticipantA`
 *  /`A2`/`A3`/`A4` falls back to when no `"FULL" as`/`as "FULL"` prefix or
 *  suffix is present: A's mandatory trailing `CODE` leaf on its own
 *  (`CommandParticipantA.java:63`), taken with its `RegexOptional` FULL/as
 *  prefix absent. */
const BARE_CODE_RE = new RegExp(`^${CODE}$`, 'u');

/**
 * The NAME part, in upstream's four registered forms. Throws
 * {@link SequenceCommandRefusal} when `head` matches NONE of them --
 * including the bare-CODE fallback, which upstream's `CODE` leaf
 * (`[%pLN_.@]+`) cannot absorb a `-`, `>` or bare space. This port's
 * `participantCommand`/`createCommand` patterns are a single `(.+)$`
 * catch-all (unlike upstream's four separate, narrower grammars: none of
 * them can even MATCH a line whose "rest" isn't CODE/quoted-FULL shaped),
 * so this is where the missing narrowing has to happen instead (T11, ubrr).
 * Previously this fell back to accepting ANY leftover text as a literal id
 * -- e.g. `actor -> director` (a plain arrow line whose endpoint happens to
 * be the word "actor") was swallowed by `participantCommand` as a
 * declaration of a participant literally named `"-> director"`, and the
 * REAL arrow message was never dispatched at all: jar-verified via a bisect
 * against `bulixe-06-boge494`/`h-rnote-style`/`kotixe-11-cufa733`/
 * `note-color`/`pucini-86-goti091`/`seloli-77-rixi778` (all `actor ->
 * director`-shaped), where the real jar treats the line purely as a
 * message (upstream's `getCandidate()` finds NO participant-family match
 * at all, since none of A/A2/A3/A4's CODE/FULL grammars can consume `->
 * director`, and falls through to `CommandArrow`).
 */
function parseParticipantName(head: string): { id: string; display: string } {
  // 'iu' -- upstream compiles every command pattern with
  // `Pattern.CASE_INSENSITIVE` (`regex/Pattern2.java:114`, cited elsewhere
  // in this engine, e.g. `sequence-arrow-regex.ts`), so `"X" AS y` (any
  // case on the `as` literal) is valid upstream. Previously missing here:
  // exposed by T11's stricter fallback (jar-verified against
  // `gucare-93-petu502`'s `participant "Provider Global Settings" AS
  // PROVIDERSETTINGS`, which the real jar accepts).
  const a = new RegExp(String.raw`^"([^"]+)"\s+as\s+(${CODE})$`, 'iu').exec(head);
  if (a !== null) return { display: a[1]!, id: a[2]! };
  const a2 = new RegExp(String.raw`^(${CODE})\s+as\s+"([^"]+)"$`, 'iu').exec(head);
  if (a2 !== null) return { id: a2[1]!, display: a2[2]! };
  const a3 = new RegExp(String.raw`^(${CODE})\s+as\s+(${CODE})$`, 'iu').exec(head);
  if (a3 !== null) return { display: a3[1]!, id: a3[2]! };
  const a4 = /^"([^"]+)"$/.exec(head);
  if (a4 !== null) return { id: a4[1]!, display: a4[1]! };
  if (BARE_CODE_RE.test(head)) return { id: head, display: head };
  throw new SequenceCommandRefusal(`participant: "${head}" matches no CommandParticipantA/A2/A3/A4 grammar`);
}

/**
 * Parse the trailing text of a `participant|actor|...` command.
 *
 * Mirrors the four registered forms -- `["FULL" as] CODE`
 * (`CommandParticipantA`), `CODE as "FULL"` (`A2`), `FULL as CODE` (`A3`) and
 * `"CODE"` (`A4`) -- over the shared tail stripped by
 * {@link stripParticipantTail}.
 *
 * Throws {@link SequenceCommandRefusal} for {@link MISPLACED_STEREOTYPE_RE}
 * (see that constant) and, via {@link parseParticipantName}, for any `head`
 * that is not bare CODE and matches none of the four NAME forms either --
 * this port's `participantCommand`/`createCommand` patterns are a single
 * `(.+)` catch-all (unlike upstream's four separate, narrower grammars), so
 * a shape none of the four registered subclasses accepts would otherwise be
 * silently absorbed here instead of refusing the line.
 */
export function parseParticipantDeclaration(rest: string): ParticipantDeclaration {
  if (MISPLACED_STEREOTYPE_RE.test(rest)) {
    throw new SequenceCommandRefusal(
      'participant: no CommandParticipantA/A2/A3/A4 grammar allows a <<stereotype>> between a quoted display and "as CODE"',
    );
  }
  const { head, color, stereotype, url } = stripParticipantTail(rest);
  return { ...parseParticipantName(head), color, stereotype, url: participantUrlOf(url) };
}

/**
 * A participant's `[[...]]` run, resolved to href + tooltip (B3).
 *
 * `urlOf` (`sequence-parse-helpers.ts`) reduces the same `Url` to its href
 * alone, which is all a MESSAGE needs — a message url is parsed and
 * deliberately not drawn (`renderer-message.ts`). A participant's reaches
 * the SVG, and the jar puts the tooltip in `title` and `xlink:title`, so
 * both halves survive here.
 */
export function participantUrlOf(raw: string | undefined): ParticipantUrl | undefined {
  if (raw === undefined) return undefined;
  const resolved = new UrlBuilder(null, UrlMode.STRICT).getUrl(raw);
  if (resolved === null || resolved === undefined) return undefined;
  return { url: resolved.getUrl(), tooltip: resolved.getTooltip() };
}
