/** jfp T0b: positional-residue CLI over `measureResidue` (D4).
 *  Usage:
 *    npx tsx plans/json-family-parity/tools/residue.mts <json|yaml|hcl> <slug>     one row, with byAttr
 *    npx tsx plans/json-family-parity/tools/residue.mts --all [--json <out>]        every cached row
 *  `--all` prints one line per row (conformant rows flagged); `--json <out>` writes the pin's shape,
 *  `{ rows: { "<type>/<slug>": { aligned, nodeMax, pathMax, dw, dh } | { aligned: false } } }`, for the
 *  NON-conformant rows only (rows outside the golden ratchets' conformant sets) -- the orchestrator seeds
 *  `oracle/goldens/json-family-positional.json` from it. */
import { writeFileSync } from 'node:fs';
import {
  JSON_FAMILY_TYPES,
  conformantRows,
  listCachedRows,
  measureResidue,
  toPinRow,
} from '../../../tests/oracle/svg-conformance/json-family-positional.js';
import type { JsonFamilyType, PinRow } from '../../../tests/oracle/svg-conformance/json-family-positional.js';

const USAGE = 'usage: residue.mts <json|yaml|hcl> <slug> | --all [--json <out>]';
const argv = process.argv.slice(2);

function isType(s: string | undefined): s is JsonFamilyType {
  return JSON_FAMILY_TYPES.some((t) => t === s);
}

function fmt(n: number): string {
  return n.toFixed(3);
}

function runOne(type: string | undefined, slug: string | undefined): void {
  if (!isType(type) || slug === undefined) throw new Error(USAGE);
  const r = measureResidue(type, slug);
  console.log(
    `${type}/${slug}  aligned=${String(r.aligned)} nodeMax=${fmt(r.nodeMax)} pathMax=${fmt(r.pathMax)} dw=${fmt(r.canvas.dw)} dh=${fmt(r.canvas.dh)}`,
  );
  for (const [k, v] of Object.entries(r.byAttr).sort()) if (v > 0) console.log(`  ${k}  ${fmt(v)}`);
}

function runAll(outPath: string | undefined): void {
  const conformant = conformantRows();
  const rows: Record<string, PinRow> = {};
  for (const { type, slug } of listCachedRows()) {
    const key = `${type}/${slug}`;
    const r = measureResidue(type, slug);
    const isConformant = conformant.has(key);
    console.log(
      `${key}  aligned=${String(r.aligned)} nodeMax=${fmt(r.nodeMax)} pathMax=${fmt(r.pathMax)} dw=${fmt(r.canvas.dw)} dh=${fmt(r.canvas.dh)}${isConformant ? '  [conformant]' : ''}`,
    );
    if (!isConformant) rows[key] = toPinRow(r);
  }
  const unaligned = Object.entries(rows).filter(([, v]) => v.aligned === false).map(([k]) => k);
  console.log(`non-conformant rows: ${Object.keys(rows).length}; aligned:false: ${unaligned.length} ${unaligned.join(' ')}`);
  if (outPath !== undefined) writeFileSync(outPath, `${JSON.stringify({ rows }, null, 2)}\n`);
}

if (argv[0] === '--all') {
  const j = argv.indexOf('--json');
  const out = j === -1 ? undefined : argv[j + 1];
  if (j !== -1 && out === undefined) throw new Error(USAGE);
  runAll(out);
} else {
  runOne(argv[0], argv[1]);
}
