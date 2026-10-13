/**
 * `PSystemRIPFactory` (eggs/PSystemRIPFactory.java) through its
 * plugin, against the authored jar oracles `tests/fixtures/utility/rip.svg`
 * (`scripts/oracle-render.sh`, 1.2026.8beta1).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { ripPlugin, PSystemRIPFactory } from '../../../src/diagrams/eggs/PSystemRIPFactory.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderWith, sourceOf } from './plugin-harness.js';

const FIXTURES = join(import.meta.dirname, '..', '..', 'fixtures', 'utility');

function fixture(name: string): { puml: string; svg: string } {
  return {
    puml: readFileSync(join(FIXTURES, `${name}.puml`), 'utf8'),
    svg: readFileSync(join(FIXTURES, `${name}.svg`), 'utf8'),
  };
}

describe('PSystemRIPFactory.executeLine (java:50-61)', () => {
  const factory = new PSystemRIPFactory();
  const accepts = (line: string): boolean =>
    factory.executeLine(sourceOf('@startuml\nx\n@enduml'), line, new PreprocessingArtifact()) !== undefined;

  it.each(['jean canouet', 'JEAN CANOUET', 'Jean Canouet'])('accepts %j', (line) => {
    expect(accepts(line)).toBe(true);
  });

  it.each(['jean canouet ', 'jean  canouet', 'canouet', 'apple II'])('refuses %j', (line) => {
    expect(accepts(line)).toBe(false);
  });
});

describe('ripPlugin against the jar', () => {
  it.each(['rip'])('renders %s with zero diffs', (name) => {
    const { puml, svg } = fixture(name);
    expect(compareSvg(renderWith(ripPlugin, puml), svg, 'deterministic').diffs).toEqual([]);
  });

  it('renders identically three times', () => {
    const { puml } = fixture('rip');
    const runs = [0, 1, 2].map(() => renderWith(ripPlugin, puml));
    expect(new Set(runs).size).toBe(1);
  });

  it('refuses a trailing-space line with "Syntax Error?" (equalsIgnoreCase on the raw line)', () => {
    expect(parseRefusalOf(ripPlugin.parse(sourceOf('@startuml\njean canouet \n@enduml')))?.message).toBe(
      'Syntax Error?',
    );
  });

  it('refuses a 4-line source at the single-line gate', () => {
    const refusal = parseRefusalOf(ripPlugin.parse(sourceOf('@startuml\njean canouet\njean canouet\n@enduml')));
    expect(refusal?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });
});
