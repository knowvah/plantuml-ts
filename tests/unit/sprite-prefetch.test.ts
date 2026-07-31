/**
 * Unit tests for `src/core/sprite-prefetch.ts` (mission
 * si11b-bootstrap-sprite-splitting, batch-1 T2).
 *
 * `scanSpriteNames` is built and tested in isolation: nothing routes through
 * it yet (T4 wires it into the prefetch walk). See
 * plans/si11b-bootstrap-sprite-splitting/batch-1/T2-sprite-scan.md and
 * decisions.md ADR-3/ADR-4.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { scanSpriteNames } from '../../src/core/sprite-prefetch.js';
import { SPRITE_PATTERN_SOURCE } from '../../src/core/creole-atoms.js';

/** The unicode-aware sprite-NAME character class this pattern is built
 *  from -- `SpriteUtils.SPRITE_NAME` = `[-\p{L}0-9_/]+` (Splitter.java:74).
 *  Used below to prove there is exactly ONE sprite-reference regex under
 *  `src/` (acceptance criterion 4), not to redefine the pattern. */
const SPRITE_NAME_CHAR_CLASS = '[-\\p{L}0-9_/]+';

/** Real fixture: oracle/goldens/svg-description/usecase/sprite-svg-bootstrap-0/in.puml
 *  (`<$bi-globe>`, `<$bi-bootstrap-fill>`, and both again with `,scale=2.5`). */
const BOOTSTRAP_FIXTURE_SOURCE = `
skinparam UsecaseBackgroundColor white

!include <bootstrap/bootstrap>

usecase a as "<$bi-globe>"
usecase b as "<$bi-bootstrap-fill>"
usecase c as "<$bi-globe,scale=2.5>"
usecase d as "<$bi-bootstrap-fill,scale=2.5>"
`;

/** Recursively collect every `.ts` file under `dir` (skips `node_modules`,
 *  `.git`, `dist`) -- used only by the "exactly one regex" structural check. */
function collectTsFiles(dir: string): string[] {
  const skip = new Set(['node_modules', '.git', 'dist']);
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('scanSpriteNames', () => {
  it('collapses plain and scale-variant references to one name (AC1)', () => {
    const names = scanSpriteNames('<$bi-globe> and <$bi-globe,scale=2.5>');
    expect([...names]).toEqual(['bi-globe']);
  });

  it('strips the forced-color prefix (AC2)', () => {
    const names = scanSpriteNames('<#FF0000$bi-globe>');
    expect([...names]).toEqual(['bi-globe']);
  });

  it('does not match <img> or <&openiconic> atoms (AC3)', () => {
    const names = scanSpriteNames('<img src="foo.png"> and <&openiconic-name>');
    expect([...names]).toEqual([]);
  });

  it('yields an empty set and never throws for a source with no references (AC5)', () => {
    const names = scanSpriteNames('@startuml\nusecase a\n@enduml');
    expect(names.size).toBe(0);
    expect(() => scanSpriteNames('')).not.toThrow();
    expect(scanSpriteNames('').size).toBe(0);
  });

  it('scans the real bootstrap fixture and finds exactly its two sprite names', () => {
    const names = scanSpriteNames(BOOTSTRAP_FIXTURE_SOURCE);
    expect([...names].sort()).toEqual(['bi-bootstrap-fill', 'bi-globe']);
  });

  it('lowercases mixed-case references (ADR-3: manifest is all-lowercase)', () => {
    const names = scanSpriteNames('<$Bi-Globe>');
    expect([...names]).toEqual(['bi-globe']);
  });

  it('deduplicates repeated references across multiple lines', () => {
    const source = ['<$bi-globe>', '<$bi-globe>', '<$bi-globe,scale=2.5>', '<$bi-bootstrap-fill>'].join('\n');
    const names = scanSpriteNames(source);
    expect([...names].sort()).toEqual(['bi-bootstrap-fill', 'bi-globe']);
  });

  it('matches names containing "/" and Unicode letters (SPRITE_NAME charset)', () => {
    const names = scanSpriteNames('<$folder/icon> <$café>');
    expect([...names].sort()).toEqual(['café', 'folder/icon']);
  });

  it('collects distinct names from multiple distinct references', () => {
    const names = scanSpriteNames('<$one> <$two> <$three,scale=2>');
    expect([...names].sort()).toEqual(['one', 'three', 'two']);
  });

  it("reuses creole-atoms.ts's SPRITE_PATTERN_SOURCE rather than a copy", () => {
    // The exported constant is the single source of truth for "what is a
    // sprite reference" (ADR-4). Confirming scanSpriteNames' output matches
    // a manual application of the SAME exported pattern proves there is no
    // silently-diverged second definition of "sprite reference" in play.
    const re = new RegExp(SPRITE_PATTERN_SOURCE, 'gu');
    const expected = new Set<string>();
    let m = re.exec(BOOTSTRAP_FIXTURE_SOURCE);
    while (m !== null) {
      expected.add(m[2]!.toLowerCase());
      if (m[0].length === 0) re.lastIndex += 1;
      m = re.exec(BOOTSTRAP_FIXTURE_SOURCE);
    }
    expect([...scanSpriteNames(BOOTSTRAP_FIXTURE_SOURCE)].sort()).toEqual([...expected].sort());
  });

  it('has exactly one sprite-reference regex under src/ (AC4)', () => {
    const srcDir = join(__dirname, '..', '..', 'src');
    const files = collectTsFiles(srcDir);
    const definingFiles = files.filter((f) => readFileSync(f, 'utf8').includes(SPRITE_NAME_CHAR_CLASS));
    expect(definingFiles).toEqual([join(srcDir, 'core', 'creole-atoms.ts')]);

    const prefetchSource = readFileSync(join(srcDir, 'core', 'sprite-prefetch.ts'), 'utf8');
    expect(prefetchSource).toContain("SPRITE_PATTERN_SOURCE } from './creole-atoms.js'");
    expect(prefetchSource).not.toContain(SPRITE_NAME_CHAR_CLASS);
  });
});
