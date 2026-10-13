/**
 * Whole-corpus render hash (sep T4a's method, `.agent-notes/sep-T4a.md`):
 * every `test-results/dot-cache/<type>/<slug>` dir rendered by the survey's
 * `--render-many` worker, sha256 of each SVG, written as `{ "<type>/<slug>": hash }`.
 *
 *   npx jiti plans/wbs-engine-port/measurements/T4a/hash-corpus.mts <out.json>
 *   npx jiti plans/wbs-engine-port/measurements/T4a/hash-corpus.mts --diff <before.json> <after.json>
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runPersistentPool } from '../../../../scripts/svg-parity-workers.js';

const REPO = resolve(import.meta.dirname, '../../../..');
const CACHE = join(REPO, 'test-results', 'dot-cache');
const SURVEY = join(REPO, 'scripts', 'svg-parity-survey.ts');
const JITI = join(REPO, 'node_modules', '.bin', 'jiti');

function dirs(): string[] {
  const out: string[] = [];
  for (const type of readdirSync(CACHE).sort()) {
    let slugs: string[];
    try {
      slugs = readdirSync(join(CACHE, type)).sort();
    } catch {
      continue;
    }
    for (const slug of slugs) out.push(join(CACHE, type, slug));
  }
  return out;
}

async function hashAll(outPath: string): Promise<void> {
  const all = dirs();
  const outcomes = await runPersistentPool({
    dirs: all,
    spawn: () => spawn(JITI, [SURVEY, '--render-many'], { env: process.env, stdio: ['pipe', 'pipe', 'pipe'] }),
    timeoutMs: 60_000,
    concurrency: 4,
    onProgress: (done, total) => {
      if (done % 500 === 0) process.stderr.write(`  ${done}/${total}\n`);
    },
  });
  const result: Record<string, string> = {};
  all.forEach((dir, i) => {
    const o = outcomes[i]!;
    const key = dir.slice(CACHE.length + 1);
    result[key] =
      o.kind === 'ok' ? createHash('sha256').update(o.rendered.svg).digest('hex') : `${o.kind}`;
  });
  writeFileSync(outPath, `${JSON.stringify(result, null, 1)}\n`);
}

function diff(beforePath: string, afterPath: string): void {
  const before = JSON.parse(readFileSync(beforePath, 'utf8')) as Record<string, string>;
  const after = JSON.parse(readFileSync(afterPath, 'utf8')) as Record<string, string>;
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed = [...keys].filter((k) => before[k] !== after[k]).sort();
  const byType = new Map<string, number>();
  for (const k of changed) byType.set(k.split('/')[0]!, (byType.get(k.split('/')[0]!) ?? 0) + 1);
  process.stdout.write(`total ${keys.size}, changed ${changed.length}\n`);
  for (const [t, n] of byType) process.stdout.write(`  ${t}: ${n}\n`);
  for (const k of changed.filter((c) => !c.startsWith('wbs/'))) process.stdout.write(`  non-wbs: ${k}\n`);
}

const args = process.argv.slice(2);
if (args[0] === '--diff') diff(args[1]!, args[2]!);
else await hashAll(args[0]!);
