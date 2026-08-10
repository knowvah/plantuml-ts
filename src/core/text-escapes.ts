/**
 * Shared text-escape resolution — `<U+XXXX>`/`<U+XXXXX>` unicode-codepoint
 * escapes and `&#NNN;` HTML numeric character references, resolved to their
 * literal glyph.
 *
 * Faithful (single-pass, char-by-char) port of the two branches of `AtomText
 * .manageSpecialChars` (klimt/creole/legacy/AtomText.java:89-163) — this is
 * the shared creole atom engine's text-decode step, applied to every text
 * atom the jar draws (member/note/entity-display text alike), NOT a
 * description-diagram-specific mechanism. Originally landed description-only
 * (mission I4c, `descdiagram/parse-helpers.ts`); promoted to `core/` (G2/N21)
 * so the class engine's note text can share it.
 *
 * ALL FOUR of upstream's branches are now ported (`AtomText.java:89-163`):
 * `&#NNN;`, `<U+XXXX>`, `~@start`, and `\t`. The last two were previously
 * skipped as unexercised; `\t` turned out to be load-bearing once the
 * `[ … ]` element body stopped routing through `Display.getWithNewlines`
 * (which had been converting it as a side effect) — see
 * `component/fariba-82-xolu802`.
 */
export function resolveTextEscapes(s: string): string {
  let result = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (c === '&') {
      const m = /^&#(\d+);/.exec(s.slice(i));
      if (m !== null) {
        result += String.fromCodePoint(Number.parseInt(m[1]!, 10));
        i += m[0].length;
        continue;
      }
    } else if (c === '<') {
      const m = /^<U\+([0-9a-fA-F]{4,5})>/.exec(s.slice(i));
      if (m !== null) {
        result += String.fromCodePoint(Number.parseInt(m[1]!, 16));
        i += m[0].length;
        continue;
      }
    } else if (c === '~') {
      // `~@start` -> `@start` (java:132-138) — the escape that lets a diagram
      // quote its own opening directive without starting a nested block.
      if (s.startsWith('~@start', i)) {
        result += '@start';
        i += 7;
        continue;
      }
    } else if (c === '\\') {
      // `\t` -> a REAL tab (java:140-145). Note there is deliberately NO `\n`
      // branch here: a newline escape is `Display.getWithNewlines`'s business
      // and applies only on the single-line display path, which is why a
      // literal `\n` survives inside a `[ … ]` element body while a `\t` in
      // the same body still becomes a tab (`component/fariba-82-xolu802`).
      if (s[i + 1] === 't') {
        result += '\t';
        i += 2;
        continue;
      }
    }
    result += c;
    i++;
  }
  return result;
}
