/**
 * Description-diagram size-conformance measurement harness (mission S1L).
 *
 * The description DOT-parity ratchet (`tests/oracle/description-parity.ratchet
 * .test.ts`) pins every fixture under `oracle/goldens/description/<slug>/` at
 * structural EQUAL, but node width/height are TOLERANT there — sizes are a
 * separate, shrink-only ratchet in `oracle/goldens/description/size-backlog
 * .json` (same convention as state/object). This script measures that ratchet:
 *
 *   - For each golden fixture, render it (deterministic `WidthTableMeasurer`,
 *     stdlib assets wired like the parity test), capture every `layoutGraph()`
 *     input, and compare each pass against its committed `svek-N.dot` oracle —
 *     reusing `compareStructural`/`maxSizeDeltaIn` from `svek-dot.ts`, never
 *     reimplemented.
 *   - A pass may fail ONLY the structural checks its slug's backlogs name
 *     (`label-size-backlog.json` → `labelSizeOk`, `direction-backlog.json` →
 *     `directionOk`; the ratchets' own contract, `tests/oracle/dot-parity-
 *     backlog-data.ts`) and is then still measured for size; any other
 *     failing check is `widened` with a `structurally unequal (...)` detail.
 *   - A fixture is size-`conformant` when `maxSizeDeltaIn` ≤ 0.01in. The
 *     non-conformant remainder is pinned in `size-backlog.json`; each entry may
 *     only shrink (test asserts `delta ≤ pinned + 1e-6`). Absent slug ⇒ 0.01in
 *     conformant required.
 *
 * Also reports the conformant-among-EQUAL percentage and a per-cause bucket
 * breakdown of the non-conformant tail (drives the S1L ledger).
 *
 * IMPORTANT: `causes` bucket labels are HYPOTHESES TO VERIFY, never
 * findings. `detectCause` is a first-match regex heuristic over raw source
 * text, not a parser -- it tells you where to start looking, not what is
 * actually wrong. Every bucket opened against this classifier in mission
 * S1L was misattributed at least once before a human/agent read the actual
 * fixture (see CAUSE_PATTERNS comments for three confirmed examples). Read
 * the fixture before routing work off a bucket count.
 *
 * Usage: `npx tsx scripts/measure-description-size-deltas.ts`
 * Output: one JSON line per fixture, then a summary line (with % + buckets),
 * then exits 0 iff zero fixtures are `widened` (2 otherwise) — a genuine gate.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSync } from '../src/index.js';
import { setLayoutInputObserver } from '../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../src/core/measurer.js';
import type { DotInputGraph } from '../src/core/graph-layout.js';
import { MapIncludeStore } from '../src/core/tim/IncludeStore.js';
import { withStdlib } from '../src/core/tim/StdlibStore.js';
import {
  parseSvekDot,
  dotInputToStructural,
  compareStructural,
  SIZE_CONFORMANCE_TOLERANCE_IN,
} from '../tests/oracle/svek-dot.js';
import {
  expectedBacklogFailures,
  loadStructuralBacklogs,
  unexcusedFailures,
} from '../tests/oracle/dot-parity-backlog-data.js';
import { buildStdlibAssetsStore } from '../tests/helpers/stdlib-assets-store.js';
import { buildSpriteAssetsStore } from '../tests/helpers/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../tests/helpers/emoji-assets-store.js';
import { combineAssetStores } from '../src/core/asset-store.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDENS = join(REPO, 'oracle', 'goldens', 'description');

// ---------------------------------------------------------------------------
// Pure comparator arithmetic (unit-tested in isolation).
// ---------------------------------------------------------------------------

/** Matches the ±1e-6 tolerance the parity ratchet asserts with — a fixture
 *  within that epsilon of its allowance is `unchanged`, not float-rounding
 *  `widened`/`improved` noise. */
export const DELTA_EPSILON = 1e-6;

export type DeltaStatus = 'widened' | 'improved' | 'unchanged';

