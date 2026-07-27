#!/usr/bin/env node
/**
 * Creole-lexer sizer/renderer divergence spike (mission
 * creole-lexer-unification, Task 1 — MEASUREMENT ONLY, no production edit).
 *
 * The description-diagram leaf sizer (`leaf-sizing.ts#creoleVisibleText`)
 * and the renderer (`EntityImageDescriptionSupport.ts#buildLine`) run two
 * different creole lexers that disagree on unclosed `<b>` / `:`-variant /
 * `<font Name>` tags: the sizer's `parseCreole` (`core/creole.ts`) leaves
 * them literal (measured as glyph text); the renderer's
 * `classifyStripeLine` + `buildStripeAtoms`/`buildLiteralAtoms`
 * (`klimt/creole/legacy/StripeSimple.ts`) strip them. This script measures,
 * for every description golden, how each leaf/container node's max line
 * width would change if the sizer switched from the `parseCreole` path to
 * the renderer's stripe path — the go/no-go input for ADR-4
 * (`plans/creole-lexer-unification/decisions.md`).
 *
 * The "stripe path" below is a THROWAWAY, inline re-derivation of
 * `buildLine`'s dispatch (Task 2 extracts the real shared helper per
 * ADR-1) — per ADR-2, only the `kind: 'text'` atoms' concatenated text is
 * fed through the existing `measureLineWithAtoms`; per-atom font SIZE and
 * `<img>`/`<$sprite>` atom width are NOT re-added here (a documented,
 * accepted simplification of this spike, not a claim about the eventual
 * shared helper's behavior).
 *
 * Usage: `npx tsx scripts/measure-creole-lexer-delta.ts`
 * Output: one JSON line per fixture, then a summary JSON line.
 * Always exits 0 — this is a report for a human go/no-go call, not a gate.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import '../src/index.js'; // side effect: registers all diagram plugins
import { buildBlockUmls } from '../src/core/BlockUmlBuilder.js';
import { registry } from '../src/core/dispatcher.js';
import { MapIncludeStore } from '../src/core/tim/IncludeStore.js';
import { withStdlib } from '../src/core/tim/StdlibStore.js';
import { buildStdlibAssetsStore } from '../tests/helpers/stdlib-assets-store.js';
import { WidthTableMeasurer } from '../src/core/measurer.js';
import type { FontSpec, StringMeasurer } from '../src/core/measurer.js';
import { measureLineWithAtoms } from '../src/core/creole-atoms.js';
import { parseCreole } from '../src/core/creole.js';
import { resolveTextEscapes } from '../src/core/text-escapes.js';
import { classifyStripeLine } from '../src/core/klimt/creole/legacy/CreoleStripeSimpleParser.js';
import {
  buildStripeAtoms,
  buildLiteralAtoms,
  fontConfigurationForHeading,
} from '../src/core/klimt/creole/legacy/StripeSimple.js';
import type { FontConfiguration, FontStyle } from '../src/core/klimt/shape/UText.js';
import type { CreoleAtom } from '../src/core/klimt/creole/atom/Atom.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDENS = join(REPO, 'oracle', 'goldens', 'description');

/** Description-diagram default text font (matches `leaf-sizing.ts`'s
 *  callers) — relative delta only, so the exact default is not load-bearing. */
const BASE_FONT_SPEC: FontSpec = { family: 'SansSerif', size: 14 };
const BASE_FONT_CONFIG: FontConfiguration = {
  family: BASE_FONT_SPEC.family,
  size: BASE_FONT_SPEC.size,
  color: '#000000',
  styles: new Set<FontStyle>(),
};

const PX_PER_INCH = 72;
const CLASS_THRESHOLD_IN = 0.01;

/** Fixtures ADR-4 expects a SHRINK for — reported explicitly in the summary
 *  regardless of where they land in the corpus. */
const TARGET_SLUGS = ['lurupu-11-fubo915', 'gafico-37-cuma657', 'nujito-06-neca370'] as const;

// ---------------------------------------------------------------------------
// Pure width computation (current path == today's sizer; stripe path ==
// the renderer's lexer).
// ---------------------------------------------------------------------------

/** Mirrors `leaf-sizing.ts#creoleVisibleText` + `maxLineWidth`'s per-line
 *  decode order EXACTLY: creole-strip first, then `resolveTextEscapes`. */
function currentLineWidth(raw: string, measurer: StringMeasurer): number {
  const stripped = parseCreole(raw)
    .map((s) => s.text)
    .join('');
  const decoded = resolveTextEscapes(stripped);
  return measureLineWithAtoms(decoded, BASE_FONT_SPEC, measurer).width;
}

