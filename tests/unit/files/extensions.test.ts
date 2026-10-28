/**
 * The files engine's skinparam extensions (ddc T3b, D8; DIVERGENCES.md "Extensions"). Each directive maps as a
 * class diagram maps it (FromSkinparamToStyle.java:91,156-157,330-333; handwritten SkinParam.java:1076-1078),
 * Extended mode (the default) shows the change; the
 * jar-compatible mode is byte-identical to the directive-free render.
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { withJarCompatibleStyleInput } from '../../../src/core/internal-render-options.js';
import { hasStyleDirective, isHandwrittenRequested } from '../../../src/diagrams/files/files-extensions.js';

const OPTIONS = { measurer: new DeterministicMeasurer() };
const JAR_OPTIONS = withJarCompatibleStyleInput(OPTIONS);
const BODY = '/Alpha/\n/Alpha/Bravo.txt\n<note>\nhello\n</note>\n@endfiles';
const PLAIN = `@startfiles\n${BODY}`;
const withDirective = (directive: string): string => `@startfiles\nskinparam ${directive}\n${BODY}`;
const NOTE_PATH = '<path d="M31,59.5 L31,82.5 L79.544,82.5 L79.544,69.5 L69.544,59.5 L31,59.5"';

describe('files extensions: style directives', () => {
  it('defaultFontName sets font-family on every text (root FontName, FromSkinparamToStyle.java:156)', () => {
    const svg = renderSync(withDirective('defaultFontName Courier'), OPTIONS);
    expect(svg.match(/<text [^>]*font-family="Courier"/g)).toHaveLength(3);
    expect(renderSync(PLAIN, OPTIONS)).not.toContain('Courier');
  });

  it('defaultFontSize sets the font size of entries and note and the canvas (element FontSize, java:91)', () => {
    const svg = renderSync(withDirective('defaultFontSize 20'), OPTIONS);
    expect(svg.match(/font-size="20"/g)).toHaveLength(3);
    expect(svg).toContain('width="150px" height="122px"');
    expect(renderSync(PLAIN, OPTIONS)).toContain('width="118px" height="95px"');
  });

  it('defaultFontColor fills every text (root FontColor, java:157)', () => {
    const svg = renderSync(withDirective('defaultFontColor #FF0000'), OPTIONS);
    expect(svg.match(/fill="#F00"/g)).toHaveLength(3);
    expect(renderSync(PLAIN, OPTIONS)).not.toContain('#F00');
  });

  it('shadowing true filters the note body (root Shadowing 3, java:330-333, 386-394)', () => {
    const svg = renderSync(withDirective('shadowing true'), OPTIONS);
    expect(svg).toMatch(/<filter id="(\w+)"[^>]*><feGaussianBlur result="blurOut" stdDeviation="2"\/>/);
    expect(svg.match(/filter="url\(#\w+\)"/g)).toHaveLength(1);
    expect(renderSync(PLAIN, OPTIONS)).not.toContain('<filter');
  });

  it('shadowing false adds no filter (Shadowing 0)', () => {
    expect(renderSync(withDirective('shadowing false'), OPTIONS)).toBe(renderSync(PLAIN, OPTIONS));
  });

  it('declaration order decides between a skinparam and a <style> block', () => {
    const block = '<style>\nfilesDiagram {\n  FontColor #0000FF\n}\n</style>';
    const skinparam = 'skinparam defaultFontColor #FF0000';
    const styleLast = renderSync(`@startfiles\n${skinparam}\n${block}\n${BODY}`, OPTIONS);
    expect(styleLast.match(/<text [^>]*fill="#00F"/g)).toHaveLength(3);
    const skinparamLast = renderSync(`@startfiles\n${block}\n${skinparam}\n${BODY}`, OPTIONS);
    expect(skinparamLast.match(/<text [^>]*fill="#F00"/g)).toHaveLength(3);
  });

  it('lineColor is ignored: FromSkinparamToStyle has no row for it, as in a class diagram', () => {
    expect(renderSync(withDirective('lineColor #0000FF'), OPTIONS)).toBe(renderSync(PLAIN, OPTIONS));
  });

  it('only the listed keys reach the style: other skinparams stay cut', () => {
    expect(renderSync(withDirective('noteBackgroundColor #FF0000'), OPTIONS)).toBe(renderSync(PLAIN, OPTIONS));
  });
});

describe('files extensions: handwritten', () => {
  it('skinparam handwritten true jiggles the note outline into polylines (UGraphicHandwritten)', () => {
    const svg = renderSync(withDirective('handwritten true'), OPTIONS);
    expect(svg).toContain('<path d="M31,59.5 L31.187,59.5 L30.632,64.1');
    expect(svg).toContain('width="118px" height="95px"');
    expect(renderSync(PLAIN, OPTIONS)).toContain(NOTE_PATH);
  });

  it('handwritten false leaves the drawing as is', () => {
    expect(renderSync(withDirective('handwritten false'), OPTIONS)).toBe(renderSync(PLAIN, OPTIONS));
  });

  it('is case-insensitive and the last assignment wins', () => {
    const style = { skinparam: new Map([['handwritten', 'TRUE']]), styles: [] };
    expect(isHandwrittenRequested(style)).toBe(true);
    expect(isHandwrittenRequested({ ...style, skinparam: new Map([['Handwritten', ' false ']]) })).toBe(false);
    expect(isHandwrittenRequested({ ...style, skinparam: new Map() })).toBe(false);
  });
});

describe('files extensions: jar-compatible mode is byte-identical to the directive-free render', () => {
  const plain = renderSync(PLAIN, JAR_OPTIONS);

  it.each([
    'defaultFontName Courier',
    'defaultFontSize 20',
    'defaultFontColor #FF0000',
    'shadowing true',
    'handwritten true',
  ])('%s', (directive) => {
    expect(renderSync(withDirective(directive), JAR_OPTIONS)).toBe(plain);
    expect(plain).toBe(renderSync(PLAIN, OPTIONS));
  });

  it('a source without a directive renders the same in both modes', () => {
    expect(renderSync(PLAIN, OPTIONS)).toBe(plain);
  });
});

describe('files extensions: directive detection', () => {
  it('hasStyleDirective sees the four style keys, however spelled, and nothing else', () => {
    const only = (key: string) => hasStyleDirective({ skinparam: new Map([[key, 'x']]), styles: [] });
    expect(only('DefaultFontName')).toBe(true);
    expect(only('default_font_size')).toBe(true);
    expect(only('shadowing')).toBe(true);
    expect(only('handwritten')).toBe(false);
    expect(only('backgroundColor')).toBe(false);
  });
});
