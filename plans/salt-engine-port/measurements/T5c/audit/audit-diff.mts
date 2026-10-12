// T5c audit: class/activity whole-fragment mapper vs a painted background.
// Renders each audit probe through production renderSync under
// DeterministicMeasurer and lists the colour diffs vs the jar oracle.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../../../src/index.js';
import { compareSvg } from '../../../../../tests/oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
for (const f of readdirSync(HERE).filter((n) => n.endsWith('.puml')).sort()) {
  const slug = f.replace(/\.puml$/, '');
  const ours = renderSync(readFileSync(join(HERE, f), 'utf8'), { measurer: new DeterministicMeasurer() });
  const jar = readFileSync(join(HERE, `${slug}.svg`), 'utf8');
  const { diffs } = compareSvg(ours, jar, 'deterministic');
  const colour = diffs.filter((d) => /fill|stroke|background|stop-color|style/.test(d.path));
  console.log(`${slug}: ${diffs.length} diffs, ${colour.length} colour`);
  for (const d of colour) console.log('  ', JSON.stringify(d));
  const rect = /<rect[^>]*>/.exec(ours.replace(/<defs>.*?<\/defs>/s, ''))?.[0];
  const jrect = /<rect[^>]*>/.exec(jar.replace(/<defs>.*?<\/defs>/s, ''))?.[0];
  console.log('   ours first rect:', rect);
  console.log('   jar  first rect:', jrect);
  console.log('   ours svg style:', /<svg[^>]*style="([^"]*)"/.exec(ours)?.[1], '| jar:', /<svg[^>]*style="([^"]*)"/.exec(jar)?.[1]);
}
