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
 */
import type { HorizontalAlignment } from '../geom/HorizontalAlignment.js';
import type { Stripe } from './Stripe.js';

export class Sheet implements Iterable<Stripe> {
  private readonly stripes: Stripe[] = [];
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

  add(stripe: Stripe): void;
  add(stripes: readonly Stripe[]): void;
  add(stripeOrStripes: Stripe | readonly Stripe[]): void {
    if (Array.isArray(stripeOrStripes)) {
      for (const s of stripeOrStripes as readonly Stripe[]) this.stripes.push(s);
      return;
    }
    this.stripes.push(stripeOrStripes as Stripe);
  }

  iterator(): IterableIterator<Stripe> {
    return this.stripes[Symbol.iterator]();
  }

  [Symbol.iterator](): IterableIterator<Stripe> {
    return this.iterator();
  }

  getLastStripe(): Stripe | null {
    const size = this.stripes.length;
    if (size === 0) return null;
    return this.stripes[size - 1] ?? null;
  }

  getHorizontalAlignment(): HorizontalAlignment {
    return this.horizontalAlignment;
  }
}
