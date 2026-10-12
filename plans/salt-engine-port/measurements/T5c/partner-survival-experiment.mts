// T5c instrument (no source edit): does "the dark partner survives to the
// paint conversion" close the skinparam-mode-dark probe? Patches the
// port-only HColorSimple#asPaint (= HColor#toSvg(IDENTITY)) to
// HColor#toSvg(DARK_MODE) for this process only, i.e. what a UGraphic
// carrying ColorMapper.DARK_MODE would paint at every site that today
// converts an HColor to a Paint string (Fore/Back call sites and
// FontConfigurationBridge#solidPaint).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { ColorMapper } from '../../../../src/core/klimt/color/ColorMapper.js';
import { toSvgHex } from '../../../../src/core/klimt/color/HColorSet.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { compareSvg, weightedScore } from '../../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureSalt } from '../../../../tests/oracle/svg-conformance/render-fixture-salt.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const calls = new Map<string, number>();
const original = HColorSimple.prototype.asPaint;
HColorSimple.prototype.asPaint = function patched(this: HColorSimple) {
  const stack = new Error().stack?.split('\n')[2]?.trim() ?? '?';
  const site = stack.replace(/^at /, '').replace(/\(.*\/src\//, '(src/');
  calls.set(site, (calls.get(site) ?? 0) + 1);
  if (this.isTransparent()) return '#00000000';
  return toSvgHex(ColorMapper.DARK_MODE.fromColorSimple(this));
};
void original;
const slug = process.argv[2] ?? 'skinparam-mode-dark';
const dir = join(ROOT, 'tests/fixtures/salt');
const ours = renderFixtureSalt(readFileSync(join(dir, `${slug}.puml`), 'utf8'), new DeterministicMeasurer());
const { diffs } = compareSvg(ours, readFileSync(join(dir, `${slug}.svg`), 'utf8'), 'deterministic');
console.log(`${slug} with partner-aware paint: ${diffs.length} diffs, weighted ${weightedScore(diffs)}`);
for (const d of diffs) console.log('  ', JSON.stringify(d));
console.log('asPaint call sites reached:');
for (const [site, n] of calls) console.log(`  ${n}x ${site}`);
