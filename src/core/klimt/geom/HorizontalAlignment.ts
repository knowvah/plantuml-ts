/**
 * HorizontalAlignment — the 3-way text/label alignment `USymbol#asSmall`/
 * `asBig` (decoration/symbol/USymbol.java) take for the stereotype and,
 * for `asBig`, the label too (see `USymbolRectangle.java`'s `asBig`,
 * which branches on `labelAlignment`/`stereoAlignment`).
 *
 * Upstream: klimt/geom/HorizontalAlignment.java — a 3-value enum with
 * `fromString`, `getGraphVizValue`, `draw(UGraphic, TextBlock, ...)`,
 * `getPosition`, and `asPlacementStrategy`.
 *
 * Scope reduction (T3 mission brief — port only what `USymbol`/
 * `SymbolContext`/the `TextBlock` seam and `EntityImageDescription`
 * actually exercise): only the 3 enum values are ported. `fromString`
 * (skinparam-string parsing), `getGraphVizValue` (DOT layout), `draw`
 * (needs `ug.getStringBounder()` — this port's `UGraphic`, T2, has no
 * such method) and `asPlacementStrategy` (needs the unported
 * `PlacementStrategy*` family) are NOT exercised by any of `USymbol`,
 * `SymbolContext`, the `TextBlock` seam, or `EntityImageDescription` —
 * deferred to whichever later task first needs them.
 *
 * As-const object, not a TS `enum` (project convention — safer across
 * declaration-file boundaries than `const enum`, see code-principles).
 */
export const HorizontalAlignment = {
  LEFT: 'LEFT',
  CENTER: 'CENTER',
  RIGHT: 'RIGHT',
} as const;

export type HorizontalAlignment = (typeof HorizontalAlignment)[keyof typeof HorizontalAlignment];

/**
 * `HorizontalAlignment.fromString(String)` (single-argument overload): the
 * constant whose `name()` equals `s` ignoring case, else `undefined`
 * (upstream `null`, including for a `null` argument --
 * `equalsIgnoreCase(null)` is false). The two-argument overload
 * (java:62-73) is not ported here.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/HorizontalAlignment.java:49-60
 */
export function horizontalAlignmentFromString(s: string | null): HorizontalAlignment | undefined {
  if (s === null) return undefined;
  const upper = s.toUpperCase();
  if (upper === 'LEFT' || upper === 'CENTER' || upper === 'RIGHT') return HorizontalAlignment[upper];
  return undefined;
}
