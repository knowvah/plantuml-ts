/**
 * `MindMap` / `Branch` / `FingerImpl` geometry against the 1.2026.8beta1 jar.
 *
 * Per node: `LayoutProbe <puml>` (plans/mindmap-engine-port/tools/probe/)
 * prints `phalanxThickness`, `phalanxElongation`, `getX12` and the absolute
 * translation the node's `FingerImpl.drawU` receives (`originX`/`originY`,
 * the `MindMap.drawU` + `FingerImpl.drawU` translates applied to jar-computed
 * inputs), depth-first, regular branch then reverse — the order the port's
 * `FingerImpl.drawU` is called in. Rows below are `[phalanxThickness,
 * phalanxElongation, getX12, originX, originY]`, pasted from those runs.
 *
 * Whole map: `MindMap.calculateDimension` printed by a scratch probe over
 * the same jar and `SourceStringReader` entry point (`DimProbe`, reflection
 * on `MindMapDiagram.mindmaps`, `-DPLANTUML_DETERMINISTIC_TEXT=true`).
 */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rankdir } from '../../../src/core/klimt/geom/Rankdir.js';
import { FingerImpl } from '../../../src/diagrams/mindmap/FingerImpl.js';
import { parseMindMap, stringBounder, svgGraphic } from './helpers/mindmap-skin.js';

type ProbeRow = readonly [number, number, number, number, number];

interface LayoutCase {
  readonly rankdir: Rankdir;
  readonly dim: readonly [number, number];
  readonly nodes: readonly ProbeRow[];
}

const LR = Rankdir.LEFT_TO_RIGHT;
const TB = Rankdir.TOP_TO_BOTTOM;

