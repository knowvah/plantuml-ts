#!/usr/bin/env node
/**
 * Shape-match report — the mission-namespace-cluster-box measurement gate
 * (T1, `plans/namespace-cluster-box/batch-1/T1-measurement-harness.md`).
 *
 * Both standing gates are blind to this mission's work: the class DOT-parity
 * comparator (`tests/oracle/svek-dot.ts`) checks cluster MEMBERSHIP only and
 * normalizes `clusterNp0`/`clusterN`/`clusterNp1` together, so it cannot see
 * a missing protection wrapper or title table; `scripts/svg-conformance-
 * census.ts`'s `compareSvg` stops recursion at the first `childCount`
 * mismatch, so it was byte-identical across the last two real fixes on this
 * branch. This script is the replacement gate: it compares drawn PRIMITIVES
 * (position + size), not the DOM tree shape, so a moved/resized box is
 * visible even when the surrounding tree structure has changed.
 *
 * Walks `test-results/dot-cache/{class,object,state}/*\/`, renders each
 * fixture's `in.puml` with a `DeterministicMeasurer` through the same
 * helpers the oracle suites use (`render-fixture-class.ts#renderFixtureClass`
 * for BOTH class and object — object diagrams share the class engine, same
 * reasoning as `svg-conformance-census.ts`'s own doc comment;
 * `render-fixture-state.ts#renderFixtureState` for state), and compares the
 * drawn `rect`/`ellipse`/`line`/`text`/`path`/`polygon` primitives against
 * the cached jar `in.svg`.
 *
 * Two details, both load-bearing (see this task's spec):
 *   1. Match under BEST RIGID ALIGNMENT, not absolute coordinates. Document
 *      normalization moves every shape together, so an absolute comparison
 *      scores a whole-document shift as "everything wrong". Candidate
 *      offsets are collected from same-tag/same-size shape pairs; the top
 *      few by frequency, plus (0, 0), are each scored, and the best score
 *      wins.
 *   2. Compare SIZE as well as position. A shape whose `x`/`y` match but
 *      whose `width`/`height` do not is not a match — position-only
 *      comparison scores a wrongly-sized box as "matching" whenever its
 *      top-left corner happens to coincide.
 *
 * Usage: npx tsx scripts/shape-match-report.ts
 *
 * Output (stable, diffable, name-sorted — see this task's interface
 * contract): one line per fixture,
 *   <type>/<slug> <matched>/<total> <ourW>x<ourH> <jarW>x<jarH>
 * or `<type>/<slug> ERR: <message>` for a fixture that fails to render,
 * followed by two TOTAL lines. A rendering failure does not abort the run.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMParser } from '@xmldom/xmldom';
import type { Node as XmlNode } from '@xmldom/xmldom';

import type { PreprocessOptions } from '../src/core/preprocessor.js';
import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/oracle/svg-conformance/fixture-include-store.js';
import { renderFixtureClass } from '../tests/oracle/svg-conformance/render-fixture-class.js';
import { renderFixtureState } from '../tests/oracle/svg-conformance/render-fixture-state.js';

const ELEMENT_NODE = 1;

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(REPO, 'test-results', 'dot-cache');
const TYPES = ['class', 'object', 'state'] as const;

const SHAPE_TAGS = new Set(['rect', 'ellipse', 'line', 'text', 'path', 'polygon']);
const POSITION_TOL = 0.05;
const SIZE_TOL = 0.05;
const MAX_OFFSET_CANDIDATES = 5;

// ---------------------------------------------------------------------------
// Fixture discovery (mirrors scripts/svg-conformance-census.ts#listFixtureDirs)
// ---------------------------------------------------------------------------

interface FixtureDir { readonly slug: string; readonly type: string; readonly dir: string }

function listFixtureDirs(type: string): FixtureDir[] {
  const typeDir = join(CACHE_DIR, type);
  if (!existsSync(typeDir)) return [];
  const out: FixtureDir[] = [];
  for (const slug of readdirSync(typeDir)) {
    const dir = join(typeDir, slug);
    if (!statSync(dir).isDirectory()) continue;
    if (!existsSync(join(dir, '.done'))) continue;
    if (!existsSync(join(dir, 'in.puml')) || !existsSync(join(dir, 'in.svg'))) continue;
    out.push({ slug, type, dir });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

const NUMBER_RE = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

function round6(n: number): number {
  return isFinite(n) ? parseFloat(n.toPrecision(6)) : n;
}

function parseLength(raw: string): number {
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : n;
}

function numbersFrom(s: string): number[] {
  const nums: number[] = [];
  for (const m of s.matchAll(NUMBER_RE)) {
    const n = parseFloat(m[0]);
    if (!isNaN(n)) nums.push(n);
  }
  return nums;
}

/** Min-corner + bounding-box size over a flat (x, y, x, y, ...) coordinate
 * list — used for `path`'s `d` and `polygon`'s `points`, per this task's
 * spec ("use the min corner of the coordinate list"). */
