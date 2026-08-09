#!/usr/bin/env node
/**
 * Per-node positional oracle for the json family (mission A5 / T7).
 *
 * **Why this exists.** ADR-3 removed the DOT gate for `@startjson`/`@startyaml`/
 * `@starthcl`: upstream lays them out through `jsondiagram/SmetanaForJson`
 * in-process, so the jar writes no `svek-N.dot` to diff a graph against. That
 * left the whole family with a single scalar feedback signal — total document
 * dimensions — which is far too coarse to diagnose a layout. T7 wired real
 * `shape=record` nodes with field ports, regressed that scalar 7x, and had no
 * way to see WHERE the graph went wrong.
 *
 * But the jar's SVG is itself an oracle at a much finer grain: it draws every
 * node as a rect at its final position. Extracting those gives per-node x/y/
 * width/height to compare against this port's own `JsonGeometry`, which is
 * enough to separate the three things the scalar conflates — node SIZING, rank
 * SPACING, and cross-rank ALIGNMENT.
 *
 * Usage:
 *   npx tsx scripts/json-node-oracle.ts [slug]        one fixture, per-node table
 *   npx tsx scripts/json-node-oracle.ts --summary     all fixtures, aggregates
 *   npx tsx scripts/json-node-oracle.ts --type yaml   restrict the corpus
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { parseJson } from '../src/diagrams/json/parser.js';
import { parseYaml } from '../src/diagrams/yaml/parser.js';
import { parseHcl } from '../src/diagrams/hcl/parser.js';
import { layoutJson } from '../src/diagrams/json/layout.js';
import { resolveTheme } from '../src/core/theme.js';
import type { UmlSource } from '../src/core/block-extractor.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(REPO, 'test-results/dot-cache');

interface Rect { x: number; y: number; width: number; height: number }

/**
 * The node rects the jar drew, in document order, deduped.
 *
 * `TextBlockJson#drawU` emits each node's rect TWICE — once filled
 * (`backColor.bg()`) and once stroked (`ugNode.draw(fullNodeRectangle)`) at
 * identical geometry — so an undeduped scan double-counts every node. Row
 * highlight rects are excluded by construction: they are inset by 1px and
 * never share a node rect's exact origin.
 */
export function jarNodeRects(svg: string): Rect[] {
  const re = /<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)"/g;
  const count = new Map<string, number>();
  const order: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const key = `${m[1]},${m[2]},${m[3]},${m[4]}`;
    if (!count.has(key)) order.push(key);
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  // Exactly-twice is the discriminator, and it comes straight from `drawU`: a
  // NODE rect is drawn once filled (`backColor.bg()`, :283) and once stroked
  // (`ugNode.draw(fullNodeRectangle)`, :318) at identical geometry, while a row
  // HIGHLIGHT rect (`URectangle.build(trueWidth - 2, heightOfRow)`, :296) is
  // drawn once. Deduping instead of counting silently promotes every highlight
  // to a node, which is what made several fixtures report a count mismatch.
  return order
    .filter((k) => count.get(k) === 2)
    .map((k) => {
      const [x, y, width, height] = k.split(',').map(Number);
      return { x: x!, y: y!, width: width!, height: height! };
    });
}

function parseFor(type: string, block: UmlSource) {
  if (type === 'yaml') return parseYaml(block);
  if (type === 'hcl') return parseHcl(block);
  return parseJson(block);
}

function ourNodes(type: string, markup: string): Rect[] {
  const block: UmlSource = { type: type as UmlSource['type'], lines: markup.split('\n') };
  const geo = layoutJson(parseFor(type, block), resolveTheme('default'), new DeterministicMeasurer());
  return geo.nodes.map((n) => ({ x: n.x, y: n.y, width: n.width, height: n.height }));
}

function fixtures(type: string): string[] {
  const dir = join(CACHE, type);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).sort().filter((s) => existsSync(join(dir, s, 'in.svg')));
}

function loadPair(type: string, slug: string): { jar: Rect[]; ours: Rect[] } {
  const dir = join(CACHE, type, slug);
  const jar = jarNodeRects(readFileSync(join(dir, 'in.svg'), 'utf8'));
  const ours = ourNodes(type, readFileSync(join(dir, 'in.puml'), 'utf8'));
  return { jar, ours };
}

const f = (n: number): string => n.toFixed(2).padStart(9);

function reportOne(type: string, slug: string): void {
  const { jar, ours } = loadPair(type, slug);
  console.log(`\n=== ${type}/${slug} — jar ${jar.length} nodes, ours ${ours.length} ===`);
  if (jar.length !== ours.length) console.log('  *** NODE COUNT DIFFERS — pairing by index is unsound ***');
  console.log('   #        jar x/y/w/h                 ours x/y/w/h                deltas');
  const n = Math.min(jar.length, ours.length);
  for (let i = 0; i < n; i++) {
    const j = jar[i]!, o = ours[i]!;
    console.log(
      `  ${String(i).padStart(2)}  ${f(j.x)}${f(j.y)}${f(j.width)}${f(j.height)}  |` +
      `${f(o.x)}${f(o.y)}${f(o.width)}${f(o.height)}  |` +
      `${f(o.x - j.x)}${f(o.y - j.y)}${f(o.width - j.width)}${f(o.height - j.height)}`,
    );
  }
}

function reportSummary(types: string[]): void {
  let nodes = 0, exact = 0;
  const acc = { x: 0, y: 0, w: 0, h: 0 };
  const worst: Array<{ slug: string; type: string; err: number }> = [];
  for (const type of types) {
    for (const slug of fixtures(type)) {
      let err = 0;
      try {
        const { jar, ours } = loadPair(type, slug);
        if (jar.length !== ours.length) { worst.push({ slug, type, err: Infinity }); continue; }
        for (let i = 0; i < jar.length; i++) {
          const j = jar[i]!, o = ours[i]!;
          const d = { x: o.x - j.x, y: o.y - j.y, w: o.width - j.width, h: o.height - j.height };
          acc.x += Math.abs(d.x); acc.y += Math.abs(d.y);
          acc.w += Math.abs(d.w); acc.h += Math.abs(d.h);
          err += Math.abs(d.x) + Math.abs(d.y) + Math.abs(d.w) + Math.abs(d.h);
          nodes += 1;
          if (d.x === 0 && d.y === 0 && d.w === 0 && d.h === 0) exact += 1;
        }
      } catch { err = Infinity; }
      worst.push({ slug, type, err });
    }
  }
  console.log(`nodes compared: ${nodes}   exact (x,y,w,h all 0): ${exact}`);
  console.log(`mean |Δx| ${(acc.x / nodes).toFixed(2)}   |Δy| ${(acc.y / nodes).toFixed(2)}` +
    `   |Δw| ${(acc.w / nodes).toFixed(2)}   |Δh| ${(acc.h / nodes).toFixed(2)}`);
  console.log('\nworst fixtures by total node error:');
  for (const r of worst.sort((a, b) => b.err - a.err).slice(0, 8)) {
    console.log(`  ${r.type}/${r.slug}: ${r.err === Infinity ? 'ERROR/COUNT-MISMATCH' : r.err.toFixed(1)}`);
  }
}

const args = process.argv.slice(2);
const typeArg = args.indexOf('--type');
const types = typeArg >= 0 ? [args[typeArg + 1] ?? 'json'] : ['json', 'yaml', 'hcl'];
const slug = args.find((a) => !a.startsWith('--') && a !== types[0]);

if (args.includes('--summary') || slug === undefined) reportSummary(types);
else reportOne(types[0]!, slug);
