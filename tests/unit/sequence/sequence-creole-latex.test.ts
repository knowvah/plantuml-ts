/**
 * A creole `<math>`/`<latex>` atom in a SEQUENCE label is DRAWN as the image
 * `AtomMath#drawU` paints (`AtomMath.java:78-97`), not folded back into the
 * whole-line literal fallback.
 *
 * TDD: written before `sequence-creole.ts` stopped classing a latex atom as
 * undrawable. `'inline'` (`<img>`/`<$sprite>`/`<&openiconic>`) and `'emoji'`
 * stay undrawable — they have no geometry here, and their whole-line literal
 * fallback is pinned below so this change cannot take them with it.
 *
 * No number is compared against the jar's. The image's bytes and its exact
 * width/height are a PERMANENT divergence (`DIVERGENCES.md`, "LaTeX rendering
 * engine — KaTeX, not JLaTeXMath", which names `<math>`); every expectation
 * derives from `core/latex.ts#renderLatexAsImage`, the one renderer both
 * halves go through.
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { FontSpec } from '../../../src/core/measurer.js';
import { renderLatexAsImage } from '../../../src/core/latex.js';
import {
  sequenceCreoleFont,
  sequenceCreoleRuns,
} from '../../../src/diagrams/sequence/sequence-creole.js';
import { sequenceText } from '../../../src/diagrams/sequence/sequence-text.js';
import { scaleSequenceGeometry } from '../../../src/diagrams/sequence/scale-geo.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { SequenceGeometry, TextRun } from '../../../src/diagrams/sequence/ast.js';

const measurer = new DeterministicMeasurer();
const ARROW_FONT: FontSpec = { family: 'sans-serif', size: 13 };
const ORIGIN = { leftX: 100, baselineY: 40 };

function runsOf(line: string): readonly TextRun[] {
  return sequenceCreoleRuns(line, sequenceCreoleFont(ARROW_FONT), ORIGIN, measurer);
}

/** `<latex>` is passed through verbatim; only `<math>` goes through the
 *  ASCIIMath conversion (`CommandCreoleLatex` builds `fromLatex`,
 *  `CommandCreoleMath` `fromAsciiMath` — `ScientificEquationSafe.java:78-88`). */
const DRAWN = renderLatexAsImage('e^x', '#000000');

describe('sequenceCreoleRuns — a latex atom is drawable now', () => {
  it('emits one run per atom, the middle one carrying the image and no text', () => {
    const runs = runsOf('x<latex>e^x</latex>y');
    expect(runs.map((r) => r.text)).toEqual(['x', '', 'y']);
    expect(runs[0]!.image).toBeUndefined();
    expect(runs[1]!.image).toBeDefined();
    expect(runs[1]!.image!.href).toBe(DRAWN.href);
    expect(runs[1]!.image!.width).toBe(DRAWN.width);
    expect(runs[1]!.image!.height).toBe(DRAWN.height);
  });

  it('advances x by the image OWN width, so the run after it starts at its right edge', () => {
    const runs = runsOf('x<latex>e^x</latex>y');
    expect(runs[1]!.x).toBeCloseTo(runs[0]!.x + runs[0]!.textWidth, 10);
    expect(runs[1]!.textWidth).toBe(DRAWN.width);
    expect(runs[2]!.x).toBeCloseTo(runs[1]!.x + DRAWN.width, 10);
  });

  it('BOTTOM-aligns the image box against the text box, per Sea#doAlign with AtomMath altitude 0', () => {
    // `Sea#doAlign` drops every atom to `y = -height + getStartingAltitude`
    // (`Sea.java:72-80`) and `AtomMath#getStartingAltitude` is 0
    // (`AtomMath.java:73-75`), so an image box and a text box on one line
    // share their BOTTOM edge — which for the text is `baseline + descent`.
    const runs = runsOf('x<latex>e^x</latex>y');
    const descent = measurer.getDescent(ARROW_FONT, 'M');
    expect(runs[1]!.image!.y).toBeCloseTo(ORIGIN.baselineY + descent - DRAWN.height, 10);
  });

  it('applies <math> the same way, through the ASCIIMath conversion', () => {
    const runs = runsOf('a<math>x</math>b');
    expect(runs.map((r) => r.text)).toEqual(['a', '', 'b']);
    expect(runs[1]!.image!.href).toBe(renderLatexAsImage('{x}', '#000000').href);
  });

  it.each(['x<&heart>y', 'x<:smile:>y'])(
    'still leaves %s WHOLLY literal — inline and emoji remain undrawable',
    (line) => {
      const runs = runsOf(line);
      expect(runs.map((r) => r.text)).toEqual([line]);
      expect(runs[0]!.image).toBeUndefined();
    },
  );
});

