/**
 * `clusterWrapperLevel` proven against every cached oracle DOT that carries a
 * cluster — 123 class + 3 object fixtures under `test-results/dot-cache/`
 * (`grep -l "subgraph cluster"`, all single-graph `svek-1.dot`).
 *
 * The oracle DOT numbers clusters by SVEK's own internal entity-creation
 * order (`cluster6`, `cluster11`, …), not by this port's `cluster${i}` id
 * scheme, so there is no id to match on directly. What both sides DO share is
 * DOCUMENT ORDER: `Cluster#printCluster2` opens each child subgraph in the
 * same order `Cluster`'s own children list was built (`Cluster.java:565,
 * 580`), which is parse/declaration order — the same order this test's own
 * `keptNamespaces` walks `ast.namespaces` in. Zipping the two ordered lists
 * is therefore a sound correspondence, checked by asserting equal length
 * before comparing levels (a length mismatch means the correspondence
 * assumption broke for that fixture, not that a level disagrees).
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { classPlugin } from '../../../src/diagrams/class/index.js';
import { collapseEmptyNamespacesFinal } from '../../../src/diagrams/class/class-namespace.js';
import type { ClassDiagramAST, Namespace } from '../../../src/diagrams/class/ast.js';
import { clusterWrapperLevel } from '../../../src/diagrams/class/class-cluster-levels.js';
import { parseAst } from '../../helpers/parse-ast.js';

const DOT_CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../test-results/dot-cache',
);

interface Fixture {
  engine: 'class' | 'object';
  slug: string;
  puml: string;
  dot: string;
}

function loadFixtures(engine: 'class' | 'object'): Fixture[] {
  const root = join(DOT_CACHE, engine);
  const out: Fixture[] = [];
  for (const slug of readdirSync(root)) {
    const dot = join(root, slug, 'svek-1.dot');
    const puml = join(root, slug, 'in.puml');
    let dotText: string;
    let pumlText: string;
    try {
      dotText = readFileSync(dot, 'utf8');
      pumlText = readFileSync(puml, 'utf8');
    } catch {
      continue;
    }
    if (!/subgraph cluster\d/.test(dotText)) continue;
    out.push({ engine, slug, puml: pumlText, dot: dotText });
  }
  return out;
}

/**
 * Parse a cached fixture's `.puml` into the real production AST — same
 * `buildBlockUmls` → `classPlugin.parse` pipeline `src/index.ts` runs (the
 * extra `UmlSource` fields `renderSync` adds are all optional) — THEN apply
 * the same `collapseEmptyNamespacesFinal` pass `layout.ts:227` runs before
 * `buildDotGraph`/`buildDotClusters` ever see the AST. Skipping this step
 * undercounts: a namespace whose only content is a further-empty child (no
 * classifiers anywhere in its own subtree) reports 0 direct classifiers pre
 * collapse, so a naive parent walk-up never marks it kept — yet jar DOES
 * draw it, containing the collapsed child's own `EMPTY_PACKAGE` leaf.
 * Confirmed against `delasa-80-jusu462` (`pdwzmyysm_abstract.siwd`/
 * `mssrda.siwd`, both a childless empty leaf under an otherwise-childless
 * parent): pre-collapse this walk finds 32 kept namespaces against the
 * oracle's 34; post-collapse it finds the same 34, `pdwzmyysm_abstract`/
 * `mssrda` included.
 */
function parseFixture(source: string): ClassDiagramAST {
  const blocks = buildBlockUmls(source);
  const block = blocks[0]!;
  if (!block.ok) throw new Error(`fixture failed to preprocess: ${JSON.stringify(block)}`);
  const ast = parseAst(classPlugin, block.source, {});
  return collapseEmptyNamespacesFinal(ast);
}

/**
 * Namespace ids that get a jar cluster, in the SAME document order
 * `buildDotClusters` (`class-dot-graph.ts`) emits them in: any namespace
 * with a direct classifier, plus every ancestor on its way to the root. A
 * standalone local re-derivation (not imported from `class-dot-graph.ts`,
 * which does not export it) — test-only correlation logic, not production
 * behavior.
 */
function keptNamespaceIds(ast: ClassDiagramAST): string[] {
  const byId = new Map(ast.namespaces.map((n) => [n.id, n] as const));
  const keep = new Set<string>();
  for (const ns of ast.namespaces) {
    if (ns.classifiers.length === 0) continue;
    let cur: Namespace | undefined = ns;
    while (cur !== undefined && !keep.has(cur.id)) {
      keep.add(cur.id);
      cur = cur.parentId !== undefined ? byId.get(cur.parentId) : undefined;
    }
  }
  return ast.namespaces.filter((ns) => keep.has(ns.id)).map((ns) => ns.id);
}

/** Oracle cluster ids in the order their `subgraph cluster<N>` opens
 *  (document order), each paired with whether jar wrapped it in `a`/`i`
 *  (level 2) — detected by the presence of `subgraph cluster<N>a` anywhere
 *  in the text, since `<N>` is unique per graph. */
function oracleClusterLevels(dot: string): Array<1 | 2> {
  const ids: string[] = [];
  const seen = new Set<string>();
  const openRe = /subgraph cluster(\d+)(?:\{|\s)/g;
  for (let m = openRe.exec(dot); m !== null; m = openRe.exec(dot)) {
    const id = m[1]!;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids.map((id) => (dot.includes(`subgraph cluster${id}a`) ? 2 : 1));
}

const fixtures = [...loadFixtures('class'), ...loadFixtures('object')];

describe('clusterWrapperLevel — 126-fixture oracle agreement', () => {
  it('covers 123 class + 3 object fixtures', () => {
    expect(fixtures.filter((f) => f.engine === 'class')).toHaveLength(123);
    expect(fixtures.filter((f) => f.engine === 'object')).toHaveLength(3);
  });

  for (const fixture of fixtures) {
    it(`${fixture.engine}/${fixture.slug}: derived level matches jar's wrappers`, () => {
      const ast = parseFixture(fixture.puml);
      const kept = keptNamespaceIds(ast);
      const oracleLevels = oracleClusterLevels(fixture.dot);
      expect(kept).toHaveLength(oracleLevels.length);
      const derived = kept.map((nsId) => clusterWrapperLevel(nsId, ast));
      expect(derived).toEqual(oracleLevels);
    });
  }

  it('cocube-46-tusu692: exactly one of four clusters is level 2', () => {
    const fixture = fixtures.find((f) => f.slug === 'cocube-46-tusu692')!;
    const ast = parseFixture(fixture.puml);
    const kept = keptNamespaceIds(ast);
    expect(kept).toHaveLength(4);
    const derived = kept.map((nsId) => clusterWrapperLevel(nsId, ast));
    expect(derived.filter((level) => level === 2)).toHaveLength(1);
  });

  it('bajotu-30-soku184 (p1 --> cl2): its single cluster is level 2', () => {
    const fixture = fixtures.find((f) => f.slug === 'bajotu-30-soku184')!;
    const ast = parseFixture(fixture.puml);
    const kept = keptNamespaceIds(ast);
    expect(kept).toHaveLength(1);
    expect(clusterWrapperLevel(kept[0]!, ast)).toBe(2);
  });
});
