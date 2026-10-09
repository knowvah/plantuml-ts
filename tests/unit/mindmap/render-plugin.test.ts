/**
 * The registered mindmap plugin end to end: `renderSync` over a
 * `@startmindmap` source against the jar's cached golden
 * (`test-results/dot-cache/mindmap/<slug>/in.svg`), through the same
 * `compareSvg(…, 'deterministic')` the survey and `render-diff.mts` use.
 *
 * - export path (`TextBlockExporter#exportTo`): `MindMapDiagram#getTextBlock`
 *   (`width + 10`, MindMapDiagram.java:81-103), margins `same(10)`
 *   (TitledDiagram.java:274-277), `scale` (TextBlockExporter.java:205-209);
 * - chrome path: title/caption/legend/header/footer composed around the RAW
 *   text block, margin applied after (`core/TextBlockExporter.ts
 *   #finalizeTitledDiagramFragment`);
 * - `[#color]` through `getIHtmlColorSet().getColor()` (CommandMindMapPlus.java:99);
 * - a `{{mindmap … }}` embedded in a class title (`EmbeddedDiagram`).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { createMindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagramFactory.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const measurer = new DeterministicMeasurer();

function fixture(tree: string, slug: string): { markup: string; golden: string } {
  const dir = `test-results/dot-cache/${tree}/${slug}`;
  return { markup: readFileSync(`${dir}/in.puml`, 'utf8'), golden: readFileSync(`${dir}/in.svg`, 'utf8') };
}

/** Diff paths between our render and the jar golden (empty = conformant). */
function diffPaths(tree: string, slug: string): string[] {
  const { markup, golden } = fixture(tree, slug);
  return compareSvg(renderSync(markup, { measurer }), golden, 'deterministic').diffs.map((d) => d.path);
}

function rootAttr(svg: string, name: string): string | undefined {
  const root = /^<svg[^>]*>/.exec(svg)?.[0] ?? '';
  return new RegExp(`\\s${name}="([^"]*)"`).exec(root)?.[1];
}

describe('mindmap plugin — renderSync equals the jar golden', () => {
  it('basic mindmap: canvas 271x291 = text block (250.938 + 10) + margins 20 + ensureVisible 1', () => {
    const svg = renderSync(fixture('mindmap', 'cilala-42-naso533').markup, { measurer });
    expect(rootAttr(svg, 'data-diagram-type')).toBe('MINDMAP');
    expect(rootAttr(svg, 'viewBox')).toBe('0 0 271 291');
    expect(diffPaths('mindmap', 'cilala-42-naso533')).toEqual([]);
  });

  it.each([
    ['dezuza-88-gige110', 'title + caption + header + center footer, both sides'],
    ['guvive-85-zipe702', 'legend'],
    ['poxujo-42-cito478', 'legend'],
    ['docige-13-jaka644', 'chrome + <style>'],
  ])('chrome %s (%s)', (slug) => {
    expect(diffPaths('mindmap', slug)).toEqual([]);
  });

  it('dezuza: the title sits inside the top margin (y 41.889 under the header), not at the canvas edge', () => {
    const svg = renderSync(fixture('mindmap', 'dezuza-88-gige110').markup, { measurer });
    const title = /<g class="title"[^>]*><text x="([\d.]+)" y="([\d.]+)"/.exec(svg);
    expect(Number(title?.[1])).toBeCloseTo(181.3, 3);
    expect(Number(title?.[2])).toBeCloseTo(41.889, 3);
    expect(rootAttr(svg, 'viewBox')).toBe('0 0 440 230');
  });

  it.each(['cufaxi-14-cani934', 'dojilo-60-cufe274', 'gafupu-88-xamo144', 'pumeze-93-licu653'])(
    'scale without chrome %s',
    (slug) => {
      expect(diffPaths('mindmap', slug)).toEqual([]);
    },
  );

  it.each(['tarato-41-cada051', 'viveno-69-zopi622', 'vagapi-25-benu796', 'zenigi-93-gofu307'])(
    '[#color] %s resolves to an HColorSimple the box can paint',
    (slug) => {
      expect(diffPaths('mindmap', slug)).toEqual([]);
    },
  );

  it('`top to bottom direction` reaches the drawing through the skin param rankdir (gaferi)', () => {
    expect(diffPaths('mindmap', 'gaferi-23-mute427')).toEqual([]);
  });
});

describe('mindmap plugin — embedded {{mindmap}} in a class title (semutu)', () => {
  it('draws the nested mindmap as the jar-sized 213x75 image at (10,10)', () => {
    const svg = renderSync(fixture('unknown', 'semutu-45-zeno907').markup, { measurer });
    expect(/<g class="title"[^>]*><image width="213" height="75" x="10" y="10"/.test(svg)).toBe(true);
  });
});

describe('mindmap factory — command errors', () => {
  it('a `<style>` block the parser rejects is the command error (CommandStyleMultilinesCSS.java:92-93)', () => {
    const result = createMindMapDiagram({
      lines: ['* root'],
      type: 'mindmap',
      styleSource: { skinparam: new Map(), styles: ['node { { }'] },
    });
    expect(result).toMatchObject({ refused: true, kind: 'execution', line: 0 });
    expect('refused' in result && result.message.startsWith('Error in style definition: ')).toBe(true);
  });

  it('an unknown [#color] is `badColor` at its line (SingleLineCommand2.java:176-177)', () => {
    const result = createMindMapDiagram({ lines: ['* root', '**[#nosuchcolour] child'], type: 'mindmap' });
    expect(result).toMatchObject({ refused: true, kind: 'execution', line: 1, message: 'No such color' });
  });
});
