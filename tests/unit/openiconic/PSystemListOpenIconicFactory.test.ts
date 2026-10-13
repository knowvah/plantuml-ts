/**
 * `PSystemListOpenIconicFactory` (openiconic/PSystemListOpenIconicFactory.java:47-54)
 * through `singleLinePlugin`: the raw line, lower-cased, must start with
 * `listopeniconic`; anything may follow.
 *
 * Jar probes (1.2026.8beta1, `scripts/oracle-render.sh`, authored):
 * `listopeniconicfoo` and `LISTOPENICONIC` draw the `fotete-48-viga126` page
 * byte for byte (`<?plantuml-src?>` aside).
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
import { PSystemListOpenIconic } from '../../../src/diagrams/openiconic/PSystemListOpenIconic.js';
import {
  executeLineListOpenIconic,
  listOpenIconicPlugin,
} from '../../../src/diagrams/openiconic/PSystemListOpenIconicFactory.js';
import { sequencePlugin } from '../../../src/diagrams/sequence/index.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const measurer = new DeterministicMeasurer();
const FOTETE = 'test-results/dot-cache/unknown/fotete-48-viga126';
const HAND_BUILT: UmlSource = { lines: [], type: 'sequence' };

/** The pipeline's `UmlSource` for one block (`src/index.ts#umlSourceOfBlock`). */
function sourceOf(text: string): UmlSource {
  const block = buildBlockUmls(text)[0];
  if (block?.ok !== true) throw new Error(`no block in ${text}`);
  return { ...block.source, seedSourceLines: block.seedSource };
}

function line(raw: string): PSystemListOpenIconic | undefined {
  return executeLineListOpenIconic(HAND_BUILT, raw, new PreprocessingArtifact());
}

/** The jar's ordering: the UML factories, then this one (PSystemBuilder.java:144-152). */
function registry(): DiagramRegistry {
  const r = new DiagramRegistry();
  r.register(sequencePlugin);
  r.register(classPlugin);
  r.register(listOpenIconicPlugin);
  return r;
}

function renderCorpusRow(): string {
  const resolution = registry().resolve(sourceOf(readFileSync(`${FOTETE}/in.puml`, 'utf8')));
  expect(resolution.plugin).toBe(listOpenIconicPlugin);
  const geo = listOpenIconicPlugin.layoutSync(resolution.ast as PSystemListOpenIconic, defaultTheme, measurer);
  const fragment = listOpenIconicPlugin.render(geo, defaultTheme);
  if (!('completeSvg' in fragment)) throw new Error('expected a complete SVG');
  return fragment.completeSvg;
}

describe('executeLineListOpenIconic — the accept pattern (java:49-53)', () => {
  it.each(['listopeniconic', 'LISTOPENICONIC', 'listopeniconicfoo', 'ListOpenIconic now'])('accepts %j', (raw) => {
    expect(line(raw)).toBeInstanceOf(PSystemListOpenIconic);
  });

  it.each([' listopeniconic', 'list openiconic', 'openiconic x', 'listopeniconi'])('refuses %j', (raw) => {
    expect(line(raw)).toBeUndefined();
  });
});

describe('listOpenIconicPlugin', () => {
  it('owns the fotete-48 row after the UML factories and matches its oracle with zero diffs', () => {
    const svg = renderCorpusRow();
    expect(compareSvg(svg, readFileSync(`${FOTETE}/in.svg`, 'utf8'), 'deterministic').diffs).toEqual([]);
  });

  it('renders the corpus row identically three times', () => {
    expect(new Set([renderCorpusRow(), renderCorpusRow(), renderCorpusRow()]).size).toBe(1);
  });

  it("is typed 'sequence' (the @startuml hack)", () => {
    expect(listOpenIconicPlugin.type).toBe('sequence');
  });

  it('refuses a line it does not accept with "Syntax Error?" on that line', () => {
    const refusal = parseRefusalOf(listOpenIconicPlugin.parse(sourceOf('@startuml\nlist openiconic\n@enduml')));
    expect(refusal).toEqual(refuse('syntax', 1, 1, 'Syntax Error?'));
  });

  it('refuses a 4-line source with the gate refusal (score -Infinity)', () => {
    const refusal = parseRefusalOf(listOpenIconicPlugin.parse(sourceOf('@startuml\nlistopeniconic\nfoo\n@enduml')));
    expect(refusal?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });
});
