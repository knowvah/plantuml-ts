/**
 * `CharClassType` -- whether a char class matches or negates its raw class.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClassType.java
 */
export const CharClassType = {
  NORMAL: 'NORMAL',
  NEGATIVE: 'NEGATIVE',
} as const;
export type CharClassType = (typeof CharClassType)[keyof typeof CharClassType];
