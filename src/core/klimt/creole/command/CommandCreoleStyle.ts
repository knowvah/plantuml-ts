/**
 * CommandCreoleStyle — the BOLD/ITALIC/UNDERLINE/STRIKE/WAVE inline style
 * commands: `**text**`/`//text//`/`__text__`/`--text--`/`~~text~~` (pure
 * Creole double-punctuation) and `<b>text</b>`/`<b>text to end of line`
 * (HTML-tag-style, with or without a closing tag).
 *
 * Upstream: klimt/creole/command/CommandCreoleStyle.java — three factories
 * (`createCreole`/`createLegacy`/`createLegacyEol`), each building a
 * `com.plantuml.ubrex.UnicodeBracketedExpression` (a whole bespoke
 * bracketed-regex DSL/engine — `com/plantuml/ubrex/*`, ~30 files) from a
 * `FontStyle`'s `getUbrexCreoleSyntax`/`getUbrexActivationPattern`/
 * `getUbrexDeactivationPattern` strings, then matching/capturing through it.
 *
 * Scope decision (journaled, `plans/e2r-creole/decision-journal.md`):
 * `com.plantuml.ubrex` is a general-purpose pattern-matching ENGINE, not
 * creole-specific logic — porting it symbol-for-symbol (its own
 * Challenge/Repetition/CharClass/LookAround hierarchy) is out of this
 * mission's charter the same way @knowvah/dot-engine is out of E2r's charter (a
 * foundational dependency, not diagram behavior). This file instead
 * implements the exact OBSERABLE match semantics the three factories
 * produce for L1's five styles directly:
 * - creole form: literal syntax token, then the SHORTEST (lazy) run of 1+
 *   chars up to the next occurrence of the same token (upstream:
 *   `ChallengeOneOrMoreUpToOldVersion` — verified via
 *   `ubrex/ChallengeOneOrMoreUpToOldVersion.java`'s `runChallenge`: advance
 *   one origin-match at a time, testing the end pattern after each).
 * - legacy form: an activation tag, then the shortest (lazy) run of 0+ chars
 *   up to a deactivation tag (upstream: `ChallengeUpTo` — zero-or-more,
 *   unlike the creole form's one-or-more; `ChallengeUpTo.runChallenge`
 *   scans one character forward at a time testing the end pattern, and can
 *   accept a zero-length match immediately).
 * - legacyEol form: an activation tag, then 1+ chars (greedy — upstream:
 *   `ChallengeOneOrMore`) to the end of the line, no closing tag needed.
 *
 * `matchingSize`/`executeAndAdvance` are two separate upstream calls that
 * each independently re-run the ubrex match (`CommandCreoleStyle.java`'s own
 * shape) — this port keeps that same two-call shape (`match()` invoked once
 * per method) rather than caching, matching upstream's actual
 * cost/simplicity trade-off for what are always short (one display line)
 * strings.
 *
 * A2s/B6 adds the colon-suffixed EXTENDED-COLOR activation arm for the
 * styles upstream allows it on (`FontStyle#canHaveExtendedColor`:
 * UNDERLINE, WAVE, STRIKE, BACKCOLOR) plus the BACKCOLOR command itself
 * (`<back:red>...</back>`, registered legacy+legacyEol only — no
 * creole-pure form; `CommandCreoleBuilder.java`:96-97). The color grammar
 * follows the UBREX activation patterns (`FontStyle#getUbrexActivationPattern`,
 * java :113-139) — the form `CommandCreoleStyle.java`'s ctor actually
 * compiles — NOT `getRegexActivationPattern` (:88-111, consumed only by
 * `Splitter.java`). The two disagree on BACKCOLOR: regex allows `#?\w+`
 * halves; ubrex allows `#hex6|\w+` first and `hex6|\w+` (no `#`) second.
 * Jar probe 2026-08-04 (mission A2s F-F): `<back:red-green>` consumed,
 * `<back:#FF0000-#00FF00>` / `<back:#red>` / `<b:#FF0000>` all raw —
 * ubrex wins, and that is what `ACTIVATION_SOURCE` below encodes.
 *
 * cdd-B7FU-R1 closes the last gap: the colour arm now CAPTURES its value
 * (upstream's ubrex `〶$XC=` named group) and `getExtendedColor(match)`
 * (`CommandCreoleStyle.java:91-99`) hands it to `AddStyle(style,
 * extendedColor)`, which applies it via `FontConfiguration
 * #changeExtendedColor`. The capture is gated on `tryExtendedColor`
 * exactly as upstream gates it — true for the legacy/legacyEol factories
 * (`createLegacy`/`createLegacyEol`, java:72-82, both pass
 * `style.canHaveExtendedColor()`), false for `createCreole` (java:68-71),
 * so `__text__` can never carry one. Upstream resolves the token through
 * `HColorSet.instance().getColorOrWhite(...)`; this port stores the RAW
 * token on the configuration and resolves at SVG-emission time, per
 * `paint.ts`'s own documented "stored verbatim, interpreted late" design
 * (`$XC` for BACKCOLOR spans the whole gradient token, `FontStyle.java:
 * 128-133`, so a `<back:red|blue>` value survives intact to the driver).
 * Sizing is unaffected: colors never change text metrics.
 */
