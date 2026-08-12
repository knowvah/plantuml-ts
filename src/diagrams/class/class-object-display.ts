/**
 * An object leaf's DISPLAY text, as the jar draws it.
 *
 * The object header is one of the few places this port measures and emits a
 * display string RAW, with no creole atom pass in between
 * (`class-object-sizing.ts#computeObjectTitle` and
 * `class-object-map-header.ts`'s name row both call
 * `measurer.measure(classifier.display, …)` directly). Upstream has no such
 * shortcut: every display reaches the SVG through the creole pipeline, whose
 * first and last steps are `CharHidder`.
 *
 * `CharHidder.hide` (`utils/CharHidder.java:44-70`, called at
 * `StripeSimple.java:150` and `CreoleStripeSimpleParser.java:140`) rewrites
 * `~X` — where X is markup-significant — to the single private-use char
 * ` + X`, CONSUMING the tilde, so no markup pattern can match it.
 * `AtomText`'s constructor then calls `CharHidder.unhide`
 * (`AtomText.java:78`) to map it back.
 *
 * Applying both here is not a shortcut of my own: it is that exact pipeline
 * with an empty middle, which is what a display with no matched markup gets
 * upstream. Written as the literal round-trip rather than a `replace(/~(.)/)`
 * so the escapable set stays owned by `CharHidder.isToBeHidden` and cannot
 * drift from it.
 *
 * Jar-verified by probe: `object "~Aaa"` draws `~Aaa` (a tilde before a
 * letter is literal), `object "#Bbb"` draws an ordered-list `1.` + `Bbb`, and
 * `object "~#1: Person"` draws `#1: Person`. That last one is
 * `object/nukera-08-dige359` and four siblings, where the undropped tilde was
 * 8.225px of excess node width.
 */

import { CharHidder } from '../../core/utils/CharHidder.js';

/**
 * The `name = value` spelling this port reconstructs an object member with
 * when the source used exactly that spacing.
 *
 * Upstream never reconstructs at all — `Member`'s constructor stores the body
 * line verbatim (`StringUtils.trin` trims only the ends) and
 * `getDisplay(false)` hands that same string back, so `a=1` stays `a=1`. This
 * port re-splits the line into name/type, so the two halves of the round-trip
 * have to agree on one canonical spelling: `class-object-commands.ts
 * #objectTypeSeparatorField` collapses THIS string to "absent", and
 * `class-object-sizing.ts#formatObjectMemberText` re-inflates "absent" back to
 * it. They must stay byte-identical or the round-trip silently drops the
 * source spacing, and no gate can see that — a space measures 0 wide under
 * `DeterministicMeasurer`, so the emitted DOT is unchanged. Hence one shared
 * constant rather than a literal at each end.
 *
 * Lives in this module because it is display-text reconstruction, and because
 * this module is a leaf: `class-object-commands.ts` sits in an import cycle
 * with `parser.ts`, so the constant cannot live there without dragging
 * `class-object-sizing.ts` into that cycle.
 *
 * @see ~/git/plantuml/.../cucadiagram/Member.java (constructor)
 */
export const CANONICAL_OBJECT_SEPARATOR = ' = ';

/** The display with its tilde escapes resolved, for both measuring and
 *  emitting — the two must stay in lock-step
 *  (`tests/architecture/sizer-renderer-parity.test.ts`). */
export function objectDisplayText(display: string): string {
  return CharHidder.unhide(CharHidder.hide(display));
}
