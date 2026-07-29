/**
 * Stripe — one physical creole display line's built atom sequence.
 *
 * Upstream: klimt/creole/Stripe.java (`getLHeader(): Atom`, `getAtoms():
 * List<Atom>`, `Atom` the OOP `klimt.creole.atom.Atom`, uniformly for
 * every implementor). Ported in full. `getLHeader` returns `null` for L1:
 * it only ever returns non-null for `LIST_WITHOUT_NUMBER`/
 * `LIST_WITH_NUMBER` lines (`StripeStyle#getHeader`, a bullet/number-glyph
 * atom) — bullet lists are out of L1 scope (`StripeStyleType.ts`'s doc
 * comment).
 *
 * ## Generic over its atom type (batch-3a/T10g) — so every producer can
 * honestly `implements Stripe`, without touching `atom/Atom.ts`,
 * `Sheet.ts`'s two OTHER consumers (`SheetBlock1.ts`, `Fission.ts` via
 * `SheetBlock1#initMap`), or anything outside `klimt/creole/`
 *
 * `StripeTable`/`StripeTree`/`StripeCode`/`StripeLatex` each wrap ONE
 * opaque, composite `Atom` (this port's OOP `SheetBlock1.ts` interface) as
 * their entire content — T10b (`StripeTable`) first found this could not
 * satisfy a `CreoleAtom`-only `getAtoms()`, and T10c/T10d/T10e each
 * independently hit the identical fork and deferred the reconciliation
 * here (`.agent-notes/T10b-table.md` through `T10e-latex.md`).
 *
 * Two reconciliations were tried and rejected before this one:
 *  - Adding a `'block'` variant to `atom/Atom.ts`'s `CreoleAtom` union
 *    (wrapping the opaque `Atom`) looked contained, but `CreoleAtom` is
 *    consumed WAY beyond this file — `svek/image/
 *    EntityImageDescriptionSupport.ts` (explicitly off-limits this task)
 *    narrows it by ELIMINATION after handling `'text'`/`'latex'` (e.g.
 *    `measureAtomsWidthHeight`'s trailing `atom.atom` access, assuming
 *    only `'inline'` remains) — a THIRD variant silently widens that
 *    fallthrough's inferred type and fails `tsc`, which would require
 *    editing that file to fix. Any new `CreoleAtom` member has this same
 *    blast radius; none is safe to add here.
 *  - A non-generic union widening of THIS interface's `getAtoms()`
 *    (`readonly (CreoleAtom | Atom)[]`) avoids `EntityImageDescriptionSupport
 *    .ts` (which never imports `Stripe.ts`) but breaks `SheetBlock1.ts`
 *    (NOT edited by this task) identically: its `initMap` passes
 *    `stripe.getAtoms()` straight into `Fission.ts#getSplitted` (explicitly
 *    off-limits), which requires `readonly CreoleAtom[]` exactly — a
 *    uniform interface has no way to stay narrow for that ONE consumer
 *    while widening for `CreoleParser.ts`'s heterogeneous `Sheet`.
 *
 * The generic parameter resolves both: `Stripe`'s BARE (unparameterized)
 * form still defaults to `CreoleAtom` — `SheetBlock1.ts`'s own `import
 * type { Stripe }`/`import type { Sheet }` usage is 100% unchanged, so
 * `initMap`'s `stripe.getAtoms()` is still exactly `readonly CreoleAtom[]`
 * and `Fission.ts` needs no edit. `CreoleParser.ts` alone instantiates the
 * wider `Stripe<StripeAtom>`/`Sheet<StripeAtom>` for its own heterogeneous
 * sheet — see that file's own doc comment.
 */
import type { CreoleAtom } from './atom/Atom.js';
import type { Atom } from './SheetBlock1.js';

/** Either this port's data-oriented text/inline/latex union, or an opaque
 *  composite `Atom` (a table/tree/code-block/latex-block/horizontal-line/
 *  embedded-diagram) — see this file's own doc comment. */
export type StripeAtom = CreoleAtom | Atom;

export interface Stripe<A extends StripeAtom = CreoleAtom> {
  getLHeader(): A | null;
  getAtoms(): readonly A[];
}
