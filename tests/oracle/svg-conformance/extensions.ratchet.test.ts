/**
 * Extensions ratchet (lad T3a, user ruling 2026-10-23, decisions.md D10).
 *
 * json, yaml, hcl and files diagrams honour styling input the jar's
 * `StyleExtractor` path drops (`StyleExtractor.java:88-96`). Every example in
 * `tests/fixtures/extensions/` is `<engine>-<directive>.puml` with
 *  - its port-rendered `.svg` (extended mode, the library default), pinned
 *    byte for byte,
 *  - a `.plain.puml` twin without the directive.
 * The gate asserts, per example: the render equals its pin; it differs from
 * the twin's render (the directive does something); and the twin renders
 * identically in extended and jar-compatible mode (output for a source
 * without the input is byte-identical to the jar's).
 *
 * Renders use the `DeterministicMeasurer`, as the oracle does.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { withJarCompatibleStyleInput } from '../../../src/core/internal-render-options.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/extensions');
const PLAIN_SUFFIX = '.plain.puml';
const PUML_SUFFIX = '.puml';
const ENGINES = ['json', 'yaml', 'hcl', 'files'] as const;
/** Floor on pinned examples per engine -- the audit's `works` rows (extension-audit.md). */
const MIN_EXAMPLES: Readonly<Record<(typeof ENGINES)[number], number>> = { json: 7, yaml: 7, hcl: 10, files: 9 };

const OPTIONS = { measurer: new DeterministicMeasurer() };
const JAR_OPTIONS = withJarCompatibleStyleInput(OPTIONS);

const read = (name: string): string => readFileSync(join(DIR, name), 'utf8');
const files = readdirSync(DIR);
const examples = files
  .filter((f) => f.endsWith(PUML_SUFFIX) && !f.endsWith(PLAIN_SUFFIX))
  .map((f) => f.slice(0, -PUML_SUFFIX.length))
  .sort();

describe('extensions ratchet', () => {
  for (const engine of ENGINES) {
    it(`${engine}: at least ${MIN_EXAMPLES[engine]} pinned examples`, () => {
      const count = examples.filter((e) => e.startsWith(`${engine}-`)).length;
      expect(count).toBeGreaterThanOrEqual(MIN_EXAMPLES[engine]);
    });
  }

  describe.each(examples)('%s', (name) => {
    const source = read(`${name}${PUML_SUFFIX}`);
    const twin = read(`${name}${PLAIN_SUFFIX}`);
    const extended = renderSync(source, OPTIONS);

    it('renders byte-equal to its pinned svg', () => {
      expect(extended).toBe(read(`${name}.svg`));
    });

    it('differs from its directive-free twin', () => {
      expect(extended).not.toBe(renderSync(twin, OPTIONS));
    });

    it('differs from the jar-compatible render of the same source', () => {
      expect(extended).not.toBe(renderSync(source, JAR_OPTIONS));
    });

    it('twin renders identically in extended and jar-compatible mode', () => {
      expect(renderSync(twin, OPTIONS)).toBe(renderSync(twin, JAR_OPTIONS));
    });
  });
});
