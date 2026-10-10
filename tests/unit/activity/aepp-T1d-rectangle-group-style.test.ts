import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';

/**
 * `FtileGroup.getStyleSignature(symbol)` (`ftile/vcompact/FtileGroup.java:89-92`)
 * resolves `of(root, element, activityDiagram, symbol.getSNames(), composite)`,
 * so `skinparam <symbol> { ... }` (`FromSkinparamToStyle.java:127-129,212-223`)
 * reaches the group frame. Expected values are the oracle jar's own output
 * (`scripts/oracle-render.sh` on the same sources).
 */
function render(lines: readonly string[]): string {
  return renderSync(['@startuml', ...lines, '@enduml'].join('\n'), { measurer: new DeterministicMeasurer() });
}

function block(keyword: string): readonly string[] {
  return [
    `skinparam ${keyword} {`,
    'BackgroundColor red',
    'BorderColor blue',
    'RoundCorner 25',
    'BorderThickness 3',
    '}',
  ];
}

const BODY = ['outerAction {', ':innerAction;', '}'];

/** The first element of `tag` (the group frame is drawn before its body). */
function first(svg: string, tag: string): string {
  return new RegExp(`<${tag}[^>]*>`).exec(svg)![0];
}

describe('group frame style keyed on the USymbol', () => {
  // Blocked (stop 8): `skinparam <sname>RoundCorner` is not stored per element
  // by src/core (`skinparam-key-handlers-table-a.ts` handles only the bare
  // `roundcorner`), so rx/ry cannot reach this renderer. tidoda needs it.
  it('rectangle and card RoundCorner 25 draw rx=ry=12.5 (FtileGroup.java:103)', () => {
    for (const k of ['rectangle', 'card']) {
      const svg = render([...block(k), `${k} ${BODY[0]}`, ...BODY.slice(1)]);
      expect(first(svg, 'rect')).toContain('rx="12.5" ry="12.5"');
    }
  });

  it('tidoda: rectangle takes its own block (fill, stroke, thickness)', () => {
    const svg = render([
      'skinparam rectangle {',
      'RoundCorner 25',
      'BackgroundColor red',
      'BorderColor blue',
      '}',
      'hide stereotype',
      'rectangle outerAction {',
      ':innerAction;',
      '}',
    ]);
    const el = first(svg, 'rect');
    expect(el).toContain('fill="#F00"');
    expect(el).toContain('stroke="#00F"');
    expect(el).toContain('stroke-width="1.5"');
  });

  it('rectangle: BorderThickness 3 replaces the composite 1.5', () => {
    const el = first(render([...block('rectangle'), `rectangle ${BODY[0]}`, ...BODY.slice(1)]), 'rect');
    expect(el).toContain('fill="#F00"');
    expect(el).toContain('stroke-width="3"');
  });

  it('card: fill, stroke, thickness on the rect and the hline', () => {
    const svg = render([...block('card'), `card ${BODY[0]}`, ...BODY.slice(1)]);
    expect(first(svg, 'rect')).toContain('fill="#F00"');
    expect(first(svg, 'rect')).toContain('stroke="#00F"');
    expect(first(svg, 'line')).toContain('stroke="#00F"');
    expect(first(svg, 'line')).toContain('stroke-width="3"');
  });

  it('package: fill, stroke, thickness on the folder', () => {
    const svg = render([...block('package'), `package ${BODY[0]}`, ...BODY.slice(1)]);
    expect(first(svg, 'polygon')).toContain('fill="#F00"');
    expect(first(svg, 'polygon')).toContain('stroke="#00F"');
    expect(first(svg, 'polygon')).toContain('stroke-width="3"');
  });

  it('group: only packageBackground/BorderColor reach it (-> SName.group)', () => {
    const svg = render([
      'skinparam PackageBackgroundColor yellow',
      'skinparam PackageBorderColor blue',
      'skinparam PackageBorderThickness 3',
      `group ${BODY[0]}`,
      ...BODY.slice(1),
    ]);
    const el = first(svg, 'rect');
    expect(el).toContain('fill="#FF0"');
    expect(el).toContain('stroke="#00F"');
    expect(el).toContain('stroke-width="1.5"');
  });

  it('group: a `skinparam group { }` block has no style mapping upstream', () => {
    const el = first(render([...block('group'), `group ${BODY[0]}`, ...BODY.slice(1)]), 'rect');
    expect(el).toContain('fill="none"');
    expect(el).toContain('stroke="#000"');
  });

  it('partition: Partition* skinparams colour the frame', () => {
    const el = first(render([...block('partition'), `partition ${BODY[0]}`, ...BODY.slice(1)]), 'rect');
    expect(el).toContain('fill="#F00"');
    expect(el).toContain('stroke="#00F"');
  });

  it('Partition* skinparams beat the symbol block (jar probe)', () => {
    const svg = render([
      'skinparam rectangle {',
      'BackgroundColor red',
      'BorderColor blue',
      '}',
      'skinparam PartitionBackgroundColor lime',
      'skinparam PartitionBorderColor green',
      `rectangle ${BODY[0]}`,
      ...BODY.slice(1),
    ]);
    const el = first(svg, 'rect');
    expect(el).toContain('fill="#0F0"');
    expect(el).toContain('stroke="#008000"');
  });

  it('an explicit #colour on the opener beats the symbol block', () => {
    const svg = render([...block('rectangle'), 'rectangle #yellow outerAction {', ':innerAction;', '}']);
    expect(first(svg, 'rect')).toContain('fill="#FF0"');
  });
});
