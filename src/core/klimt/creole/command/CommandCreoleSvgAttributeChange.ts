/**
 * CommandCreoleSvgAttributeChange — `<text name=value …>inner</text>` and its
 * EOL twin (no closing tag): the tag is not drawn, `inner` is drawn as creole
 * under a font whose `svgAttributes` carry the pairs, and every `<text>` the
 * jar emits for it writes them as literal attributes
 * (`SvgGraphics.java:737-738`).
 *
 * ```java
 * final FontConfiguration fc1 = stripe.getActualFontConfiguration();
 * FontConfiguration fc2 = fc1;
 * if (m.group(2) != null)
 *     fc2 = fc2.changeAttributes(SvgAttributes.build(m.group(2)));
 * stripe.setActualFontConfiguration(fc2);
 * stripe.analyzeAndAdd(m.group(3));
 * stripe.setActualFontConfiguration(fc1);
 * return m.group(1).length();
 * ```
 *
 * Upstream registers `create()` (not `createEol()`) behind
 * `SecurityUtils.allowSvgText()`, which returns `true`
 * (SecurityUtils.java:258-260), right after the url command
 * (`CommandCreoleBuilder.java:119-122`).
 *
 * `Pattern2.cmpile` is CASE_INSENSITIVE (Pattern2.java:122). `.` is
 * Java's, which also excludes U+0085. The EOL `$` is not widened to Java's
 * "before a final line terminator": a creole stripe is one line.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleSvgAttributeChange.java:46-97
 */
import { changeAttributes, type FontConfiguration } from '../../shape/UText.js';
import { SvgAttributes } from '../../SvgAttributes.js';
import type { Command, StripeBuilder } from './Command.js';

/** `Splitter.svgAttributePattern` (Splitter.java:60), `\s` as Java defines it. */
const SVG_ATTRIBUTE_TAG = '<text[ \\t\\n\\x0B\\f\\r:]+([^>]+)/?>';
/** Java's `.` (no line terminator). */
const ANY = '[^\\n\\r\\u0085\\u2028\\u2029]';

/** `^(` + fontPattern + `(.*?)\</text\>)` (java:50). */
const PATTERN = new RegExp(`^(${SVG_ATTRIBUTE_TAG}(${ANY}*?)</text>)`, 'i');
/** `^(` + fontPattern + `(.*))$` (java:51). */
const PATTERN_EOL = new RegExp(`^(${SVG_ATTRIBUTE_TAG}(${ANY}*))$`, 'i');

/** `Matcher2#find` with the region starting at `pos` (Matcher2.java:56-62). */
function createForm(pattern: RegExp): Command {
  return {
    starters: ['<t'],
    matchingSize(line, pos) {
      const m = pattern.exec(line.slice(pos));
      return m === null ? 0 : m[1]!.length;
    },
    executeAndAdvance(line, pos, stripe: StripeBuilder) {
      const m = pattern.exec(line.slice(pos));
      if (m === null) throw new Error('IllegalStateException');
      const fc1: FontConfiguration = stripe.getActualFontConfiguration();
      stripe.setActualFontConfiguration(changeAttributes(fc1, SvgAttributes.build(m[2]!)));
      stripe.analyzeAndAddInline(m[3]!);
      stripe.setActualFontConfiguration(fc1);
      return m[1]!.length;
    },
  };
}

/** Upstream: `create()` (java:60-62) -- the only form `CommandCreoleBuilder`
 *  registers (java:122). */
export function createSvgAttributeChangeCommand(): Command {
  return createForm(PATTERN);
}

/** Upstream: `createEol()` (java:64-66). Ported with its pattern but, as
 *  upstream, registered nowhere: `CommandCreoleBuilder.java:119-122` adds
 *  `create()` alone, so an unclosed `<text k=v>` is drawn literally. */
export function createSvgAttributeChangeEolCommand(): Command {
  return createForm(PATTERN_EOL);
}
