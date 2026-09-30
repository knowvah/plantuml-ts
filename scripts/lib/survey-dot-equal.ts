/**
 * scripts/lib/survey-dot-equal.ts — cdd6-T0b (D9): the SVG parity survey's
 * `dotEqual` comparison, split out of `scripts/svg-parity-survey.ts` (at this
 * project's 500-line file cap) after cdd5 found three instrument defects (see
 * `.agent-notes/cdd5-close-census-and-survey.md`):
 *
 * 1. Nested `{{ }}` embeds (yaml/json) counted their own layout graphs
 *    against the oracle's svek-*.dot, which the jar never dumps for a
 *    SMETANA-ROUTED nested embed (json/yaml/hcl — CLAUDE.md's "One layout
 *    engine" ruling). **Corrected cdd7-T1g' (D6 amendment, journal rows
 *    10/24):** the original fix over-generalised — it excluded EVERY
 *    `nestedDepth > 0` graph, on the premise that no nested embed is ever
 *    dumped. That premise is false for a nested embed whose OWN content
 *    also routes through graphviz (e.g. a `{{ class Foo }}` embed inside a
 *    class diagram, unknown/rojida-14-fuli428): `DotStringFactory
 *    .java:288-298`'s dump instrumentation fires on every `getSvg` call
 *    regardless of nesting, so the jar dumps such an embed's DOT too —
 *    twice per occurrence, once measuring the label and once drawing it.
 *    This port's own recursive nested render (`EmbeddedDiagram.ts`'s
 *    `getInternalTextBlock`) always uses `layoutGraph()` — including for
 *    json/yaml/hcl, which THIS port routes through @knowvah/dot-engine even
 *    though the jar Smetana-routes them (again, the "One layout engine"
 *    ruling) — so `nestedDepth` alone cannot distinguish "the jar dumped
 *    this too" from "the jar never touches this." The fix now classifies
 *    each markup's `{{ }}` opens by `EmbeddedDiagram.ts#getEmbeddedType`
 *    ({@link hasSmetanaRoutedEmbed}): a smetana-typed embed (json/yaml/hcl)
 *    anywhere still excludes ALL nested graphs wholesale (matches the jar's
 *    zero dumps for gubeca/jixibu-shaped fixtures — no per-embed dump
 *    attribution is possible from `LayoutInputEvent` alone, so a MIXED
 *    fixture combining a smetana-typed and a graphviz-routed embed would be
 *    excluded too conservatively; no corpus fixture evidences that case).
 *    Otherwise, nested graphs ARE compared, but as a structural-identity
 *    SET against the oracle's own unconsumed dumps
 *    ({@link structuralSetsCorrespond}), never positionally: both sides
 *    call each nested embed's layout MORE THAN ONCE per occurrence (jar:
 *    measure + draw; this port: measure + ink + draw, one extra pass —
 *    `leaf-sizing-folder.ts`), and that pass COUNT is an internal
 *    measurement artifact on both sides, not a spec'd contract (CLAUDE.md:
 *    "never fit a value") — only the graph SHAPE each pass produces is a
 *    fidelity target, so repeats are deduplicated ({@link dedupStructural})
 *    before the two sides' sets are required to correspond.
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
 *    oracle's dumps (`computeDotEqual`) — unchanged by the cdd7-T1g'
 *    correction: no corpus fixture combines `newpage` with a nested embed,
 *    and page truncation is positional in a way the nested-embed SET
 *    correspondence deliberately is not, so the two tiers stay separate.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc2/ReadFilterQuoteComment.java:58-76
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:74,290-300
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandNewpage.java:58-60
 */
import type { LayoutInputEvent } from '../../src/core/graph-layout.js';
import { getEmbeddedType } from '../../src/core/EmbeddedDiagram.js';
import {
  parseSvekDot,
  dotInputToStructural,
  compareStructural,
  type StructuralGraph,
} from '../../tests/oracle/svek-dot.js';

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

/** Smetana-routed `{{ }}` embed types (CLAUDE.md's "One layout engine"
 *  ruling): the jar never emits `svek-*.dot` for these, no matter how many
 *  `layoutGraph()` calls this port's own recursive render makes for them
 *  (D9 — this port always dot-engines, even where the jar Smetana-routes).
 *  `hcl` is listed for completeness (CLAUDE.md's Smetana-paths list) though
 *  `EmbeddedDiagram.ts#getEmbeddedType`'s own keyword table has no `h`
 *  entry, so a `{{hcl ...}}` block can never match it today — harmless (it
 *  just never trips this exclusion) and not a live corpus concern. */
