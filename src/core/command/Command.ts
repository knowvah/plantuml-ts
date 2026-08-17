import type { ParserPass } from './ParserPass.js';

/**
 * Generic command-dispatch-table entry, shared by every diagram engine's
 * line-oriented parser. Upstream declares one `Command<D extends Diagram>`
 * with `execute`, `isValid`, `isEligibleFor`, `explain`, and
 * `isCommandForbidden` (`command/Command.java:42-58`). This port keeps the
 * two members every engine's dispatch table actually uses today:
 *
 * - `pattern` — the compiled matcher tested against each line, replacing
 *   upstream's `getMatcher()`/`isValid(BlocLines)` machinery (line-level
 *   regex matching is this port's dispatch strategy — see each engine's
 *   parser for the match loop).
 * - `execute` — the side-effecting handler run on a match, ported from
 *   `execute(D diagram, BlocLines lines, ParserPass currentPass)`
 *   (`Command.java:44`), minus the diagram/pass argument — see the
 *   `passes` doc below for where pass-sensitivity lives instead.
 *
 * `passes` represents `isEligibleFor(ParserPass)` (`Command.java:52`) as a
 * declarative allowlist the dispatcher checks BEFORE calling `execute`,
 * rather than as a per-call method. Absent (`undefined`) means "eligible
 * on every pass" — exactly the behaviour of the `class`, `description`,
 * and `sequence` engines' dispatch tables today: none of them fork on
 * `ParserPass` at all, so none ever had an eligibility field to port.
 *
 * `state`'s dispatch table (`src/diagrams/state/state-commands.ts`) is the
 * one engine that DOES need per-pass behaviour inside `execute` itself,
 * not just at the eligibility gate — and it is, not coincidentally, the
 * one engine whose `execute` also takes the current pass as a THIRD
 * argument, which is exactly upstream's real `execute` signature
 * (`Command.java:44`). Its local `Command` interface therefore keeps that
 * 3rd parameter and is NOT an alias of this type: folding a pass argument
 * into this generic would force an unused parameter onto the three
 * engines that never needed it. Both are faithful ports of the same Java
 * method; `state` is simply the one dispatch table that exercises the
 * part of it the other three don't.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/Command.java:42-58
 */
export interface Command<S> {
  pattern: RegExp;
  execute(state: S, match: RegExpExecArray): void;
  passes?: readonly ParserPass[];
}
