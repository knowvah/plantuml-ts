/**
 * SingleStrategy — how standalone (unlinked) leaves are arranged
 * (`svek/SingleStrategy.java`). `Entity#getSingleStrategy` always
 * answers `SQUARE` upstream (the HLINE/VLINE link-generation code is
 * commented out upstream too — preserved there only as comments).
 *
 * SI1/T5 consumed-slice LOCAL port (full live surface: 3 values +
 * `computeBranch`; the commented-out `generateLinks`/`putInSquare` are
 * dead upstream, not dropped here). Upstream home is `svek/` — move to
 * `src/core/svek/SingleStrategy.ts` when convenient (outside this
 * task's write-set).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SingleStrategy.java:40-43
 */
export const SingleStrategy = {
  SQUARE: 'SQUARE',
  HLINE: 'HLINE',
  VLINE: 'VLINE',
} as const;
export type SingleStrategy = (typeof SingleStrategy)[keyof typeof SingleStrategy];

/** `SingleStrategy.computeBranch(int)` — ceil(sqrt(size)) via the exact
 * upstream int-truncation expression.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SingleStrategy.java:73-80 */
export function computeBranch(size: number): number {
  const sqrt = Math.sqrt(size);
  const r = Math.trunc(sqrt);
  if (r * r === size) return r;

  return r + 1;
}
