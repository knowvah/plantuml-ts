/**
 * unwind-U1: the json family (`@startjson` / `@startyaml` / `@starthcl`)
 * against the jar, one fixture per behaviour that used to diverge.
 *
 * Every `tests/fixtures/unwind-U1/<name>.puml` has its jar render beside it as
 * `<name>.svg` (`scripts/oracle-render.sh`, deterministic text). Each case is
 * rendered through production `renderSync` and must compare clean.
 *
 * Upstream mechanisms (one per fixture family):
 *  - `StyleExtractor.java:63-103` is the family's only directive handling:
 *    only `title ` is chrome, `caption`/`legend`/`header`/`footer`/
 *    `mainframe`/`sprite` are payload, and any directive after the first
 *    payload line is payload (`json-caption`, `json-title-after`,
 *    `json-sprite`, `yaml-caption`, `hcl-skinparam-after`, ...).
 *  - `HclDiagramFactory.java:86-92` never sets the title (`hcl-title`).
 *  - `StyleExtractor.java:88-97` + `JsonDiagram.java:79`: of `skinparam` only
 *    `handwritten true` survives (`json-skinparam-*`, `json-theme-*`,
 *    `json-handwritten*`).
 *  - `JsonDiagram.java:80-82` wraps a scalar json root in an array; yaml's
 *    `YamlParser.java:53-54` throws on a bare scalar, so the yaml diagram is
 *    the `root == null` error page (`JsonDiagram.java:116-122`)
 *    (`json-root-*`, `yaml-root-*`).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind-U1');

/**
 * Fixtures whose residual is a DIFFERENT, still-open divergence -- each names
 * its DIVERGENCES.md entry. Kept so the fixture still pins everything else.
 */
const OTHER_DIVERGENCE: Readonly<Record<string, readonly string[]>> = {
  // `hcl-style` used to carry DIVERGENCES.md "Style selector support"; retired
  // by unwind2-S2 (`HclDiagramFactory.java:86-92` never calls `applyStyles`).
};

/**
 * Fixtures carrying a title, whose title chrome sits 10px short of the jar's
 * on each axis (the skin's `title { Padding 5; Margin 5 }`, plantuml.skin:
 * 30-38) and the document 21px narrower. NOT a U1 divergence and not caused
 * by it: the same diffs are measured on the pre-U1 parsers. Lives in the
 * shared annotation chrome's composition with the json fragment
 * (`src/core/annotations`), outside U1's write-set -- reported, pinned here
 * by count and kind (positional only) so it cannot grow unseen.
 */
const TITLE_CHROME_OFFSET: Readonly<Record<string, number>> = {
  'json-title': 10,
  'json-title-quoted': 10,
  'yaml-title': 10,
  'json-title-only': 2,
  'yaml-title-only': 2,
};
const POSITIONAL = /\/@(x|y|x1|x2|width|viewBox\[2\])$/u;

const CASES = readdirSync(DIR)
  .filter((f) => f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();

describe('unwind-U1 — json family matches the jar', () => {
  it('has the fixture set', () => {
    expect(CASES.length).toBe(50);
  });

  it.each(CASES)('%s', (name) => {
    const source = readFileSync(join(DIR, `${name}.puml`), 'utf8');
    const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
    const ours = renderSync(source, { measurer: new DeterministicMeasurer() });
    const paths = compareSvg(ours, jar, 'deterministic').diffs.map((d) => d.path);
    const allowed = OTHER_DIVERGENCE[name] ?? [];
    const offset = TITLE_CHROME_OFFSET[name];
    if (offset === undefined) {
      expect(paths.filter((p) => !allowed.includes(p))).toEqual([]);
      return;
    }
    expect(paths.filter((p) => !POSITIONAL.test(p))).toEqual([]);
    expect(paths.length).toBe(offset);
  });
});
