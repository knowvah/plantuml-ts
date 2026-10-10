/**
 * `BlocLines.removeEmptyColumns`: strips the leading whitespace column common
 * to every non-empty line, one column at a time, while one remains.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/BlocLines.java:234-263
 *
 * Mirrors `core/annotations/commands.ts` (private there); hoist to `src/core`
 * when an owner of that directory can share it.
 */
export function removeEmptyColumns(bodyLines: readonly string[]): string[] {
  let lines: string[] = [...bodyLines];
  while (isFirstColumnRemovable(lines)) {
    lines = lines.map((l) => (l.length > 0 ? l.slice(1) : l));
  }
  return lines;
}

function isFirstColumnRemovable(lines: readonly string[]): boolean {
  let allEmpty = true;
  for (const l of lines) {
    if (l.length === 0) continue;
    allEmpty = false;
    if (l[0] !== ' ' && l[0] !== '\t') return false;
  }
  return !allEmpty;
}
