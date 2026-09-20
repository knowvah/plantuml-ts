/**
 * `n/a (plantuml-ts only)` — the D8 word added after the mission closed
 * (decisions.md D8, journal row 30): a type whose every cached jar SVG is
 * PlantUML's own "Diagram not supported by this release" page.
 *
 * Hermetic: a temp dot-cache tree, never the real one.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { isJarUnsupportedPage, jarUnsupportedCountsOf } from '../../../scripts/parity-dashboard-inputs.js';
import { isPlantumlTsOnly, PLANTUML_TS_ONLY } from '../../../scripts/parity-dashboard-matrix.js';

/** The element exactly as the jar wrote it for chronology/lenudo-53-nade902. */
const UNSUPPORTED_ELEMENT =
  '<text x="5" y="14.333" fill="#000" font-size="12" textLength="248.775" font-weight="700">' +
  'Diagram not supported by this release of PlantUML</text>';
const UNSUPPORTED_SVG = `<svg xmlns="http://www.w3.org/2000/svg"><g>${UNSUPPORTED_ELEMENT}</g></svg>`;
const REAL_SVG = '<svg xmlns="http://www.w3.org/2000/svg" data-diagram-type="BOARD"><g/></svg>';

function fixture(cache: string, type: string, slug: string, svg: string, done = true): void {
  const dir = join(cache, type, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'in.puml'), '@startuml\n@enduml\n');
  writeFileSync(join(dir, 'in.svg'), svg);
  if (done) writeFileSync(join(dir, '.done'), '');
}

describe('isJarUnsupportedPage', () => {
  it('fires on the whole-element banner PSystemUnsupported.java:62 writes', () => {
    expect(isJarUnsupportedPage(UNSUPPORTED_SVG)).toBe(true);
  });
  it('does not fire on a label that merely mentions the phrase', () => {
    expect(isJarUnsupportedPage('<text>note: Diagram not supported by this release of PlantUML?</text>')).toBe(false);
    expect(isJarUnsupportedPage(REAL_SVG)).toBe(false);
  });
});

describe('jarUnsupportedCountsOf + isPlantumlTsOnly', () => {
  let cache = '';
  beforeAll(() => {
    cache = mkdtempSync(join(tmpdir(), 'pdr-jar-unsupported-'));
    fixture(cache, 'chronology', 'lenudo', UNSUPPORTED_SVG);
    fixture(cache, 'board', 'a', REAL_SVG);
    fixture(cache, 'board', 'b', REAL_SVG);
    fixture(cache, 'mixed', 'ok', REAL_SVG);
    fixture(cache, 'mixed', 'declined', UNSUPPORTED_SVG);
    fixture(cache, 'pending', 'not-done', UNSUPPORTED_SVG, false);
  });
  afterAll(() => {
    rmSync(cache, { recursive: true, force: true });
  });

  it('counts only .done fixtures whose in.svg is the unsupported page', () => {
    expect(jarUnsupportedCountsOf(cache)).toEqual({ chronology: 1, board: 0, mixed: 1, pending: 0 });
  });

  it('returns {} for a missing cache dir', () => {
    expect(jarUnsupportedCountsOf(join(cache, 'nope'))).toEqual({});
  });

  it('flags a type only when EVERY cached golden is the unsupported page', () => {
    const unsupported = jarUnsupportedCountsOf(cache);
    const oracle = { chronology: 1, board: 2, mixed: 2, pending: 0 };
    expect(isPlantumlTsOnly('chronology', oracle, unsupported)).toBe(true);
    expect(isPlantumlTsOnly('board', oracle, unsupported)).toBe(false);
    expect(isPlantumlTsOnly('mixed', oracle, unsupported)).toBe(false);
    // Nothing captured is still "no oracle captured", never "plantuml-ts only".
    expect(isPlantumlTsOnly('pending', oracle, unsupported)).toBe(false);
    expect(isPlantumlTsOnly('salt', oracle, unsupported)).toBe(false);
  });

  it('the cell carries the D8 word and no freshness date', () => {
    expect(PLANTUML_TS_ONLY).toEqual({ cell: 'n/a (plantuml-ts only)', freshness: undefined });
  });
});
