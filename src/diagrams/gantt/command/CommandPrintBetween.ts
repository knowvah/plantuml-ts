import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { ParserPass } from '../../../core/command/ParserPass.js';
import { UBrexSingleLineCommand2 } from '../../../core/command/UBrexSingleLineCommand2.js';
import type { RegexResult } from '../../../core/regex/RegexResult.js';
import type { LineLocation } from '../../../core/tim/LineLocation.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import type { UnicodeBracketedExpression } from '../../../core/ubrex/UnicodeBracketedExpression.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { ComplementDate } from '../lang/ComplementDate.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintBetween.java:57 */
const pattern: ComplementDate = ComplementDate.any();

/**
 * `print between <date> and <date>` -- restricts the printed interval.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintBetween.java:55-97
 */
export class CommandPrintBetween extends UBrexSingleLineCommand2<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintBetween.java:59-61 */
  public constructor() {
    super(CommandPrintBetween.getRegexConcat());
  }

  /** Package-private upstream. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintBetween.java:63-76 */
  public static getRegexConcat(): UnicodeBracketedExpression {
    return UBrexConcat.build(
      // Print between 2020/02/14 and 2020/03/04
      new UBrexLeaf('print'), // :66
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('between'), // :68
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('START', pattern.toUnicodeBracketedExpressionComplement()), // :70
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('and'), // :72
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('END', pattern.toUnicodeBracketedExpressionComplement()), // :74
      UBrexLeaf.end(),
    );
  }

  /**
   * The dates are resolved by ComplementDate.getMe against the gantt calendar state; only the raw date expressions
   * are described.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintBetween.java:78-86
   */
  protected override explainArg(_location: LineLocation | undefined, arg: RegexResult): string | undefined {
    const start = arg.get('START', 0);
    const end = arg.get('END', 0);
    return 'Restricting the printed interval to between ' + String(start) + ' and ' + String(end);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandPrintBetween.java:88-97 */
  protected override executeArg(
    diagram: GanttDiagram,
    _location: LineLocation | undefined,
    arg: RegexResult,
    _currentPass: ParserPass,
  ): CommandExecutionResult {
    // `getUMatcher()` is `UMatcher | undefined` here; a ubrex command's result always carries its matcher
    // (`RegexResult.fromUMatcher`, `UBrexSingleLineCommand2.ts`), Java dereferences it unchecked (:91-92).
    const matcher = arg.getUMatcher();
    if (matcher === undefined) throw new Error('NullPointerException');
    const startCapture = matcher.extractByPrefix('START');
    const endCapture = matcher.extractByPrefix('END');
    const start = pattern.getMe(diagram, startCapture).get();
    const end = pattern.getMe(diagram, endCapture).get();
    diagram.setPrintInterval(start, end);
    return CommandExecutionResult.ok();
  }
}
