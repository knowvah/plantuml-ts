/**
 * SheetBuilder — the single method `Display#getCreole` calls to turn a
 * `Display` into a laid-out `Sheet`.
 *
 * Upstream: klimt/creole/SheetBuilder.java (interface, 42 lines, one
 * method: `Sheet createSheet(Display display)`). Its sole upstream
 * implementor is `klimt/creole/legacy/CreoleParser.java` (`CreoleParser.ts`,
 * this task).
 *
 * ## The `Display` coupling seam (for T9c)
 *
 * `Display` (klimt/creole/Display.java, 796 lines) is NOT ported yet — it
 * is T9c's own target, gated on this file. `DisplayLike` below is the
 * minimal structural shape `CreoleParser.createSheet`/`createSheetSlow`
 * actually read, traced directly from `CreoleParser.java:131-185`:
 *
 *  - `isNull` — backs `Display.isNull(display)` (java:609-612, static:
 *    `display == null || display.isNull`), exposed here as
 *    {@link isNullDisplay} so `CreoleParser` needs no static import of the
 *    real `Display` class.
 *  - `showStereotype` — `Display#showStereotype()` (java:123-125), read
 *    once per `Stereotype` element while iterating.
 *  - `cacheKey()` — **not an upstream member.** Upstream's
 *    `createSheet` cache is `Map<Display, Sheet>` keyed by VALUE equality:
 *    `Display#hashCode` returns `42` when `isNull`, else
 *    `displayData.hashCode()`, and `Display#equals` compares `displayData`
 *    lists directly (java:98-110) — two DIFFERENT `Display` instances with
 *    identical lines hit the SAME cache entry. A plain JS `Map` keys by
 *    object identity, not value, so reusing one verbatim would silently
 *    stop being faithful (a distinct-but-equal `Display` would always miss
 *    and re-parse — a performance-only divergence today, since nothing
 *    calls `createSheet` yet, but a correctness one once T2b resumes and
 *    re-renders the same display repeatedly). `cacheKey()` is the seam:
 *    **T9c's `Display` must return a string equal if and only if
 *    upstream's `hashCode`/`equals` would agree** — i.e. derived from
 *    `displayData`'s content (a join of each line's own text, with
 *    `Stereotype` elements folded to a stable string), with one reserved
 *    key for `isNull` displays (upstream's `Display.NULL` is a single
 *    shared sentinel, so any string that cannot arise from real content
 *    works, e.g. `' NULL'`).
 *  - the `Iterable<CharSequence>` surface (`Display implements
 *    Iterable<CharSequence>`), narrowed to {@link DisplayLine} — `string |
 *    StereotypeLike`, since `Stereotype implements CharSequence`
 *    (stereo/Stereotype.java:59) is the ONLY non-`String` element upstream
 *    ever places in `displayData` (`Display#getStereotypeIfAny`'s own scan
 *    is the evidence, java:139-141 area).
 *
 * T9c must make `Display` satisfy `DisplayLike` **structurally** (no
 * import needed in either direction — this is the seam, not a dependency),
 * and make each `Stereotype` element satisfy {@link StereotypeLike}
 * (`stereo/Stereotype.ts`, T9b, parallel — also no direct import: T9a
 * cannot depend on a sibling task's concurrently-written file).
 *
 * `Display.iterator()`'s embedded-diagram / `EmbeddedDiagram.getEmbeddedType`
 * detection scans a display line's raw characters directly (`CharSequence`)
 * — `CreoleParser.ts` reads a `Stereotype`-typed element via `String(cs)`
 * for that one check (see `CreoleParser.ts`'s own doc comment), so
 * `StereotypeLike` does not need to be a full `CharSequence`.
 *
 * ## `Sheet<StripeAtom>` (batch-3a/T10g)
 *
 * `CreoleParser.ts` (the sole implementor) builds a `Sheet` whose stripes
 * genuinely mix both of `Stripe.ts`'s atom flavors line-by-line (a plain
 * text line's `Stripe<CreoleAtom>` alongside a table/tree/code/latex/
 * horizontal-line/embedded line's `Stripe<Atom>`) — see that file's own
 * doc comment. `createSheet` is widened to `Sheet<StripeAtom>` to match;
 * nothing else implements `SheetBuilder` today, so this is a zero-impact
 * widening for every other reference to this interface.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/SheetBuilder.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 */
import type { Sheet } from './Sheet.js';
import type { StripeAtom } from './Stripe.js';
import type { GuillemetPair } from '../../text/Guillemet.js';

/**
 * Minimal structural shape `stereo/Stereotype.ts` (T9b) must satisfy for a
 * `Stereotype`-typed `Display` element to flow through `CreoleParser`.
 *
 * Upstream: `Stereotype#getLabels(Guillemet): List<String>`
 * (stereo/Stereotype.java:177). `toString()` mirrors `Stereotype implements
 * CharSequence` (stereo/Stereotype.java:59) — `CreoleParser`'s embedded-
 * diagram scan (`EmbeddedDiagram.getEmbeddedType(CharSequence)`) runs over
 * ANY `displayData` element, Stereotype included, so a meaningful string
 * form is required, not just the two labels-related members.
 */
export interface StereotypeLike {
  getLabels(guillemet: GuillemetPair): readonly string[];
  toString(): string;
}

/**
 * `cucadiagram/Member` — the third non-`String` `CharSequence` upstream
 * places in a `Display`: `BodierLikeClassOrObject#getFieldsToDisplay`/
 * `#getMethodsToDisplay` return `Display.create(List<Member>)`
 * (BodierLikeClassOrObject.java:133/:163) and `MethodsOrFieldsArea`
 * recovers the members via `instanceof Member`. Duck-typed here beside
 * {@link StereotypeLike} (same rationale) so klimt/ takes no
 * cucadiagram/ import; generic `Display` paths read a `Member` through
 * `String(e)`/`toString()` exactly as upstream's generic `CharSequence`
 * handling does. SI1/T7.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:49-63
 */
export interface MemberLike {
  getDisplay(withVisibilityChar: boolean): string;
  hasUrl(): boolean;
  toString(): string;
}

/** One element of `Display#displayData` — upstream's `CharSequence`,
 *  narrowed to the two concrete kinds that actually appear there (see
 *  module doc comment). */
export type DisplayLine = string | StereotypeLike;

/** The minimal `Display` surface `SheetBuilder`/`CreoleParser` need — see
 *  module doc comment for the derivation and the `cacheKey()` contract. */
export interface DisplayLike extends Iterable<DisplayLine> {
  readonly isNull: boolean;
  readonly showStereotype: boolean;
  cacheKey(): string;
}

/**
 * Upstream: `Display.isNull(Display)` (java:609-612) —
 * `display == null || display.isNull`. Exported so `CreoleParser` (and any
 * future caller) does not need its own copy, matching the static helper's
 * upstream role.
 */
export function isNullDisplay(display: DisplayLike | null | undefined): boolean {
  return display == null || display.isNull;
}

export interface SheetBuilder {
  createSheet(display: DisplayLike): Sheet<StripeAtom>;
}
