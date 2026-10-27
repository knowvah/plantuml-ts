import { Failable } from '../../../core/gantt/Failable.js';
import { Stereotype } from '../../../core/stereo/Stereotype.js';
import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import { UBrexConcat } from '../../../core/ubrex/builder/UBrexConcat.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexNamed } from '../../../core/ubrex/builder/UBrexNamed.js';
import { UBrexOneOrMore } from '../../../core/ubrex/builder/UBrexOneOrMore.js';
import { UBrexOptional } from '../../../core/ubrex/builder/UBrexOptional.js';
import { UBrexOr } from '../../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { Task } from '../core/Task.js';
import { TaskCode } from '../core/TaskCode.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { VerbPhraseAction } from '../ulang/VerbPhraseAction.js';
import { buildSubjectTaskVerbPhrases } from './SubjectTaskVerbs.js';
import type { Subject } from './Subject.js';
import { Words } from './Words.js';

/**
 * `StereotypePattern.uoptional(param)`, inlined (no `StereotypePattern` module in `src/`; precedent
 * `src/diagrams/activity/dispatch-support.ts:226`): `umandatory` is `new UBrexNamed(param, new UBrexLeaf("<< 〇+「〤<>」>>"))`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/StereotypePattern.java:70-72
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/StereotypePattern.java:74-77
 */
function stereotypeUoptional(param: string): UBrexPart {
  return new UBrexOptional(
    UBrexConcat.build(
      UBrexLeaf.spaceZeroOrMore(),
      new UBrexNamed(param, new UBrexLeaf('<< 〇+「〤<>」>>')), // StereotypePattern.java:70-72
      UBrexLeaf.spaceZeroOrMore(),
    ),
  );
}

/**
 * `new StringTokenizer(resource, "{}")` then `nextToken().trim()` and a `length() > 0` test (SubjectTask.java:468-473):
 * split on `{`/`}`, drop empty tokens (consecutive delimiters yield no token), trim. Precedent
 * `src/core/decoration/WithLinkType.ts:138`.
 */
function resourceParts(resource: string): string[] {
  return resource
    .split(/[{}]/)
    .filter((t) => t.length > 0)
    .map((t) => t.trim());
}

/**
 * SubjectTask -- `[Task]`, `it` or `then [Task]` with optional stereotype, short name and resources, and the verb
 * phrases a task accepts.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectTask.java:75-482
 */
export class SubjectTask implements Subject<GanttDiagram> {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectTask.java:77 */
  static readonly ME: Subject<GanttDiagram> = new SubjectTask();
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectTask.java:78 */
  static readonly REGEX_TASK_CODE = '\\[([^\\[\\]]+?)\\]';

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectTask.java:80-85 */
  static taskCode(name: string): UBrexPart {
    return UBrexConcat.build(
      new UBrexLeaf('['), // :80
      new UBrexNamed(name, new UBrexLeaf('〇+「〤[]」')), // :81
      new UBrexLeaf(']'), // :82
    );
  }

  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectTask.java:88-412 */
  getVerbPhrases(): VerbPhraseAction[] {
    return buildSubjectTaskVerbPhrases();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectTask.java:416-439 */
  toUnicodeBracketedExpressionSubject(): UBrexPart {
    return new UBrexOr(
      new UBrexNamed('IT', Words.usingle(Words.IT)), // :418
      UBrexConcat.build(
        new UBrexOptional(
          UBrexConcat.build(new UBrexNamed('THEN', Words.usingle(Words.THEN)), UBrexLeaf.spaceOneOrMore()),
        ),
        SubjectTask.taskCode('SUBJECT'),
        stereotypeUoptional('STEREOTYPE'), // :424
        new UBrexOptional(
          UBrexConcat.build(Words.uexactly(Words.AS), UBrexLeaf.spaceOneOrMore(), SubjectTask.taskCode('SHORTNAME')),
        ),
        new UBrexOptional(
          UBrexConcat.build(
            Words.uexactly(Words.ON),
            UBrexLeaf.spaceOneOrMore(),
            new UBrexNamed(
              'RESOURCE',
              new UBrexOneOrMore(
                UBrexConcat.build(new UBrexLeaf('{〇+「〤{}」}') /* :434 */, UBrexLeaf.spaceZeroOrMore()),
              ),
            ),
          ),
        ),
      ),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/SubjectTask.java:441-482 */
  getMe(gantt: GanttDiagram, arg: UMatcher): Failable<Task> {
    let result: Task | undefined;
    if (arg.findFirstValueByKey('IT') !== undefined) {
      result = gantt.getIt();
      if (result === undefined) return Failable.error('Not sure what are you refering to?');
    } else {
      const subject = arg.findFirstValueByKey('SUBJECT');
      const shortName = arg.findFirstValueByKey('SHORTNAME');
      const then = arg.findFirstValueByKey('THEN');
      const stereotype = arg.findFirstValueByKey('STEREOTYPE');

      const code = TaskCode.fromIdAndDisplay(shortName, subject);
      result = gantt.getOrCreateTask(code, then !== undefined);

      if (stereotype !== undefined) result.setStereotype(Stereotype.build(arg.findFirstValueByKey('STEREOTYPE')));

      gantt.setIt(result);
    }

    // `if (result == null) throw new IllegalStateException()` (:463-464): `result` is provably defined here
    // (`getIt()` undefined returns above; `getOrCreateTask` returns a `Task`).
    const resource = arg.findFirstValueByKey('RESOURCE');
    if (resource !== undefined) {
      for (const part of resourceParts(resource)) {
        if (part.length > 0) {
          const ok = gantt.affectResource(result, part);
          if (ok === false) return Failable.error('Bad argument for resource');
        }
      }
    }
    return Failable.ok(result);
  }
}
