/**
 * Rankdir — the layout direction a `SkinParam` carries (`left to right
 * direction` / `top to bottom direction`, `CommandRankDir`). Read by the
 * mindmap `FingerImpl`/`MindMap` drawing to swap thickness and elongation.
 *
 * As-const object, not a TS `enum` (project convention — see
 * `VerticalAlignment.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/Rankdir.java:38-41
 */
export const Rankdir = {
  LEFT_TO_RIGHT: 'LEFT_TO_RIGHT',
  TOP_TO_BOTTOM: 'TOP_TO_BOTTOM',
} as const;

export type Rankdir = (typeof Rankdir)[keyof typeof Rankdir];
