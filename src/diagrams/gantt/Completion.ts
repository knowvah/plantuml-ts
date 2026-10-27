/**
 * Completion — a task completion percentage.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Completion.java:38-50
 */
export class Completion {
  private readonly completion: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Completion.java:42-44 */
  constructor(completion: number) {
    this.completion = completion;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/Completion.java:46-48 */
  getCompletion(): number {
    return this.completion;
  }
}
