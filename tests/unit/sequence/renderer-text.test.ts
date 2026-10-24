/**
 * sdd3-T8c: one carried label run, drawn through a `UGraphic`
 * (`renderer-text.ts`; `AtomText.java:190-240`, `DriverTextSvg.java:93-180`).
 */
import { describe, it, expect } from 'vitest';
import { FontStyle, UText } from '../../../src/core/klimt/shape/UText.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import type { UChange } from '../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../src/core/klimt/UShape.js';
import {
  drawRun,
  fontConfigurationOf,
  withUrl,
  type RunAmbient,
} from '../../../src/diagrams/sequence/renderer-text.js';
import { openSequenceGraphic, pageThemeOf } from '../../../src/diagrams/sequence/renderer-ug.js';
import { driverTextPlacement } from '../../../src/core/svg-text-font.js';
import { fmt } from '../../../src/core/svg-format.js';
import type { TextRun } from '../../../src/diagrams/sequence/text-block-geo.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { RecordingUGraphic, record } from '../../helpers/recording-ugraphic.js';
import { attrsOf, tagsOf } from '../../helpers/svg-tags.js';

const MEASURER = new DeterministicMeasurer();
const THEME = pageThemeOf(defaultTheme, MEASURER);
const AMBIENT: RunAmbient = { fontFamily: 'SansSerif', fontSize: 14, color: '#000000' };
const URL = { url: 'http://example.com/', tooltip: 'tip' };

const run = (over: Partial<TextRun> = {}): TextRun => ({
  text: 'Alice',
  x: 20,
  y: 30,
  textWidth: 30,
  textAscent: 11,
  textLineHeight: 16,
  ...over,
});

/** A width as the emitter writes it: rounded to its decimals. */
const widthOf = (text: string): string => fmt(MEASURER.measure(text, { family: 'SansSerif', size: 14 }).width);

/** The page's real graphic, one run drawn and serialised. */
function render(r: TextRun, dy = 0): string {
  const page = openSequenceGraphic(THEME, { width: 0, height: 0 });
  drawRun(page.ug, r, AMBIENT, dy);
  return page.finish().body;
}

describe('drawRun: a text run (AtomText#drawU -> DriverTextSvg)', () => {
  it('draws UText.build(run.text) at (run.x, run.y + dy) on a fresh translate', () => {
    expect(record(MEASURER, (ug) => drawRun(ug, run(), AMBIENT, 5))).toEqual([
      { draw: 'UText(Alice)', chain: ['translate(20,35)'] },
    ]);
  });

  it('draws the text UNTRIMMED at the layout x: the driver does its own shift and trim', () => {
    // DriverTextSvg.java:113-126: each leading space moves x right by one space width, then
    // `StringUtils.trin`; the drawn width is the trimmed text's.
    const spaced = run({ text: '  Al ', x: 20 });
    expect(record(MEASURER, (ug) => drawRun(ug, spaced, AMBIENT))).toEqual([
      { draw: 'UText(  Al )', chain: ['translate(20,30)'] },
    ]);
    const placement = driverTextPlacement(spaced.text, MEASURER.measure(' ', { family: 'SansSerif', size: 14 }).width);
    const drawn = tagsOf(render(spaced), 'text')[0]!;
    expect(drawn.x).toBe(fmt(20 + placement.dx));
    expect(drawn.textLength).toBe(widthOf('Al'));
  });

  it('writes the run as the jar writes a plain label: left x, baseline y, fill, size, textLength', () => {
    const [text] = tagsOf(render(run()), 'text');
    expect(text).toEqual({
      x: '20',
      y: '30',
      fill: '#000',
      'font-size': '14',
      textLength: widthOf('Alice'),
    });
  });
});

