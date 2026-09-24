/**
 * cdd-B7FU-R4 — seeded `<defs>` ids: the id upstream's single per-diagram
 * `SvgGraphics` mints for every gradient, text-background filter and drop
 * shadow (`SvgGraphics.java:160-162,285-287,393,431,766,1076`).
 *
 * The end-to-end expectations are the jar's own ids, read straight off the
 * cached oracles in `test-results/dot-cache/class/<slug>/in.svg` — the same
 * source `tests/unit/annotations-blocks.test.ts` and friends already read.
 *
 * The seam is live as of round 5: `src/index.ts#prepareBlock` computes
 * `seedOfUmlSource(umlSource)` into the page context and
 * `assembleOnePage` hands it to `assembleSvg`, so `renderSync` already
 * emits jar-shaped ids. `seededRenderOf` therefore renders and does NOT
 * re-seed; one dedicated case below pins that re-seeding is a no-op.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { applySeededDefIds, seededDefIdRenames, getSeed } from '../../../src/core/svg-defs.js';
import { seedOf } from '../../../src/core/klimt/drawing/svg/svg-seed.js';
import { seedOfUmlSource } from '../../../src/core/assemble-svg.js';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';

const CACHE = 'test-results/dot-cache/class';

function seededRenderOf(slug: string): { seeded: string; jar: string } {
  const source = readFileSync(`${CACHE}/${slug}/in.puml`, 'utf8');
  return {
    seeded: renderSync(source, { measurer: new WidthTableMeasurer() }),
    jar: readFileSync(`${CACHE}/${slug}/in.svg`, 'utf8'),
  };
}

function defIdsOf(svg: string): string[] {
  return [...new Set([...svg.matchAll(/id="([gbf][0-9a-z]+)"/g)].map((m) => m[1] as string))];
}

const BACK_COLOR_FILTER = '<filter id="OLD" x="0" y="0" width="1" height="1"><feFlood flood-color="#FF0000"/></filter>';
const SHADOW_FILTER = '<filter id="OLD" x="-1" y="-1"><feGaussianBlur result="blurOut"/></filter>';
// `createSvgGradient` sets `id` AFTER the vector (java:370-395), so the id is
// deliberately NOT the first attribute here.
const GRADIENT = '<linearGradient x1="0%" y1="50%" id="OLD"><stop offset="0%"/></linearGradient>';

describe('seededDefIdRenames — the numbering rule, SvgGraphics.java:393,766,1076', () => {
  test('gradients and back-colour filters count SEPARATELY (two upstream maps)', () => {
    const defs =
      BACK_COLOR_FILTER.replace('OLD', 'x1') +
      GRADIENT.replace('OLD', 'x2') +
      BACK_COLOR_FILTER.replace('OLD', 'x3').replace('#FF0000', '#00FF00') +
      GRADIENT.replace('OLD', 'x4').replace('50%', '60%');
    expect([...seededDefIdRenames(defs, 'UID')]).toEqual([
      ['x2', 'gUID0'],
      ['x4', 'gUID1'],
      ['x1', 'bUID0'],
      ['x3', 'bUID1'],
    ]);
  });

  test('the drop shadow carries NO index — one per document', () => {
    expect([...seededDefIdRenames(SHADOW_FILTER.replace('OLD', 'classShadow'), 'UID')]).toEqual([
      ['classShadow', 'fUID'],
    ]);
  });

  test('a def upstream does not seed (an arrow marker) is left alone', () => {
    expect(seededDefIdRenames('<marker id="arrow"><path d="M0,0"/></marker>', 'UID').size).toBe(0);
  });

  test('getSeed is Math.abs in base 36 (java:285-287)', () => {
    expect(getSeed(-255n)).toBe('73');
    expect(getSeed(0n)).toBe('0');
  });
});

describe('applySeededDefIds — references follow the def', () => {
  test('rewrites the def id and every url(#…) that points at it', () => {
    const doc = `<svg><defs>${GRADIENT.replace('OLD', 'ghash')}</defs><rect fill="url(#ghash)"/></svg>`;
    const out = applySeededDefIds(doc, 42n);
    const uid = getSeed(42n);
    expect(out).toContain(`id="g${uid}0"`);
    expect(out).toContain(`fill="url(#g${uid}0)"`);
    expect(out).not.toContain('ghash');
  });

  test('leaves a document with no <defs> untouched', () => {
    expect(applySeededDefIds('<svg><rect/></svg>', 42n)).toBe('<svg><rect/></svg>');
  });

  test('is idempotent — re-running on already-seeded ids is a no-op', () => {
    const doc = `<svg><defs>${GRADIENT.replace('OLD', 'ghash')}</defs><rect fill="url(#ghash)"/></svg>`;
    const once = applySeededDefIds(doc, 42n);
    expect(applySeededDefIds(once, 42n)).toBe(once);
  });

  test('an id it does not own (an arrow marker reference) is not rewritten', () => {
    const doc =
      `<svg><defs><marker id="arrow"/>${GRADIENT.replace('OLD', 'ghash')}</defs>` +
      '<line marker-end="url(#arrow)"/><rect fill="url(#ghash)"/></svg>';
    expect(applySeededDefIds(doc, 42n)).toContain('marker-end="url(#arrow)"');
  });

  // CodeQL js/polynomial-redos (alert 17): diagram text lands in the document
  // verbatim, so an unterminated `url(#(` run is library input. With
  // `url\(#([^)]*)\)` every start rescanned to the end -- 40000 repetitions
  // took ~6 s; bounding the scan at the next `(` makes it linear.
  test('an unterminated url(#( run in text is linear, and left untouched', () => {
    const text = `<text>${'url(#('.repeat(40000)}</text>`;
    const doc = `<svg><defs>${GRADIENT.replace('OLD', 'ghash')}</defs><rect fill="url(#ghash)"/>${text}</svg>`;
    const started = performance.now();
    const out = applySeededDefIds(doc, 42n);
    expect(performance.now() - started).toBeLessThan(1000);
    expect(out.endsWith(`${text}</svg>`)).toBe(true);
    expect(out).toContain(`fill="url(#g${getSeed(42n)}0)"`);
  });
});

describe('the ids match the jar, per corpus fixture', () => {
  test.each([
    ['galili-87-zivo129', ['b1aoebuletv6c20']],
    ['manube-50-xora983', ['bz23kcsdiojxy0', 'bz23kcsdiojxy1', 'bz23kcsdiojxy2']],
    ['ziripa-77-zizo842', ['b12uh59b48gukq0']],
    ['beruje-75-jimu270', ['b144o7cb4selba0']],
    ['dizuse-83-dabi909', ['g83f0s4o88dzd0']],
    ['taceve-49-mezi408', [0, 1, 2, 3, 4].map((i) => `g1e9uepaia7nhk${String(i)}`)],
    ['givofi-11-xumu978', ['gl0fu3um6bzhc0', 'gl0fu3um6bzhc1']],
    ['mexaka-52-gati860', ['g1fj4fgt50vlg50', 'g1fj4fgt50vlg51']],
    ['rakopi-21-sufa571', ['frlajzsx1vi3']],
  ])('%s', (slug, expected) => {
    const { seeded, jar } = seededRenderOf(slug);
    expect(defIdsOf(seeded)).toEqual(expected);
    // Belt and braces: the same list the oracle itself carries.
    expect(defIdsOf(jar)).toEqual(expected);
  });

  test('popesa-39-sobe866 is the ONE known miss — the seed input, not the rule', () => {
    // `UmlSource#seed()` hashes the PREPROCESSED lines (`UmlSource.java:
    // 222-234` over `source`, loaded from `PSystemBuilder`'s `data`,
    // java:232-240), and popesa carries `!define MyBlue #6192d1`. Hashing the
    // raw lines therefore yields a different uid. Pinned so the day the port
    // keeps a preprocessed-source artifact, this test says so.
    //
    // ONE id on each side since round 5: popesa mixes a `paint.ts` gradient
    // (the class box) with a klimt-driver one (`database dummy2` through the
    // USymbol path) for the SAME gradient, and
    // `collapseDuplicateGradientDefs` now collapses them the way upstream's
    // `gradients` map does (`SvgGraphics.java:367-371`).
    const { seeded, jar } = seededRenderOf('popesa-39-sobe866');
    expect(defIdsOf(jar)).toEqual(['g30vatrr2be6m0']);
    expect(defIdsOf(seeded)).toEqual(['g1dfzmcprqomz60']);
  });

  test('re-seeding a rendered document is a no-op (the pass is idempotent)', () => {
    const { seeded } = seededRenderOf('taceve-49-mezi408');
    const source = readFileSync(`${CACHE}/taceve-49-mezi408/in.puml`, 'utf8');
    expect(applySeededDefIds(seeded, seedOf(source))).toBe(seeded);
  });
});

/**
 * The seed INPUT half of the seam — `assemble-svg.ts#seedOfUmlSource`, the
 * function the deferred `src/index.ts` hunk calls. Same fixtures, driven
 * through the real block pipeline rather than a raw file read, so the hunk
 * is exercised end to end minus its one line.
 */
describe('seedOfUmlSource — the deferred src/index.ts hunk, minus the line', () => {
  test.each([
    ['galili-87-zivo129', 'b1aoebuletv6c20'],
    ['taceve-49-mezi408', 'g1e9uepaia7nhk0'],
    ['rakopi-21-sufa571', 'frlajzsx1vi3'],
  ])('%s gets the jar id through the block pipeline', (slug, firstId) => {
    const source = readFileSync(`${CACHE}/${slug}/in.puml`, 'utf8');
    const block = buildBlockUmls(source, {})[0];
    if (block === undefined || !block.ok) throw new Error(`no ok block for ${slug}`);
    const umlSource = {
      lines: block.source.lines,
      rawSourceLines: block.rawSource.map((line) => line.getString()),
    };
    const plain = renderSync(source, { measurer: new WidthTableMeasurer() });
    expect(defIdsOf(applySeededDefIds(plain, seedOfUmlSource(umlSource)))[0]).toBe(firstId);
  });

  test('falls back to a wrapped interior when the block carries no raw lines', () => {
    const wrapped = seedOfUmlSource({ lines: ['class foo'] });
    expect(wrapped).toBe(seedOf(['@startuml', 'class foo', '@enduml'].join('\n')));
  });
});
