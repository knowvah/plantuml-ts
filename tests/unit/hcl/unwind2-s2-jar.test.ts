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

/**
 * Fixtures whose residual is a DIFFERENT, still-open json-family defect,
 * outside unwind2-S2's write-set. `hcl-tab-indent`: the tokenizer now keeps
 * the tab in the key (`HclParser.java:235`) and the key text lands at the
 * jar's x=71, but `TextBlockJson.ts#cellMetrics` measures `keyWidth` with
 * the raw bounder, not tab-aware (`AtomText#getWidth`, as the value column
 * already is), so the key column is 56px narrower than the jar's.
 */
const OTHER_DEFECT: Readonly<Record<string, readonly string[]>> = {
  'hcl-tab-indent': [
    'svg/@viewBox[2]',
    'svg/@width',
    'svg/g[1]/rect[1]/@width',
    'svg/g[1]/text[2]/@x',
    'svg/g[1]/line[1]/@x1',
    'svg/g[1]/line[1]/@x2',
    'svg/g[1]/line[2]/@x2',
    'svg/g[1]/text[4]/@x',
    'svg/g[1]/line[3]/@x1',
    'svg/g[1]/line[3]/@x2',
    'svg/g[1]/rect[2]/@width',
  ],
};

/**
 * Multi-node fixtures: the json family lays out through `SmetanaForJson`
 * upstream and `@knowvah/dot-engine` here (CLAUDE.md, "One layout engine",
 * ruling 2026-08-09), so node placement and edge paths carry a settled
 * geometry delta. Only positional attributes may differ; text, structure
 * and sizes must match.
 */
const SMETANA_GEOMETRY: ReadonlySet<string> = new Set(['hcl-join-caption']);
const SMETANA_POSITIONAL = /^svg\/@width$|\/@(x|cx|x1|x2|viewBox\[2\]|d\[\d+\])$/u;

const CASES = readdirSync(DIR)
  .filter((f) => f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();

describe('unwind2-S2 — hcl style, top-level assignment, line joining', () => {
  it('has the fixture set', () => {
    expect(CASES.length).toBe(14);
  });

  it.each(CASES)('%s', (name) => {
    const source = readFileSync(join(DIR, `${name}.puml`), 'utf8');
    const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
    const ours = renderSync(source, { measurer: new DeterministicMeasurer() });
    const paths = compareSvg(ours, jar, 'deterministic').diffs.map((d) => d.path);
    if (SMETANA_GEOMETRY.has(name)) {
      expect(paths.filter((p) => !SMETANA_POSITIONAL.test(p))).toEqual([]);
      return;
    }
    expect(paths).toEqual(OTHER_DEFECT[name] ?? []);
  });
});