/** Concatenates only `kind: 'text'` atom text (ADR-2: inline/latex atoms
 *  are not glyph runs; their width is out of scope for this spike). */
function visibleTextFromAtoms(atoms: readonly CreoleAtom[]): string {
  return atoms
    .filter((a): a is Extract<CreoleAtom, { kind: 'text' }> => a.kind === 'text')
    .map((a) => a.text)
    .join('');
}

/** Mirrors `EntityImageDescriptionSupport.ts#buildLine`'s classification
 *  dispatch and decode order (resolveTextEscapes AFTER classification,
 *  BEFORE atom-building) — the renderer's own lexer. */
function stripeLineWidth(raw: string, measurer: StringMeasurer): number {
  const classification = classifyStripeLine(raw);
  if (classification.type === 'HORIZONTAL_LINE') return 0;
  const content = resolveTextEscapes(classification.content);
  const atoms =
    classification.type === 'LITERAL'
      ? buildLiteralAtoms(content, BASE_FONT_CONFIG)
      : buildStripeAtoms(
          content,
          classification.type === 'HEADING'
            ? fontConfigurationForHeading(BASE_FONT_CONFIG, classification.order)
            : BASE_FONT_CONFIG,
        );
  return measureLineWithAtoms(visibleTextFromAtoms(atoms), BASE_FONT_SPEC, measurer).width;
}

/** Max width over a display's lines, one path at a time. */
function maxOverLines(display: string, lineWidth: (line: string) => number): number {
  let max = 0;
  for (const raw of display.split('\n')) {
    const w = lineWidth(raw);
    if (w > max) max = w;
  }
  return max;
}

export interface NodeDelta {
  id: string;
  currentPx: number;
  stripePx: number;
  deltaPx: number;
}

/** Per-node current/stripe max-line width and the delta between them. */
export function measureNode(id: string, display: string, measurer: StringMeasurer): NodeDelta {
  const currentPx = maxOverLines(display, (l) => currentLineWidth(l, measurer));
  const stripePx = maxOverLines(display, (l) => stripeLineWidth(l, measurer));
  return { id, currentPx, stripePx, deltaPx: stripePx - currentPx };
}

// ---------------------------------------------------------------------------
// Pure classification (unit-testable in isolation).
// ---------------------------------------------------------------------------

export type DeltaClass = 'widen' | 'shrink' | 'neutral';

/** ±0.01in classification, per ADR-4. */
export function classifyDeltaIn(deltaIn: number): DeltaClass {
  if (deltaIn > CLASS_THRESHOLD_IN) return 'widen';
  if (deltaIn < -CLASS_THRESHOLD_IN) return 'shrink';
  return 'neutral';
}

/** Picks the max-|delta| node among a fixture's measured nodes — the
 *  fixture's own delta/class is driven by that one node (step 4). */
export function pickDrivingNode(nodes: readonly NodeDelta[]): NodeDelta | undefined {
  let best: NodeDelta | undefined;
  for (const n of nodes) {
    if (best === undefined || Math.abs(n.deltaPx) > Math.abs(best.deltaPx)) best = n;
  }
  return best;
}

export interface FixtureResult {
  slug: string;
  currentPx: number;
  stripePx: number;
  deltaPx: number;
  deltaIn: number;
  class: DeltaClass;
}

/** Builds a fixture's report row from its driving node. Pure — no I/O. */
export function toFixtureResult(slug: string, driver: NodeDelta): FixtureResult {
  const deltaIn = driver.deltaPx / PX_PER_INCH;
  return {
    slug,
    currentPx: driver.currentPx,
    stripePx: driver.stripePx,
    deltaPx: driver.deltaPx,
    deltaIn,
    class: classifyDeltaIn(deltaIn),
  };
}

// ---------------------------------------------------------------------------
// AST walk (defensive — parse seam, guarded per the task's skip contract).
// ---------------------------------------------------------------------------

interface NodeLike {
  id?: unknown;
  display?: unknown;
  children?: unknown;
}

/** Recursively collects every node's `{ id, display }` (leaf and container
 *  title alike — step 2: "a conservative superset is correct for a
 *  divergence spike"). Defensive: an unexpected shape at any level is
 *  simply not descended into, never thrown. */
export function collectDisplays(nodes: readonly unknown[]): Array<{ id: string; display: string }> {
  const out: Array<{ id: string; display: string }> = [];
  for (const raw of nodes) {
    if (typeof raw !== 'object' || raw === null) continue;
    const node = raw as NodeLike;
    if (typeof node.display === 'string') {
      out.push({ id: typeof node.id === 'string' ? node.id : '?', display: node.display });
    }
    if (Array.isArray(node.children)) out.push(...collectDisplays(node.children));
  }
  return out;
}

