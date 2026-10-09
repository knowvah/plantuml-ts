/**
 * description/note-columns.ts -- `BlocLines#removeEmptyColumns`, the only
 * normalisation upstream applies to a multi-line note body: drop the leading
 * column while EVERY non-empty line starts with a space or tab. Trailing
 * whitespace and interior indentation are KEPT (the `// StringUtils.trim(
 * lines, false)` in each caller is commented out), which is what makes a
 * note's width depend on a trailing space (isw: a space is no longer 0 wide).
 *
 * @see ~/git/plantuml/.../utils/BlocLines.java:234-263
 * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnEntity.java:236-237
 * @see ~/git/plantuml/.../command/note/CommandFactoryNote.java:157-158
 * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnLink.java:139
 * @see ~/git/plantuml/.../command/note/CommandFactoryTipOnEntity.java:183
 */

/** `BlocLines#firstColumnRemovable` (java:250-262). */
function firstColumnRemovable(lines: readonly string[]): boolean {
  let allEmpty = true;
  for (const l of lines) {
    if (l.length === 0) continue;
    allEmpty = false;
    if (l[0] !== ' ' && l[0] !== '\t') return false;
  }
  return !allEmpty;
}

/** `BlocLines#removeEmptyColumns` (java:234-248). */
export function removeEmptyColumns(lines: readonly string[]): string[] {
  let out = [...lines];
  while (firstColumnRemovable(out)) out = out.map((l) => (l.length > 0 ? l.slice(1) : l));
  return out;
}
