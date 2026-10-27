import type { UMatcher } from '../../../core/ubrex/UMatcher.js';
import type { VerbPhraseMatcher } from './VerbPhraseMatcher.js';

/**
 * ParsedSentence — a subject match plus its verb phrases.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/ParsedSentence.java:44-75
 */
export class ParsedSentence {
  private readonly matcherSubject: UMatcher;
  private readonly verbPhrases: readonly VerbPhraseMatcher[];

  /** Copies the list as `Collections.unmodifiableList(new ArrayList<>(...))`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/ParsedSentence.java:49-52 */
  constructor(matcherSubject: UMatcher, verbPhrases: readonly VerbPhraseMatcher[]) {
    this.matcherSubject = matcherSubject;
    this.verbPhrases = Object.freeze([...verbPhrases]);
  }

  /** `List#toString` is `[a, b]`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/ParsedSentence.java:54-57 */
  toString(): string {
    // Java concatenates the UMatcher implementation's own toString(); the interface cannot declare it.
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return `\n {${String(this.matcherSubject)}} /\n       [${this.verbPhrases.map(String).join(', ')}]`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/ParsedSentence.java:59-61 */
  getMatcherSubject(): UMatcher {
    return this.matcherSubject;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/ParsedSentence.java:63-65 */
  getVerbPhrases(): readonly VerbPhraseMatcher[] {
    return this.verbPhrases;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/ParsedSentence.java:67-69 */
  getVerbMatch(): UMatcher {
    return this.firstPhrase().getVerbMatch();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/ParsedSentence.java:71-73 */
  getComplementMatcher(): UMatcher {
    return this.firstPhrase().getComplementMatcher();
  }

  /** `List#get(0)` on an empty list throws IndexOutOfBoundsException. */
  private firstPhrase(): VerbPhraseMatcher {
    const first = this.verbPhrases[0];
    if (first === undefined) throw new Error('IndexOutOfBoundsException: Index 0 out of bounds for length 0');
    return first;
  }
}
