/**
 * StripeCode — one `<code>...</code>` fenced block: a "raw" continuation
 * stripe that accumulates every physical line between `<code>` and
 * `</code>` verbatim (no creole markup parsing inside the fence) and draws
 * them top-to-bottom in one `FontConfiguration` (upstream's own caller,
 * `CreoleParser.java:103-104`, resolves it to the `MONOSPACED` family
 * before construction — `Parser.ts#MONOSPACED`).
 *
 * Upstream: klimt/creole/legacy/StripeCode.java (124 lines,
 * `extends TextBlockMemoized implements StripeRaw`). Ported in full —
 * every member has a faithful TS counterpart:
 *  - constructor (java:61-63)
 *  - `getLHeader` (java:69-71) — always `null`, matching every other
 *    `StripeStyleType` fallthrough this port has (`StripeStyle.ts`'s own
 *    NORMAL/HEADING/HORIZONTAL_LINE/TREE cases, `StripeTree.ts`'s
 *    identical always-`null` `getLHeader`).
 *  - `addAndCheckTermination` (java:74-81) — `Parser.isCodeEnd(line)`
 *    terminates the block; every other line is accumulated verbatim into
 *    `raw`.
 *  - `isTerminated` (java:84-86).
 *  - `calculateDimensionSlow` (java:89-98) — max width over all raw
 *    lines, summed height.
 *  - `getStartingAltitude` (java:100-102) — always 0.
 *  - `drawU` (java:104-117) — draws each raw line at the cumulative
 *    y-cursor, baseline-adjusted by that line's own descent (see the
 *    `adjustColorForBackground` note below for the one adaptation inside
 *    this method).
 *  - `getNeutrons` (java:119-122) — see the `Neutron` verdict below.
 *
 * ## `getAtoms()` return type: this port's OOP `Atom`, NOT `Stripe.ts`'s
 * `CreoleAtom` — `implements Stripe`/`StripeRaw` deliberately NOT declared
 *
 * Same fork `StripeTree.ts` (T10c, concurrent sibling) already hit and
 * documented for the identical reason: upstream's real `Stripe#getAtoms()`
 * is `List<Atom>` (the general OOP interface any concrete atom — including
 * a "compound" atom that IS the whole stripe, `Collections
 * .singletonList(this)` here) satisfies; `../Stripe.ts` narrows that to
 * `readonly CreoleAtom[]` — faithful only for `StripeSimple`'s flat
 * text/inline/latex runs (`legacy/StripeSimple.ts#buildLineAtoms`'s own
 * output shape). A multi-line monospaced code block has no `CreoleAtom`
 * representation (it is a measured/drawn sub-block, not a text/inline/
 * latex token), so `StripeCode` cannot honestly satisfy `../Stripe.ts`'s
 * CURRENT signature. `../Stripe.ts` is shared, cross-cutting
 * infrastructure also needed, identically, by T10b's concurrent
 * `StripeTable` and T10c's `StripeTree` — widening it is outside this
 * task's write-set and is flagged here for T10g (the task that reinstates
 * every `lastStripe instanceof Stripe*` seam together), not patched
 * unilaterally. `getAtoms()`/`getLHeader()` below are typed against the
 * REAL upstream contract (`Atom` from `../SheetBlock1.js`) so the gap is
 * visible at the type level, not silently cast away. Unlike `StripeTree`,
 * `StripeCode` has NO other blocked member — every method below is fully
 * reachable and tested today (nothing about `StripeCode` itself depends
 * on a concurrent sibling or an unported class).
 *
 * ## `adjustColorForBackground` — a pre-existing gap (`HColor`), not a new
 * one this task introduces
 *
 * `drawU`'s upstream body (java:108) calls `fontConfiguration
 * .adjustColorForBackground(ug)` — `FontConfiguration.java#
 * adjustColorForBackground` reads `ug.getParam().getBackcolor()` (an
 * `HColor`) and `getColor().getAppropriateColor(backcolor)`, both HColor
 * operations. `HColor` is not ported anywhere in this port
 * (`Position.ts`'s own doc comment; `ISkinSimple.ts`'s own doc comment
 * omits `getIHtmlColorSet()` for the identical reason; `StripeStyle.ts`'s
 * `getHeader` seam cites the SAME gap). This port's `FontConfiguration`
 * (`shape/UText.ts`) has already collapsed HColor-based resolution into a
 * plain resolved `color: string | null` field at an earlier ported stage
 * (`UText.ts`'s own doc comment: "a resolved SVG-ready color string
 * stands in") — there is no `adjustColorForBackground`-shaped operation
 * left to call in this port's model, so `drawU` below draws with
 * `this.fontConfiguration` as-is. Not a behavior drop: the color this
 * port's `FontConfiguration` carries IS the already-resolved value
 * upstream's `adjustColorForBackground` would have produced by the time
 * any caller in this port constructs one (no caller anywhere in this port
 * ever builds an UNRESOLVED, contrast-pending `FontConfiguration`).
 *
 * ## `Neutron` verdict: NOT ported — `Fission.ts` already carries its
 * only reachable behavior
 *
 * `getNeutrons()` (java:119-122) is `Neutron`'s ONLY call site anywhere
 * upstream (`Neutron.create(Atom)`'s only caller is `Fission
 * .java#getSplitted`, java:74 — grep-verified against `~/git/plantuml`).
 * `Fission.ts#getSplitted` is already a verified-faithful, jar-checked
 * port of `Fission.java` + `Neutron.java`'s combined algorithm (E2r/L3,
 * T8's own finding), bound to `CreoleAtom` instead of the OOP `Atom`
 * hierarchy — `getNeutronsForAtom` (`Fission.ts:131-148`) IS `Neutron
 * .create`'s decomposition logic, restated over `CreoleAtom`. Porting
 * `Neutron.ts` as a second class here would duplicate that logic, the
 * exact shape ADR-9/ADR-1/ADR-2/ADR-7 all reject. Concretely for
 * `StripeCode`: `Neutron.create(this)` (java:121) dispatches on
 * `atom instanceof AtomText` (java:56) — `StripeCode` is never an
 * `AtomText`, so it ALWAYS takes the generic `else` branch,
 * `new Neutron(null, NeutronType.UNKNOWN, atom)` (java:58-59) — a single
 * indivisible, unbreakable neutron wrapping the block itself. This is
 * `Fission.ts`'s OWN default for a non-`'text'` `CreoleAtom`
 * (`getNeutronsForAtom`'s `if (atom.kind !== 'text') return [{ type:
 * 'UNKNOWN', atom }];`, `Fission.ts:132`) — i.e. even the SPECIFIC value
 * `StripeCode.getNeutrons()` would produce is already the exact shape
 * `Fission.ts` returns for any non-text atom today. `getNeutrons()`
 * throws below (matching `AbstractAtom.ts`/`SheetBlock1.ts`/
 * `SheetBlock2.ts`'s established precedent) because nothing in this port
 * can construct a `CreoleAtom` variant representing "this whole
 * `StripeCode` block, opaquely" (the same `getAtoms()` gap documented
 * above) for `Fission.ts` to actually consume — not because the
 * algorithm is missing.
 *
 * ## `getDescent`/`calculateDimension` are computed via `StringBounder`
 * directly, not `UText#getDescent`/`#calculateDimension`
 *
 * `UText.ts`'s own doc comment defers `getDescent(stringBounder)`/
 * `calculateDimension(stringBounder)` as out of its own scope ("D3'").
 * `EntityImageDescriptionSupport.ts#measureLine` already established the
 * call-site replacement this whole port uses instead:
 * `stringBounder.calculateDimension(font, text)` /
 * `stringBounder.getDescent?.(font, text) ?? font.size / 4.5` — reused
 * here unchanged rather than re-deriving a second copy.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/StripeCode.java
 */
