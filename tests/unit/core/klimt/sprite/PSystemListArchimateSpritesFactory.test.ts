/**
 * `listsprite` (PSystemListArchimateSpritesFactory.java:50) against the jar's
 * render of `unknown/xucoma-93-jeko861` (1.2026.8beta1, 844x667).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../../../src/core/block-extractor.js';
import { parseRefusalOf } from '../../../../../src/core/parse-refusal.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../../../src/core/theme.js';
import {
  acceptsListArchimateSprites,
  listArchimateSpritesPlugin,
} from '../../../../../src/core/klimt/sprite/PSystemListArchimateSpritesFactory.js';
import type { PSystemListArchimateSprites } from '../../../../../src/core/klimt/sprite/PSystemListArchimateSprites.js';
import { listArchimateSpritesLines } from '../../../../../src/core/klimt/sprite/PSystemListArchimateSprites.js';
import { ARCHIMATE_SPRITE_NAMES } from '../../../../../src/core/klimt/sprite/archimate-sprite-names.js';
import { compareSvg } from '../../../../oracle/svg-conformance/compare.js';
import { surveyAssetStore } from '../../../../oracle/svg-conformance/render-fixture-utility.js';

const SLUG = 'xucoma-93-jeko861';
const CACHE_DIRS = [
  join(process.cwd(), 'test-results/dot-cache/unknown', SLUG),
  join('/Users/scottseely/git/knowvah/plantuml-ts/test-results/dot-cache/unknown', SLUG),
];
const CACHE = CACHE_DIRS.find((d) => existsSync(join(d, 'in.svg')));
const SEEDED = 3;

function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

function renderPage(text: string, withStore = true): string {
  const options = withStore ? { assetStore: surveyAssetStore() } : undefined;
  const parsed = listArchimateSpritesPlugin.parse(sourceOf(text), options);
  if (parseRefusalOf(parsed) !== undefined) throw new Error('refused');
  const measurer = new DeterministicMeasurer();
  const geo = listArchimateSpritesPlugin.layoutSync(parsed as PSystemListArchimateSprites, defaultTheme, measurer);
  const out = listArchimateSpritesPlugin.render(geo, defaultTheme);
  if (!('completeSvg' in out)) throw new Error('no completeSvg');
  return out.completeSvg;
}

describe('acceptsListArchimateSprites (java:50)', () => {
  it.each([
    ['listsprite', true],
    ['ListSprite', true],
    ['listsprites please', true],
    ['  listsprite', false],
    ['list', false],
  ])('%s -> %s', (line, expected) => {
    expect(acceptsListArchimateSprites(line)).toBe(expected);
  });
});

describe('listArchimateSpritesLines (java:56-75)', () => {
  const lines = listArchimateSpritesLines();
  it('starts with the four header lines, then the folder title and a blank', () => {
    expect(lines.slice(0, 6)).toEqual([
      '<b>List Current Sprites',
      '<i>Credit to',
      'http://www.archimatetool.com',
      ' ',
      '<u>archimate</u> :',
      ' ',
    ]);
  });
  it('has one row per sprite in the form <$archimate/name> name (fmt)', () => {
    expect(lines[6]).toBe('<$archimate/access> access (png)');
    expect(lines[8]).toBe('<$archimate/actor> actor (svg)');
    expect(lines).toHaveLength(6 + ARCHIMATE_SPRITE_NAMES.length);
  });
});

describe('plugin', () => {
  it('refuses a line it does not accept, and a 4-line source', () => {
    expect(parseRefusalOf(listArchimateSpritesPlugin.parse(sourceOf('@startuml\nlist\n@enduml')))?.message).toBe(
      'Syntax Error?',
    );
    const four = listArchimateSpritesPlugin.parse(sourceOf('@startuml\nlistsprite\nlistsprite\n@enduml'));
    expect(parseRefusalOf(four)?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });

  it('describes itself as (Sprites)', () => {
    const parsed = listArchimateSpritesPlugin.parse(sourceOf('@startuml\nlistsprite\n@enduml'));
    expect((parsed as PSystemListArchimateSprites).getDescription()).toBe('(Sprites)');
  });

  it('renders identically three times and without a store', () => {
    const first = renderPage('@startuml\nlistsprite\n@enduml');
    for (let i = 1; i < SEEDED; i++) expect(renderPage('@startuml\nlistsprite\n@enduml')).toBe(first);
    expect(renderPage('@startuml\nlistsprite\n@enduml', false)).toContain('<svg');
  });

  it.skipIf(CACHE === undefined)('matches the jar render of xucoma-93-jeko861 (844x667) with zero diffs', () => {
    const actual = renderPage('@startuml\nlistsprite\n@enduml');
    const golden = readFileSync(join(CACHE!, 'in.svg'), 'utf8');
    expect(compareSvg(actual, golden, 'deterministic').diffs).toEqual([]);
    expect(actual).toContain('width="844px"');
  });

  it.skipIf(CACHE === undefined)('embeds the 23 internal PNG sprites byte for byte as the jar does', () => {
    // compareSvg exempts image href bytes; SpriteImage's muted, bilinear-scaled PNG
    // (SpriteImage.java:90-91, PixelImage.java:97-113) is checked here directly.
    const hrefs = (svg: string): string[] =>
      [...svg.matchAll(/xlink:href="(data:image\/png;base64,[^"]*)"/g)].map((m) => m[1]!);
    const ours = hrefs(renderPage('@startuml\nlistsprite\n@enduml'));
    expect(ours).toHaveLength(23);
    expect(ours).toEqual(hrefs(readFileSync(join(CACHE!, 'in.svg'), 'utf8')));
  });
});
