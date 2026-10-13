/**
 * `PSystemColors` (eggs/PSystemColors.java): the 154-name grid
 * (`drawFull`, java:263-283) and, with a colour argument, the 19-hexagon
 * palette of the names closest to it (`drawPalette`, java:128-157).
 *
 * Jar values: the corpus rows `jigemu-90-titu666` (`colors`) and
 * `kenari-17-dajo806` (`colors Chocolate`), and authored probes rendered with
 * `scripts/oracle-render.sh` (1.2026.8beta1) under `fixtures/`:
 * - `colors foo`: not a colour, so `getColorOrWhite` is `HColors.WHITE`, an
 *   `HColorSimple` (java:99) — the palette around White, with `foo` itself
 *   appended (java:237-238) and drawn second (distance 0, stable sort).
 * - `colors abcdefghijklmnopqrstuvwxyz`: as `foo`, but the name is wider than
 *   a hexagon and has no capital to break at, so `findShortest` returns
 *   `null` (java:189-204) and `Display.getWithNewlines(pragma, null)` is
 *   `Display.NULL` (Display.java:263-264): 19 hexagons, the name undrawn.
 * - `colors transparent`: `HColors.none()` is an `HColorSimple` — the palette
 *   around (0,0,0), Black first, `transparent` appended.
 * - `colors FF0000` / `colors #ABC`: hex arguments, appended by their text.
 * - `colors DarkGray`: removed with every `Gray` twin of a `Grey` name
 *   (java:226-236), so not `containsCaseInsensitive` and appended.
 * - `color Red`, `colorsRed`, `colors\t`: the factory's other accepted shapes.
 * - `colors automatic` draws the FULL grid (1401x589): `HColorAutomagic` is not
 *   an `HColorSimple` (HColorSet.java:85-86). `HColorAutomagic` is unported
 *   (`HColorSet.ts` throws), the named residual of this task.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { stringBounderFor } from '../../../src/core/UgDiagram.js';
import { PSystemColors } from '../../../src/diagrams/eggs/PSystemColors.js';
import { colorsPlugin } from '../../../src/diagrams/eggs/PSystemColorsFactory.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const REPO = join(import.meta.dirname, '..', '..', '..');
const CACHE = join(REPO, 'test-results', 'dot-cache', 'unknown');
const FIXTURES = join(import.meta.dirname, 'fixtures');

/** `sqrt(3) / 2 * 2 * size`, size 60 (java:81, :167-169). */
const HEXA_WIDTH = (Math.sqrt(3) / 2) * 2 * 60;

function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

function diagramOf(option: string | undefined): PSystemColors {
  return new PSystemColors(sourceOf('@startuml\ncolors\n@enduml'), option, new PreprocessingArtifact());
}

/** The pipeline path: the plugin's parse, then `exportDiagram`. */
function render(puml: string): string {
  const parsed = colorsPlugin.parse(sourceOf(puml));
  if (!(parsed instanceof PSystemColors)) throw new Error(`refused: ${puml}`);
  return parsed.exportDiagram(0, new DeterministicMeasurer());
}

function diffsOf(puml: string, jarSvg: string): number {
  return compareSvg(render(puml), jarSvg, 'deterministic').diffs.length;
}

/** The text of every `<text>` element, in document order. */
function texts(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1] ?? '');
}

function count(svg: string, tag: string): number {
  return svg.split(`<${tag} `).length - 1;
}

describe('PSystemColors#calculateDimension (java:97-119)', () => {
  const sb = stringBounderFor(new DeterministicMeasurer());

  it('full grid: 8 columns of 21 rows of 175x28 (154 names, java:104-109)', () => {
    const dim = diagramOf(undefined).calculateDimension(sb);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([8 * 175, 21 * 28]);
  });

  it('palette: translate (2.5w, 180 + 60) plus 2.5w + 61 by 180 + 61 (java:111-119)', () => {
    const dim = diagramOf('Chocolate').calculateDimension(sb);
    expect(dim.getWidth()).toBeCloseTo(5 * HEXA_WIDTH + 61, 9);
    expect(dim.getHeight()).toBe(240 + 180 + 61);
  });

  it('an unknown name is White, an HColorSimple: still the palette (java:99)', () => {
    expect(diagramOf('foo').calculateDimension(sb).getHeight()).toBe(481);
  });
});

