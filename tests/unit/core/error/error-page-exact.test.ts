/**
 * C-17 (`plans/class-divergence-drive-3/diagnosis/C.md` § luzive/sadamo) —
 * the deterministic-`StringBounder` error-page geometry `error-page-exact.ts`
 * ports from `PSystemError#getGraphicalFormatted`.
 *
 * Every Y-coordinate, `textLength`, and canvas size below is copied verbatim
 * from the jar's own cached goldens (`-DPLANTUML_DETERMINISTIC_TEXT=true`):
 * `test-results/dot-cache/class/luzive-62-zote562/in.svg` and
 * `.../sadamo-18-siva346/in.svg`. The two "[From … ]"/banner lines are the
 * C-18 proposed-accept identity divergence (source-description string,
 * dev-build version banner) and are asserted against OUR OWN content, not
 * the jar's — every other line is asserted against the jar's literal number.
 *
 * Values re-read 2026-10 from the seam #4 v2 re-capture of those same two
 * goldens (a space is now 44 tenths, widths float-rounded).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemError.java#getGraphicalFormatted
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ErrorUml } from '../../../../src/core/error/ErrorUml.js';
import { PSystemErrorEmpty } from '../../../../src/core/error/PSystemErrorEmpty.js';
import { PSystemErrorPreprocessor } from '../../../../src/core/error/PSystemErrorPreprocessor.js';
import { umlSourceOf } from '../../../../src/core/error/UmlSource.js';
import { renderPSystemError } from '../../../../src/core/error/error-renderer.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { readLines } from '../../../../src/core/tim/ReadLineReader.js';
import { LineLocationImpl } from '../../../../src/core/tim/LineLocationImpl.js';
import { StringLocated } from '../../../../src/core/tim/StringLocated.js';

const measurer = new DeterministicMeasurer();

/** A source (>= 5 lines, so no Welcome block) and a trace failing on its
 *  last line — mirrors `PSystemError.test.ts`'s own `failing()` helper. */
function failing(source: string, message: string): PSystemErrorPreprocessor {
  const input = readLines(source);
  const trace = [...input];
  trace[trace.length - 1] = trace[trace.length - 1]!.withErrorPreprocessor(message);
  return new PSystemErrorPreprocessor(umlSourceOf(input), trace);
}

/** Every `<text … y="N"` baseline, in document order. */
function ys(svg: string): number[] {
  return [...svg.matchAll(/<text[^>]* y="([\d.]+)"/g)].map((m) => Number(m[1]));
}

