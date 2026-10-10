/**
 * cdd7 T2b (dezobu-62-vuzu421, corrected mechanism, journal row 14): a
 * class-engine USymbol leaf whose `<<$sprite>>` resolves draws the SPRITE
 * in place of its stereotype block -- `EntityImageDescription.java:192-194`
 * (`if (stereotype != null && stereotype.getSprite(getSkinParam()) != null)
 * stereo = stereotype.getSprite(getSkinParam());`) via `Stereotype
 * #getSprite` (`Stereotype.java:108-117`, `Sprite.asTextBlock`: `<path>`s,
 * not an `<image>`). The sprite ref must survive parse -> Classifier ->
 * sizer -> draw; before this task the class engine dropped it at parse.
 *
 * Expected values: oracle probes (`scripts/oracle-render.sh`,
 * 1.2026.8beta1) of the exact sources below.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const measurer = new DeterministicMeasurer();
const SPRITE = 'archimate/business-actor';
/** The shared `extractNodeStereotype` ref -- `Stereotype#getHtmlColor` as
 *  the description engine's own producer returns it for a bare `<<$name>>`. */
const EXPECTED_REF = { name: SPRITE, scale: 1, color: { r: 0, g: 0, b: 0, a: 255 } };

const SINGLE = ['@startuml', 'allowmixing', 'class A', `rectangle X <<$${SPRITE}>>`, '@enduml'].join('\n');
const MULTI = [
  '@startuml',
  'allowmixing',
  'class A',
  `rectangle Y <<$${SPRITE}>> [`,
  'foo',
  'bar',
  ']',
  '@enduml',
].join('\n');

function render(source: string): string {
  return renderSync(source, { measurer, assetStore: buildSpriteAssetsStore() });
}

function leafOf(svg: string, id: string): string {
  const start = svg.indexOf(`<!--entity ${id}-->`);
  return svg.slice(start, svg.indexOf('</g>', start));
}

function stereotypeSpriteOf(source: string, id: string): unknown {
  const block: UmlSource = { lines: source.split('\n').slice(1, -1), type: 'class' };
  return parseClass(block).classifiers.find((c) => c.id === id)?.stereotypeSprite;
}

describe('class USymbol leaf stereotype sprite (EntityImageDescription.java:192-194)', () => {
  it('parses the single-line <<$sprite>> into Classifier.stereotypeSprite', () => {
    expect(stereotypeSpriteOf(SINGLE, 'X')).toEqual(EXPECTED_REF);
  });

  it('parses the multi-line (TYPE1) <<$sprite>> into Classifier.stereotypeSprite', () => {
    expect(stereotypeSpriteOf(MULTI, 'Y')).toEqual(EXPECTED_REF);
  });

  it('draws the sprite paths in the jar-sized box for a single-line leaf', () => {
    const svg = render(SINGLE);
    const leaf = leafOf(svg, 'X');
    expect(leaf).toContain('<rect x="83.68" y="7" width="40" height="54"');
    expect(leaf).toContain('<path d="M103.576,17.95 ');
    expect(leaf).toContain('<text x="98.999" y="47.889" fill="#000" font-size="14">X</text>');
    expect(svg).toContain('width="137px" height="75px"');
  });

  // b2 residual round (journal row 29): a SINGLE-classifier diagram takes
  // `class-geo-builders.ts#buildDegenerateClassifierLeaf`, which copied only
  // `stereotypeLabels` and so lost the sprite (dezobu stayed 1/9 after the
  // chain landed). It now spreads `stereotypeLabelFields` like the general
  // path. Values: oracle probe of this exact source.
  it('keeps the sprite on the degenerate single-leaf path', () => {
    const svg = render(['@startuml', `rectangle X <<$${SPRITE}>>`, '@enduml'].join('\n'));
    expect(svg).toContain('width="60px" height="74px"');
    expect(svg).toContain('<rect x="7" y="7" width="40" height="54"');
    expect(svg).toContain('<path d="M26.896,17.95 ');
    expect(svg).toContain('<text x="22.319" y="47.889" fill="#000" font-size="14">X</text>');
  });

  it('draws the sprite, not the «label» text, for a multi-line leaf', () => {
    const leaf = leafOf(render(MULTI), 'Y');
    // width 40.212: re-read from the new jar (tests/fixtures/isw-T2-cls/
    // sprite-multi.svg; the measurer float32-rounds 40.2125 -> 40.212).
    expect(leaf).toContain('<rect x="83.57" y="7" width="40.212" height="68"');
    expect(leaf).toContain('<path d="M103.572,17.95 ');
    expect(leaf).not.toContain('«business-actor»');
    expect(leaf).toContain('<text x="93.57" y="47.889" fill="#000" font-size="14" textLength="19.425">foo</text>');
  });
});
