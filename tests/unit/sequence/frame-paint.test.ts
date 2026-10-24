/**
 * sdd1 T3a: grouping frames, `ref`, `newpage` and delays paint from their
 * merged styles, through the whole layout -> render path. Every expected
 * value cites the `plantuml.skin` line it comes from, or the jar render it
 * was checked against (`scripts/oracle-render.sh`, deterministic text).
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FontStyle } from '../../../src/core/klimt/shape/UText.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { DelayGeo, ElseGeo, FrameGeo, SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';
import { renderSequence } from '../../../src/diagrams/sequence/renderer.js';
import { fmt } from '../../../src/core/svg-format.js';
import { DEFAULT_DELAY_PAINT, layoutBody } from './frame-paint-fixtures.js';
import { referencePaints } from '../../../src/diagrams/sequence/ref-body-geo.js';
import { alignedBlockRuns } from '../../../src/diagrams/sequence/sequence-block-align.js';
import { drawFrameBlotter } from '../../../src/diagrams/sequence/renderer-frame-blotter.js';
import { drawMarkup } from './draw-markup.js';
import { DEFAULT_SEQUENCE_STYLE_BUILDER } from '../../helpers/sequence-source.js';
import { attrsOf, tagsOf, type TagAttrs } from '../../helpers/svg-tags.js';

const measurer = new DeterministicMeasurer();

function frames(geo: SequenceGeometry): FrameGeo[] {
  return geo.events.filter((e): e is FrameGeo => e.kind === 'frame');
}

function delays(geo: SequenceGeometry): DelayGeo[] {
  return geo.events.filter((e): e is DelayGeo => e.kind === 'delay');
}

function render(geo: SequenceGeometry): string {
  return renderSequence(geo, defaultTheme, measurer).body;
}

/** The attributes of every `<text>` element of `body` whose content is
 *  `content` -- `style` declarations expanded, so a test pins a drawn value,
 *  not the driver's spelling. */
function textsOf(body: string, content: string): TagAttrs[] {
  return [...body.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].filter((m) => m[1] === content).map((m) => attrsOf(m[0]));
}

function style(rules: string): string {
  return `<style>\nsequenceDiagram {\n${rules}\n}\n</style>`;
}

const ALT = ['Alice -> Bob : hello', 'alt x', 'Bob -> Alice : yes', 'else y', 'Bob -> Alice : no', 'end'].join('\n');

