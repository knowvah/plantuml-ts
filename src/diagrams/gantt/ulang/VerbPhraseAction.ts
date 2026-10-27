import type { CommandExecutionResult } from '../../../core/command/CommandExecutionResult.js';
import type { Failable } from '../../../core/gantt/Failable.js';
import type { TextNavigator } from '../../../core/ubrex/TextNavigator.js';
import { UBrexLeaf } from '../../../core/ubrex/builder/UBrexLeaf.js';
import type { UBrexPart } from '../../../core/ubrex/builder/UBrexPart.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { Something } from '../lang/Something.js';
import type { Verbs } from '../lang/Verbs.js';
import { VerbPhraseMatcher } from './VerbPhraseMatcher.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:51 */
const SPACES: UBrexPart = new UBrexLeaf('〇+〴s');

/**
 * VerbPhraseAction -- a verb, an optional ignored fragment and a complement, with the action run on a match.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:49-163
 */
export abstract class VerbPhraseAction {
  readonly #verb: Verbs;
  readonly #ignored: UBrexPart | undefined;
  readonly #complement: Something<GanttDiagram>;

  /**
   * Java's two constructors: `(Verbs, Something)` (:57-60) delegates to `(Verbs, UBrexPart ignored, Something)`
   * (:66-69) with a null `ignored`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:57-69
   */
  constructor(verb: Verbs, complement: Something<GanttDiagram>);
  constructor(verb: Verbs, ignored: UBrexPart | undefined, complement: Something<GanttDiagram>);
  constructor(verb: Verbs, a: UBrexPart | undefined | Something<GanttDiagram>, b?: Something<GanttDiagram>) {
    this.#verb = verb;
    if (b === undefined) {
      this.#ignored = undefined;
      this.#complement = a as Something<GanttDiagram>;
    } else {
      this.#ignored = a as UBrexPart | undefined;
      this.#complement = b;
    }
  }

  /**
   * `verb + " " + complement.getClass().getSimpleName()` (journal row 56): `Verbs` declares no `toString`, so Java
   * prints `Verbs@<identity hash>` -- there is no identity hash in JS, `String(verb)` is the closest; the class name
   * is the JS `constructor.name`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:62-64
   */
  toString(): string {
    // Java concatenates the Verbs' default Object#toString.
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(this.#verb) + ' ' + this.#complement.constructor.name;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:72 */
  abstract execute(gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:74-76 */
  getComplement(gantt: GanttDiagram, result: VerbPhraseMatcher): Failable<unknown> {
    return this.#complement.getMe(gantt, result.getComplementMatcher());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:82-84 */
  parse(tn: TextNavigator): VerbPhraseMatcher {
    return this.#parseVerbPhrase(tn);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:100-124 */
  #parseVerbPhrase(tn: TextNavigator): VerbPhraseMatcher {
    VerbPhraseAction.skipSpaces(tn);

    const verbMatch = this.#verb.toUnicodeBracketedExpression().match(tn);
    const v2 = verbMatch.getAcceptedMatch();
    if (v2.length === 0) throw new Error('IllegalStateException');

    tn.jump(v2.length);
    VerbPhraseAction.skipSpaces(tn);

    if (this.#ignored !== undefined) {
      tn.jump(this.#ignored.match(tn).getAcceptedMatch().length);
      VerbPhraseAction.skipSpaces(tn);
    }

    const complementMatcher = this.#complement.toUnicodeBracketedExpressionComplement().match(tn);
    const v3 = complementMatcher.getAcceptedMatch();
    if (v3.length === 0) throw new Error('IllegalStateException');

    tn.jump(v3.length);

    return new VerbPhraseMatcher(verbMatch, complementMatcher);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:126-156 */
  check(tn: TextNavigator): boolean {
    tn = tn.copy();

    const verbMatch = this.#verb.toUnicodeBracketedExpression().match(tn);
    const v2 = verbMatch.getAcceptedMatch();
    if (v2.length === 0) return false;

    tn.jump(v2.length);
    VerbPhraseAction.skipSpaces(tn);

    if (this.#ignored !== undefined) {
      tn.jump(this.#ignored.match(tn).getAcceptedMatch().length);
      VerbPhraseAction.skipSpaces(tn);
    }

    const complementMatcher = this.#complement.toUnicodeBracketedExpressionComplement().match(tn);
    const v3 = complementMatcher.getAcceptedMatch();
    if (v3.length === 0) return false;

    return true;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseAction.java:158-161 */
  static skipSpaces(tn: TextNavigator): void {
    const space1 = SPACES.match(tn);
    tn.jump(space1.getAcceptedMatch().length);
  }
}
