/**
 * StripeRaw — upstream: klimt/creole/legacy/StripeRaw.java (`interface
 * StripeRaw extends Stripe, Atom`). The marker interface a "raw"
 * continuation stripe implements — one that accumulates further physical
 * lines via `addAndCheckTermination` (each returning whether the line was
 * consumed as part of the still-open block) until `isTerminated()` reports
 * the block's own closing delimiter was seen. Its upstream implementors
 * (`StripeCode.java`, `StripeLatex.java`) are each their own unported
 * sibling class (T10c/T10e), not built here.
 *
 * Ported in full as a structural interface: `legacy/CreoleParser.ts`'s own
 * doc comment documents the `lastStripe instanceof StripeRaw` CONTINUATION
 * check (java:81-89) as omitted only because nothing in that file can yet
 * construct a `StripeRaw` — this interface is the prerequisite T10g's
 * reinstatement will duck-type `lastStripe` against once real
 * `StripeCode`/`StripeLatex` constructors exist.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/StripeRaw.java
 */
import type { Stripe } from '../Stripe.js';
import type { Atom } from '../SheetBlock1.js';

export interface StripeRaw extends Stripe, Atom {
  addAndCheckTermination(line: string): boolean;
  isTerminated(): boolean;
}
