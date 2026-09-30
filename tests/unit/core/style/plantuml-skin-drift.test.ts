/**
 * `src/core/style/skins/plantuml-skin.ts` must not drift from its generator
 * (`scripts/extract-jar-skin.ts`) or from the oracle jar's `skin/*.skin`
 * entries. Two checks, mirroring `themes-source.test.ts`:
 *
 *   - always: the committed file is exactly what the generator prints for
 *     the data it holds (a hand edit, or a Prettier reformat, fails here) --
 *     no jar needed, since the committed text IS the data;
 *   - with the oracle jar present: that data is the jar's, verbatim, byte
 *     for byte -- skipped with `it.runIf` and a test name that says why
 *     when the jar is absent (e.g. a CI checkout without `oracle/dist/`).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  ORACLE_JAR_PATH,
  PLANTUML_SKIN_PATH,
  SKIN_EXPORTS,
  readSkinSources,
  renderSkinModule,
} from '../../../../scripts/extract-jar-skin.js';
import { PLANTUML_SKIN, SKIN_JAR_VERSION, STRICTUML_SKIN } from '../../../../src/core/style/skins/plantuml-skin.js';

const jarPresent = existsSync(ORACLE_JAR_PATH);
const COMMITTED_TEXT: Readonly<Record<string, string>> = { PLANTUML_SKIN, STRICTUML_SKIN };

describe('plantuml-skin.ts', () => {
  it('is the generator output for the data it holds', () => {
    const skins = SKIN_EXPORTS.map(({ entry, exportName }) => {
      const text = COMMITTED_TEXT[exportName];
      if (text === undefined) throw new Error(`unknown skin export ${exportName}`);
      return { entry, exportName, text, sha256: createHash('sha256').update(text, 'utf8').digest('hex') };
    });
    const rendered = renderSkinModule({ jarVersion: SKIN_JAR_VERSION, skins });
    expect(rendered).toBe(readFileSync(PLANTUML_SKIN_PATH, 'utf8'));
  });

  it.runIf(jarPresent)('holds the oracle jar skin entries verbatim, byte for byte', () => {
    const sources = readSkinSources();
    expect(renderSkinModule(sources)).toBe(readFileSync(PLANTUML_SKIN_PATH, 'utf8'));
    expect(sources.skins.map((s) => s.text)).toEqual([PLANTUML_SKIN, STRICTUML_SKIN]);
    expect(sources.jarVersion).toBe(SKIN_JAR_VERSION);
  });

  it.runIf(!jarPresent)('skipped: oracle/dist/plantuml-oracle.jar not found', () => {
    expect(jarPresent).toBe(false);
  });
});
