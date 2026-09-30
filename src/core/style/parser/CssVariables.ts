/**
 * CssVariables — the `--name value` declarations of one style text, and
 * the `var(--name)` lookup a value goes through (StyleParser.java:123,126).
 *
 * Mutable, as upstream: one instance per `StyleParser`, fed in text order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/parser/CssVariables.java:43-74
 */

/** `^--([_\w][-_\w]+)[ :]+(.*?);?`, used with `matches()`. @see CssVariables.java:47 */
const LEARN_PATTERN = /^--([_\w][-_\w]+)[ :]+(.*?);?$/;
/** `var\(-*([_\w][-_\w]+)\)`, used with `matches()`. @see CssVariables.java:48 */
const RETRIEVE = /^var\(-*([_\w][-_\w]+)\)$/;

export class CssVariables {
  /** @see CssVariables.java:45 */
  private readonly variables = new Map<string, string>();

  /**
   * `learn(String)`: a whole `--name: value;` line (no caller in the jar's
   * parser; kept as upstream has it). `learn(String, String)`: a name,
   * `--` stripped, and its already-read value.
   * @see CssVariables.java:50-62
   */
  learn(s: string, value?: string): void {
    if (value === undefined) {
      const m = LEARN_PATTERN.exec(s);
      if (m !== null) this.variables.set(m[1]!, m[2]!);
      return;
    }
    this.variables.set(s.startsWith('--') ? s.substring(2) : s, value);
  }

  /** The variable's value for a `var(...)` reference it knows, else `v`. @see CssVariables.java:64-73 */
  value(v: string): string {
    if (v.startsWith('var(')) {
      const m = RETRIEVE.exec(v);
      if (m !== null) {
        const result = this.variables.get(m[1]!);
        if (result !== undefined) return result;
      }
    }
    return v;
  }
}
