/**
 * G9/T4 — cross-path fitness test for Svek's node DECLARATION order.
 *
 * The order graphviz's parser first meets a node decides the root of the
 * cycle-breaking DFS that runs before rank assignment
 * (`~/git/graphviz/lib/dotgen/acyclic.c`), so it reaches geometry. Jar's order
 * is a property of its DOT TEXT — `lines0` edges implicitly create their
 * endpoints, a `{rank=…;a;b;}` group creates the ids it names, and only then
 * do the shape lines follow (`DotStringFactory.java:187-198`,
 * `ClusterDotString.java:135-184,254-287`).
 *
 * Our two consumers reach that order by different routes: `svek-dot-emit.ts`
 * WRITES the text, and `svek-dot-order.ts#firstEncounterOrder` computes the
 * same sequence as a list for the layout builder, which has no implicit
 * node-creation phase to derive it from. Four prior defects in this area were
 * divergences between exactly this pair of consumers, so the agreement is
 * asserted here rather than assumed.
 *
 * Note what this canNOT see, and why the census is still the gate that
 * matters: it compares the SEQUENCE of ids, so it stays green when both paths
 * agree on positions while the id-to-entity mapping itself differs from jar's
 * (`rijoki-89-teno556`'s pseudostate creation order is the live example — see
 * the mission decision journal).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../src/index.js';
import { WidthTableMeasurer } from '../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../src/core/graph-layout.js';
import { firstEncounterOrder } from '../../src/core/graph-layout-build.js';
import { toSvekDot } from '../../src/core/svek-dot-emit.js';
import { buildClusterTree, assignSequence } from '../../src/core/svek-dot-sequence.js';

const GOLDENS = join(dirname(fileURLToPath(import.meta.url)), '../../oracle/goldens/state');

const fixtures = existsSync(GOLDENS)
  ? readdirSync(GOLDENS, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(GOLDENS, d.name, 'input.puml')))
      .map((d) => d.name)
      .sort()
  : [];

/**
 * Node ids in the order DOT text creates them: every identifier that a
 * statement NAMES, whether it is being declared (`id [`), linked (`a->b`) or
 * listed in a rank group (`{rank=source;a;b;}`). The lookbehind drops
 * attribute VALUES (`style=solid;`, `label="";`), which are the only other
 * bare words that can precede one of those three terminators.
 */
function textCreationOrder(dot: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const re = /(?<![=\w"#])([A-Za-z_][\w]*)(?::\w+)?(?=\s*(?:\[|->|;))/g;
  for (let m = re.exec(dot); m !== null; m = re.exec(dot)) {
    const id = m[1]!;
    if (id.startsWith('cluster') || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

let captured: DotInputGraph[] = [];
beforeAll(() => setLayoutInputObserver((g) => captured.push(g)));
afterAll(() => setLayoutInputObserver(undefined));

describe.skipIf(fixtures.length === 0)('declaration order — builder and emitter agree', () => {
  it('has fixtures to check', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const name of fixtures) {
    it(`${name}: registers nodes in the order the DOT text creates them`, () => {
      captured = [];
      renderSync(readFileSync(join(GOLDENS, name, 'input.puml'), 'utf8'), {
        measurer: new WidthTableMeasurer(),
      });
      for (const [n, input] of captured.entries()) {
        const { recs } = assignSequence(input, buildClusterTree(input.clusters ?? []));
        const built = firstEncounterOrder(input).map((node) => recs.get(node.id)?.sh);
        expect(built, `${name} graph ${String(n)}`).toEqual(textCreationOrder(toSvekDot(input)));
      }
    });
  }
});
