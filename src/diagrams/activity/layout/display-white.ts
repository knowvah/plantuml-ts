/**
 * `Display#isWhite` (`klimt/creole/Display.java:170-175`) for a parsed
 * condition: no line, or ONE line of only `\s` (Java's `[ \t\n\x0B\f\r]`).
 * The while/repeat/switch tiles draw such a test as
 * `TextBlockUtils.empty(0, 0)` (`FtileWhile.java:124`, `FtileRepeat.java:127`,
 * `FtileFactoryDelegatorSwitch.java:142`), while the parser keeps the
 * capture verbatim (`while ( )` -> `" "`).
 */
const ONLY_WHITESPACE = /^[ \t\n\x0B\f\r]*$/;

/** `test.isWhite() ? "" : test` -- the text the condition block draws. */
export function nonWhiteTest(condition: string): string {
  return !condition.includes('\n') && ONLY_WHITESPACE.test(condition) ? '' : condition;
}
