/**
 * cdd8 T3b: `!pragma layout elk` on a description diagram.
 *
 * Upstream: `CommandPragma.java:128-129` (`setUseElk(true)`), `CucaDiagram.java:478-479` (the maker swap, at the
 * cuca level, so a component / use-case diagram takes it too) and `:950-952` (`ELK_LIBRARY_REQUIRED`).
 *
 * The conformance cases render each `tests/fixtures/description-elk/*.puml` through `renderSync` with elkjs and
 * compare it with the 1.2026.8beta1 jar's own SVG of the same source (`scripts/oracle-render.sh`).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { ElkBackend } from '../../../src/core/elk/elk-backend.js';
import { loadElk } from '../../../src/core/elk/load-elk.js';
import { ELK_RENDER_SYNC_UNSUPPORTED } from '../../../src/core/elk/layout-services.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { LinkDecor } from '../../../src/core/decoration/LinkDecor.js';
import { renderSync } from '../../../src/index.js';
import {
  buildDescriptionElkContext,
  DescriptionElkAdapter,
  ROOT_GROUP,
} from '../../../src/diagrams/description/description-elk-adapter.js';
import { descriptionPlugin } from '../../../src/diagrams/description/index.js';
import { layoutDescription } from '../../../src/diagrams/description/layout.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { parseAst } from '../../helpers/parse-ast.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'description-elk');
const measurer = new DeterministicMeasurer();

function parse(body: string) {
  return parseAst(descriptionPlugin, { lines: body.split('\n'), type: 'description' });
}

function adapterOf(body: string): DescriptionElkAdapter {
  return new DescriptionElkAdapter(buildDescriptionElkContext(parse(body), defaultTheme, measurer));
}

let elk: ElkBackend;
beforeAll(async () => {
  elk = await loadElk();
});

describe('!pragma layout elk (CommandPragma.java:128-129)', () => {
  it.each(['!pragma layout elk', '!PRAGMA LAYOUT ELK', '!pragma   layout   elk  '])('%s sets layoutEngine', (line) => {
    expect(parse(`${line}\ncomponent A`).layoutEngine).toBe('elk');
  });

  it('leaves other pragmas and the default alone', () => {
    expect(parse('!pragma layout smetana\ncomponent A').layoutEngine).toBeUndefined();
    expect(parse('!pragma svek_trace on\ncomponent A').layoutEngine).toBeUndefined();
    expect(parse('component A').layoutEngine).toBeUndefined();
  });

  it('requiresElk is true only for the elk pragma', () => {
    expect(descriptionPlugin.requiresElk?.(parse('!pragma layout elk\ncomponent A'))).toBe(true);
    expect(descriptionPlugin.requiresElk?.(parse('component A'))).toBe(false);
  });

  it('layoutSync without a backend throws the renderSync message', () => {
    const ast = parse('!pragma layout elk\ncomponent A\ncomponent B\nA --> B');
    expect(() => descriptionPlugin.layoutSync(ast, defaultTheme, measurer)).toThrow(ELK_RENDER_SYNC_UNSUPPORTED);
  });
});

describe('DescriptionElkAdapter', () => {
  const GROUPED = [
    'cloud F',
    'node H {',
    '  package A {',
    '    component B',
    '  }',
    '  package C {',
    '    component D',
    '  }',
    '}',
    'F -[bold,#green]- "2 (bla)" A',
    'B ..> D : "uses"',
  ].join('\n');

  it('answers the group structure the maker walks', () => {
    const adapter = adapterOf(GROUPED);
    expect(adapter.getRootGroup()).toBe(ROOT_GROUP);
    expect(adapter.leafs()).toEqual(['F', 'B', 'D']);
    expect(adapter.getChildrenGroups(ROOT_GROUP)).toEqual(['H']);
    expect(adapter.getChildrenGroups('H')).toEqual(['A', 'C']);
    expect(adapter.groupLeafs('A')).toEqual(['B']);
    expect(adapter.groupLeafs('H')).toEqual([]);
    expect(adapter.getParentContainer('B')).toBe('A');
    expect(adapter.getParentContainer('A')).toBe('H');
    expect(adapter.getParentContainer('F')).toBe(ROOT_GROUP);
    expect(adapter.isEmpty('H')).toBe(false);
  });

  it('resolves link ends to the leaf or the group named, and carries the quantifier', () => {
    const adapter = adapterOf(GROUPED);
    const [toGroup, between] = adapter.getLinks();
    expect([adapter.getEntity1(toGroup!), adapter.getEntity2(toGroup!)]).toEqual(['F', 'A']);
    expect(adapter.getQuantifier1(toGroup!)).toBeNull();
    expect(adapter.getQuantifier2(toGroup!)).toBe('2 (bla)');
    expect([adapter.getEntity1(between!), adapter.getEntity2(between!)]).toEqual(['B', 'D']);
  });

  it('types a link from its decor tokens and style (CommandLinkElement.java:140)', () => {
    const adapter = adapterOf(GROUPED);
    const [, dependency] = adapter.getLinks();
    const type = dependency ? adapter.getType(dependency) : undefined;
    expect(type?.getDecor1()).toBe(LinkDecor.ARROW);
    expect(type?.getDecor2()).toBe(LinkDecor.NONE);
    expect(type?.getStyle().isNormal()).toBe(false);
    expect(adapter.isInvis(dependency!)).toBe(false);
  });

  it('appends applySingleStrategy chaining links as invisible links (CucaDiagram.java:679-702)', () => {
    const adapter = adapterOf('rectangle S\nrectangle V1\nrectangle V2');
    const links = adapter.getLinks();
    expect(links).toHaveLength(2);
    expect(links.map((l) => [adapter.getEntity1(l), adapter.getEntity2(l)])).toEqual([
      ['S', 'V1'],
      ['S', 'V2'],
    ]);
    expect(links.every((l) => adapter.isInvis(l))).toBe(true);
  });

  it('does not chain a leaf a real link touches', () => {
    const adapter = adapterOf('rectangle S\nrectangle V1\nrectangle V2\nS --> V1');
    expect(adapter.getLinks()).toHaveLength(1);
  });

  it('sizes a leaf with the number that becomes its dot node size', () => {
    const body = 'component A\ncomponent B\nA --> B';
    const adapter = adapterOf(body);
    const geo = layoutDescription(parse(body), defaultTheme, measurer);
    for (const node of geo.nodes) {
      const dim = adapter.calculateDimension(node.id, adapter.getDefaultStringBounder());
      expect([dim.getWidth(), dim.getHeight()]).toEqual([node.width, node.height]);
    }
  });

  it('maps the arrow body and the bracket modifiers onto the link type and colour', () => {
    const adapter = adapterOf(
      [
        'component A',
        'component B',
        'A --> B',
        'A -[hidden]-> B',
        'A -[#green,bold]-> B',
        'A .. B',
        'A -[dotted]- B',
      ].join('\n'),
    );
    const [plain, hidden, bold, dashedBody, dotted] = adapter.getLinks() as [string, string, string, string, string];
    expect(adapter.getType(plain).getStyle().isNormal()).toBe(true);
    expect(adapter.isInvis(hidden)).toBe(true);
    expect(adapter.getSpecificColor(bold)).toBe('green');
    expect(adapter.getSpecificColor(plain)).toBeNull();
    expect(adapter.getType(bold).getStroke3(null).getThickness()).toBe(2);
    expect(adapter.getType(dashedBody).getStyle().isNormal()).toBe(false);
    expect(adapter.getType(dotted).getStroke3(null).getDashVisible()).toBe(1);
  });

  it('reads the arrow style from plantuml.skin (arrow LineThickness 1.0) and no per-link Colors', () => {
    const adapter = adapterOf('component A\ncomponent B\nA --> B');
    const link = adapter.getLinks()[0]!;
    expect(adapter.getArrowStyle(link).stroke?.getThickness()).toBe(1);
    expect(adapter.getArrowStyle(link).lineColor).toBe(defaultTheme.colors.arrow);
    expect(adapter.getLinkColors(link)).toBeNull();
    expect(adapter.getRole1(link)).toBeNull();
    expect(adapter.getArrowThickness()).toBeNull();
  });

  it('gives a titled group a header height and the folder border its cluster style', () => {
    const adapter = adapterOf(GROUPED);
    const header = adapter.getClusterHeader('A', adapter.getDefaultStringBounder());
    expect(Number.isInteger(header.getTitleAndAttributeHeight())).toBe(true);
    expect(header.getTitleAndAttributeHeight()).toBeGreaterThan(0);
    expect(adapter.getClusterStyle('A').stroke.getThickness()).toBe(1.5);
    expect(adapter.getClusterStyleForMagneticBorder('A', adapter.getUSymbol('A')!)).toEqual(
      adapter.getClusterStyle('A'),
    );
    expect(adapter.getClusterBackColor('A')).toBe('none');
    expect(adapter.getPackageStyle('A')).toBeNull();
  });

  it('drops a link whose end is removed (Link.java:492-498)', () => {
    const adapter = adapterOf('component A\ncomponent B\ncomponent C\nA --> B\nA --> C\nremove C');
    expect(adapter.getLinks()).toHaveLength(1);
    expect(adapter.isRemoved('C')).toBe(true);
  });

  it('names an unknown link in the error', () => {
    expect(() => adapterOf('component A').getType('link9')).toThrow('unknown link link9');
  });

  it('gives a folder-shaped leaf a magnetic border and a plain one none', () => {
    const adapter = adapterOf('folder F\ncomponent C');
    const probe = { x: 0, y: 0 };
    const bounder = adapter.getDefaultStringBounder();
    expect(adapter.getMagneticBorder('C').getForceAt(probe, bounder).getDx()).toBe(0);
    expect(adapter.getMagneticBorder('F')).toBeDefined();
  });

  it('returns an empty label block for a link without a label', () => {
    const adapter = adapterOf('component A\ncomponent B\nA --> B');
    const label = adapter.getLabel(adapter.getLinks()[0]!, adapter.getDefaultStringBounder());
    const dim = label.calculateDimension(adapter.getDefaultStringBounder());
    expect([dim.getWidth(), dim.getHeight()]).toEqual([0, 0]);
  });
});

describe('the ELK maker over a description diagram, against the jar', () => {
  const CASES: readonly string[] = [
    'line-styles',
    'standalone-group',
    'table-label',
    'sprite-label',
    'group-title-sprite',
  ];

  it.each(CASES)('%s renders as the jar does', (name) => {
    const puml = readFileSync(join(FIXTURES, `${name}.puml`), 'utf8');
    const oracle = readFileSync(join(FIXTURES, `${name}.svg`), 'utf8');
    const { pass, diffs } = compareSvg(renderSync(puml, { measurer, elk }), oracle, 'deterministic');
    expect(diffs).toEqual([]);
    expect(pass).toBe(true);
  });

  it('puts the three standalone leaves of a group where the jar does (invisible chain, not a row)', () => {
    const puml = readFileSync(join(FIXTURES, 'standalone-group.puml'), 'utf8');
    const rects = [...renderSync(puml, { measurer, elk }).matchAll(/<rect x="([\d.]+)" y="([\d.]+)"/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    // cluster, S (top, centred), V1 and V2 (second row)
    expect(rects).toEqual([
      [12, 12],
      [48.344, 52],
      [27, 126],
      [147.063, 126],
    ]);
  });

  it('refuses with the renderSync message when no backend is passed', () => {
    const svg = renderSync('@startuml\n!pragma layout elk\ncomponent A\n@enduml', { measurer });
    expect(svg).toContain('options.elk');
  });
});
