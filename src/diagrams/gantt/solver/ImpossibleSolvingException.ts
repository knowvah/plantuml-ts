/**
 * ImpossibleSolvingException — thrown when the task solver has no solution.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/ImpossibleSolvingException.java:38-44
 */
export class ImpossibleSolvingException extends Error {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/solver/ImpossibleSolvingException.java:40-42 */
  constructor(message: string) {
    super(message);
    this.name = 'ImpossibleSolvingException';
  }
}
