import { describe, expect, it } from 'vitest';
import { createEmojiCommand } from '../../../../../../src/core/klimt/creole/command/CommandCreoleEmoji.js';

// `Pattern2.cmpile` compiles every pattern CASE_INSENSITIVE
// (regex/Pattern2.java:114), so `Splitter.emojiPattern`'s `[0-9a-z]` also
// takes uppercase hex: the jar draws `<:1F607:>` (Emoji.retrieve lowercases
// the name, Emoji.java). Seen in sequence fixture dekapo-15-vama907.
describe('CommandCreoleEmoji pattern', () => {
  const command = createEmojiCommand();

  it('matches a lowercase code point', () => {
    expect(command.matchingSize('<:1f607:>is', 0)).toBe('<:1f607:>'.length);
  });

  it('matches an uppercase code point, as Pattern2 CASE_INSENSITIVE does', () => {
    expect(command.matchingSize('<:1F607:>is', 0)).toBe('<:1F607:>'.length);
  });

  it('matches an uppercase code point behind a colour prefix', () => {
    expect(command.matchingSize('<#0:1F607:>', 0)).toBe('<#0:1F607:>'.length);
  });
});
