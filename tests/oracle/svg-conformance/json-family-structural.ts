/**
 * The json family's own conformance gate — **structural** rather than
 * byte-exact.
 *
 * ## Why this family needs a different gate
 *
 * `@startjson` / `@startyaml` / `@starthcl` are laid out by Smetana upstream
 * and by `@knowvah/dot-engine` here, and that delta is an accepted divergence
 * (ADR-2b, CLAUDE.md "One layout engine"). It was VERIFIED genuine rather than
 * assumed — see `plans/a5-json-family-conformance/ledger.md`, "M1a is genuine":
 * node sizes are exact, the overall envelope is exact, and what differs is
 * within-rank coordinate assignment, because Smetana transpiles graphviz 2.38
 * while dot-engine ports modern graphviz. Two upstreams, each right for its
 * version.
 *
 * A byte-exact bar therefore measures something this port has decided not to
 * control. On the current corpus it reports ~20,000 diffs, of which ~19,760
 * are that one accepted decision restated per coordinate. That is not a
 * conformance signal; it is noise that hides real defects.
 *
 * ## What this gate measures instead
 *
 * Every diff EXCEPT positional geometry. Concretely: the same elements, in the
 * same order, with the same sizes, colours, fonts, weights, text content and
 * text lengths — everything the port controls once the engine has decided
 * where things go.
 *
 * That it catches real defects is not a claim, it is this mission's history:
 * the empty-cell `<text>`, `StringUtils.trin`, the escape-vs-character newline
 * split, the monospace NBSP rule, and the entire handwritten renderer were all
 * found as element-tally or attribute mismatches while the byte metric was
 * saturated with geometry.
 *
 * ## What is deliberately NOT excluded
 *
 * Node `width`/`height`, `rx`/`ry`, and every style attribute. Sizing is this
 * port's own (`TextBlockJson.ts`), measured exact per node, and a regression
 * there must fail. Only *placement* is out of scope.
 *
 * Shrink-only, like every other ratchet here: a fixture listed in the manifest
 * must stay clean, and one that becomes clean should be added.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';
import { renderFixtureJson } from './render-fixture-json.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, '../../../test-results/dot-cache');
const MANIFEST = join(HERE, '../../../oracle/goldens/json-family-structural.json');

/**
 * Attributes that carry WHERE a shape sits. Excluded, because that is what
 * ADR-2b hands to the layout engine.
 *
 * `points` and `d` are here because they are position-bearing, and that is a
 * real limitation worth stating plainly rather than hiding: a defect in a
 * path's SHAPE which does not change any other attribute would not be caught.
 * The element tally still constrains how many paths exist, and mission H1's
 * handwritten port was verified against raw bytes instead.
 */
const POSITIONAL_ATTRS = new Set(['x', 'y', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2', 'points', 'd']);

/** The document's own dimensions — a direct consequence of placement. */
const ROOT_DIMENSION_RE = new RegExp('^svg/@(width|height|viewBox)');

/** Built from a string, not a literal: the complexity hook mis-tokenizes a
 *  regex literal containing brackets (see `svg.ts#GRADIENT_DEF_RE`). */
const TRAILING_ATTR_RE = new RegExp('@([A-Za-z0-9-]+)(\\[\\d+\\])?$');

export function isPositionalDiff(path: string): boolean {
  if (ROOT_DIMENSION_RE.test(path)) return true;
  const m = TRAILING_ATTR_RE.exec(path);
  return m !== null && POSITIONAL_ATTRS.has(m[1]!);
}

export interface StructuralResult {
  /** Diffs remaining once placement is excluded. */
  readonly diffs: readonly string[];
}

/** Render one cached fixture and report its non-positional diffs. */
export function structuralDiffs(type: string, slug: string): StructuralResult {
  const dir = join(CACHE, type, slug);
  const actual = renderFixtureJson(readFileSync(join(dir, 'in.puml'), 'utf8'), new DeterministicMeasurer());
  const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
  const { diffs } = compareSvg(actual, golden, 'deterministic');
  return {
    diffs: diffs
      .filter((d) => !isPositionalDiff(d.path))
      .map((d) => `${d.path}: ${String(d.actual)} != ${String(d.expected)}`),
  };
}

export interface StructuralManifest {
  /** `type/slug` entries required to stay structurally clean. */
  readonly clean: readonly string[];
}

export function readManifest(): StructuralManifest {
  return JSON.parse(readFileSync(MANIFEST, 'utf8')) as StructuralManifest;
}
