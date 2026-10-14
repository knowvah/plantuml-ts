/**
 * `STDLIB_CATALOG` -- what the bare `stdlib` page prints
 * (`PSystemVersion.createStdLib`, `PSystemVersion.java:205-210` ->
 * `Stdlib.addInfoVersion`, `Stdlib.java:320-331`), derived from the port's
 * vendored stdlib manifest and checked against the jar oracle (ufp T0e, D5).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { svgTexts } from '../../../scripts/generate-utility-data.js';
import { STDLIB_CATALOG } from '../../../src/diagrams/version/stdlib-catalog.js';

const ORACLE = join(import.meta.dirname, '..', '..', '..', 'test-results/dot-cache/unknown/govuca-53-mili511/in.svg');

/** `<b>name` / `Version v` / `Delivered by s` triples, as `addInfoVersion` adds them. */
function oracleTriples(texts: readonly string[]): { name: string; version: string; source: string }[] {
  const result: { name: string; version: string; source: string }[] = [];
  for (let i = 0; i + 2 < texts.length; i++) {
    const [name, version, source] = [texts[i]!, texts[i + 1]!, texts[i + 2]!];
    if (version.startsWith('Version ') && source.startsWith('Delivered by '))
      result.push({ name, version: version.slice(8), source: source.slice(13) });
  }
  return result;
}

describe('STDLIB_CATALOG', () => {
  it('lists the 34 stdlib folders, first and last in TreeSet order', () => {
    expect(STDLIB_CATALOG).toHaveLength(34);
    expect(STDLIB_CATALOG[0]).toEqual({
      name: 'adaml',
      version: '0.1.2',
      source: 'https://github.com/rocher/AdaML',
    });
    expect(STDLIB_CATALOG.at(-1)?.name).toBe('tupadr3');
  });

  it('prints a linked folder with its target metadata (Stdlib.java:166-176)', () => {
    const awslib = STDLIB_CATALOG.find((entry) => entry.name === 'awslib');
    expect(awslib).toEqual({
      name: 'awslib',
      version: '14.0.0',
      source: 'https://github.com/awslabs/aws-icons-for-plantuml',
    });
  });

  it('matches the jar stdlib oracle entry for entry (govuca-53-mili511)', () => {
    expect(oracleTriples(svgTexts(readFileSync(ORACLE, 'utf8')))).toEqual(STDLIB_CATALOG);
  });
});
