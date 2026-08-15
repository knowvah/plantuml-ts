/**
 * G9/T2 — cross-path fitness test for jar's cluster protection wrappers.
 *
 * `graph-layout-build.ts#addClusters` (the LAYOUT path) and
 * `svek-dot-emit.ts#toSvekDot` (the DOT-TEXT path) are two independent
 * consumers of one `DotInputGraph`. Four separate defects in this area were
 * divergences between them, in BOTH directions — the wrapper deficit G9/T1
 * closed was the fifth, and nothing asserted that the two agree.
 *
 * Neither existing gate can see this. The DOT-parity comparator
 * (`./svek-dot.ts#parseClusters`) records only subgraphs matching
 * `^cluster\d+$`, so `clusterNa`/`clusterNp0`/`clusterNi`/`clusterNp1` are
 * invisible to it by design; the SVG census sees the wrappers' pixel effect on
 * the layout path only, and the emitter is not on that path at all.
 *
 * So this file asserts the property directly, over BOTH corpora this
 * mechanism is shared by (state, ported first at G9/T1-T2; class, wired at
 * namespace-cluster-box mission T4): for every cluster of every captured
 * layout graph, the wrapper levels the BUILDER actually created and the ones
 * the EMITTER actually wrote both equal `wrapperLevels(cluster)` — the single
 * shared definition of jar's `ClusterDotString.java:91-158` conditions. Both
 * diagram types feed the SAME `graph-layout-build.ts`/`svek-dot-emit.ts`
 * consumers (a diagram-type-agnostic core module pair), so one parametrized
 * suite over `{ state, class }` golden roots covers both without duplicating
 * the property.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:91-158
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGraph } from '@knowvah/dot-engine';
import type { Graph } from '@knowvah/dot-engine';

import { renderSync } from '../../src/index.js';
import { WidthTableMeasurer } from '../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../src/core/graph-layout.js';
import { addClusters } from '../../src/core/graph-layout-build.js';
import { toSvekDot, wrapperLevels, type WrapperLevels } from '../../src/core/svek-dot-emit.js';

const GOLDENS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../oracle/goldens');

/** One corpus root to sweep — `oracle/goldens/state` (the original scope)
 *  and `oracle/goldens/class` (T4: the class engine now wires the same two
 *  `DotInputCluster` fields, `class-dot-graph.ts#buildDotClusters`). */
interface GoldenCorpus {
  label: string;
  dir: string;
  fixtures: string[];
}

function loadCorpus(label: string): GoldenCorpus {
  const dir = join(GOLDENS_ROOT, label);
  const fixtures = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'input.puml')))
        .map((d) => d.name)
        .sort()
    : [];
  return { label, dir, fixtures };
}

const CORPORA: GoldenCorpus[] = [loadCorpus('state'), loadCorpus('class')];

/** Every subgraph name reachable from `g`, in creation order. */
function subgraphNames(g: Graph): string[] {
  const names: string[] = [];
  for (const [name, sub] of g.subgraphs) {
    names.push(name);
    names.push(...subgraphNames(sub));
  }
  return names;
}

/** Which of the four wrapper levels `names` contains for base name `base`. */
function levelsPresent(names: ReadonlySet<string>, base: string): WrapperLevels {
  return {
    a: names.has(`${base}a`),
    p0: names.has(`${base}p0`),
    i: names.has(`${base}i`),
    p1: names.has(`${base}p1`),
  };
}

/** The wrapper levels `addClusters` actually built, per `DotInputCluster.id`.
 *  The builder names clusters with its OWN counter and hands the mapping back
 *  as `idByName`, so the id is recovered rather than assumed equal to the
 *  emitter's (which uses `cluster.id` verbatim as the subgraph name). */
function builderLevels(input: DotInputGraph): Map<string, WrapperLevels> {
  const b = createGraph({ directed: true });
  const { idByName } = addClusters(b, input);
  const names = new Set(subgraphNames(b.graph));
  const out = new Map<string, WrapperLevels>();
  for (const [name, id] of idByName) out.set(id, levelsPresent(names, name));
  return out;
}

/** The wrapper levels `toSvekDot` actually wrote, per `DotInputCluster.id`. */
function emitterLevels(input: DotInputGraph): Map<string, WrapperLevels> {
  const dot = toSvekDot(input);
  const names = new Set([...dot.matchAll(/subgraph\s+(\w+)\s*\{/g)].map((m) => m[1]!));
  const out = new Map<string, WrapperLevels>();
  for (const c of input.clusters ?? []) out.set(c.id, levelsPresent(names, c.id));
  return out;
}

let captured: DotInputGraph[] = [];
beforeAll(() => setLayoutInputObserver((g) => captured.push(g)));
afterAll(() => setLayoutInputObserver(undefined));

for (const { label, dir, fixtures } of CORPORA) {
  describe.skipIf(fixtures.length === 0)(`cluster wrapper levels — builder and emitter agree (${label})`, () => {
    it('has fixtures to check', () => {
      expect(fixtures.length).toBeGreaterThan(0);
    });

    for (const name of fixtures) {
      it(`${name}: every cluster wraps identically on both paths`, () => {
        captured = [];
        renderSync(readFileSync(join(dir, name, 'input.puml'), 'utf8'), {
          measurer: new WidthTableMeasurer(),
        });
        for (const [n, input] of captured.entries()) {
          const built = builderLevels(input);
          const emitted = emitterLevels(input);
          for (const c of input.clusters ?? []) {
            const expected = wrapperLevels(c);
            const where = `${label}/${name} graph ${String(n)} cluster ${c.id}`;
            expect(built.get(c.id), `${where}: builder wrapper levels`).toEqual(expected);
            expect(emitted.get(c.id), `${where}: emitter wrapper levels`).toEqual(expected);
          }
        }
      });
    }
  });
}
