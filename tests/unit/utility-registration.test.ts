/**
 * ufp T2a (decisions.md D2): every utility plugin is registered at its
 * `PSystemBuilder` position, the 15 in-scope corpus rows route to their
 * utility plugin and render, and every engine still owns its own sources.
 *
 * The expected order is DERIVED from {@link JAVA_LINE} — the line of each
 * plugin's `factories.add(...)` in `PSystemBuilder.java:133-200` — so the test
 * states the Java, not a copy of the registration list.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import { renderSync } from '../../src/index.js';
import { registerPlugins } from '../../src/registered-plugins.js';
import { combineAssetStores } from '../../src/core/asset-store.js';
import { registry, type DiagramPlugin } from '../../src/core/dispatcher.js';
import { setErrorPageObserver } from '../../src/core/error/error-renderer.js';
import { DeterministicMeasurer } from '../../src/core/measurer-deterministic.js';
import { listArchimateSpritesPlugin } from '../../src/core/klimt/sprite/PSystemListArchimateSpritesFactory.js';
import { activityPlugin } from '../../src/diagrams/activity/index.js';
import { boardPlugin } from '../../src/diagrams/board/index.js';
import { chartPlugin } from '../../src/diagrams/chart/index.js';
import { chronologyPlugin } from '../../src/diagrams/chronology/index.js';
import { classPlugin } from '../../src/diagrams/class/index.js';
import { dedicationPlugin } from '../../src/diagrams/dedication/PSystemDedicationFactory.js';
import { descriptionPlugin } from '../../src/diagrams/description/index.js';
import { dotPlugin } from '../../src/diagrams/dot/index.js';
import { donorsPlugin } from '../../src/diagrams/donors/PSystemDonorsFactory.js';
import { skinparameterListPlugin } from '../../src/diagrams/donors/PSystemSkinparameterListFactory.js';
import { appleTwoPlugin } from '../../src/diagrams/eggs/PSystemAppleTwoFactory.js';
import { charliePlugin } from '../../src/diagrams/eggs/PSystemCharlieFactory.js';
import { colorsPlugin } from '../../src/diagrams/eggs/PSystemColorsFactory.js';
import { eggPlugin } from '../../src/diagrams/eggs/PSystemEggFactory.js';
import { ripPlugin } from '../../src/diagrams/eggs/PSystemRIPFactory.js';
import { listEmojiPlugin } from '../../src/diagrams/emoji/PSystemListEmojiFactory.js';
import { filesPlugin } from '../../src/diagrams/files/index.js';
import { hclPlugin } from '../../src/diagrams/hcl/index.js';
import { jsonPlugin } from '../../src/diagrams/json/index.js';
import { mindmapPlugin } from '../../src/diagrams/mindmap/index.js';
import { listOpenIconicPlugin } from '../../src/diagrams/openiconic/PSystemListOpenIconicFactory.js';
import { openIconicPlugin } from '../../src/diagrams/openiconic/PSystemOpenIconicFactory.js';
import { packetdiagPlugin } from '../../src/diagrams/packetdiag/index.js';
import { saltPlugin } from '../../src/diagrams/salt/index.js';
import { sequencePlugin } from '../../src/diagrams/sequence/index.js';
import { statePlugin } from '../../src/diagrams/state/index.js';
import { licensePlugin } from '../../src/diagrams/version/PSystemLicenseFactory.js';
import { versionPlugin } from '../../src/diagrams/version/PSystemVersionFactory.js';
import { ganttPlugin } from '../../src/diagrams/gantt/index.js';
import { wbsPlugin } from '../../src/diagrams/wbs/index.js';
import { yamlPlugin } from '../../src/diagrams/yaml/index.js';
import { buildEmojiAssetsStore } from '../helpers/emoji-assets-store.js';
import { buildSpriteAssetsStore } from '../helpers/sprite-assets-store.js';
import { buildUtilityAssetsStore } from '../helpers/utility-assets-store.js';
import { sourceOf } from '../helpers/utility-single-line.js';
import { CI_RENDER_BUDGET_MS } from '../helpers/ci-test-budgets.js';

// Renders past half of vitest's 5s default on the CI runner (worst observed:
// rubeku-92-vefi942 rendered three times, 2,723ms);
// derivation in tests/helpers/ci-test-budgets.ts.
vi.setConfig({ testTimeout: CI_RENDER_BUDGET_MS });

/**
 * `PSystemBuilder.java` line of each registered plugin's factory. Chronology's
 * line is upstream's commented-out `// factories.add(new
 * ChronologyDiagramFactory())` (java:184): the port registers an engine
 * upstream ships unregistered, and keeps it at that slot.
 */
