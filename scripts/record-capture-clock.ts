/**
 * Records one capture-clock sidecar row (gantt-engine-port D3b).
 *
 *   npx jiti scripts/record-capture-clock.ts <file.puml> <epochMillis> [zone]
 *
 * No-op unless the source is clock-dependent and lives in `tests/fixtures/`
 * or `test-results/dot-cache/`. The zone defaults to `TZ`, else the host's
 * resolved zone (what the JVM's default zone follows). Called by
 * `scripts/oracle-render.sh`; `scripts/oracle-corpus.ts` calls
 * {@link recordCaptureClock} directly with its own `<type>/<id>` key.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  clockKeyForPath,
  isClockDependentSource,
  withClockEntry,
  type CaptureClockRecord,
} from '../tests/oracle/svg-conformance/capture-clock.js';

const SIDECAR = join(dirname(fileURLToPath(import.meta.url)), '../oracle/capture-clock.json');

/** The zone the JVM defaults to: `TZ` when set, else the host zone. */
export function hostZone(): string {
  return process.env['TZ'] || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Writes the sidecar row for `pumlPath` when clock-dependent; returns the key written, if any. */
export function recordCaptureClock(
  pumlPath: string,
  epochMillis: number,
  zone: string = hostZone(),
  explicitKey?: string,
): string | undefined {
  const abs = resolve(pumlPath);
  const key = explicitKey ?? clockKeyForPath(abs);
  if (key === undefined || !isClockDependentSource(readFileSync(abs, 'utf8'))) return undefined;
  const record = JSON.parse(readFileSync(SIDECAR, 'utf8')) as CaptureClockRecord;
  writeFileSync(SIDECAR, `${JSON.stringify(withClockEntry(record, key, { epochMillis, zone }), null, 2)}\n`);
  return key;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [file, millis, zone] = process.argv.slice(2);
  if (file === undefined || millis === undefined || !Number.isInteger(Number(millis))) {
    console.error('usage: record-capture-clock.ts <file.puml> <epochMillis> [zone]');
    process.exit(2);
  }
  const key = recordCaptureClock(file, Number(millis), zone);
  if (key !== undefined) console.error(`capture-clock: recorded ${key}`);
}
