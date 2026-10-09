// isw stop 4: every cached oracle <text> run containing U+0020 — does jar textLength equal DeterministicMeasurer? Usage: npx jiti plans/instrument-space-width/measurements/instrument-probe.mts
import { readdirSync, readFileSync, existsSync } from 'node:fs';
const root = process.cwd();
const { DeterministicMeasurer } = await import(`${root}/src/core/measurer-deterministic.ts`);
const m = new DeterministicMeasurer();
const dec = (s: string) => s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d)).replace(/&amp;/g,'&');
let z=0, w=0, other=0, total=0; const ex: string[] = [];
const cache = `${root}/test-results/dot-cache`;
for (const e of readdirSync(cache)) { let sl: string[]; try { sl = readdirSync(`${cache}/${e}`);} catch {continue;}
 for (const s of sl) { const f = `${cache}/${e}/${s}/in.svg`; if (!existsSync(f)) continue;
  for (const mm of readFileSync(f,'utf8').matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)) {
   const attrs = mm[1]; const t = dec(mm[2]); if (!t.includes(' ')) continue;
   const fs = /font-size="([\d.]+)"/.exec(attrs); const tl = /textLength="([\d.]+)"/.exec(attrs); if (!fs||!tl) continue;
   total++; const size=+fs[1]; const base = m.measure(t,{family:'x',size}).width; const n=[...t].filter(c=>c===' ').length;
   const L=+tl[1]; if (Math.abs(L-base)<0.002) z++; else if (Math.abs(L-(base+n*4.4*size/16))<0.002) w++; else { other++; if (ex.length<5) ex.push(`${e}/${s} ${JSON.stringify(t)} ${L} ${base}`);} }}}
console.log({ total, equal: z, plusSpace44: w, other, ex });
