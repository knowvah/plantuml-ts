/**
 * scripts/lib/survey-layout-equal.ts — description-svek-wrappers T2 (D3): the
 * SVG parity survey's `layoutEqual` column. Where `dotEqual`
 * (`./survey-dot-equal.ts`) asks whether our layout input has the jar's
 * STRUCTURE, this asks whether both lay out to the same GEOMETRY, via
 * `tests/oracle/layout-parity.ts#layoutParityPages` (D1/D2).
 *
 * Mirrors `computeDotEqual`'s pairing rules:
 * - only `nestedDepth === 0` graphs are comparable (the jar dumps no DOT for a
 *   Smetana-routed nested embed);
 * - a `newpage` source compares only the first `dots.length` outer graphs
 *   (the oracle cache holds page 1's dumps only — survey-dot-equal.ts defect 3);
 * - an oracle-blind fixture (`!pragma layout smetana|elk`) has no jar DOT.
 *
 * `'n/a'` means "no comparison was possible", never "different": oracle-blind,
 * no svek DOT, or differing page counts (a count difference is `dotEqual`'s
 * business and `layoutParityPages` would report it as a clusterTree diff that
 * says nothing about layout).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/DotStringFactory.java:288-298
 */
import type { LayoutInputEvent } from '../../src/core/graph-layout.js';
import { layoutParityPages, type LayoutParityResult } from '../../tests/oracle/layout-parity.js';
import { hasNewpage } from './survey-dot-equal.js';

/** The two survey fields, spread into the row beside `dotEqual`. */
export interface LayoutEqualFields {
  layoutEqual: boolean | 'n/a';
  layoutFirstDiff?: NonNullable<LayoutParityResult['firstDiff']>;
}

/** Not comparable: see the module doc comment. */
const NOT_COMPARABLE: LayoutEqualFields = { layoutEqual: 'n/a' };

export function computeLayoutEqual(
  dots: readonly string[],
  events: readonly LayoutInputEvent[],
  oracleBlind: boolean,
  markup: string,
): LayoutEqualFields {
  if (oracleBlind || dots.length === 0) return NOT_COMPARABLE;
  const outer = events.filter((e) => e.nestedDepth === 0).map((e) => e.graph);
  const ours = hasNewpage(markup) ? outer.slice(0, dots.length) : outer;
  if (ours.length !== dots.length) return NOT_COMPARABLE;
  const r = layoutParityPages(dots, ours);
  return r.equal ? { layoutEqual: true } : { layoutEqual: false, layoutFirstDiff: r.firstDiff! };
}