function bboxFromCoords(nums: readonly number[]): { x: number; y: number; width: number; height: number } | undefined {
  if (nums.length < 2) return undefined;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i] ?? 0;
    const y = nums[i + 1] ?? 0;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// ---------------------------------------------------------------------------
// Per-shape geometry extraction
// ---------------------------------------------------------------------------

interface Shape { readonly tag: string; readonly x: number; readonly y: number; readonly width: number; readonly height: number }

function attrNum(el: Element, name: string): number {
  const raw = el.getAttribute(name);
  if (raw === null) return 0;
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : n;
}

function rectShape(el: Element): Shape {
  return { tag: 'rect', x: attrNum(el, 'x'), y: attrNum(el, 'y'), width: attrNum(el, 'width'), height: attrNum(el, 'height') };
}

function ellipseShape(el: Element): Shape {
  const cx = attrNum(el, 'cx');
  const cy = attrNum(el, 'cy');
  const rx = attrNum(el, 'rx');
  const ry = attrNum(el, 'ry');
  return { tag: 'ellipse', x: cx - rx, y: cy - ry, width: 2 * rx, height: 2 * ry };
}

function lineShape(el: Element): Shape {
  const x1 = attrNum(el, 'x1');
  const y1 = attrNum(el, 'y1');
  const x2 = attrNum(el, 'x2');
  const y2 = attrNum(el, 'y2');
  return { tag: 'line', x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
}

// SVG `<text>` carries no width/height attribute — glyph advance width isn't
// in the markup at all — so text shapes compare on POSITION only. Both
// sides report (0, 0) for width/height, which makes `sizeMatches` a no-op
// for this tag rather than a spurious mismatch.
function textShape(el: Element): Shape {
  return { tag: 'text', x: attrNum(el, 'x'), y: attrNum(el, 'y'), width: 0, height: 0 };
}

function pathShape(el: Element): Shape | undefined {
  const d = el.getAttribute('d');
  if (d === null) return undefined;
  const box = bboxFromCoords(numbersFrom(d));
  return box === undefined ? undefined : { tag: 'path', ...box };
}

function polygonShape(el: Element): Shape | undefined {
  const points = el.getAttribute('points');
  if (points === null) return undefined;
  const box = bboxFromCoords(numbersFrom(points));
  return box === undefined ? undefined : { tag: 'polygon', ...box };
}

function shapeFromElement(el: Element): Shape | undefined {
  switch (el.tagName) {
    case 'rect': return rectShape(el);
    case 'ellipse': return ellipseShape(el);
    case 'line': return lineShape(el);
    case 'text': return textShape(el);
    case 'path': return pathShape(el);
    case 'polygon': return polygonShape(el);
    default: return undefined;
  }
}

function roundShape(s: Shape): Shape {
  return { tag: s.tag, x: round6(s.x), y: round6(s.y), width: round6(s.width), height: round6(s.height) };
}

function walkForShapes(node: XmlNode, out: Shape[]): void {
  if (node.nodeType !== ELEMENT_NODE) return;
  const el = node as unknown as Element;
  if (SHAPE_TAGS.has(el.tagName)) {
    const shape = shapeFromElement(el);
    if (shape !== undefined) out.push(roundShape(shape));
  }
  const children = el.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children.item(i);
    if (child !== null) walkForShapes(child as unknown as XmlNode, out);
  }
}

interface DocumentGeometry { readonly shapes: readonly Shape[]; readonly width: number; readonly height: number }

function extractDocument(svgText: string): DocumentGeometry {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  let root: Element | undefined;
  const children = doc.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children.item(i);
    if (child !== null && child.nodeType === ELEMENT_NODE) { root = child as unknown as Element; break; }
  }
  if (root === undefined) throw new Error('extractDocument: no root <svg> element');
  const shapes: Shape[] = [];
  walkForShapes(root as unknown as XmlNode, shapes);
  return {
    shapes,
    width: round6(parseLength(root.getAttribute('width') ?? '0')),
    height: round6(parseLength(root.getAttribute('height') ?? '0')),
  };
}

// ---------------------------------------------------------------------------
// Best-rigid-alignment matching
// ---------------------------------------------------------------------------

function sizeMatches(a: Shape, b: Shape): boolean {
  return a.tag === b.tag && Math.abs(a.width - b.width) <= SIZE_TOL && Math.abs(a.height - b.height) <= SIZE_TOL;
}

/** Candidate (dx, dy) offsets, ranked by how many same-tag/same-size shape
 * pairs agree on them — the top few, plus (0, 0) as the null hypothesis. */
