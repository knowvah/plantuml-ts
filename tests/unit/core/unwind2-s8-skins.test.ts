/**
 * unwind2-S8: the bundled skins, against the jar.
 *
 * Every `tests/fixtures/unwind2-S8/skin-*.puml` has its jar render beside it
 * (`scripts/oracle-render.sh`, deterministic text). Upstream:
 *  - `skin <name>` loads `<name>.skin` on its own line and turns a failure
 *    into that line's command error (`TitledDiagram.java:159-182`): "Cannot
 *    find style" (no `reddress.skin` in the jar, and the lookup is case-
 *    sensitive), "Incomplete style" (`strictuml.skin` is a fragment,
 *    `StyleLoader.java:144-176`);
 *  - `sonyxperiadev.skin` is a complete `<style>` sheet whose dark section
 *    follows `@media` (`StyleParser.java:150-152`) and whose values use css
 *    variables (`CssVariables.java:43-74`).
 *
 * Pins are the `compareSvg` diff counts. A refused skin's error page carries
 * the 5 diffs the user's ruling keeps (DIVERGENCES.md "Error pages print
 * this port's version, and the source name is `string`"); `+2` on
 * `skin-class-after-reddress` is the page width following the shorter
 * banner. The `sonyxperiadev` residuals reproduce with the same
 * declarations in an inline `<style>` and no `skin` line at all (sequence
 * ignores `participant`/`lifeLine`/`arrow` styles and emits `document
 * BackGroundColor white` raw; state/usecase text ignores `root FontColor`;
 * no engine reads `root FontStyle`) -- engine style-reading gaps, not the
 * skin.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S8');

const PINS: Readonly<Record<string, number>> = {
  'skin-activity-reddress': 5,
  'skin-activity-sonyxperiadev': 1,
  'skin-case-rose': 5,
  'skin-class-after-reddress': 7,
  'skin-class-reddress': 5,
  'skin-class-sonyxperiadev': 0,
  'skin-mindmap-reddress': 5,
  'skin-mindmap-sonyxperiadev': 0,
  'skin-object-reddress': 5,
  'skin-object-sonyxperiadev': 2,
  'skin-sequence-reddress': 5,
  'skin-sequence-sonyxperiadev': 27,
  'skin-state-reddress': 5,
  'skin-state-sonyxperiadev': 2,
  'skin-strictuml': 5,
  'skin-usecase-reddress': 5,
  'skin-usecase-sonyxperiadev': 4,
};

const CASES = readdirSync(DIR)
  .filter((f) => f.startsWith('skin-') && f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();

function jarOf(name: string): string {
  return readFileSync(join(DIR, `${name}.svg`), 'utf8');
}

function oursOf(name: string): string {
  return renderSync(readFileSync(join(DIR, `${name}.puml`), 'utf8'), { measurer: new DeterministicMeasurer() });
}

const RE_RED_TEXT = /<text[^>]*fill="#F00"[^>]*>([^<]*)<\/text>/u;

describe('unwind2-S8 — bundled skins match the jar', () => {
  it('has a pin per fixture', () => {
    expect(CASES).toEqual(Object.keys(PINS).sort());
  });

  it.each(CASES)('%s', (name) => {
    expect(compareSvg(oursOf(name), jarOf(name), 'deterministic').diffs.length).toBe(PINS[name]);
  });

  it.each(['skin-class-reddress', 'skin-mindmap-reddress', 'skin-case-rose', 'skin-strictuml'])(
    '%s: the skin line is the command error the jar prints',
    (name) => {
      expect(RE_RED_TEXT.exec(oursOf(name))?.[1]).toBe(RE_RED_TEXT.exec(jarOf(name))![1]);
    },
  );
});
