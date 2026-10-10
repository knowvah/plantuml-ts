import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderSync, type RenderOptions } from '../../../src/index.js';
import { combineAssetStores } from '../../../src/core/asset-store.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { buildEmojiAssetsStore } from '../../../scripts/emoji-assets-store.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';

const ERROR_BANNER = 'plantuml-ts version';
const CLASS_TYPE = 'data-diagram-type="CLASS"';
const LOST_EDGE_MESSAGE = 'no route was found';
const deNbsp = (svg: string): string => svg.split('\u00a0').join(' ');
// The oracle comparison regime (`scripts/svg-parity-survey.ts`): deterministic
// text widths, sprite + emoji assets, fixture includes.
const ORACLE_REGIME: RenderOptions = {
  measurer: new DeterministicMeasurer(),
  assetStore: combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore()),
  includeStore: fixtureIncludeStore(),
};
const FIXTURE_ROOT = 'test-results/dot-cache';

function fixture(bucket: string, slug: string): string {
  return readFileSync(`${FIXTURE_ROOT}/${bucket}/${slug}/in.puml`, 'utf8');
}

describe('aepp-T1g: sametail group whose edge graphviz lost', () => {
  it.each([
    ['class', 'zuduxu-90-kosi876'],
    ['unknown', 'rubebe-45-sura795'],
  ])('%s/%s renders the error page (Neighborhood.java:72-80 NPE mirror)', (bucket, slug) => {
    const svg = renderSync(fixture(bucket, slug), ORACLE_REGIME);
    expect(svg).toContain(ERROR_BANNER);
    expect(deNbsp(svg)).toContain(LOST_EDGE_MESSAGE);
    expect(svg).not.toContain(CLASS_TYPE);
  });

  it('a healthy groupInheritance diagram still draws', () => {
    const svg = renderSync(
      '@startuml\nskinparam groupInheritance 2\nclass A\nclass B extends A\nclass C extends A\n@enduml',
    );
    expect(svg).not.toContain(ERROR_BANNER);
    expect(svg).toContain(CLASS_TYPE);
  });
  it('a [hidden] extends link in a group still draws: Link.isInvis is LinkStyle.INVISIBLE only, [hidden] sets Link.hidden', () => {
    const svg = renderSync(
      '@startuml\nskinparam groupInheritance 2\nclass A\nclass B\nclass C\nA <|-[hidden]- B\nA <|-- C\n@enduml',
    );
    expect(svg).not.toContain(ERROR_BANNER);
    expect(svg).toContain(CLASS_TYPE);
  });

  it('groups a bare parent name written inside a package under its qualified id (DotData.java:126)', () => {
    const svg = renderSync(
      '@startuml\nskinparam groupInheritance 2\npackage P {\nclass A\nclass B\nclass C\nA <|-- B\nA <|-- C\n}\n@enduml',
    );
    expect(svg).toContain(CLASS_TYPE);
    expect(svg.match(/<polygon/g)?.length).toBe(1);
  });
});
