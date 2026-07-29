/**
 * PortGeometry — one named port's resolved (position, height) box on its
 * owning entity's left edge, plus the `score` `Ports#add` uses to prefer a
 * higher-confidence match when the same port id is reported twice.
 *
 * Upstream: svek/PortGeometry.java. Ported in full: the constructor,
 * `translateY`, `toString`, `getHeight`/`getPosition`/`getLastY`/
 * `getScore`/`getId`, and `compareTo` (`Comparable<PortGeometry>`, sorted
 * by ascending `position` — `Ports#getAllPortGeometry`'s own sort key).
 *
 * Sibling of `Ports.ts` (splitting per this project's precedented
 * one-class-per-file convention): `PortGeometry` has no caller anywhere
 * upstream outside `svek/Ports.java`/`svek/SvekNode.java` — both svek, so
 * this file stays alongside `Ports.ts` rather than under `klimt/`.
 */
export class PortGeometry {
  private readonly id: string;
  private readonly position: number;
  private readonly height: number;
  private readonly score: number;

  constructor(id: string, position: number, height: number, score: number) {
    this.id = id;
    this.position = position;
    this.height = height;
    this.score = score;
  }

  translateY(deltaY: number): PortGeometry {
    return new PortGeometry(this.id, this.position + deltaY, this.height, this.score);
  }

  toString(): string {
    return `pos=${this.position} height=${this.height} (${this.score})`;
  }

  getHeight(): number {
    return this.height;
  }

  getPosition(): number {
    return this.position;
  }

  getLastY(): number {
    return this.position + this.height;
  }

  getScore(): number {
    return this.score;
  }

  getId(): string {
    return this.id;
  }

  /** Upstream: `Comparable<PortGeometry>#compareTo` — ascending by `position`
   *  (`Double.compare`). Returns a number rather than boolean/ordering-enum,
   *  matching how `Ports#getAllPortGeometry` uses it as a plain `Array#sort`
   *  comparator. */
  compareTo(other: PortGeometry): number {
    return this.position - other.position;
  }
}
