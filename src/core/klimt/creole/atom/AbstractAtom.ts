/**
 * AbstractAtom — upstream: klimt/creole/atom/AbstractAtom.java (`abstract
 * class AbstractAtom extends TextBlockMemoized implements Atom`). Every
 * concrete OOP `Atom` implementor this port has (or will have) extends
 * this rather than `TextBlockMemoized` directly, matching upstream's own
 * hierarchy — `AtomWithMargin.ts` and `../CreoleHorizontalLine.ts` both do.
 *
 * Ported: the class shape itself (`extends TextBlockMemoized implements
 * Atom`) and `getNeutrons()`.
 *
 * ## ADR-9 adaptation: `getNeutrons()` throws instead of building a real
 * `Neutron`
 *
 * Upstream's `getNeutrons()` returns `Arrays.asList(Neutron.create(this))`
 * — a single-element list wrapping `this` atom for the OOP word-wrap
 * engine (`Fission.java` + `Neutron.java`, upstream's REAL implementation).
 * This port's word-wrap (`Fission.ts#getSplitted`) is the data-oriented
 * E2r/L3 port of that same algorithm, operating on `CreoleAtom` +
 * `AtomOps` instead (`Sea.ts`'s own doc comment) — `Neutron.java` (128
 * lines) has no TS counterpart and is out of this task's write-set. Every
 * `Atom` implementor this port already has (`SheetBlock1.ts`,
 * `SheetBlock2.ts`) already types `getNeutrons(): never` and throws
 * `UnsupportedOperationException` rather than constructing one — this
 * class matches that established precedent exactly rather than inventing
 * new behavior. Zero behavior change for any current caller: nothing in
 * this port calls `getNeutrons()` on any `Atom` today (grep-verified
 * across `src/`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AbstractAtom.java
 */
import { TextBlockMemoized } from '../../shape/TextBlockMemoized.js';
import type { StringBounder } from '../../font/StringBounder.js';
import type { Atom } from '../SheetBlock1.js';

export abstract class AbstractAtom extends TextBlockMemoized implements Atom {
  abstract getStartingAltitude(stringBounder: StringBounder): number;

  getNeutrons(): never {
    throw new Error('UnsupportedOperationException');
  }
}