/** Classifies a measured delta against its allowance. `improved` is only
 *  meaningful for backlog fixtures (a conformant non-backlog fixture sitting
 *  below the 0.01in ceiling is `unchanged`, not "improved"). Pure, no I/O. */
export function classifyDelta(
  delta: number,
  allowed: number,
  inBacklog: boolean,
): DeltaStatus {
  if (delta > allowed + DELTA_EPSILON) return 'widened';
  if (inBacklog && delta < allowed - DELTA_EPSILON) return 'improved';
  return 'unchanged';
}

/** Container keywords that, when followed by `{`, form a cluster (not a leaf). */
const CONTAINER_KW =
  'package|node|rectangle|folder|frame|cloud|database|artifact|card|component|' +
  'together|storage|queue|stack|agent|collections|file|person|hexagon|label';

/** (regex, cause) table for `detectCause`, most-specific first. Ordering is
 *  the entire mechanism of this classifier (first array match wins,
 *  regardless of where in the source each pattern's own hit sits), so every
 *  entry below documents WHY it sits where it does -- read the comments
 *  before reordering.
 *
 *  Two structural notes that drove the current order:
 *  - `element-font` precedes `container-cluster`. A `<style>` or block-form
 *    `skinparam` selector for a container keyword (`component {`, `node {`)
 *    is syntactically IDENTICAL to a real cluster opener to the
 *    container-cluster regex -- it can't tell "this brace opens a diagram
 *    cluster" from "this brace opens a style selector". Testing the font
 *    signal first is the only way to keep a per-element font declaration
 *    (S1L-h) from being silently swallowed by the cluster bucket, which is
 *    exactly what happened to loroto-06-fano471 (`node { stereotype {
 *    FontSize 20 } }`) and undercounted S1L-h at 2 fixtures instead of 9.
 *  - Container detection itself (a container keyword opening a `{` block, or
 *    a bare `{` line) precedes the leaf package/interface/bracket checks — a
 *    `package X { … }` is a cluster (S1L-e), not a leaf tab; likewise a
 *    bracket body inside a `{}` block is cluster sizing, not display
 *    expansion. */
const CAUSE_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/<\/?(?:latex|math)>/i, 'latex'],
  [/\bwrapWidth\b/i, 'wrapWidth'],
  [/\b(?:minClassWidth|MinimumWidth)\b/i, 'min-width'],
  // Per-element font declaration, any spelling: inline skinparam
  // (`skinparam componentFontSize 18`), skinparam BLOCK form (`skinparam
  // node { StereotypeFontSize 20 }`), or a <style> selector (`<style>
  // component { FontSize 19 } </style>`). `[A-Za-z]*` (not `\bskinparam\s+`)
  // is deliberate -- it is what lets one pattern cover all three spellings,
  // since "FontSize" appears concatenated onto its element/property name
  // (`componentFontSize`, `StereotypeFontSize`) as often as standalone
  // inside a style block. `fontSpec` is one diagram-wide value at the
  // sizing layer (S1L-h), so none of these reach measureLeafNode -- a
  // distinct subsystem from the shield/tab/cluster buckets below. MUST
  // precede container-cluster -- see the ordering note above the table.
  [/[A-Za-z]*Font(?:Size|Name|Style)\b/, 'element-font'],
  [new RegExp(`^\\s*(?:${CONTAINER_KW})\\b[^\\n{]*\\{|^\\s*\\{`, 'im'), 'container-cluster'],
  [/<U\+[0-9A-Fa-f]{2,6}>/, 'emoji-unicode'],
  // Sprite names carry a bundle path (`<$archimate/interface>`), so the class
  // must admit `/` -- without it every stdlib sprite fell through to the
  // `\binterface\b` catch below and was mis-bucketed as interface-shield
  // (turasu-73-zoni468, found closing S1L-c).
  [/<\$[\w/-]+>|!include\s*</, 'sprite'],
  [/<&[\w-]+>|<:[^:>\n]+:>/, 'icon'],
  // A creole TITLED separator (`--title--` / `==title==`) draws a rule with
  // its title text, so it contributes only the TITLE's width -- not the raw
  // markup's (codabo-50-mupa164: our widest body line measures `--title1--`
  // at 62.5px where the jar measures `title1` at 37.6px).
  [/^\s*(?:-{2}[^-\n]+-{2}|={2}[^=\n]+={2})\s*$/m, 'creole-titled-separator'],
  // A quoted display left OPEN at end of line -- upstream's
  // `CommandCreateElementMultilines` joins the following source lines into
  // one display (tajadu-40-juro990).
  [/\bas\s+"[^"\n]*$/m, 'multiline-display'],
  [/^\s*(?:package|folder|artifact)\b/im, 'package-folder-tab'],
  [/\binterface\b/i, 'interface-shield'],
  [/\[[^\]]*(?:\\n|\n)[^\]]*\]|\[[^\]]{30,}\]/, 'bracket-body'],
  [/\$[A-Za-z_]\w*/, 'variable-display'],
];

