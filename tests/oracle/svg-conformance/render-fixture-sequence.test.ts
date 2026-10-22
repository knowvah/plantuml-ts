/**
 * `renderFixtureSequence` contract (sequence-oracle-harness / T1).
 *
 * Mirrors the risk `render-fixture-json.test.ts` guards against: a helper
 * that quietly diverges from its own doc-commented contract still produces a
 * perfectly valid-looking SVG, so "returns a string" is not enough to catch
 * a regression. Two things are asserted here that a mere "it renders" smoke
 * test would miss:
 *
 *   1. The SAME measurer instance passed in must be the one that reaches
 *      BOTH the layout stage (`layoutSequence`) and, when chrome is present,
 *      the render/chrome stage (`applyChrome`) — not a fresh default
 *      instance construted internally for either. If chrome silently used
 *      its own measurer, this test's second `it` would observe the SAME
 *      call count with and without a title, instead of a strictly higher
 *      one — see the instrumented `countingMeasurer` helper below.
 *   2. Its own diagram never reaches `renderSync` (only a nested `{{ }}`
 *      diagram does, through the nested-renderer seam) — proven indirectly: a markup with no
 *      diagram block throws (`renderSync` never throws; T0's note records
 *      that it swallows every failure into an error-diagram SVG instead).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence, sequenceFixtureOptions } from './render-fixture-sequence.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';

const A0001_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/corpus/sequence/A0001_Test.puml');

/** Wraps a real `DeterministicMeasurer` and counts every call reaching it,
 *  so a test can detect whether a SECOND, untracked measurer instance was
 *  used anywhere in the pipeline instead of this one. */
function countingMeasurer(): { measurer: StringMeasurer; calls: () => number } {
  const base = new DeterministicMeasurer();
  let calls = 0;
  const measurer: StringMeasurer = {
    measure(text: string, font: FontSpec) {
      calls++;
      return base.measure(text, font);
    },
    getDescent(font: FontSpec, text: string) {
      calls++;
      return base.getDescent(font, text);
    },
  };
  return { measurer, calls: () => calls };
}

describe('renderFixtureSequence', () => {
  it('returns a string beginning "<svg" for a real corpus fixture', () => {
    const markup = readFileSync(A0001_PATH, 'utf8');
    const svg = renderFixtureSequence(markup, new DeterministicMeasurer());
    expect(svg.startsWith('<svg')).toBe(true);
  });

  it('routes the SAME measurer instance through both the layout stage and the chrome/render stage', () => {
    const bare = 'Bob->Alice: hi\n';
    const titled = 'title My Title\nBob->Alice: hi\n';

    const bareRun = countingMeasurer();
    renderFixtureSequence(`@startuml\n${bare}@enduml`, bareRun.measurer);
    const bareCalls = bareRun.calls();
    expect(bareCalls).toBeGreaterThan(0);

    const titledRun = countingMeasurer();
    renderFixtureSequence(`@startuml\n${titled}@enduml`, titledRun.measurer);
    const titledCalls = titledRun.calls();

    // The title-only delta must be attributable to THIS instance — if
    // `applyChrome` measured the title with a different, unpassed
    // measurer, `titledCalls` would equal `bareCalls` instead of exceeding
    // it, because the chrome stage's calls would land on that other
    // instance rather than this one.
    expect(titledCalls).toBeGreaterThan(bareCalls);
  });

  it('throws a named error when the markup holds no diagram block (never falls back to renderSync)', () => {
    expect(() => renderFixtureSequence('not a diagram', new DeterministicMeasurer())).toThrow(/no diagram block found/);
  });

  it('renders a titled fixture with the title text present in the output', () => {
    const svg = renderFixtureSequence(
      '@startuml\ntitle My Title\nBob->Alice: hi\n@enduml',
      new DeterministicMeasurer(),
    );
    expect(svg).toContain('My Title');
  });
});

// Sequence's chrome (title) is the ONLY sprite consumer for this engine (no
// `.sprites` token anywhere in `sequence/renderer.ts`). Empirically probed:
// without `options.assetStore`, `<$Netw>` resolves to nothing and
// `<g class="title">` renders completely empty; with it, the resolved
// sprite draws real vector geometry (a `<path>`) inside that same group.
describe('renderFixtureSequence — assetStore forwarding (D6, cdd6-T1c)', () => {
  const EMPTY_TITLE = /<g class="title"><\/g>/;
  const MARKUP = '@startuml\nsprite Netw jar:archimate/network\ntitle <$Netw>\nBob->Alice: hi\n@enduml';

  it('without an assetStore, the jar: archimate glyph never reaches the SVG (documents the starting state)', () => {
    const svg = renderFixtureSequence(MARKUP, new DeterministicMeasurer());
    expect(svg).toMatch(EMPTY_TITLE);
  });

  it('with an assetStore, the archimate glyph (a real <path>) is present in the title', () => {
    const assetStore = buildSpriteAssetsStore();
    const svg = renderFixtureSequence(MARKUP, new DeterministicMeasurer(), { assetStore });
    expect(svg).not.toMatch(EMPTY_TITLE);
    expect(svg).toMatch(/<g class="title"><path/);
  });
});

// sdd2 T-exit (.agent-notes/sdd2-execution.md): the gates rendered with only
// an includeStore, so an emoji read as the fallback glyph and four rows
// diverged on that alone. `sequenceFixtureOptions` is the one bag every
// sequence gate and tool renders with: the survey's own stores.
describe('sequenceFixtureOptions', () => {
  const EMOJI = '@startuml\nAlice -> Bob : hi <:1f600:>\n@enduml';

  it('returns the same bag, store references included, on every call', () => {
    const a = sequenceFixtureOptions();
    const b = sequenceFixtureOptions();
    expect(b).toBe(a);
    expect(b.assetStore).toBe(a.assetStore);
    expect(b.includeStore).toBe(a.includeStore);
  });

  it('draws an emoji as the jar does (vector artwork), not the fallback text glyph', () => {
    const svg = renderFixtureSequence(EMOJI, new DeterministicMeasurer(), sequenceFixtureOptions());
    expect(svg).not.toContain('>\u{1F600}</text>');
    expect(svg).toContain('<ellipse cx="62.706" cy="60.75" rx="9.75" ry="9.75" fill="#FFCC4D"');
  });

  it('resolves a jar: sprite through the same bag', () => {
    const svg = renderFixtureSequence(
      '@startuml\nsprite Netw jar:archimate/network\ntitle <$Netw>\nBob->Alice: hi\n@enduml',
      new DeterministicMeasurer(),
      sequenceFixtureOptions(),
    );
    expect(svg).toMatch(/<g class="title"><path/);
  });
});

describe('renderFixtureSequence nested-diagram registration (sdd2-T6d)', () => {
  it('draws a note body {{ }} as exactly one embedded svg image (CreoleParser.java:152-154)', () => {
    const svg = renderFixtureSequence(
      '@startuml\nparticipant A\nnote over A\n{{\nA -> B\n}}\nend note\n@enduml',
      new DeterministicMeasurer(),
    );
    expect(svg.match(/<image /g)).toHaveLength(1);
    expect(svg).toContain('data:image/svg+xml');
  });

  it('keeps the trailing " " atom after </size> in a multi-line note (StripeSimple.java:124-126)', () => {
    const svg = renderFixtureSequence(
      '@startuml\nparticipant A\nnote over A\n<size:18>x</size> \nz\nend note\n@enduml',
      new DeterministicMeasurer(),
    );
    expect(svg).toMatch(/<text x="30" y="72\.111" font-size="13" fill="#000">\u00a0<\/text>/);
  });
});
