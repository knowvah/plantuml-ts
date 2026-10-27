import { CommandControl } from '../../../core/command/CommandControl.js';
import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { ParserPass } from '../../../core/command/ParserPass.js';
import { NoSuchColorException } from '../../../core/klimt/color/NoSuchColorException.js';
import type { StringLocated } from '../../../core/tim/StringLocated.js';
import { TextNavigator } from '../../../core/ubrex/TextNavigator.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Subject } from '../lang/Subject.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/NaturalGanttCommand.java:61 */
const AND: UBrexPart = new UBrexLeaf('〇+〴s and 〇+〴s');

/**
 * NaturalGanttCommand -- one natural-language sentence (`<subject> <verb phrase> [and <verb phrase>]...`).
 *
 * Adaptations: upstream `implements Command<GanttDiagram>` over `BlocLines`; this port has neither (`core/command/Command.ts`
 * is the regex entry), so `execute`/`isValid` take the one `StringLocated` -- `lines.getFirst()` is the only use
 * (precedent `src/core/command/UBrexSingleLineCommand2.ts:7-18`). `NoSuchColorException` is declared `throws` upstream
 * and caught by the caller; here it is mapped to `CommandExecutionResult.badColor()` as the UBrex base does.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/NaturalGanttCommand.java:59-151
 */
export class NaturalGanttCommand {
  readonly #subject: Subject<GanttDiagram>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/NaturalGanttCommand.java:65-67 */
  public constructor(subject: Subject<GanttDiagram>) {
    this.#subject = subject;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/NaturalGanttCommand.java:69-71 */
  #getVerbPhrases(): VerbPhraseAction[] {
    return this.#subject.getVerbPhrases();
  }

  /**
   * `NoSuchColorException` -> `badColor()`: the explicit catch the task spec asks for (the Java declares `throws`, the
   * dispatcher turns it into `CommandExecutionResult.badColor()`, `UBrexSingleLineCommand2.java` pattern).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/NaturalGanttCommand.java:73-121
   */
  public execute(diagram: GanttDiagram, line: StringLocated, _currentPass: ParserPass): CommandExecutionResult {
    try {
      return this.#executeSentence(diagram, line);
    } catch (e) {
      if (e instanceof NoSuchColorException) return CommandExecutionResult.badColor();
      throw e;
    }
  }

  /** The body of Java `execute`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/NaturalGanttCommand.java:77-121 */
  #executeSentence(diagram: GanttDiagram, line: StringLocated): CommandExecutionResult {
    const tn = TextNavigator.build(line.getString());
    VerbPhraseAction.skipSpaces(tn);

    const matcherSubject = this.#subject.toUnicodeBracketedExpressionSubject().match(tn);
    tn.jump(matcherSubject.getAcceptedMatch().length);
    VerbPhraseAction.skipSpaces(tn);

    let result: CommandExecutionResult | undefined;

    const candidates: VerbPhraseAction[] = [...this.#getVerbPhrases()];

    const subjectResult = this.#subject.getMe(diagram, matcherSubject);
    if (subjectResult.isFail()) return CommandExecutionResult.error(subjectResult.getError());

    while (candidates.length > 0) {
      const verbPhrase = candidates.shift() as VerbPhraseAction;
      if (verbPhrase.check(tn) === false) continue;

      const args = verbPhrase.parse(tn);

      const complement = verbPhrase.getComplement(diagram, args);
      if (complement.isFail()) return CommandExecutionResult.error(complement.getError());

      result = verbPhrase.execute(diagram, subjectResult.get(), complement.get());
      if (result.isOk() === false) return result;

      const andMatcher = AND.match(tn);
      const andMatch = andMatcher.getAcceptedMatch();
      if (andMatch.length === 0) return result;

      result = undefined;
      tn.jump(andMatch.length);

      candidates.length = 0;
      candidates.push(...this.#getVerbPhrases());
    }

    return CommandExecutionResult.error('No matching verb phrase');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/NaturalGanttCommand.java:124-145 */
  public isValid(line: StringLocated): CommandControl {
    const tn = TextNavigator.build(line.getString());
    VerbPhraseAction.skipSpaces(tn);

    const matcherSubject = this.#subject.toUnicodeBracketedExpressionSubject().match(tn);
    const v1 = matcherSubject.getAcceptedMatch();
    if (v1.length === 0) return CommandControl.NOT_OK;

    tn.jump(v1.length);
    VerbPhraseAction.skipSpaces(tn);

    for (const verbPhrase of this.#getVerbPhrases()) {
      if (verbPhrase.check(tn)) {
        return CommandControl.OK;
      }
    }

    return CommandControl.NOT_OK;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/NaturalGanttCommand.java:147-150 */
  public isEligibleFor(pass: ParserPass): boolean {
    return pass === ParserPass.ONE;
  }
}
