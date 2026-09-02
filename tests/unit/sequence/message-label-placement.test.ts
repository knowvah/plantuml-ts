/**
 * A2 — a message label's LEFT EDGE against the jar's own numbers.
 *
 * `messageLabelBlock` is unit-tested for the block's internal arithmetic; what
 * it cannot see is where the caller anchors that block. That is
 * `sequence-layout-message.ts#labelLeftOf`, and it is the whole of A2's `x`
 * improvement, so it is pinned here against the cached oracle rather than
 * against a value this port computed.
 *
 * The oracle is `bosedo-77-loge384`, whose three messages happen to cover both
 * arms of upstream's clearance rule:
 *
 * ```
 * bob -> alice : 12345        JAR x=35.681   line starts 28.681   +7
 * bob -> alice : こんにちわ     JAR x=35.681   line starts 28.681   +7
 * bob <- alice : さようなら     JAR x=45.681   origin      28.681   +7+10
 * ```
 *
 * The third is the discriminating one. This port normalises `<-` by swapping
 * `fromX`/`toX` and leaving the head on `dressing2`, where upstream leaves the
 * arrow left-to-right and moves the head to `dressing1`. Asking `dressing1`
 * directly — the literal transcription of `ComponentRoseArrow.java:174-177` —
 * compiles, runs, and never fires. Only a leftward message catches it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const ORACLE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../test-results/dot-cache/sequence/bosedo-77-loge384/in.puml',
);

/** Every 13pt `<text>` — the arrow font, so message labels and nothing else. */
function messageLabels(
  svg: string,
): Array<{ x: string; textLength?: string; fontFamily?: string; text: string }> {
  const out: Array<{ x: string; textLength?: string; fontFamily?: string; text: string }> = [];
  for (const m of svg.matchAll(/<text([^>]*font-size="13"[^>]*)>([^<]*)<\/text>/g)) {
    const attrs = m[1]!;
    const x = /\bx="([^"]*)"/.exec(attrs)![1]!;
    const len = /\btextLength="([^"]*)"/.exec(attrs);
    const fam = /\bfont-family="([^"]*)"/.exec(attrs);
    out.push({
      x,
      ...(len === null ? {} : { textLength: len[1]! }),
      ...(fam === null ? {} : { fontFamily: fam[1]! }),
      text: m[2]!,
    });
  }
  return out;
}

describe('message label placement against the jar', () => {
  const svg = renderFixtureSequence(readFileSync(ORACLE, 'utf8'), new DeterministicMeasurer());
  const labels = messageLabels(svg);

  it('places a rightward message label at the arrow origin + 7', () => {
    // `getOldPaddingX1()` = `padding.getLeft()` of
    // `topRightBottomLeft(1, 7, 1, 7)` (`AbstractComponentRoseArrow.java:62`).
    expect(labels[0]!.x).toBe('35.681');
    expect(labels[1]!.x).toBe('35.681');
  });

  it('adds getArrowDeltaX() when a head sits at the arrow’s LEFT end', () => {
    // `ComponentRoseArrow.java:174-177`. 28.681 + 7 + 10.
    expect(labels[2]!.x).toBe('45.681');
  });

  it('emits the jar’s own textLength for each', () => {
    expect(labels[0]!.textLength).toBe('36.156');
    expect(labels[1]!.textLength).toBe('65');
    expect(labels[2]!.textLength).toBe('65');
  });

  it('emits no anchor and no dominant-baseline anywhere', () => {
    // Participant labels still anchor until A3; this asserts the ARROW-font
    // runs only, which is what A2 owns.
    for (const m of svg.matchAll(/<text[^>]*font-size="13"[^>]*>/g)) {
      expect(m[0]).not.toContain('text-anchor');
      expect(m[0]).not.toContain('dominant-baseline');
    }
  });
});

/**
 * C3 — the same labels, but with CREOLE in them, pinned against a second
 * oracle render:
 *
 * ```
 * autonumber "<font color=red>[000]</font>"
 * Alice -> Bob : a <b>bold</b> label
 * Alice -> Bob : plain
 * Alice -> Bob : ""x->  ""
 * ```
 *
 * The jar emits, in document order:
 *
 * ```
 * <text x="39.225"  fill="#F00" textLength="28.844">[001]</text>
 * <text x="72.069"  fill="#000">a</text>
 * <text x="79.3"    fill="#000" textLength="24.619" font-weight="700">bold</text>
 * <text x="103.919" fill="#000" textLength="27.544">label</text>
 * <text x="72.069"  fill="#000" textLength="18.444" font-family="monospace">x-></text>
 * ```
 *
 * Three things that look incidental and are not. `a` carries NO `textLength`
 * — `svg-shapes.ts#textLengthOf` applies upstream's `text.length() > 1` guard
 * to the TRIMMED form, and `'a '` trims to one character. `x->` is emitted
 * without the two trailing spaces its `textLength` was measured from, which is
 * `DriverTextSvg`'s own `trin`-then-measure order. And `#F00` is
 * `shortenColor` acting on the `#FF0000` the creole engine resolved.
 *
 * `y` and `fill` are deliberately not asserted: this port's ambient text
 * colour is `#181818` where the jar's default skin gives `#000`, and sequence
 * y-convergence is a separate, still-open axis.
 */
