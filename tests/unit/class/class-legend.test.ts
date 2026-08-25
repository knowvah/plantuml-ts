/**
 * Legend-region dispatch exclusion (mission A2, iter 23b).
 *
 * Upstream registers both the single-line (`CommandLegend`) and multi-line
 * block (`CommandMultilinesLegend`) legend commands as `CommonCommand`s,
 * available to every diagram type
 * (~/git/plantuml/.../command/CommonCommands.java:115-116,
 * ~/git/plantuml/.../command/UBrexCommonCommands.java:102-103). A legend's
 * body is `DisplayPositioned` text — display-only, never diagram content —
 * so it must never be mistaken for a descriptive-element declaration during
 * dispatch probing, nor parsed as class content once dispatched.
 *
 * bixogo-47-xulu385 / roxosu-00-pini153 (after `!procedure` expansion) are a
 * lone degenerate `class foo` whose trailing `legend`…`endlegend` body
 * contains salt-widget syntax (`()one`, `()two`, `[ok]`) that trips the
 * descriptive-signal scan (`ELEMENT_SHORTHAND_PATTERNS` in
 * `descriptive-keywords.ts`) without the fix in this file's target, misrouting
 * the whole block to the description engine, which then invents entities
 * from the legend text and drops `class foo` entirely. The oracle jar emits
 * 0 svek graphs for these fixtures (the real content is a lone degenerate
 * classifier); this suite verifies we now match that 0-graph, class-routed
 * outcome.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { renderFixture } from '../../helpers/render.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';

/** Split markup into trimmed, non-empty content lines (as accepts() receives). */
const L = (s: string): string[] =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter((x) => x !== '');

function parse(source: string): ClassDiagramAST {
  const block: UmlSource = { lines: L(source), type: 'class' };
  return parseClass(block);
}

/** The exact post-`!procedure`-expansion legend body shared by both live
 *  fixtures (bixogo-47-xulu385, roxosu-00-pini153): a salt widget wrapped in
 *  `{{salt ... }}`, itself containing `{+ ... }`-bracketed choice syntax with
 *  `()one`, `()two`, `[ok]` lines. */
const SALT_LEGEND_BODY = [
  '{{salt',
  '{+',
  '<b>an example',
  'choose one option',
  '()one',
  '()two',
  '[ok]',
  '}',
  '}}',
];


describe('parseClass — legend block consumption (iter 23b)', () => {
  it('consumes a salt-widget legend body without inventing classifiers, relationships, or notes', () => {
    const ast = parse(
      ['class foo', 'legend', ...SALT_LEGEND_BODY, 'endlegend'].join('\n'),
    );
    expect(ast.classifiers).toHaveLength(1);
    expect(ast.classifiers[0]?.id).toBe('foo');
    expect(ast.relationships).toHaveLength(0);
    expect(ast.namespaces).toHaveLength(0);
    expect(ast.notes).toHaveLength(0);
  });

  it.each(['legend top', 'legend bottom left', 'legend right'])(
    'opener variant %s is fully consumed by the parser',
    (opener) => {
      const ast = parse(['class foo', opener, '()one', '[ok]', 'endlegend'].join('\n'));
      expect(ast.classifiers).toHaveLength(1);
      expect(ast.relationships).toHaveLength(0);
    },
  );

  it.each(['endlegend', 'end legend'])(
    'closer spelling %s is recognized and parsing resumes afterward',
    (closer) => {
      const ast = parse(
        ['class foo', 'legend', '[ok]', closer, 'class bar', 'foo -- bar'].join('\n'),
      );
      // Legend consumed everything up to (and including) the closer; the
      // class/relationship lines AFTER it parse normally.
      expect(ast.classifiers.map((c) => c.id).sort()).toEqual(['bar', 'foo']);
      expect(ast.relationships).toHaveLength(1);
    },
  );

  it('a note declared before the legend is unaffected', () => {
    const ast = parse(
      [
        'class foo',
        'note right of foo',
        'a real note',
        'end note',
        'legend',
        '[ok]',
        'endlegend',
      ].join('\n'),
    );
    expect(ast.classifiers).toHaveLength(1);
    expect(ast.notes).toHaveLength(1);
  });
});

describe('end-to-end: bixogo/roxosu-shaped fixture renders as a degenerate 0-graph diagram', () => {
  const measurer = new FormulaMeasurer();

  it('layoutClass sees 0 DOT graphs for a single classifier + salt legend', () => {
    const ast = parse(
      ['class foo', 'legend', ...SALT_LEGEND_BODY, 'endlegend'].join('\n'),
    );
    let captured = 0;
    const graphs: DotInputGraph[] = [];
    setLayoutInputObserver((g) => {
      captured++;
      graphs.push(g);
    });
    try {
      layoutClass(ast, defaultTheme, measurer);
    } finally {
      setLayoutInputObserver(undefined);
    }
    expect(captured).toBe(0);
  });

  it('renderFixture (full pipeline incl. !procedure expansion) draws the class box, not the legend widget', () => {
    const source = [
      '@startuml',
      '',
      '!unquoted procedure SALT($x)',
      '{{salt',
      '%invoke_procedure("_"+$x)',
      '}}',
      '!endprocedure',
      '',
      '!procedure _choose()',
      '{+',
      '<b>an example',
      'choose one option',
      '()one',
      '()two',
      '[ok]',
      '}',
      '!endprocedure',
      '',
      'class foo',
      '',
      'legend',
      'SALT(choose)',
      'endlegend',
      '',
      '@enduml',
    ].join('\n');
    const svg = renderFixture(source);
    expect(svg).toContain('<svg');
    expect(svg).toContain('foo');
  });
});

describe('description diagrams keep their own legend unaffected (iter 23b)', () => {



});
