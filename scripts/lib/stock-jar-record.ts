/**
 * Builds `oracle/goldens/stock-error-pages.json` from the per-fixture stock-jar
 * runs left in a work dir by `scripts/stock-jar-verify.sh` (aepp D5).
 *
 * A fixture is in the record iff the stock jar exited with
 * `ExitStatus.ERROR_200_SOME_DIAGRAMS_HAVE_ERROR` (`cli/ExitStatus.java:43`).
 * `line`/`message` come from `-stdrpt:1` stderr (`StdrptV1.java:out`):
 * `lineNumber=` and the joined `label=` lines of the FIRST `status=ERROR` block.
 *
 * Usage: stock-jar-record.ts <workDir> <sha> <version> <errorExit> <outJson> [drawsOut]
 */
import { readFileSync, writeFileSync } from 'node:fs';

export interface StockError {
  line: number | null;
  message: string;
}

export interface StockRecord {
  upstreamSha: string;
  plantumlVersion: string;
  errors: Record<string, StockError>;
}

const STATUS_ERROR = 'status=ERROR';
const LINE_KEY = 'lineNumber=';
const LABEL_KEY = 'label=';

/** First `status=ERROR` block of a `-stdrpt:1` stderr stream. */
export function parseStdrpt(stderr: string): StockError {
  const lines = stderr.split('\n');
  const at = lines.indexOf(STATUS_ERROR);
  if (at < 0) return { line: null, message: '' };
  let line: number | null = null;
  const labels: string[] = [];
  for (const l of lines.slice(at + 1)) {
    if (l.startsWith('protocolVersion=')) break;
    if (l.startsWith(LINE_KEY)) line = Number(l.slice(LINE_KEY.length));
    else if (l.startsWith(LABEL_KEY)) labels.push(l.slice(LABEL_KEY.length));
  }
  return { line, message: labels.join('\n') };
}

/** Deterministic: keys sorted, no timestamps, trailing newline. */
export function serialize(rec: StockRecord): string {
  const errors: Record<string, StockError> = {};
  for (const k of Object.keys(rec.errors).sort()) errors[k] = rec.errors[k]!;
  return `${JSON.stringify({ upstreamSha: rec.upstreamSha, plantumlVersion: rec.plantumlVersion, errors }, null, 2)}\n`;
}

function main(argv: string[]): void {
  const [work, sha, version, errorExit, outJson, drawsOut] = argv;
  if (!work || !sha || !version || !errorExit || !outJson) throw new Error('usage: see header');
  const keys = readFileSync(`${work}/candidates.txt`, 'utf8').split('\n').filter(Boolean);
  const errors: Record<string, StockError> = {};
  const draws: string[] = [];
  for (const key of keys) {
    const exit = readFileSync(`${work}/err/${key}.exit`, 'utf8').trim();
    if (exit === errorExit) errors[key] = parseStdrpt(readFileSync(`${work}/err/${key}.txt`, 'utf8'));
    else draws.push(`${key}\texit=${exit}`);
  }
  writeFileSync(outJson, serialize({ upstreamSha: sha, plantumlVersion: version, errors }));
  if (drawsOut) writeFileSync(drawsOut, `${draws.join('\n')}\n`);
  console.log(`candidates=${keys.length} stockErrors=${Object.keys(errors).length} stockDraws=${draws.length}`);
}

if (process.argv[1]?.endsWith('stock-jar-record.ts')) main(process.argv.slice(2));
