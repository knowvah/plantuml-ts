/**
 * `PSystemColorsFactory` (eggs/PSystemColorsFactory.java): the pattern
 * `^colors?\s*(#?\w+)?\s*$` (java:48), `matcher.matches()` on the untrimmed
 * line (java:52), group 1 as the option (java:54), `null` otherwise (java:56).
 *
 * Jar probes (`scripts/oracle-render.sh`, 1.2026.8beta1, authored):
 * ` colors`, `COLORS`, `colors a-b` and `colors Red Blue` are
 * `Syntax Error? (Assumed diagram type: sequence)` pages; `color Red`,
 * `colorsRed` and `colors\t` render (fixtures under `fixtures/`).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DiagramRegistry } from '../../../src/core/dispatcher.js';
import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { PSystemColors } from '../../../src/diagrams/eggs/PSystemColors.js';
import { colorsPlugin, PSystemColorsFactory } from '../../../src/diagrams/eggs/PSystemColorsFactory.js';
import { sequencePlugin } from '../../../src/diagrams/sequence/index.js';

/** The pipeline's `UmlSource` for one block, seed lines included. */
function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

function single(line: string): string {
  return `@startuml\n${line}\n@enduml`;
}

/** What `executeLine` built from one raw line, as the option it captured. */
function optionOf(line: string): string | undefined | null {
  const sys = PSystemColorsFactory.executeLine(sourceOf(single('colors')), line, new PreprocessingArtifact());
  return sys === undefined ? null : sys.getPaletteCentralColor();
}

describe('PSystemColorsFactory.executeLine (java:50-57)', () => {
  it.each([
    ['colors', undefined],
    ['color', undefined],
    ['colors Chocolate', 'Chocolate'],
    ['color Red', 'Red'],
    ['colorsRed', 'Red'],
    ['colors Red  ', 'Red'],
    ['colors\t', undefined],
    ['colors #FF0000', 'FF0000'],
    ['colors a_b', 'a_b'],
  ])('accepts %j; the option is %j (# removed, java:88)', (line, option) => {
    expect(optionOf(line)).toBe(option);
  });

  it.each([[' colors'], ['COLORS'], ['colors a-b'], ['colors Red Blue'], ['colors ##FF0000'], ['colours']])(
    'refuses %j: the pattern is anchored, case-sensitive and \\w-only (java:48)',
    (line) => {
      expect(optionOf(line)).toBeNull();
    },
  );

  it('Java \\s is [ \\t\\n\\x0B\\f\\r]: a no-break space is not whitespace', () => {
    expect(optionOf('colors Red')).toBeNull();
  });

  it('builds a PSystemColors on the source it was given', () => {
    const source = sourceOf(single('colors'));
    const sys = PSystemColorsFactory.executeLine(source, 'colors', new PreprocessingArtifact());
    expect(sys).toBeInstanceOf(PSystemColors);
    expect(sys?.getSource()).toBe(source);
    expect(sys?.getDescription()).toBe('(Colors)');
  });
});

describe('colorsPlugin — the single-line gate and registration ahead of sequence (D2)', () => {
  it("is a 'sequence' candidate (PSystemSingleLineFactory.java:58-61)", () => {
    expect(colorsPlugin.type).toBe('sequence');
  });

  it('a 3-line `colors` source parses to the grid diagram', () => {
    const parsed = colorsPlugin.parse(sourceOf(single('colors Chocolate')));
    expect(parsed).toBeInstanceOf(PSystemColors);
    expect((parsed as PSystemColors).getPaletteCentralColor()).toBe('Chocolate');
  });

  it('a line the pattern refuses is "Syntax Error?" on that line', () => {
    const refusal = parseRefusalOf(colorsPlugin.parse(sourceOf(single(' colors'))));
    expect(refusal?.message).toBe('Syntax Error?');
    expect(refusal?.line).toBe(1);
  });

  it('a 4-line source refuses at -Infinity without reading a line', () => {
    const refusal = parseRefusalOf(colorsPlugin.parse(sourceOf('@startuml\ncolors\ncolors\n@enduml')));
    expect(refusal?.kind).toBe('incomplete');
    expect(refusal?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });

  it('registered before sequencePlugin it owns `colors`, and leaves a sequence diagram alone', () => {
    const registry = new DiagramRegistry();
    registry.register(colorsPlugin);
    registry.register(sequencePlugin);
    expect(registry.resolve(sourceOf(single('colors'))).plugin).toBe(colorsPlugin);
    expect(registry.resolve(sourceOf(single('Alice -> Bob'))).plugin).toBe(sequencePlugin);
  });

  it('render exports the diagram through UgDiagram#exportDiagram', () => {
    const parsed = colorsPlugin.parse(sourceOf(single('colors Chocolate')));
    const measurer = new DeterministicMeasurer();
    const geo = colorsPlugin.layoutSync(parsed as PSystemColors, defaultTheme, measurer);
    const out = colorsPlugin.render(geo, defaultTheme);
    expect(out).toEqual({ completeSvg: (parsed as PSystemColors).exportDiagram(0, measurer) });
  });
});
