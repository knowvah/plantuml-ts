/**
 * A SAX sprite gradient in a sequence label, end to end. The jar
 * (`sequence/bucebo-91-xavo442`, `in.svg`) writes every sprite gradient as an
 * N-stop `<linearGradient>` in the ROOT `<defs>` (`SvgGraphics.java:411-448`),
 * ids `g<seed><n>` in first-use order (java:393,431), and the sprite's
 * `<path>`s reference it as `fill`/`stroke` `url(#id)`
 * (`DriverRectangleSvg.java:83-86,99-102`); nothing is written inside the
 * root `<g>`.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const SPRITE =
  '<svg width="20px" height="20px" viewBox="0 0 20 20"><defs>' +
  '<linearGradient x1="59.7188447%" y1="52.3127289%" x2="52.6914332%" y2="54.8636556%" id="shade">' +
  '<stop stop-color="#000000" stop-opacity="0.3" offset="0%"></stop>' +
  '<stop stop-color="#000000" stop-opacity="0.2" offset="7.1%"></stop>' +
  '<stop stop-color="#000000" stop-opacity="0" offset="100%"></stop></linearGradient>' +
  '<linearGradient x1="37.2789399%" y1="4.60005789%" x2="62.4733904%" y2="99.9794963%" id="sky">' +
  '<stop stop-color="#3CCBF4" offset="0%"></stop><stop stop-color="#2892DF" offset="100%"></stop>' +
  '</linearGradient></defs><g>' +
  '<path d="M0,0 L10,0 L10,10 Z" fill="url(#shade)"></path>' +
  '<path d="M10,10 L20,10 L20,20 Z" fill="url(#sky)"></path>' +
  '<path d="M0,10 L10,10 L10,20 Z" fill="url(#shade)"></path></g></svg>';

function render(): string {
  return renderFixtureSequence(
    `@startuml\n!pragma svgparser sax\nsprite $grad ${SPRITE}\nAlice -> Bob : hi <$grad> there\n@enduml\n`,
    new DeterministicMeasurer(),
  );
}

function rootDefs(svg: string): string {
  const defs = /<defs>(.*?)<\/defs>/s.exec(svg)?.[1];
  if (defs === undefined) throw new Error('no <defs> in ' + svg);
  return defs;
}

describe('SAX sprite gradients in a sequence label', () => {
  const svg = render();
  const defs = rootDefs(svg);
  const ids = [...defs.matchAll(/<linearGradient [^>]*id="([^"]*)"/g)].map((m) => m[1] ?? '');

  it('writes one N-stop <linearGradient> per distinct gradient into the root <defs>, with the jar stops', () => {
    expect(ids).toHaveLength(2);
    expect(defs).toContain(
      'x1="59.719%" y1="52.313%" x2="52.691%" y2="54.864%"><stop offset="0%" stop-color="#000" stop-opacity="0.3"/>' +
        '<stop offset="7.1%" stop-color="#000" stop-opacity="0.2"/>' +
        '<stop offset="100%" stop-color="#000" stop-opacity="0"/></linearGradient>',
    );
    expect(defs).toContain(
      'x1="37.279%" y1="4.6%" x2="62.473%" y2="99.979%"><stop offset="0%" stop-color="#3CCBF4"/>' +
        '<stop offset="100%" stop-color="#2892DF"/></linearGradient>',
    );
  });

  it('numbers them g<seed>0, g<seed>1 in first-use order (SvgGraphics.java:393,431)', () => {
    expect(ids[0]).toMatch(/^g[0-9a-z]+0$/);
    expect(ids[1]).toBe((ids[0] ?? '').slice(0, -1) + '1');
  });

  it('references them from the sprite paths as fill and stroke, the shared one twice', () => {
    const [shade = '', sky = ''] = ids;
    expect(
      svg.match(new RegExp(`style="stroke:url\\(#${shade}\\);stroke-width:1;" fill="url\\(#${shade}\\)"`, 'g')),
    ).toHaveLength(2);
    expect(svg.match(new RegExp(`fill="url\\(#${sky}\\)"`, 'g'))).toHaveLength(1);
  });

  it('leaves nothing inline in the body', () => {
    expect(svg.slice(svg.indexOf('</defs>'))).not.toContain('<linearGradient');
  });
});
