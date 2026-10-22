/**
 * sdd2-T7f — the sequence renderer forwards the two pieces of document chrome
 * `TextBlockExporter` draws around every diagram: the `HColorGradient`
 * backcolor (`klimt/drawing/svg/SvgGraphics.java:178-183`) and the
 * `diagramBorderColor` border (`core/TextBlockExporter.java:214-231`).
 * Expected values are jar output: `kitevo-12-guvo789` / `dabozi-63-zuco354`
 * goldens, and `scripts/oracle-render.sh` renders of the sources below.
 */
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { sequenceSource } from '../../helpers/sequence-source.js';
import type { SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';

const MEASURER = new DeterministicMeasurer();
const HELLO = 'Bob -> Alice : hello';

function helloAst(): SequenceDiagramAST {
  const parsed = parseSequence(sequenceSource([HELLO]));
  if ('refused' in parsed) throw new Error(`sequence parse refused at line ${String(parsed.line)}`);
  return parsed;
}

function render(...lines: string[]): string {
  return renderFixtureSequence(['@startuml', ...lines, '@enduml'].join('\n'), MEASURER);
}

/** The content group's children, after the root `<g ...>` open tag. */
function contentChildren(svg: string): string {
  const open = /<g font-family="sans-serif"[^>]*>/.exec(svg);
  return open === null ? '' : svg.slice(open.index + open[0].length);
}

describe('renderSequence — gradient document background (Q)', () => {
  it('paints the canvas with a <linearGradient> and drops background: from the root style', () => {
    const svg = render('skinparam backgroundcolor blue/red', HELLO);
    // Oracle render: `<linearGradient x1="0%" y1="0%" x2="100%" y2="100%" id="g…0">`
    // `<stop stop-color="#00F" offset="0%"/><stop stop-color="#F00" offset="100%"/>`,
    // then `<rect x="0" y="0" width="114" height="124" fill="url(#g…0)" style="stroke:none;"/>`.
    const id = /<linearGradient id="([^"]+)" x1="0%" y1="0%" x2="100%" y2="100%">/.exec(svg)?.[1];
    expect(id).toBeDefined();
    expect(contentChildren(svg)).toMatch(
      new RegExp(`^<rect x="0" y="0" width="114" height="124" fill="url\\(#${String(id)}\\)" stroke="none"/>`),
    );
    expect(svg).toContain('style="width:114px;height:124px;"');
  });

  it('hands the gradient over on the fragment, raw background untouched', () => {
    const ast = helloAst();
    const theme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        background: 'blue/red',
        backgroundGradient: { color1: 'blue', color2: 'red', policy: '/' as const },
      },
    };
    const fragment = renderSequence(layoutSequence(ast, theme, MEASURER), theme, MEASURER);
    expect(fragment.backgroundGradient).toEqual({ color1: 'blue', color2: 'red', policy: '/' });
  });

  it('leaves a plain-background fragment without a gradient', () => {
    const ast = helloAst();
    const fragment = renderSequence(layoutSequence(ast, defaultTheme, MEASURER), defaultTheme, MEASURER);
    expect(fragment.backgroundGradient).toBeUndefined();
    expect(fragment.diagramBorderColor).toBeUndefined();
  });
});

