import { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import { Failable } from '../../../core/gantt/Failable.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import { Today } from '../Today.js';
import { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import type { CenterBorderColor } from './CenterBorderColor.js';
import { ComplementDate } from './ComplementDate.js';
import { ComplementInColors } from './ComplementInColors.js';
import type { Subject } from './Subject.js';
import { Verbs } from './Verbs.js';

/**
 * SubjectToday -- `today is <date>` / `today is colored in <colors>`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectToday.java:53-93
 */
export class SubjectToday implements Subject<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectToday.java:55 */
  static readonly ME: Subject<GanttDiagram> = new SubjectToday();

  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectToday.java:60-63 */
  toUnicodeBracketedExpressionSubject(): UBrexPart {
    return new UBrexLeaf('today'); // :62
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectToday.java:65-68 */
  getMe(_gantt: GanttDiagram, _arg: UMatcher): Failable<Today> {
    return Failable.ok(new Today());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectToday.java:70-91 */
  getVerbPhrases(): VerbPhraseAction[] {
    const result: VerbPhraseAction[] = [];

    // :73-81
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, _subject: unknown, complement: unknown): CommandExecutionResult {
          const colors = complement as CenterBorderColor;
          gantt.setTodayColors(colors);
          return CommandExecutionResult.ok();
        }
      })(Verbs.isColored, new ComplementInColors()),
    );

    // :83-90
    result.push(
      new (class extends VerbPhraseAction {
        override execute(gantt: GanttDiagram, _subject: unknown, complement: unknown): CommandExecutionResult {
          const date = complement as LocalDate;
          return gantt.setToday(date);
        }
      })(Verbs.is, ComplementDate.any()),
    );

    return result;
  }
}