/** Root-cause family of a non-conformant fixture, from its source. Heuristic
 *  (first match wins) — enough to bucket the tail for the ledger; exact
 *  per-fixture attribution is refined by hand there. */
export function detectCause(markup: string): string {
  return CAUSE_PATTERNS.find(([re]) => re.test(markup))?.[1] ?? 'other';
}

// ---------------------------------------------------------------------------
// Fixture measurement
// ---------------------------------------------------------------------------

export interface DeltaResult {
  slug: string;
  delta: number;
  allowed: number;
  status: DeltaStatus;
  conformant: boolean;
  cause?: string;
  detail?: string;
}

function svekFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /^svek-\d+\.dot$/.test(f))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]));
}

/** Renders one golden's `input.puml`, capturing every `layoutGraph()` input in
 *  pass order (stdlib assets wired exactly as the parity ratchet does, so
 *  sprite/`!include` fixtures render identically). */
function captureGraphs(markup: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(markup, {
      measurer: new WidthTableMeasurer(),
      includeStore: withStdlib(new MapIncludeStore(), buildStdlibAssetsStore()),
      // F4-f piece 1 (ADR-2: "the harness measures the same code path users
      // get"). The jar resolves `<<$archimate/x>>` and `sprite $N jar:…` off
      // its own classpath unconditionally; a browser-safe port needs the
      // bytes handed in, so a harness that omits this measures a DIFFERENT
      // diagram than the jar did. Wired for every fixture, not just the four
      // that name a sprite — `buildSpriteAssetsStore` memoizes, exactly as
      // the stdlib store above does. This is RENDER INPUT only; the gate
      // (`compareStructural`/`maxSizeDeltaIn`) is untouched.
      assetStore: combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore()),
    });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

/** Max `maxSizeDeltaIn` across a fixture's passes, or a failure reason if any
 *  pass is no longer structurally EQUAL (harder than a size drift). */
function comparePasses(
  dir: string,
  files: readonly string[],
  captured: readonly DotInputGraph[],
  excused: readonly string[],
): { maxDelta: number } | { failure: string } {
  let maxDelta = 0;
  for (let i = 0; i < files.length; i++) {
    const oracle = parseSvekDot(readFileSync(join(dir, files[i]!), 'utf8'));
    const candidate = dotInputToStructural(captured[i]!);
    const diff = compareStructural(oracle, candidate);
    // Same contract as the parity ratchets (`dot-parity-backlogs.ts`): a
    // graph may fail ONLY the checks its backlogs name (label-size /
    // direction) and is then still measurable for size; anything else is a
    // structural regression, harder than a size drift.
    const failing = unexcusedFailures(diff, excused);
    if (failing.length > 0) return { failure: `${files[i]}: structurally unequal (${failing.join(', ')})` };
    maxDelta = Math.max(maxDelta, diff.maxSizeDeltaIn);
  }
  return { maxDelta };
}

