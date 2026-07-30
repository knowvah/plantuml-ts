/**
 * CreoleContext — per-numbered-list-order running counter, used while
 * parsing a creole block to assign sequential numbers to `#`-style
 * ordered-list lines (`StripeStyle#getHeader`) and reset the count for a
 * deeper/shallower nesting `order` once the list's indentation changes.
 *
 * Upstream: klimt/creole/CreoleContext.java. Ported in full:
 * `getLocalNumber(order)`, the private `ensureStackOk(order)` helper.
 *
 * No caller in this port yet — `legacy/CreoleParser.java` (the FULL creole
 * parser that threads `CreoleContext` through ordered-list numbering) is
 * not ported; this port's `legacy/StripeSimple.ts`/
 * `legacy/CreoleStripeSimpleParser.ts` never construct one (L1 scope, see
 * `StripeStyleType.ts`'s doc comment: numbered lists are deferred). Ported
 * per ADR-8/batch-3a's explicit dependency list regardless — a small,
 * self-contained value class with no downstream risk from being ahead of
 * its first caller.
 */
export class CreoleContext {
  private readonly stack: number[] = [];

  getLocalNumber(order: number): number {
    this.ensureStackOk(order);
    const n = this.stack[order] as number;
    this.stack[order] = n + 1;
    return n;
  }

  private ensureStackOk(order: number): void {
    while (this.stack.length <= order) {
      this.stack.push(0);
    }
    while (this.stack.length > order + 1) {
      this.stack.pop();
    }
  }
}
