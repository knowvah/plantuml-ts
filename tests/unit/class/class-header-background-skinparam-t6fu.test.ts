/**
 * CDD T6FU (T20 follow-up) — `skinparam classHeaderBackgroundColor`.
 *
 * `FromSkinparamToStyle.java:196` maps the key onto the
 * `{element, class_, header}` StyleSignature, which is exactly the
 * signature `EntityImageClass#getStyleHeader` (java:173-178) queries for
 * `PName.BackGroundColor` when the entity carries NO inline `header:` and
 * NO inline `back:`/bare colour (`EntityImageClass.java:202-205`):
 *
 *   if (headerBackcolor == null)
 *     headerBackcolor = backcolor == null
 *         ? getStyleHeader().value(PName.BackGroundColor).asColor(...)
 *         : backcolor;
 *
 * so a classifier with an inline background NEVER splits (header is the
 * same reference as the body), and one without splits whenever the
 * resolved header colour differs from the resolved body colour.
 * Jar-verified `nisune-86-faji869`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:196
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:192-234
 */
import { describe, it, expect } from 'vitest';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(markup: string): string {
  return renderFixtureClass(markup, new DeterministicMeasurer());
}

function entityGroup(svg: string, name: string): string {
  const marker = `<!--class ${name}-->`;
  const start = svg.indexOf(marker);
  if (start === -1) throw new Error(`entity "${name}" not found in rendered SVG`);
  const bodyStart = svg.indexOf('<g class="entity"', start);
  const next = svg.indexOf('<!--', bodyStart + 1);
  return svg.slice(bodyStart, next === -1 ? svg.length : next);
}

function rects(group: string): string[] {
  return [...group.matchAll(/<rect [^>]*\/>/g)].map((m) => m[0]);
}

function fillOf(tag: string): string | undefined {
  return /fill="([^"]*)"/.exec(tag)?.[1];
}

const HEADER_SKIN = 'skinparam classHeaderBackgroundColor #444';

describe('T6FU: skinparam classHeaderBackgroundColor reaches the header split', () => {
  it('splits a classifier with no inline colour into the 4-shape form', () => {
    const svg = render(['@startuml', HEADER_SKIN, 'class classA {', 'testMethodCode()', '}', '@enduml'].join('\n'));
    const rs = rects(entityGroup(svg, 'classA'));
    expect(rs).toHaveLength(4);
    // rect1: body fill (class default) + border; rect2/rect3: header fill,
    // ALSO stroked with the header colour; rect4: the border re-drawn on top.
    expect(fillOf(rs[0] ?? '')).toBe('#F1F1F1');
    expect(fillOf(rs[1] ?? '')).toBe('#444');
    expect(rs[1]).toContain('stroke="#444"');
    expect(fillOf(rs[2] ?? '')).toBe('#444');
    expect(fillOf(rs[3] ?? '')).toBe('none');
  });

  it('does NOT split a classifier carrying an inline background colour', () => {
    // `EntityImageClass.java:203-205`: backcolor != null makes headerBackcolor
    // the SAME reference, so `backcolor.equals(headerBackcolor)` is true.
    const svg = render(
      ['@startuml', HEADER_SKIN, 'class classB #fff {', 'testMethodCode()', '}', '@enduml'].join('\n'),
    );
    const rs = rects(entityGroup(svg, 'classB'));
    expect(rs).toHaveLength(1);
    expect(fillOf(rs[0] ?? '')).toBe('#FFF');
  });

  it('does NOT split when the header colour equals the body colour', () => {
    const svg = render(
      [
        '@startuml',
        'skinparam classHeaderBackgroundColor #ADD8E6',
        'skinparam classBackgroundColor #ADD8E6',
        'class classC',
        '@enduml',
      ].join('\n'),
    );
    const rs = rects(entityGroup(svg, 'classC'));
    expect(rs).toHaveLength(1);
    expect(fillOf(rs[0] ?? '')).toBe('#ADD8E6');
  });

  it('accepts the nested-block form `skinparam class { HeaderBackgroundColor }`', () => {
    const svg = render(
      ['@startuml', 'skinparam class {', 'HeaderBackgroundColor #444', '}', 'class classD', '@enduml'].join('\n'),
    );
    const rs = rects(entityGroup(svg, 'classD'));
    expect(rs).toHaveLength(4);
    expect(fillOf(rs[1] ?? '')).toBe('#444');
  });
});

/**
 * `StyleStorage#computeMergedStyle` (java:102-116) merges EVERY style whose
 * signature matches the query, in REGISTRATION order, with
 * `MergeStrategy.OVERWRITE_EXISTING_VALUE`; `DarkString#mergeWith`
 * (java:50-66) then keeps the bigger `AutomaticCounter` priority. Both
 * `classBackgroundColor` (`{element, class_}`) and
 * `classHeaderBackgroundColor` (`{element, class_, header}`) match
 * `getStyleHeader`'s query, so on equal specificity the LAST one written
 * wins -- the header signature is NOT more specific for this purpose.
 * Jar-probed directly (`oracle-render.sh`, both orders).
 */
describe('T6FU: classBackgroundColor and classHeaderBackgroundColor merge by source order', () => {
  const decl = ['class foo1', '@enduml'];

  it('a LATER classBackgroundColor suppresses the split', () => {
    // cunavo-77-filo788 / ziromu-57-mima164 / dofima-22-kofe334 /
    // jireze-84-loti743 all take this order; the jar draws ONE rect.
    const svg = render(
      ['@startuml', 'skinparam classHeaderBackgroundColor #4FF', 'skinparam classBackgroundColor #77F', ...decl].join(
        '\n',
      ),
    );
    const rs = rects(entityGroup(svg, 'foo1'));
    expect(rs).toHaveLength(1);
    expect(fillOf(rs[0] ?? '')).toBe('#77F');
  });

  it('a LATER classHeaderBackgroundColor still splits', () => {
    const svg = render(
      ['@startuml', 'skinparam classBackgroundColor #77F', 'skinparam classHeaderBackgroundColor #4FF', ...decl].join(
        '\n',
      ),
    );
    const rs = rects(entityGroup(svg, 'foo1'));
    expect(rs).toHaveLength(4);
    expect(fillOf(rs[0] ?? '')).toBe('#77F');
    expect(fillOf(rs[1] ?? '')).toBe('#4FF');
  });

  it('the same order rule holds inside a `skinparam class { }` block', () => {
    // dofima-22-kofe334's block: HeaderBackgroundColor THEN BackgroundColor.
    const svg = render(
      ['@startuml', 'skinparam class {', 'HeaderBackgroundColor red', 'BackgroundColor yellow', '}', ...decl].join(
        '\n',
      ),
    );
    expect(rects(entityGroup(svg, 'foo1'))).toHaveLength(1);
  });
});