describe('grouping frame (Grouping.java:104-113, ComponentRoseGroupingHeader)', () => {
  it('paints alt/else with the default skin', () => {
    const [frame] = frames(layoutBody(ALT, measurer));
    // group { LineColor black; LineThickness 1.5; FontSize 11; FontStyle bold } (plantuml.skin:116-121)
    expect(frame!.paint!.stroke).toBe('#000000');
    expect(frame!.paint!.thickness).toBe(1.5);
    expect(frame!.paint!.font.size).toBe(11);
    expect(frame!.paint!.font.styles.has(FontStyle.BOLD)).toBe(true);
    // groupHeader { LineThickness 1.5; BackGroundColor #e; FontSize 13; FontStyle bold } (:123-129)
    expect(frame!.headerPaint!.fill).toBe('#EEEEEE');
    expect(frame!.headerPaint!.font.size).toBe(13);
    const body = render(layoutBody(ALT, measurer));
    expect(textsOf(body, 'alt')[0]).toMatchObject({ 'font-size': '13', 'font-weight': '700' });
    expect(textsOf(body, '[x]')[0]).toMatchObject({ 'font-size': '11', 'font-weight': '700' });
    expect(textsOf(body, '[y]')[0]).toMatchObject({ 'font-size': '11', 'font-weight': '700' });
    expect(tagsOf(body, 'rect')).toContainEqual(expect.objectContaining({ stroke: '#000', 'stroke-width': '1.5' }));
  });

  it('draws the else rule in the group LineColor, dashed 2,2 at width 1, one pixel down', () => {
    const geo = layoutBody(ALT, measurer);
    const [frame] = frames(geo);
    const sep = frame!.branchSeparators[0]!;
    const y = fmt(sep.y + 1);
    expect(tagsOf(render(geo), 'line')).toContainEqual({
      x1: fmt(frame!.x),
      y1: y,
      x2: fmt(frame!.x + frame!.width),
      y2: y,
      stroke: '#000',
      'stroke-width': '1',
      'stroke-dasharray': '2,2',
    });
  });

  it('takes header and condition fonts from groupHeader and group (<style>)', () => {
    // Jar: alt at font-size 18 italic #FFA500, [cond one] 15 bold #00F.
    const src = `${style('group {\n FontColor blue\n FontSize 15\n}\ngroupHeader {\n FontSize 18\n FontColor orange\n FontStyle italic\n}')}\n${ALT}`;
    const body = render(layoutBody(src, measurer));
    expect(textsOf(body, 'alt')[0]).toMatchObject({ 'font-size': '18', 'font-style': 'italic', fill: '#FFA500' });
    expect(textsOf(body, '[x]')[0]).toMatchObject({ 'font-size': '15', 'font-weight': '700', fill: '#00F' });
    expect(textsOf(body, '[y]')[0]).toMatchObject({ 'font-size': '15', 'font-weight': '700', fill: '#00F' });
  });

  it('sizes the tab from the header font', () => {
    const [plain] = frames(layoutBody(ALT, measurer));
    const [big] = frames(layoutBody(`${style('groupHeader {\n FontSize 18\n}')}\n${ALT}`, measurer));
    // getTextHeight + 2 * paddingY (ComponentRoseGroupingHeader.java:121-123).
    expect(plain!.tabHeight).toBe(13 + 2);
    expect(big!.tabHeight).toBe(18 + 2);
  });

  it('honours sequenceGroupHeaderFontColor / sequenceGroupFontColor through the style', () => {
    const src = `skinparam SequenceGroupHeaderFontColor red\nskinparam SequenceGroupFontColor green\n${ALT}`;
    const body = render(layoutBody(src, measurer));
    expect(textsOf(body, 'alt')[0]).toMatchObject({ fill: '#F00' });
    expect(textsOf(body, '[x]')[0]).toMatchObject({ fill: '#008000' });
  });

  it('paints the body band from the group style (GroupingTile.java:308-316)', () => {
    const fromStyle = render(layoutBody(`${style('group {\n BackGroundColor pink\n}')}\n${ALT}`, measurer));
    expect(tagsOf(fromStyle, 'rect')).toContainEqual(
      expect.objectContaining({ fill: '#FFC0CB', stroke: '#FFC0CB', 'stroke-width': '1' }),
    );
  });

  it('paints the body band from the opener colour (alt#red #yellow)', () => {
    const src = ALT.replace('alt x', 'alt#red #yellow x');
    expect(tagsOf(render(layoutBody(src, measurer)), 'rect')).toContainEqual(
      expect.objectContaining({ fill: '#FF0', stroke: '#FF0', 'stroke-width': '1' }),
    );
  });

  it('takes each else condition font from the builder current at that else (D2)', () => {
    const src = [
      'alt one',
      'Alice -> Bob : a',
      'skinparam SequenceGroupFontColor red',
      'else two',
      'Bob -> Alice : b',
      'end',
    ];
    const body = render(layoutBody(src.join('\n'), measurer));
    expect(textsOf(body, '[one]')[0]).toMatchObject({ fill: '#000' });
    expect(textsOf(body, '[two]')[0]).toMatchObject({ fill: '#F00' });
  });

  it('lays out a multi-line condition as one block, taller by a line', () => {
    const one = frames(layoutBody(ALT, measurer))[0]!;
    const twoGeo = layoutBody(ALT.replace('else y', 'else y\\nz'), measurer);
    const two = frames(twoGeo)[0]!;
    const [elseTile] = twoGeo.events.filter((e): e is ElseGeo => e.kind === 'else');
    expect(elseTile!.runs.map((r) => r.text)).toEqual(['[y', 'z]']);
    // getTextHeight + 4 (ComponentRoseGroupingElse.java:115-121): one 11 px line more.
    expect(two.height - one.height).toBe(11);
  });
});

