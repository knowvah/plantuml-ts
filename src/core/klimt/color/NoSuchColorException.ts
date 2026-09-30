/**
 * NoSuchColorException — thrown by `HColorSet#getColor` for a token that
 * resolves to no colour. A checked exception upstream; a thrown `Error`
 * here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/NoSuchColorException.java:38-44
 */
export class NoSuchColorException extends Error {
  /** `super("NoSuchColorException")`. @see NoSuchColorException.java:40-42 */
  constructor() {
    super('NoSuchColorException');
    this.name = 'NoSuchColorException';
  }
}