const JAVA_LINE: ReadonlyMap<DiagramPlugin, number> = new Map<DiagramPlugin, number>([
  [colorsPlugin, 134],
  [sequencePlugin, 135],
  [classPlugin, 136],
  [descriptionPlugin, 138],
  [statePlugin, 139],
  [activityPlugin, 140], // ActivityDiagramFactory3 (src/index.ts order comment)
  [licensePlugin, 144],
  [versionPlugin, 145],
  [donorsPlugin, 146],
  [skinparameterListPlugin, 147],
  [listEmojiPlugin, 149],
  [openIconicPlugin, 150],
  [listOpenIconicPlugin, 151],
  [listArchimateSpritesPlugin, 152],
  [saltPlugin, 153],
  [dotPlugin, 154],
  [mindmapPlugin, 156],
  [wbsPlugin, 157],
  [chartPlugin, 158],
  [packetdiagPlugin, 159],
  [eggPlugin, 175],
  [appleTwoPlugin, 176],
  [ripPlugin, 177],
  [charliePlugin, 181],
  [ganttPlugin, 183],
  [chronologyPlugin, 184],
  [dedicationPlugin, 186],
  [jsonPlugin, 190],
  [filesPlugin, 192],
  [boardPlugin, 193],
  [yamlPlugin, 194],
  [hclPlugin, 195],
]);

const ASSET_STORE = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore(), buildUtilityAssetsStore());

const CORPUS = new URL('../../test-results/dot-cache/unknown/', import.meta.url);

/** The 15 in-scope `dot-cache/unknown` rows (fixtures.md, minus D13's two sudoku rows). */
const ROWS: readonly (readonly [slug: string, plugin: DiagramPlugin])[] = [
  ['fotete-48-viga126', listOpenIconicPlugin],
  ['bamudi-49-caxo996', openIconicPlugin],
  ['jigemu-90-titu666', colorsPlugin],
  ['kenari-17-dajo806', colorsPlugin],
  ['vedine-65-rafo449', listEmojiPlugin],
  ['tukimi-92-noxu802', listEmojiPlugin],
  ['rubeku-92-vefi942', listEmojiPlugin],
  ['zusibo-75-vate603', listEmojiPlugin],
  ['tomodo-34-bimi231', listEmojiPlugin],
  ['ludecu-61-laja912', listEmojiPlugin],
  ['xozane-18-becu956', listEmojiPlugin],
  ['xucoma-93-jeko861', listArchimateSpritesPlugin],
  ['govuca-53-mili511', versionPlugin],
  ['kicizi-84-lexu138', charliePlugin],
  ['kavama-92-noro949', dedicationPlugin],
];

/** D13: sudoku is dropped (MIT edition); these rows stay error pages. */
const SUDOKU_ROWS: readonly string[] = ['lazama-75-loli189', 'gazale-13-tadu312'];

/** The plugins `registerPlugins` registers, in call order. */
function registeredPlugins(): readonly DiagramPlugin[] {
  const out: DiagramPlugin[] = [];
  registerPlugins({ register: (plugin) => out.push(plugin) });
  return out;
}

const REGISTERED_PLUGINS = registeredPlugins();

function corpusSource(slug: string): string {
  return readFileSync(new URL(`${slug}/in.puml`, CORPUS), 'utf8');
}

function render(text: string): { readonly svg: string; readonly errorPage: boolean } {
  let errorPage = false;
  setErrorPageObserver(() => {
    errorPage = true;
  });
  try {
    const svg = renderSync(text, { measurer: new DeterministicMeasurer(), assetStore: ASSET_STORE });
    return { svg, errorPage };
  } finally {
    setErrorPageObserver(undefined);
  }
}

function resolved(text: string): ReturnType<typeof registry.resolve> {
  return registry.resolve(sourceOf(text), { assetStore: ASSET_STORE });
}

