/**
 * Per-slug drill-down for the DOT-sync report: prints the oracle's svek DOT and
 * ours side by side, then the per-check StructuralDiff with the underlying
 * values for each failing check. Split out of dot-sync-report.ts (file-size
 * limit); owns the check list so the report can aggregate over the same set.
 * Also home to stripLayoutPragma (same file-size reason) — smetana/vizjs
 * layout-pragma stripping for the oracle capture, per DIVERGENCES.md.
 */
import type { DotInputGraph } from '../src/core/graph-layout.js';
import { toSvekDot } from '../src/core/svek-dot-emit.js';
import {
  parseSvekDot,
  compareStructural,
  degreeSequence,
  type StructuralGraph,
  type StructuralDiff,
} from '../tests/oracle/svek-dot.js';

export const CHECKS = [
  'nodeCountOk',
  'edgeCountOk',
  'degreeOk',
  'directionOk',
  'minlenOk',
  'shapeOk',
  'labelOk',
  'labelSizeOk',
  'portOk',
  'clusterOk',
  'rankdirOk',
  'nodesepOk',
  'ranksepOk',
  'splinesOk',
] as const;
export type Check = (typeof CHECKS)[number];

/** Matches a whole `!pragma layout smetana|vizjs` line, case-insensitive.
 *  `!pragma layout elk` is deliberately excluded — elk is a genuinely
 *  different algorithm and stays oracle-blind (DIVERGENCES.md
 *  section "!pragma layout smetana|vizjs"). */
const SMETANA_VIZJS_PRAGMA_RE = /^\s*!pragma\s+layout\s+(smetana|vizjs)\s*\r?$/i;

/** Strips smetana/vizjs layout-pragma lines (whole line) from `markup` so
 *  the oracle jar shells to real graphviz and dumps svek-N.dot instead of
 *  going oracle-blind. `!pragma layout elk` lines are left untouched. */
export function stripLayoutPragma(markup: string): string {
  return markup
    .split('\n')
    .filter((line) => !SMETANA_VIZJS_PRAGMA_RE.test(line))
    .join('\n');
}

/** Matches the optional DIAGRAM NAME argument on any `@start…` directive —
 *  `@startuml Test`, `@startcreole math-Page-2`. Anchored to the start of a
 *  line so a `@startuml` appearing inside creole/quoted content is untouched. */
const START_DIRECTIVE_NAME_RE = /^([ \t]*@start[A-Za-z_]+)[ \t]+\S.*$/gm;

/**
 * Drops the diagram-name argument from every `@start…` line.
 *
 * **Why the oracle caches need this.** The jar names its output file after
 * the DIAGRAM, not the source file, so `@startuml Test` in
 * `somuke-94-buzi673.puml` renders to `Test.svg`. Both caches key on the
 * slug — `dot-sync-fixtures.ts#missingCanonicalSlugs` looks for
 * `<slug>.svg` and `taggedSlugs` derives the slug from the filename — so a
 * named fixture is permanently "missing", never gets a
 * `data-diagram-type` tag, and drops out of its type's denominator. It
 * cost state DOT-parity one fixture (267 reported where the corpus has
 * 268) until this was found.
 *
 * **Why stripping rather than renaming the output.** The name has no
 * rendering effect — verified by rendering `somuke-94-buzi673` both ways
 * through the oracle jar with `-nometadata`, byte-identical SVG — and
 * stripping keeps the jar's output named after the SOURCE file, which is
 * the slug and therefore unique. Renaming after the fact would leave two
 * fixtures that happen to share a diagram name overwriting each other in
 * the shared batch output directory.
 *
 * 18 of the 5848 enumerated fixtures carry a name (4 `@startuml`, 14
 * `@startcreole`), so this is rare but silent, which is the bad
 * combination.
 */
export function stripDiagramName(markup: string): string {
  return markup.replace(START_DIRECTIVE_NAME_RE, '$1');
}

const shapesOf = (g: StructuralGraph): string[] => g.nodes.map((n) => n.shape).sort();
/** Mirrors `svek-dot.ts#sortedPorts` — `-` marks an endpoint with no port. */
const portsOf = (g: StructuralGraph): string[] =>
  g.edges.flatMap((e) => [e.fromPort ?? '-', e.toPort ?? '-']).sort();
const minlensOf = (g: StructuralGraph): number[] =>
  g.edges.map((e) => e.minlen).sort((x, y) => x - y);
const clusterSizesOf = (g: StructuralGraph): number[] =>
  g.clusters.map((c) => c.memberCount).sort((x, y) => x - y);
const labelCountsOf = (g: StructuralGraph): [number, number, number, number] => [
  g.edges.filter((e) => e.hasLabel).length,
  g.edges.filter((e) => e.hasTailLabel).length,
  g.edges.filter((e) => e.hasHeadLabel).length,
  g.edges.filter((e) => e.hasXLabel).length,
];

/** B31: the DIRECTED in:out degree multiset the comparator's `directionOk`
 *  compares -- kept id-agnostic for the same reason `degreeSequence` is.
 *  Mirrors `svek-dot.ts#degreeSequenceDirected`; duplicated rather than
 *  exported so the comparator's own surface stays minimal. */
const directedDegreesOf = (g: StructuralGraph): string[] => {
  const inDeg = new Map<string, number>();
  const outDeg = new Map<string, number>();
  for (const n of g.nodes) {
    inDeg.set(n.id, 0);
    outDeg.set(n.id, 0);
  }
  for (const e of g.edges) {
    outDeg.set(e.from, (outDeg.get(e.from) ?? 0) + 1);
    inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
  }
  return [...new Set([...inDeg.keys(), ...outDeg.keys()])]
    .map((id) => `${inDeg.get(id) ?? 0}:${outDeg.get(id) ?? 0}`)
    .sort();
};