function collectCandidateOffsets(ours: readonly Shape[], jars: readonly Shape[]): Array<{ dx: number; dy: number }> {
  const freq = new Map<string, { dx: number; dy: number; count: number }>();
  for (const o of ours) {
    for (const j of jars) {
      if (!sizeMatches(o, j)) continue;
      const dx = round6(j.x - o.x);
      const dy = round6(j.y - o.y);
      const key = `${dx},${dy}`;
      const existing = freq.get(key);
      if (existing !== undefined) existing.count++;
      else freq.set(key, { dx, dy, count: 1 });
    }
  }
  const ranked = [...freq.values()].sort((a, b) => b.count - a.count).slice(0, MAX_OFFSET_CANDIDATES);
  const offsets = ranked.map((e) => ({ dx: e.dx, dy: e.dy }));
  if (!offsets.some((o) => o.dx === 0 && o.dy === 0)) offsets.push({ dx: 0, dy: 0 });
  return offsets;
}

/** Greedy bipartite match count at a fixed offset: each of our shapes claims
 * the first not-yet-claimed jar shape with matching tag, size, and
 * post-offset position. */
function scoreOffset(ours: readonly Shape[], jars: readonly Shape[], dx: number, dy: number): number {
  const used = new Array<boolean>(jars.length).fill(false);
  let matched = 0;
  for (const o of ours) {
    const tx = o.x + dx;
    const ty = o.y + dy;
    for (let i = 0; i < jars.length; i++) {
      if (used[i]) continue;
      const j = jars[i];
      if (j === undefined || !sizeMatches(o, j)) continue;
      if (Math.abs(tx - j.x) > POSITION_TOL || Math.abs(ty - j.y) > POSITION_TOL) continue;
      used[i] = true;
      matched++;
      break;
    }
  }
  return matched;
}

function bestAlignmentScore(ours: readonly Shape[], jars: readonly Shape[]): number {
  const candidates = collectCandidateOffsets(ours, jars);
  let best = 0;
  for (const { dx, dy } of candidates) {
    const score = scoreOffset(ours, jars, dx, dy);
    if (score > best) best = score;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Render dispatch
// ---------------------------------------------------------------------------


function renderOurs(type: string, markup: string): string {
  const options: PreprocessOptions = { includeStore: fixtureIncludeStore() };
  const measurer = new DeterministicMeasurer();
  if (type === 'state') return renderFixtureState(markup, measurer, options);
  return renderFixtureClass(markup, measurer, options); // class AND object share the class engine
}

// ---------------------------------------------------------------------------
// Per-fixture comparison
// ---------------------------------------------------------------------------

interface FixtureResult {
  readonly type: string;
  readonly slug: string;
  readonly error?: string;
  readonly matched?: number;
  readonly total?: number;
  readonly ourW?: number;
  readonly ourH?: number;
  readonly jarW?: number;
  readonly jarH?: number;
}

function compareFixture(f: FixtureDir): FixtureResult {
  try {
    const markup = readFileSync(join(f.dir, 'in.puml'), 'utf-8');
    const jarSvg = readFileSync(join(f.dir, 'in.svg'), 'utf-8');
    const oursSvg = renderOurs(f.type, markup);
    const ours = extractDocument(oursSvg);
    const jar = extractDocument(jarSvg);
    const matched = bestAlignmentScore(ours.shapes, jar.shapes);
    const total = Math.max(ours.shapes.length, jar.shapes.length);
    return { type: f.type, slug: f.slug, matched, total, ourW: ours.width, ourH: ours.height, jarW: jar.width, jarH: jar.height };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { type: f.type, slug: f.slug, error: message };
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(3);
}

function formatLine(r: FixtureResult): string {
  const label = `${r.type}/${r.slug}`;
  if (r.error !== undefined) return `${label} ERR: ${r.error}`;
  return `${label} ${r.matched}/${r.total} ${formatNum(r.ourW ?? 0)}x${formatNum(r.ourH ?? 0)} ${formatNum(r.jarW ?? 0)}x${formatNum(r.jarH ?? 0)}`;
}

function main(): void {
  const fixtures = TYPES.flatMap((t) => listFixtureDirs(t)).sort((a, b) =>
    (a.type + '/' + a.slug).localeCompare(b.type + '/' + b.slug),
  );

  let docSizeExact = 0;
  let totalMatched = 0;
  for (const f of fixtures) {
    const r = compareFixture(f);
    console.log(formatLine(r));
    if (r.error !== undefined) continue;
    if (r.ourW === r.jarW && r.ourH === r.jarH) docSizeExact++;
    totalMatched += r.matched ?? 0;
  }

  console.log(`TOTAL doc-size-exact: ${docSizeExact}/${fixtures.length}`);
  console.log(`TOTAL matched-shapes: ${totalMatched}`);
}

main();
