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

  it('puts both tab baselines on the jar', () => {
    // 10.111 below the tab's block top and 8.556 for the 11px comment, the two
    // numbers `renderer-frame-header.ts`'s deleted `textAscent` was verified
    // against. They must survive the switch to a measured ascent.
    //
    // C3 moved the block top itself, twice and in the same direction: the
    // document's own `TOP_MARGIN` (+10) and `GroupingTile#getFrameY:240-242`'s
    // `EXTERNAL_MARGINY` (+4) both push it down, and the tile chain above it
    // pulls back. The result is the JAR's own pair —
    // `<text x="28" y="62.111" ...>loop</text>` and
    // `<text x="97.619" y="61.556" ...>[forever]</text>` — so these are no
    // longer this port's numbers held steady, they are upstream's, exactly.
    const title = texts(svg).find((t) => t.text === 'loop')!;
    const comment = texts(svg).find((t) => t.text === '[forever]')!;
    expect(Number(title.y)).toBeCloseTo(62.111, 3);
    expect(Number(comment.y)).toBeCloseTo(61.556, 3);
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

/**
 * C5 — the same three displays, once they are routed through the creole seam.
 *
 * Every number below is the JAR's, read off the cached oracle. The absolute
 * `x` of a frame is NOT asserted: this port's document origin differs from the
 * jar's by a margin that has nothing to do with creole, so what is pinned is
 * the SHAPE — one `<text>` per atom, adjacent left to right, each at its own
 * measured width, and an `<a>` around the one the url produced.
 */
function elements(svg: string): string[] {
  return [...svg.matchAll(/<a\b[^>]*>|<\/a>|<text[^>]*>[^<]*<\/text>/g)].map((m) => m[0]);
}

function attr(el: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(el)?.[1];
}

describe('frame text through creole', () => {
  it('wraps a ref body url in an <a> and draws the label without markup', () => {
    // JAR (`cikoca-19-feji527`):
    //   <a ... href="http://www.google.com"><text ... font-size="12"
    //      textLength="121.275" ...>http://www.google.com</text></a>
    //   <text ... font-size="12" textLength="27.375">Foo2</text>
    // The port drew ONE `<text>` reading `[[http://www.google.com]] Foo2` at
    // textLength="161.85" before C5 — the markup measured as glyphs.
    const svg = renderFixtureSequence(source('cikoca-19-feji527'), new DeterministicMeasurer());
    const els = elements(svg);
    const i = els.findIndex((e) => e.includes('>http://www.google.com<'));
    expect(els[i - 1]).toContain('href="http://www.google.com"');
    expect(els[i + 1]).toBe('</a>');
    expect(attr(els[i]!, 'textLength')).toBe('121.275');
    expect(attr(els[i]!, 'font-size')).toBe('12');
    expect(attr(els[i]!, 'text-decoration')).toBe('underline');
    const foo2 = els.find((e) => e.includes('>Foo2<'))!;
    expect(attr(foo2, 'textLength')).toBe('27.375');
    // Adjacent: the label run starts exactly where the url run ends.
    expect(Number(attr(foo2, 'x'))).toBeCloseTo(Number(attr(els[i]!, 'x')) + 121.275, 3);
    // Same baseline — one line, several runs.
    expect(attr(foo2, 'y')).toBe(attr(els[i]!, 'y'));
    expect(svg).not.toContain('[[http://www.google.com]]');
  });

  it("draws a frame comment's url as its own linked run at the group font", () => {
    // JAR (`cedeti-10-bufu072`), the `alt [[…]]` tab comment as THREE runs:
    //   <text x="86.731" ... font-size="11" font-weight="700">[</text>
    //   <a ...><text x="89.756" ... font-size="11" textLength="125.194"
    //      font-weight="700" text-decoration="underline">https://…</text></a>
    //   <text x="214.95" ... font-size="11" font-weight="700">]</text>
    //
    // What this pins is everything the seam resolves correctly today: the
    // comment's url is a LINKED run of its OWN, carrying the group style's
    // `smallFont2` 11 and its bold rather than a default the atom engine
    // substituted, plus creole's blue and underline. The url STRING is one
    // `[` too long -- `core/klimt/creole/command/CommandCreoleUrl.ts:39`
    // admits `[` inside `[[…]]` where upstream's link alternative
    // (`UrlBuilder.java:77`, `[^%s%g\[\]]+?`) excludes it, so upstream's
    // `[[[url]]]` (the brackets are `ComponentRoseGroupingHeader.java:89`'s
    // own) matches at pos 1 and this port's at pos 0. That is a SEAM defect,
    // out of C5's write-set; see `.agent-notes/C5-frame-creole.md`. Nothing
    // asserted below changes when it is fixed.
    const svg = renderFixtureSequence(source('cedeti-10-bufu072'), new DeterministicMeasurer());
    const els = elements(svg);
    const i = els.findIndex((e) => e.includes('https://www.plantuml.com<'));
    expect(els[i - 1]).toContain('<a ');
    expect(els[i + 1]).toBe('</a>');
    const url = els[i]!;
    expect(attr(url, 'font-size')).toBe('11');
    expect(attr(url, 'font-weight')).toBe('700');
    expect(attr(url, 'fill')).toBe('#00F');
    expect(attr(url, 'text-decoration')).toBe('underline');
  });

  it('links the `else` condition the same way it links the `alt` comment', () => {
    // `cedeti-10-bufu072` writes `else [[https://www.plantuml.com]]`. The
    // condition is a `Display` like every other component text
    // (`AbstractTextualComponent.java:86-92`), so it goes through the same seam
    // -- the jar emits an `<a>` for the `alt` comment AND one for the `else`
    // condition, four in the document counting the two notes.
    //
    // Same caveat as the test above, for the same seam defect: the href and the
    // run split are distorted by `CommandCreoleUrl`'s character class, so
    // neither is asserted. What IS asserted is that the condition is linked at
    // all and carries the group style -- none of which changes when the defect
    // is fixed.
    const svg = renderFixtureSequence(source('cedeti-10-bufu072'), new DeterministicMeasurer());
    // Four `<a>` -- two from the frame (the `alt` comment and the `else`
    // condition) and, since C6, two from the notes. Equal to the jar's count.
    expect((svg.match(/<a /g) ?? []).length).toBe(4);
    const els = elements(svg);
    const linked = els
      .map((e, i) => ({ e, i }))
      .filter(({ e, i }) => e.startsWith('<text') && els[i - 1]?.includes('<a '));
    expect(linked).toHaveLength(4);
    // The frame's two are the ones at the group style's own `smallFont2` 11
    // (`ComponentRoseGroupingHeader.java:151-158`); the notes' two are at
    // `note { FontSize 13 }` and carry no weight, which is C6's assertion in
    // `annotation-text-placement.test.ts`, not this file's.
    const conditions = linked.filter(({ e }) => attr(e, 'font-size') === '11');
    expect(conditions).toHaveLength(2);
    for (const { e } of conditions) {
      expect(attr(e, 'font-weight')).toBe('700');
      expect(attr(e, 'text-decoration')).toBe('underline');
    }
  });

  it('leaves a markup-free frame byte-identical', () => {
    // A frame with no markup must not move: `sequence-creole.ts`'s measurement
    // identity says one atom carrying the whole line at the whole line's own
    // measured width, so the tab, its comment and the `ref` body all emit what
    // they emitted before the seam. Pinned against the JAR's own numbers.
    const svg = renderFixtureSequence(source('bepipo-37-fego336'), new DeterministicMeasurer());
    const title = texts(svg).find((t) => t.text === 'loop')!;
    const comment = texts(svg).find((t) => t.text === '[forever]')!;
    expect([title.x, title.textLength, title.size]).toEqual(['28', '24.619', '13']);
    expect([comment.x, comment.textLength, comment.size]).toEqual(['97.619', '40.219', '11']);
  });
});
