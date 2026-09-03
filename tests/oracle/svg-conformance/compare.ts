/**
 * SVG comparator for the golden-SVG conformance harness.
 *
 * Ported near-verbatim from @knowvah/dot-engine's `test/golden/compare.ts` (see
 * mission decision journal for provenance), including the positional
 * tree-walk comparator (`compareNodes`) and the CLI entry point.
 *
 * Per D7 (conformance band 0.01), `TOLERANCES` is reduced to the single
 * `deterministic` class used by this harness — the upstream `iterative`
 * class and `ENGINE_TOLERANCE_CLASS` map graphviz-engine names (neato, fdp,
 * sfdp, ...) to tolerance classes, which has no equivalent in the SVG-
 * conformance domain (there is exactly one emitter here, not a choice of
 * layout engines), so it is dropped rather than ported unused. The in-source
 * Vitest tests from the @knowvah/dot-engine original are ported to the standalone
 * `compare.test.ts` file instead, per this project's "tests never colocate
 * with source" convention.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { normalizeSvg } from './normalize.js';
import type { NormalizedNode } from './normalize.js';

// ---------------------------------------------------------------------------
// Tolerance table
// ---------------------------------------------------------------------------

export const TOLERANCES: Record<string, number> = {
  deterministic: 0.01,
};

// ---------------------------------------------------------------------------
// Diff type
// ---------------------------------------------------------------------------

export interface Diff {
  path: string;    // XPath-like: e.g. "svg/g[2]/ellipse/@cx"
  actual: string;
  expected: string;
  delta?: number;  // for numeric diffs only
  tolerance: number;
  /**
   * How much of the document this one diff stands for, defaulting to 1 when
   * absent. Only the three short-circuits below set it -- see `units`.
   */
  weight?: number;
}

// ---------------------------------------------------------------------------
// Numeric attribute detection
// ---------------------------------------------------------------------------

const NUMERIC_ATTRS = new Set([
  'x', 'y', 'cx', 'cy', 'rx', 'ry',
  'width', 'height',
  'x1', 'y1', 'x2', 'y2',
  'dx', 'dy', 'r',
]);

function parseNumber(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Does `a` differ from `b` by MORE than `tolerance`?
 *
 * The naive `Math.abs(a - b) > tolerance` is wrong at the boundary, and the
 * band's edge is a place real fixtures land. Both operands are decimal
 * strings from SVG text, so a pair whose true decimal difference EQUALS the
 * tolerance is one the strict `>` is written to accept — but IEEE-754
 * subtraction does not produce the exact decimal:
 *
 *   75.194 - 75.184  ->  0.010000000000005116   (5.1e-15 above 0.01)
 *
 * so the pair is rejected on representation error alone. That single
 * artifact is what kept `class/bipudo-23-xavu432` at 1 diff and therefore
 * out of `oracle/goldens/svg-class/ratchet.json`.
 *
 * The slack is the size of that error, not a number chosen to make a fixture
 * pass: one ULP scaled to the operands' own magnitude. At 75.19 that is
 * ~1.7e-14, which covers the 5.1e-15 overshoot above while remaining ~10
 * orders of magnitude below the smallest difference anyone would call a
 * geometry change — a 0.0100001 delta still exceeds the band by 1e-7 and
 * still fails. This RESTORES the declared 0.01 conformance band (D7); it
 * does not widen it. `tests/oracle/svg-conformance/compare.test.ts` pins
 * both directions.
 */
function exceedsTolerance(a: number, b: number, tolerance: number): boolean {
  const delta = Math.abs(a - b);
  const slack = Number.EPSILON * Math.max(Math.abs(a), Math.abs(b), 1);
  return delta - tolerance > slack;
}

// ---------------------------------------------------------------------------
// Path-data and points comparison helpers
// ---------------------------------------------------------------------------

function extractNumbers(s: string): number[] {
  const nums: number[] = [];
  const re = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const n = parseFloat(m[0]);
    if (!isNaN(n)) nums.push(n);
  }
  return nums;
}

function extractPathCommands(d: string): string[] {
  return (d.match(/[MmZzLlHhVvCcSsQqTtAa]/g) ?? []);
}