interface CheckDetail {
  label: string;
  values: (o: StructuralGraph, c: StructuralGraph) => [unknown, unknown];
}

/** D7 (edge-label-box, 2026-08-15): the reserved label boxes the comparator's
 *  `labelSizeOk` compares, tagged by kind. Mirrors
 *  `svek-dot.ts#sortedLabelBoxes`; duplicated for the same reason
 *  `directedDegreesOf` is. */
const labelBoxesOf = (g: StructuralGraph): string[] =>
  g.edges
    .flatMap((e) => [
      e.labelBox === undefined ? [] : [`label:${e.labelBox}`],
      e.tailLabelBox === undefined ? [] : [`tail:${e.tailLabelBox}`],
      e.headLabelBox === undefined ? [] : [`head:${e.headLabelBox}`],
      e.xLabelBox === undefined ? [] : [`xlabel:${e.xLabelBox}`],
    ])
    .flat()
    .sort();

/** One entry per CHECKS member — extend here when new checks land. */
const CHECK_DETAILS: Record<Check, CheckDetail> = {
  nodeCountOk: { label: 'node count', values: (o, c) => [o.nodes.length, c.nodes.length] },
  edgeCountOk: { label: 'edge count', values: (o, c) => [o.edges.length, c.edges.length] },
  degreeOk: { label: 'degree sequence', values: (o, c) => [degreeSequence(o), degreeSequence(c)] },
  directionOk: {
    label: 'directed in:out degree multiset (B31)',
    values: (o, c) => [directedDegreesOf(o), directedDegreesOf(c)],
  },
  minlenOk: { label: 'minlen multiset', values: (o, c) => [minlensOf(o), minlensOf(c)] },
  shapeOk: { label: 'shape multiset', values: (o, c) => [shapesOf(o), shapesOf(c)] },
  labelOk: { label: 'label counts [label,tail,head,xlabel]', values: (o, c) => [labelCountsOf(o), labelCountsOf(c)] },
  labelSizeOk: { label: 'label boxes kind:WxH (D7)', values: (o, c) => [labelBoxesOf(o), labelBoxesOf(c)] },
  portOk: { label: 'edge endpoint ports', values: (o, c) => [portsOf(o), portsOf(c)] },
  clusterOk: { label: 'cluster-size list', values: (o, c) => [clusterSizesOf(o), clusterSizesOf(c)] },
  rankdirOk: { label: 'rankdir', values: (o, c) => [o.rankdir, c.rankdir] },
  nodesepOk: { label: 'nodesep (in)', values: (o, c) => [o.nodesep, c.nodesep] },
  ranksepOk: { label: 'ranksep (in)', values: (o, c) => [o.ranksep, c.ranksep] },
  splinesOk: {
    label: 'splines/forcelabels',
    values: (o, c) => [
      `${o.splines ?? '-'}/${o.forcelabels}`,
      `${c.splines ?? '-'}/${c.forcelabels}`,
    ],
  },
};

function printGraphAttrs(label: string, g: StructuralGraph): void {
  console.log(
    '  ' + label + ': rankdir=' + g.rankdir + ' nodesep=' + g.nodesep + ' ranksep=' + g.ranksep +
    ' remincross=' + g.remincross + ' searchsize=' + g.searchsize,
  );
}

function printCheckDetails(o: StructuralGraph, c: StructuralGraph, d: StructuralDiff): void {
  let anyFail = false;
  for (const check of CHECKS) {
    if (d[check]) continue;
    anyFail = true;
    const detail = CHECK_DETAILS[check];
    const [ov, cv] = detail.values(o, c);
    console.log('  FAIL ' + check + ' (' + detail.label + '):');
    console.log('    oracle:    ' + JSON.stringify(ov));
    console.log('    candidate: ' + JSON.stringify(cv));
  }
  if (!anyFail) console.log('  all structural checks pass (structurallyEqual=' + d.structurallyEqual + ')');
  console.log('  maxSizeDeltaIn: ' + d.maxSizeDeltaIn.toFixed(4));
}

export function drillDownGraph(
  i: number,
  oracleDot: string | undefined,
  input: DotInputGraph | undefined,
): void {
  console.log('\n--- graph #' + i + ' ---');
  if (oracleDot !== undefined) {
    console.log('\n[oracle svek DOT]');
    console.log(oracleDot);
  } else {
    console.log('[oracle svek DOT] — none (oracle produced fewer graphs)');
  }
  const candidateDot = input === undefined ? undefined : toSvekDot(input);
  if (candidateDot !== undefined) {
    console.log('\n[our svek DOT — via toSvekDot]');
    console.log(candidateDot);
  } else {
    console.log('[our svek DOT] — none (we produced fewer graphs)');
  }
  if (oracleDot === undefined || candidateDot === undefined) return;
  const oracleGraph = parseSvekDot(oracleDot);
  const candidateGraph = parseSvekDot(candidateDot);
  console.log('\n[graph attrs]');
  printGraphAttrs('oracle   ', oracleGraph);
  printGraphAttrs('candidate', candidateGraph);
  console.log('\n[per-check diff]');
  printCheckDetails(oracleGraph, candidateGraph, compareStructural(oracleGraph, candidateGraph));
}
