/**
 * CommandCreoleExposantChange — `<sup>text</sup>` (EXPOSANT) and
 * `<sub>text</sub>` (INDICE).
 *
 * Upstream: `klimt/creole/command/CommandCreoleExposantChange.java`. One
 * class, parameterized by `FontPosition`; `create` builds the ubrex source
 * from `position.getHtmlTag()` (java:65-70) so the two registered instances
 * differ only by tag name and the position they set.
 *
 * ## The ubrex pattern, ported to a regex (decisions.md#D4)
 *
 * Upstream matches with `UnicodeBracketedExpression.build("<" + htmlTag +
 * ">〶$V=〄>〘</" + htmlTag + ">〙")` (java:67). Read against
 * `com/plantuml/ubrex/AtomicParser.java`:
 * - `〶$V=` (`manageNamed`, AtomicParser.java:241-258) names the NEXT parsed
 *   challenge `V`;
 * - `〄>` (`manageUpTo`, AtomicParser.java:166-173) is "advance up to the
 *   first position where the following challenge matches", returning
 *   `[ChallengeUpTo(p2), p2]` — the named group captures ONLY the
 *   `ChallengeUpTo`, and `p2` is consumed at the parent level (upstream's own
 *   "terrible hack" comment, java:171-172);
 * - `〘</sup>〙` (`manageGroup`, AtomicParser.java:205-212) is that `p2`: the
 *   literal closing tag.
 * `ChallengeUpTo#runChallenge` (ChallengeUpTo.java:46-56) scans forward one
 * character at a time and returns the FIRST position where `p2` matches, so
 * the capture is LAZY and may be empty.
 *
 * The exact JS equivalent is therefore `^<sup>(.*?)</sup>` — non-greedy is
 * `ChallengeUpTo`'s first-match scan, and the whole match is `V` plus the
 * closing tag, i.e. upstream's `matcher.getAcceptedMatch()`.
 *
 * Two ubrex rules are not expressible in the regex and do not need to be on
 * this path: (a) `ChallengeUpTo` scans to `string.length()` inclusive over an
 * arbitrary `TextNavigator`, whereas `.` excludes `\n` — a creole physical
 * line never contains a newline, so the two agree; (b) ubrex literals are
 * case-sensitive by default and so is this regex (no `i` flag), matching
 * upstream's uncased pattern and its lowercase-only `<s` starter.
 *
 * `matchingSize` returns the INNER value's length, not the full match —
 * upstream java:72-78 (`value.get(0).length()`). That is a real behavioural
 * rule here, not the arbitrary per-command choice `CommandCreoleSizeChange
 * .ts` documents diverging from: an empty capture (`<sup></sup>`) makes
 * upstream's `searchCommand` see 0 and fall through to literal text, and this
 * port reproduces that.
 *
 * There is no EOL (unclosed-tag) form upstream — `create` is the only factory
 * — so `<sup>` with no `</sup>` renders as literal text.
 */
import type { Command, StripeBuilder } from './Command.js';
import type { FontConfiguration } from '../../shape/UText.js';
import { fontPositionHtmlTag, type FontPosition } from '../../font/FontPosition.js';

interface ExposantMatch {
  readonly fullLength: number;
  readonly inner: string;
}

/** Upstream `starters()` (java:56-58): `Collections.singleton("<s")` — the
 *  same two-character prefix `CommandCreoleSizeChange` and the legacy STRIKE
 *  forms claim; `searchCommand`'s first-non-zero-`matchingSize` scan
 *  disambiguates. */
const STARTERS: readonly string[] = ['<s'];

/** The ubrex source of java:67, ported to a regex source string (never a
 *  regex literal — the `<`/`>` complexity-hook workaround this repo's other
 *  command ports use). */
function tagPatternSource(htmlTag: 'sup' | 'sub'): string {
  return `^<${htmlTag}>(.*?)</${htmlTag}>`;
}

function matchExposant(re: RegExp, line: string, pos: number): ExposantMatch | null {
  const m = re.exec(line.slice(pos));
  if (m === null) return null;
  return { fullLength: m[0].length, inner: m[1]! };
}

/** Upstream `executeAndAdvance`'s body (java:81-96): save the stripe's font
 *  configuration, apply `changeFontPosition(position)`, recurse into the
 *  captured inner text, restore, and advance by the accepted match. */
function applyPositionAndRecurse(position: FontPosition, inner: string, stripe: StripeBuilder): void {
  const saved: FontConfiguration = stripe.getActualFontConfiguration();
  stripe.setActualFontConfiguration({ ...saved, fontPosition: position });
  stripe.analyzeAndAddInline(inner);
  stripe.setActualFontConfiguration(saved);
}

/** Upstream: `CommandCreoleExposantChange.create(FontPosition)` (java:65-70). */
export function createExposantChangeCommand(position: FontPosition): Command {
  const re = new RegExp(tagPatternSource(fontPositionHtmlTag(position)));
  return {
    starters: STARTERS,
    matchingSize(line, pos) {
      const m = matchExposant(re, line, pos);
      return m === null ? 0 : m.inner.length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = matchExposant(re, line, pos);
      if (m === null) return 0;
      applyPositionAndRecurse(position, m.inner, stripe);
      return m.fullLength;
    },
  };
}
