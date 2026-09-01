/**
 * The concentration guard for `scripts/sequence-geometry-distance.ts`.
 *
 * Separate module because it is a separate question: the distance instrument
 * answers "how far are we", this answers "is that number about the corpus or
 * about one fixture".
 */
import type { DistanceSnapshot } from './sequence-geometry-distance.js';

/** Three decimals, matching the distance report's own rounding. */
function round(value: number): string {
  return value.toFixed(3);
}

/**
 * A single fixture's share of the corpus total — the guard against reading an
 * aggregate that one pathological fixture wrote.
 *
 * WHY THIS EXISTS. `zudize-61-vomi445` is a 45 512-line stress fixture. In the
 * close-out analysis of `plans/sequence-coordinate-convergence` it alone
 * supplied 24 464 of a reported 25 933-element text deficit — 94% — and the
 * headline "37% of our text is missing" survived into a published document
 * before anyone divided by fixture. The real deficit was 1 469.
 *
 * So every report prints its concentration. A total whose largest contributor
 * exceeds {@link CONCENTRATION_ALARM} is not wrong, but it is a statement
 * about that fixture rather than about the corpus, and it must not be quoted
 * as the latter.
 */
export const CONCENTRATION_ALARM = 0.2;

export interface Concentration {
  /** Heaviest fixture and its share of the total, or `null` for an empty set. */
  readonly top: { readonly slug: string; readonly distance: number; readonly share: number } | null;
  /** Share held by the heaviest ten, which is what a skewed corpus shows. */
  readonly top10Share: number;
  /** `true` when the heaviest single fixture exceeds `CONCENTRATION_ALARM`. */
  readonly dominated: boolean;
}

export function concentrationOf(snapshot: DistanceSnapshot): Concentration {
  const measured = snapshot.fixtures
    .filter((f) => f.distance !== null)
    .map((f) => ({ slug: f.slug, distance: f.distance ?? 0 }))
    .sort((a, b) => b.distance - a.distance);
  const total = snapshot.total.distance;
  if (measured.length === 0 || total <= 0) {
    return { top: null, top10Share: 0, dominated: false };
  }
  const first = measured[0]!;
  const share = first.distance / total;
  const top10 = measured.slice(0, 10).reduce((sum, f) => sum + f.distance, 0) / total;
  return {
    top: { slug: first.slug, distance: first.distance, share },
    top10Share: top10,
    dominated: share > CONCENTRATION_ALARM,
  };
}

/** The concentration line, and an alarm when one fixture wrote the total. */
export function formatConcentration(snapshot: DistanceSnapshot): string {
  const c = concentrationOf(snapshot);
  if (c.top === null) return 'concentration: nothing measured.';
  const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
  const line =
    `concentration: heaviest ${c.top.slug} = ${round(c.top.distance)} (${pct(c.top.share)}); ` +
    `heaviest ten = ${pct(c.top10Share)}`;
  if (!c.dominated) return line;
  return (
    `${line}
` +
    `  !! ONE FIXTURE HOLDS OVER ${pct(CONCENTRATION_ALARM)} OF THIS TOTAL. It is a ` +
    `statement about ${c.top.slug}, not about the corpus -- quote it per-fixture ` +
    `or exclude it, and say which.`
  );
}
