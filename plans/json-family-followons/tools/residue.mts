/** jff T0b: positional-residue CLI over `measureResidue` (D4).
 *  Usage:
 *    npx tsx plans/json-family-followons/tools/residue.mts <json|yaml|hcl> <slug> [--authored|--corpus]
 *    npx tsx plans/json-family-followons/tools/residue.mts --all [--json <out>]
 *  One row, with byAttr. A slug is resolved as a corpus row (`test-results/dot-cache/<type>/<slug>/in.{puml,svg}`)
 *  first, then as an authored row (`tests/fixtures/<type>/<slug>.{puml,svg}`). When a slug exists in BOTH
 *  places, corpus wins unless `--authored` is given (`--corpus` forces the other way; an authored fixture
 *  is checked for a cache collision by `authoredCachedCollisions`, so this is a safety valve, not a use case).
 *  `--all` prints one line per row: every corpus row (conformant ones flagged), then every authored
 *  row, labelled `authored:<type>/<slug>`. `--json <out>` writes the pin's shape,
 *  `{ rows: { "<type>/<slug>" | "authored:<type>/<slug>": { aligned, nodeMax, pathMax, dw, dh } | { aligned: false } } }`,
 *  for the NON-conformant rows only (corpus rows outside the golden ratchets' conformant sets; authored
 *  rows outside `compareSvg`'s conformance band) -- the orchestrator seeds
 *  `oracle/goldens/json-family-positional.json` from it. */
import { writeFileSync } from 'node:fs';
import {
  JSON_FAMILY_TYPES,
  conformantRows,
  isWithinConformantBand,
  listAuthoredRows,
  listCachedRows,
  measureResidue,
  rowExists,
  rowKey,
  toPinRow,
} from '../../../tests/oracle/svg-conformance/json-family-positional.js';
import type {
  JsonFamilyType,
  PinRow,
  PositionalResidue,
  ResidueSource,
} from '../../../tests/oracle/svg-conformance/json-family-positional.js';

const USAGE = 'usage: residue.mts <json|yaml|hcl> <slug> [--authored|--corpus] | --all [--json <out>]';
const argv = process.argv.slice(2);

function isType(s: string | undefined): s is JsonFamilyType {
  return JSON_FAMILY_TYPES.some((t) => t === s);
}

function fmt(n: number): string {
  return n.toFixed(3);
}

function summary(key: string, r: PositionalResidue): string {
  return `${key}  aligned=${String(r.aligned)} nodeMax=${fmt(r.nodeMax)} pathMax=${fmt(r.pathMax)} dw=${fmt(r.canvas.dw)} dh=${fmt(r.canvas.dh)}`;
}

function pickSource(type: JsonFamilyType, slug: string, flags: readonly string[]): ResidueSource {
  if (flags.includes('--authored')) return 'authored';
  if (flags.includes('--corpus')) return 'corpus';
  return rowExists(type, slug, 'corpus') ? 'corpus' : 'authored';
}

function runOne(type: string | undefined, slug: string | undefined, flags: readonly string[]): void {
  if (!isType(type) || slug === undefined) throw new Error(USAGE);
  const source = pickSource(type, slug, flags);
  const r = measureResidue(type, slug, source);
  console.log(summary(rowKey(type, slug, source), r));
  for (const [k, v] of Object.entries(r.byAttr).sort()) if (v > 0) console.log(`  ${k}  ${fmt(v)}`);
}

function runAll(outPath: string | undefined): void {
  const conformant = conformantRows();
  const rows: Record<string, PinRow> = {};
  for (const { type, slug } of listCachedRows()) {
    const key = rowKey(type, slug);
    const r = measureResidue(type, slug);
    const isConformant = conformant.has(key);
    console.log(`${summary(key, r)}${isConformant ? '  [conformant]' : ''}`);
    if (!isConformant) rows[key] = toPinRow(r);
  }
  for (const { type, slug } of listAuthoredRows()) {
    const key = rowKey(type, slug, 'authored');
    const r = measureResidue(type, slug, 'authored');
    const isConformant = isWithinConformantBand(r);
    console.log(`${summary(key, r)}${isConformant ? '  [conformant]' : ''}`);
    if (!isConformant) rows[key] = toPinRow(r);
  }
  const unaligned = Object.entries(rows)
    .filter(([, v]) => v.aligned === false)
    .map(([k]) => k);
  console.log(
    `non-conformant rows: ${Object.keys(rows).length}; aligned:false: ${unaligned.length} ${unaligned.join(' ')}`,
  );
  if (outPath !== undefined) writeFileSync(outPath, `${JSON.stringify({ rows }, null, 2)}\n`);
}

if (argv[0] === '--all') {
  const j = argv.indexOf('--json');
  const out = j === -1 ? undefined : argv[j + 1];
  if (j !== -1 && out === undefined) throw new Error(USAGE);
  runAll(out);
} else {
  runOne(argv[0], argv[1], argv.slice(2));
}
