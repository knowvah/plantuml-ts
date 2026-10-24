/**
 * lad T1e (decisions.md Amendment 1, D9/D10): the json family and files keep
 * two style-input modes behind the internal `jarCompatibleStyleInput` option.
 *
 *  - jar-compatible: each plugin's `styleInput` cut, i.e. the styling input the
 *    jar's `StyleExtractor` path drops (`StyleExtractor.java:88-96`;
 *    `JsonDiagramFactory.java:75`, `YamlDiagramFactory.java:75`,
 *    `HclDiagramFactory.java:69,86-92`, `FilesDiagramFactory.java:56`).
 *  - extended (library default): the full input is honoured.
 *
 * The fitness test proves the extension changes nothing for a source with no
 * styling directive: extended === jar-compatible, byte for byte.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { isJarCompatibleStyleInput, type InternalRenderOptions } from '../../../src/core/internal-render-options.js';
import { filesStyleInput } from '../../../src/diagrams/files/files-style-input.js';
import type { PreprocessorResult } from '../../../src/core/preprocessor.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const FIXTURE_DIRS = ['unwind-U1', 'unwind2-S2', 'lengthadjust'].map((d) => join(ROOT, 'tests/fixtures', d));
const CACHE_ENGINES = ['json', 'yaml', 'hcl', 'files'];
const CACHE_ROOT = join(ROOT, 'test-results/dot-cache');
const STYLING_DIRECTIVE = /^\s*(skinparam\b|<style\b|skin\s|!theme\b)/imu;
const FAMILY_BLOCK = /^\s*@start(json|yaml|hcl|files)\b/imu;

const JAR_MODE: InternalRenderOptions = { measurer: new DeterministicMeasurer(), jarCompatibleStyleInput: true };

function directiveFreeSources(): readonly (readonly [string, string])[] {
  const files: string[] = [];
  for (const dir of FIXTURE_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith('.puml')) files.push(join(dir, f));
  }
  for (const engine of CACHE_ENGINES) {
    const dir = join(CACHE_ROOT, engine);
    if (!existsSync(dir)) continue;
    for (const id of readdirSync(dir)) {
      const file = join(dir, id, 'in.puml');
      if (existsSync(file)) files.push(file);
    }
  }
  return files
    .map((f) => [f.slice(ROOT.length + 1), readFileSync(f, 'utf8')] as const)
    .filter(([, text]) => FAMILY_BLOCK.test(text) && !STYLING_DIRECTIVE.test(text));
}

describe('isJarCompatibleStyleInput', () => {
  it('is false for undefined and for options without the flag', () => {
    expect(isJarCompatibleStyleInput(undefined)).toBe(false);
    expect(isJarCompatibleStyleInput({})).toBe(false);
  });

  it('is true only for an explicit true', () => {
    expect(isJarCompatibleStyleInput(JAR_MODE)).toBe(true);
    expect(isJarCompatibleStyleInput({ jarCompatibleStyleInput: false } as InternalRenderOptions)).toBe(false);
  });
});

describe('style-input modes', () => {
  const FILES_SKINPARAM = '@startfiles\nskinparam backgroundColor red\n/a.txt\n@endfiles\n';
  const JSON_BG = '@startjson\nskinparam backgroundColor red\n{ "a": 1 }\n@endjson\n';
  const HCL_STYLE = '@starthcl\n<style>\ndocument { BackGroundColor red }\n</style>\nresource "a" "b" {\n}\n@endhcl\n';
  const measurer = { measurer: new DeterministicMeasurer() };

  it('json: jar mode drops the skinparam, extended mode paints it', () => {
    expect(renderSync(JSON_BG, JAR_MODE)).not.toContain('background:#FF0000;');
    expect(renderSync(JSON_BG, measurer)).toContain('background:#FF0000;');
  });

  it('hcl: jar mode drops <style> (HclDiagramFactory.java:86-92), extended mode applies it', () => {
    expect(renderSync(HCL_STYLE, JAR_MODE)).not.toContain('background:#FF0000;');
    expect(renderSync(HCL_STYLE, measurer)).toContain('background:#FF0000;');
  });

  it('files: jar mode renders without the skinparam (FilesDiagram.java:62-80 never reads it)', () => {
    const jar = renderSync(FILES_SKINPARAM, JAR_MODE);
    expect(jar).not.toContain('background:#FF0000;');
    expect(jar).toBe(renderSync('@startfiles\n/a.txt\n@endfiles\n', JAR_MODE));
  });

  it('filesStyleInput empties the skinparam map and its declaration order but keeps styles', () => {
    const preprocessed = {
      skinparam: new Map([['handwritten', 'true']]),
      styles: ['s'],
      declarationOrder: { skinparam: new Map([['handwritten', 0]]), styles: [1] },
    } as unknown as PreprocessorResult;
    const source = { type: 'files', lines: [], seedSourceLines: [] } as unknown as UmlSource;
    const cut = filesStyleInput(preprocessed, source);
    expect(cut.skinparam.size).toBe(0);
    expect(cut.declarationOrder?.skinparam.size).toBe(0);
    expect(cut.styles).toEqual(['s']);
  });
});

describe('extension fitness (D10)', () => {
  const SOURCES = directiveFreeSources();

  it('covers a non-trivial source set', () => {
    expect(SOURCES.length).toBeGreaterThan(50);
  });

  it.each(SOURCES.map(([name, text]) => ({ name, text })))(
    'extended === jar-compatible without styling directives: $name',
    ({ text }) => {
      const extended = renderSync(text, { measurer: new DeterministicMeasurer() });
      expect(extended).toBe(renderSync(text, JAR_MODE));
    },
  );
});
