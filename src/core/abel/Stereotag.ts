/**
 * Stereotag — a `$tag` marker attached to an entity (`stereo/Stereotag.java`).
 *
 * SI1/T5 consumed-slice LOCAL port (full member surface: `SINGLE`,
 * `pattern`, constructor, `getName`, `equals`, `toString`; Java's
 * `hashCode` has no TS equivalent — `Entity` reproduces the
 * equals-by-name `Set` semantics with a name-keyed `Map`, see
 * `Entity#addStereotag`). Upstream home is `stereo/` — move to
 * `src/core/stereo/Stereotag.ts` when convenient (that package exists
 * but is outside this task's write-set).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotag.java:40
 */
export class Stereotag {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotag.java:42 */
  private static readonly SINGLE = '(\\$[^%s{}%g<>$]+)';

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotag.java:44-46 */
  static pattern(): string {
    return '(' + Stereotag.SINGLE + '([%s]+' + Stereotag.SINGLE + ')*)';
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotag.java:48 */
  private readonly name: string;

  /** Rejects names still carrying their `$` prefix.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotag.java:50-55 */
  constructor(name: string) {
    if (name.startsWith('$')) throw new Error(`IllegalArgumentException: ${name}`);

    this.name = name;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotag.java:57-59 */
  getName(): string {
    return this.name;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotag.java:66-69 */
  equals(other: Stereotag): boolean {
    return this.name === other.name;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotag.java:71-74 */
  toString(): string {
    return '$' + this.name;
  }
}
