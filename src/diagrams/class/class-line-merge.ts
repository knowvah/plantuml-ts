/**
 * Standalone-`{` line merging for the class parser's pre-dispatch pass.
 *
 * Split out of `parser.ts` to keep that file within the module line budget
 * (same precedent as `class-directives.ts`'s own header note) when A2s F-A /
 * A3 grew `mergeStandaloneBraces` — no behavior lives here that `parser.ts`
 * did not previously own.
 *
 * Merge a standalone `{` line into the immediately preceding non-blank line.
 *
 * Upstream's `class`/`package`/`namespace`/`interface`/… body-openers
 * (`CommandCreateClassMultilines`, `CommandPackage`, …) all declare
 * `syntaxWithFinalBracket() == true` (SingleLineCommand2.java:65-67):
 * when such a command's own line doesn't end in `{`, the framework peeks at
 * the NEXT line, and if it is EXACTLY `{`, merges the two into one logical
 * line before regex matching (`SingleLineCommand2.java:83-100`). So
 * `package foo <<Node>>` / `{` on its own next line is equivalent to
 * `package foo <<Node>> {` on one line — not a variant syntax our regexes
 * need to special-case individually, but a line-merge that applies before
 * ANY command dispatch (verified against dativu-93-pona469: without the
 * merge, `package foo <<Node>>` fails every command pattern and is
 * silently dropped, so `class A`/`class B` parse with no active namespace
 * and land outside any cluster).
 */
export interface MergedLines {
  readonly lines: string[];
  /** G2 N9: parallel to `lines` -- the ORIGINAL (pre-merge) position of
   *  each surviving entry, so `state.currentLine` stays accurate after
   *  brace-merging shrinks the array. A merged `{` line keeps the position
   *  of the line it merged INTO (the opener), matching upstream's own
   *  "peek at the next line" merge (the logical line's source position is
   *  the opener's, per `SingleLineCommand2.java:83-100`). */
  readonly positions: (number | undefined)[];
  /** G2 N42: parallel to `lines` -- the SAME line with ONLY trailing
   *  whitespace stripped (`trimEnd`, not `trim`) -- `lines` itself is
   *  FULLY trimmed (`raw.trim()` below), which destroys the leading
   *  indentation `class-body-enhanced.ts`'s `|_` tree-list level
   *  computation needs (`Classifier.rawBodyLines`'s own doc comment).
   *  Every OTHER consumer of `lines` keeps using the fully-trimmed value
   *  unchanged -- this is an ADDITIVE side channel, read only by
   *  `handlePendingBodyLine`'s `rawBodyLines` capture in `parser.ts`. */
  readonly rawLines: string[];
}

export function mergeStandaloneBraces(
  lines: readonly string[],
  positions: readonly (number | undefined)[] = [],
): MergedLines {
  const merged: string[] = [];
  const mergedPositions: (number | undefined)[] = [];
  const mergedRaw: string[] = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx]!;
    const trimmed = raw.trim();
    // A2s F-A / A3: blank lines are KEPT (they used to be dropped here) --
    // upstream keeps interior empty lines: a note's `subExtract(1, 1)` cuts
    // only opener/closer (CommandFactoryNoteOnEntity.java:236-238); a brace
    // body feeds EVERY interior line, empty included, to `addFieldOrMethod`
    // (CommandCreateClassMultilines.java:291,303-307). Jar-verified
    // `vivifa-42-mire839` / `pejone-71-tige404`. The main parse loop skips
    // blanks no open note/body claims, so command dispatch never sees one.
    if (trimmed === '{') {
      // Blanks between an opener and its standalone `{` were dropped
      // wholesale pre-A3 -- pop them so the merge still lands on the opener.
      while (merged.length > 0 && merged[merged.length - 1] === '') {
        merged.pop();
        mergedPositions.pop();
        mergedRaw.pop();
      }
      if (merged.length > 0 && !merged[merged.length - 1]!.endsWith('{')) {
        merged[merged.length - 1] += ' {';
        mergedRaw[mergedRaw.length - 1] += ' {';
        continue;
      }
    }
    merged.push(trimmed);
    mergedPositions.push(positions[idx]);
    mergedRaw.push(raw.trimEnd());
  }
  return { lines: merged, positions: mergedPositions, rawLines: mergedRaw };
}
