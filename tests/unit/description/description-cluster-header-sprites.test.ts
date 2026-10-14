/**
 * `descriptionClusterTitleTable` / `buildHeader` for the group headers whose label block is NOT the plain
 * guillemet text: a sprite stereotype (`ClusterHeader.java:187-188`), a sprite inside the title
 * (`ClusterHeader.java:117-119`, `Display#create`) and a stereotype whose label carries a creole tag
 * (`StereotypeDecoration.java:185-196` + `Guillemet.java:76`). Every expected `{ width, height }` is the
 * `WIDTH`/`HEIGHT` of the cluster's `label=<TABLE ...>` in the jar's cached `svek-1.dot`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:60-120,187-207
 */
import { describe, it, expect } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';
import { internalSpriteStoreFrom } from '../../../src/core/internal-sprite-store.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { createClassifyCtx } from '../../../src/diagrams/description/layout.js';
import { classifyAst } from '../../../src/diagrams/description/layout-classify.js';
import { descriptionClusterTitleTable } from '../../../src/diagrams/description/description-cluster-header.js';
import { buildHeader } from '../../../src/diagrams/description/renderer-cluster.js';
import type { DescriptionNodeGeo } from '../../../src/diagrams/description/layout-helpers.js';

const measurer = new DeterministicMeasurer();

function tablesOf(puml: string) {
  const lines = puml.split('\n').filter((l) => l.trim() !== '');
  const block: UmlSource = { lines, type: 'description' };
  const ast = astOrThrow(parseDescription(block, internalSpriteStoreFrom(buildSpriteAssetsStore())), 'description');
  const ctx = createClassifyCtx(ast, defaultTheme);
  classifyAst(ast.nodes, ctx, new Set());
  return {
    tables: ctx.containers.map((c) => descriptionClusterTitleTable(c, defaultTheme, measurer, ast.sprites)),
    ast,
    ctx,
  };
}

const ARCHIMATE_NESTED =
  'node "Technology Device" as TDevice <<$archimate/technology-device>> #TECHNOLOGY {\n' +
  'rectangle "Technology Function" as TFunction <<$archimate/technology-function>> <<behavioural>> #TECHNOLOGY {\n' +
  'rectangle "Technology Interface" as TInterface <<$archimate/interface>> #TECHNOLOGY\n}\n}';

describe('sprite stereotype replaces the stereotype text block (ClusterHeader.java:187-188)', () => {
  it('lesori-32-zeve057: jar TABLEs 179x34 and 130x29 for two archimate-sprite groups', () => {
    expect(tablesOf(ARCHIMATE_NESTED).tables).toEqual([
      { width: 179, height: 34 },
      { width: 130, height: 29 },
    ]);
  });

  it('tuliba-37-liza126: jar TABLE 49x29 for `rectangle ... <<$aComponent>> { ... }`', () => {
    const puml =
      'sprite $aComponent jar:archimate/application-component\n' +
      'rectangle "Finance" as F1 <<$aComponent>> #Application {\nrectangle "Transaction Processing" as TP1 <<$aComponent>> #Application\n}';
    expect(tablesOf(puml).tables[0]).toEqual({ width: 49, height: 29 });
  });

  it('the drawn header block IS the sprite block: stereo height is the sprite height, not a text line', () => {
    const { ast, ctx } = tablesOf(ARCHIMATE_NESTED);
    const container = ctx.containers[0]!;
    const node: DescriptionNodeGeo = {
      id: container.astId,
      symbol: container.symbol,
      display: container.display,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      children: [],
      ...(container.stereotypeSprite === undefined ? {} : { stereotypeSprite: container.stereotypeSprite }),
    };
    const header = buildHeader(node, defaultTheme, { sprites: ast.sprites });
    const dim = header.stereo.calculateDimension(new MeasurerStringBounder(measurer));
    expect({ w: dim.getWidth(), h: dim.getHeight() }).toEqual({ w: 20, h: 20 }); // jar TABLE height 34 = 20 (sprite) + 14 (bold title line);
  });
});

describe('title and stereotype creole', () => {
  it('ruciga-77-ruja233: jar TABLE 218x16 for a title holding two `<$sprite>` atoms', () => {
    const puml =
      'sprite Netw jar:archimate/network\n' +
      'sprite $printer [15x15/8z] NOtH3W0W208HxFz_kMAhj7lHWpa1XC716sz0Pq4MVPEWfBHIuxP3L6kbTcizR8tAhzaqFvXwvFfPEqm0\n' +
      'rectangle "Netw via jar <$Netw> printer via code <$printer>" as netw {\n[D] -> [E]\n}';
    expect(tablesOf(puml).tables[0]).toEqual({ width: 218, height: 16 });
  });

  it('junoxu-15-gori632: jar TABLE 95x23; `<< <U+00B5>Service >>` keeps its literal brackets (Guillemet.java:76)', () => {
    const puml = 'component <U+00B5>Service as MS1 << <U+00B5>Service >> {\ncomponent uService as MS2\n}';
    expect(tablesOf(puml).tables[0]).toEqual({ width: 95, height: 23 });
  });
});