const CASES: Readonly<Record<string, LayoutCase>> = {
  // single branch
  'cilala-42-naso533': {
    rankdir: LR,
    dim: [240.9375, 270.0],
    nodes: [
      [54.0, 54.212502, 50.0, 0.0, 135.0],
      [54.0, 43.362499, 50.0, 104.212502, 54.0],
      [54.0, 43.362499, 50.0, 197.575001, 27.0],
      [54.0, 43.362499, 50.0, 197.575001, 81.0],
      [54.0, 43.362499, 50.0, 104.212502, 108.0],
      [54.0, 29.3625, 50.0, 104.212502, 189.0],
      [54.0, 38.725, 50.0, 183.575002, 162.0],
      [54.0, 38.725, 50.0, 183.575002, 216.0],
      [54.0, 29.3625, 50.0, 104.212502, 243.0],
    ],
  },
  // two-sided (`--` reverse): the reverse root is not drawn (0 x 0)
  'nemame-08-kaje843': {
    rankdir: LR,
    dim: [510.2625045776367, 216.0],
    nodes: [
      [54.0, 64.450001, 50.0, 194.424999, 108.0],
      [54.0, 65.150002, 50.0, 308.875, 108.0],
      [54.0, 83.787498, 50.0, 424.025002, 27.0],
      [54.0, 72.150002, 50.0, 424.025002, 81.0],
      [54.0, 70.575001, 50.0, 424.025002, 135.0],
      [54.0, 86.237503, 50.0, 424.025002, 189.0],
      [54.0, 73.8125, 50.0, 308.875, 162.0],
      [0.0, 0.0, 50.0, 194.424999, 108.0],
      [54.0, 47.2125, 50.0, 144.424999, 94.5],
      [54.0, 47.2125, 50.0, 47.2125, 67.5],
      [54.0, 47.2125, 50.0, 47.2125, 121.5],
      [54.0, 47.2125, 50.0, 144.424999, 148.5],
    ],
  },
  // two-sided (`left side` / `right side`), chrome around it (not drawn here)
  'dezuza-88-gige110': {
    rankdir: LR,
    dim: [409.0250005722046, 135.0],
    nodes: [
      [54.0, 54.212502, 50.0, 186.724998, 67.5],
      [54.0, 29.3625, 50.0, 290.9375, 54.0],
      [54.0, 38.725, 50.0, 370.3, 27.0],
      [54.0, 38.725, 50.0, 370.3, 81.0],
      [54.0, 29.3625, 50.0, 290.9375, 108.0],
      [0.0, 0.0, 50.0, 186.724998, 67.5],
      [54.0, 43.362499, 50.0, 136.724998, 54.0],
      [54.0, 43.362499, 50.0, 43.362499, 27.0],
      [54.0, 43.362499, 50.0, 43.362499, 81.0],
      [54.0, 43.362499, 50.0, 136.724998, 108.0],
    ],
  },
  // top to bottom, `top side` (reverse only)
  'gaferi-23-mute427': {
    rankdir: TB,
    dim: [214.125, 152.0],
    nodes: [
      [214.125, 34.0, 25.0, 107.0625, 152.0],
      [63.362499, 34.0, 25.0, 91.221875, 93.0],
      [63.362499, 34.0, 25.0, 59.540626, 34.0],
      [63.362499, 34.0, 25.0, 122.903125, 34.0],
      [63.362499, 34.0, 25.0, 154.584374, 93.0],
    ],
  },
  // boxless leaves on both sides
  'sotali-22-vexo962': {
    rankdir: LR,
    dim: [711.6374816894531, 134.0],
    nodes: [
      [54.0, 79.0625, 50.0, 217.149994, 67.0],
      [54.0, 148.274994, 50.0, 346.212494, 40.0],
      [16.0, 115.875, 50.0, 544.487488, 8.0],
      [16.0, 167.149994, 50.0, 544.487488, 24.0],
      [16.0, 22.424999, 50.0, 544.487488, 40.0],
      [16.0, 23.2125, 50.0, 544.487488, 56.0],
      [16.0, 42.637501, 50.0, 544.487488, 72.0],
      [54.0, 161.487503, 50.0, 346.212494, 107.0],
      [0.0, 0.0, 50.0, 217.149994, 67.0],
      [16.0, 115.875, 50.0, 167.149994, 35.0],
      [16.0, 167.149994, 50.0, 167.149994, 51.0],
      [16.0, 22.424999, 50.0, 167.149994, 67.0],
      [16.0, 23.2125, 50.0, 167.149994, 83.0],
      [16.0, 42.637501, 50.0, 167.149994, 99.0],
    ],
  },
  // boxless root and inner node, `boxless { FontSize 30 }`
  'muleji-62-gevo561': {
    rankdir: LR,
    dim: [226.51249980926514, 86.0],
    nodes: [
      [32.0, 54.5625, 50.0, 0.0, 43.0],
      [54.0, 35.575, 50.0, 104.5625, 27.0],
      [32.0, 36.375, 50.0, 190.1375, 27.0],
      [32.0, 36.375, 50.0, 104.5625, 70.0],
    ],
  },
};

/**
 * Re-probed against the re-captured oracle jar (seam #4 v2: each space is
 * measured as U+0021, widths are float32): LayoutProbe with `MindMap
 * .calculateDimension` appended, run on test-results/dot-cache/mindmap/<slug>/
 * in.puml. The values are the jar's own, so they carry its float32 noise.
 */
/** LayoutProbe prints `%.6f`. */
const round6 = (n: number): number => Number(n.toFixed(6));

/**
 * dezuza's title/caption/header/footer are `TitledDiagram` chrome, parsed by
 * `CommonCommands` (D5, T5a) and outside the map; dropped here so the
 * port's mindmap-only parser accepts the rest verbatim.
 */
const CHROME_LINE = /^(caption|title|center footer)\b/;

function withoutChrome(text: string): string {
  const out: string[] = [];
  let inHeader = false;
  for (const line of text.split('\n')) {
    if (line === 'header') inHeader = true;
    if (!inHeader && !CHROME_LINE.test(line)) out.push(line);
    if (line === 'endheader') inHeader = false;
  }
  return out.join('\n');
}

