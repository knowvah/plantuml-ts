/**
 * Terminator — what ends a salt token: the end of its source line
 * (`NEWLINE`) or a column/structure delimiter after it on the same line
 * (`NEWCOL`). Assigned by `DataSourceImpl`.
 *
 * As-const object + string union, not a TS `enum` (project convention,
 * `src/core/abel/Direction.ts`); the values are the Java constant names, which
 * is what `Terminated.toString()` prints.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/Terminator.java:38-40
 */
export const Terminator = {
  NEWLINE: 'NEWLINE',
  NEWCOL: 'NEWCOL',
} as const;
export type Terminator = (typeof Terminator)[keyof typeof Terminator];