import { FontStyle, type FontConfiguration } from '../../shape/UText.js';
import type { Command, StripeBuilder } from './Command.js';
import { addFontStyle } from './AddStyle.js';

interface MatchResult {
  readonly fullLength: number;
  readonly inner: string;
  /** The activation tag's captured `$XC` colour token, `undefined` when the
   *  optional arm did not participate (upstream: `matcher.findValuesByKey
   *  ("XC")` returning an empty list, `CommandCreoleStyle.java:92-95`). */
  readonly extendedColor?: string;
}

/** Creole form: literal `syntax` + shortest 1+-char run up to the NEXT
 *  occurrence of `syntax` (upstream: `ChallengeOneOrMoreUpToOldVersion`). */
function matchCreole(syntax: string, line: string, pos: number): MatchResult | null {
  if (line.slice(pos, pos + syntax.length) !== syntax) return null;
  const afterOpen = pos + syntax.length;
  const closeIdx = line.indexOf(syntax, afterOpen + 1);
  if (closeIdx === -1) return null;
  return { inner: line.slice(afterOpen, closeIdx), fullLength: closeIdx + syntax.length - pos };
}

/** Legacy form: `activation` + shortest 0+-char run up to `deactivation`
 *  (upstream: `ChallengeUpTo`). */
function matchLegacy(activation: RegExp, deactivation: RegExp, line: string, pos: number): MatchResult | null {
  const openMatch = activation.exec(line.slice(pos));
  if (openMatch === null || openMatch.index !== 0) return null;
  const afterOpen = pos + openMatch[0].length;
  const xc = extendedColorField(openMatch);
  for (let i = afterOpen; i <= line.length; i++) {
    const closeMatch = deactivation.exec(line.slice(i));
    if (closeMatch !== null && closeMatch.index === 0) {
      return { inner: line.slice(afterOpen, i), fullLength: i + closeMatch[0].length - pos, ...xc };
    }
  }
  return null;
}

/** Upstream `CommandCreoleStyle#getExtendedColor(UMatcher)`'s capture half
 *  (java:91-99): the activation pattern's single `$XC` group, present only
 *  for a `canHaveExtendedColor` style whose optional `:colour` arm actually
 *  participated. Spread into the result so the field stays ABSENT (not
 *  `undefined`-valued) for every colourless match. */
function extendedColorField(openMatch: RegExpExecArray): { extendedColor?: string } {
  const captured = openMatch[1];
  return captured === undefined ? {} : { extendedColor: captured };
}

/** LegacyEol form: `activation` + 1+ chars to end of line, greedy, no
 *  closing tag (upstream: `ChallengeOneOrMore`). */
function matchLegacyEol(activation: RegExp, line: string, pos: number): MatchResult | null {
  const openMatch = activation.exec(line.slice(pos));
  if (openMatch === null || openMatch.index !== 0) return null;
  const afterOpen = pos + openMatch[0].length;
  if (afterOpen >= line.length) return null;
  return { inner: line.slice(afterOpen), fullLength: line.length - pos, ...extendedColorField(openMatch) };
}

/** Upstream `CommandCreoleStyle#executeAndAdvance`'s body (java:101-116):
 *  `new AddStyle(style, getExtendedColor(matcher)).apply(fc1)`, recurse,
 *  restore. `tryExtendedColor` is the ctor flag upstream sets from
 *  `style.canHaveExtendedColor()` for the two legacy factories and to
 *  `false` for `createCreole` (java:68-82) — with it false the captured
 *  value is discarded, exactly as `getExtendedColor` returns `null`. */
function applyStyleAndRecurse(
  style: FontStyle,
  match: MatchResult,
  stripe: StripeBuilder,
  tryExtendedColor: boolean,
): void {
  const saved: FontConfiguration = stripe.getActualFontConfiguration();
  const extendedColor = tryExtendedColor ? match.extendedColor : undefined;
  stripe.setActualFontConfiguration(addFontStyle(saved, style, extendedColor));
  stripe.analyzeAndAddInline(match.inner);
  stripe.setActualFontConfiguration(saved);
}

