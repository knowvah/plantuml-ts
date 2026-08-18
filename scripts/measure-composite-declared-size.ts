#!/usr/bin/env node
/**
 * T1 (plans/state-composite-inner-canvas): compare the node sizes this port
 * DECLARES to graphviz against the sizes jar declared, per svek scope, over
 * the whole state dot-cache.
 *
 * **Why this harness exists.** A state composite reaches the outer scope as
 * a plain node with a `width`/`height` in inches, and jar's cached
 * `svek-N.dot` records exactly what it declared:
 *
 * ```
 * sh0012 [shape=rect,style=rounded,label="",width=5.449097,height=3.555556,...]
 * ```
 * `test-results/dot-cache/state/bemena-23-zebu249/svek-2.dot`
 *
 * That is an EXACT, EXHAUSTIVE, SVG-free oracle, and no standing gate uses
 * it this way: the DOT-parity gate compares structure and folds size into a
 * single `maxSizeDelta`; `measure-state-size-deltas.ts` is backlog-gated and
 * tighten-only; the SVG census stops recursing at a `childCount` mismatch,
 * which most composite fixtures have.
 *
 * **Pairing, and its one honest limitation.** Node ids are NOT comparable:
 * this port appends synthetic `__init_*` nodes in a different order than
 * jar, so `shNNNN` numbering diverges (a known, recorded divergence — see
 * `.agent-notes/class-ink-shared-offset-groups.md` item (c)'s ruled-out
 * list). Scopes pair by index, which the DOT-parity gate already relies on
 * and which holds for state at 268/268. Within a scope, nodes pair by
 * SORTED value, per axis.
 *
 * Pairing per axis is deliberately finer than `svek-dot.ts#sizeDeltas`,
 * which pools widths and heights into one sorted array — that is enough for
 * a max-delta scalar but cannot attribute a delta to a node or an axis, and
 * attribution is this harness's whole point. The limitation that remains:
 * sorted pairing can mis-attribute when two nodes in one scope are close in
 * size and one of them is wrong. Rows are therefore reported with both
 * values, so a mis-pairing is visible rather than silent.
 *
 * Declaration-order pairing (METRIC-AUDIT §3 "Candidate B") was tried in
 * SI29/T0 and rejected: our DOT declares nested-cluster siblings in a
 * different relative order than the jar (the `[*]` pseudo-node lands
 * elsewhere — `bemena-23-zebu249/svek-2.dot:10-11` vs ours), so positional
 * pairing swaps sizes between real nodes and 38/148 mismatched groups change.
 * METRIC-AUDIT proved sorted is the error-minimising bijection (§2) and
 * that real-node COUNTS align (§3), never ORDER. Ruling: `plans/
 * state-declared-size-fix/decisions.md` D4 (amended 2026-08-18).
 *
 * Usage:
 *   npx tsx scripts/measure-composite-declared-size.ts            all state fixtures
 *   npx tsx scripts/measure-composite-declared-size.ts <slug>…    named fixtures
 *   npx tsx scripts/measure-composite-declared-size.ts --mismatched-only
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../src/index.js';
import { setLayoutInputObserver } from '../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../src/core/measurer.js';
import type { DotInputGraph } from '../src/core/graph-layout.js';
import { parseSvekDot, dotInputToStructural } from '../tests/oracle/svek-dot.js';
import type { StructuralGraph } from '../tests/oracle/svek-dot.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(REPO, 'test-results', 'dot-cache', 'state');
const SVEK_DOT_RE = new RegExp('^svek-([0-9]+)\\.dot$');
const PX_PER_INCH = 72;

/** Inches, to the 6 decimals both sides emit — below this is formatting
 *  noise, not a size difference. */
const EXACT_EPSILON = 5e-7;

interface Row {
  fixture: string;
  scope: number;
  axis: 'width' | 'height';
  index: number;
  ours: number;
  jar: number;
  deltaPx: number;
  match: boolean;
  /** A mismatch of ONE unit in the 6th decimal — e.g. 3.555555 against
   *  jar's 3.555556, i.e. 7e-5 px. That is the last digit of the shared
   *  `toFixed(6)` emission disagreeing, not a size defect, and it is
   *  reported separately so it cannot swamp the real signal. Distinguishing
   *  it is not the same as ignoring it: it says our arithmetic lands a hair
   *  under jar's where jar rounds up, which is worth knowing and is NOT
   *  what this mission is fixing. */
  lastDigit: boolean;
}

function ourInputs(markup: string): DotInputGraph[] {
  const inputs: DotInputGraph[] = [];
  setLayoutInputObserver((g) => inputs.push(g));
  try {
    renderSync(markup, { measurer: new WidthTableMeasurer() });
  } catch {
    /* fixture that does not render is reported as unmatched below */
  } finally {
    setLayoutInputObserver(undefined);
  }
  return inputs;
}

function jarScopes(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => SVEK_DOT_RE.test(f))
    .sort((a, b) => Number(SVEK_DOT_RE.exec(a)![1]) - Number(SVEK_DOT_RE.exec(b)![1]))
    .map((f) => readFileSync(join(dir, f), 'utf8'));
}

const ascending = (a: number, b: number): number => a - b;

