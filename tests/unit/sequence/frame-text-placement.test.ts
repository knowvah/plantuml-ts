/**
 * A4 — frame header, comment and `ref` body text against the jar.
 *
 * Three things are pinned here, in descending order of how easy they are to
 * break silently:
 *
 *  1. The tab title's baseline must NOT move. `renderer-frame-header.ts` was
 *     the one sequence renderer already emitting a correct one; A4 replaced
 *     the arithmetic behind it with a measured ascent, and the whole point is
 *     that the number comes out identical for a production measurer.
 *  2. Under `FixedMeasurer(8, 16)` it must come out DIFFERENT — `16 - 16/4.5`,
 *     not `13 - 13/4.5`. That is the sizer/renderer split D1 and D2 exist to
 *     close, and it is invisible to every corpus fixture because no fixture
 *     runs under `FixedMeasurer`.
 *  3. The `ref` body is measured at `reference { FontSize 12 }`, not at the
 *     ambient 14. This was latent until A4 started emitting a `textLength`:
 *     the wrong font gave the right glyphs a wrong advance, which distorts
 *     text rather than merely displacing it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import type { FrameGeo } from '../../../src/diagrams/sequence/ast.js';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/sequence');

function source(slug: string): string {
  return readFileSync(join(CACHE, slug, 'in.puml'), 'utf8');
}

interface Emitted { x: string; y: string; size: string; textLength: string | undefined; text: string }

function texts(svg: string): Emitted[] {
  const out: Emitted[] = [];
  for (const m of svg.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)) {
    const a = m[1]!;
    const len = /\btextLength="([^"]*)"/.exec(a);
    out.push({
      x: /\bx="([^"]*)"/.exec(a)![1]!,
      y: /\by="([^"]*)"/.exec(a)![1]!,
      size: /\bfont-size="([^"]*)"/.exec(a)![1]!,
      textLength: len?.[1],
      text: m[2]!,
    });
  }
  return out;
}

describe('frame header text', () => {
  const svg = renderFixtureSequence(source('bepipo-37-fego336'), new DeterministicMeasurer());

  it("emits the jar's x, textLength and weight for the tab title and its comment", () => {
    // JAR: <text x="28" ... font-size="13" textLength="24.619" font-weight="700">loop</text>
    //      <text x="97.619" ... font-size="11" textLength="40.219" font-weight="700">[forever]</text>
    const title = texts(svg).find((t) => t.text === 'loop')!;
    const comment = texts(svg).find((t) => t.text === '[forever]')!;
    expect(title.x).toBe('28');
    expect(title.textLength).toBe('24.619');
    expect(title.size).toBe('13');
    expect(comment.x).toBe('97.619');
    expect(comment.textLength).toBe('40.219');
    // The group style's own smallFont2, not the header's 13.
    expect(comment.size).toBe('11');
  });

  it('does not move the baseline it already had right', () => {
    // 10.111 below the tab's block top and 8.556 for the 11px comment, the two
    // numbers `renderer-frame-header.ts`'s deleted `textAscent` was verified
    // against. They must survive the switch to a measured ascent.
    const title = texts(svg).find((t) => t.text === 'loop')!;
    const comment = texts(svg).find((t) => t.text === '[forever]')!;
    expect(Number(title.y)).toBeCloseTo(60.111, 3);
    expect(Number(comment.y)).toBeCloseTo(59.556, 3);
  });

  it('takes the ascent from the MEASURER, not from the font size', () => {
    // Asserted on the geometry rather than the markup: the ascent reaches the
    // SVG only as a summand of the baseline, so reading it back out of an
    // emitted `y` would be a subtraction whose other term also moves with the
    // measurer.
    //
    // `FixedMeasurer(8, 16)`: descent is `lineHeight / 4.5`, so the ascent is
    // 16 - 16/4.5 = 12.444. The shorthand this replaced would have said
    // 13 - 13/4.5 = 10.111 from the FONT size — the exact divergence D1
    // closes, and one no corpus fixture can catch because none runs under
    // `FixedMeasurer`.
    const lines = source('bepipo-37-fego336')
      .split('\n')
      .filter((l) => !l.startsWith('@start') && !l.startsWith('@end'));
    const frameOf = (measurer: StringMeasurer): FrameGeo => {
      const parsed = parseSequence(lines);
      if ('refused' in parsed) throw new Error(parsed.message);
      const geo = layoutSequence(parsed, defaultTheme, measurer);
      return geo.events.find((e): e is FrameGeo => e.kind === 'frame')!;
    };
    expect(frameOf(new FixedMeasurer(8, 16)).tabRuns[0]!.textAscent).toBeCloseTo(16 - 16 / 4.5, 9);
    // The production measurer still agrees with the old shorthand exactly,
    // which is why no golden moved.
    expect(frameOf(new DeterministicMeasurer()).tabRuns[0]!.textAscent)
      .toBeCloseTo(13 - 13 / 4.5, 9);
  });
});

describe('ref body text', () => {
  it('measures and draws the body at reference { FontSize 12 }', () => {
    // JAR: <text x="71.134" ... font-size="12" textLength="26.625">short</text>
    // Measured at the ambient 14 this port emitted textLength="31.063" — the
    // same string, the wrong advance.
    const svg = renderFixtureSequence(source('cekora-30-diso384'), new DeterministicMeasurer());
    const body = texts(svg).find((t) => t.text === 'short')!;
    expect(body.size).toBe('12');
    expect(body.textLength).toBe('26.625');
  });

  it('emits no anchor and no dominant-baseline from either frame renderer', () => {
    for (const slug of ['bepipo-37-fego336', 'cekora-30-diso384']) {
      const svg = renderFixtureSequence(source(slug), new DeterministicMeasurer());
      for (const m of svg.matchAll(/<text[^>]*>/g)) {
        expect(m[0], slug).not.toContain('text-anchor');
        expect(m[0], slug).not.toContain('dominant-baseline');
      }
    }
  });
});
