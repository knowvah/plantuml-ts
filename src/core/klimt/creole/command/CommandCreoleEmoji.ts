/**
 * CommandCreoleEmoji — the `<:name:>` / `<#color:name:>` creole emoji atom.
 *
 * Upstream: `klimt/creole/command/CommandCreoleEmoji.java` — starters
 * `<#`/`<:`, pattern `^(Splitter.emojiPattern)` where
 * `emojiPattern = \<(#\w+)?:([0-9a-z][0-9_a-z]*):scaleOrColor\>`
 * (`command/Splitter.java:71`, `scaleOrColor` :62-68). `executeAndAdvance`
 * reads `colorName1 = group(2)` (the `<#color:` prefix form, '#'
 * INCLUDED), `emoji = group(3)`, `scale = Parser.getScale(group(4), 1)`,
 * `colorName2 = Parser.getColor(group(4))` (the `{scale=..,color=..}`
 * suffix form) — prefix color wins — then `stripe.addEmoji(emoji, scale,
 * colorName)` (java:73-88). Registered in `CommandCreoleBuilder`'s ctor at
 * java:109 for BOTH the FULL and OTHER maps (no mode gate), so member rows
 * (SIMPLE_LINE) and class-name headers (FULL_BUT_UNDERSCORE) both parse it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleEmoji.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/Splitter.java:62-71
 */
import type { Command } from './Command.js';
import { getColor, getScale } from '../Parser.js';

// `Splitter.scaleOrColor` (java:62-68) + `Splitter.emojiPattern` (java:71),
// ported verbatim. String-built (not a regex literal) so the complexity
// hook's lizard parser doesn't mis-tokenize it (memory: complexity-hook
// workarounds).
const SCALE_OR_COLOR = String.raw`([\{,]?(?:(?:scale=|\*)[0-9.]+)?(?:,?color[= :](?:#[0-9a-fA-F]{1,8}|\w+))?\}?)?`;
const EMOJI_RE = new RegExp(String.raw`^(<(#\w+)?:([0-9a-z][0-9_a-z]*):` + SCALE_OR_COLOR + '>)');

/** Upstream: `CommandCreoleEmoji.create()`. */
export function createEmojiCommand(): Command {
  return {
    starters: ['<#', '<:'],
    matchingSize(line, pos) {
      const m = EMOJI_RE.exec(line.slice(pos));
      return m === null ? 0 : m[1]!.length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = EMOJI_RE.exec(line.slice(pos));
      if (m === null) return 0;
      const colorName1 = m[2];
      const emoji = m[3]!;
      const scale = getScale(m[4], 1);
      const colorName2 = getColor(m[4]);
      const colorName = colorName1 ?? colorName2;
      stripe.addEmoji(emoji, scale, colorName ?? null);
      return m[1]!.length;
    },
  };
}
