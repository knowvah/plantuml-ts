/**
 * `PSystemCharlieFactory` (eggs/PSystemCharlieFactory.java) through its
 * plugin, against the corpus oracle `unknown/kicizi-84-lexu138` (`charlie`).
 * Jar probes (authored, `scripts/oracle-render.sh`): `JesuisCharlie` and
 * `charlıe` render the page; `\tcharlie` and `charlie  ` are syntax errors
 * (T0c journal).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { charliePlugin, PSystemCharlieFactory } from '../../../src/diagrams/eggs/PSystemCharlieFactory.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderWith, sourceOf } from './plugin-harness.js';

const ROW = join(import.meta.dirname, '..', '..', '..', 'test-results/dot-cache/unknown/kicizi-84-lexu138');
const PUML = readFileSync(join(ROW, 'in.puml'), 'utf8');
const ORACLE = readFileSync(join(ROW, 'in.svg'), 'utf8');

describe('PSystemCharlieFactory.executeLine (java:46-52)', () => {
  const factory = new PSystemCharlieFactory();
  const accepts = (line: string): boolean =>
    factory.executeLine(sourceOf('@startuml\nx\n@enduml'), line, new PreprocessingArtifact()) !== undefined;

  it.each(['charlie', 'CHARLIE', 'jesuischarlie', 'JesuisCharlie', 'charlıe'])('accepts %j', (line) => {
    expect(accepts(line)).toBe(true);
  });

  it.each(['\tcharlie', 'charlie  ', 'je suis charlie', 'charli'])('refuses %j', (line) => {
    expect(accepts(line)).toBe(false);
  });
});

describe('charliePlugin against the jar (kicizi-84-lexu138)', () => {
  it('renders with zero diffs', () => {
    expect(compareSvg(renderWith(charliePlugin, PUML), ORACLE, 'deterministic').diffs).toEqual([]);
  });

  it('renders identically three times', () => {
    const runs = [0, 1, 2].map(() => renderWith(charliePlugin, PUML));
    expect(new Set(runs).size).toBe(1);
  });

  it('refuses a line it does not accept with "Syntax Error?"', () => {
    expect(parseRefusalOf(charliePlugin.parse(sourceOf('@startuml\ncharlie  \n@enduml')))?.message).toBe(
      'Syntax Error?',
    );
  });

  it('refuses a 4-line source at the single-line gate', () => {
    const refusal = parseRefusalOf(charliePlugin.parse(sourceOf('@startuml\ncharlie\ncharlie\n@enduml')));
    expect(refusal?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });
});