describe('ref over (Reference.java:104-113, ComponentRoseReference)', () => {
  const REF = 'Alice -> Bob : hello\nref over Alice, Bob : some text\\nsecond longer line';

  it('paints body and header from reference / referenceHeader (default skin)', () => {
    const [ref] = frames(layoutBody(REF, measurer));
    // reference { FontSize 12; LineColor black; LineThickness 1.5; HorizontalAlignment center } (:155-161)
    expect(ref!.paint!.font.size).toBe(12);
    expect(ref!.paint!.thickness).toBe(1.5);
    expect(ref!.paint!.align).toBe(HorizontalAlignment.CENTER);
    // referenceHeader { BackGroundColor #e; FontSize 13; FontStyle bold; LineThickness 2.0 } (:163-170)
    expect(ref!.headerPaint!.fill).toBe('#EEEEEE');
    expect(ref!.headerPaint!.thickness).toBe(2);
    const body = render(layoutBody(REF, measurer));
    expect(textsOf(body, 'ref')[0]).toMatchObject({ 'font-size': '13', 'font-weight': '700' });
    expect(textsOf(body, 'some text')[0]).toMatchObject({ 'font-size': '12' });
  });

  it('places the body by the reference alignment and font (<style>)', () => {
    // Jar: area 10..143.781, block 121.781 wide; RIGHT puts it at
    // 133.781 - 121.781 - 4 - 2 = 6 (+10), the short line flush right at 72.906.
    const src = `${style('reference {\n FontSize 15\n FontColor green\n HorizontalAlignment right\n}\nreferenceHeader {\n FontSize 9\n FontColor blue\n}')}\n${REF}`;
    const geo = layoutBody(src, measurer);
    const body = render(geo);
    expect(textsOf(body, 'second longer line')[0]).toMatchObject({ x: '16' });
    expect(textsOf(body, 'some text')[0]).toMatchObject({ x: '72.906', 'font-size': '15', fill: '#008000' });
    expect(textsOf(body, 'ref')[0]).toMatchObject({
      x: '25',
      y: '83',
      'font-size': '9',
      'font-weight': '700',
      fill: '#00F',
    });
  });

  it('widens the component by the reference shadow (ComponentRoseReference.java:155-159)', () => {
    const [flat] = frames(layoutBody(REF, measurer));
    const [shadowed] = frames(layoutBody(`${style('reference {\n Shadowing 3\n}')}\n${REF}`, measurer));
    expect(shadowed!.width - flat!.width).toBe(3);
    expect(shadowed!.paint!.shadowing).toBe(3);
  });

  it('draws nothing in the background pass, whatever the reference fill', () => {
    const geo = layoutBody(`skinparam sequenceReferenceBackgroundColor #AAAAAA\n${REF}`, measurer);
    const body = render(geo);
    // One filled body rect (foreground), no Blotter band before it.
    expect(body.match(/fill="#AAA"/g)).toHaveLength(1);
  });

  it('left-aligns at paddingX1 + xMargin', () => {
    const geo = layoutBody(`${style('reference {\n HorizontalAlignment left\n}')}\n${REF}`, measurer);
    const [ref] = frames(geo);
    // first = ref.x - xMargin; textPos = 4 + 2 (ComponentRoseReference.java:134-135).
    expect(ref!.refBody[0]!.x).toBe(ref!.x - 2 + 6);
  });
});

