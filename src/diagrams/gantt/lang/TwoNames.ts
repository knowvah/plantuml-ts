/**
 * TwoNames — an immutable pair of names.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TwoNames.java:38-56
 */
export class TwoNames {
  private readonly name1: string;
  private readonly name2: string;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TwoNames.java:43-46 */
  constructor(name1: string, name2: string) {
    this.name1 = name1;
    this.name2 = name2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TwoNames.java:48-50 */
  getName1(): string {
    return this.name1;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/TwoNames.java:52-54 */
  getName2(): string {
    return this.name2;
  }
}
