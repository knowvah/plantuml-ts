/**
 * UBrexSingleLineCommand2 -- base class of the commands whose syntax is a
 * single `UnicodeBracketedExpression` matched against one source line.
 *
 * ## Adaptations (decisions.md D11 / Amendment 1)
 *
 * - **`BlocLines` -> one `StringLocated`.** No generic `BlocLines` exists in
 *   this port; `src/core/command/Command.ts` already documents the per-line
 *   adaptation of upstream's `Command<D>` (`isValid`/`explain`/`execute`
 *   take `BlocLines` upstream). Here `isValid`, `explain`, `execute` and
 *   `isCommandForbidden` take the single line. Java's `lines.size() != 1`
 *   checks (`isValid` -> `NOT_OK`; `explain`/`execute` -> `IllegalArgumentException`)
 *   are structurally true here, and the two-line `{`-on-its-own-line branches
 *   (`lines.size() == 2 && syntaxWithFinalBracket()`, `isValidBracket`, the
 *   `lines.getFirst() + " {"` rejoin in `explain`/`execute`) can never be
 *   entered: the dispatcher only ever hands one line (a bracket-syntax
 *   command's own `{` is on that line, or `isValid` answers `OK_PARTIAL`
 *   and the dispatcher appends it). `BlocLines.singleString(s)` is
 *   `new StringLocated(s, undefined)` (`BlocLines.java:136-140`).
 * - **Implements no `Command` interface.** `Command.ts` is the regex
 *   dispatch-table entry (`pattern: RegExp`), a different shape; this class
 *   is the Java `Command<S>` contract (`execute`, `explain`, `isValid`,
 *   `isEligibleFor`, `isCommandForbidden`) over a ubrex pattern.
 * - `S extends Diagram` is an unconstrained `S` (no `Diagram` type in this
 *   port). `@Explain` / `TeaVM.a()` assertions are dropped: the first is a
 *   build-time annotation, the second an assertion guard whose conditions
 *   (`lines.size() == 2`) cannot hold with one line.
 * - `Objects.requireNonNull(pattern)` is the non-optional parameter type.
 * - Java `final` methods (`isValid`, `explain`, `execute`) must not be
 *   overridden by subclasses.
 * - `NoSuchColorException` is thrown by `executeArg` (checked upstream).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java
 */
import type { LineLocation } from '../tim/LineLocation.js';
import { StringLocated } from '../tim/StringLocated.js';
import { PSystemError } from '../error/PSystemError.js';
import { NoSuchColorException } from '../klimt/color/NoSuchColorException.js';
import { RegexResult } from '../regex/RegexResult.js';
import type { UnicodeBracketedExpression } from '../ubrex/UnicodeBracketedExpression.js';
import { CommandControl } from './CommandControl.js';
import { CommandExecutionResult } from './CommandExecutionResult.js';
import { ParserPass } from './ParserPass.js';

export abstract class UBrexSingleLineCommand2<S> {
  private readonly pattern: UnicodeBracketedExpression;
  private readonly doTrim: boolean;

  /** Both Java constructors: `(pattern)` (`doTrim` true) and `(doTrim, pattern)`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  public constructor(pattern: UnicodeBracketedExpression);
  public constructor(doTrim: boolean, pattern: UnicodeBracketedExpression);
  public constructor(doTrimOrPattern: boolean | UnicodeBracketedExpression, pattern?: UnicodeBracketedExpression) {
    if (typeof doTrimOrPattern === 'boolean') {
      this.doTrim = doTrimOrPattern;
      this.pattern = pattern as UnicodeBracketedExpression;
    } else {
      this.doTrim = true;
      this.pattern = doTrimOrPattern;
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  public syntaxWithFinalBracket(): boolean {
    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java (myTrim2) */
  private myTrim2(s: StringLocated): StringLocated {
    if (this.doTrim) return s.getTrimmed();
    return s;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java (myTrim) */
  private myTrim(s: StringLocated): string {
    return this.myTrim2(s).getString();
  }

  /** `Command#isCommandForbidden` (interface default, `Command.java`). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/Command.java */
  public isCommandForbidden(_line: StringLocated): boolean {
    return false;
  }

  /** `final` upstream; takes the one line (see class doc). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  public isValid(line: StringLocated): CommandControl {
    if (this.isCommandForbidden(line)) return CommandControl.NOT_OK;

    const line2 = this.myTrim2(line);
    if (this.syntaxWithFinalBracket() && !line2.getString().endsWith('{')) {
      const vline = line.getString() + ' {';
      if (this.isValid(new StringLocated(vline, undefined)) === CommandControl.OK) return CommandControl.OK_PARTIAL;

      return CommandControl.NOT_OK;
    }

    const result = this.pattern.match(line2.getString(), 0);
    if (result.exactMatch()) return this.finalVerification();

    return CommandControl.NOT_OK;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  protected finalVerification(): CommandControl {
    return CommandControl.OK;
  }

  /** `final` upstream; `null` is `undefined`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  public explain(first: StringLocated): string | undefined {
    const line = this.myTrim(first);
    if (this.isForbidden(line)) return undefined;

    const result = this.pattern.match(line, 0);

    if (!result.exactMatch()) return undefined;

    return this.explainArg(first.getLocation(), RegexResult.fromUMatcher(result));
  }

  /** Upstream `@Explain abstract protected`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  protected abstract explainArg(location: LineLocation | undefined, arg: RegexResult): string | undefined;

  /** `final` upstream. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  public execute(system: S, first: StringLocated, currentPass: ParserPass): CommandExecutionResult {
    const line = this.myTrim(first);
    if (this.isForbidden(line)) return CommandExecutionResult.error('Syntax error: ' + line);

    const result = this.pattern.match(line, 0);

    if (!result.exactMatch()) return CommandExecutionResult.error('Cannot parse line ' + line);

    if ((system as unknown) instanceof PSystemError) return CommandExecutionResult.error('PSystemError cannot be cast');

    try {
      return this.executeArg(system, first.getLocation(), RegexResult.fromUMatcher(result), currentPass);
    } catch (e) {
      if (e instanceof NoSuchColorException) return CommandExecutionResult.badColor();
      throw e;
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  protected isForbidden(_line: string): boolean {
    return false;
  }

  /** May throw {@link NoSuchColorException} (checked upstream). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  protected abstract executeArg(
    system: S,
    location: LineLocation | undefined,
    arg: RegexResult,
    currentPass: ParserPass,
  ): CommandExecutionResult;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/UBrexSingleLineCommand2.java */
  public isEligibleFor(pass: ParserPass): boolean {
    return pass === ParserPass.ONE;
  }
}