import { TextBlockMemoized } from '../../shape/TextBlockMemoized.js';
import { UText } from '../../shape/UText.js';
import type { FontConfiguration } from '../../shape/UText.js';
import { UTranslate } from '../../UTranslate.js';
import { XDimension2D } from '../../geom/XDimension2D.js';
import type { UGraphic } from '../../UGraphic.js';
import type { StringBounder } from '../../font/StringBounder.js';
import type { Atom } from '../SheetBlock1.js';
import { isCodeEnd } from '../Parser.js';

export class StripeCode extends TextBlockMemoized implements Atom {
  private readonly fontConfiguration: FontConfiguration;
  private readonly raw: string[] = [];
  private terminated = false;

  constructor(fontConfiguration: FontConfiguration) {
    super();
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
    if (isCodeEnd(line)) {
      this.terminated = true;
      return true;
    }
    this.raw.push(line);
    return false;
  }

  isTerminated(): boolean {
    return this.terminated;
  }

  protected calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    let width = 0;
    let height = 0;
    for (const s of this.raw) {
      const dim = stringBounder.calculateDimension(this.fontConfiguration, s);
      width = Math.max(width, dim.getWidth());
      height += dim.getHeight();
    }
    return new XDimension2D(width, height);
  }

  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }

  drawU(ug: UGraphic): void {
    let y = 0;
    const stringBounder = ug.getStringBounder();
    for (const s of this.raw) {
      // No adjustColorForBackground call -- see this file's own module
      // doc comment (a pre-existing HColor gap, not a new one).
      const shape = UText.build(s, this.fontConfiguration);
      const dim = stringBounder.calculateDimension(this.fontConfiguration, s);
      y += dim.getHeight();
      const descent = stringBounder.getDescent?.(this.fontConfiguration, s) ?? this.fontConfiguration.size / 4.5;
      ug.apply(UTranslate.dy(y - descent)).draw(shape);
    }
  }

  /** ADR-9 adaptation: throws rather than constructing a `Neutron` — see
   *  this file's own module doc comment's `Neutron` verdict for the full
   *  reasoning. Matches `AbstractAtom.ts`/`SheetBlock1.ts`/
   *  `SheetBlock2.ts`'s established precedent exactly. Zero behavior
   *  change for any current caller: nothing in this port calls
   *  `getNeutrons()` on any `Atom` today (grep-verified across `src/`). */
  getNeutrons(): never {
    throw new Error('UnsupportedOperationException');
  }
}