/** Both sides emit 6 decimals, so anything under {@link EXACT_EPSILON} is
 *  formatting noise rather than a size difference.
 *
 *  Named rather than inlined as `Math.abs(a - b) < EXACT_EPSILON` in the
 *  object literal below because lizard's TypeScript reader treats a bare
 *  `<` in an object-literal property VALUE as the start of a generic type
 *  argument list, never finds the closing `>`, and swallows the rest of the
 *  file into the enclosing function — reported here as `axisRows` at 77
 *  NLOC / CCN 15 / 88 length for a 20-line function, with every later
 *  function missing from its output. A `<` in a `for` condition is handled
 *  fine; it is this position specifically. See
 *  `.agent-notes/lizard-lt-in-object-literal.md`. */
function isExact(a: number, b: number): boolean {
  return Math.abs(a - b) < EXACT_EPSILON;
}

/** One unit in the 6th decimal, give or take float noise — see
 *  {@link Row.lastDigit}. */
function isLastDigit(a: number, b: number): boolean {
  const d = Math.abs(a - b);
  return d >= EXACT_EPSILON && d <= 1.5e-6;
}

/** One axis of a graph's declared node sizes, sorted — the pairing key.
 *  Extracted so `axisRows` holds no nested closure: lizard's `forgive` flag
 *  is reset by every inner arrow function that closes inside a body, and its
 *  NLOC attribution for this file was wildly off with the closures inline
 *  (83 NLOC reported for a 20-line function). See
 *  `.agent-notes/N16-lizard-forgive-nested-closures.md`. */
function sortedAxis(g: StructuralGraph, axis: 'width' | 'height'): number[] {
  const out: number[] = [];
  for (const n of g.nodes) out.push(n[axis]);
  return out.sort(ascending);
}

interface AxisCtx {
  fixture: string;
  scope: number;
  axis: 'width' | 'height';
}

function axisRows(ctx: AxisCtx, oracle: StructuralGraph, ours: StructuralGraph): Row[] {
  const o = sortedAxis(oracle, ctx.axis);
  const c = sortedAxis(ours, ctx.axis);
  const rows: Row[] = [];
  for (let i = 0; i < Math.min(o.length, c.length); i++) {
    const jar = o[i]!;
    const mine = c[i]!;
    rows.push({
      fixture: ctx.fixture, scope: ctx.scope, axis: ctx.axis, index: i,
      ours: mine, jar,
      deltaPx: (mine - jar) * PX_PER_INCH,
      match: isExact(mine, jar),
      lastDigit: isLastDigit(mine, jar),
    });
  }
  return rows;
}

interface Outcome {
  rows: Row[];
  /** Scope-count or node-count disagreement — the pairing cannot be trusted,
   *  so the fixture contributes no rows and is counted separately. */
  unmatched: boolean;
}

function measureFixture(slug: string): Outcome {
  const dir = join(CACHE, slug);
  const puml = join(dir, 'in.puml');
  if (!existsSync(puml)) return { rows: [], unmatched: true };

  const dots = jarScopes(dir);
  const inputs = ourInputs(readFileSync(puml, 'utf8'));
  if (dots.length === 0 && inputs.length === 0) return { rows: [], unmatched: false };
  if (dots.length !== inputs.length) return { rows: [], unmatched: true };

  const rows: Row[] = [];
  for (let s = 0; s < dots.length; s++) {
    const oracle = parseSvekDot(dots[s]!);
    const ours = dotInputToStructural(inputs[s]!);
    if (oracle.nodes.length !== ours.nodes.length) return { rows: [], unmatched: true };
    rows.push(...axisRows({ fixture: slug, scope: s + 1, axis: 'width' }, oracle, ours));
    rows.push(...axisRows({ fixture: slug, scope: s + 1, axis: 'height' }, oracle, ours));
  }
  return { rows, unmatched: false };
}

const isFlag = (a: string): boolean => a.startsWith('--');
const hasPuml = (d: string): boolean => existsSync(join(CACHE, d, 'in.puml'));

function resolveSlugs(argv: string[]): string[] {
  const named = argv.filter((a) => !isFlag(a));
  if (named.length > 0) return named;
  return readdirSync(CACHE).filter(hasPuml).sort();
}

interface Totals {
  exact: number;
  mismatched: number;
  lastDigit: number;
  unmatched: number;
  dirty: Set<string>;
}

function tallyFixture(slug: string, mismatchedOnly: boolean, t: Totals): void {
  const { rows, unmatched: bad } = measureFixture(slug);
  if (bad) {
    t.unmatched++;
    console.log(JSON.stringify({ fixture: slug, unmatched: true }));
    return;
  }
  for (const r of rows) {
    if (r.match) t.exact++;
    else if (r.lastDigit) t.lastDigit++;
    else {
      t.mismatched++;
      t.dirty.add(r.fixture);
    }
    if (!mismatchedOnly || !r.match) console.log(JSON.stringify(r));
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const mismatchedOnly = argv.includes('--mismatched-only');
  const slugs = resolveSlugs(argv);
  const t: Totals = { exact: 0, mismatched: 0, lastDigit: 0, unmatched: 0, dirty: new Set<string>() };

  for (const slug of slugs) tallyFixture(slug, mismatchedOnly, t);

  console.log(JSON.stringify({
    summary: {
      fixtures: slugs.length,
      declarations: t.exact + t.mismatched + t.lastDigit,
      exact: t.exact,
      mismatched: t.mismatched,
      lastDigitOnly: t.lastDigit,
      unmatchedFixtures: t.unmatched,
      dirtyFixtures: t.dirty.size,
    },
  }));
}

main();
