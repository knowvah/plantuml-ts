/**
 * `PSystemAppleTwoFactory` (eggs/PSystemAppleTwoFactory.java) through its
 * plugin, against the authored jar oracles `tests/fixtures/utility/apple*.svg`
 * (`scripts/oracle-render.sh`, 1.2026.8beta1).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseRefusalOf } from '../../../src/core/parse-refusal.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { appleTwoPlugin, PSystemAppleTwoFactory } from '../../../src/diagrams/eggs/PSystemAppleTwoFactory.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderWith, sourceOf } from './plugin-harness.js';

const FIXTURES = join(import.meta.dirname, '..', '..', 'fixtures', 'utility');

function fixture(name: string): { puml: string; svg: string } {
  return {
    puml: readFileSync(join(FIXTURES, `${name}.puml`), 'utf8'),
    svg: readFileSync(join(FIXTURES, `${name}.svg`), 'utf8'),
  };
}

describe('PSystemAppleTwoFactory.executeLine (java:50-62)', () => {
  const factory = new PSystemAppleTwoFactory();
  const accepts = (line: string): boolean =>
    factory.executeLine(sourceOf('@startuml\nx\n@enduml'), line, new PreprocessingArtifact()) !== undefined;

  it.each(['apple //e', 'apple ][', 'apple II', 'Steve Jobs', 'Steve Wozniak', 'APPLE //E', 'steve WOZNIAK'])(
    'accepts %j',
    (line) => {
      expect(accepts(line)).toBe(true);
    },
  );

  it.each(['apple ][ ', ' apple II', 'apple 2', 'Steve', 'jean canouet'])('refuses %j', (line) => {
    expect(accepts(line)).toBe(false);
  });
});

describe('appleTwoPlugin against the jar', () => {
  it.each(['apple', 'apple-steve-wozniak'])('renders %s with zero diffs', (name) => {
    const { puml, svg } = fixture(name);
    expect(compareSvg(renderWith(appleTwoPlugin, puml), svg, 'deterministic').diffs).toEqual([]);
  });

  it('renders identically three times', () => {
    const { puml } = fixture('apple');
    const runs = [0, 1, 2].map(() => renderWith(appleTwoPlugin, puml));
    expect(new Set(runs).size).toBe(1);
  });

  it('refuses a trailing-space line with "Syntax Error?" (jar: error page)', () => {
    expect(parseRefusalOf(appleTwoPlugin.parse(sourceOf('@startuml\napple ][ \n@enduml')))?.message).toBe(
      'Syntax Error?',
    );
  });

  it('refuses a 4-line source at the single-line gate', () => {
    const refusal = parseRefusalOf(appleTwoPlugin.parse(sourceOf('@startuml\napple II\napple II\n@enduml')));
    expect(refusal?.commandScore).toBe(Number.NEGATIVE_INFINITY);
  });
});
