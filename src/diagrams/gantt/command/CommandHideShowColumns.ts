import type { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { ParserPass } from '../../../core/command/ParserPass.js';
import { UBrexSingleLineCommand2 } from '../../../core/command/UBrexSingleLineCommand2.js';
import type { RegexResult } from '../../../core/regex/RegexResult.js';
import type { LineLocation } from '../../../core/tim/LineLocation.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UnicodeBracketedExpression } from '../../../core/ubrex/UnicodeBracketedExpression.js';
import { GanttTaskTableColumn } from '../GanttTaskTableColumn.js';
import type { GanttDiagram } from '../GanttDiagram.js';

/**
 * `hide column duration` / `show column task` -- a `UBrexSingleLineCommand2`
 * (batch 1b), not a regex command: the column names come from
 * `GanttTaskTableColumn.getUbrex()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideShowColumns.java:53-88
 */
export class CommandHideShowColumns extends UBrexSingleLineCommand2<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideShowColumns.java:55-57 */
  public constructor() {
    super(CommandHideShowColumns.getRegexConcat());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideShowColumns.java:59-68 */
  public static getRegexConcat(): UnicodeBracketedExpression {
    // hide column duration
    return UBrexConcat.build(
      new UBrexNamed('COMMAND', new UBrexOr(new UBrexLeaf('hide'), new UBrexLeaf('show'))),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexLeaf('column'),
      UBrexLeaf.spaceOneOrMore(),
      new UBrexNamed('WHAT', GanttTaskTableColumn.getUbrex()),
      UBrexLeaf.end(),
    );
  }

  /** `@Explain(comment = "to be done")` returning `null`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideShowColumns.java:70-74 */
  protected override explainArg(_location: LineLocation | undefined, _arg: RegexResult): string | undefined {
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/command/CommandHideShowColumns.java:76-86 */
  protected override executeArg(
    diagram: GanttDiagram,
    _location: LineLocation | undefined,
    arg: RegexResult,
    _currentPass: ParserPass,
  ): CommandExecutionResult {
    const tmp = (arg.get('COMMAND', 0) as string).charAt(0);
    const show = tmp === 's';

    const what = arg.get('WHAT', 0) as string;

    const column = GanttTaskTableColumn.of(what);
    return diagram.hideOrShowColumn(show, column);
  }
}
