/**
 * lad T0c: (re)generate oracle/goldens/svg-lengthadjust/authored-baseline.json from a fresh
 * measurement of every tests/fixtures/lengthadjust/*.puml (measureAuthoredLengthAdjust, the
 * ratchet's own path). Prints the per-row diff against the current JSON; --write replaces it.
 *
 *   npx jiti plans/lengthadjust-document-wide/tools/build-authored-baseline.mts <commit> [--write]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AUTHORED_LENGTHADJUST_ROOT,
  listAuthoredLengthAdjustSlugs,
  measureAuthoredLengthAdjust,
} from '../../../tests/oracle/svg-conformance/render-fixture-lengthadjust.js';

const [commit, flag] = process.argv.slice(2);
if (commit === undefined) throw new Error('usage: build-authored-baseline.mts <commit> [--write]');
const OUT = join(AUTHORED_LENGTHADJUST_ROOT, '../../../oracle/goldens/svg-lengthadjust/authored-baseline.json');
const MEASURED_AT = new Date().toISOString().slice(0, 10);

/** D5 + Amendment 1 D5: emitters that write no textLength today (the 13 `baseline` rows). */
const NO_TEXTLENGTH_REASON = "emitter writes no textLength (pre-existing; owner: the engine's own drive)";
const NO_TEXTLENGTH_ENGINES = new Set(['board', 'packet', 'chart']);

/** Which task closes a `rootExact: false` row (task table, T0c spec). */
const OWNER: Record<string, string> = {
  class: 'T1b',
  object: 'T1b',
  state: 'T1c',
  json: 'T1d',
  yaml: 'T1d',
  hcl: 'T1d',
  activity: 'T2a',
  component: 'T2b',
  usecase: 'T2b',
  mindmap: 'T2c',
  wbs: 'T2d',
  salt: 'T2e',
  board: 'T2f',
  files: 'T2f',
  packet: 'T2f',
  chart: 'T2f',
};

interface Row {
  slug: string;
  engine: string;
  variant: string;
  score: number;
  diffCount: number;
  rootExact: boolean;
  textLength: 'exact' | 'baseline';
  textLengthMatch: boolean;
  reason?: string;
}

function isBaselineTextLength(engine: string, variant: string): boolean {
  if (engine === 'files') return true;
  return NO_TEXTLENGTH_ENGINES.has(engine) && variant !== 'none';
}

const rows: Row[] = listAuthoredLengthAdjustSlugs().map((slug) => {
  const cut = slug.lastIndexOf('-');
  const engine = slug.slice(0, cut);
  const variant = slug.slice(cut + 1);
  const m = measureAuthoredLengthAdjust(slug);
  if (m.errored) throw new Error(`${slug}: ${m.reason}`);
  const textLength = isBaselineTextLength(engine, variant) ? 'baseline' : 'exact';
  const reasons: string[] = [];
  if (textLength === 'baseline') reasons.push(NO_TEXTLENGTH_REASON);
  if (!m.rootExact) {
    const owner = OWNER[engine];
    if (owner === undefined) throw new Error(`${slug}: no owner for engine ${engine}`);
    reasons.push(`pending ${owner}`);
  }
  return {
    slug,
    engine,
    variant,
    score: m.score,
    diffCount: m.diffCount,
    rootExact: m.rootExact,
    textLength,
    textLengthMatch: m.textLengthMatch,
    ...(reasons.length === 0 ? {} : { reason: reasons.join('; ') }),
  };
});

const text = JSON.stringify({ measuredAt: MEASURED_AT, commit, rows }, null, 2) + '\n';
const old = existsSync(OUT)
  ? new Map((JSON.parse(readFileSync(OUT, 'utf8')) as { rows: Row[] }).rows.map((r) => [r.slug, r]))
  : new Map<string, Row>();
for (const r of rows) {
  const o = old.get(r.slug);
  const sig = (x: Row | undefined): string =>
    x === undefined ? '(new)' : `score=${x.score} root=${x.rootExact} tl=${x.textLengthMatch}`;
  const flagTxt = sig(o) === sig(r) ? '' : `  <- was ${sig(o)}`;
  console.log(`${r.slug}\t${sig(r)}${flagTxt}`);
}
const count = (p: (r: Row) => boolean): number => rows.filter(p).length;
console.log(
  `rows=${rows.length} rootExact true/false=${count((r) => r.rootExact)}/${count((r) => !r.rootExact)} ` +
    `textLengthMatch true/false=${count((r) => r.textLengthMatch)}/${count((r) => !r.textLengthMatch)} ` +
    `baseline=${count((r) => r.textLength === 'baseline')}`,
);
if (flag === '--write') writeFileSync(OUT, text);
else console.log('dry run (pass --write)');
