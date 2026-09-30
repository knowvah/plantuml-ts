/**
 * MergeStrategy — how `Style#mergeWith` treats an existing value whose
 * priority is above `StyleLoader.DELTA_PRIORITY_FOR_STEREOTYPE`
 * (Style.java:121-135). As-const object (no `const enum`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/MergeStrategy.java:38
 */
export const MergeStrategy = {
  KEEP_EXISTING_VALUE_OF_STEREOTYPE: 'KEEP_EXISTING_VALUE_OF_STEREOTYPE',
  OVERWRITE_EXISTING_VALUE: 'OVERWRITE_EXISTING_VALUE',
} as const;

export type MergeStrategy = (typeof MergeStrategy)[keyof typeof MergeStrategy];
