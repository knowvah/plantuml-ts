/**
 * A creole `<math>`/`<latex>` atom in a STATE's text is DRAWN, not merely
 * measured: `AtomMath#drawU` paints one image and nothing else
 * (`AtomMath.java:78-97`), and `SheetBlock1#drawU` puts it at the atom's own
 * `Position` (`SheetBlock1.java:212-217`).
 *
 * TDD: written before `renderStateRuns` learned to emit an `<image>`.
 * `corumi-91-mizo869` and `gupeto-19-mesa256` both label a state with
 * `<math>S<=1/(F+(1-F)/N)</math>` and the jar draws exactly ONE `<image>` for
 * it; between `CommandCreoleMath` being registered and this change the port
 * drew NEITHER an image nor the literal text, i.e. it lost the formula.
 *
 * No number here is compared against the jar's: the image's bytes and its
 * exact width/height are a PERMANENT divergence (`DIVERGENCES.md`, "LaTeX
 * rendering engine — KaTeX, not JLaTeXMath", which names `<math>`). Every
 * expectation is derived from `core/latex.ts#renderLatexAsImage`, the one
 * renderer both the sizer and the renderer go through.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { renderStateRuns } from '../../../src/diagrams/state/renderer-box.js';
import { renderLatexAsImage } from '../../../src/core/latex.js';
import { JAR_DEFAULT_TEXT_COLOR } from '../../../src/core/decoration/symbol/usymbol-resolve.js';
import type { StateTextRun } from '../../../src/diagrams/state/state-sizing-creole.js';

const MATH_STATE = '@startuml\nstate State\nState : <math>S<=1/(F+(1-F)/N)</math>\n@enduml';

function svgOf(source: string): string {
  const out = renderSync(source, { measurer: new WidthTableMeasurer() });
  return typeof out === 'string' ? out : (out as { svg: string }).svg;
}

const plainRun = (text: string, width: number): StateTextRun => ({
  text,
  width,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  size: 14,
  dy: 0,
});

describe('renderStateRuns — a latex atom draws its image', () => {
  const drawn = renderLatexAsImage('{x}', JAR_DEFAULT_TEXT_COLOR);
  const imageRun: StateTextRun = {
    ...plainRun('', drawn.width),
    image: { href: drawn.href, width: drawn.width, height: drawn.height, top: 3 },
  };

  it('emits one <image> at the run x and the line top plus the atom own box top', () => {
    const svg = renderStateRuns([imageRun], 12, 40, drawn.height + 3, {
      fontFamily: 'sans-serif',
      fill: '#000000',
    });
    expect(svg).toContain(`x="12"`);
    // `lineTop` 40 + the atom's own `Sea` box top 3.
    expect(svg).toContain(`y="43"`);
    expect(svg).toContain(`width="${drawn.width}"`);
    expect(svg).toContain(`height="${drawn.height}"`);
    expect(svg).toContain(drawn.href);
    expect(svg.match(/<image /g)).toHaveLength(1);
    // An image atom has no baseline, so no `<text>` is emitted for it.
    expect(svg).not.toContain('<text');
  });

  it('advances x past the image so a following text run starts at its right edge', () => {
    const after = plainRun('there', 30);
    const svg = renderStateRuns([imageRun, after], 12, 40, drawn.height + 3, {
      fontFamily: 'sans-serif',
      fill: '#000000',
    });
    expect(svg).toContain(`<text x="${12 + drawn.width}"`);
    expect(svg).toContain('>there<');
  });
});

describe('a state labelled with <math> (corumi-91-mizo869 / gupeto-19-mesa256)', () => {
  it('draws exactly one <image>, matching the jar count of 1', () => {
    const svg = svgOf(MATH_STATE);
    expect(svg.match(/<image /g)).toHaveLength(1);
  });

  it('draws no literal <math> markup — the tags are consumed by the command', () => {
    expect(svgOf(MATH_STATE)).not.toContain('&lt;math&gt;');
  });

  it('sizes the state box around the image it draws, so the formula fits inside it', () => {
    const svg = svgOf(MATH_STATE);
    const image = /<image width="([\d.]+)" height="([\d.]+)" x="([\d.]+)" y="([\d.]+)"/.exec(svg);
    const rect = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg);
    expect(image).not.toBeNull();
    expect(rect).not.toBeNull();
    const [, iw, ih, ix, iy] = image!.map(Number);
    const [, rx, ry, rw, rh] = rect!.map(Number);
    expect(ix! + iw!).toBeLessThanOrEqual(rx! + rw!);
    expect(iy! + ih!).toBeLessThanOrEqual(ry! + rh!);
  });
});
