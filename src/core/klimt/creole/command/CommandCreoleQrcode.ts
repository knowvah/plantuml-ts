/**
 * CommandCreoleQrcode — the creole `<qrcode:text>` / `<qrcode text{scale=N}>`
 * tag: one image atom (`AtomImg.createQrcode`, via `stripe.addQrcode`).
 *
 * Upstream: starter `"<q"`, pattern `^(` + `Splitter.qrcodePattern` + `)`
 * compiled by `Pattern2.cmpile`, which compiles CASE_INSENSITIVE
 * (Pattern2.java:114); group 2 is the text, group 3 the optional
 * `{scale=N}`, read by `Parser.getScale(group 3, 3)` (whose own pattern is
 * case-sensitive, so `{SCALE=2}` keeps the default 3). Java's `\s` is ASCII
 * whitespace, spelled out below. Registered after the exposant commands
 * (CommandCreoleBuilder.java:107).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleQrcode.java
 */
import { getScale } from '../Parser.js';
import type { Command } from './Command.js';

/** `Splitter.qrcodePattern` (Splitter.java:56), ported as a source string. */
const QRCODE_SOURCE = '<qrcode[ \\t\\n\\x0B\\f\\r:]+([^>{}]+)(\\{scale=(?:[0-9.]+)\\})?>';

/** `Pattern2.cmpile("^(" + Splitter.qrcodePattern + ")")`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleQrcode.java:54 */
const PATTERN = new RegExp(`^(${QRCODE_SOURCE})`, 'i');

/** `Parser.getScale(m.group(3), 3)`'s default.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleQrcode.java:79 */
const DEFAULT_SCALE = 3;

/** `CommandCreoleQrcode.create()`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleQrcode.java:59-82 */
export function createQrcodeCommand(): Command {
  return {
    starters: ['<q'],
    matchingSize(line, pos) {
      const m = PATTERN.exec(line.slice(pos));
      return m === null ? 0 : m[1]!.length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = PATTERN.exec(line.slice(pos));
      if (m === null) throw new Error('IllegalStateException');
      stripe.addQrcode(m[2]!, getScale(m[3], DEFAULT_SCALE));
      return m[1]!.length;
    },
  };
}
