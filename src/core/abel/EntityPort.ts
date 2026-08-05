import { Ports } from '../svek/Ports.js';

/**
 * EntityPort — a node uid plus optional encoded port id, serialized as
 * dot's `uid:portId` endpoint syntax.
 *
 * SI1/T6 consumed-slice LOCAL port — full class (7/7 members), no
 * unported dependency (`Ports.encodePortNameToId` already lives in
 * `src/core/svek/Ports.ts`). Upstream home is `cucadiagram/` — move to
 * `src/core/cucadiagram/EntityPort.ts` when that package's port lands
 * (T6's write-set is `abel/` + `decoration/`; `Colors.ts` precedent).
 * Journaled (T6).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/EntityPort.java:40
 */
export class EntityPort {
  /** @see cucadiagram/EntityPort.java:42-43 */
  private readonly entityUid: string;
  private readonly portId: string | undefined;

  /** @see cucadiagram/EntityPort.java:45-48 */
  private constructor(entityUid: string, portId: string | undefined) {
    this.entityUid = entityUid;
    this.portId = portId;
  }

  /** @see cucadiagram/EntityPort.java:50-52 */
  static create(entityUid: string, portName: string | undefined): EntityPort {
    return new EntityPort(entityUid, portName == null ? undefined : Ports.encodePortNameToId(portName));
  }

  /** @see cucadiagram/EntityPort.java:54-56 */
  static forPort(entityUid: string): EntityPort {
    return new EntityPort(entityUid, 'P');
  }

  /** @see cucadiagram/EntityPort.java:58-63 */
  getFullString(): string {
    if (this.portId != null) return this.entityUid + ':' + this.portId;

    return this.entityUid;
  }

  /** @see cucadiagram/EntityPort.java:65-67 */
  private isShielded(): boolean {
    return this.entityUid.endsWith(':h');
  }

  /** @see cucadiagram/EntityPort.java:69-74 */
  getPrefix(): string {
    if (this.isShielded()) return this.entityUid.substring(0, this.entityUid.length - 2);

    return this.entityUid;
  }

  /** @see cucadiagram/EntityPort.java:76-78 */
  startsWith(centerId: string): boolean {
    return this.entityUid.startsWith(centerId);
  }

  /** @see cucadiagram/EntityPort.java:80-82 */
  equalsId(other: EntityPort): boolean {
    return this.entityUid === other.entityUid;
  }
}