describe('sequenceText — an image run emits <image>, never <text>', () => {
  const spec = {
    leftX: 12,
    baselineY: 40,
    text: '',
    width: DRAWN.width,
    fontFamily: 'sans-serif',
    fontSize: 13,
    fill: '#000000',
    image: { href: DRAWN.href, width: DRAWN.width, height: DRAWN.height, y: 25 },
  };

  it('emits the image at the run left edge and the image own top', () => {
    const svg = sequenceText(spec);
    expect(svg).toContain('<image ');
    expect(svg).toContain('x="12"');
    expect(svg).toContain('y="25"');
    expect(svg).toContain(`width="${DRAWN.width}"`);
    expect(svg).toContain(`height="${DRAWN.height}"`);
    expect(svg).not.toContain('<text');
  });

  it('wraps the image in its <a> when the run carries a url', () => {
    const svg = sequenceText({ ...spec, url: { url: 'http://x', tooltip: 'http://x' } });
    expect(svg).toContain('<a ');
    expect(svg).toContain('<image ');
  });
});

describe('scaleRun — the image is a length and scales with the diagram', () => {
  it('multiplies the image width, height and top by k', () => {
    const run: TextRun = {
      text: '',
      x: 10,
      y: 40,
      textWidth: DRAWN.width,
      textAscent: DRAWN.height,
      textLineHeight: DRAWN.height,
      image: { href: DRAWN.href, width: DRAWN.width, height: DRAWN.height, y: 25 },
    };
    const geo: SequenceGeometry = {
      totalWidth: 200,
      totalHeight: 100,
      participants: [],
      events: [
        {
          kind: 'message',
          fromX: 40,
          toX: 160,
          y: 50,
          label: '',
          arrow: arrowConfigurationOf({}),
          labelLines: [run],
          arrowDirection: 'right',
        },
      ],
      headHeight: 30,
      lifelineEndY: 90,
      footerShapeY: 90,
      boxes: [],
      showFootbox: true,
    };
    const message = scaleSequenceGeometry(geo, 2).events[0]!;
    if (message.kind !== 'message') throw new Error('unreachable');
    const out = message.labelLines[0]!;
    // A LENGTH and a COORDINATE both scale: `SvgGraphics#format` multiplies an
    // emitted `<image>`'s geometry exactly as it does a `<text>`'s
    // (`SvgGraphics.java:693`).
    expect(out.image!.width).toBe(DRAWN.width * 2);
    expect(out.image!.height).toBe(DRAWN.height * 2);
    expect(out.image!.y).toBe(50);
    // The image DOCUMENT is not a length.
    expect(out.image!.href).toBe(DRAWN.href);
  });
});

describe('the two <math> sequence fixtures', () => {
  const svgOf = (src: string): string => {
    const out = renderSync(src, { measurer: new WidthTableMeasurer() });
    return typeof out === 'string' ? out : (out as { svg: string }).svg;
  };

  it('mefeke-43-xotu192 draws one <image> and keeps the text runs around it', () => {
    const svg = svgOf('@startuml\nBob -> Alice : hello <math>[[a,b],[c,d]]((n),(k))</math> there\n@enduml');
    expect(svg.match(/<image /g)).toHaveLength(1);
    // Both text runs survive, one either side of the image, at their own
    // measured `textLength` -- the jar emits exactly this trio.
    expect(svg).toContain('>hello</text>');
    expect(svg).toContain('>there</text>');
    expect(svg).not.toContain('&lt;math&gt;');
  });

  it('camuxi-33-nopo108 draws one <image> per formula', () => {
    const svg = svgOf(
      '@startuml\nBob -> Alice : Can you solve: <math>ax^2+bx+c=0</math>\n' +
        'Alice --> Bob: <math>x = (-b+-sqrt(b^2-4ac))/(2a)</math>\n@enduml',
    );
    expect(svg.match(/<image /g)).toHaveLength(2);
    expect(svg).toContain('>Can you solve:</text>');
  });
});
