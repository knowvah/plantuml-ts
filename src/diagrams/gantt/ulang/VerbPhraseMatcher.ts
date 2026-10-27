import type { UMatcher } from '../../../core/ubrex/UMatcher.js';

/**
 * VerbPhraseMatcher — one verb match with its complement match.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseMatcher.java:40-63
 */
export class VerbPhraseMatcher {
  private readonly verbMatch: UMatcher;
  private readonly complementMatcher: UMatcher;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseMatcher.java:45-48 */
  constructor(verbMatch: UMatcher, complementMatcher: UMatcher) {
    this.verbMatch = verbMatch;
    this.complementMatcher = complementMatcher;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseMatcher.java:50-53 */
  toString(): string {
    // Java concatenates the UMatcher implementation's own toString(); the interface cannot declare it.
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return `- ${String(this.verbMatch)}    +    ${String(this.complementMatcher)}`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseMatcher.java:55-57 */
  getVerbMatch(): UMatcher {
    return this.verbMatch;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ulang/VerbPhraseMatcher.java:59-61 */
  getComplementMatcher(): UMatcher {
    return this.complementMatcher;
  }
}
