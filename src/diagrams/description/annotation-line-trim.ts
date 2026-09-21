/**
 * `matchAnnotationCommand`'s single-line matchers (`matchTitle` et al.,
 * `core/annotations/commands.ts`'s `ORDERED_MATCHERS`) read `lines[i]`
 * verbatim, no internal trim — they require an already-trimmed line, like
 * `state/parser.ts:147-149`'s `nonBlankLines` doc states for the identical
 * call. Upstream's `CommandTitle` et al. extend `SingleLineCommand2`, whose
 * one-arg constructor defaults `doTrim = true` (`SingleLineCommand2
 * .java:56-58`) and matches `s.getTrimmed().getString()` (`:71,78`) — a
 * leading tab never defeats `RegexLeaf.start()` upstream (`CommandTitle
 * .java:56-66`). `description`'s `dispatchCommand` otherwise needs `lines`
 * RAW so a matched MULTILINE block's body keeps its indentation for
 * `removeEmptyColumns` — trimming the whole array would defeat that.
 * Trimming only index `i` (the line the single-line matchers test; multi-
 * line START/END probes already `.trim()` internally) fixes the single-line
 * case without touching any multiline body row. Returns `lines` itself,
 * unallocated, when line `i` has no whitespace to strip (the common case).
 *
 * Split out of `parse-helpers.ts` (500-line file cap) as its own module —
 * same reasoning `command-table-helpers.ts`'s own file doc already states
 * for this engine's other single-purpose helper modules (T8,
 * unknown-bucket-routing-repair, T5.md mechanism 1).
 */
export function trimLineForAnnotationMatch(lines: readonly string[], i: number): readonly string[] {
  const raw = lines[i];
  if (raw === undefined) return lines;
  const trimmed = raw.trim();
  if (trimmed === raw) return lines;
  const copy = lines.slice();
  copy[i] = trimmed;
  return copy;
}
