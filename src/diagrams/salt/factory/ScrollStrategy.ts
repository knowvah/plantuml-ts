/**
 * ScrollStrategy — which scroll bars a `{S` scrolled pyramid draws: both,
 * vertical only (`{SI`) or horizontal only (`{S-`); read by
 * `ElementPyramidScrolled.java:64`.
 *
 * As-const object + string union, not a TS `enum` (project convention,
 * `src/diagrams/mindmap/IdeaShape.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ScrollStrategy.java:38-52
 */
export const ScrollStrategy = {
  BOTH: 'BOTH',
  VERTICAL_ONLY: 'VERTICAL_ONLY',
  HORIZONTAL_ONLY: 'HORIZONTAL_ONLY',
} as const;
export type ScrollStrategy = (typeof ScrollStrategy)[keyof typeof ScrollStrategy];

/**
 * `ScrollStrategy.fromDesc(String)` — `HORIZONTAL_ONLY` when `s` ends in
 * `-`, else `VERTICAL_ONLY` when it ends in `I`, else `BOTH`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/factory/ScrollStrategy.java:42-50
 */
export function fromDesc(s: string): ScrollStrategy {
  if (s.endsWith('-')) {
    return ScrollStrategy.HORIZONTAL_ONLY;
  }
  if (s.endsWith('I')) {
    return ScrollStrategy.VERTICAL_ONLY;
  }
  return ScrollStrategy.BOTH;
}
