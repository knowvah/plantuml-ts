/**
 * unwind-U4 (3): embedded `{{ }}` sub-diagrams against the jar
 * (`tests/fixtures/unwind-U4/embedded/`, `scripts/oracle-render.sh`).
 *
 * The parent `<image>` is the jar's; the base64 payload is
 * `UImageSvg#getSvg` + `SvgGraphics#svgImage`'s re-rooted wrapper
 * (`UImageSvg.java:65-93`, `SvgGraphics.java:1015-1029`) around the nested
 * render. That nested render is this port's own top-level render of the
 * nested source -- so the payload equals the jar's exactly where the port's
 * top-level render does, and differs exactly where it does.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { UImageSvg, svgImagePayload } from '../../../src/core/klimt/shape/UImageSvg.js';
import { compareSvg } from './compare.js';

const DIR = 'tests/fixtures/unwind-U4/embedded';
const PI = /<\?plantuml.+?\?>/g;

function read(name: string, ext: string): string {
  return readFileSync(join(DIR, `${name}.${ext}`), 'utf8');
}

function render(markup: string): string {
  return renderSync(markup, { measurer: new DeterministicMeasurer() });
}

function svgPayload(svg: string): string {
  const m = /data:image\/svg\+xml;base64,([^"]+)/.exec(svg);
  return Buffer.from(m![1]!, 'base64').toString('utf8');
}

describe('unwind-U4 embedded {{ }} sub-diagram payloads', () => {
  it.each(['class-body', 'class-body-class'])('%s: the parent diagram renders equal to the jar', (name) => {
    expect(compareSvg(render(read(name, 'puml')), read(name, 'svg'), 'deterministic').diffs).toEqual([]);
  });

  it.each([
    ['class-body', 'nested-seq'],
    ['class-body-class', 'nested-class'],
  ])('%s: our payload is the UImageSvg wrapper around our own top-level render', (parent, nested) => {
    const top = render(read(nested, 'puml')).replace(PI, '');
    expect(svgPayload(render(read(parent, 'puml')))).toBe(svgImagePayload(new UImageSvg(top, 1)));
  });

  it("the jar's payload is the same wrapper around the jar's own top-level render (sequence)", () => {
    const jarTop = read('nested-seq', 'svg').replace(PI, '');
    expect(svgPayload(read('class-body', 'svg'))).toBe(svgImagePayload(new UImageSvg(jarTop, 1)));
  });

  it('our payload and the jar payload share the re-rooted header byte for byte', () => {
    const header = (svg: string) => svgPayload(svg).slice(0, svgPayload(svg).indexOf('>') + 1);
    expect(header(render(read('class-body', 'puml')))).toBe(header(read('class-body', 'svg')));
  });
});