describe('error page geometry — C-17: height === font size, baseline === box top + size', () => {
  // luzive-62-zote562's own 10-line source, verbatim (tests/corpus/class/
  // luzive-62-zote562.puml), through its own failing line (`<> StationCrossing`,
  // line 10) — same shape the jar's `PSystemErrorV2` produces for this fixture.
  const luziveSource = [
    '@startuml',
    'class Station {',
    '+name: string',
    '}',
    '',
    'class StationCrossing {',
    '+cost: TimeInterval',
    '}',
    '',
    '<> StationCrossing',
  ].join('\n');
  const luziveMessage = 'Already existing : StationCrossing (Assumed diagram type: class)';

  it('places every baseline exactly where the jar golden does (luzive-62-zote562/in.svg)', () => {
    const svg = renderPSystemError(failing(luziveSource, luziveMessage), measurer);
    // jar: banner 17; band 40; then 14px-pitch listing 58,72,86,100,114,128,
    // 142,156,170,184,198; message 212 — every one of these is READ OFF the
    // cached golden, not derived in this test.
    expect(ys(svg)).toEqual([17, 40, 58, 72, 86, 100, 114, 128, 142, 156, 170, 184, 198, 212]);
  });

  it('sizes the canvas to `(int)(declaredDimension + 1)` — jar 419×218 (SvgGraphics.java:129-136,143)', () => {
    const svg = renderPSystemError(failing(luziveSource, luziveMessage), measurer);
    expect(svg).toContain('width="419px"');
    expect(svg).toContain('height="218px"');
    expect(svg).toContain('viewBox="0 0 419 218"');
  });

  it('sizes the green band rect to the widest of its own line and the listing (jar rect x=5 y=25 width=143.15 height=19)', () => {
    const svg = renderPSystemError(failing(luziveSource, luziveMessage), measurer);
    expect(svg).toContain('<rect x="5" y="25" width="143.15" height="19"');
  });

  it('emits textLength on every multi-character listing/message line, matching the jar exactly (its content is unaffected by C-18)', () => {
    const svg = renderPSystemError(failing(luziveSource, luziveMessage), measurer);
    for (const expected of ['63.963', '87.85', '85.137', '143.15', '118.563', '119.175', '405.125']) {
      expect(svg).toContain(`textLength="${expected}"`);
    }
  });

  it('renders a blank source line as NBSP (U+00A0), not an empty <text> body — SingleLine#rawText', () => {
    const svg = renderPSystemError(failing(luziveSource, luziveMessage), measurer);
    // Two blank lines in luzive's source (after `}` on line 4 and line 8);
    // the jar's own golden carries ` ` (UTF-8 `\xc2\xa0`) at y=128/184.
    expect(svg).toContain('y="128" font-size="14" font-weight="700" fill="#33FF02"> </text>');
    expect(svg).toContain('y="184" font-size="14" font-weight="700" fill="#33FF02"> </text>');
  });

  it('does not draw the last (wavy) line or the message with the stack-band background', () => {
    const svg = renderPSystemError(failing(luziveSource, luziveMessage), measurer);
    // Exactly one <rect> — the green band — on the whole page (single-block
    // canvas background is CSS `style`, not a second <rect>; see this file's
    // header comment / `error-renderer.ts`'s own).
    expect(svg.match(/<rect/g)).toHaveLength(1);
  });

  // sadamo-18-siva346/in.svg: a second, independently jar-verified fixture —
  // its own first 8 SOURCE lines (tests/corpus/class/sadamo-18-siva346.puml,
  // read verbatim rather than transcribed: line 8 is a ~9400-char pathological
  // backtick run that `PSystemError#addToResult`'s 120-char truncation cuts
  // down to the jar's own `textLength="603.138"` line) — pinning the SAME
  // formulas against a different line count/error message/truncation.
  const sadamoCorpusPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../fixtures/corpus/class/sadamo-18-siva346.puml',
  );
  const sadamoSource = existsSync(sadamoCorpusPath)
    ? readFileSync(sadamoCorpusPath, 'utf8').split('\n').slice(0, 8).join('\n')
    : undefined;

  function sadamoSvg(): string {
    if (sadamoSource === undefined) throw new Error(`corpus fixture not found at ${sadamoCorpusPath}`);
    return renderPSystemError(failing(sadamoSource, 'Syntax Error? (Assumed diagram type: class)'), measurer);
  }

  it('places every baseline exactly where the jar golden does (sadamo-18-siva346/in.svg)', () => {
    if (sadamoSource === undefined) {
      console.warn(`skip: corpus fixture not found at ${sadamoCorpusPath}`);
      return;
    }
    expect(ys(sadamoSvg())).toEqual([17, 40, 58, 72, 86, 100, 114, 128, 142, 156, 170, 184]);
  });

  it('sizes the canvas to 614×190, per the jar golden', () => {
    if (sadamoSource === undefined) {
      console.warn(`skip: corpus fixture not found at ${sadamoCorpusPath}`);
      return;
    }
    const svg = sadamoSvg();
    expect(svg).toContain('width="614px"');
    expect(svg).toContain('height="190px"');
  });

  it('truncates the pathological last line at 120 chars + " ..." and sizes it to the jar textLength (603.138)', () => {
    if (sadamoSource === undefined) {
      console.warn(`skip: corpus fixture not found at ${sadamoCorpusPath}`);
      return;
    }
    const svg = sadamoSvg();
    expect(svg).toContain('textLength="603.138"');
  });
});

describe('error page geometry — the band rect can also be the WIDER of the two (band branch of the max())', () => {
  it('sizes the rect off the band line, not the listing, when the band line is the wider one', () => {
    const longDescription = 'a-very-long-include-path-used-only-to-widen-the-band-line-above-the-body';
    const location = new LineLocationImpl(longDescription, undefined, 0);
    const trace = [new StringLocated('x', location)];
    // `source` (NOT `trace`) is what `getTotalLineCountLessThan5` reads — pad
    // it to 5 dummy lines so this hits `renderErrorPageOnly`, not the
    // Welcome-stacked legacy path (`source.length < 5`, `PSystemError.java
    // #getTextBlock`).
    const source = [1, 2, 3, 4, 5].map((n) => new StringLocated(String(n), new LineLocationImpl('x', undefined, n)));
    const system = new PSystemErrorEmpty(source, trace, new ErrorUml('SYNTAX_ERROR', 'e'));

    const svg = renderPSystemError(system, measurer);
    const font14bold = { family: 'sans-serif', size: 14, weight: 'bold' as const, style: 'normal' as const };
    const bandLine = `[From ${longDescription} (line 1) ]`;
    const expectedWidth = measurer.measure(bandLine, font14bold).width + 2; // BAND_PAD_X, both sides
    const rectMatch = /<rect x="5" y="25" width="([\d.]+)" height="19"/.exec(svg);
    expect(rectMatch).not.toBeNull();
    // 3 d.p. — `svg-format.ts#DEFAULT_SVG_DECIMALS`'s own rounding, not a
    // tolerance for this test's own arithmetic.
    expect(Number(rectMatch![1])).toBeCloseTo(expectedWidth, 3);
    // Sanity: the listing itself (` `, `x`) is far narrower — the band line
    // really is what's driving this rect's width, not a coincidence.
    expect(Number(rectMatch![1])).toBeGreaterThan(measurer.measure('x', font14bold).width + 20);
  });
});
