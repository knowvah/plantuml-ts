/**
 * unwind2-S5: `!theme` lines execute in place and their `root` colours rank
 * by declaration counter, against the jar.
 *
 * Every `tests/fixtures/unwind2-S5/<name>.puml` has its jar render beside it
 * (`scripts/oracle-render.sh`, deterministic text). Upstream mechanisms:
 *  - `TContext.java:726-755` executes the theme at the directive's position.
 *  - Values merge by declaration counter, not selector depth
 *    (`Style.java:121-134`, `DarkString.java:50-66`, `ValueImpl.java:51-55`):
 *    a later `root { FontColor }` / `skinparam defaultFontColor`
 *    (`FromSkinparamToStyle.java:157`) beats an earlier `skinparam Activity
 *    { FontColor }`; a later `skinparam ArrowColor`
 *    (`FromSkinparamToStyle.java:151`) beats an earlier `root { LineColor }`.
 *
 * Pins are `[colour diffs, all diffs]`. Non-zero entries are OTHER, theme-
 * independent gaps (each reproduces with no `!theme`; see
 * `.agent-notes/unwind2-S5.md`): `root { Margin }` unread by class/usecase/
 * mindmap; sequence lifelines ignore `root { LineColor }` and
 * `SequenceLifeLineBorderColor`; sequence ignores `root { LineThickness /
 * RoundCorner }` and participant/arrow font skinparams (reddress, mars); the
 * usecase actor label ignores `root { FontColor }`; class-reddress is the
 * counter rule between two NARROWER selectors (`classAttributeFontColor`
 * after `classFontColor`), which `style-root-shadowing.ts` does not cover.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S5');
const COLOUR = /\/@(fill|stroke|font-family)$/u;

const PINS: Readonly<Record<string, readonly [number, number]>> = {
  'activity-skinparam-after': [0, 0],
  'activity-skinparam-before': [0, 0],
  'activity-style-after': [0, 0],
  'activity-style-before': [0, 0],
  'activity-style-root': [0, 0],
  'activity-theme-only': [0, 0],
  'class-reddress': [2, 4],
  'class-skinparam-after': [0, 190],
  'class-skinparam-before': [0, 190],
  'class-style-after': [0, 190],
  'class-style-before': [0, 190],
  'class-style-root': [0, 0],
  'class-theme-only': [0, 190],
  'mindmap-skinparam-after': [0, 42],
  'mindmap-skinparam-before': [0, 42],
  'mindmap-style-after': [0, 42],
  'mindmap-style-before': [0, 42],
  'mindmap-style-root': [0, 0],
  'mindmap-theme-only': [0, 42],
  'sequence-mars': [8, 24],
  'sequence-reddress': [14, 108],
  'sequence-skinparam-after': [2, 87],
  'sequence-skinparam-before': [2, 87],
  'sequence-style-after': [2, 87],
  'sequence-style-before': [2, 87],
  'sequence-style-root': [2, 17],
  'sequence-theme-only': [2, 87],
  'usecase-skinparam-after': [2, 53],
  'usecase-skinparam-before': [2, 53],
  'usecase-style-after': [2, 53],
  'usecase-style-before': [2, 53],
  'usecase-style-root': [2, 2],
  'usecase-theme-only': [2, 53],
};

const CASES = readdirSync(DIR)
  .filter((f) => f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();

function diffsOf(name: string): string[] {
  const source = readFileSync(join(DIR, `${name}.puml`), 'utf8');
  const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
  const ours = renderSync(source, { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, jar, 'deterministic').diffs.map((d) => d.path);
}

describe('unwind2-S5 — !theme and root colours match the jar', () => {
  it('has a pin per fixture', () => {
    expect(CASES).toEqual(Object.keys(PINS).sort());
  });

  it.each(CASES)('%s', (name) => {
    const paths = diffsOf(name);
    expect([paths.filter((p) => COLOUR.test(p)).length, paths.length]).toEqual(PINS[name]);
  });
});
