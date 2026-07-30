/**
 * StripeRaw — upstream: klimt/creole/legacy/StripeRaw.java (`interface
 * StripeRaw extends Stripe, Atom`). The marker interface a "raw"
 * continuation stripe implements — one that accumulates further physical
 * lines via `addAndCheckTermination` (each returning whether the line was
 * consumed as part of the still-open block) until `isTerminated()` reports
 * the block's own closing delimiter was seen. Its upstream implementors
 * (`StripeCode.java`, `StripeLatex.java`) are `legacy/StripeCode.ts`/
 * `legacy/StripeLatex.ts` (T10d/T10e), both now declaring `implements
 * StripeRaw` (batch-3a/T10g, once `../Stripe.ts`'s generic parameter let
 * them honestly satisfy the `Stripe<Atom>` half of this interface — see
 * either file's own doc comment).
 *
 * `extends Stripe<Atom>` (not bare `Stripe`, which now defaults to
 * `CreoleAtom`) — matches upstream's own `Atom`-typed `Stripe` exactly,
 * since a `StripeRaw` implementor's entire content IS itself (an opaque
 * composite `Atom`), never a flat text/inline/latex run.
 *
 * Ported in full as a structural interface: `legacy/CreoleParser.ts`'s
 * `isStripeRaw` duck-type guard (java:81-89's `lastStripe instanceof
 * StripeRaw` check — TS interfaces have no runtime representation to
 * `instanceof` against) narrows `lastStripe` to this shape by checking for
 * `addAndCheckTermination`/`isTerminated`, the two members no other
 * `Stripe` producer in this port declares.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/StripeRaw.java
 */
import type { Stripe } from '../Stripe.js';
import type { Atom } from '../SheetBlock1.js';

export interface StripeRaw extends Stripe<Atom>, Atom {
  addAndCheckTermination(line: string): boolean;
  isTerminated(): boolean;
}
