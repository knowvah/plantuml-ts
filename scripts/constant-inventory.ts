#!/usr/bin/env node
/**
 * T1 (plans/constant-single-owner): count duplicate module-level numeric
 * constant declarations under `src/`, so the consolidation mission has a
 * ratchet and a work-list.
 *
 * **What it does NOT tell you.** Equal values are evidence to investigate,
 * never grounds to merge. Two engines can hold the same number for entirely
 * unrelated reasons, and merging those couples code upstream deliberately
 * keeps apart. The mission's rule is to mirror upstream's DECLARATION COUNT,
 * not its values, and that question is answered by reading the Java — not by
 * this script. See `plans/constant-single-owner/README.md`.
 *
 * Values are compared NUMERICALLY, deliberately: `ROOT_LINE_THICKNESS` is
 * `1` in one module and `1.0` in two others: the same number, and a
 * string-compare would report it as a value collision and send the rename
 * batch after a constant that should be shared.
 *
 * Usage:
 *   npx tsx scripts/constant-inventory.ts              summary + duplicates
 *   npx tsx scripts/constant-inventory.ts --json       one JSON line per name
 *   npx tsx scripts/constant-inventory.ts --collisions only the name clashes
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

/** `const NAME = <number>;` at module level (no leading whitespace), with or
 *  without `export`. Deliberately numeric-only: strings and objects have a
 *  different risk profile and a different test, and are out of scope. */
const DECL = new RegExp('^(?:export )?const ([A-Z][A-Z0-9_]*) = ([0-9.]+);');

/** A weak signal that a declaration was ported rather than invented: a Java
 *  reference in the six lines above it. Useful for RANKING candidates, never
 *  sufficient to justify a merge. */
const CITATION = /\.java|upstream|@see/i;
const CITATION_LOOKBACK = 6;

/**
 * Duplicates that are known, explained, and deliberately not consolidated.
 * Excluded from the ratchet count so they do not read as outstanding work.
 *
 * `HACK_X_FOR_POLYGON`: upstream declares it TWICE ITSELF, both `private
 * final static double HACK_X_FOR_POLYGON = 10` — `klimt/drawing/
 * LimitFinder.java:169` and `klimt/drawing/AbstractUGraphic.java:213` — so
 * some duplication here mirrors upstream rather than diverging from it. Our
 * copies additionally cannot import from `LimitFinder.ts` (it keeps the
 * constant unexported) without breaking the ink modules' klimt-free
 * convention. Scoped out; see decision D5.
 */
const KNOWN_EXCEPTIONS = new Set(['HACK_X_FOR_POLYGON']);

interface Site {
  file: string;
  line: number;
  value: number;
  cited: boolean;
}

interface Entry {
  name: string;
  sites: Site[];
  values: number[];
  cited: boolean;
  collision: boolean;
  knownException: boolean;
}

function sourceFiles(): string[] {
  const out = execFileSync('git', ['ls-files', 'src'], { cwd: REPO, encoding: 'utf8' });
  return out.split('\n').filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
}

function scanFile(rel: string, into: Map<string, Site[]>): void {
  const lines = readFileSync(join(REPO, rel), 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = DECL.exec(lines[i]!);
    if (m === null) continue;
    const context = lines.slice(Math.max(0, i - CITATION_LOOKBACK), i).join('\n');
    const sites = into.get(m[1]!) ?? [];
    sites.push({ file: rel, line: i + 1, value: Number(m[2]), cited: CITATION.test(context) });
    into.set(m[1]!, sites);
  }
}

function collect(): Entry[] {
  const byName = new Map<string, Site[]>();
  for (const f of sourceFiles()) scanFile(f, byName);
  const entries: Entry[] = [];
  for (const [name, sites] of byName) {
    if (sites.length < 2) continue;
    const values = [...new Set(sites.map((s) => s.value))].sort((a, b) => a - b);
    entries.push({
      name,
      sites,
      values,
      cited: sites.some((s) => s.cited),
      collision: values.length > 1,
      knownException: KNOWN_EXCEPTIONS.has(name),
    });
  }
  return entries.sort(byCountThenName);
}

function byCountThenName(a: Entry, b: Entry): number {
  return b.sites.length - a.sites.length || a.name.localeCompare(b.name);
}

/** Copies beyond the first, excluding known exceptions — the mission's
 *  ratchet. Later batches must drive this strictly down. */
function redundant(entries: Entry[]): number {
  let n = 0;
  for (const e of entries) if (!e.knownException) n += e.sites.length - 1;
  return n;
}

function describe(e: Entry): string {
  const vals = e.values.map((v) => String(v)).join(' / ');
  const dirs = [...new Set(e.sites.map((s) => s.file.split('/').slice(0, -1).pop() ?? ''))].sort();
  const tags = [
    e.collision ? 'COLLISION' : '',
    e.cited ? 'cited' : '',
    e.knownException ? 'known-exception' : '',
  ].filter((t) => t !== '');
  const suffix = tags.length > 0 ? `  [${tags.join(', ')}]` : '';
  return `${String(e.sites.length).padStart(3)}x  ${e.name} = ${vals}  (${dirs.join(', ')})${suffix}`;
}

function printText(entries: Entry[], collisionsOnly: boolean): void {
  for (const e of entries) {
    if (collisionsOnly && !e.collision) continue;
    console.log(describe(e));
    if (!collisionsOnly) continue;
    for (const s of e.sites) console.log(`        ${s.value}  ${s.file}:${s.line}`);
  }
}

function printSummary(entries: Entry[]): void {
  const collisions = entries.filter((e) => e.collision);
  console.log('');
  console.log(JSON.stringify({
    summary: {
      duplicatedNames: entries.length,
      redundantDeclarations: redundant(entries),
      sameValueNames: entries.length - collisions.length,
      collisionNames: collisions.length,
      citedNames: entries.filter((e) => e.cited).length,
      knownExceptions: entries.filter((e) => e.knownException).length,
    },
  }));
}

function main(): void {
  const argv = process.argv.slice(2);
  const entries = collect();
  if (argv.includes('--json')) {
    for (const e of entries) console.log(JSON.stringify(e));
  } else {
    printText(entries, argv.includes('--collisions'));
  }
  printSummary(entries);
}

main();