const CREOLE_SRC = [
  '@startuml',
  'autonumber "<font color=red>[000]</font>"',
  'Alice -> Bob : a <b>bold</b> label',
  'Alice -> Bob : plain',
  'Alice -> Bob : ""x->  ""',
  '@enduml',
].join('\n');

describe('creole in a message label (C3)', () => {
  const svg = renderFixtureSequence(CREOLE_SRC, new DeterministicMeasurer());
  const labels = messageLabels(svg);

  it('emits one sibling <text> per styled atom, and no <tspan>', () => {
    // decisions.md D3: an atom is a SIBLING `<text>`, never a `<tspan>`.
    expect(svg).not.toContain('<tspan');
    expect(labels.slice(0, 4).map((l) => l.text)).toEqual(['[001]', 'a', 'bold', 'label']);
  });

  it('places each run at the jar’s own x, the number’s width plus the 4px margin', () => {
    expect(labels.slice(0, 4).map((l) => l.x)).toEqual(['39.225', '72.069', '79.3', '103.919']);
  });

  it('gives each run its own textLength, and none to the single-character one', () => {
    expect(labels[0]!.textLength).toBe('28.844');
    expect(labels[1]!.textLength).toBeUndefined();
    expect(labels[2]!.textLength).toBe('24.619');
    expect(labels[3]!.textLength).toBe('27.544');
  });

  it('bolds ONLY the <b> run', () => {
    const bold = (t: string): boolean =>
      new RegExp(`<text[^>]*font-weight="700"[^>]*>${t}</text>`).test(svg);
    expect(bold('bold')).toBe(true);
    expect(bold('label')).toBe(false);
    expect(bold(String.raw`\[001\]`)).toBe(false);
  });

  it('interprets the autonumber’s creole rather than emitting it literally', () => {
    expect(svg).not.toContain('&lt;font color=red>');
    // `#FF0000` -> `#F00` through `svg-format.ts#shortenColor`, as the jar's
    // own `fill="#F00"` shows.
    expect(svg).toContain('fill="#F00"');
  });

  it('draws a ""…"" run in the monospace family, trailing spaces trimmed', () => {
    const mono = labels.find((l) => l.text === 'x->');
    expect(mono).toBeDefined();
    expect(mono!.textLength).toBe('18.444');
    expect(svg).toContain('font-family="monospace"');
  });
});

/**
 * The safety property. A label with no markup must render EXACTLY as it did
 * before C3 routed message labels through the creole engine — C1's
 * measurement identity (one atom, the original string, the original font) is
 * what makes that hold, and this pins it on real output rather than assuming
 * it.
 *
 * Captured from `bosedo-77-loge384` at `e9d1b4df`, the commit before C3.
 */
const PLAIN_LABEL_TEXTS = [
  '<text x="35.681" y="44.111" font-size="13" fill="#181818" textLength="36.156">12345</text>',
  '<text x="35.681" y="78.111" font-size="13" fill="#181818" textLength="65">こんにちわ</text>',
  '<text x="45.681" y="112.111" font-size="13" fill="#181818" textLength="65">さようなら</text>',
];

describe('a markup-free label is byte-identical after C3', () => {
  it('emits the pre-C3 <text> elements verbatim', () => {
    const plain = renderFixtureSequence(readFileSync(ORACLE, 'utf8'), new DeterministicMeasurer());
    const emitted = [...plain.matchAll(/<text[^>]*font-size="13"[^>]*>[^<]*<\/text>/g)].map((m) => m[0]);
    expect(emitted).toEqual(PLAIN_LABEL_TEXTS);
  });
});

/**
 * `bakuba-09-fica741`, the mission's own monospace reference fixture. Its
 * twelve message labels are each an arrow form quoted in `""…""`, and the jar
 * draws every one of them in `monospace` with the quotes gone
 * (`textLength="18.444" font-family="monospace">x-></text>`).
 */
describe('bakuba-09-fica741 monospace labels', () => {
  const BAKUBA = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../test-results/dot-cache/sequence/bakuba-09-fica741/in.puml',
  );

  it('renders the ""x->  "" label as an unquoted monospace run', () => {
    const svg = renderFixtureSequence(readFileSync(BAKUBA, 'utf8'), new DeterministicMeasurer());
    const labels = messageLabels(svg);
    // Two `== … ==` dividers sit among the 13pt runs; the arrow labels are the
    // ones the jar draws in monospace.
    const mono = labels.filter((l) => l.fontFamily === 'monospace');
    expect(mono).toHaveLength(12);
    expect(mono[0]!.text).toBe('x->');
    expect(mono[0]!.textLength).toBe('18.444');
    expect(mono.map((l) => l.text).slice(0, 6)).toEqual([
      'x->', '&lt;->', 'o&lt;->o', '&lt;->o', 'x&lt;->x', 'x->o',
    ]);
  });
});