/** Upstream `FontStyle#canHaveExtendedColor` (`FontStyle.java:191-205`). */
function canHaveExtendedColor(style: FontStyle): boolean {
  return (
    style === FontStyle.UNDERLINE ||
    style === FontStyle.WAVE ||
    style === FontStyle.BACKCOLOR ||
    style === FontStyle.STRIKE
  );
}

/** Upstream: `FontStyle#getUbrexCreoleSyntax` — the pure-Creole
 *  double-punctuation token per style. `undefined` styles (none, for L1's
 *  five) would mean "no creole-pure form"; every L1 style has one. */
const CREOLE_SYNTAX: Partial<Record<FontStyle, string>> = {
  [FontStyle.BOLD]: '**',
  [FontStyle.ITALIC]: '//',
  [FontStyle.UNDERLINE]: '__',
  [FontStyle.STRIKE]: '--',
  [FontStyle.WAVE]: '~~',
};

/** Upstream: `FontStyle#getUbrexActivationPattern`/`getUbrexDeactivationPattern`
 *  (java :113-164). The `canHaveExtendedColor` styles (java :191-205:
 *  UNDERLINE, WAVE, STRIKE, BACKCOLOR) carry the optional `:color` arm —
 *  ubrex `〇?〘:〶$XC=【#〇{6}hex┇〇+〴w】〙` = `(?::(?:#hex6|\w+))?`; BACKCOLOR
 *  additionally allows a gradient second half `〇?〘「-\|/」【〇{6}hex┇〇+〴w】〙`
 *  = `(?:[-\\|/](?:hex6|\w+))?` — NO leading `#` on the second half (see
 *  module doc comment's jar probe). Regex SOURCE strings (not literals) per
 *  this project's complexity-hook workaround for `<`/`>` in a pattern.
 *
 *  cdd-B7FU-R1: the colour half is now a CAPTURING group — upstream's
 *  `〶$XC=` names it, and `getExtendedColor(matcher)` reads it back. Every
 *  activation pattern below has AT MOST this one capturing group, so
 *  `exec(...)[1]` is unambiguously `$XC` for all five styles. */
const EXTENDED_COLOR_ARM = '(?::(#[0-9a-fA-F]{6}|\\w+))?';

const ACTIVATION_SOURCE: Record<string, string> = {
  [FontStyle.BOLD]: '^<[bB]>',
  [FontStyle.ITALIC]: '^<[iI]>',
  [FontStyle.UNDERLINE]: `^<[uU]${EXTENDED_COLOR_ARM}>`,
  [FontStyle.STRIKE]: `^<(?:strike|STRIKE|s|S|del|DEL)${EXTENDED_COLOR_ARM}>`,
  [FontStyle.WAVE]: `^<[wW]${EXTENDED_COLOR_ARM}>`,
  // The capture spans the WHOLE colour token, gradient half included:
  // upstream's `$XC=〘 【#hex6┇\w+】 〇?〘「-\|/」【hex6┇\w+】〙 〙` wraps both
  // halves in the ONE named group (`FontStyle.java:128-133`), so
  // `<back:red|blue>` hands `HColorSet#getColorOrWhite` the gradient token.
  [FontStyle.BACKCOLOR]: '^<[bB][aA][cC][kK](?::((?:#[0-9a-fA-F]{6}|\\w+)(?:[-\\\\|/](?:[0-9a-fA-F]{6}|\\w+))?))?>',
  // cdd-T25: `FontStyle.java:114-115`'s ubrex activation pattern
  // (`<「pP」「lL」「aA」「iI」「nN」>`) -- no `canHaveExtendedColor` arm (PLAIN
  // is absent from that method's list, `FontStyle.java:191-205`), matching
  // BOLD/ITALIC's plain `<tag>` shape.
  [FontStyle.PLAIN]: '^<[pP][lL][aA][iI][nN]>',
};

const DEACTIVATION_SOURCE: Record<string, string> = {
  [FontStyle.BOLD]: '^</[bB]>',
  [FontStyle.ITALIC]: '^</[iI]>',
  [FontStyle.UNDERLINE]: '^</[uU]>',
  [FontStyle.STRIKE]: '^</(?:strike|STRIKE|s|S|del|DEL)>',
  [FontStyle.WAVE]: '^</[wW]>',
  [FontStyle.BACKCOLOR]: '^</[bB][aA][cC][kK]>',
  // cdd-T25: `FontStyle.java:142-143`'s ubrex deactivation pattern
  // (`</「pP」「lL」「aA」「iI」「nN」>`).
  [FontStyle.PLAIN]: '^</[pP][lL][aA][iI][nN]>',
};

