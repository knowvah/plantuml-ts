/**
 * An edge to a `portout` reserves a label in the DOT, but graphviz emits no label position ("port P
 * unrecognized"), so `SvekEdge#getXY` returns null (`SvekEdge.java:742-746`) and the jar draws no label
 * (`SvekEdge.java:951-954`). Fixture: component/cuxelu-66-zopu195 (jar `in.svg`).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'description-edge-label');

describe('edge label without an engine position', () => {
  it('draws no label for an edge to a portout, like the jar', () => {
    const puml = readFileSync(join(DIR, 'portout-label.puml'), 'utf8');
    const jar = readFileSync(join(DIR, 'portout-label.svg'), 'utf8');
    const ours = renderSync(puml, { measurer: new DeterministicMeasurer() });
    expect(ours).not.toContain('label not shown');
    expect(jar).not.toContain('label not shown');
    expect(compareSvg(ours, jar, 'deterministic').diffs).toEqual([]);
  });
});