describe('renderSequence — diagram border (AD)', () => {
  it('draws the border as the first content child, sized dim - 1 (oracle render)', () => {
    const svg = render('skinparam diagramBorderColor red', HELLO);
    // Oracle: `<rect x="0" y="0" width="112.388" height="122" fill="none" style="stroke:#F00;stroke-width:1;"/>`.
    expect(contentChildren(svg)).toMatch(
      /^<rect x="0" y="0" width="112\.388" height="122" fill="none" stroke="#F00" stroke-width="1"\/>/,
    );
  });

  it('sizes the border to the chrome-composed dimension when a title is present (dabozi-63-zuco354)', () => {
    const svg = render('skinparam diagramBorderColor black', 'title My Title', HELLO);
    // Golden: `<rect x="0" y="0" width="112.388" height="157" fill="none" …/>` before `<g class="title">`.
    expect(contentChildren(svg)).toMatch(
      /^<rect x="0" y="0" width="112\.388" height="157" fill="none" stroke="#000" stroke-width="1"\/><g class="title"/,
    );
  });

  it('rounds the border: diagramBorderRoundCorner 15 -> rx/ry 7.5 (dabozi-63-zuco354 golden)', () => {
    const svg = render(
      'skinparam diagramBorderRoundCorner 15',
      'skinparam diagramBorderColor black',
      'title My Title',
      HELLO,
    );
    expect(contentChildren(svg)).toMatch(
      /^<rect x="0" y="0" width="112\.388" height="157" fill="none" stroke="#000" stroke-width="1" rx="7\.5" ry="7\.5"\/>/,
    );
  });

  it('thickness 2 shrinks the rect by 2 (fexoko-32-feso446 golden: 111.388 x 156)', () => {
    const svg = render(
      'skinparam diagramBorderRoundCorner 15',
      'skinparam diagramBorderColor black',
      'skinparam diagramBorderThickness 2',
      'title My Title',
      HELLO,
    );
    expect(contentChildren(svg)).toMatch(
      /^<rect x="0" y="0" width="111\.388" height="156" fill="none" stroke="#000" stroke-width="2" rx="7\.5" ry="7\.5"\/>/,
    );
  });

  it('a thickness alone draws a black border (TextBlockExporter.java:221-228)', () => {
    const svg = render('skinparam diagramBorderThickness 3', HELLO);
    expect(contentChildren(svg)).toMatch(
      /^<rect x="0" y="0" width="110\.388" height="120" fill="none" stroke="#000" stroke-width="3"\/>/,
    );
  });

  it('the border corner falls back to the plain roundCorner (SkinParam.java:891-904)', () => {
    const svg = render('skinparam roundCorner 10', 'skinparam diagramBorderColor red', HELLO);
    expect(contentChildren(svg)).toMatch(/stroke="#F00" stroke-width="1" rx="5" ry="5"\/>/);
  });

  it('draws the border after the gradient background rect (oracle render)', () => {
    const svg = render('skinparam backgroundcolor blue/red', 'skinparam diagramBorderColor red', HELLO);
    expect(contentChildren(svg)).toMatch(
      /^<rect x="0" y="0" width="114" height="124" fill="url\(#[^)]+\)" stroke="none"\/><rect x="0" y="0" width="112\.388" height="122" fill="none" stroke="#F00" stroke-width="1"\/>/,
    );
  });
});

describe('renderSequence — scaled canvas (SvgGraphics.java:129-143,800-811)', () => {
  /** The root `style`, `width`, `height` and `viewBox` attributes. */
  function rootSize(svg: string): string | undefined {
    return /style="[^"]*" width="[^"]*" height="[^"]*" viewBox="[^"]*"/.exec(svg)?.[0];
  }

  it('scales the ensureVisible-truncated canvas, not the scaled extent (kitevo-12-guvo789, scale 2)', () => {
    // Oracle render of this source, and kitevo's golden: 228 x 248.
    expect(rootSize(render('scale 2', HELLO))).toBe(
      'style="width:228px;height:248px;background:#FFFFFF;" width="228px" height="248px" viewBox="0 0 228 248"',
    );
  });

  it('prints width/height as format(maxX) under a fractional scale (oracle render; jujigi-41-zodo151 golden form)', () => {
    // (int)(113.388 + 1) = 114 and (int)(123 + 1) = 124, times 1.2: style/viewBox
    // truncate (136, 148), width/height keep 3 decimals (136.8, 148.8).
    expect(rootSize(render('scale 1.2', HELLO))).toBe(
      'style="width:136px;height:148px;background:#FFFFFF;" width="136.8px" height="148.8px" viewBox="0 0 136 148"',
    );
  });

  it('leaves an unscaled canvas as (int)(dim + 1) with integer attributes', () => {
    expect(rootSize(render(HELLO))).toBe(
      'style="width:114px;height:124px;background:#FFFFFF;" width="114px" height="124px" viewBox="0 0 114 124"',
    );
  });
});