describe('PSystemColors — corpus rows (compareSvg vs the jar)', () => {
  it.each([['jigemu-90-titu666'], ['kenari-17-dajo806']])('%s has zero diffs', (slug) => {
    const puml = readFileSync(join(CACHE, slug, 'in.puml'), 'utf8');
    const jar = readFileSync(join(CACHE, slug, 'in.svg'), 'utf8');
    expect(diffsOf(puml, jar)).toBe(0);
  });

  it('jigemu-90: 154 rectangles and 154 labels, AliceBlue first after APPLICATION (TreeSet order)', () => {
    const svg = render(readFileSync(join(CACHE, 'jigemu-90-titu666', 'in.puml'), 'utf8'));
    expect(count(svg, 'rect')).toBe(154);
    expect(texts(svg).slice(0, 3)).toEqual(['APPLICATION', 'AliceBlue', 'AntiqueWhite']);
  });

  it('kenari-17: 19 hexagons, Chocolate at the centre then its ring by distance', () => {
    const svg = render(readFileSync(join(CACHE, 'kenari-17-dajo806', 'in.puml'), 'utf8'));
    expect(count(svg, 'polygon')).toBe(19);
    expect(texts(svg).slice(0, 4)).toEqual(['Chocolate', 'IndianRed', 'PaleVioletRed', 'Tomato']);
  });

  it.each([['jigemu-90-titu666'], ['kenari-17-dajo806']])('%s renders identically three times', (slug) => {
    const puml = readFileSync(join(CACHE, slug, 'in.puml'), 'utf8');
    const first = render(puml);
    expect(render(puml)).toBe(first);
    expect(render(puml)).toBe(first);
  });
});

describe('PSystemColors — authored jar probes (fixtures/)', () => {
  it.each([['foo'], ['longlower'], ['transparent'], ['hexff'], ['hex3'], ['gray'], ['singular'], ['nospace'], ['tab']])(
    'colors-%s has zero diffs',
    (name) => {
      const puml = readFileSync(join(FIXTURES, `colors-${name}.puml`), 'utf8');
      const jar = readFileSync(join(FIXTURES, `colors-${name}.jar.svg`), 'utf8');
      expect(diffsOf(puml, jar)).toBe(0);
    },
  );

  it('colors foo: White at the centre, foo itself second (appended, distance 0, stable sort)', () => {
    const svg = render('@startuml\ncolors foo\n@enduml');
    expect(texts(svg).slice(0, 3)).toEqual(['White', 'foo', 'Ivory']);
  });

  it('a too-wide name is broken before its shortest capital (findShortest, java:189-204)', () => {
    const svg = render('@startuml\ncolors foo\n@enduml');
    expect(texts(svg)).toContain('LightGolden');
    expect(texts(svg)).toContain('RodYellow');
  });

  it('a too-wide name with no capital to break at draws no text (Display.NULL)', () => {
    const svg = render('@startuml\ncolors abcdefghijklmnopqrstuvwxyz\n@enduml');
    expect(count(svg, 'polygon')).toBe(19);
    expect(texts(svg)).not.toContain('abcdefghijklmnopqrstuvwxyz');
    expect(texts(svg).slice(0, 2)).toEqual(['White', 'Ivory']);
  });

  it('colors transparent: Black first, transparent appended after it', () => {
    expect(texts(render('@startuml\ncolors transparent\n@enduml')).slice(0, 2)).toEqual(['Black', 'transparent']);
  });

  it('colors #FF0000: the # is removed from the appended name (java:88)', () => {
    expect(texts(render('@startuml\ncolors #FF0000\n@enduml')).slice(0, 2)).toEqual(['Red', 'FF0000']);
  });
});

describe('PSystemColors — colors automatic (named residual: HColorAutomagic unported)', () => {
  it('the jar draws the full grid; the port throws from HColorSet#parseColor', () => {
    const diagram = diagramOf('automatic');
    expect(() => diagram.exportDiagram(0, new DeterministicMeasurer())).toThrow(/unported: HColorAutomagic/);
  });
});
