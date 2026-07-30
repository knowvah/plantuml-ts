/**
 * Sheet — an ordered list of `Stripe`s (one per physical creole display
 * line) plus the `HorizontalAlignment` the sheet as a whole aligns to.
 * `SheetBlock1` wraps one `Sheet` and does the actual word-wrap/stacking
 * (`Fission`, `Sea`) at draw time — `Sheet` itself is a plain ordered
 * container, no layout.
 *
 * Upstream: klimt/creole/Sheet.java. Ported in full: the constructor,
 * `add(Stripe)`, `add(List<Stripe>)`, `iterator()` (`Iterable<Stripe>`),
 * `getLastStripe()`, `getHorizontalAlignment()`, `toString()`.
 *
 * ## Generic over its stripe's atom type (batch-3a/T10g)
 *
 * Mirrors `Stripe.ts`'s own generic parameter, for the identical reason —
 * see that file's doc comment. Bare `Sheet` (no type argument) still means
 * `Sheet<CreoleAtom>`, so `SheetBlock1.ts`'s existing `sheet: Sheet` field
 * and every other pre-T10g caller (`StripeTable.ts#asAtom`, which only
 * ever populates a `Sheet` with `CreoleAtom`-flavored cells) is unchanged.
 * `CreoleParser.ts` alone instantiates `Sheet<StripeAtom>`, since its own
 * sheet holds a genuine mix of both flavors line-by-line.
 */
import type { HorizontalAlignment } from '../geom/HorizontalAlignment.js';
import type { Stripe, StripeAtom } from './Stripe.js';
import type { CreoleAtom } from './atom/Atom.js';

export class Sheet<A extends StripeAtom = CreoleAtom> implements Iterable<Stripe<A>> {
  private readonly stripes: Stripe<A>[] = [];
  private readonly horizontalAlignment: HorizontalAlignment;

  constructor(horizontalAlignment: HorizontalAlignment) {
    this.horizontalAlignment = horizontalAlignment;
  }

  toString(): string {
    // Bug-for-bug port of Sheet.java's `stripes.toString()`, which relies
    // on each concrete Stripe's own Object#toString override at runtime —
    // the Stripe interface itself declares no toString.
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return `[${this.stripes.map((s) => String(s)).join(', ')}]`;
  }

  add(stripe: Stripe<A>): void;
  add(stripes: readonly Stripe<A>[]): void;
  add(stripeOrStripes: Stripe<A> | readonly Stripe<A>[]): void {
    if (Array.isArray(stripeOrStripes)) {
      for (const s of stripeOrStripes as readonly Stripe<A>[]) this.stripes.push(s);
      return;
    }
    this.stripes.push(stripeOrStripes as Stripe<A>);
  }

  iterator(): IterableIterator<Stripe<A>> {
    return this.stripes[Symbol.iterator]();
  }

  [Symbol.iterator](): IterableIterator<Stripe<A>> {
    return this.iterator();
  }

  getLastStripe(): Stripe<A> | null {
    const size = this.stripes.length;
    if (size === 0) return null;
    return this.stripes[size - 1] ?? null;
  }

  getHorizontalAlignment(): HorizontalAlignment {
    return this.horizontalAlignment;
  }
}
