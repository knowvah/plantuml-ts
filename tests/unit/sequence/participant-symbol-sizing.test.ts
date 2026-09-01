/**
 * The seven non-rectangular participant heads, pinned against the jar — T4 of
 * `plans/sequence-coordinate-convergence`.
 *
 * The audit that produced these numbers is
 * `plans/sequence-coordinate-convergence/findings/participant-symbols.md`.
 * Its conclusion was that none of the seven kinds is wrong, which is exactly
 * the conclusion most easily reached by not looking — so it is pinned here,
 * from the goldens, rather than left as a claim in a document.
 *
 * These kinds route through `symbolPreferredWidth`/`symbolPreferredHeight`,
 * which Batches 2 and 3 did not touch. Without this file they would be free
 * to drift out from under the plain-participant work.
 *
 * WHAT IS COMPARED, and why it is not the absolute coordinate. This port's
 * document origin is still 20px right and 10px below the jar's (Batch 5's
 * T5.1), and its inter-participant gap is still 10px too wide (Batch 6's
 * T6.1). Both are separately owned, so this file compares the quantities
 * those two cannot move: the head ROW's height, and the SHAPE of each glyph.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', 'test-results', 'dot-cache', 'sequence',
);

/**
 * The jar's document margin: `getTextBlock`'s `ug.apply(new UTranslate(5, 5))`
 * plus the frame's own inset (`SequenceDiagramFileMakerTeoz.java:132`), 10 on
 * each axis in every sequence golden. T5.1 owns reproducing it; until then it
 * is subtracted here so the two sides are comparable.
 */
const JAR_DOCUMENT_MARGIN = 10;

function goldenOf(slug: string): string {
  return readFileSync(join(CACHE, slug, 'in.svg'), 'utf8');
}

function oursFor(slug: string): string {
  return renderFixtureSequence(
    readFileSync(join(CACHE, slug, 'in.puml'), 'utf8'),
    new DeterministicMeasurer(),
  );
}

/**
 * The head row's bottom: the y of the lifeline hover rect, which both sides
 * emit as the first child of each `<g><title>` participant group. Taking the
 * max over participants makes this the row rather than one head.
 */
function headRow(svg: string): number {
  const ys = [...svg.matchAll(/<g><title>[^<]*<\/title><rect x="[\d.]+" y="([\d.]+)"/g)].map((m) =>
    Number(m[1]),
  );
  return Math.max(...ys);
}

/** Lifeline centres, in document order — the head widths, seen edge-on. */
function lifelineCentres(svg: string): number[] {
  return [...svg.matchAll(/<line x1="([\d.]+)"[^>]*stroke-dasharray|stroke-dasharray[^>]*x1="([\d.]+)"/g)]
    .map((m) => Number(m[1] ?? m[2]))
    .filter((n) => Number.isFinite(n));
}

/** Consecutive spacings — `w_i/2 + gap + w_{i+1}/2`. */
function spacings(centres: readonly number[]): number[] {
  return centres.slice(1).map((c, i) => c - (centres[i] ?? 0));
}

describe('the glyph participant kinds — head row height', () => {
  // Each row names the kinds its fixture exercises, so a failure says which
  // component to open.
  const ROWS = [
    { slug: 'kibave-01-tafo463', kinds: 'boundary, control, database, entity, actor, collections' },
    { slug: 'cebeje-70-bada975', kinds: 'participant, actor, boundary, control, entity, database' },
    { slug: 'pumula-71-gigi389', kinds: 'queue' },
    { slug: 'fatake-97-ciki135', kinds: 'collections' },
  ] as const;

  it.each(ROWS)('$slug ($kinds): the head row matches the jar exactly', ({ slug }) => {
    // If any kind's `getPreferredHeight` were wrong, the tallest head in the
    // fixture would move this row.
    expect(headRow(oursFor(slug))).toBeCloseTo(headRow(goldenOf(slug)) - JAR_DOCUMENT_MARGIN, 3);
  });
});

describe('the glyph participant kinds — widths, seen through the spacings', () => {
  it('kibave-01-tafo463: every consecutive spacing differs from the jar by the SAME amount', () => {
    // Centre-to-centre is `w_i/2 + gap + w_{i+1}/2`. A constant offset across
    // five consecutive pairs spanning six different kinds forces every width
    // error to zero: an error `e` in any one `w_i` would make the two gaps
    // adjoining it differ from each other by `e`. So this asserts the widths
    // are right WITHOUT depending on the origin or on the gap, both of which
    // are still wrong and separately owned.
    const jar = spacings(lifelineCentres(goldenOf('kibave-01-tafo463')));
    const ours = spacings(lifelineCentres(oursFor('kibave-01-tafo463')));
    expect(ours).toHaveLength(jar.length);
    expect(jar.length).toBeGreaterThanOrEqual(5);
    const deltas = ours.map((s, i) => s - (jar[i] ?? 0));
    for (const d of deltas) expect(d).toBeCloseTo(deltas[0] ?? 0, 3);
    // And that shared amount is the gap error Batch 6 owns, not a width error.
    expect(deltas[0]).toBeCloseTo(10, 3);
  });
});

describe('collections — the stacked pair', () => {
  it('kibave-01-tafo463: same box, same 4px offset as the jar', () => {
    // `ComponentRoseParticipant#getDeltaCollection:114-118` returns 4, and
    // `drawInternalU:106-110` draws the back rectangle `dx(4)` and the front
    // one `dy(4)` from it. `COLLECTIONS_DELTA` is that 4.
    const boxOf = (svg: string): Array<[number, number, number]> =>
      [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="(79\.45)" height="28"/g)].map((m) => [
        Number(m[1]), Number(m[2]), Number(m[3]),
      ]);
    const jar = boxOf(goldenOf('kibave-01-tafo463'));
    const ours = boxOf(oursFor('kibave-01-tafo463'));
    expect(jar.length).toBeGreaterThanOrEqual(2);
    expect(ours).toHaveLength(jar.length);
    // Same width, and the same 4px stagger between the two rectangles.
    expect((jar[0]?.[0] ?? 0) - (jar[1]?.[0] ?? 0)).toBeCloseTo(4, 3);
    expect((ours[0]?.[0] ?? 0) - (ours[1]?.[0] ?? 0)).toBeCloseTo(4, 3);
    expect((jar[1]?.[1] ?? 0) - (jar[0]?.[1] ?? 0)).toBeCloseTo(4, 3);
    expect((ours[1]?.[1] ?? 0) - (ours[0]?.[1] ?? 0)).toBeCloseTo(4, 3);
  });
});
