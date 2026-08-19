/**
 * FontPosition — where a creole text run sits relative to the normal
 * baseline: NORMAL, EXPOSANT (`<sup>`) or INDICE (`<sub>`).
 *
 * Upstream: `klimt/font/FontPosition.java` (a Java `enum` with three
 * members and three methods). Ported as a string union plus three free
 * functions, per this project's no-`const enum` convention (the same
 * shape `FontStyle` in `klimt/shape/UText.ts` already uses).
 *
 * The three methods are ported verbatim, each citing its own upstream
 * lines. Nothing else lives on the upstream enum.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontPosition.java:38-74
 */
export const FontPosition = {
  NORMAL: 'NORMAL',
  EXPOSANT: 'EXPOSANT',
  INDICE: 'INDICE',
} as const;
export type FontPosition = (typeof FontPosition)[keyof typeof FontPosition];

/** Upstream `FontPosition#getSpace()` (java:41-49) — the vertical offset a
 *  run in this position starts at: EXPOSANT −6 (raised), INDICE +3
 *  (lowered), NORMAL 0. Verbatim, including the asymmetry between the two
 *  magnitudes (upstream's own values; not a symmetric pair). */
export function fontPositionSpace(position: FontPosition): number {
  if (position === FontPosition.EXPOSANT) return -6;
  if (position === FontPosition.INDICE) return 3;
  return 0;
}

/** Upstream `FontPosition#mute(UFont)` (java:51-60) — a non-NORMAL position
 *  shrinks the font by 3 points, clamped at a floor of 2; NORMAL returns the
 *  font untouched. Upstream mutes a whole `UFont`; this port's
 *  `FontConfiguration` (`klimt/shape/UText.ts`) carries the size as a plain
 *  number, so only the size term is ported — the family is never touched by
 *  `mute` upstream either. */
export function muteFontSize(size: number, position: FontPosition): number {
  if (position === FontPosition.NORMAL) return size;
  const muted = size - 3;
  return muted < 2 ? 2 : muted;
}

/** Upstream `FontPosition#getHtmlTag()` (java:63-70) — the creole tag name
 *  `CommandCreoleExposantChange.create` builds its pattern from. NORMAL
 *  throws (upstream: `UnsupportedOperationException`), so the return type is
 *  the two-member union rather than `string`. */
export function fontPositionHtmlTag(position: FontPosition): 'sup' | 'sub' {
  if (position === FontPosition.EXPOSANT) return 'sup';
  if (position === FontPosition.INDICE) return 'sub';
  throw new Error(`FontPosition.getHtmlTag: unsupported for ${position}`);
}
