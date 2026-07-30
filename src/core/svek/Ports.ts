/**
 * Ports — the id-keyed collection of `PortGeometry` a `WithPorts`
 * implementor reports (`SheetBlock2#getPorts`, `MethodsOrFieldsArea`'s
 * member-row port lookups, SI1 scope, not this task) so an edge targeting
 * `entity::portName` can resolve a precise y-band on the entity's edge
 * instead of the whole box.
 *
 * Upstream: svek/Ports.java. Ported in full: `encodePortNameToId`,
 * `toString`, `translateY`, `add` (score-gated overwrite — a lower-score
 * report for the same port id never replaces a higher one), `addThis`
 * (same score-gated merge, keyed by the ALREADY-encoded id), and
 * `getAllPortGeometry` (sorted ascending by position, per
 * `PortGeometry#compareTo`).
 *
 * T8b: `encodePortNameToId`'s MD5 hex digest now calls
 * `SignatureUtils.getMD5Hex` (`core/utils/SignatureUtils.ts`) instead of a
 * copy inlined here — T8 had embedded a scoped MD5-only implementation to
 * avoid porting all of `utils/SignatureUtils.java` just for this one
 * caller; T8b relocates that implementation to its upstream-faithful home
 * now that a second caller (`UImageSvg`) is on the roadmap.
 */
import { PortGeometry } from './PortGeometry.js';
import { SignatureUtils } from '../utils/SignatureUtils.js';

export class Ports {
  private readonly ids = new Map<string, PortGeometry>();

  /** Upstream: `Ports#encodePortNameToId` — `"p" + SignatureUtils
   *  .getMD5Hex(portName)` (svek/Ports.java:53-55). */
  static encodePortNameToId(portName: string): string {
    return `p${SignatureUtils.getMD5Hex(portName)}`;
  }

  toString(): string {
    const entries = [...this.ids.entries()].map(([key, value]) => `${key}=${value.toString()}`);
    return `{${entries.join(', ')}}`;
  }

  translateY(deltaY: number): Ports {
    const result = new Ports();
    for (const [key, value] of this.ids) result.ids.set(key, value.translateY(deltaY));
    return result;
  }

  /** Upstream: `Ports#add` — encodes `portName`, then keeps whichever of
   *  the new/existing `PortGeometry` for that id has the HIGHER `score`. */
  add(portName: string, score: number, position: number, height: number): void {
    const id = Ports.encodePortNameToId(portName);
    const already = this.ids.get(id);
    if (already === undefined || already.getScore() < score) {
      this.ids.set(id, new PortGeometry(id, position, height, score));
    }
  }

  /** Upstream: `Ports#addThis` — same score-gated merge as `add`, but
   *  `other`'s entries are ALREADY id-encoded (merging one `Ports` into
   *  another, not adding a raw port name). */
  addThis(other: Ports): void {
    for (const [key, value] of other.ids) {
      const already = this.ids.get(key);
      if (already === undefined || already.getScore() < value.getScore()) {
        this.ids.set(key, value);
      }
    }
  }

  /** Upstream: `Ports#getAllPortGeometry` — an unmodifiable, position-sorted
   *  snapshot (`Collections.sort` + `Collections.unmodifiableCollection`). */
  getAllPortGeometry(): readonly PortGeometry[] {
    const result = [...this.ids.values()];
    result.sort((a, b) => a.compareTo(b));
    return result;
  }
}
