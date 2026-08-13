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
      diffs.push({
        path: `${path}[childCount]`,
        actual: String(actualChildren.length),
        expected: String(expectedChildren.length),
        tolerance,
      });
      return; // structural mismatch — stop recursing into children
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
