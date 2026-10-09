/**
 * The activity label line splitter (`Display#getWithNewlines`), split into
 * its own file purely to keep `dispatch-support.ts`/`node-dispatch.ts`
 * under the project's 500-line cap. isw-T2-act F7: replaced the earlier
 * `%n()`-sentinel-only decoder, which upstream has no counterpart for --
 * a multiline action's sentinels reach the creole parser undecoded.
 */
import type { Pragma } from '../../core/skin/Pragma.js';
import { parseWithNewlines } from '../../core/klimt/creole/DisplayNewlines.js';

/**
 * isw-T2-act F7: `Display.getWithNewlines2(pragma, LABEL)` (`Display.java:
 * 227-231` -> `getWithNewlines`, `:262-345`) -- the full backslash/sentinel
 * scan (`\\` is ONE literal backslash, so `\\n` stays a literal `\n`
 * for the creole table cell to break on), joined back with real line
 * breaks. What `CommandActivity3.java:139`, `CommandRepeat3.java:117` and
 * `CommandBackward3.java:141` hand `addActivity`/`backward`.
 */
export function displayWithNewlines(pragma: Pragma, text: string): string {
  return parseWithNewlines(pragma, text)?.lines.join('\n') ?? '';
}