function source(slug: string): string {
  return withoutChrome(readFileSync(`test-results/dot-cache/mindmap/${slug}/in.puml`, 'utf8'));
}

function mindmapOf(slug: string): ReturnType<ReturnType<typeof parseMindMap>['getMindmaps']>[number] {
  const mindmaps = parseMindMap(source(slug), CASES[slug]!.rankdir).getMindmaps();
  expect(mindmaps.length).toBe(1);
  return mindmaps[0]!;
}

/** Every `FingerImpl.drawU` call, in call order, as a probe row (the spy keeps the real drawU). */
function drawnRows(slug: string): ProbeRow[] {
  const spy = vi.spyOn(FingerImpl.prototype, 'drawU');
  mindmapOf(slug).drawU(svgGraphic());
  return spy.mock.calls.map(([ug], i): ProbeRow => {
    const finger = spy.mock.contexts[i] as FingerImpl;
    const sb = ug.getStringBounder();
    const t = ug.getTranslate();
    return [
      round6(finger.getPhalanxThickness(sb)),
      round6(finger.getPhalanxElongation(sb)),
      round6(finger.getX12()),
      round6(t.getDx()),
      round6(t.getDy()),
    ];
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FingerImpl node geometry and translations equal LayoutProbe', () => {
  it.each(Object.keys(CASES))('%s', (slug) => {
    expect(drawnRows(slug)).toEqual(CASES[slug]!.nodes);
  });
});

describe('MindMap.calculateDimension equals the jar (MindMap.java:77-92)', () => {
  it.each(Object.keys(CASES))('%s', (slug) => {
    const dim = mindmapOf(slug).calculateDimension(stringBounder());
    expect([dim.getWidth(), dim.getHeight()]).toEqual(CASES[slug]!.dim);
  });
});

describe('MindMap.computeFinger (MindMap.java:63-75)', () => {
  it('two-sided: both branches get a finger and the reverse root phalanx is not drawn', () => {
    const mindmap = mindmapOf('nemame-08-kaje843');
    const sb = stringBounder();
    mindmap.calculateDimension(sb);
    expect([mindmap.getRegular().hasFinger(), mindmap.getReverse().hasFinger()]).toEqual([true, true]);
    // reverse root: thickness 0 (skipped phalanx), nail 135 tall (LayoutProbe: reverse root tee t2=135.0)
    expect(mindmap.getReverse().getHalfThickness(sb)).toBe(67.5);
    // float32 noise (seam #4 v2): the jar probe prints 194.425000 at %.6f.
    expect(mindmap.getReverse().getX12(sb)).toBeCloseTo(194.425, 4);
  });

  it('one-sided (`top side` only): the regular branch gets no finger and measures 0', () => {
    const mindmap = mindmapOf('gaferi-23-mute427');
    const sb = stringBounder();
    mindmap.calculateDimension(sb);
    expect([mindmap.getRegular().hasFinger(), mindmap.getReverse().hasFinger()]).toEqual([false, true]);
    expect([mindmap.getRegular().getHalfThickness(sb), mindmap.getRegular().getFullElongation(sb)]).toEqual([0, 0]);
    expect(mindmap.getRegular().getX12(sb)).toBe(0);
  });

  it('a lone root is drawn by the regular branch (reverse has no children)', () => {
    const mindmap = parseMindMap('@startmindmap\n* r\n@endmindmap', LR).getMindmaps()[0]!;
    const sb = stringBounder();
    const dim = mindmap.calculateDimension(sb);
    expect([mindmap.getRegular().hasFinger(), mindmap.getReverse().hasFinger()]).toEqual([true, false]);
    expect([mindmap.getReverse().getX12(sb), mindmap.getReverse().getHalfThickness(sb)]).toEqual([0, 0]);
    expect(dim.getWidth()).toBe(mindmap.getRegular().getX12(sb));
    expect(dim.getHeight()).toBe(54);
  });
});
