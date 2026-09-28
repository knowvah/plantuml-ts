/**
 * `renderFixtureActivity` — assetStore forwarding (D6, cdd6-T1c).
 *
 * `sprite Netw jar:archimate/network` + a chrome `title <$Netw>` is the ONLY
 * sprite consumer for this engine (no `.sprites` token anywhere in
 * `activity/renderer.ts`). Empirically probed: without `options.assetStore`,
 * `<$Netw>` resolves to nothing and `<g class="title">` renders completely
 * empty; with it, the resolved sprite draws real vector geometry (a
 * `<path>`) inside that same group.
 */
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from './render-fixture-activity.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';

const EMPTY_TITLE = /<g class="title"><\/g>/;
const MARKUP = '@startuml\nsprite Netw jar:archimate/network\ntitle <$Netw>\n:Download file;\n@enduml';

describe('renderFixtureActivity — assetStore forwarding (D6, cdd6-T1c)', () => {
  it('without an assetStore, the jar: archimate glyph never reaches the SVG (documents the starting state)', () => {
    const svg = renderFixtureActivity(MARKUP, new DeterministicMeasurer());
    expect(svg).toMatch(EMPTY_TITLE);
  });

  it('with an assetStore, the archimate glyph (a real <path>) is present in the title', () => {
    const assetStore = buildSpriteAssetsStore();
    const svg = renderFixtureActivity(MARKUP, new DeterministicMeasurer(), { assetStore });
    expect(svg).not.toMatch(EMPTY_TITLE);
    expect(svg).toMatch(/<g class="title"><path/);
  });

  it('throws a named error when the markup holds no diagram block', () => {
    expect(() => renderFixtureActivity('not a diagram', new DeterministicMeasurer())).toThrow(
      /no diagram block found/,
    );
  });
});
