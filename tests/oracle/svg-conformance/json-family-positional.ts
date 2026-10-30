/**
 * The json family's POSITIONAL residue measure (jfp D4).
 *
 * `json-family-structural.ts` drops every position-bearing attribute
 * (`isPositionalDiff`), so a row that is structurally clean but placed wrong
 * can get worse without any gate noticing. This module measures how wrong:
 * the maximum absolute coordinate difference between our render and the jar's
 * for one fixture, split into node coordinates, path coordinates and canvas.
 *
 * ## Why magnitudes come from parsed coordinates
 *
 * `compareSvg`'s diff COUNT is not monotonic (its short-circuits charge one
 * diff each, see `comparesvg-count-not-monotonic`), so a count cannot rank two
 * renders. Both trees are normalised with `normalizeSvg` (the comparator's own
 * 6-significant-figure rounding) and walked in parallel; every tracked numeric
 * attribute contributes its raw |Δ|.
 *
 * ## `aligned`
 *
 * Magnitudes are only comparable when both trees have the same shape. A row is
 * `aligned` when (a) the structural gate's own predicate finds no non-positional
 * diff and (b) the parallel walk met no shape mismatch: differing tag, child
 * count, a tracked attribute present on one side only, or a path/points
 * attribute whose command letters or number-token count differ. An unaligned
 * row reports zero magnitudes that must not be read as "perfect".
 *
 * The pin (`oracle/goldens/json-family-positional.json`) is orchestrator-owned;
 * this module only reads it and checks a measurement against it.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { TOLERANCES, compareSvg } from './compare.js';
import { isPositionalDiff, structuralDiffs } from './json-family-structural.js';
import { normalizeSvg } from './normalize.js';
import type { NormalizedNode } from './normalize.js';
import { renderFixtureJson } from './render-fixture-json.js';

export type JsonFamilyType = 'json' | 'yaml' | 'hcl';

export const JSON_FAMILY_TYPES: readonly JsonFamilyType[] = ['json', 'yaml', 'hcl'];

export interface PositionalResidue {
  /** false ⇒ structural diffs present; magnitudes not comparable. */
  aligned: boolean;
  /** max |Δ| over non-path element coordinates (x, y, cx, cy, x1..y2, width, height). */
  nodeMax: number;
  /** max |Δ| over path `d` and polygon/polyline `points` coordinates, token-aligned. */
  pathMax: number;
  /** svg width/height (and viewBox) |Δ|. */
  canvas: { dw: number; dh: number };
  /** max |Δ| per `<tag>/@<attr>` key. */
  byAttr: Record<string, number>;
}

/** One row of the pin: measured ceilings, or `{ aligned: false }` (the structural manifest governs it). */
export type PinRow = { aligned: false } | { aligned?: true; nodeMax: number; pathMax: number; dw: number; dh: number };

export interface PositionalPin {
  rows: Record<string, PinRow>;
}

/** Slack on every pinned ceiling: float noise from subtracting 6-significant-figure decimals. */
export const PIN_EPSILON = 1e-6;

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, '../../../test-results/dot-cache');
const GOLDENS = join(HERE, '../../../oracle/goldens');
export const PIN_PATH = join(GOLDENS, 'json-family-positional.json');

