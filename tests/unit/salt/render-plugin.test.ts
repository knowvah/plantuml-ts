/**
 * The registered salt plugin end to end: `renderSync` over a `@startsalt`
 * source against the jar (`scripts/oracle-render.sh` probes under
 * `tests/fixtures/salt/`, and the cached corpus goldens under
 * `test-results/dot-cache/salt/`), through the same
 * `compareSvg(…, 'deterministic')` the survey and `render-diff.mts` use.
 *
 * - `PSystemSalt#getTextBlock` (PSystemSalt.java:112-132): the root element
 *   drawn at z-index 0 then 1, at its preferred dimension, in black;
 * - `getDefaultMargins()` = `same(5)` (PSystemSalt.java:237-240);
 * - `PSystemSaltFactory#initCommandsList` (PSystemSaltFactory.java:56-61):
 *   the common commands (`title`, `scale`, `rotate`, `minwidth`,
 *   `set separator`) are consumed before `CommandAnything`;
 * - `manageSprite` drops `hide stereotype` (PSystemSalt.java:149-150);
 * - `CommandAnything` refuses a FIRST line `salt` (CommandAnything.java:70);
 * - `createElement`'s `IllegalArgumentException` (PSystemSalt.java:215) is
 *   the jar's crash page; ours is our own error page (D5).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const measurer = new DeterministicMeasurer();
const PROBES = 'tests/fixtures/salt';

function probe(name: string): { markup: string; golden: string } {
  return {
    markup: readFileSync(`${PROBES}/${name}.puml`, 'utf8'),
    golden: readFileSync(`${PROBES}/${name}.svg`, 'utf8'),
  };
}

function corpus(slug: string): { markup: string; golden: string } {
  const dir = `test-results/dot-cache/salt/${slug}`;
  return { markup: readFileSync(`${dir}/in.puml`, 'utf8'), golden: readFileSync(`${dir}/in.svg`, 'utf8') };
}

function diffPaths(f: { markup: string; golden: string }): string[] {
  return compareSvg(renderSync(f.markup, { measurer }), f.golden, 'deterministic').diffs.map((d) => d.path);
}

function rootAttr(svg: string, name: string): string | undefined {
  const root = /^<svg[^>]*>/.exec(svg)?.[0] ?? '';
  return new RegExp(`\\s${name}="([^"]*)"`).exec(root)?.[1];
}

function texts(svg: string): string[] {
  return [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]!);
}

describe('salt plugin — renderSync equals the jar', () => {
  it('routes @startsalt to SALT: hide-stereotype probe is a 31x25 canvas with A and B only', () => {
    const f = probe('hide-stereotype-dropped');
    const svg = renderSync(f.markup, { measurer });
    expect(rootAttr(svg, 'data-diagram-type')).toBe('SALT');
    expect(rootAttr(svg, 'viewBox')).toBe('0 0 31 25');
    expect(texts(svg)).toEqual(['A', 'B']);
    expect(diffPaths(f)).toEqual([]);
  });

  it('a `salt` line that is not the first data line is ordinary text (CommandAnything.java:70)', () => {
    const f = probe('salt-not-first-line');
    expect(texts(renderSync(f.markup, { measurer }))).toEqual(['salt']);
    expect(diffPaths(f)).toEqual([]);
  });

  it('title/scale/rotate/minwidth/set separator are commands, not salt text (jar draws My title, A, B)', () => {
    // The jar's 152x120 canvas (chrome + scale 2) needs the shared chrome
    // finalizer to know salt's same(5) margin -- outside this plugin; the
    // drawn texts already match the jar's three.
    const svg = renderSync(probe('common-commands').markup, { measurer });
    expect(texts(svg)).toEqual(['My title', 'A', 'B']);
  });

  it.each([['monochrome-reverse'], ['monochrome-true'], ['reversecolor-dark'], ['dpi-192']])(
    'probe %s: the muted colour mapper and the dpi factor (TitledDiagram.java:291-311, TextBlockExporter.java:205-209)',
    (name) => {
      expect(diffPaths(probe(name))).toEqual([]);
    },
  );

  it('skinparam mode dark: the document background keeps its @media dark partner (#1B1B1B)', () => {
    const f = probe('skinparam-mode-dark');
    const svg = renderSync(f.markup, { measurer });
    expect(rootAttr(svg, 'style')).toContain('background:#1B1B1B;');
    expect(rootAttr(f.golden, 'style')).toContain('background:#1B1B1B;');
  });

  it('ributi: `root { Margin 10 }` replaces same(5) (TextBlockExporter.java:510-516) and paints the background', () => {
    const svg = renderSync(corpus('ributi-22-dogi775').markup, { measurer });
    expect(rootAttr(svg, 'viewBox')).toBe('0 0 265 180');
    expect(rootAttr(svg, 'style')).toContain('background:#FFC0CB;');
  });

  it.each([['lojove-43-veci853'], ['cajoda-60-geze313'], ['digebu-56-luko289'], ['ributi-22-dogi775']])(
    'corpus row %s',
    (slug) => {
      expect(diffPaths(corpus(slug))).toEqual([]);
    },
  );
});

describe('salt plugin — chrome', () => {
  it('a mainframe frames the salt drawing (frame ink from LimitFinder, DiagramChromeFactory.java:332-337)', () => {
    const f = probe('mainframe');
    const ours = texts(renderSync(f.markup, { measurer }));
    expect(ours).toEqual(texts(f.golden));
    expect(ours).toEqual(['This is a mainframe', 'OK', 'A']);
  });
});

describe('embedded {{salt}} (D7): the nested slot draws salt at the jar size', () => {
  it.each([['class/bixogo-47-xulu385'], ['class/roxosu-00-pini153'], ['unknown/lubicu-73-fule059']])(
    '%s equals the jar',
    (row) => {
      const dir = `test-results/dot-cache/${row}`;
      const f = { markup: readFileSync(`${dir}/in.puml`, 'utf8'), golden: readFileSync(`${dir}/in.svg`, 'utf8') };
      expect(diffPaths(f)).toEqual([]);
    },
  );
});

describe('salt plugin — error pages', () => {
  it('`mode dark` is no salt command: it is data, so no root factory is ready (jar: IllegalArgumentException)', () => {
    const f = probe('mode-line-is-data');
    expect(texts(f.golden)[0]).toBe('An error has occurred : java.lang.IllegalArgumentException');
    const ours = texts(renderSync(f.markup, { measurer }));
    expect(ours).toContain('mode dark');
    expect(ours.join('\n')).toContain('IllegalArgumentException');
  });

  it('a first line `salt` is the jar error "This is not needed anymore." on line 2', () => {
    const f = probe('salt-first-line');
    const ours = texts(renderSync(f.markup, { measurer }));
    const jar = texts(f.golden);
    // The banner (version string, ruling 2026-10-10) and the source name differ by design.
    expect(ours[1]).toBe('[From string (line 2) ]');
    expect(jar[1]).toBe('[From salt-first-line.puml (line 2) ]');
    expect(ours.slice(2)).toEqual(jar.slice(2));
    expect(ours.at(-1)).toBe('This is not needed anymore. (Assumed diagram type: salt)');
  });

  it('no ready root factory is a thrown IllegalArgumentException: our error page, never a drawing (D5)', () => {
    const svg = renderSync(probe('no-factory-ready').markup, { measurer });
    expect(rootAttr(svg, 'data-diagram-type')).toBeUndefined();
    expect(texts(svg).join('\n')).toContain('IllegalArgumentException');
  });
});
