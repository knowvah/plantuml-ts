/**
 * `descriptionClusterTitleTable` -- `ClusterHeader`'s DOT-side title table for description groups.
 * Every expected `{ width, height }` is the `WIDTH`/`HEIGHT` of the cluster's
 * `label=<TABLE ...>` in the jar's cached `svek-1.dot` for the named fixture
 * (`ClusterDotString.java:122-125`); sources are trimmed to the group declarations.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:60-120
 */
import { describe, it, expect } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { createClassifyCtx } from '../../../src/diagrams/description/layout.js';
import { classifyAst } from '../../../src/diagrams/description/layout-classify.js';
import { descriptionClusterTitleTable } from '../../../src/diagrams/description/description-cluster-header.js';
import type { ContainerDesc } from '../../../src/diagrams/description/layout-types.js';

const measurer = new DeterministicMeasurer();

function containersOf(puml: string): ContainerDesc[] {
  const lines = puml.split('\n').filter((l) => l.trim() !== '');
  const block: UmlSource = { lines, type: 'description' };
  const ast = astOrThrow(parseDescription(block), 'description');
  const ctx = createClassifyCtx(ast, defaultTheme);
  classifyAst(ast.nodes, ctx, new Set());
  return ctx.containers;
}

function tablesOf(puml: string) {
  return containersOf(puml).map((c) => descriptionClusterTitleTable(c, defaultTheme, measurer));
}

interface JarRow {
  readonly fixture: string;
  readonly puml: string;
  /** `[WIDTH, HEIGHT]` per cluster, in declaration order, from the jar `svek-1.dot`. */
  readonly tables: readonly [number, number][];
}

const JAR_ROWS: readonly JarRow[] = [
  { fixture: 'unknown/bamami-10-lava790', puml: 'file "file\\n" as package {\n() " " as acc1\n}', tables: [[17, 23]] },
  {
    fixture: 'unknown/dogizu-51-sora488',
    puml: 'database "Group mode database" {\nnode "Group mode node" {\nnode simplenode\n}\ncloud "Group mode cloud" {\ncloud simplecloud\n}\ndatabase simpledatabase\n}',
    tables: [
      [139, 24],
      [172, 14],
      [115, 9],
    ],
  },
  {
    fixture: 'unknown/bixixe-41-vigu064',
    puml: 'package A {\n[router]\nnode physical1 {\n[L]\n}\n}',
    tables: [
      [9, 9],
      [118, 14],
    ],
  },
  {
    fixture: 'unknown/luvufe-13-lifi483',
    puml: 'package AA <<st>> {\n[ZZ]\n}\npackage BB {\n[XX]\n}',
    tables: [
      [26, 23],
      [18, 9],
    ],
  },
  {
    fixture: 'unknown/mebeva-33-bafu201',
    puml: 'database db1  as "My Database1" {\n[test1]\n}\ndatabase "My Database2" as db2 {\n[test2]\n}',
    tables: [
      [90, 24],
      [90, 24],
    ],
  },
  {
    fixture: 'unknown/fepiko-26-vobi566',
    puml: 'rectangle "R1" as r1 <<boundary>> {\nrectangle "R2" as r2 <<boundary>> {\n}\n}',
    tables: [[73, 23]],
  },
  { fixture: 'unknown/banomu-15-keni701', puml: 'package SFML {\nrectangle System\n}', tables: [[37, 9]] },
  {
    fixture: 'unknown/kekami-48-nibi969',
    puml: 'package Afoo1 {\nactor Afoo2\n}\ndatabase Bfoo1 {\nactor Bfoo2\n}\ncloud Cfoo1 {\nactor Cfoo2\n}',
    tables: [
      [36, 9],
      [36, 24],
      [37, 9],
    ],
  },
  {
    fixture: 'unknown/kuduba-74-taki821',
    puml: 'package "Single Map Layer" as sml <<layer>> {\n[A]\n}',
    tables: [[108, 23]],
  },
  {
    fixture: 'unknown/xidaxi-41-niti333',
    puml: 'cloud failure {\nrectangle "x" as a\n}\ncloud workarounds {\nrectangle "y" as w_1\n}',
    tables: [
      [38, 9],
      [80, 9],
    ],
  },
];

describe('descriptionClusterTitleTable', () => {
  it.each(JAR_ROWS.map((r) => [r.fixture, r] as const))('matches the jar TABLE dims for %s', (_name, row) => {
    expect(tablesOf(row.puml)).toEqual(row.tables.map(([width, height]) => ({ width, height })));
  });

  it('adds USymbolNode.suppWidthBecauseOfShape (+60) and suppHeight (+5, netted by the -5) for a node group', () => {
    const [outer, node] = tablesOf('package A {\n[router]\nnode physical1 {\n[L]\n}\n}');
    expect(outer).toEqual({ width: 9, height: 9 });
    // "physical1" bold 14 = 58 raw, +60 node supp; height 14 + 5 - 5.
    expect(node).toEqual({ width: 118, height: 14 });
  });

  it('adds the stereotype line to the height (mergeTB stacks stereo above title)', () => {
    const [stereo, plain] = tablesOf('package AA <<st>> {\n[ZZ]\n}\npackage BB {\n[XX]\n}');
    expect(stereo?.height).toBe(23);
    expect(plain?.height).toBe(9);
  });

  it('returns undefined for an anonymous group (jar mefule-86-calo549 `file {` prints label="")', () => {
    expect(tablesOf('file {\nartifact artifact1\n}\nfile MyFile {\nartifact artifact3\n}')).toEqual([
      undefined,
      { width: 41, height: 9 },
    ]);
  });

  it('gives a whitespace-only display the " " atom (StripeSimple.java:125-126), so the table exists', () => {
    const [anon] = containersOf('file {\nartifact artifact1\n}');
    const table = descriptionClusterTitleTable({ ...anon!, display: ' ' }, defaultTheme, measurer);
    expect(table?.height).toBe(9);
    expect(table?.width).toBeGreaterThan(0);
  });

  it('floors the width at ceil(MinimumWidth) (Cluster.java:261-264)', () => {
    const [pkg] = containersOf('package SFML {\nrectangle System\n}');
    const theme = { ...defaultTheme, minimumWidth: 200 };
    expect(descriptionClusterTitleTable(pkg!, theme, measurer)).toEqual({ width: 200, height: 9 });
  });

  it('adds no shape supplement when the symbol resolves to no USymbol (port)', () => {
    const [pkg] = containersOf('package SFML {\nrectangle System\n}');
    const asPort: ContainerDesc = { ...pkg!, symbol: 'port' };
    expect(descriptionClusterTitleTable(asPort, defaultTheme, measurer)).toEqual({ width: 37, height: 9 });
  });
});
