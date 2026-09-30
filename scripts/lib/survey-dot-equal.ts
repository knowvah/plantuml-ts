/**
 * scripts/lib/survey-dot-equal.ts — cdd6-T0b (D9): the SVG parity survey's
 * `dotEqual` comparison, split out of `scripts/svg-parity-survey.ts` (at this
 * project's 500-line file cap) after cdd5 found three instrument defects (see
 * `.agent-notes/cdd5-close-census-and-survey.md`):
 *
 * 1. Nested `{{ }}` embeds (yaml/json) counted their own layout graphs
 *    against the oracle's svek-*.dot, which the jar never dumps for a nested
 *    embed (its json/yaml go through Smetana — CLAUDE.md's "One layout
 *    engine" ruling). Fixed by `graph-layout.ts#LayoutInputEvent.nestedDepth`
 *    (`EmbeddedDiagram.ts` brackets its one nested-render call): only
 *    `nestedDepth === 0` graphs are compared (`outerGraphs`).
 * 2. The smetana-pragma detector matched `!pragma layout smetana` inside a
 *    `'`-comment line. Fixed by `nonCommentLines`, a faithful port of
 *    `ReadFilterQuoteComment#readLine`'s comment-stripping algorithm —
 *    upstream drops a commented line before ANY command (pragma included)
 *    ever sees it; this is not a survey-specific rule.
 * 3. A `newpage` source is captured as page 1 ONLY by this repo's oracle
 *    cache: `net.sourceforge.plantuml.Run -tsvg -o <dir> <file>` writes a
 *    single `in.svg`/`svek-N.dot` set for a multi-page source, and
 *    `DotStringFactory.DUMP_DOT_COUNTER` (java:74, a process-global
 *    `AtomicInteger` incremented in call order at java:297) never advances
 *    past page 1 — confirmed empirically: `scripts/oracle-render.sh` on
 *    unknown/racujo-01-veme537 produces exactly one `svek-1.dot`, matching
 *    only page 1's single `foo` node (`in.svg` is page 1's SVG too); no
 *    `svek-2.dot` for page 2's `bar` + edge ever appears, though the PORT
 *    does lay out both pages. A `newpage` fixture must therefore compare
 *    only the FIRST `dots.length` port graphs, in call order, against the
 *    oracle's dumps (`computeDotEqual`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc2/ReadFilterQuoteComment.java:58-76
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:74,290-300
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandNewpage.java:58-60
 */
import type { LayoutInputEvent } from '../../src/core/graph-layout.js';
import { parseSvekDot, dotInputToStructural, compareStructural } from '../../tests/oracle/svek-dot.js';

/** Oracle-blind fixtures (`!pragma layout smetana|elk`): the jar only dumps
 *  svek DOT on the graphviz path, so DOT-parity has no oracle to compare
 *  against. Mirrors scripts/dot-sync-report.ts's oracleBlind bucket — moved
 *  here (cdd6-T0b) so it can be exercised through `nonCommentLines` alongside
 *  {@link hasActiveSmetanaPragma}. */
const PRAGMA_LAYOUT_RE = /!pragma\s+layout\s+/i;

/** `newpage` (`descdiagram/command/CommandNewpage.java:58-60`): a
 *  single-line command matched against the WHOLE trimmed line,
 *  case-insensitively like every other single-line command in this
 *  codebase's own command dispatch. */
const NEWPAGE_RE = /^newpage$/i;

/**
 * `ReadFilterQuoteComment#readLine` (java:51-78), ported: drops every line a
 * `'` single-line comment, a one-line `/' ... '/` block comment, or a
 * multi-line `/' ... ` … `'/` block comment would swallow — BEFORE any
 * command (pragma, newpage, anything else) ever sees the line. Tabs fold to
 * spaces before trimming (java:58), matching the jar's own normalisation.
 */
export function nonCommentLines(markup: string): string[] {
  const out: string[] = [];
  let longComment = false;
  for (const raw of markup.split('\n')) {
    const trim = raw.replace(/\t/g, ' ').trim();
    if (longComment) {
      if (trim.endsWith("'/")) longComment = false;
      continue;
    }
    if (trim.startsWith("'")) continue;
    if (trim.startsWith("/'") && trim.endsWith("'/")) continue;
    // java:70 — the opener fires only when no `'/` follows on the same line;
    // a `/' x '/ foo` line falls through to removeInnerComment and is kept.
    if (trim.startsWith("/'") && !trim.includes("'/")) {
      longComment = true;
      continue;
    }
    out.push(trim);
  }
  return out;
}

/** True iff an ACTIVE (non-commented) `!pragma layout smetana|elk` line
 *  exists — see the module doc comment's defect 2. */
export function hasActiveSmetanaPragma(markup: string): boolean {
  return nonCommentLines(markup).some((line) => PRAGMA_LAYOUT_RE.test(line));
}

/** True iff an ACTIVE (non-commented) `newpage` command exists — see the
 *  module doc comment's defect 3. */
export function hasNewpage(markup: string): boolean {
  return nonCommentLines(markup).some((line) => NEWPAGE_RE.test(line));
}

/** Only the outer-diagram layout graphs — see the module doc comment's
 *  defect 1 and `graph-layout.ts#LayoutInputEvent.nestedDepth`'s own doc
 *  comment. */
function outerGraphs(events: readonly LayoutInputEvent[]) {
  return events.filter((e) => e.nestedDepth === 0).map((e) => e.graph);
}

/**
 * DOT-level parity: mirrors scripts/dot-sync-report.ts's analyzeFixture. Both
 * sides skipping graphviz (degenerate single-leaf/empty diagrams) IS
 * agreement; a count mismatch or a structural check failure is not.
 *
 * `markup` drives two corrections over the raw captured `events`: nested
 * `{{ }}` embeds are excluded ({@link outerGraphs}) and, for a `newpage`
 * source, only the first `dots.length` outer graphs are compared (the module
 * doc comment's defect 3 — the oracle cache never holds more than page 1's
 * dumps).
 */
export function computeDotEqual(
  dots: readonly string[],
  events: readonly LayoutInputEvent[],
  oracleBlind: boolean,
  markup: string,
): boolean {
  if (oracleBlind) return false;
  const outer = outerGraphs(events);
  const inputs = hasNewpage(markup) ? outer.slice(0, dots.length) : outer;
  if (dots.length === 0 && inputs.length === 0) return true;
  if (inputs.length === 0) return false;
  if (dots.length !== inputs.length) return false;
  return dots.every(
    (dot, i) => compareStructural(parseSvekDot(dot), dotInputToStructural(inputs[i]!)).structurallyEqual,
  );
}
