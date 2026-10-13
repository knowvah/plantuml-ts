/**
 * `PSystemOpenIconicFactory` (openiconic/PSystemOpenIconicFactory.java:47-55)
 * through `singleLinePlugin`: the raw line, lower-cased, must start with
 * `openiconic `; the name is the lower-cased text after the raw line's first
 * space; factor 1.0.
 *
 * Jar probes (1.2026.8beta1, `scripts/oracle-render.sh`, authored):
 * - `OPENICONIC LightBulb` draws the lightbulb page (= `bamudi-49-caxo996`).
 * - ` openiconic lightbulb`, `openiconic\tlightbulb`, `openiconic`:
 *   `Syntax Error? (Assumed diagram type: sequence)` on line 2.
 * - `openiconic foo`, `openiconic  lightbulb`, `openiconic lightbulb `: the
 *   name (`foo`, ` lightbulb`, `lightbulb `) has no resource, `icon` is null
 *   and the jar draws its "Fatal crash error" NullPointerException page.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DiagramRegistry } from '../../../src/core/dispatcher.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseRefusalOf, refuse } from '../../../src/core/parse-refusal.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { classPlugin } from '../../../src/diagrams/class/index.js';
import { PSystemOpenIconic } from '../../../src/diagrams/openiconic/PSystemOpenIconic.js';
import { executeLineOpenIconic, openIconicPlugin } from '../../../src/diagrams/openiconic/PSystemOpenIconicFactory.js';
import { sequencePlugin } from '../../../src/diagrams/sequence/index.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const measurer = new DeterministicMeasurer();
const BAMUDI = 'test-results/dot-cache/unknown/bamudi-49-caxo996';
const HAND_BUILT: UmlSource = { lines: [], type: 'sequence' };

/** The pipeline's `UmlSource` for one block (`src/index.ts#umlSourceOfBlock`). */
function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

function line(raw: string): PSystemOpenIconic | undefined {
  return executeLineOpenIconic(HAND_BUILT, raw, new PreprocessingArtifact());
}

/** The jar's ordering: the UML factories, then this one (PSystemBuilder.java:144-152). */
function registry(): DiagramRegistry {
  const r = new DiagramRegistry();
  r.register(sequencePlugin);
  r.register(classPlugin);
  r.register(openIconicPlugin);
  return r;
}

function renderCorpusRow(): string {
  const resolution = registry().resolve(sourceOf(readFileSync(`${BAMUDI}/in.puml`, 'utf8')));
  expect(resolution.plugin).toBe(openIconicPlugin);
  const geo = openIconicPlugin.layoutSync(resolution.ast as PSystemOpenIconic, defaultTheme, measurer);
  const fragment = openIconicPlugin.render(geo, defaultTheme);
  if (!('completeSvg' in fragment)) throw new Error('expected a complete SVG');
  return fragment.completeSvg;
}

describe('executeLineOpenIconic — the accept pattern (java:49-54)', () => {
  it('accepts `openiconic <name>` and lower-cases the name', () => {
    const lower = line('openiconic lightbulb');
    const upper = line('OPENICONIC LightBulb');
    expect(lower).toBeInstanceOf(PSystemOpenIconic);
    expect(upper?.exportDiagram(0, measurer)).toBe(lower?.exportDiagram(0, measurer));
  });

  it.each([' openiconic lightbulb', 'openiconic\tlightbulb', 'openiconic', 'open iconic x', 'listopeniconic'])(
    'refuses %j (no `openiconic ` prefix on the raw line)',
    (raw) => {
      expect(line(raw)).toBeUndefined();
    },
  );

  it.each(['openiconic foo', 'openiconic  lightbulb', 'openiconic lightbulb '])(
    'throws for %j: the name has no resource (the jar crashes)',
    (raw) => {
      expect(() => line(raw)).toThrow('because "icon" is null');
    },
  );
});

describe('openIconicPlugin', () => {
  it('owns the bamudi-49 row after the UML factories and matches its oracle with zero diffs', () => {
    const svg = renderCorpusRow();
    expect(compareSvg(svg, readFileSync(`${BAMUDI}/in.svg`, 'utf8'), 'deterministic').diffs).toEqual([]);
  });

  it('renders the corpus row identically three times', () => {
    expect(new Set([renderCorpusRow(), renderCorpusRow(), renderCorpusRow()]).size).toBe(1);
  });

  it("is typed 'sequence' (the @startuml hack)", () => {
    expect(openIconicPlugin.type).toBe('sequence');
  });

  it('refuses a line it does not accept with "Syntax Error?" on that line', () => {
    const refusal = parseRefusalOf(openIconicPlugin.parse(sourceOf('@startuml\nopeniconic\n@enduml')));
    expect(refusal).toEqual(refuse('syntax', 1, 1, 'Syntax Error?'));
  });

  it('refuses a 4-line source with the gate refusal (score -Infinity)', () => {
    const refusal = parseRefusalOf(
      openIconicPlugin.parse(sourceOf('@startuml\nopeniconic lightbulb\nopeniconic x\n@enduml')),
    );
    expect(refusal?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });
});
