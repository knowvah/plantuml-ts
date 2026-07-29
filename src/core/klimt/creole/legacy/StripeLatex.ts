/**
 * StripeLatex — one `<latex>...</latex>` block: a "raw" continuation
 * stripe that accumulates every physical line between `<latex>` and
 * `</latex>` verbatim, then lazily builds a single `AtomMath` wrapping the
 * whole accumulated formula.
 *
 * Upstream: klimt/creole/legacy/StripeLatex.java (118 lines, `implements
 * StripeRaw`). T10e (batch 3a). Ported in full — every member has a
 * faithful TS counterpart:
 *  - constructor (java:61-63)
 *  - `addAndCheckTermination` (java:73-81) — `Parser.isLatexEnd(line)`
 *    terminates the block; every other line is accumulated verbatim into
 *    `formula`.
 *  - `isTerminated` (java:83-86).
 *  - `getAtom` (java:88-97, private) — lazily constructs ONE `AtomMath`
 *    from `ScientificEquationSafe.fromLatex(formula)` + the stripe's own
 *    `FontConfiguration`, memoized (`if (atom == null)`).
 *  - `calculateDimension` (java:99-103, `@Fast`) — delegates straight to
 *    `getAtom().calculateDimension(...)`, matching upstream's own choice
 *    to override `calculateDimension` directly rather than
 *    `calculateDimensionSlow`: `StripeLatex` itself is NOT memoized (it
 *    does not extend `TextBlockMemoized`/`AbstractAtom` — see below), but
 *    the `AtomMath` it delegates to already IS (via `AbstractAtom`), so
 *    wrapping this call in a second memoization layer would be redundant,
 *    not faithful.
 *  - `getStartingAltitude` (java:105-107) — always 0.
 *  - `drawU` (java:109-111) — delegates straight to `getAtom().drawU(ug)`.
 *  - `getNeutrons` (java:113-116) — see the ADR-9 verdict below.
 *
 * `StringBuilder formula` (java field) becomes a plain `string`
 * accumulator (`this.formula += line`) — TS has no `StringBuilder`
 * distinct from `string`; upstream's own `append` has no separator between
 * lines (java:79, `this.formula.append(line);`), so a multi-line `<latex>`
 * block's line breaks are genuinely dropped on concatenation — ported
 * verbatim, not "fixed."
 *
 * `!TeaVM.isTeaVM()` (java:89, `getAtom`'s outer guard, which returns
 * `null` under TeaVM) is dropped — this port has no TeaVM branch at all
 * (`SignatureUtils.ts`'s established precedent, re-cited at
 * `AtomMath.ts`'s own doc comment), so `getAtom()` always builds/returns a
 * real `AtomMath`.
 *
 * ## `getAtoms()`/`getLHeader()` return type: this port's OOP `Atom`, NOT
 * `Stripe.ts`'s `CreoleAtom` — `implements Stripe`/`StripeRaw` deliberately
 * NOT declared
 *
 * Same fork `StripeTree.ts` (T10c) and `StripeCode.ts` (T10d, concurrent
 * siblings) already hit and documented: upstream's real `Stripe#
 * getAtoms()` is `List<Atom>` (any concrete atom, including a "compound"
 * atom that IS the whole stripe — `Collections.singletonList(this)` here,
 * java:66); `../Stripe.ts` narrows that to `readonly CreoleAtom[]`,
 * faithful only for `StripeSimple`'s flat text/inline/latex runs. A
 * `<latex>...</latex>` fenced block has no `CreoleAtom` representation
 * (it is a measured/drawn sub-block, not a text/inline/latex token), so
 * `StripeLatex` cannot honestly satisfy `../Stripe.ts`'s CURRENT
 * signature. Widening `../Stripe.ts` is shared, cross-cutting
 * infrastructure outside this task's write-set, flagged (again) for T10g
 * (the task that reinstates every `lastStripe instanceof Stripe*` seam
 * together), not patched unilaterally. `getAtoms()`/`getLHeader()` below
 * are typed against the REAL upstream contract (`Atom` from
 * `../SheetBlock1.js`) so the gap is visible at the type level. Unlike
 * `StripeTree`, `StripeLatex` has NO other blocked member — every method
 * below is fully reachable and tested today.
 *
 * ## `getNeutrons` — ADR-9 verdict: NOT ported, matches `StripeCode.ts`'s
 * own `Neutron` verdict exactly
 *
 * `getNeutrons()` (java:113-116) is `Neutron`'s ONLY call site anywhere
 * upstream (`Neutron.create(Atom)`'s only caller is
 * `Fission.java#getSplitted`, java:74 — grep-verified, same finding
 * `StripeCode.ts`'s own doc comment already made). `Fission.ts
 * #getSplitted` (T8, jar-verified) already carries this decomposition as
 * `getNeutronsForAtom`, bound to `CreoleAtom` instead of the OOP `Atom`
 * hierarchy. For `StripeLatex` specifically: `Neutron.create(this)`
 * dispatches on `instanceof AtomText` (java:56) — `StripeLatex` is never
 * one, so it always takes the generic branch (`new Neutron(null, UNKNOWN,
 * this)`), which is verbatim `Fission.ts`'s own default for a non-`'text'`
 * atom (`getNeutronsForAtom`'s `atom.kind !== 'text'` branch,
 * `Fission.ts:132`). Porting `Neutron.ts` as a second class would
 * duplicate that logic — the exact shape ADR-9/ADR-1/ADR-2/ADR-7 all
 * reject. `getNeutrons()` throws below, matching `AbstractAtom.ts`/
 * `StripeCode.ts`/`StripeTree.ts`'s established precedent, because
 * nothing in this port can construct a `CreoleAtom` variant representing
 * "this whole `StripeLatex` block, opaquely" for `Fission.ts` to consume
 * — not because the algorithm is missing.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/StripeLatex.java
 */
