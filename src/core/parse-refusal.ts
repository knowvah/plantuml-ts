/**
 * The refusal outcome a plugin returns instead of an AST, and the upstream
 * tie-break for picking a winner when every candidate refuses.
 *
 * Upstream's `PSystemCommandFactory#createSystem` has four ways to say "this
 * source is not mine": it never returns a bare failure signal, only an
 * `AbstractDiagram` that is itself a `PSystemError`, or `null`
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/
 * PSystemCommandFactory.java:107-165`). Per D1 (decisions.md#d1), this port's
 * `parse()` returns a `ParseRefusal` for all four rather than throwing or
 * returning `null` — `throw` is reserved for the crash path
 * (`PSystemBuilder.java:275-281`), a different outcome from a syntax refusal.
 *
 * The four refusal points, each read directly off `PSystemCommandFactory
 * #executeFewLines` / `#finalizeDiagram`:
 *
 * 1. No `Command` matched the line — `SYNTAX_ERROR "Syntax Error?"`, score
 *    contribution 0 (the literal third arg to `new ErrorUml(...)`).
 *    @see PSystemCommandFactory.java:169-175
 * 2. A `Command` matched but execution failed — `EXECUTION_ERROR`, score
 *    contribution `result.getScore()`.
 *    @see PSystemCommandFactory.java:180-186
 * 3. `sys.isIncomplete()` after the pass loop — upstream returns `null`,
 *    building no `ErrorUml` at all, so there is no upstream score component
 *    to carry; this port still returns a `ParseRefusal` (never `null`, per
 *    D1), with `commandScore` at the same 0 default the other bare-message
 *    refusals use.
 *    @see PSystemCommandFactory.java:160-162
 * 4. `sys.checkFinalError() != null` — built through
 *    `PSystemAbstractFactory#buildExecutionError`, which also passes a
 *    literal 0 as the `ErrorUml` score.
 *    @see PSystemCommandFactory.java:150-153
 *    @see PSystemAbstractFactory.java:67-72
 *
 * The `ErrorUml` score itself is exactly the constructor's third argument —
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/ErrorUml.java:52-53.
 */

/** The four refusal points ported off `PSystemCommandFactory`; see file header. */
export type ParseRefusalKind = 'syntax' | 'execution' | 'incomplete' | 'final';

/**
 * A plugin's "not mine" outcome. `refused: true` is the discriminant — no
 * engine AST carries this field, so a `ParseRefusal` narrows out of a
 * `AST | ParseRefusal` union without a cast, and callers must never
 * discriminate on the ABSENCE of a field instead.
 */
export interface ParseRefusal {
  readonly refused: true;
  readonly kind: ParseRefusalKind;
  /** 0-based index of the offending line. */
  readonly line: number;
  /** Lines successfully consumed before the failure (upstream's `trace.size()`). */
  readonly consumed: number;
  readonly message: string;
  /** Upstream's per-command score contribution; see file header for its value per kind. */
  readonly commandScore: number;
}

/**
 * Builds a {@link ParseRefusal}. `commandScore` defaults to 0 because three of
 * the four upstream refusal points never carry a nonzero score component —
 * only the execution-failure point (`PSystemCommandFactory.java:183`,
 * `result.getScore()`) does, and its caller passes it explicitly.
 */
export function refuse(
  kind: ParseRefusalKind,
  line: number,
  consumed: number,
  message: string,
  commandScore = 0,
): ParseRefusal {
  return { refused: true, kind, line, consumed, message, commandScore };
}

/**
 * `trace.size() * 10 + singleError.score()`, ported verbatim (D2).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemError.java:382-384
 */
export function refusalScore(r: ParseRefusal): number {
  return r.consumed * 10 + r.commandScore;
}

/**
 * When every candidate refuses, the one that got furthest owns the error
 * page: the maximum by {@link refusalScore}, first-wins on an exact tie
 * (`result.score() < err.score()` is a strict `<`, so a later equal score
 * never replaces the earlier one).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemErrorUtils.java:140-147
 *
 * Throws on an empty array, mirroring `PSystemErrorUtils.merge`'s
 * `IllegalStateException` when handed zero candidates.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemErrorUtils.java:112-114
 */
export function mergeRefusals(rs: readonly ParseRefusal[]): ParseRefusal {
  if (rs.length === 0) {
    throw new Error('mergeRefusals: no refusal to merge');
  }

  let result: ParseRefusal | undefined;
  for (const r of rs) {
    if (result === undefined || refusalScore(result) < refusalScore(r)) result = r;
  }
  return result!;
}