describe('registration order (PSystemBuilder.java:133-200)', () => {
  it('registers exactly the plugins with a cited Java line', () => {
    expect(new Set(REGISTERED_PLUGINS)).toEqual(new Set(JAVA_LINE.keys()));
    expect(REGISTERED_PLUGINS).toHaveLength(JAVA_LINE.size);
  });

  it('orders every registered pair as the Java does', () => {
    const lines = REGISTERED_PLUGINS.map((p) => JAVA_LINE.get(p));
    expect(lines).toEqual([...lines].sort((a, b) => (a ?? 0) - (b ?? 0)));
  });

  it('puts colors immediately before sequence (java:134-135)', () => {
    expect(REGISTERED_PLUGINS.indexOf(colorsPlugin)).toBe(0);
    expect(REGISTERED_PLUGINS.indexOf(sequencePlugin)).toBe(1);
  });
});

describe('the 15 in-scope corpus rows', () => {
  it.each(ROWS)('%s routes to its utility plugin', (slug, plugin) => {
    const resolution = resolved(corpusSource(slug));
    expect(resolution.refusal).toBeUndefined();
    expect(resolution.plugin).toBe(plugin);
  });

  it.each(ROWS)('%s renders a diagram, identically three times', (slug) => {
    const text = corpusSource(slug);
    const first = render(text);
    expect(first.errorPage).toBe(false);
    expect(first.svg).not.toContain('Error: unknown diagram type');
    expect(render(text).svg).toBe(first.svg);
    expect(render(text).svg).toBe(first.svg);
  });
});

describe('out-of-scope factories stay unregistered', () => {
  it.each(SUDOKU_ROWS)('%s (sudoku, D13) renders an error page', (slug) => {
    expect(resolved(corpusSource(slug)).refusal).toBeDefined();
    expect(render(corpusSource(slug)).errorPage).toBe(true);
  });

  it('listfonts (java:148) has no plugin', () => {
    expect(resolved('@startuml\nlistfonts\n@enduml').refusal).toBeDefined();
  });
});

/** One source per engine; each must still resolve to that engine. */
const ENGINE_SAMPLES: readonly (readonly [text: string, plugin: DiagramPlugin])[] = [
  ['@startuml\nAlice -> Bob : hello\n@enduml', sequencePlugin],
  ['@startuml\nclass Foo\nFoo --> Bar\n@enduml', classPlugin],
  ['@startuml\nnode N1\ncomponent C1\nN1 --> C1\n@enduml', descriptionPlugin],
  ['@startuml\n[*] --> S1\nstate S1\n@enduml', statePlugin],
  ['@startuml\nstart\n:step;\nstop\n@enduml', activityPlugin],
  ['@startsalt\n{\n[OK]\n}\n@endsalt', saltPlugin],
  ['@startdot\ndigraph G {\n  a -> b\n}\n@enddot', dotPlugin],
  ['@startmindmap\n* root\n** child\n@endmindmap', mindmapPlugin],
  ['@startwbs\n* root\n** child\n@endwbs', wbsPlugin],
  ['@startchart\nh-axis [Q1, Q2]\nv-axis 0 --> 100\nbar "R" [45, 62]\n@endchart', chartPlugin],
  ['@startpacketdiag\npacketdiag {\n  0-15: Source Port\n}\n@endpacketdiag', packetdiagPlugin],
  ['@startchronology\n[Event1] happens at 2023-11-24 10:11:50.750\n@endchronology', chronologyPlugin],
  ['@startjson\n{"a": 1}\n@endjson', jsonPlugin],
  ['@startfiles\n/src/\n/src/index.ts\n@endfiles', filesPlugin],
  ['@startboard\nWorld\n+Europe\n@endboard', boardPlugin],
  ['@startyaml\na: 1\n@endyaml', yamlPlugin],
  ['@starthcl\na = 1\n@endhcl', hclPlugin],
];

describe('every engine keeps its own sources', () => {
  it.each(ENGINE_SAMPLES)('%s', (text, plugin) => {
    const resolution = resolved(text);
    expect(resolution.refusal).toBeUndefined();
    expect(resolution.plugin).toBe(plugin);
  });
});