describe("fontConfigurationOf: the run's flat fields back into a FontConfiguration", () => {
  it('falls back to the ambient font and ink where the run set none', () => {
    const fc = fontConfigurationOf(run(), AMBIENT);
    expect(fc).toMatchObject({ family: 'SansSerif', size: 14, color: '#000000' });
    expect([...fc.styles]).toEqual([]);
    expect(fc.fontFace).toBeUndefined();
  });

  it("takes the run's own family, size, colour, bold and italic", () => {
    const fc = fontConfigurationOf(
      run({ fontFamily: 'monospaced', fontSize: 20, color: '#FF0000', bold: true, italic: true }),
      AMBIENT,
    );
    expect(fc).toMatchObject({ family: 'monospaced', size: 20, color: '#FF0000' });
    expect(new Set(fc.styles)).toEqual(new Set([FontStyle.BOLD, FontStyle.ITALIC]));
  });

  it("makes the ambient style's bold the fallback, which a run's own bold flag beats", () => {
    const bold: RunAmbient = { ...AMBIENT, bold: true };
    expect(fontConfigurationOf(run(), bold).styles.has(FontStyle.BOLD)).toBe(true);
    expect(fontConfigurationOf(run({ bold: false }), bold).styles.has(FontStyle.BOLD)).toBe(false);
  });

  it('inverts the decoration string into UNDERLINE / STRIKE / WAVE (DriverTextSvg.java:129-157)', () => {
    const styles = (decoration: string) => new Set(fontConfigurationOf(run({ decoration }), AMBIENT).styles);
    expect(styles('underline')).toEqual(new Set([FontStyle.UNDERLINE]));
    expect(styles('line-through')).toEqual(new Set([FontStyle.STRIKE]));
    expect(styles('wavy underline')).toEqual(new Set([FontStyle.WAVE]));
    expect(styles('underline line-through wavy underline')).toEqual(
      new Set([FontStyle.UNDERLINE, FontStyle.STRIKE, FontStyle.WAVE]),
    );
  });

  it('reads an extra line below the baseline as UNDERLINE and above it as STRIKE, one extendedColor', () => {
    // DriverTextSvg.java:135-148: `extraLines.add(extendedColor, size / 14)` / `-size / 4`.
    const fc = fontConfigurationOf(
      run({
        extraLines: [
          { color: '#FF0000', deltaY: 1 },
          { color: '#FF0000', deltaY: -3.5 },
        ],
      }),
      AMBIENT,
    );
    expect(new Set(fc.styles)).toEqual(new Set([FontStyle.UNDERLINE, FontStyle.STRIKE]));
    expect(fc.extendedColor).toBe('#FF0000');
  });

  it('reads a back colour as BACKCOLOR with the extendedColor (DriverTextSvg.java:159-173)', () => {
    const fc = fontConfigurationOf(run({ textBackColor: '#00FF00' }), AMBIENT);
    expect(fc.styles.has(FontStyle.BACKCOLOR)).toBe(true);
    expect(fc.extendedColor).toBe('#00FF00');
  });

  it('carries a face weight on the font face (DriverTextSvg.java:97-103)', () => {
    expect(fontConfigurationOf(run({ fontWeight: '900' }), AMBIENT).fontFace).toEqual({
      cssWeight: 900,
      italic: false,
    });
  });

  it('carries the creole text attributes in key order (FontConfiguration.java:147)', () => {
    const fc = fontConfigurationOf(
      run({
        svgAttributes: new Map([
          ['class', 'foo'],
          ['id', 'dummy'],
        ]),
      }),
      AMBIENT,
    );
    expect([...fc.svgAttributes!.attributes()]).toEqual([
      ['class', 'foo'],
      ['id', 'dummy'],
    ]);
  });
});

describe('drawRun: the style a run carries reaches the emitted <text>', () => {
  it('writes bold as font-weight 700, italic as font-style, an underline as text-decoration', () => {
    const text = tagsOf(render(run({ bold: true, italic: true, decoration: 'underline' })), 'text')[0]!;
    expect(text).toMatchObject({ 'font-weight': '700', 'font-style': 'italic', 'text-decoration': 'underline' });
  });

  it('writes an extended-colour underline as a <line> after the <text>', () => {
    const body = render(run({ extraLines: [{ color: '#FF0000', deltaY: 1 }] }));
    expect(body.indexOf('<text')).toBeLessThan(body.indexOf('<line'));
    expect(tagsOf(body, 'line')[0]).toMatchObject({ stroke: '#F00', y1: '31', y2: '31' });
  });
});

describe('drawRun: an image run (AtomMath.java:78-97, DriverImageSvg)', () => {
  const image = { href: 'data:image/png;base64,AA==', width: 12, height: 10, y: 40 };

  it('draws a UImage at the run x and the image own top, shifted by dy', () => {
    expect(record(MEASURER, (ug) => drawRun(ug, run({ text: '', image }), AMBIENT, 5))).toEqual([
      { draw: 'UImage(12,10)', chain: ['translate(20,45)'] },
    ]);
  });

  it('emits the declared size, not a re-rounded one: the run already carries the drawn size', () => {
    const [img] = tagsOf(render(run({ text: '', image: { ...image, width: 12.5, height: 9.5 } })), 'image');
    expect(img).toMatchObject({ x: '20', y: '40', width: '12.5', height: '9.5' });
  });
});

