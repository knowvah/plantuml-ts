/**
 * codd-T7a (T6-A) -- a description edge label is drawn at the min corner of
 * the DOT label table plus the text block's margin, not at the engine's
 * label centre: `SvekEdge.java:808-815` (`getXY`), `:741-748` (`labelXY`),
 * `:951-954` (`labelText.drawU(... + labelShield)`), `:372-373`
 * (`marginLabel`). Expected strings are the jar's: component/buduco-56-jeke005
 * (cached `in.svg`) and `scripts/oracle-render.sh` probes of `[a] [b]` with
 * the label under test.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function textsOf(puml: string): string[] {
  const svg = renderSync(puml, { measurer: new DeterministicMeasurer() });
  return [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*font-size="13"[^>]*>([^<]*)/g)].map(
    (m) => `${m[3]}@${m[1]},${m[2]}`,
  );
}

describe('description edge label placement', () => {
  it('draws the label at the table corner + marginLabel (buduco)', () => {
    const puml =
      '@startuml\n!global $variable = "changed value"\n!$variable ?= "default value"\n[A] -> [B]: $variable\n@enduml';
    expect(textsOf(puml)).toEqual(['changed value@74.68,22.111']);
  });

  it('centres each line of a multi-line label inside one block', () => {
    expect(textsOf('@startuml\n[a]\n[b]\na --> b : first\\nsecond longer line\n@enduml')).toEqual([
      'first@74.221,92.111',
      'second longer line@31.89,105.111',
    ]);
  });

  it('draws a stereotype-only link label through the same block', () => {
    expect(textsOf('@startuml\n[a]\n[b]\na ..> b : <<includes>>\n@enduml')).toEqual(['«includes»@31.89,92.111']);
  });
});
