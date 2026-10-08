/**
 * `@startdot` against the pinned jar (unwind-U2): PlantUML directives
 * (`title`/`caption`/`legend`/`header`/`footer`/`skinparam`/`<style>`,
 * comments) placed before and after the graphviz header.
 *
 * Every `.svg` beside its `.puml` in `tests/fixtures/unwind-U2/` is the jar's
 * own render (`scripts/oracle-render.sh`, ONE fixture per jar run — see the
 * unwind-U2 agent note on the factory's shared `data` field).
 *
 * The mechanism under test is `PSystemDotFactory#executeLine`
 * (`directdot/PSystemDotFactory.java:69-82`): nothing is accepted before the
 * header — a non-noise line there is `Syntax Error?` on that line
 * (`PSystemBasicFactory.java:61-64`) — and every line after it is DOT handed
 * to graphviz verbatim. Only `skinparam `/`!pragma ` lines and blanks directly
 * after `@startdot` are dropped first (`UmlSource.java:79-106`).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind-U2');

function ours(slug: string): string {
  return renderSync(readFileSync(join(FIXTURES, `${slug}.puml`), 'utf8'), { measurer: new DeterministicMeasurer() });
}

function jar(slug: string): string {
  return readFileSync(join(FIXTURES, `${slug}.svg`), 'utf8');
}

function texts(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]!);
}

/** The two lines no port can reproduce: the build's version banner, and the
 *  source file name (`renderSync` takes a string, not a file). */
function normalizedErrorTexts(svg: string): string[] {
  return texts(svg)
    .filter((t) => !t.includes('version'))
    .map((t) => t.replace(/^\[From .* \(line (\d+)\) \]$/, '[From (line $1) ]'));
}

describe('@startdot — jar output is graphviz output (zero diffs)', () => {
  // `skinparam`/`!pragma` directly after @startdot are noise
  // (UmlSource.java:95-106); `'` comments never leave the preprocessor; and
  // after the header every line is DOT — `skinparam X #AABBCC` and
  // `legend … end legend` are just graphviz node statements there.
  const slugs = [
    'control',
    'skinparam-before',
    'skinparam-after',
    'legend-after',
    'pragma-before',
    'quote-comment-before',
    'comment-in-label',
  ];
  for (const slug of slugs) {
    it(`${slug}: zero-diff against the jar`, () => {
      expect(compareSvg(ours(slug), jar(slug), 'deterministic').diffs).toEqual([]);
    });
  }
});

describe('@startdot — a directive before the header is a syntax error page', () => {
  const slugs = [
    'title-before',
    'caption-before',
    'header-before',
    'footer-before',
    'legend-before',
    'style-before',
    'comment-before',
  ];
  for (const slug of slugs) {
    it(`${slug}: same page text, same offending line, as the jar`, () => {
      const out = normalizedErrorTexts(ours(slug));
      expect(out).toEqual(normalizedErrorTexts(jar(slug)));
      expect(out.at(-1)).toBe('Syntax Error? (Assumed diagram type: dot)');
    });
  }

  it('title-before-blank: the offender is named on its own document line (3)', () => {
    const out = normalizedErrorTexts(ours('title-before-blank'));
    expect(out[0]).toBe('[From (line 3) ]');
    expect(out.at(-1)).toBe('Syntax Error? (Assumed diagram type: dot)');
    expect(normalizedErrorTexts(jar('title-before-blank'))[0]).toBe('[From (line 3) ]');
  });

  it('title-only: Syntax Error? on line 2, as the jar', () => {
    const out = texts(ours('title-only'));
    expect(out).toContain('Syntax Error? (Assumed diagram type: dot)');
    expect(texts(jar('title-only'))).toContain('Syntax Error? (Assumed diagram type: dot)');
  });

  it('skinparam-only: the noise line leaves an empty diagram, as the jar', () => {
    expect(texts(ours('skinparam-only'))).toContain('Empty description (Assumed diagram type: dot)');
    expect(texts(jar('skinparam-only'))).toContain('Empty description (Assumed diagram type: dot)');
  });
});

describe('@startdot — a directive after the header is DOT', () => {
  // `title Hello World` is three graphviz nodes. The structure and every text
  // match the jar; what remains is @knowvah/dot-engine's node-width arithmetic
  // (≤1pt), which is the layout library's, not this port's.
  for (const slug of ['title-after', 'caption-after', 'header-after', 'footer-after']) {
    it(`${slug}: same elements and text as the jar, numeric deltas only`, () => {
      const { diffs } = compareSvg(ours(slug), jar(slug), 'deterministic');
      expect(diffs.filter((d) => !('delta' in d))).toEqual([]);
      expect(texts(ours(slug))).toEqual(texts(jar(slug)));
    });
  }
});
