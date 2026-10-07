/**
 * add4-T2f (SWIM-LABEL): `|name|LABEL` gives the lane a display label
 * (`CommandSwimlane.java:65,97-98`), which `Swimlanes#swimlane` stores with
 * `setDisplay` only when non-null (`Swimlanes.java:163-164`), so a later bare
 * `|name|` keeps it and a later `|name|OTHER` replaces it. The title draws
 * and is measured by `getDisplay()` (`Swimlanes.java:285-293`), the raw
 * label, leading space included. `in.svg` goldens via
 * `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { ActivityDiagramAST } from '../../../src/diagrams/activity/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { parseAst } from '../../helpers/parse-ast.js';
import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2f');

function parse(lines: readonly string[]): ActivityDiagramAST {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block);
}

function titles(svg: string): string[] {
  return [...svg.matchAll(/<text [^>]*font-size="18"[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]!);
}

describe('swimlane display label', () => {
  it('records the label after the closing pipe, keyed by lane name', () => {
    const ast = parse(['|a|A', '|#red|b| second', ':x;']);
    expect(ast.swimlanes).toEqual(['a', 'b']);
    expect(ast.swimlaneDisplays).toEqual({ a: 'A', b: ' second' });
  });

  it('a later bare switch keeps the label; a later label replaces it', () => {
    const ast = parse(['|a|First', ':x;', '|b|', ':y;', '|a|', ':z;', '|b|Late', ':w;']);
    expect(ast.swimlaneDisplays).toEqual({ a: 'First', b: 'Late' });
  });

  it('omits swimlaneDisplays when no lane carries a label', () => {
    expect(parse(['|a|', ':x;', '|b|', ':y;']).swimlaneDisplays).toBeUndefined();
  });

  it.each(['lane-label-relabel', 'lane-label-lead-space'])('%s renders equal to the jar', (name) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(titles(ours)).toEqual(titles(golden));
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
