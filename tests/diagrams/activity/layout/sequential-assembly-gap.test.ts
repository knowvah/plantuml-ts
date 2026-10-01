/**
 * `SEQUENTIAL_ASSEMBLY_GAP` (mission `activity-divergence-drive`, T3c).
 *
 * Diagnosis: the jar's vertical gap between two sequential actions measures
 * 20px at the top level but 35px inside a fork/split branch. Both numbers
 * come from the SAME raw mechanism -- `FtileFactoryDelegatorAssembly
 * #assembly` (`:58`) inserts a flat 35px gap for EVERY sequential join,
 * top-level or nested -- followed by the SAME global compression pass
 * (`ActivityDiagram3#getTextBlock`, `:209-210`:
 * `CompressionXorYBuilder.build(ON_X, ...)` then `build(ON_Y, ...)`).
 * Compression scans ink GLOBALLY on the Y axis (every shape's y-extent,
 * independent of x) and collapses any ink-free Y-band wider than
 * `2 * margin = 10` px down to exactly that minimum
 * (`CompressionXorYBuilder.java:66`'s `smaller(5.0)`). A top-level gap with
 * no sibling ink in its Y-band compresses 35 -> 20 (10px margin + the 10px
 * trailing arrowhead). A fork/split-branch gap whose Y-band is occupied by
 * a SIBLING branch's box is not globally empty, so it never compresses and
 * stays the raw 35. `gtile-top-down.ts` used to bake an unsourced flat
 * `NODE_MARGIN_Y = 20` directly into pre-compression layout, which happened
 * to reproduce the (degenerate, saturated) top-level answer by coincidence
 * while leaving every branch-internal gap 15px short.
 *
 * Geometry verified byte-exact against `scripts/oracle-render.sh` on both
 * fixtures below (journal entry, mission worktree `add1-T3c`).
 */
import { describe, it, expect } from 'vitest';

import { buildBlockUmls } from '../../../../src/core/BlockUmlBuilder.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { parseActivity } from '../../../../src/diagrams/activity/parser.js';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import type { ActivityGeometry } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { astOrThrow } from '../../../helpers/parse-ast.js';

function layout(markup: string): ActivityGeometry {
  const first = buildBlockUmls(markup)[0];
  if (first === undefined) throw new Error('no diagram block');
  if (!first.ok) throw first.failure.cause;
  const ast = astOrThrow(parseActivity(first.source), 'activity');
  return layoutActivity(ast, resolveTheme('default'), new DeterministicMeasurer());
}

function actionByLabel(geo: ActivityGeometry, label: string): { y: number; height: number } {
  const node = geo.nodes.find((n) => n.kind === 'action' && n.label === label);
  if (node === undefined) throw new Error(`no action labelled ${label}`);
  return { y: node.y, height: node.height };
}

describe('sequential assembly gap -- 35 raw, then the real compression pass', () => {
  it('a top-level isolated pair compresses 35 -> 20 (oracle-exact: :A;\\n:B;)', () => {
    const geo = layout('@startuml\n:A;\n:B;\n@enduml');
    const actions = geo.nodes.filter((n) => n.kind === 'action');
    expect(actions).toHaveLength(2);
    const [a, b] = actions as [ActivityGeometry['nodes'][number], ActivityGeometry['nodes'][number]];
    expect(b.y - (a.y + a.height)).toBe(20);
  });

  it('a fork-branch pair with a sibling box in its Y-band stays the raw 35', () => {
    // fork { A1; A2 } again { B1 } -- B1's box occupies the same Y-band as
    // the A1->A2 gap, so that band is never globally ink-free and the
    // compressor leaves it at the raw FtileFactoryDelegatorAssembly height.
    const geo = layout('@startuml\nfork\n:A1;\n:A2;\nfork again\n:B1;\nend fork\n@enduml');
    const a1 = actionByLabel(geo, 'A1');
    const a2 = actionByLabel(geo, 'A2');
    expect(a2.y - (a1.y + a1.height)).toBe(35);
  });
});
