/**
 * CommandExecutionResult — the ok/error outcome every command returns.
 *
 * SI1/T10 closure pull — full port (13/13 members). TS adaptations,
 * each at its member: `AbstractDiagram` is an ADR-2 opaque brand (the
 * `core/` diagram stack is unported); `getStackTrace` derives its lines
 * from `Error#stack` (no `StackTraceElement` in JS).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandExecutionResult.java:44
 */

/**
 * AbstractDiagram — ADR-2 opaque brand for `core/AbstractDiagram.java`
 * (the diagram-stack root type). `CommandExecutionResult` only STORES
 * and RETURNS one (`abel/LinkConstraint.ts`-stub precedent); the real
 * class lands with the diagram-stack port, which should move this to
 * `src/core/code/AbstractDiagram.ts` and widen it there.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/AbstractDiagram.java
 */
export interface AbstractDiagram {
  /** TS-only nominal brand; never assigned. No member is consumed. */
  readonly __abstractDiagramBrand?: never;
}

export class CommandExecutionResult {
  /** Fields, upstream order. @see command/CommandExecutionResult.java:46-50 */
  private readonly error: string | undefined;
  private readonly newDiagramField: AbstractDiagram | undefined;
  private readonly debugLines: readonly string[] | undefined;
  private readonly score: number;
  private readonly rootCause: Error | undefined;

  /** Private upstream (:52-59) — construct via the static factories.
   * Java field `newDiagram` collides with the static factory
   * `newDiagram(...)` on a TS class (statics and fields share the
   * declaration space seen by tooling only — the real conflict is the
   * private field vs the instance-independent name in this port's
   * lint), renamed `newDiagramField` (T5 `staticFlag` precedent). */
  private constructor(
    newDiagram: AbstractDiagram | undefined,
    error: string | undefined,
    score: number,
    rootCause: Error | undefined,
  ) {
    this.error = error;
    this.rootCause = rootCause;
    this.newDiagramField = newDiagram;
    this.debugLines = rootCause === undefined ? undefined : CommandExecutionResult.getStackTrace(rootCause);
    this.score = score;
  }

  /** @see command/CommandExecutionResult.java:61-63 */
  withDiagram(newDiagram: AbstractDiagram): CommandExecutionResult {
    return new CommandExecutionResult(newDiagram, this.error, 0, undefined);
  }

  /** Java `super.toString() + " " + error` — the identity-hash prefix
   * has no JS equivalent; the class name stands in.
   * @see command/CommandExecutionResult.java:65-68 */
  toString(): string {
    return `CommandExecutionResult ${String(this.error)}`;
  }

  /** @see command/CommandExecutionResult.java:70-72 */
  static newDiagram(result: AbstractDiagram): CommandExecutionResult {
    return new CommandExecutionResult(result, undefined, 0, undefined);
  }

  /** @see command/CommandExecutionResult.java:74-76 */
  static ok(): CommandExecutionResult {
    return new CommandExecutionResult(undefined, undefined, 0, undefined);
  }

  /** @see command/CommandExecutionResult.java:78-80 */
  static badColor(): CommandExecutionResult {
    return new CommandExecutionResult(undefined, 'No such color', 10, undefined);
  }

  /** Java's three `error` overloads (:82-92) merged: the optional third
   * argument is a score (number) or a root cause (Error). */
  static error(error: string, scoreOrCause?: number | Error): CommandExecutionResult {
    if (scoreOrCause instanceof Error) return new CommandExecutionResult(undefined, error, 0, scoreOrCause);
    return new CommandExecutionResult(undefined, error, scoreOrCause ?? 0, undefined);
  }

  /** Java iterates `StackTraceElement`s of the exception and its cause;
   * JS exposes only the pre-formatted `Error#stack` string — split into
   * lines, with the cause chain appended, preserving upstream's shape
   * (toString first, indented frames, "Caused by " separator).
   * @see command/CommandExecutionResult.java:94-110 */
  static getStackTrace(exception: Error): readonly string[] {
    const result: string[] = [];
    result.push(exception.toString());
    for (const ste of stackLines(exception)) result.push('  ' + ste);

    const cause = (exception as { cause?: unknown }).cause;
    if (cause instanceof Error) {
      result.push('  ');
      result.push('Caused by ' + cause.toString());
      for (const ste of stackLines(cause)) result.push('  ' + ste);
    }
    return result;
  }

  /** @see command/CommandExecutionResult.java:112-114 */
  isOk(): boolean {
    return this.error === undefined;
  }

  /** @see command/CommandExecutionResult.java:116-121 */
  getError(): string {
    if (this.isOk()) throw new Error('IllegalStateException');

    return this.error as string;
  }

  /** @see command/CommandExecutionResult.java:123-125 */
  getScore(): number {
    return this.score;
  }

  /** @see command/CommandExecutionResult.java:127-129 */
  getNewDiagram(): AbstractDiagram | undefined {
    return this.newDiagramField;
  }

  /** @see command/CommandExecutionResult.java:131-133 */
  getDebugLines(): readonly string[] | undefined {
    return this.debugLines;
  }

  /** @see command/CommandExecutionResult.java:135-137 */
  getRootCause(): Error | undefined {
    return this.rootCause;
  }
}

/** `Error#stack` frames (the lines after the leading `toString()` line),
 * trimmed — the JS stand-in for `Throwable#getStackTrace`. */
function stackLines(exception: Error): readonly string[] {
  const stack = exception.stack;
  if (stack === undefined) return [];
  return stack
    .split('\n')
    .slice(1)
    .map((line) => line.trim());
}