describe('delay (Delay.java:59-62, ComponentRoseDelayText)', () => {
  const DELAY = 'Alice -> Bob : hello\n...5 minutes later\\nand a long second line...\nBob -> Alice : bye';

  it('draws the default delay font: 11, plain, centred (plantuml.skin:300-305)', () => {
    const geo = layoutBody(DELAY, measurer);
    const [delay] = delays(geo);
    expect(delay!.paint!.font.size).toBe(11);
    expect(delay!.paint!.align).toBe(HorizontalAlignment.CENTER);
    const [first, second] = delay!.labelRuns;
    expect(first!.x - delay!.labelRuns[0]!.x).toBe(0);
    expect(first!.x).toBeGreaterThan(second!.x);
    expect(textsOf(render(geo), '5 minutes later')[0]).toMatchObject({ 'font-size': '11', fill: '#000' });
  });

  it('takes font, colour and alignment from a delay style', () => {
    // Jar: both lines at x=10, y 100.444 / 116.444, 16 bold #F00.
    const src = `<style>\ndelay {\n FontColor red\n FontSize 16\n FontStyle bold\n HorizontalAlignment left\n}\n</style>\n${DELAY}`;
    const body = render(layoutBody(src, measurer));
    expect(textsOf(body, '5 minutes later')[0]).toMatchObject({
      x: '10',
      y: '100.444',
      'font-size': '16',
      'font-weight': '700',
      fill: '#F00',
    });
    expect(textsOf(body, 'and a long second line')[0]).toMatchObject({ x: '10', y: '116.444' });
  });

  it('honours sequenceDelayFontColor through the style', () => {
    const body = render(layoutBody(`skinparam sequenceDelayFontColor blue\n${DELAY}`, measurer));
    expect(textsOf(body, '5 minutes later')[0]).toMatchObject({ fill: '#00F' });
  });

  it('refuses a delay layout did not paint', () => {
    const geo = layoutBody(DELAY, measurer);
    const events = geo.events.map((e) => {
      if (e.kind !== 'delay') return e;
      const { paint: _paint, ...bare } = e;
      return bare;
    });
    expect(() => render({ ...geo, events })).toThrow(/delay geo has no paint/);
  });
});

describe('paint seams (sdd1 T3a)', () => {
  it('fills a ref header with its ref#color (Reference.java:99-102)', () => {
    const paints = referencePaints({ styleBuilder: DEFAULT_SEQUENCE_STYLE_BUILDER, backColorElement: '#pink' });
    expect(paints.headerPaint.fill).toBe('#FFC0CB');
    // The body keeps reference { BackGroundColor transparent } (plantuml.skin:158),
    // written `none` as `SvgGraphics#fixColor` does (SvgGraphics.java:521-541; T3e).
    expect(paints.paint.fill).toBe('none');
  });

  it('draws no ref body text when the reference font is transparent', () => {
    const geo = layoutBody(`${style('reference {\n FontColor transparent\n}')}\nref over Alice : hidden`, measurer);
    expect(textsOf(render(geo), 'hidden')).toEqual([]);
  });

  it('keeps an empty stripe zero-wide inside an aligned block', () => {
    const font = DEFAULT_DELAY_PAINT.font;
    const block = alignedBlockRuns(['wide line', ''], font, { leftX: 5, top: 0 }, HorizontalAlignment.RIGHT, {
      measurer,
    });
    expect(block.width).toBe(measurer.measure('wide line', { family: font.family, size: 11 }).width);
    expect(block.runs[0]!.x).toBe(5);
  });

  it('refuses an else colour that is neither simple nor a gradient', () => {
    const frame = { ...frames(layoutBody(ALT, measurer))[0]! };
    frame.branchSeparators = [{ ...frame.branchSeparators[0]!, backColorGeneral: '#automatic' }];
    expect(() => drawMarkup((ug) => drawFrameBlotter(ug, frame))).toThrow(/neither a simple nor a gradient/);
  });
});
