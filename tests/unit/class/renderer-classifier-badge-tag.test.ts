/**
 * T11 (cdd3, Q-4): `renderGenericTag`'s fill/border cascade --
 * `EntityImageClassHeader.java:138-149`. Every expected value is
 * jar-verified against `camuna-58-veca254`/`nafiki-56-jixu680`'s own
 * `<style>` block (oracle `svg/g[1]/g[1]/rect[2]/@fill = #800080`) or
 * cdd2-T13's authored jar probe c (`gen-c.puml`, `skinparam
 * classBackgroundColor LightBlue` -> generic tag `fill="#ADD8E6"`).
 */
import { describe, it, expect } from 'vitest';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(markup: string): string {
  return renderFixtureClass(markup, new DeterministicMeasurer());
}

/** The generic tag's own dashed `<rect>` -- `stroke-dasharray:2,2`, the
 *  ONE such rect this engine ever draws (`renderer-classifier-badge-tag.ts
 *  #renderGenericTag`). */
function genericTagRect(svg: string): string | undefined {
  return [...svg.matchAll(/<rect [^>]*\/>/g)].map((m) => m[0]).find((r) => r.includes('stroke-dasharray="2,2"'));
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1] ?? new RegExp(`${name}:([^;"]*)`).exec(tag)?.[1];
}

describe('renderGenericTag fill/border cascade (T11, Q-4)', () => {
  it('plain class HashMap<Long,Customer> with NO override: generic tag stays #FFFFFF (jar default)', () => {
    const svg = render(['@startuml', 'class HashMap<Long,Customer>', '@enduml'].join('\n'));
    const rect = genericTagRect(svg);
    expect(rect).toBeDefined();
    expect(attr(rect!, 'fill')).toBe('#FFF');
  });

  it('camuna-58-veca254: class { generic { BackgroundColor purple } } } resolves the generic tag fill to #800080 -- oracle rect[2]/@fill', () => {
    const svg = render(
      [
        '@startuml',
        '<style>',
        'class {',
        '  BackgroundColor yellow',
        '  generic {',
        '    BackgroundColor purple',
        '  }',
        '}',
        '</style>',
        'class HashMap<Long,Customer>',
        '@enduml',
      ].join('\n'),
    );
    const rect = genericTagRect(svg);
    expect(rect).toBeDefined();
    expect(attr(rect!, 'fill')).toBe('#800080');
  });

  it('cdd2-T13 Q-4 probe c: a bare class { BackgroundColor } (no nested generic block) recolors the tag too -- subset-match', () => {
    const svg = render(
      [
        '@startuml',
        '<style>',
        'class {',
        '  BackgroundColor yellow',
        '}',
        '</style>',
        'class HashMap<Long,Customer>',
        '@enduml',
      ].join('\n'),
    );
    const rect = genericTagRect(svg);
    expect(rect).toBeDefined();
    expect(attr(rect!, 'fill')).toBe('#FF0');
  });

  it('cdd2-T13 Q-4 probe c (skinparam tier): skinparam classBackgroundColor LightBlue recolors the tag too (gen-c.puml, #ADD8E6)', () => {
    const svg = render(
      ['@startuml', 'skinparam classBackgroundColor LightBlue', 'class HashMap<Long,Customer>', '@enduml'].join('\n'),
    );
    const rect = genericTagRect(svg);
    expect(rect).toBeDefined();
    expect(attr(rect!, 'fill')).toBe('#ADD8E6');
  });
});
