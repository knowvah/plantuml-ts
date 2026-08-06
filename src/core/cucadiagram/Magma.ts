import type { CucaDiagram } from './CucaDiagram.js';
import type { Entity } from '../abel/Entity.js';
import { Link } from '../abel/Link.js';
import { LinkArg } from '../abel/LinkArg.js';
import { LinkDecor } from '../decoration/LinkDecor.js';
import { LinkType } from '../decoration/LinkType.js';
import { SquareMaker } from './SquareMaker.js';
import type { SquareLinker } from './SquareLinker.js';

/**
 * Magma — one group's standalone (link-less) leaves, chained into a
 * square grid of invisible links so graphviz packs them compactly.
 * Built and consumed by `CucaDiagram#applySingleStrategy`.
 *
 * SI1/T10 closure pull — full port (10/10 members). NOTE: an
 * engine-facing adaptation of this feature already exists in
 * `src/core/magma.ts` (dot-id based, jar-verified) — that seam stays;
 * this is the faithful abel-model version (journaled).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Magma.java:47
 */
export class Magma {
  /** @see cucadiagram/Magma.java:49-51 */
  private readonly diagram: CucaDiagram;
  private readonly standalones: readonly Entity[];
  private readonly linkType: LinkType = new LinkType(LinkDecor.NONE, LinkDecor.NONE).getInvisible();

  /** @see cucadiagram/Magma.java:53-56 */
  constructor(system: CucaDiagram, standalones: readonly Entity[]) {
    this.diagram = system;
    this.standalones = standalones;
  }

  /** @see cucadiagram/Magma.java:58-71 */
  putInSquare(): void {
    const diagram = this.diagram;
    const linkType = this.linkType;
    const linker: SquareLinker<Entity> = {
      topDown(top: Entity, down: Entity): void {
        diagram.addLink(
          new Link(
            undefined,
            diagram,
            diagram.getSkinParam().getCurrentStyleBuilder(),
            top,
            down,
            linkType,
            LinkArg.noDisplay(2),
          ),
        );
      },
      leftRight(left: Entity, right: Entity): void {
        diagram.addLink(
          new Link(
            undefined,
            diagram,
            diagram.getSkinParam().getCurrentStyleBuilder(),
            left,
            right,
            linkType,
            LinkArg.noDisplay(1),
          ),
        );
      },
    };
    new SquareMaker<Entity>().putInSquare(this.standalones, linker);
  }

  /** @see cucadiagram/Magma.java:73-79 */
  getContainer(): Entity | undefined {
    const parent = (this.standalones[0] as Entity).getParentContainer();
    if (parent === undefined) return undefined;

    return parent.getParentContainer();
  }

  /** @see cucadiagram/Magma.java:81-87 */
  isComplete(): boolean {
    const parent = this.getContainer();
    if (parent === undefined) return false;

    return parent.countChildren() === this.standalones.length;
  }

  /** @see cucadiagram/Magma.java:89-91 */
  private squareSize(): number {
    return SquareMaker.computeBranch(this.standalones.length);
  }

  /** @see cucadiagram/Magma.java:93-95 */
  private getTopLeft(): Entity {
    return this.standalones[0] as Entity;
  }

  /** @see cucadiagram/Magma.java:97-100 */
  private getBottomLeft(): Entity {
    const result = SquareMaker.getBottomLeft(this.standalones.length);
    return this.standalones[result] as Entity;
  }

  /** @see cucadiagram/Magma.java:102-105 */
  private getTopRight(): Entity {
    const s = this.squareSize();
    return this.standalones[s - 1] as Entity;
  }

  /** @see cucadiagram/Magma.java:107-110 */
  toString(): string {
    return `${String((this.standalones[0] as Entity).getParentContainer())} ${this.standalones.toString()} ${String(this.isComplete())}`;
  }

  /** @see cucadiagram/Magma.java:112-116 */
  linkToDown(down: Magma): void {
    this.diagram.addLink(
      new Link(
        undefined,
        this.diagram,
        this.diagram.getSkinParam().getCurrentStyleBuilder(),
        this.getBottomLeft(),
        down.getTopLeft(),
        this.linkType,
        LinkArg.noDisplay(2),
      ),
    );
  }

  /** @see cucadiagram/Magma.java:118-121 */
  linkToRight(right: Magma): void {
    this.diagram.addLink(
      new Link(
        undefined,
        this.diagram,
        this.diagram.getSkinParam().getCurrentStyleBuilder(),
        this.getTopRight(),
        right.getTopLeft(),
        this.linkType,
        LinkArg.noDisplay(1),
      ),
    );
  }
}
