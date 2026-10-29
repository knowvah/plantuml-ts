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
 * same order, with the same sizes, colors, fonts, weights, text content and
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
 * ## Named divergences
 *
 * A fixture whose residual diffs are a DELIBERATE divergence is listed under
 * `divergent` with a diff ceiling instead of being required clean — see
 * {@link DivergentEntry} for why a ceiling and not an attribute allowlist.
 * (The json family honoring `skinparam` was one until unwind-U1 mirrored
 * upstream's `StyleExtractor`, which keeps only `handwritten`.)
 *
 * Shrink-only, like every other ratchet here: a fixture listed in the manifest
 * must stay clean, and one that becomes clean should be added.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from './compare.js';
import { renderFixtureJson } from './render-fixture-json.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, '../../../test-results/dot-cache');
/** Authored fixtures (ddc D7): `<AUTHORED_ROOT>/<type>/<slug>.{puml,svg}`, flat. */
export const AUTHORED_ROOT = join(HERE, '../../fixtures');
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

/**
 * Fixtures whose canvas BACKGROUND rect (`svg/g[1]/rect[1]`, present because a
 * `!theme` paints one) is a degree wider/taller only through Smetana's integer
 * node sizing: it rounds every node's width/height to whole points
 * (`POINTS(ND_width(n))`, shapes__c.java:253-254, 1807-1808; `Macro.POINTS` =
 * ROUND, Macro.java:1560-1562). `yaml/vapoda-87-piku740`: the first node is
 * 21.55 wide, the jar lays its child at 5+22+37 = 64, ours at 63.55, so the
 * canvas is 216 vs 215. Same accepted delta as the root `svg/@width` already
 * excluded (CLAUDE.md "One layout engine", ruling 2026-08-09). Per fixture, not
 * by path: in other fixtures `rect[1]` is a node, whose size must stay gated.
 */
const SMETANA_ROUNDED_CANVAS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['yaml/vapoda-87-piku740', new Set(['svg/g[1]/rect[1]/@width'])],
]);

export function isPositionalDiff(path: string): boolean {
  if (ROOT_DIMENSION_RE.test(path)) return true;
  const m = TRAILING_ATTR_RE.exec(path);
  return m !== null && POSITIONAL_ATTRS.has(m[1]!);
}

export interface StructuralResult {
  /** Diffs remaining once placement is excluded. */
  readonly diffs: readonly string[];
}

/** The `.puml`/`.svg` pair of a corpus or authored fixture. */
interface FixturePair {
  readonly markup: string;
  readonly golden: string;
}

function cachedPath(type: string, slug: string, file: string): string {
  return join(CACHE, type, slug, file);
}

function authoredPath(type: string, slug: string, ext: string): string {
  return join(AUTHORED_ROOT, type, `${slug}.${ext}`);
}

/** Whether `type/slug` is a corpus row (cached oracle pair present). */
export function isCachedRow(type: string, slug: string): boolean {
  return existsSync(cachedPath(type, slug, 'in.puml'));
}

/** Authored slugs of `type`: every `<slug>.puml` with a `<slug>.svg` oracle, sorted. */
export function listAuthoredSlugs(type: string): readonly string[] {
  const dir = join(AUTHORED_ROOT, type);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.puml') && existsSync(join(dir, f.slice(0, -'.puml'.length) + '.svg')))
    .map((f) => f.slice(0, -'.puml'.length))
    .sort();
}

/** Authored slugs of `type` that also exist as a cached corpus row (must be none). */
export function authoredCachedCollisions(type: string): readonly string[] {
  return listAuthoredSlugs(type).filter((slug) => isCachedRow(type, slug));
}

function readPair(type: string, slug: string): FixturePair {
  if (isCachedRow(type, slug)) {
    return {
      markup: readFileSync(cachedPath(type, slug, 'in.puml'), 'utf8'),
      golden: readFileSync(cachedPath(type, slug, 'in.svg'), 'utf8'),
    };
  }
  return {
    markup: readFileSync(authoredPath(type, slug, 'puml'), 'utf8'),
    golden: readFileSync(authoredPath(type, slug, 'svg'), 'utf8'),
  };
}

/** Render one fixture (cached pair when it exists, else the authored pair) and report its non-positional diffs. */
export function structuralDiffs(type: string, slug: string): StructuralResult {
  const { markup, golden } = readPair(type, slug);
  const actual = renderFixtureJson(markup, new DeterministicMeasurer());
  const { diffs } = compareSvg(actual, golden, 'deterministic');
  const rounded = SMETANA_ROUNDED_CANVAS.get(`${type}/${slug}`);
  return {
    diffs: diffs
      .filter((d) => !isPositionalDiff(d.path) && !rounded?.has(d.path))
      .map((d) => `${d.path}: ${String(d.actual)} != ${String(d.expected)}`),
  };
}

/**
 * A fixture whose residual diffs are a NAMED divergence rather than a defect,
 * carrying the count they are currently allowed to reach.
 *
 * A bounded count, not a path allowlist, and deliberately so. An allowlist of
 * attribute paths would silently absorb a real regression that happened to
 * land on an already-excused attribute — and on `json/bitepo-72-vija933` the
 * excused set is `width`/`height`/`textLength`, which is most of what this
 * gate exists to protect. A ceiling cannot do that: the divergence is allowed
 * to persist at exactly its measured size and no larger.
 */
export interface DivergentEntry {
  /** Structural diffs this fixture may still have. Shrink-only, like `clean`. */
  readonly maxDiffs: number;
  /** Why, naming the DIVERGENCES.md entry that authorizes it. */
  readonly reason: string;
}

export interface StructuralManifest {
  /** `type/slug` entries required to stay structurally clean. */
  readonly clean: readonly string[];
  /** `type/slug` entries excused by a named divergence, with their ceiling. */
  readonly divergent: Readonly<Record<string, DivergentEntry>>;
}

export function readManifest(): StructuralManifest {
  return JSON.parse(readFileSync(MANIFEST, 'utf8')) as StructuralManifest;
}