/** Non-path element attributes that carry a coordinate or extent (interface contract, batch-0 overview). */
const NODE_ATTRS: readonly string[] = ['x', 'y', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2', 'width', 'height'];
/** Attributes holding a list of coordinates, compared token by token. */
const PATH_ATTRS: readonly string[] = ['d', 'points'];

const NUMBER_RE = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const PATH_COMMAND_RE = /[MmZzLlHhVvCcSsQqTtAa]/g;
const ROOT_TAG = 'svg';
const ROUND_DIGITS = 1e6;

interface Accumulator {
  aligned: boolean;
  nodeMax: number;
  pathMax: number;
  dw: number;
  dh: number;
  byAttr: Record<string, number>;
}

function numbersOf(s: string): number[] {
  return (s.match(NUMBER_RE) ?? []).map(Number);
}

function round6(n: number): number {
  return Math.round(n * ROUND_DIGITS) / ROUND_DIGITS;
}

function record(acc: Accumulator, key: string, delta: number): void {
  acc.byAttr[key] = Math.max(acc.byAttr[key] ?? 0, delta);
}

/** Pairwise |Δ| of two number lists, or `undefined` when their lengths differ. */
function tokenDeltas(a: readonly number[], e: readonly number[]): number[] | undefined {
  if (a.length !== e.length) return undefined;
  return a.map((v, i) => Math.abs(v - e[i]!));
}

function maxOf(values: readonly number[]): number {
  return values.reduce((m, v) => Math.max(m, v), 0);
}

/** A coordinate-list attribute: command letters and token count must agree, then every token is compared. */
function pathDeltas(name: string, av: string, ev: string): number[] | undefined {
  if (name === 'd' && (av.match(PATH_COMMAND_RE) ?? []).join('') !== (ev.match(PATH_COMMAND_RE) ?? []).join('')) {
    return undefined;
  }
  return tokenDeltas(numbersOf(av), numbersOf(ev));
}

function compareRootAttrs(a: Record<string, string>, e: Record<string, string>, acc: Accumulator): void {
  const dims: Array<[string, 'dw' | 'dh', number]> = [
    ['width', 'dw', 0],
    ['height', 'dh', 0],
    ['viewBox', 'dw', 2],
    ['viewBox', 'dh', 3],
  ];
  for (const [name, field, index] of dims) {
    const av = a[name];
    const ev = e[name];
    if (av === undefined && ev === undefined) continue;
    const deltas = av === undefined || ev === undefined ? undefined : tokenDeltas(numbersOf(av), numbersOf(ev));
    const delta = deltas?.[index];
    if (delta === undefined) {
      acc.aligned = false;
      continue;
    }
    acc[field] = Math.max(acc[field], delta);
    record(acc, `${ROOT_TAG}/@${name}${name === 'viewBox' ? `[${index}]` : ''}`, delta);
  }
}

function compareNodeAttrs(tag: string, a: Record<string, string>, e: Record<string, string>, acc: Accumulator): void {
  for (const name of NODE_ATTRS) {
    const av = a[name];
    const ev = e[name];
    if (av === undefined && ev === undefined) continue;
    const an = av === undefined ? NaN : parseFloat(av);
    const en = ev === undefined ? NaN : parseFloat(ev);
    if (Number.isNaN(an) || Number.isNaN(en)) {
      acc.aligned = false;
      continue;
    }
    const delta = Math.abs(an - en);
    acc.nodeMax = Math.max(acc.nodeMax, delta);
    record(acc, `${tag}/@${name}`, delta);
  }
}

function comparePathAttrs(tag: string, a: Record<string, string>, e: Record<string, string>, acc: Accumulator): void {
  for (const name of PATH_ATTRS) {
    const av = a[name];
    const ev = e[name];
    if (av === undefined && ev === undefined) continue;
    const deltas = av === undefined || ev === undefined ? undefined : pathDeltas(name, av, ev);
    if (deltas === undefined) {
      acc.aligned = false;
      continue;
    }
    const delta = maxOf(deltas);
    acc.pathMax = Math.max(acc.pathMax, delta);
    record(acc, `${tag}/@${name}`, delta);
  }
}

/** Parallel walk of two normalised trees; stops descending at the first shape mismatch of a subtree. */
function walk(actual: NormalizedNode, expected: NormalizedNode, acc: Accumulator, isRoot: boolean): void {
  if (actual.type !== expected.type || actual.tag !== expected.tag) {
    acc.aligned = false;
    return;
  }
  if (actual.type === 'text') return;
  const tag = actual.tag ?? '';
  const a = actual.attrs ?? {};
  const e = expected.attrs ?? {};
  if (isRoot) compareRootAttrs(a, e, acc);
  else compareNodeAttrs(tag, a, e, acc);
  comparePathAttrs(tag, a, e, acc);
  const ac = actual.children ?? [];
  const ec = expected.children ?? [];
  if (ac.length !== ec.length) {
    acc.aligned = false;
    return;
  }
  ac.forEach((child, i) => walk(child, ec[i]!, acc, false));
}

/** Whether `compareSvg` finds any diff the structural gate would keep (its own `isPositionalDiff` predicate). */
export function hasStructuralDiff(actual: string, golden: string): boolean {
  return compareSvg(actual, golden, 'deterministic').diffs.some((d) => !isPositionalDiff(d.path));
}

/**
 * Measure the positional residue of one rendered SVG against its oracle.
 * `structurallyClean` defaults to the bare `isPositionalDiff` predicate;
 * {@link measureResidue} passes the structural gate's verdict for the row
 * (which also honours the gate's named per-fixture exclusions).
 */
export function measureSvgResidue(
  actual: string,
  golden: string,
  structurallyClean: boolean = !hasStructuralDiff(actual, golden),
): PositionalResidue {
  const acc: Accumulator = { aligned: structurallyClean, nodeMax: 0, pathMax: 0, dw: 0, dh: 0, byAttr: {} };
  walk(normalizeSvg(actual), normalizeSvg(golden), acc, true);
  return {
    aligned: acc.aligned,
    nodeMax: round6(acc.nodeMax),
    pathMax: round6(acc.pathMax),
    canvas: { dw: round6(acc.dw), dh: round6(acc.dh) },
    byAttr: Object.fromEntries(Object.entries(acc.byAttr).map(([k, v]) => [k, round6(v)])),
  };
}

function cachedFile(type: JsonFamilyType, slug: string, file: string): string {
  return join(CACHE, type, slug, file);
}

/** Render `test-results/dot-cache/<type>/<slug>/in.puml` and measure it against that row's `in.svg`. */
export function measureResidue(type: JsonFamilyType, slug: string): PositionalResidue {
  const puml = cachedFile(type, slug, 'in.puml');
  if (!existsSync(puml)) throw new Error(`no cached fixture ${type}/${slug} at ${puml}`);
  const actual = renderFixtureJson(readFileSync(puml, 'utf8'), new DeterministicMeasurer());
  const golden = readFileSync(cachedFile(type, slug, 'in.svg'), 'utf8');
  return measureSvgResidue(actual, golden, structuralDiffs(type, slug).diffs.length === 0);
}

/** Every cached `type/slug` row of the three families that has an oracle `in.svg`, sorted per type. */
export function listCachedRows(): ReadonlyArray<{ type: JsonFamilyType; slug: string }> {
  return JSON_FAMILY_TYPES.flatMap((type) => {
    const dir = join(CACHE, type);
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .sort()
      .filter((slug) => existsSync(join(dir, slug, 'in.svg')))
      .map((slug) => ({ type, slug }));
  });
}

/** `type/slug` keys of the golden ratchets' conformant sets (`oracle/goldens/svg-<type>/ratchet.json`). */
export function conformantRows(): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const type of JSON_FAMILY_TYPES) {
    const manifest = JSON.parse(readFileSync(join(GOLDENS, `svg-${type}`, 'ratchet.json'), 'utf8')) as {
      fixtures: ReadonlyArray<{ slug: string }>;
    };
    for (const f of manifest.fixtures) keys.add(`${type}/${f.slug}`);
  }
  return keys;
}

