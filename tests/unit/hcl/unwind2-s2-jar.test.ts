/**
 * unwind2-S2: three HCL behaviours mirrored from the jar, plus the json/yaml
 * siblings that prove the style path is HCL-only.
 *
 * Every `tests/fixtures/unwind2-S2/<name>.puml` has its jar render beside it
 * as `<name>.svg` (`scripts/oracle-render.sh`, deterministic text). Each case
 * is rendered through production `renderSync` and must compare clean.
 *
 * Upstream mechanisms:
 *  - `HclDiagramFactory.java:86-92` has `styleExtractor.applyStyles(...)`
 *    commented out, so `<style>`, `skin` and a `!theme`'s inlined `<style>`
 *    never reach an HCL diagram (`hcl-style-*`, `hcl-skin`,
 *    `hcl-theme-amiga`). `JsonDiagramFactory.java:99-101` and
 *    `YamlDiagramFactory.java:96-98` DO call it (`json-style-node`,
 *    `yaml-style-node`).
 *  - `HclParser.java:77-89`: a top-level term sequence must end in `{`; an
 *    `=` throws, the factory swallows it (`HclDiagramFactory.java:81-83`)
 *    and the null data is the error page (`hcl-top-assign-*`).
 *  - `HclSource.java:48-53` appends each line's characters with NO separator
 *    (`hcl-join-*`).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S2');

const CASES = readdirSync(DIR)
  .filter((f) => f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();

describe('unwind2-S2 — hcl style, top-level assignment, line joining', () => {
  it('has the fixture set', () => {
    expect(CASES.length).toBe(6);
  });

  it.each(CASES)('%s', (name) => {
    const source = readFileSync(join(DIR, `${name}.puml`), 'utf8');
    const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
    const ours = renderSync(source, { measurer: new DeterministicMeasurer() });
    expect(compareSvg(ours, jar, 'deterministic').diffs.map((d) => d.path)).toEqual([]);
  });
});
