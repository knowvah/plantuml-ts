/**
 * A5 — notes, dividers, `[condition]` labels and box labels against the jar.
 *
 * These are the four text sites `renderer.ts` draws itself, and between them
 * they carried both of this engine's remaining anchor conventions: the note
 * body centred with `text-anchor="middle"`, the divider label top-aligned with
 * `dominant-baseline="hanging"`. The last test here is the structural one —
 * after A5 the file imports no `text` at all, so neither convention can come
 * back by accident (D3).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import {
  sequenceCreoleFont,
  sequenceCreoleRuns,
} from '../../../src/diagrams/sequence/sequence-creole.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const CACHE = join(ROOT, 'test-results/dot-cache/sequence');

function render(slug: string): string {
  return renderFixtureSequence(readFileSync(join(CACHE, slug, 'in.puml'), 'utf8'), new DeterministicMeasurer());
}

function textFor(svg: string, content: string): Record<string, string> {
  const m = new RegExp(`<text([^>]*)>${content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</text>`).exec(svg);
  expect(m, `no <text> for ${content}`).not.toBeNull();
  const out: Record<string, string> = {};
  for (const a of m![1]!.matchAll(/([\w-]+)="([^"]*)"/g)) out[a[1]!] = a[2]!;
  return out;
}

describe('note bodies', () => {
  const svg = render('bocusa-16-ciju126');

  it('measures and draws at note { FontSize 13 }, not the ambient 14', () => {
    // JAR: <text x="111.9" y="67.111" font-size="13" textLength="36.075">1. right</text>
    const note = textFor(svg, '1. right');
    expect(note['font-size']).toBe('13');
    expect(note['textLength']).toBe('36.075');
  });

  it('left-aligns the body rather than centring it', () => {
    // `ComponentRoseNoteBox#drawInternalU:105` translates the block by
    // `(getOldPaddingX1() + diffX / 2, getOldPaddingY())`. The jar's own box
    // for `1. right` spans 105.9..162.9 (57 wide) around a 36.075-wide line:
    // centred it would sit at 116.36, and it sits at 111.9.
    //
    // Asserted as a RELATION, not an absolute: this port's note x carries a
    // separate, pre-existing positioning error (see the note in
    // `.agent-notes/A1-sequence-geo-text-metric-fields.md`), so pinning the
    // jar's number here would pin that error's absence rather than the
    // alignment.
    const left = textFor(svg, '3. left');
    const over = textFor(svg, '2. over');
    // Two different strings in two different boxes: if either were centred,
    // its x would depend on its own width. Both sit one padding in.
    expect(Number(left['x'])).toBeLessThan(Number(over['x']));
    expect(left['textLength']).toBe('28.113');
  });

  it('emits no text-anchor on a note body', () => {
    for (const m of svg.matchAll(/<text[^>]*>/g)) expect(m[0]).not.toContain('text-anchor');
  });
});

describe('else-branch conditions', () => {
  it("emits the jar's x, textLength and bold weight", () => {
    // JAR: <text x="18.469" y="180.556" font-size="11" textLength="32.381"
    //            font-weight="700">[sinon]</text>
    // The x is `frame.x + 5`, `ComponentRoseGroupingElse`'s own
    // `topRightBottomLeft(1, 5, 1, 5)` — this port used 6.
    const cond = textFor(render('bovugo-63-lazo401'), '[sinon]');
    expect(cond['x']).toBe('18.469');
    expect(cond['textLength']).toBe('32.381');
    expect(cond['font-weight']).toBe('700');
    expect(cond['font-size']).toBe('11');
  });
});

describe('divider labels', () => {
  it('carries a textLength and no hanging baseline', () => {
    // JAR: textLength="177.288" font-weight="700" at font-size 13.
    const label = textFor(render('degire-21-dujo330'), 'Resource AllocationAllocationX');
    expect(label['textLength']).toBe('177.288');
    expect(label['font-weight']).toBe('700');
    expect(label['dominant-baseline']).toBeUndefined();
  });
});

describe('renderer.ts emits no anchored text at all (D3)', () => {
  it('imports no `text` from the SVG seam', () => {
    // Structural, not behavioural: as long as the import is absent, no future
    // change to this file can reintroduce `text-anchor` or
    // `dominant-baseline` without first re-adding the import — which is a
    // visible line in a diff, where an attribute buried in an options object
    // is not.
    const src = readFileSync(join(ROOT, 'src/diagrams/sequence/renderer.ts'), 'utf8');
    expect(src).toContain("import { rect, line, noteBox } from '../../core/svg.js';");
    expect(/^import \{[^}]*\btext\b[^}]*\} from/m.test(src)).toBe(false);
  });

  it('emits neither anchor across every fixture these four sites appear in', () => {
    for (const slug of ['bocusa-16-ciju126', 'bovugo-63-lazo401', 'degire-21-dujo330', 'binupo-93-begi656']) {
      for (const m of render(slug).matchAll(/<text[^>]*>/g)) {
        expect(m[0], slug).not.toContain('text-anchor');
        expect(m[0], slug).not.toContain('dominant-baseline');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// C6 — the same four sites, now through the creole seam
// ---------------------------------------------------------------------------

describe('note bodies through creole (C6)', () => {
  const svg = render('moxope-92-roco972');

  it('emits one styled sibling <text> per creole run, never a <tspan>', () => {
    // JAR, one note per line of the fixture:
    //   ...textLength="24.619" font-weight="700">bold</text>
    //   ...textLength="26.081" font-style="italic">italic</text>
    //   ...textLength="31.038" text-decoration="line-through">strike</text>
    //   ...textLength="53.544" text-decoration="underline">underline</text>
    // D3: siblings, because `DriverTextSvg#draw` emits one `<text>` per atom
    // and upstream has no `<tspan>` on that path.
    expect(svg).not.toContain('<tspan');
    const bold = textFor(svg, 'bold');
    expect(bold['font-weight']).toBe('700');
    expect(bold['textLength']).toBe('24.619');
    expect(bold['font-size']).toBe('13');
    expect(textFor(svg, 'italic')['font-style']).toBe('italic');
    expect(textFor(svg, 'italic')['textLength']).toBe('26.081');
    expect(textFor(svg, 'strike')['text-decoration']).toBe('line-through');
    expect(textFor(svg, 'underline')['text-decoration']).toBe('underline');
  });

  it('carries every flag of a nested <b><i><u> run on one element', () => {
    // JAR: textLength="107.088" font-weight="700" font-style="italic"
    //      text-decoration="underline">boldItalicUnderline</text>
    const run = textFor(svg, 'boldItalicUnderline');
    expect(run['font-weight']).toBe('700');
    expect(run['font-style']).toBe('italic');
    expect(run['text-decoration']).toBe('underline');
    expect(run['textLength']).toBe('107.088');
  });

  it('sizes the note box from the creole block, not from the raw markup', () => {
    // `getTextWidth` is the TEXT BLOCK's own calculated width plus the padding
    // (`AbstractTextualComponent.java:100-108`), and the block is built from
    // the creole `Display` (`:89-92`) — so `<b>bold</b>` reserves the width of
    // `bold`, not of the ten markup characters around it. The jar's own box
    // for that note runs 86.163..131.163; this port's is one padding pair
    // around the same 24.619 run, at a left edge that carries the note-x
    // divergence `.agent-notes/A1-sequence-geo-text-metric-fields.md` records
    // — so the assertion is the WIDTH, which is this task's, not the origin.
    const bold = svg.indexOf('>bold</text>');
    expect(bold).toBeGreaterThan(-1);
    const box = /<path d="M91\.163,102 L125\.781,102 L135\.781,112 L135\.781,135 L91\.163,135 Z"/;
    expect(box.test(svg)).toBe(true);
    // 135.781 - 91.163 = 44.618 = the 24.619-wide run plus 10 of padding each
    // side. Before C6 the same box was sized from `<b>bold</b>`, 20 wider.
    expect(textFor(svg, 'bold')['textLength']).toBe('24.619');
  });
});

describe('note urls (C6)', () => {
  it("brings cedeti-10-bufu072 to the jar's four <a> elements", () => {
    // Two for the `alt`/`else` conditions (C5) and two for the notes: the
    // fixture writes `note over Bob: [[https://www.google.com]]` twice, and
    // `SvgGraphics#openLink`/`closeLink` (`:1105-1150`) WRAP the drawn text.
    const svg = render('cedeti-10-bufu072');
    expect((svg.match(/<a /g) ?? []).length).toBe(4);
    // JAR: <text x="40" y="123.111" fill="#00F" font-size="13"
    //       textLength="137.881" text-decoration="underline">…</text>
    // The note's `[[…]]` is not nested inside a literal `[`, so it does NOT
    // hit the `CommandCreoleUrl` bracket defect the frame condition does
    // (`plans/sequence-creole/findings/creole-url-bracket-defect.md`) and its
    // href is assertable.
    const linked = /<a [^>]*href="https:\/\/www\.google\.com"[^>]*>\s*<text[^>]*>https:\/\/www\.google\.com<\/text>/;
    expect(linked.test(svg)).toBe(true);
    const run = textFor(svg, 'https://www.google.com');
    expect(run['textLength']).toBe('137.881');
    expect(run['text-decoration']).toBe('underline');
    expect(run['font-size']).toBe('13');
  });
});

describe('divider labels through creole (C6)', () => {
  it('draws `<color:red> KO` as the coloured KO the jar draws', () => {
    // JAR: <text x="49.484" y="71.111" fill="#F00" font-size="13"
    //            textLength="18.769" font-weight="700">KO</text>
    // The `<color:red>` command sets the run's own fill; the surrounding
    // spaces survive into the WIDTH and are trimmed out of the emitted string
    // by `StringUtils.trin` (`DriverTextSvg.java:125`).
    const label = textFor(render('bakuba-09-fica741'), 'KO');
    expect(label['fill']).toBe('#F00');
    expect(label['textLength']).toBe('18.769');
    expect(label['font-weight']).toBe('700');
    expect(label['font-size']).toBe('13');
  });

  it('leaves a markup-free divider exactly where it was', () => {
    // The seam's measurement identity: one atom, the original string, the
    // original width. `degire-21-dujo330` has no markup at all.
    const label = textFor(render('degire-21-dujo330'), 'Resource AllocationAllocationX');
    expect(label['textLength']).toBe('177.288');
    expect(label['font-weight']).toBe('700');
  });
});

describe('box group labels', () => {
  /**
   * `ComponentRoseEnglober` extends `AbstractTextualComponent` and builds its
   * label through the same `create0` every other sequence text uses
   * (`~/git/plantuml/.../skin/rose/ComponentRoseEnglober.java:57-60`), so the
   * box label belongs on the same seam.
   *
   * Measured reach is ZERO: all 59 `box` declarations in the corpus carry a
   * plain label. This closes the last text kind for CONSISTENCY, and the
   * property that matters is therefore the safety one — measurement identity
   * says a plain label renders byte-identically.
   */
  it('leaves a plain box label byte-identical, one run at the raw width', () => {
    const measurer = new DeterministicMeasurer();
    const font = { family: 'sans-serif', size: 11 };
    const runs = sequenceCreoleRuns(
      'Services',
      sequenceCreoleFont(font),
      { leftX: 14, baselineY: 15 },
      measurer,
    );
    expect(runs).toHaveLength(1);
    expect(runs[0]?.text).toBe('Services');
    expect(runs[0]?.textWidth).toBeCloseTo(measurer.measure('Services', font).width, 10);
  });

  it('splits a marked-up box label into styled sibling runs', () => {
    const runs = sequenceCreoleRuns(
      'a <b>bold</b> group',
      sequenceCreoleFont({ family: 'sans-serif', size: 11 }),
      { leftX: 14, baselineY: 15 },
      new DeterministicMeasurer(),
    );
    expect(runs.map((r) => r.text)).toEqual(['a ', 'bold', ' group']);
    expect(runs.map((r) => r.bold)).toEqual([undefined, true, undefined]);
  });
});
