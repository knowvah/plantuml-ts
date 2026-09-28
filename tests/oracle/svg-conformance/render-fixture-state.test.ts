/**
 * `renderFixtureState` — assetStore forwarding (D6, cdd6-T1c).
 *
 * `sprite Netw jar:archimate/network` + a chrome `title <$Netw>` is the ONLY
 * sprite consumer for this engine (no `.sprites` token anywhere in
 * `state/renderer.ts` — the body never draws one, `applyChrome`'s
 * `ast.sprites` argument is the sole consumer). Empirically probed (not
 * assumed): without `options.assetStore`, `<$Netw>` resolves to nothing and
 * `<g class="title">` renders completely empty; with it, the resolved sprite
 * draws real vector geometry (a `<path>`) inside that same group — a
 * `<color:...>` wrapper around `<$Netw>` does NOT recolor the resolved
 * glyph the way it recolors a literal creole icon (`<&x>`), so this asserts
 * on glyph PRESENCE, not on a specific fill color.
 */
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureState } from './render-fixture-state.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';

const EMPTY_TITLE = /<g class="title"><\/g>/;
const MARKUP = '@startuml\nsprite Netw jar:archimate/network\ntitle <$Netw>\nstate Foo\n@enduml';

describe('renderFixtureState — assetStore forwarding (D6, cdd6-T1c)', () => {
  it('without an assetStore, the jar: archimate glyph never reaches the SVG (documents the starting state)', () => {
    const svg = renderFixtureState(MARKUP, new DeterministicMeasurer());
    expect(svg).toMatch(EMPTY_TITLE);
  });

  it('with an assetStore, the archimate glyph (a real <path>) is present in the title', () => {
    const assetStore = buildSpriteAssetsStore();
    const svg = renderFixtureState(MARKUP, new DeterministicMeasurer(), { assetStore });
    expect(svg).not.toMatch(EMPTY_TITLE);
    expect(svg).toMatch(/<g class="title"><path/);
  });

  it('throws a named error when the markup holds no diagram block', () => {
    expect(() => renderFixtureState('not a diagram', new DeterministicMeasurer())).toThrow(/no diagram block found/);
  });
});
