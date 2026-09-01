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
