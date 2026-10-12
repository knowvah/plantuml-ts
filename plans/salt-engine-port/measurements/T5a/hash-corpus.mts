/**
 * `npx jiti plans/salt-engine-port/measurements/T5a/hash-corpus.mts <out.json>`
 * sha256 of our SVG for every `test-results/dot-cache/<tree>/<slug>` dir, via
 * the survey's persistent `--render-many` worker (the T4a hash method,
 * `.agent-notes/sep-T4a.md`). Errored/timeout rows hash their outcome kind.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runPersistentPool } from '../../../../scripts/svg-parity-workers.ts';

const repo = join(import.meta.dirname, '..', '..', '..', '..');
const cache = join(repo, 'test-results', 'dot-cache');
const keys: string[] = [];
const dirs: string[] = [];
for (const tree of readdirSync(cache).sort()) {
  const tdir = join(cache, tree);
  if (!existsSync(tdir) || tree.startsWith('.')) continue;
  for (const slug of readdirSync(tdir).sort()) {
    if (!existsSync(join(tdir, slug, 'in.puml'))) continue;
    keys.push(`${tree}/${slug}`);
    dirs.push(join(tdir, slug));
  }
}
const jiti = join(repo, 'node_modules', '.bin', 'jiti');
const survey = join(repo, 'scripts', 'svg-parity-survey.ts');
const outcomes = await runPersistentPool({
  dirs,
  spawn: () => spawn(jiti, [survey, '--render-many'], { env: process.env, stdio: ['pipe', 'pipe', 'pipe'] }),
  timeoutMs: 120_000,
  concurrency: 4,
  onProgress: (d, t) => {
    if (d % 500 === 0) process.stderr.write(`${d}/${t}\n`);
  },
});
const out: Record<string, string> = {};
keys.forEach((k, i) => {
  const o = outcomes[i]!;
  out[k] = o.kind === 'ok' ? createHash('sha256').update(o.rendered.svg).digest('hex') : o.kind;
});
writeFileSync(process.argv[2]!, `${JSON.stringify(out, null, 1)}\n`);
console.log(`hashed ${keys.length}`);
