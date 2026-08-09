/**
 * `renderFixtureJson` dispatch contract (A5 / T1, AC4).
 *
 * The helper serves three suites, so the one thing that can silently go wrong
 * is the parse dispatch: if a yaml or hcl fixture were handed to `parseJson`,
 * it would not throw — `layoutJson` would produce its error geometry and
 * `renderJson` would draw PlantUML's "Your data does not sound like JSON data"
 * box. That failure renders a perfectly valid SVG, so it would sail past any
 * "produces output" check and quietly poison a whole type's conformance
 * numbers.
 *
 * These assertions exist to make that impossible rather than unlikely.
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureJson } from './render-fixture-json.js';

const NOT_JSON = 'does not sound like JSON';

function render(markup: string): string {
  return renderFixtureJson(markup, new DeterministicMeasurer());
}

describe('renderFixtureJson — parse dispatch (AC4)', () => {
  it('routes @startjson through parseJson', () => {
    const svg = render('@startjson\n{"a": 1}\n@endjson');
    expect(svg).not.toContain(NOT_JSON);
    expect(svg).toContain('a');
  });

  it('routes @startyaml through parseYaml, NOT parseJson', () => {
    // Plain YAML is not valid JSON. Reaching parseJson would yield the error
    // diagram instead of a rendered tree.
    const svg = render('@startyaml\nfruit: Apple\nsize: Large\n@endyaml');
    expect(svg).not.toContain(NOT_JSON);
    expect(svg).toContain('fruit');
    expect(svg).toContain('Apple');
  });

  it('routes @starthcl through parseHcl, NOT parseJson', () => {
    const svg = render('@starthcl\nresource "aws_instance" "web" {\n  ami = "abc"\n}\n@endhcl');
    expect(svg).not.toContain(NOT_JSON);
    expect(svg).toContain('ami');
  });

  it('all three reach the SHARED document shell, differing only by data-diagram-type', () => {
    // yaml and hcl have no renderer of their own; if either grew one, these
    // would diverge and this assertion is the tripwire.
    //
    // The ONE attribute that legitimately differs is `data-diagram-type`: the
    // jar tags each type with its own (`JSON`/`YAML`/`HCL`), which is exactly
    // what `jsonShell` carries (A5/T4). Normalising it away is the point of
    // this test — everything else about the shell must be identical.
    const shellOf = (svg: string): string =>
      svg.slice(0, svg.indexOf('>') + 1).replace(/data-diagram-type="[A-Z]+"/, 'data-diagram-type="_"');

    const j = shellOf(render('@startjson\n{"a": 1}\n@endjson'));
    const y = shellOf(render('@startyaml\na: 1\n@endyaml'));
    const h = shellOf(render('@starthcl\na = 1\n@endhcl'));
    expect(y).toBe(j);
    expect(h).toBe(j);
  });

  it('each type is tagged with the jar\'s own data-diagram-type', () => {
    expect(render('@startjson\n{"a": 1}\n@endjson')).toContain('data-diagram-type="JSON"');
    expect(render('@startyaml\na: 1\n@endyaml')).toContain('data-diagram-type="YAML"');
    expect(render('@starthcl\na = 1\n@endhcl')).toContain('data-diagram-type="HCL"');
  });

  it('throws a named error when the markup holds no diagram block', () => {
    expect(() => render('not a diagram')).toThrow(/no diagram block found/);
  });
});
