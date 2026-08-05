/**
 * Elected — a (portShortName, score) pair produced by
 * `MethodsOrFieldsArea#getElected` when a member row's display text
 * matches one of the owning leaf's declared port short names
 * (`entity::portName` edge targets): score 100 for a word-boundary
 * match, 50 for a bare substring match (`MethodsOrFieldsArea#getScore`).
 * `MethodsOrFieldsArea#getPorts` feeds the pair into `Ports#add`, whose
 * score-gated overwrite keeps the best-scoring row per port id.
 *
 * Upstream: cucadiagram/Elected.java (package-private there; `export`ed
 * here because TS has no package-private and `MethodsOrFieldsArea.ts` is
 * a sibling module, mirroring the one-class-per-file split convention).
 * Ported in full: constructor, `getShortName`, `getScore`, `toString`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Elected.java
 */
export class Elected {
  private readonly shortName: string;
  private readonly score: number;

  /** @see net/sourceforge/plantuml/cucadiagram/Elected.java (constructor) */
  constructor(shortName: string, score: number) {
    this.shortName = shortName;
    this.score = score;
  }

  /** @see net/sourceforge/plantuml/cucadiagram/Elected.java#toString */
  toString(): string {
    return `${this.shortName}/${this.score}`;
  }

  /** @see net/sourceforge/plantuml/cucadiagram/Elected.java#getShortName */
  getShortName(): string {
    return this.shortName;
  }

  /** @see net/sourceforge/plantuml/cucadiagram/Elected.java#getScore */
  getScore(): number {
    return this.score;
  }
}
