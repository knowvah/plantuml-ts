/**
 * dur-T5 -- a group's `[[url{tooltip}]]` draws as `<a>` around the cluster decoration, against the jar.
 * `svek/Cluster.java:339-341` opens `ug.startUrl(url)` right after `ug.startGroup(uGroup)` and the `finally`
 * (`:376-379`) runs `ug.closeUrl()` before `ug.closeGroup()`, so the anchor sits INSIDE `<g class="cluster">`
 * and wraps only the decoration (border + title). Fixtures: `tests/fixtures/description-url/<shape>-url.{puml,svg}`,
 * svg rendered by `scripts/oracle-render.sh`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'description-url');
const measurer = new DeterministicMeasurer();
const SHAPES = ['package-url', 'rectangle-url', 'frame-url', 'nested-url'];

function fixture(name: string): { puml: string; jar: string } {
  return {
    puml: readFileSync(join(FIXTURES, `${name}.puml`), 'utf8'),
    jar: readFileSync(join(FIXTURES, `${name}.svg`), 'utf8'),
  };
}

const anchors = (svg: string): number => svg.match(/<a /g)?.length ?? 0;

describe('group url against the jar', () => {
  it.each(SHAPES)('%s renders as the jar does', (name) => {
    const { puml, jar } = fixture(name);
    const ours = renderSync(puml, { measurer });
    const { pass, diffs } = compareSvg(ours, jar, 'deterministic');
    expect(diffs).toEqual([]);
    expect(pass).toBe(true);
    expect(anchors(ours)).toBe(anchors(jar));
  });

  it('opens the anchor inside the cluster <g> and closes it before </g>', () => {
    const ours = renderSync(fixture('package-url').puml, { measurer });
    expect(ours).toMatch(/<g class="cluster"[^>]*><a target="_top" href="http:\/\/example.com\/p"[^>]*title="pkg tip"/);
    expect(ours).toMatch(/<\/a><\/g><!--entity A-->/);
  });

  it('nested groups each carry their own anchor', () => {
    const ours = renderSync(fixture('nested-url').puml, { measurer });
    expect(ours).toContain('href="http://example.com/outer"');
    expect(ours).toContain('href="http://example.com/inner"');
    expect(anchors(ours)).toBe(2);
  });

  it('a group without a url draws no anchor and is unchanged', () => {
    const ours = renderSync('@startuml\npackage "P" {\n  [A]\n}\n@enduml\n', { measurer });
    expect(anchors(ours)).toBe(0);
    expect(ours).toMatch(/<g class="cluster"[^>]*><path /);
  });
});
