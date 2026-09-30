/**
 * `FingerImpl.drawU` / `drawLine` / `getPhalanx` drawn SVG against the
 * 1.2026.8beta1 jar goldens (`test-results/dot-cache/mindmap/<slug>/in.svg`).
 *
 * The goldens are the whole diagram: `MindMapDiagram.getTextBlock` draws the
 * map inside the document margin `ClockwiseTopRightBottomLeft.same(10)`
 * (TitledDiagram.java:275-277), so the map is drawn here at
 * `UTranslate(10, 10)` and every node box (`<rect>`), boxless label
 * (`<text>`) and link (`<path>`) must equal the golden's, in order.
 * Chrome-free fixtures only (chrome is T5a's, D5).
 *
 * The transparent-link case is authored; its jar render
 * (`scripts/oracle-render.sh`) draws the two boxes and no `<path>`.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { Rankdir } from '../../../src/core/klimt/geom/Rankdir.js';
import type { MindMap } from '../../../src/diagrams/mindmap/MindMap.js';
import { parseMindMap, svgGraphic } from './helpers/mindmap-skin.js';

/** `TitledDiagram#getDefaultMargins`: `same(10)`. @see TitledDiagram.java:275-277 */
const DOCUMENT_MARGIN = 10;

const DRAWN = /<(?:rect|path)\b[^>]*\/>|<text\b[^>]*>[^<]*<\/text>/g;

function drawnElements(svg: string): string[] {
  return svg.match(DRAWN) ?? [];
}

function onlyMindMap(source: string, rankdir: Rankdir): MindMap {
  const mindmaps = parseMindMap(source, rankdir).getMindmaps();
  expect(mindmaps.length).toBe(1);
  return mindmaps[0]!;
}

function drawn(mindmap: MindMap): string[] {
  const ug = svgGraphic();
  mindmap.drawU(ug.apply(new UTranslate(DOCUMENT_MARGIN, DOCUMENT_MARGIN)));
  return drawnElements(ug.getSvgString());
}

function golden(slug: string): { source: string; elements: string[] } {
  const dir = `test-results/dot-cache/mindmap/${slug}`;
  return {
    source: readFileSync(`${dir}/in.puml`, 'utf8'),
    elements: drawnElements(readFileSync(`${dir}/in.svg`, 'utf8')),
  };
}

describe('FingerImpl drawing equals the jar golden (boxes, boxless labels, links)', () => {
  it.each([
    ['cilala-42-naso533', Rankdir.LEFT_TO_RIGHT, 'single branch, LR cubic 10/25'],
    ['nemame-08-kaje843', Rankdir.LEFT_TO_RIGHT, 'two-sided: reverse links mirrored, shared root drawn once'],
    ['gaferi-23-mute427', Rankdir.TOP_TO_BOTTOM, 'top to bottom, `top side`: TB cubic 3/10, direction -1'],
    ['sotali-22-vexo962', Rankdir.LEFT_TO_RIGHT, 'boxless leaves both sides: (3,0,1,1) / (0,3,1,1) margins'],
    ['muleji-62-gevo561', Rankdir.LEFT_TO_RIGHT, 'boxless root, `boxless { FontSize 30 }`'],
  ] as const)('%s (%s): %s', (slug, rankdir, _what) => {
    const { source, elements } = golden(slug);
    expect(elements.length).toBeGreaterThan(4);
    expect(drawn(onlyMindMap(source, rankdir))).toEqual(elements);
  });
});

describe('FingerImpl link colour (FingerImpl.java:132-134)', () => {
  const TRANSPARENT_ARROW = `@startmindmap
<style>
mindmapDiagram {
  arrow { LineColor transparent }
}
</style>
* r
** a
@endmindmap`;

  /** The jar render of `* r` / `** a` (`scripts/oracle-render.sh`), boxes only. */
  const JAR_BOXES = [
    '<rect x="10" y="20" width="24.638" height="34" fill="#F1F1F1" style="stroke:#181818;stroke-width:1.5;" rx="12.5" ry="12.5"/>',
    '<rect x="84.638" y="20" width="27.788" height="34" fill="#F1F1F1" style="stroke:#181818;stroke-width:1.5;" rx="12.5" ry="12.5"/>',
  ];

  it('a transparent arrow LineColor draws no link, only the two boxes (jar render)', () => {
    const elements = drawn(onlyMindMap(TRANSPARENT_ARROW, Rankdir.LEFT_TO_RIGHT));
    expect(elements.filter((e) => !e.startsWith('<text'))).toEqual(JAR_BOXES);
  });

  it('the same map with the default arrow draws the one LR link (jar render)', () => {
    const elements = drawn(onlyMindMap('@startmindmap\n* r\n** a\n@endmindmap', Rankdir.LEFT_TO_RIGHT));
    expect(elements.filter((e) => !e.startsWith('<text'))).toEqual([
      ...JAR_BOXES,
      '<path d="M34.638,37 L44.638,37 C59.638,37 59.638,37 74.638,37 L84.638,37" style="stroke:#181818;stroke-width:1;" fill="none"/>',
    ]);
  });
});