import { AtomMath } from '../atom/AtomMath.js';
import { ScientificEquationSafe } from '../../../math/ScientificEquationSafe.js';
import { isLatexEnd } from '../Parser.js';
import type { FontConfiguration } from '../../shape/UText.js';
import type { UGraphic } from '../../UGraphic.js';
import type { StringBounder } from '../../font/StringBounder.js';
import type { XDimension2D } from '../../geom/XDimension2D.js';
import type { Atom } from '../SheetBlock1.js';

export class StripeLatex implements Atom {
  private readonly fontConfiguration: FontConfiguration;
  private formula = '';
  private atom: Atom | undefined;
  private terminated = false;

  constructor(fontConfiguration: FontConfiguration) {
    this.fontConfiguration = fontConfiguration;
  }

  /** Upstream's real return type (`List<Atom>`) — see this file's own
   *  module doc comment for why `../Stripe.ts`'s `CreoleAtom[]`-shaped
   *  `getAtoms()` is not implemented against here. `this` satisfies `Atom`
   *  (this class implements it below), matching upstream's
   *  `Collections.<Atom>singletonList(this)` exactly. */
  getAtoms(): readonly Atom[] {
    return [this];
  }

  /** Always `null` (java:69-71) — also happens to satisfy `../Stripe.ts`'s
   *  `CreoleAtom | null` signature, since `null` is assignable to both. */
  getLHeader(): Atom | null {
    return null;
  }

  addAndCheckTermination(line: string): boolean {
    if (isLatexEnd(line)) {
      this.terminated = true;
      return true;
    }
    this.formula += line;
    return false;
  }

  isTerminated(): boolean {
    return this.terminated;
  }

  private getAtom(): Atom {
    if (this.atom === undefined) {
      const math = ScientificEquationSafe.fromLatex(this.formula);
      this.atom = new AtomMath(math, this.fontConfiguration.color, null);
    }
    return this.atom;
  }

  calculateDimension(stringBounder: StringBounder): XDimension2D {
    return this.getAtom().calculateDimension(stringBounder);
  }

  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }

  drawU(ug: UGraphic): void {
    this.getAtom().drawU(ug);
  }

  /** ADR-9 adaptation: throws rather than constructing a `Neutron` — see
   *  this file's own module doc comment for the full reasoning. Matches
   *  `AbstractAtom.ts`/`StripeCode.ts`/`StripeTree.ts`'s established
   *  precedent exactly. Zero behavior change for any current caller:
   *  nothing in this port calls `getNeutrons()` on any `Atom` today
   *  (grep-verified across `src/`). */
  getNeutrons(): never {
    throw new Error('UnsupportedOperationException');
  }
}
