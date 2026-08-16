/**
 * Pins the one invariant `sametail` relies on.
 *
 * `sametail` is a DOT attribute, and the DOT is the layout's INPUT, so its
 * value — the tail entity's `ent%04d` uid — must be known BEFORE any geometry
 * exists. `class-dot-graph.ts` therefore builds the uid plan from
 * `classUidPlanInputFromAst(ast)` rather than from the post-layout
 * `ClassGeometry` the renderer uses.
 *
 * Those two inputs are **not** interchangeable in general: measured across 300
 * class fixtures they disagree on 20, because the AST carries phantom
 * classifiers that never reach geometry and geometry carries synthetic ones
 * the AST never had — and the numbering is DENSE, so either shifts every later
 * rank by one. See `renderer-uid.ts#ClassUidPlanInput`.
 *
 * What makes the AST path sound is narrower and checkable: on every fixture
 * where `sametail` actually applies, the two agree. That is what this file
 * asserts. A future fixture combining `skinparam groupInheritance` with a
 * phantom- or synthetic-producing feature (package endpoints, association
 * couples, lollipops) fails HERE, by name, instead of silently emitting a uid
 * that does not match the jar.
 *
 * If this test fails, do NOT relax it — the fix is to source the uid from
 * something both stages agree on, not to accept a divergent number.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { resolveTheme } from '../../../src/core/theme.js';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import { layoutClass, classifierLeaves, noteLeaves } from '../../../src/diagrams/class/layout.js';
import {
  buildClassUidPlan,
  classUidPlanInputFromAst,
} from '../../../src/diagrams/class/renderer-uid.js';

const CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../test-results/dot-cache/class',
);

/** `skinparam groupInheritance N` is the only gate that can produce a
 *  `sametail` at all (`SkinParam.java:1041-1044`: absent or <= 1 means no tail
 *  can reach the limit), so it selects exactly the fixtures whose uids this
 *  path is responsible for. Matched case-insensitively — skinparam names are
 *  not case-sensitive upstream. */
function fixturesWithGroupInheritance(): string[] {
  if (!existsSync(CACHE)) return [];
  return readdirSync(CACHE).filter((slug) => {
    const puml = join(CACHE, slug, 'in.puml');
    if (!statSync(join(CACHE, slug)).isDirectory() || !existsSync(puml)) return false;
    return /groupinheritance/i.test(readFileSync(puml, 'utf8'));
  });
}

const slugs = fixturesWithGroupInheritance();

describe.skipIf(slugs.length === 0)('class uid plan: AST-derived == geo-derived where sametail applies', () => {
  for (const slug of slugs) {
    it(`${slug}: every classifier gets the same ent%04d from both inputs`, () => {
      const blocks = buildBlockUmls(readFileSync(join(CACHE, slug, 'in.puml'), 'utf8'));
      const first = blocks[0];
      expect(first, `${slug}: no diagram block`).toBeDefined();
      if (!first!.ok) throw first!.failure.cause;

      const theme = resolveTheme(first!.preprocessed.theme ?? 'default');
      const ast = parseClass({ ...first!.source, rawStyles: first!.preprocessed.styles });
      const geo = layoutClass(ast, theme, new DeterministicMeasurer());

      const fromAst = buildClassUidPlan(classUidPlanInputFromAst(ast));
      // T3: `ClassUidPlanInput` needs `classifiers`/`notes` explicitly --
      // `geo.leaves` replaced them (`ClassGeometry`'s own doc comment).
      const fromGeo = buildClassUidPlan({
        ...geo, classifiers: classifierLeaves(geo.leaves), notes: noteLeaves(geo.leaves),
      });

      // Compare over the GEO keys: those are the classifiers that actually
      // render, and therefore the only ones a `sametail` can name.
      const mismatched = [...fromGeo.classifierUid.entries()]
        .filter(([id, uid]) => fromAst.classifierUid.get(id) !== uid)
        .map(([id, uid]) => `${id}: ast=${fromAst.classifierUid.get(id) ?? '(absent)'} geo=${uid}`);

      expect(
        mismatched,
        `${slug}: AST-derived uids diverge from geo-derived ones, so any sametail ` +
          `emitted for this fixture names the wrong entity`,
      ).toEqual([]);
    });
  }
});

if (slugs.length === 0) {
  it('no groupInheritance fixtures in the oracle cache — nothing to pin', () => {
    expect(slugs).toHaveLength(0);
  });
}