/** Upstream: `FontStyle#starters(isCreolePure)`, the `false` (legacy)
 *  branch. Ported VERBATIM, including WAVE's own single-case asymmetry
 *  (`Arrays.asList("<w")` — no `"<W"` entry, even though the activation
 *  pattern itself matches both cases) — see this project's porting
 *  discipline: preserve upstream's exact starter list, not a "corrected"
 *  one. */
const LEGACY_STARTERS: Record<string, readonly string[]> = {
  [FontStyle.BOLD]: ['<b', '<B'],
  [FontStyle.ITALIC]: ['<i', '<I'],
  [FontStyle.UNDERLINE]: ['<u', '<U'],
  [FontStyle.STRIKE]: ['<s', '<S', '<d', '<D'],
  [FontStyle.WAVE]: ['<w'],
  [FontStyle.BACKCOLOR]: ['<b', '<B'],
  // cdd-T25: `FontStyle.java:47-48` -- `Arrays.asList("<p", "<P")`.
  [FontStyle.PLAIN]: ['<p', '<P'],
};

function createCreoleForm(style: FontStyle): Command {
  const syntax = CREOLE_SYNTAX[style];
  if (syntax === undefined) throw new Error(`CommandCreoleStyle: no creole-pure syntax for ${style}`);
  return {
    starters: [syntax],
    matchingSize(line, pos) {
      const m = matchCreole(syntax, line, pos);
      return m === null ? 0 : m.inner.length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = matchCreole(syntax, line, pos);
      if (m === null) return 0;
      // `createCreole` passes `tryExtendedColor = false` (java:68-71).
      applyStyleAndRecurse(style, m, stripe, false);
      return m.fullLength;
    },
  };
}

function createLegacyForm(style: FontStyle): Command {
  const activation = new RegExp(ACTIVATION_SOURCE[style]!);
  const deactivation = new RegExp(DEACTIVATION_SOURCE[style]!);
  return {
    starters: LEGACY_STARTERS[style]!,
    matchingSize(line, pos) {
      const m = matchLegacy(activation, deactivation, line, pos);
      return m === null ? 0 : m.inner.length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = matchLegacy(activation, deactivation, line, pos);
      if (m === null) return 0;
      applyStyleAndRecurse(style, m, stripe, canHaveExtendedColor(style));
      return m.fullLength;
    },
  };
}

function createLegacyEolForm(style: FontStyle): Command {
  const activation = new RegExp(ACTIVATION_SOURCE[style]!);
  return {
    starters: LEGACY_STARTERS[style]!,
    matchingSize(line, pos) {
      const m = matchLegacyEol(activation, line, pos);
      return m === null ? 0 : m.inner.length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = matchLegacyEol(activation, line, pos);
      if (m === null) return 0;
      applyStyleAndRecurse(style, m, stripe, canHaveExtendedColor(style));
      return m.fullLength;
    },
  };
}

/** Upstream: `CommandCreoleBuilder`'s per-style `addCommand` triplet
 *  (`createCreole`, `createLegacy`, `createLegacyEol`). Returns all three
 *  Commands for one style, in upstream's exact registration order (matters
 *  for `searchCommand`'s "first match wins" tie-break among Commands
 *  sharing a 2-char starter — see `legacy/StripeSimple.ts`). */
export function createStyleCommands(style: FontStyle): readonly Command[] {
  return [createCreoleForm(style), createLegacyForm(style), createLegacyEolForm(style)];
}

/** A2s R2a: the OTHER-map UNDERLINE registration (CommandCreoleBuilder
 *  java:85-89) — the creole-pure `__` form is gated `if (modeSimpleLine ==
 *  CreoleMode.FULL)`; every non-FULL map registers the legacy pair only,
 *  in the same relative order. */
export function createStyleCommandsWithoutCreoleForm(style: FontStyle): readonly Command[] {
  return [createLegacyForm(style), createLegacyEolForm(style)];
}

/** Upstream: `CommandCreoleBuilder`'s BACKCOLOR pair (java :96-97) —
 *  `createLegacy` + `createLegacyEol` ONLY, no creole-pure form
 *  (`FontStyle#getUbrexCreoleSyntax` throws for BACKCOLOR). Registered
 *  AFTER the five style triplets, so `<b>`/`<B>` bold — which shares the
 *  `<b` starter (`FontStyle#starters`, java :69-70) — is tried first and
 *  `<back...>` falls through to these via `searchCommand`'s
 *  first-non-zero-`matchingSize` scan. */
export function createBackcolorCommands(): readonly Command[] {
  return [createLegacyForm(FontStyle.BACKCOLOR), createLegacyEolForm(FontStyle.BACKCOLOR)];
}
