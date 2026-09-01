/**
 * A3 — participant label runs against the jar's own numbers.
 *
 * The phantom-distance measurement this whole mission is built on was taken
 * here: on `jobadi-87-jegi648` our label CENTRE was 29.469 and the jar's is
 * `17 + 24.938/2 = 29.469`, identical to the thousandth, and the comparator
 * charged 12.469 for it because it was comparing a centre against a left edge.
 * These tests pin the left edge, so that can never silently come back.
 *
 * Two oracles, chosen for what they discriminate:
 *
 *   `jobadi-87-jegi648`   one row, no badge — the simple case, and the one the
 *                         mission's arithmetic was derived from.
 *   `birocu-87-xubi808`   a stereotype row ABOVE the name, in one box with a
 *                         64px sprite badge. Its two rows have different
 *                         widths (93.363 and 63.087) and share one centre
 *                         (296.6195), which is exactly what a per-geo scalar
 *                         width could not have expressed (D8).
 *
 * `covuco-47-sotu151` supplies the single-character case: the jar emits no
 * `textLength` for a one-character label, upstream's `text.length() > 1` guard.
 *
 * Only `x`, `textLength` and the ABSENCE of anchors are asserted. The `y`
 * values still differ from the jar by the 10px vertical document margin this
 * port has not yet applied — that is Phase C's, and asserting it here would
 * pin a number this mission intends to change.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/sequence');

function render(slug: string): string {
  return renderFixtureSequence(readFileSync(join(CACHE, slug, 'in.puml'), 'utf8'), new DeterministicMeasurer());
}

/** Every participant-font (14pt) `<text>`, in document order. */
function labels(svg: string): Array<{ x: string; textLength: string | undefined; text: string }> {
  const out: Array<{ x: string; textLength: string | undefined; text: string }> = [];
  for (const m of svg.matchAll(/<text([^>]*font-size="14"[^>]*)>([^<]*)<\/text>/g)) {
    const attrs = m[1]!;
    const len = /\btextLength="([^"]*)"/.exec(attrs);
    out.push({ x: /\bx="([^"]*)"/.exec(attrs)![1]!, textLength: len?.[1], text: m[2]! });
  }
  return out;
}

describe('participant labels against the jar', () => {
  it('emits the jar’s left edge and textLength for a plain one-row head', () => {
    const [head, foot] = labels(render('jobadi-87-jegi648'));
    // JAR: <text x="17" y="27.889" font-size="14" textLength="24.938">Bob</text>
    expect(head).toEqual({ x: '17', textLength: '24.938', text: 'Bob' });
    // The footer row is the same block translated; same x, same width.
    expect(foot!.x).toBe('17');
    expect(foot!.textLength).toBe('24.938');
  });

  it('gives a stereotype row and a name row their OWN widths on one centre', () => {
    const rows = labels(render('birocu-87-xubi808')).filter((r) => r.text.includes('«') || r.text === 'OnlyLabel');
    const stereotype = rows.find((r) => r.text === '«APIGateway»')!;
    const name = rows.find((r) => r.text === 'OnlyLabel')!;
    // JAR: x=62.575 w=93.363 and x=77.713 w=63.087, both centred on 109.2565.
    expect(stereotype.x).toBe('62.575');
    expect(stereotype.textLength).toBe('93.363');
    expect(name.x).toBe('77.713');
    expect(name.textLength).toBe('63.087');
    const centreOf = (r: typeof name): number => Number(r.x) + Number(r.textLength) / 2;
    expect(centreOf(stereotype)).toBeCloseTo(centreOf(name), 3);
  });

  it('places rows against the BADGE-shifted centre, not the box centre', () => {
    // `TextBlockSprited#drawU:70-77`. JAR box 2: x=172.938 w=177.363 with a
    // 64-wide sprite gives a name-block centre of 296.6195, not 261.6195.
    const rows = labels(render('birocu-87-xubi808')).filter((r) => r.text === 'BothZWSP');
    expect(Number(rows[0]!.x) + Number(rows[0]!.textLength) / 2).toBeCloseTo(296.6195, 2);
  });

  it('omits textLength for a single-character label', () => {
    const rows = labels(render('covuco-47-sotu151'));
    const single = rows.find((r) => r.text === 'c')!;
    expect(single.textLength).toBeUndefined();
    expect(single.x).toBe('17');
    // …while its two-character neighbours keep theirs.
    expect(rows.find((r) => r.text === 'tc')!.textLength).toBe('10.85');
  });

  it('emits no anchor and no dominant-baseline on any participant label', () => {
    for (const slug of ['jobadi-87-jegi648', 'birocu-87-xubi808', 'covuco-47-sotu151']) {
      for (const m of render(slug).matchAll(/<text[^>]*font-size="14"[^>]*>/g)) {
        expect(m[0], slug).not.toContain('text-anchor');
        expect(m[0], slug).not.toContain('dominant-baseline');
      }
    }
  });
});
