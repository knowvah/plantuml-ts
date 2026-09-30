/**
 * StyleScheme — which half of a `DarkString` a parsed value fills:
 * `REGULAR` before an `@media` block, `DARK` from it on
 * (StyleParser.java:128-129, 150-152). As-const object (no `const enum`).
 *
 * Lives in `style/` upstream; placed beside its only consumer here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleScheme.java:38-42
 */
export const StyleScheme = {
  REGULAR: 'REGULAR',
  DARK: 'DARK',
} as const;

export type StyleScheme = (typeof StyleScheme)[keyof typeof StyleScheme];
