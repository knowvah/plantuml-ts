/**
 * `src/core/themes-source.ts` must not drift from its generator
 * (`scripts/build-theme-sources.ts`) or from upstream's theme files.
 *
 * Two checks, because CI has no `~/git/plantuml` checkout:
 *   - always: the committed file is exactly what the generator prints for the
 *     data it holds (a hand edit, or a Prettier reformat, fails here);
 *   - with the upstream checkout present: that data is upstream's, verbatim.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  THEME_SOURCES_PATH,
  UPSTREAM_THEMES_DIR,
  readThemeSources,
  renderThemeSourcesModule,
  toStringLiteral,
} from '../../../scripts/build-theme-sources.js';
import { THEME_SOURCES } from '../../../src/core/themes-source.js';

/** `ls ~/git/plantuml/src/main/resources/themes/puml-theme-*.puml | wc -l`. */
const UPSTREAM_THEME_COUNT = 44;

describe('themes-source.ts', () => {
  it('is the generator output for the data it holds', () => {
    const committed = readFileSync(THEME_SOURCES_PATH, 'utf8');
    expect(renderThemeSourcesModule(new Map(Object.entries(THEME_SOURCES)))).toBe(committed);
    expect(Object.keys(THEME_SOURCES)).toHaveLength(UPSTREAM_THEME_COUNT);
  });

  it.runIf(existsSync(UPSTREAM_THEMES_DIR))('holds upstream theme files verbatim', () => {
    expect(renderThemeSourcesModule(readThemeSources())).toBe(readFileSync(THEME_SOURCES_PATH, 'utf8'));
  });
});

describe('toStringLiteral', () => {
  it.each([
    ['plain', "'plain'"],
    ["it's", '"it\'s"'],
    ['say "x"', '\'say "x"\''],
    ['a\\b\n\tc\r', "'a\\\\b\\n\\tc\\r'"],
    ['\u0001', "'\\u0001'"],
  ])('%j -> %s', (text, literal) => {
    expect(toStringLiteral(text)).toBe(literal);
  });
});