const SMETANA_EMBED_TYPES: ReadonlySet<string> = new Set(['json', 'yaml', 'hcl']);

/** True iff an ACTIVE (non-commented) `{{ }}` embed opens with a
 *  Smetana-routed type keyword anywhere in the markup — including nested
 *  inside another embed's body, since `getEmbeddedType` is applied per line
 *  regardless of nesting depth. See the module doc comment's defect 1
 *  correction (cdd7-T1g', D6). */
export function hasSmetanaRoutedEmbed(markup: string): boolean {
  return nonCommentLines(markup).some((line) => {
    const type = getEmbeddedType(line);
    return type !== null && SMETANA_EMBED_TYPES.has(type);
  });
}

/** Collapses structurally-identical repeats to one representative — see the
 *  module doc comment's defect 1 correction for why nested-embed pass
 *  counts are not a comparison target. */
function dedupStructural(graphs: readonly StructuralGraph[]): StructuralGraph[] {
  const uniq: StructuralGraph[] = [];
  for (const g of graphs) {
    if (!uniq.some((u) => compareStructural(u, g).structurallyEqual)) uniq.push(g);
  }
  return uniq;
}

/** Every element of `a` finds exactly one structurally-equal, not-yet-
 *  consumed partner in `b` (equal SIZE is necessary but not sufficient —
 *  same-size sets can still fail to correspond element by element). Used
 *  for the nested-embed tier, where call ORDER differs between the jar and
 *  this port (see the module doc comment's defect 1 correction), so only
 *  SET correspondence, not positional pairing, is a fair comparison. */
function structuralSetsCorrespond(a: readonly StructuralGraph[], b: readonly StructuralGraph[]): boolean {
  if (a.length !== b.length) return false;
  const remaining = [...b];
  for (const g of a) {
    const idx = remaining.findIndex((r) => compareStructural(r, g).structurallyEqual);
    if (idx === -1) return false;
    remaining.splice(idx, 1);
  }
  return true;
}

/**
 * DOT-level parity: mirrors scripts/dot-sync-report.ts's analyzeFixture. Both
 * sides skipping graphviz (degenerate single-leaf/empty diagrams) IS
 * agreement; a count mismatch or a structural check failure is not.
 *
 * `markup` drives corrections over the raw captured `events`:
 *
 * - For a `newpage` source, only the first `dots.length` OUTER graphs are
 *   compared, positionally (the module doc comment's defect 3 — the oracle
 *   cache never holds more than page 1's dumps). Nested embeds are not
 *   folded into this branch — no corpus fixture combines `newpage` with a
 *   nested embed, and page truncation is positional in a way the tier below
 *   deliberately is not.
 * - Otherwise: every OUTER graph must find a distinct structurally-equal
 *   partner somewhere in `dots` (order-independent — the outer dump is not
 *   always `dots[0]`, e.g. rojida's outer dump is `dots[2]`, sandwiched
 *   between nested-embed dumps in jar call order). Whatever oracle dumps
 *   remain after that must correspond, as a deduplicated structural-identity
 *   SET, to this port's own nested (`nestedDepth > 0`) graphs — themselves
 *   excluded entirely when the markup contains a Smetana-routed embed
 *   ({@link hasSmetanaRoutedEmbed}), matching the jar's zero dumps for a
 *   json/yaml/hcl embed.
 */
export function computeDotEqual(
  dots: readonly string[],
  events: readonly LayoutInputEvent[],
  oracleBlind: boolean,
  markup: string,
): boolean {
  if (oracleBlind) return false;
  const outer = outerGraphs(events);

  if (hasNewpage(markup)) {
    const inputs = outer.slice(0, dots.length);
    if (dots.length === 0 && inputs.length === 0) return true;
    if (inputs.length === 0) return false;
    if (dots.length !== inputs.length) return false;
    return dots.every(
      (dot, i) => compareStructural(parseSvekDot(dot), dotInputToStructural(inputs[i]!)).structurallyEqual,
    );
  }

  const oraclePool = dots.map((dot) => parseSvekDot(dot));
  for (const graph of outer) {
    const idx = oraclePool.findIndex((o) => compareStructural(o, dotInputToStructural(graph)).structurallyEqual);
    if (idx === -1) return false;
    oraclePool.splice(idx, 1);
  }

  const nestedInputs = hasSmetanaRoutedEmbed(markup)
    ? []
    : events.filter((e) => e.nestedDepth > 0).map((e) => dotInputToStructural(e.graph));
  return structuralSetsCorrespond(dedupStructural(oraclePool), dedupStructural(nestedInputs));
}