/** DOT-level node-size delta for one golden fixture. `allowed` is the backlog
 *  pin, or the 0.01in conformant ceiling for a non-backlog fixture. */
function measureFixture(slug: string, allowed: number, inBacklog: boolean, excused: readonly string[]): DeltaResult {
  const dir = join(GOLDENS, slug);
  const markup = readFileSync(join(dir, 'input.puml'), 'utf8');
  const files = svekFiles(dir);
  const captured = captureGraphs(markup);
  if (captured.length !== files.length) {
    return {
      slug, delta: Number.POSITIVE_INFINITY, allowed, status: 'widened',
      conformant: false, cause: detectCause(markup),
      detail: `captured ${captured.length} layout graph(s), expected ${files.length}`,
    };
  }
  const outcome = comparePasses(dir, files, captured, excused);
  if ('failure' in outcome) {
    return {
      slug, delta: Number.POSITIVE_INFINITY, allowed, status: 'widened',
      conformant: false, cause: detectCause(markup), detail: outcome.failure,
    };
  }
  const delta = outcome.maxDelta;
  const conformant = delta <= SIZE_CONFORMANCE_TOLERANCE_IN + DELTA_EPSILON;
  const status = classifyDelta(delta, allowed, inBacklog);
  return {
    slug, delta, allowed, status, conformant,
    ...(conformant ? {} : { cause: detectCause(markup) }),
    ...(status !== 'unchanged' ? { detail: `maxSizeDeltaIn=${delta}` } : {}),
  };
}

// ---------------------------------------------------------------------------
// Fixture discovery + backlog
// ---------------------------------------------------------------------------

function loadBacklog(): Record<string, number> {
  const path = join(GOLDENS, 'size-backlog.json');
  if (!existsSync(path)) return {};
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === '_doc') continue;
    out[k] = v as number;
  }
  return out;
}

function goldenSlugs(): string[] {
  if (!existsSync(GOLDENS)) return [];
  return readdirSync(GOLDENS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(GOLDENS, d.name, 'input.puml')))
    .map((d) => d.name)
    .sort();
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export interface Summary {
  total: number;
  conformant: number;
  conformantPct: number;
  widened: number;
  improved: number;
  unchanged: number;
  causes: Record<string, number>;
}

export function summarize(results: readonly DeltaResult[]): Summary {
  const s: Summary = {
    total: results.length, conformant: 0, conformantPct: 0,
    widened: 0, improved: 0, unchanged: 0, causes: {},
  };
  for (const r of results) {
    s[r.status] += 1;
    if (r.conformant) s.conformant += 1;
    else s.causes[r.cause ?? 'other'] = (s.causes[r.cause ?? 'other'] ?? 0) + 1;
  }
  s.conformantPct = s.total === 0 ? 0 : Math.round((s.conformant / s.total) * 1000) / 10;
  return s;
}

function runMeasurement(): DeltaResult[] {
  const backlog = loadBacklog();
  const structural = loadStructuralBacklogs(GOLDENS);
  const results: DeltaResult[] = [];
  for (const slug of goldenSlugs()) {
    const inBacklog = Object.prototype.hasOwnProperty.call(backlog, slug);
    const allowed = inBacklog ? backlog[slug]! : SIZE_CONFORMANCE_TOLERANCE_IN;
    results.push(measureFixture(slug, allowed, inBacklog, expectedBacklogFailures(slug, structural)));
  }
  return results;
}

/* v8 ignore start -- CLI entry point; the pure functions above are exercised
 * directly by tests/unit/scripts/measure-description-size-deltas.test.ts. */
function main(): void {
  const results = runMeasurement();
  for (const r of results) process.stdout.write(`${JSON.stringify(r)}\n`);
  process.stdout.write(`${JSON.stringify({ summary: summarize(results) })}\n`);
  process.exitCode = summarize(results).widened > 0 ? 2 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