describe('drawRun: a shape run', () => {
  it('replays the recorded apply chain: translate, fore, back, stroke, then draw(shape)', () => {
    const shape = URectangle.build(8, 4);
    const events: Array<{ chain: string[]; draw: UShape }> = [];
    const chainOf = (labels: string[]): UGraphic => ({
      apply: (change: UChange) => chainOf([...labels, change.constructor.name]),
      draw: (s: UShape) => events.push({ chain: labels, draw: s }),
      getParam: () => {
        throw new Error('unused');
      },
      getTranslate: () => {
        throw new Error('unused');
      },
      getStringBounder: () => {
        throw new Error('unused');
      },
    });
    const stroke = UStroke.withThickness(2);
    drawRun(
      chainOf([]),
      run({ text: '', shape: { shape, fore: '#111111', back: '#222222', stroke, scale: 1 } }),
      AMBIENT,
      5,
    );
    expect(events).toEqual([{ chain: ['UTranslate', 'Fore', 'Back', 'UStroke'], draw: shape }]);
  });

  it('draws at (run.x, run.y + dy) with the recorded ink on the page graphic', () => {
    const shape = URectangle.build(8, 4);
    const log = record(MEASURER, (ug) =>
      drawRun(
        ug,
        run({
          text: '',
          shape: { shape, fore: '#111111', back: '#222222', stroke: UStroke.withThickness(2), scale: 1 },
        }),
        AMBIENT,
        5,
      ),
    );
    expect(log).toEqual([
      {
        draw: 'URectangle(8,4)',
        chain: ['translate(20,35)', 'fore(#111111)', 'back(#222222)', 'stroke(0,0,2)'],
      },
    ]);
  });
});

describe('withUrl and the run url (AtomText.java:197-198,235-236; LivingSpace.java:209-211)', () => {
  it('brackets a linked run in startUrl/closeUrl, each on the same graphic', () => {
    expect(record(MEASURER, (ug) => drawRun(ug, run({ url: URL }), AMBIENT))).toEqual([
      { startUrl: URL.url },
      { draw: 'UText(Alice)', chain: ['translate(20,30)'] },
      { closeUrl: true },
    ]);
  });

  it('writes the <a> the jar writes (SvgGraphics#openLink) around the <text>', () => {
    const body = render(run({ url: URL }));
    expect(body.startsWith('<a ')).toBe(true);
    expect(attrsOf(/<a [^>]*>/.exec(body)![0])).toMatchObject({
      target: '_top',
      href: URL.url,
      title: 'tip',
    });
    expect(body.indexOf('<text')).toBeGreaterThan(body.indexOf('<a '));
    expect(body.endsWith('</a>')).toBe(true);
  });

  it('draws with no link on a graphic that has no link support, as a non-SVG backend does', () => {
    const drawn: string[] = [];
    const bare: UGraphic = {
      apply: () => bare,
      draw: (s) => drawn.push(s.constructor.name),
      getParam: () => {
        throw new Error('unused');
      },
      getTranslate: () => {
        throw new Error('unused');
      },
      getStringBounder: () => {
        throw new Error('unused');
      },
    };
    withUrl(bare, URL, () => bare.draw(UText.build('x', fontConfigurationOf(run(), AMBIENT))));
    expect(drawn).toEqual(['UText']);
    expect(new RecordingUGraphic(MEASURER).log).toEqual([]);
  });

  it('just draws when there is no url', () => {
    const calls: string[] = [];
    withUrl(new RecordingUGraphic(MEASURER), undefined, () => calls.push('draw'));
    expect(calls).toEqual(['draw']);
  });
});

describe('the font @import a Roboto run makes the document write (SvgGraphics#addRoboto)', () => {
  it('leaves the body and the gradient defs without it and hands it over once, as the page defs', () => {
    const roboto = { ...AMBIENT, fontFamily: 'Roboto' };
    const page = openSequenceGraphic(THEME, { width: 0, height: 0 });
    drawRun(page.ug, run(), roboto);
    drawRun(page.ug, run(), roboto);
    const { body, extraDefs, fontDefs } = page.finish();
    expect(body).not.toContain('<style');
    expect(extraDefs).not.toContain('@import');
    // Two texts name the font, the one document writes the import once.
    expect(fontDefs.match(/@import url\('https:\/\/fonts\.googleapis\.com\/css\?family=Roboto/g)).toHaveLength(1);
    expect(tagsOf(body, 'text').map((t) => t['font-family'])).toEqual(['Roboto', 'Roboto']);
  });

  it('is empty for a document that never names the font', () => {
    const page = openSequenceGraphic(THEME, { width: 0, height: 0 });
    drawRun(page.ug, run(), AMBIENT);
    expect(page.finish().fontDefs).toBe('');
  });
});
