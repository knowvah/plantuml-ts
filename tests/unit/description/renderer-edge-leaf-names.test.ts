/**
 * renderer-edge-leaf-names.test.ts — `path/@id` and `<!--link X to Y-->` name
 * an edge by its entities' leaf names (`Link.java:106-120`,
 * `Quark.java:84-86`). Expected strings are the jar's for
 * component/fidati-41-kofe029 (`ccc03-ccc05`, `link ccc03 to ccc05`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(puml: string): string {
  return renderSync(puml, { measurer: new DeterministicMeasurer() });
}

describe('description edge leaf names in the SVG', () => {
  it('names a qualified edge by leaf under set separator', () => {
    const svg = render(
      '@startuml\nset separator .\ncomponent aaa.b.ccc03\ncomponent aaa.b.ccc05\naaa.b.ccc03 -- aaa.b.ccc05\n@enduml',
    );
    expect(svg).toContain('<!--link ccc03 to ccc05-->');
    expect(svg).toContain('id="ccc03-ccc05"');
    expect(svg).not.toContain('id="aaa');
  });

  it('is unchanged without set separator', () => {
    const svg = render('@startuml\n[a] --> [b]\n@enduml');
    expect(svg).toContain('<!--link a to b-->');
    expect(svg).toContain('id="a-to-b"');
  });
});
