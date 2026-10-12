/**
 * TableStrategy — which lines a salt table/tree draws: none, the outline,
 * the outline under a title, every row line, every column line, or all.
 * Selected by the char after `{#`/`{T` (`ElementFactoryPyramid.java:67`,
 * `ElementFactoryTree.java:62`).
 *
 * As-const object + string union, not a TS `enum` (project convention,
 * `src/diagrams/mindmap/IdeaShape.ts`); each constant's upstream char lives
 * in `TABLE_STRATEGY_CHAR`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/TableStrategy.java:38-56
 */
export const TableStrategy = {
  DRAW_NONE: 'DRAW_NONE',
  DRAW_OUTSIDE: 'DRAW_OUTSIDE',
  DRAW_OUTSIDE_WITH_TITLE: 'DRAW_OUTSIDE_WITH_TITLE',
  DRAW_HORIZONTAL: 'DRAW_HORIZONTAL',
  DRAW_VERTICAL: 'DRAW_VERTICAL',
  DRAW_ALL: 'DRAW_ALL',
} as const;
export type TableStrategy = (typeof TableStrategy)[keyof typeof TableStrategy];

/**
 * Each constant's private `c` field, from its enum constructor argument.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/TableStrategy.java:39-46
 */
const TABLE_STRATEGY_CHAR: Readonly<Record<TableStrategy, string>> = {
  DRAW_NONE: ' ',
  DRAW_OUTSIDE: '+',
  DRAW_OUTSIDE_WITH_TITLE: '^',
  DRAW_HORIZONTAL: '-',
  DRAW_VERTICAL: '!',
  DRAW_ALL: '#',
};

/**
 * `TableStrategy.fromChar(char)` — the first constant, in declaration
 * order, whose char equals `c`; `undefined` (upstream `null`) for any other
 * char.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/TableStrategy.java:48-55
 */
export function fromChar(c: string): TableStrategy | undefined {
  for (const t of Object.values(TableStrategy)) {
    if (c === TABLE_STRATEGY_CHAR[t]) {
      return t;
    }
  }
  return undefined;
}
