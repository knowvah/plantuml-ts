// codd planning: classify render-diff files into families. Usage: node classify.mjs <rd-dir>
import { readFileSync, readdirSync } from 'node:fs';
const d = process.argv[2]; const out = {};
for (const f of readdirSync(d).sort()) {
  const t = readFileSync(`${d}/${f}`, 'utf8'); const slug = f.replace('.txt','');
  const h = t.match(/structural=(\d+) numeric=(\d+)/); const lines = t.split('\n').filter(l => /^\s+[NS] /.test(l));
  const attrs = lines.map(l => (l.match(/@([\w-]+)/)||[,'childCount'])[1]);
  const canvas = lines.some(l => /^\s+\S svg\/@(width|height|viewBox)|svg\/@style/.test(l));
  const only = (re) => attrs.every(a => re.test(a));
  let fam;
  if (lines.some(l => /childCount|count/i.test(l)) && !canvas) fam = 'childCount';
  else if (canvas) fam = 'canvas';
  else if (only(/^(x|y)$/) && lines.every(l => /text\[/.test(l))) fam = 'text-xy';
  else if (only(/^(fill|stroke)$/)) fam = 'colour';
  else if (only(/^(stroke-width|rx|ry|fill|stroke)$/)) fam = 'stroke-width/rx-ry';
  else fam = 'mixed';
  (out[fam] ??= []).push(`${slug} ${h?h[1]+'/'+h[2]:'?'} [${[...new Set(attrs)].join(',')}]`);
}
for (const [k,v] of Object.entries(out)) { console.log(`## ${k} (${v.length})`); for (const r of v) console.log('  '+r); }