/** The pin file, or `undefined` when it has not been seeded. */
export function readPin(path: string = PIN_PATH): PositionalPin | undefined {
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, 'utf8')) as PositionalPin;
}

/** The pin shape for one measured row (`{ aligned: false }` when its magnitudes are not comparable). */
export function toPinRow(r: PositionalResidue): PinRow {
  if (!r.aligned) return { aligned: false };
  return { aligned: true, nodeMax: r.nodeMax, pathMax: r.pathMax, dw: r.canvas.dw, dh: r.canvas.dh };
}

/**
 * A conformant row's implicit ceiling: `compareSvg`'s own conformance band, not zero. "Conformant" in the golden
 * ratchets means every delta is within `TOLERANCES.deterministic`; it does not mean byte-identical
 * (`json/babico-87-soxo095` is conformant with a 0.001 delta: the jar prints 57.638 where we print 57.637).
 */
const CONFORMANT_BAND = TOLERANCES['deterministic'] ?? 0.01;
const CONFORMANT_PIN: PinRow = {
  nodeMax: CONFORMANT_BAND,
  pathMax: CONFORMANT_BAND,
  dw: CONFORMANT_BAND,
  dh: CONFORMANT_BAND,
};

const CEILING_FIELDS = ['nodeMax', 'pathMax', 'dw', 'dh'] as const;

function ceilingViolations(key: string, measured: PositionalResidue, pinned: Exclude<PinRow, { aligned: false }>) {
  const values = {
    nodeMax: measured.nodeMax,
    pathMax: measured.pathMax,
    dw: measured.canvas.dw,
    dh: measured.canvas.dh,
  };
  return CEILING_FIELDS.filter((f) => values[f] > pinned[f] + PIN_EPSILON).map(
    (f) => `${key}: ${f} ${values[f]} exceeds its pinned ceiling ${pinned[f]}`,
  );
}

/**
 * Check one measured row against the pin. Returns the violations (empty ⇒ pass).
 * `pinned` is the row's pin entry; `conformant` marks a row in the golden
 * ratchets' conformant set, which needs no entry (implicit all-zero ceiling).
 */
export function checkRow(
  key: string,
  measured: PositionalResidue,
  pinned: PinRow | undefined,
  conformant: boolean,
): string[] {
  const row = pinned ?? (conformant ? CONFORMANT_PIN : undefined);
  if (row === undefined) return [`unpinned residue row ${key}`];
  if ('aligned' in row && row.aligned === false) {
    return measured.aligned ? [`${key}: now aligned — re-seed the pin from residue.mts`] : [];
  }
  if (!measured.aligned) return [`${key}: lost structural alignment (pinned ${JSON.stringify(row)})`];
  return ceilingViolations(key, measured, row);
}