function hasNodesArray(ast: unknown): ast is { nodes: unknown[] } {
  return typeof ast === 'object' && ast !== null && Array.isArray((ast as { nodes?: unknown }).nodes);
}

/** Parses one golden's `input.puml` via the same seam `renderSync` uses
 *  (`buildBlockUmls` -> `registry.resolve` -> `plugin.parse`) and returns
 *  its nodes' displays, or `undefined` if this fixture should be skipped
 *  (empty/failed preprocessor block, parse throw, or an AST with no
 *  `nodes` array). */
function parseDisplays(puml: string): Array<{ id: string; display: string }> | undefined {
  const includeStore = withStdlib(new MapIncludeStore(), buildStdlibAssetsStore());
  const blocks = buildBlockUmls(puml, { includeStore });
  const first = blocks[0];
  if (first === undefined || !first.ok) return undefined;
  try {
    const ast: unknown = registry.resolve(first.source).parse(first.source);
    if (!hasNodesArray(ast)) return undefined;
    return collectDisplays(ast.nodes);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Fixture discovery + measurement
// ---------------------------------------------------------------------------

function goldenSlugs(): string[] {
  if (!existsSync(GOLDENS)) return [];
  return readdirSync(GOLDENS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(GOLDENS, d.name, 'input.puml')))
    .map((d) => d.name)
    .sort();
}

/** One golden's report row, or `undefined` if skipped (see `parseDisplays`
 *  and the "no measurable nodes" case). */
function measureFixture(slug: string, measurer: StringMeasurer): FixtureResult | undefined {
  const puml = readFileSync(join(GOLDENS, slug, 'input.puml'), 'utf8');
  const displays = parseDisplays(puml);
  if (displays === undefined || displays.length === 0) return undefined;
  const nodeDeltas = displays.map((d) => measureNode(d.id, d.display, measurer));
  const driver = pickDrivingNode(nodeDeltas);
  if (driver === undefined) return undefined;
  return toFixtureResult(slug, driver);
}

function runMeasurement(): { results: FixtureResult[]; skipped: number } {
  const measurer = new WidthTableMeasurer();
  const results: FixtureResult[] = [];
  let skipped = 0;
  for (const slug of goldenSlugs()) {
    const result = measureFixture(slug, measurer);
    if (result === undefined) skipped++;
    else results.push(result);
  }
  return { results, skipped };
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export interface Summary {
  widen: number;
  shrink: number;
  neutral: number;
  skipped: number;
  targets: Record<string, FixtureResult | null>;
  nonTargetWiden: string[];
  topShrinkers: FixtureResult[];
  topWideners: FixtureResult[];
}

function topByMagnitude(results: readonly FixtureResult[], n: number): FixtureResult[] {
  return [...results].sort((a, b) => Math.abs(b.deltaPx) - Math.abs(a.deltaPx)).slice(0, n);
}

/** Pure summary builder — unit-tested in isolation from fixture I/O. */
export function summarize(results: readonly FixtureResult[], skipped: number): Summary {
  const widen = results.filter((r) => r.class === 'widen');
  const shrink = results.filter((r) => r.class === 'shrink');
  const neutral = results.filter((r) => r.class === 'neutral');
  const targets: Record<string, FixtureResult | null> = {};
  for (const slug of TARGET_SLUGS) targets[slug] = results.find((r) => r.slug === slug) ?? null;
  const targetSlugSet = new Set<string>(TARGET_SLUGS);
  return {
    widen: widen.length,
    shrink: shrink.length,
    neutral: neutral.length,
    skipped,
    targets,
    nonTargetWiden: widen.filter((r) => !targetSlugSet.has(r.slug)).map((r) => r.slug),
    topShrinkers: topByMagnitude(shrink, 10),
    topWideners: topByMagnitude(widen, 10),
  };
}

/* v8 ignore start -- CLI entry point; the pure functions above (measureNode,
 * classifyDeltaIn, pickDrivingNode, toFixtureResult, collectDisplays,
 * summarize) are the unit-testable surface. This is a one-shot measurement
 * script, not production code — no test file is planned for the CLI shell. */
function main(): void {
  const { results, skipped } = runMeasurement();
  for (const r of results) process.stdout.write(`${JSON.stringify(r)}\n`);
  process.stdout.write(`${JSON.stringify({ summary: summarize(results, skipped) })}\n`);
  process.exitCode = 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
