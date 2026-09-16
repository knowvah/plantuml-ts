import { readFileSync } from 'node:fs';
import { buildBlockUmls } from '/Users/scottseely/git/knowvah/plantuml-ts/src/core/BlockUmlBuilder.js';
import { parseActivity } from '/Users/scottseely/git/knowvah/plantuml-ts/src/diagrams/activity/parser.js';
import { tileNodes } from '/Users/scottseely/git/knowvah/plantuml-ts/src/diagrams/activity/layout/tile-layout.js';
import { DeterministicMeasurer } from '/Users/scottseely/git/knowvah/plantuml-ts/src/core/measurer-deterministic.js';
import { resolveTheme } from '/Users/scottseely/git/knowvah/plantuml-ts/src/core/theme.js';
import { astOrThrow } from '/Users/scottseely/git/knowvah/plantuml-ts/tests/helpers/parse-ast.js';
const slug = process.argv[2]!;
const markup = readFileSync(`/Users/scottseely/git/knowvah/plantuml-ts/test-results/dot-cache/activity/${slug}/in.puml`, 'utf8');
const b = buildBlockUmls(markup)[0]!; if (!b.ok) throw b.failure.cause;
const ast = astOrThrow(parseActivity({ ...b.source, rawStyles: b.preprocessed.styles, stylePositions: b.preprocessed.stylePositions }), 'activity');
const theme = resolveTheme('default');
const m = new DeterministicMeasurer();
const bounder = { getDimension: (text: string, fontSizePt: number) => m.measure(text, { family: theme.fontFamily, size: fontSizePt }) };
function walk(t: any): void {
  if (t.kind === 'gtile-repeat') {
    const body = t.children[0], cond = t.children[1];
    const oldW = Math.max(body.width, cond.width) + 20;
    console.log(`repeat: body.w=${body.width} body.left=${body.getCoord('NORTH_HOOK').x} cond.w=${cond.width}`);
    console.log(`  new width=${t.width} (left ${t.left} + right ${t.width - 20 - t.left})  old width=${oldW}  ulp diff=${t.width - oldW}`);
    console.log(`  new hook=${10 + t.left}  old hook=${oldW / 2}  new bodyOffsetX=${t.bodyOffsetX} old=${oldW / 2 - body.width / 2}`);
  }
  for (const c of t.children ?? []) walk(c);
}
for (const t of tileNodes(ast.nodes, bounder, theme, ast.swimlanes)) walk(t);
