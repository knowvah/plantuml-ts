import type { UGraphic } from '../../../../core/klimt/UGraphic.js';

/**
 * HeaderPiece — a drawable piece of the timeline header.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/HeaderPiece.java:40-45
 */
export interface HeaderPiece {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/HeaderPiece.java:42 */
  getHeight(ctx: unknown): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/HeaderPiece.java:44 */
  drawU(ug: UGraphic, ctx: unknown): void;
}