// ---------------------------------------------------------------------------
// Transform comparison helper
// ---------------------------------------------------------------------------

interface ParsedTransform {
  type: string;
  params: number[];
}

function parseTransformAttr(t: string): ParsedTransform[] {
  const result: ParsedTransform[] = [];
  const re = /(\w+)\s*\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    // Neither capture group in the pattern above is optional, so both are
    // always defined once the overall match succeeds; TS's regex-capture
    // typing can't express that, hence the required-but-unreachable `?? ''`.
    /* v8 ignore next 2 */
    const type = m[1] ?? '';
    const params = extractNumbers(m[2] ?? '');
    result.push({ type, params });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Short-circuit weighting (D5, plans/sequence-root-chrome/decisions.md)
// ---------------------------------------------------------------------------
//
// `compareNodes` returns early in three places -- node-type mismatch, tag
// mismatch, child-count mismatch -- and pushes exactly ONE diff for each,
// however large the subtree it then skips. That makes `diffs.length`
// non-monotonic in wrongness: a tag SUBSTITUTION costs 1 no matter how wrong
// its subtree is, while a tag MATCH costs one diff per differing attribute
// plus whatever recursion finds, so making a document MORE structurally
// aligned can RAISE the count. Charging each short-circuit an upper bound on
// what descending could have cost restores monotonicity for the NODE-TYPE
// and TAG short-circuits, because descending can then never cost more than
// stopping there.
//
// The CHILD-COUNT short-circuit is different: `svg-comparator-alignment`
// (2026-09-03) replaced its old sum-of-both-sides charge
// (`sumUnits(actualChildren) + sumUnits(expectedChildren)`) with LCS
// alignment (`alignChildrenByKey`, below `compareNodes`), because the sum
// was NOT actually monotone -- it grows just as readily from a CORRECT
// addition as an incorrect one. Measured on `activity-element-granularity`
// T1 (`.agent-notes/aeg-T1.md`): a verified-correct port that improved
// every element-level fidelity measure still RAISED the gated
// `weightedScore` 7.0%, because the old charge counted the size of
// whatever grew, never whether the growth was right. Alignment fixes this
// by finding real correspondence between the two sibling lists and
// charging only what is genuinely unmatched -- see `alignChildrenByKey`'s
// own doc comment for the algorithm and `plans/svg-comparator-alignment/
// decisions.md` D1 for the rejected one-line alternative and why.
//
// `units()` stays module-private. A second caller computing a subtly
// different number is the failure mode this weighting exists to remove.

/**
 * Size of a normalized subtree in comparable units: one for the node itself,
 * one per attribute, plus its children. That is an upper bound on the number
 * of diffs a descent into it could push, since every diff `compareNodes`
 * emits below a matched pair is attributable to a node or an attribute of one
 * of the two sides.
 */
function units(node: NormalizedNode): number {
  if (node.type === 'text') return 1;
  let total = 1 + Object.keys(node.attrs ?? {}).length;
  for (const child of node.children ?? []) total += units(child);
  return total;
}

function sumUnits(nodes: readonly NormalizedNode[]): number {
  let total = 0;
  for (const node of nodes) total += units(node);
  return total;
}

// ---------------------------------------------------------------------------
// Child-list alignment (svg-comparator-alignment D1)
// ---------------------------------------------------------------------------

/**
 * The key two children are aligned by, when a `[childCount]` mismatch means
 * they can no longer be compared positionally (see `alignChildrenByKey`).
 * Elements key by `tag`; text nodes key by the sentinel `'#text'` --
 * `NormalizedNode.tag` is `undefined` for `type: 'text'` nodes
 * (`normalize.ts`'s own shape), so an element and a text node can never
 * share a key and LCS can never pair across `type`.
 */
function childKey(node: NormalizedNode): string {
  /* v8 ignore next */
  return node.type === 'text' ? '#text' : (node.tag ?? '');
}

/**
 * Longest-common-subsequence alignment of two sibling lists by `childKey`,
 * used only when `actualChildren.length !== expectedChildren.length` --
 * the case `compareNodes` used to abandon entirely, charging the SUM of
 * both sides' full sizes with no attempt to find which children
 * correspond. That charge grew just as readily from a correct addition as
 * an incorrect one (`plans/svg-comparator-alignment/decisions.md` D1).
 *
 * Returns index pairs `[actualIndex, expectedIndex]` for the matched
 * subsequence, in ascending `actualIndex` order -- the order
 * `compareNodes`'s equal-length loop already walks `actualChildren` in, so
 * a matched pair's per-tag sibling counter numbers consistently with that
 * loop's own `childPath` convention. Unmatched children on either side are
 * simply absent from the returned pairs; the caller charges those at full
 * `units()` cost, exactly as the whole-subtree charge used to, but scoped
 * to only the genuinely unmatched remainder.
 *
 * Standard O(n*m) time AND SPACE DP + backtrack over SIBLING-list length,
 * not document size -- this only ever runs at a mismatch site, and sibling
 * lists in this harness's fixtures stay small (measured: the activity and
 * sequence corpora's largest is 293, `activity/jupoxe-15-sugo110`) with
 * exactly ONE outlier: `sequence/zudize-61-vomi445`'s root `<g>` has
 * **70093** direct children. An O(n*m) table at that size is untenable --
 * measured: `npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts`
 * OOM'd a 4 GB heap trying to allocate it. Above `MAX_ALIGN_PRODUCT`
 * (chosen ~7x the largest REAL fixture and ~35x smaller than the outlier,
 * so it never engages on anything but that one fixture), this returns NO
 * pairs -- which degrades the caller to exactly the OLD sum-of-both-sides
 * charge for that one node, never a correctness bug, just a missed
 * improvement on the one fixture too large to align cheaply.
 */
const MAX_ALIGN_PRODUCT = 2000 * 2000;

function alignChildrenByKey(
  actualChildren: readonly NormalizedNode[],
  expectedChildren: readonly NormalizedNode[],
): ReadonlyArray<readonly [number, number]> {
  const m = actualChildren.length;
  const n = expectedChildren.length;
  if (m * n > MAX_ALIGN_PRODUCT) return [];
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    const row = dp[i]!;
    const prevRow = dp[i - 1]!;
    for (let j = 1; j <= n; j++) {
      if (childKey(actualChildren[i - 1]!) === childKey(expectedChildren[j - 1]!)) {
        row[j] = (prevRow[j - 1] ?? 0) + 1;
      } else {
        row[j] = Math.max(prevRow[j] ?? 0, row[j - 1] ?? 0);
      }
    }
  }

  const pairs: Array<[number, number]> = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    const row = dp[i]!;
    const prevRow = dp[i - 1]!;
    if (
      childKey(actualChildren[i - 1]!) === childKey(expectedChildren[j - 1]!) &&
      row[j] === (prevRow[j - 1] ?? 0) + 1
    ) {
      pairs.push([i - 1, j - 1]);
      i--;
      j--;
    } else if ((prevRow[j] ?? 0) >= (row[j - 1] ?? 0)) {
      i--;
    } else {
      j--;
    }
  }
  pairs.reverse();
  return pairs;
}

