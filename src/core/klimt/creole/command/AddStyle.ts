/**
 * AddStyle — applies one `FontStyle` flag to a `FontConfiguration`.
 *
 * Upstream: klimt/creole/command/AddStyle.java (`style`+`extendedColor` ctor
 * fields, `apply(FontConfiguration): FontConfiguration` = `initial.add
 * (style)` plus an optional `changeExtendedColor`, java:52-58). Both halves
 * are ported: cdd-B7FU-R1 added `FontConfiguration.extendedColor`
 * (`shape/UText.ts`) and made `CommandCreoleStyle.ts`'s activation patterns
 * CAPTURE the `<u:color>`/`<w:color>`/`<s:color>`/`<back:color>` colour they
 * previously matched and discarded, so the second half now has a value to
 * carry. `extendedColor === undefined` is upstream's `null` — the branch is
 * skipped and the configuration is returned with `add(style)` alone, which
 * is what every colourless style command still produces.
 *
 * cdd-T25 ports `FontStyle.PLAIN`'s "clear all styles first" branch:
 * `FontConfiguration.add(FontStyle)` (`FontConfiguration.java:301-309`):
 * `final EnumSet<FontStyle> r = styles.clone(); if (style == FontStyle
 * .PLAIN) r.clear(); r.add(style); return new FontConfiguration(r, ...)`
 * — every OTHER tracked style is dropped before PLAIN itself is added.
 * `FontStyle#mutateFont` (`FontStyle.java:75-77`) separately resets the
 * MEASURED font face to `UFontFace.normal()` for PLAIN, but that is a
 * `FontConfiguration#getFont()`-only concern (measurement); this port's
 * `FontConfiguration` (`shape/UText.ts`) has no separate mutable "current
 * font face" distinct from `styles` (its own doc comment: DRIVER-side
 * concerns are deferred), so clearing `styles` is the full observable
 * effect here — a header/member row's OWN base bold/italic (its `styles`
 * seed, `class-member-creole.ts#memberBaseFont`) is a REGULAR style entry
 * in this flat model, not a separate face, so `<plain>` correctly drops
 * it too (matching this port's own architecture, not a fitted shortcut).
 *
 * `FontConfiguration.styles` is an immutable `ReadonlySet` (`UText.ts`) —
 * `addFontStyle` returns a NEW `FontConfiguration` with the style unioned
 * in (or, for PLAIN, the set replaced), never mutates the input (this
 * project's testability rule: pure functions over in-place mutation).
 */
import { FontStyle, changeExtendedColor, type FontConfiguration } from '../../shape/UText.js';

/** Upstream `FontConfiguration#add(FontStyle)` (`FontConfiguration.java:
 *  301-309`) — the `styles`-only half of `AddStyle#apply`. */
function addStyleOnly(font: FontConfiguration, style: FontStyle): FontConfiguration {
  if (style === FontStyle.PLAIN) return { ...font, styles: new Set([FontStyle.PLAIN]) };
  if (font.styles.has(style)) return font;
  return { ...font, styles: new Set(font.styles).add(style) };
}

/** Upstream `AddStyle#apply(FontConfiguration)` (`AddStyle.java:52-58`). */
export function addFontStyle(font: FontConfiguration, style: FontStyle, extendedColor?: string): FontConfiguration {
  const withStyle = addStyleOnly(font, style);
  return extendedColor === undefined ? withStyle : changeExtendedColor(withStyle, extendedColor);
}
