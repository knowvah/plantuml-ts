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

/**
 * C4 — the same rows, now parsed as creole.
 *
 * Three oracles, each discriminating one thing the row builder could not say
 * before:
 *
 *   `kofuti-29-goti188`   `The <b>Famous</b> Bob` — one ROW that is three
 *                         runs, so the row's own width is the sum and the
 *                         block, not each run, is what gets centred.
 *   `bugabo-85-veki716`   `=MyTitle` — a HEADING stripe, whose font is 18
 *                         bold and whose line box is therefore taller than
 *                         its neighbours'.
 *   `jozomu-87-tajo507`   `""MySubTitle""` — a monospace run, whose measured
 *                         width (70.087) is not the raw line's (90.038) and
 *                         so moves the BOX as well as the text.
 *
 * `jobadi-87-jegi648` pins the other half of the contract: a markup-free name
 * must emit exactly what it emitted before the seam existed.
 */

/** Every `<text>` with the style attributes a creole run can set. */
function runs(svg: string): Array<{
  x: number;
  y: number;
  textLength: number | undefined;
  size: string | undefined;
  weight: string | undefined;
  family: string | undefined;
  text: string;
}> {
  const attr = (a: string, n: string): string | undefined => new RegExp(`\\b${n}="([^"]*)"`).exec(a)?.[1];
  return [...svg.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)].map((m) => {
    const a = m[1]!;
    const len = attr(a, 'textLength');
    return {
      x: Number(attr(a, 'x')),
      y: Number(attr(a, 'y')),
      textLength: len === undefined ? undefined : Number(len),
      size: attr(a, 'font-size'),
      weight: attr(a, 'font-weight'),
      family: attr(a, 'font-family'),
      text: m[2]!,
    };
  });
}

describe('participant labels through creole', () => {
  it('splits one row into the jar’s three runs and advances x by each width', () => {
    // JAR: x=297.594 "The " 48.3 | x=345.894 "Famous" 101.15 weight 700 |
    //      x=447.044 " Bob" 49.875 — all at font-size 28 (`scale 2`). The
    // separating spaces are in the WIDTHS and not in the emitted strings: the
    // jar's own bytes are `textLength="48.3">The</text>`.
    const row = runs(render('kofuti-29-goti188')).filter((r) => r.size === '28' && r.y < 100);
    expect(row.map((r) => r.text)).toEqual(['Alice', 'The', 'Famous', 'Bob']);
    const [, the, famous, bob] = row;
    expect([the!.textLength, famous!.textLength, bob!.textLength]).toEqual([48.3, 101.15, 49.875]);
    expect(famous!.weight).toBe('700');
    expect(the!.weight).toBeUndefined();
    // x advances by the PRECEDING run's own width, never by a shared stride.
    expect(famous!.x).toBeCloseTo(the!.x + the!.textLength!, 6);
    expect(bob!.x).toBeCloseTo(famous!.x + famous!.textLength!, 6);
    // …and all three share the row's baseline.
    expect([famous!.y, bob!.y]).toEqual([the!.y, the!.y]);
  });

  it('centres a multi-run row as a BLOCK on the name-block centre', () => {
    // JAR box 2: x=283.594 w=227.325 -> centre 397.2565, and the three runs
    // span 297.594..496.919, whose midpoint is that same centre.
    const svg = render('kofuti-29-goti188');
    const row = runs(svg).filter((r) => r.size === '28' && r.y < 100).slice(1);
    const left = row[0]!.x;
    const right = row.at(-1)!.x + row.at(-1)!.textLength!;
    expect(right - left).toBeCloseTo(199.325, 3);
    // The jar's box is `x=283.594 y=20 w=227.325`. Since C3 landed the
    // document's top margin this port's head row starts at 10 too; this
    // fixture's tallest head is taller than Bob's, so Bob's own box is
    // bottom-aligned 10 lower still. Only the CENTRE is asserted below.
    const boxes = [...svg.matchAll(/<rect x="([\d.]+)" y="20" width="([\d.]+)"/g)];
    const bob = boxes[1]!;
    expect(left + (right - left) / 2).toBeCloseTo(Number(bob[1]) + Number(bob[2]) / 2, 3);
  });

  it('gives a `=` heading row the jar’s 18pt bold font and its own line box', () => {
    // JAR: <text x="23.019" y="31" font-size="18" textLength="58.05"
    //       font-weight="700">MyTitle</text>, and the row BELOW it starts one
    // 18pt line box down, not one 14pt one.
    const rows = runs(render('bugabo-85-veki716'));
    const heading = rows.find((r) => r.text === 'MyTitle')!;
    expect(heading.size).toBe('18');
    expect(heading.weight).toBe('700');
    expect(heading.textLength).toBe(58.05);
    expect(heading.x).toBeCloseTo(23.019, 3);
    // The jar's baseline is 31, and C3 landed the document's top margin, so
    // this port is now ON it rather than 10 above.
    expect(heading.y).toBeCloseTo(31, 3);
  });

  it('measures a `""mono""` row at its own family, and moves the box with it', () => {
    // JAR: rect x=10 w=84.087, <text x="17" font-family="monospace"
    // textLength="70.087">MySubTitle</text>. The raw line measures 90.038, so
    // a box built from the unparsed text is 20 too wide.
    const svg = render('jozomu-87-tajo507');
    const mono = runs(svg).find((r) => r.text === 'MySubTitle')!;
    expect(mono.family).toBe('monospace');
    expect(mono.textLength).toBe(70.087);
    expect(mono.x).toBe(17);
    // y=10 since C3: the jar's own head-row origin (`TOP_MARGIN`).
    expect(svg).toContain('<rect x="10" y="10" width="84.087"');
  });

  it('emits a markup-free name byte-for-byte as it did before the seam', () => {
    // Measurement identity: no markup -> one atom -> `measure(line)`, the same
    // raw call this row used to make. Pinned as the whole element, so a stray
    // style attribute or a moved coordinate both fail here.
    // The baseline is the jar's 27.889 since C3 landed the top margin; the
    // jar's own golden carries `<text x="17" y="27.889" ... >Bob</text>`.
    expect(render('jobadi-87-jegi648')).toContain(
      '<text x="17" y="27.889" font-size="14" fill="#181818" textLength="24.938">Bob</text>',
    );
  });
});