// ---------------------------------------------------------------------------
// Tree walker
// ---------------------------------------------------------------------------

function compareNodes(
  actual: NormalizedNode,
  expected: NormalizedNode,
  path: string,
  tolerance: number,
  diffs: Diff[],
): void {
  // Structural: node type must match
  if (actual.type !== expected.type) {
    diffs.push({
      path,
      actual: actual.type,
      expected: expected.type,
      tolerance,
      weight: units(actual) + units(expected),
    });
    return; // structural mismatch — stop here
  }

  if (actual.type === 'text' && expected.type === 'text') {
    if (actual.text !== expected.text) {
      // normalizeSvg always sets `text` on type: 'text' nodes (normalize.ts
      // convertNode); the `?? ''` fallback is unreachable via compareSvg.
      /* v8 ignore next 2 */
      diffs.push({
        path,
        actual: actual.text ?? '',
        expected: expected.text ?? '',
        tolerance,
      });
    }
    return;
  }

  if (actual.type === 'element' && expected.type === 'element') {
    // Tag check
    if (actual.tag !== expected.tag) {
      // normalizeSvg always sets `tag` on type: 'element' nodes; the `?? ''`
      // fallback is unreachable via compareSvg.
      /* v8 ignore next 2 */
      diffs.push({
        path,
        actual: actual.tag ?? '',
        expected: expected.tag ?? '',
        tolerance,
        weight: units(actual) + units(expected),
      });
      return; // structural mismatch — stop here
    }

    // Attribute comparison. `?? {}` is unreachable for the same reason:
    // normalizeSvg always sets `attrs` on type: 'element' nodes.
    /* v8 ignore next 2 */
    const actualAttrs = actual.attrs ?? {};
    const expectedAttrs = expected.attrs ?? {};
    const allAttrNames = new Set([
      ...Object.keys(actualAttrs),
      ...Object.keys(expectedAttrs),
    ]);

    for (const name of [...allAttrNames].sort()) {
      const attrPath = `${path}/@${name}`;
      const av = actualAttrs[name] ?? '';
      const ev = expectedAttrs[name] ?? '';

      if (av === ev) continue;

      // Deliberate divergence (DIVERGENCES.md "Sprite and img rasters --
      // pass-through and browser scaling"): `img`/sprite atoms pass their
      // data-URI `xlink:href` through byte-verbatim instead of upstream's
      // ImageIO re-encode, so the two sides' bytes never match even when
      // both correctly reference the same image. Geometry (`x`/`y`/
      // `width`/`height`, still in NUMERIC_ATTRS above) stays strictly
      // compared -- only the href BYTES are exempted, and only down to
      // "both present and non-empty" (an empty/missing href on either
      // side is still a real diff, e.g. a resolver regression that drops
      // the image entirely).
      if (actual.tag === 'image' && name === 'xlink:href') {
        if (av === '' || ev === '') {
          diffs.push({ path: attrPath, actual: av, expected: ev, tolerance });
        }
        continue;
      }

      if (NUMERIC_ATTRS.has(name)) {
        const an = parseNumber(av);
        const en = parseNumber(ev);
        if (an !== null && en !== null) {
          const delta = Math.abs(an - en);
          if (exceedsTolerance(an, en, tolerance)) {
            diffs.push({ path: attrPath, actual: av, expected: ev, delta, tolerance });
          }
          continue;
        }
      }

      if (name === 'd') {
        // Compare command letters structurally
        const actualCmds = extractPathCommands(av);
        const expectedCmds = extractPathCommands(ev);
        if (actualCmds.join('') !== expectedCmds.join('')) {
          diffs.push({ path: attrPath, actual: av, expected: ev, tolerance });
          continue;
        }
        // Compare numeric arguments
        const actualNums = extractNumbers(av);
        const expectedNums = extractNumbers(ev);
        if (actualNums.length !== expectedNums.length) {
          diffs.push({ path: attrPath, actual: av, expected: ev, tolerance });
          continue;
        }
        // The length check above guarantees index i is valid in both
        // arrays; `?? 0` is required only by noUncheckedIndexedAccess.
        for (let i = 0; i < actualNums.length; i++) {
          /* v8 ignore next */
          const delta = Math.abs((actualNums[i] ?? 0) - (expectedNums[i] ?? 0));
          if (exceedsTolerance(actualNums[i] ?? 0, expectedNums[i] ?? 0, tolerance)) {
            diffs.push({
              path: `${attrPath}[${i}]`,
              actual: String(actualNums[i]),
              expected: String(expectedNums[i]),
              delta,
              tolerance,
            });
          }
        }
        continue;
      }

      if (name === 'points' || name === 'viewBox') {
        const actualNums = extractNumbers(av);
        const expectedNums = extractNumbers(ev);
        if (actualNums.length !== expectedNums.length) {
          diffs.push({ path: attrPath, actual: av, expected: ev, tolerance });
          continue;
        }
        // Same reasoning as the `d` numeric loop above.
        for (let i = 0; i < actualNums.length; i++) {
          /* v8 ignore next */
          const delta = Math.abs((actualNums[i] ?? 0) - (expectedNums[i] ?? 0));
          if (exceedsTolerance(actualNums[i] ?? 0, expectedNums[i] ?? 0, tolerance)) {
            diffs.push({
              path: `${attrPath}[${i}]`,
              actual: String(actualNums[i]),
              expected: String(expectedNums[i]),
              delta,
              tolerance,
            });
          }
        }
        continue;
      }

      if (name === 'transform') {
        const actualTx = parseTransformAttr(av);
        const expectedTx = parseTransformAttr(ev);
        if (actualTx.length !== expectedTx.length) {
          diffs.push({ path: attrPath, actual: av, expected: ev, tolerance });
          continue;
        }
        for (let i = 0; i < actualTx.length; i++) {
          const at = actualTx[i];
          const et = expectedTx[i];
          // The length check above guarantees index i is valid in both
          // arrays; unreachable, required only by noUncheckedIndexedAccess.
          /* v8 ignore next */
          if (at === undefined || et === undefined) continue;
          if (at.type !== et.type) {
            diffs.push({
              path: `${attrPath}[${i}].type`,
              actual: at.type,
              expected: et.type,
              tolerance,
            });
            continue;
          }
          if (at.params.length !== et.params.length) {
            diffs.push({ path: `${attrPath}[${i}]`, actual: av, expected: ev, tolerance });
            continue;
          }
          // Same reasoning: the params-length check above guarantees j
          // is a valid index in both arrays.
          for (let j = 0; j < at.params.length; j++) {
            /* v8 ignore next */
            const delta = Math.abs((at.params[j] ?? 0) - (et.params[j] ?? 0));
            if (exceedsTolerance(at.params[j] ?? 0, et.params[j] ?? 0, tolerance)) {
              diffs.push({
                path: `${attrPath}[${i}].param[${j}]`,
                actual: String(at.params[j]),
                expected: String(et.params[j]),
                delta,
                tolerance,
              });
            }
          }
        }
        continue;
      }

      // Non-numeric, non-special attribute: must match exactly
      diffs.push({ path: attrPath, actual: av, expected: ev, tolerance });
    }

    // Children comparison. The `?? []` fallback is required by
    // `NormalizedNode.children` being optional on the public interface, but
    // is unreachable via this module's own `normalizeSvg` output: every
    // element node it produces always carries a `children` array (possibly
    // empty) — see normalize.ts `convertNode`.
    /* v8 ignore next 2 */
    const actualChildren = actual.children ?? [];
    const expectedChildren = expected.children ?? [];

    if (actualChildren.length !== expectedChildren.length) {
      // LCS-align rather than abandon the subtree (D1). Matched pairs
      // recurse below for their REAL diff cost -- previously invisible
      // inside the short-circuit -- and only the unmatched remainder on
      // each side is charged at full `units()` cost.
      const pairs = alignChildrenByKey(actualChildren, expectedChildren);
      const matchedActual = new Set(pairs.map(([ai]) => ai));
      const matchedExpected = new Set(pairs.map(([, ei]) => ei));

      const matchedTagCounters: Record<string, number> = {};
      for (const [ai, ei] of pairs) {
        const ac = actualChildren[ai]!;
        const ec = expectedChildren[ei]!;
        let childPath: string;
        if (ac.type === 'element' && ac.tag !== undefined) {
          matchedTagCounters[ac.tag] = (matchedTagCounters[ac.tag] ?? 0) + 1;
          const idx = matchedTagCounters[ac.tag];
          childPath = `${path}/${ac.tag}[${idx}]`;
        } else {
          childPath = `${path}/text()[${ai + 1}]`;
        }
        compareNodes(ac, ec, childPath, tolerance, diffs);
      }

      const unmatchedActual = actualChildren.filter((_, idx) => !matchedActual.has(idx));
      const unmatchedExpected = expectedChildren.filter((_, idx) => !matchedExpected.has(idx));
      // The node and its attributes are NOT charged here: they were just
      // compared. Matched children (above) charged their own real cost via
      // recursion; this charges only the genuinely unmatched remainder --
      // guaranteed non-empty on at least one side, since the lists differ
      // in length and `pairs.length` can be at most `min(m, n)`.
      diffs.push({
        path: `${path}[childCount]`,
        actual: String(actualChildren.length),
        expected: String(expectedChildren.length),
        tolerance,
        weight: sumUnits(unmatchedActual) + sumUnits(unmatchedExpected),
      });
      return; // done: matched pairs recursed above, unmatched charged here
    }

    // Track sibling index per tag for XPath-like notation
    const tagCounters: Record<string, number> = {};
    for (let i = 0; i < actualChildren.length; i++) {
      const ac = actualChildren[i];
      const ec = expectedChildren[i];
      // Required by noUncheckedIndexedAccess; unreachable given the
      // length-equality check above guarantees index i exists in both arrays.
      /* v8 ignore next */
      if (ac === undefined || ec === undefined) continue;

      let childPath: string;
      if (ac.type === 'element' && ac.tag !== undefined) {
        tagCounters[ac.tag] = (tagCounters[ac.tag] ?? 0) + 1;
        const idx = tagCounters[ac.tag];
        childPath = `${path}/${ac.tag}[${idx}]`;
      } else {
        childPath = `${path}/text()[${i + 1}]`;
      }

      compareNodes(ac, ec, childPath, tolerance, diffs);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function compareSvg(
  actual: string,
  reference: string,
  toleranceClass: string,
  toleranceOverride?: number,
): { pass: boolean; diffs: Diff[] } {
  // The trailing `?? 0.01` is required by noUncheckedIndexedAccess on
  // `TOLERANCES[toleranceClass]`; unreachable since `deterministic` is a
  // literal, always-present key on the module-level TOLERANCES constant.
  const tolerance =
    toleranceOverride ??
    TOLERANCES[toleranceClass] ??
    /* v8 ignore next */
    (TOLERANCES['deterministic'] ?? 0.01);
  const diffs: Diff[] = [];

  const actualNorm = normalizeSvg(actual);
  const refNorm = normalizeSvg(reference);

  // normalizeSvg always returns a type: 'element' root (the <svg> tag),
  // so `tag` is always set; `?? 'svg'` is unreachable via this entry point.
  /* v8 ignore next */
  compareNodes(actualNorm, refNorm, actualNorm.tag ?? 'svg', tolerance, diffs);

  return { pass: diffs.length === 0, diffs };
}

/**
 * Total weight of a diff list: the share of the two documents left
 * unexplained by the comparison. Unlike `diffs.length` this is monotone in
 * wrongness (see the weighting note above), which is what a ratchet needs --
 * `diffs.length` remains what every other consumer reads and is unchanged.
 */
export function weightedScore(diffs: readonly Diff[]): number {
  return diffs.reduce((sum, d) => sum + (d.weight ?? 1), 0);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
//
// Not exercised by the unit-test suite: reaching it requires running this
// module as a subprocess (`node .../compare.js <a> <b> <class>`), which the
// v8 coverage provider does not instrument. Same profile as @knowvah/dot-engine's
// source CLI block. Excluded from coverage rather than left as a silent gap.

/* v8 ignore start */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [, , actualPath, refPath, toleranceClass] = process.argv;
  if (!actualPath || !refPath || !toleranceClass) {
    process.stderr.write(
      'Usage: node dist/tests/oracle/svg-conformance/compare.js ' +
        '<actualPath> <refPath> <toleranceClass>\n',
    );
    process.exit(2);
  }

  const actualSvg = readFileSync(actualPath, 'utf8');
  const refSvg = readFileSync(refPath, 'utf8');

  const { pass, diffs } = compareSvg(actualSvg, refSvg, toleranceClass);
  if (!pass) {
    const shown = diffs.slice(0, 10);
    for (const d of shown) {
      process.stderr.write(
        `DIFF ${d.path}: actual=${d.actual} expected=${d.expected}` +
          `${d.delta !== undefined ? ` delta=${d.delta.toFixed(6)}` : ''}\n`,
      );
    }
    if (diffs.length > 10) {
      process.stderr.write(`... and ${diffs.length - 10} more diff(s)\n`);
    }
    process.exit(1);
  }
  process.exit(0);
}
/* v8 ignore stop */
