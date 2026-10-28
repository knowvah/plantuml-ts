import { describe, expect, it } from 'vitest';
import type { ISkinParamWithSimple } from '../../../../src/core/abel/ISkinParam.js';
import { HColorGradient } from '../../../../src/core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { MeasurerStringBounder } from '../../../../src/core/measurer-bounder.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import type { InternalEmojiStore } from '../../../../src/core/internal-emoji-store.js';
import { createSpriteRegistry } from '../../../../src/core/sprite-registry.js';
import { createMindmapSkinParam } from '../../../../src/core/style/mindmap-style-builder.js';
import { SkinParam } from '../../../../src/diagrams/gantt/gantt-skin-param.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import type { HColor, HColorSet } from '../../../../src/core/style/Value.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { GArrowType } from '../../../../src/diagrams/gantt/core/GArrowType.js';
import { GSide } from '../../../../src/diagrams/gantt/core/GSide.js';
import { LabelPosition } from '../../../../src/diagrams/gantt/LabelPosition.js';
import { LabelStrategy } from '../../../../src/diagrams/gantt/LabelStrategy.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { CenterBorderColor } from '../../../../src/diagrams/gantt/lang/CenterBorderColor.js';
import { FingerPrint } from '../../../../src/diagrams/gantt/draw/FingerPrint.js';
import { TaskDrawSeparator } from '../../../../src/diagrams/gantt/draw/TaskDrawSeparator.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import type { TimeScale } from '../../../../src/diagrams/gantt/timescale/TimeScale.js';
import { record } from '../../../helpers/recording-ugraphic.js';
import { skinStorageDump, styleFromDump } from '../../core/style/helpers/style-fixture.js';

// Style: the built-in plantuml.skin `ganttDiagram { separator { FontSize 11, FontStyle plain,
// BackGroundColor transparent, Margin 5, Padding 5 } }` (plantuml.skin:409-415), so
// margin = padding = 5 on every side and the font is 11pt.
const MARGIN = 5;
const PADDING = 5;
const FONT_SIZE = 11;
const DAY_PIXELS = 10; // the TimeScale double below: 10 px per day
const TITLE = 'Phase';
const measurer = new DeterministicMeasurer();
const bounder = new MeasurerStringBounder(measurer);
const SANS = { family: 'SansSerif', size: FONT_SIZE };

/** Transparent exactly where the style says `transparent` (HColorSet.java:58-63 parse). */
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 };
const OPAQUE = { r: 1, g: 2, b: 3, a: 255 };
// the skin's `BackGroundColor transparent` reaches the colour set as this normalised name
const TRANSPARENT_NAME = '#00000000';
const OPAQUE_LABEL = '#010203';
function colorSet(transparentName: boolean): HColorSet {
  return {
    getColorOrWhite: (s: string): HColor =>
      HColorSimple.create(transparentName && s === TRANSPARENT_NAME ? TRANSPARENT : OPAQUE),
  };
}
function skinParam(set: HColorSet): ISkinParamWithSimple {
  return { getPragma: () => Pragma.createEmpty(), getIHtmlColorSet: () => set } as unknown as ISkinParamWithSimple;
}
const styleBuilder = new StyleBuilder().muteStyle(skinStorageDump().map(styleFromDump));
const timeScale: TimeScale = {
  getPosition: (t: TimePoint) => t.getAbsoluteDayNum() * DAY_PIXELS,
  getWidth: () => 0,
  isBreaking: () => false,
};
const MIN_DAY = LocalDate.of(2020, 1, 1);
const MAX_DAY = LocalDate.of(2020, 1, 3);
const START = timeScale.getPosition(TimePoint.ofStartOfDay(MIN_DAY));
const END = START + 3 * DAY_PIXELS; // maxDay.plusDays(1): Jan 1..3 inclusive is 3 days (java:137-139)

function make(name: string | undefined, transparentName = true, y = RealUtils.createOrigin()): TaskDrawSeparator {
  return new TaskDrawSeparator(
    name,
    timeScale,
    y,
    MIN_DAY,
    MAX_DAY,
    styleBuilder,
    skinParam(colorSet(transparentName)),
  );
}

describe('TaskDrawSeparator.drawU (TaskDrawSeparator.java:135-174)', () => {
  const widthTitle = measurer.measure(TITLE, SANS).width;
  const textHeight = measurer.measure(TITLE, SANS).height;

  it('titled, transparent background: only the two lines (java:137-174)', () => {
    // y = padding.top + textHeight/2 (java:158); x1 = padding.left + margin.left + widthTitle + margin.right (java:166);
    // line1 = hline(padding.left) (java:162-165); line2 = hline((end - 1) - x1) at dx(x1) (java:167-170).
    const x1 = PADDING + MARGIN + widthTitle + MARGIN;
    const dy = `translate(0,${String(PADDING + textHeight / 2)})`;
    expect(record(measurer, (ug) => make(TITLE).drawU(ug))).toEqual([
      { draw: `ULine(${String(PADDING)},0)`, chain: [`translate(0,${String(MARGIN)})`, `fore(${OPAQUE_LABEL})`, dy] },
      {
        draw: `ULine(${String(END - 1 - x1)},0)`,
        chain: [`translate(0,${String(MARGIN)})`, `fore(${OPAQUE_LABEL})`, dy, `translate(${String(x1)},0)`],
      },
    ]);
  });

  it('titled, opaque background: the back rectangle comes first (java:148-156)', () => {
    const log = record(measurer, (ug) => make(TITLE, false).drawU(ug));
    // height = padding.top + textHeight + padding.bottom (java:150)
    expect(log[0]).toEqual({
      draw: `URectangle(${String(END - START)},${String(PADDING + textHeight + PADDING)})`,
      chain: [`translate(0,${String(MARGIN)})`, `back(${OPAQUE_LABEL})`],
    });
    expect(log).toHaveLength(3);
  });

  it('no title (widthTitle 0): a single full-width line (java:159-162)', () => {
    // TextBlockUtils.empty(0,0) (java:124-125): textHeight 0, so y = padding.top
    expect(record(measurer, (ug) => make(undefined).drawU(ug))).toEqual([
      {
        draw: `ULine(${String(END - START)},0)`,
        chain: [`translate(0,${String(MARGIN)})`, `fore(${OPAQUE_LABEL})`, `translate(0,${String(PADDING)})`],
      },
    ]);
  });

  it('no title, opaque background: height is padding top + bottom, rectangle drawn (java:148-156)', () => {
    const log = record(measurer, (ug) => make(undefined, false).drawU(ug));
    expect(log[0]).toEqual({
      draw: `URectangle(${String(END - START)},${String(2 * PADDING)})`,
      chain: [`translate(0,${String(MARGIN)})`, `back(${OPAQUE_LABEL})`],
    });
  });

  it('a gradient background answers isTransparent through its first colour (HColorLinearGradient.java:341-343)', () => {
    const gradientSet: HColorSet = {
      getColorOrWhite: (s: string): HColor =>
        s === TRANSPARENT_NAME
          ? new HColorGradient(HColorSimple.create(TRANSPARENT), HColorSimple.create(OPAQUE), '|')
          : HColorSimple.create(OPAQUE),
    };
    const d = new TaskDrawSeparator(
      TITLE,
      timeScale,
      RealUtils.createOrigin(),
      MIN_DAY,
      MAX_DAY,
      styleBuilder,
      skinParam(gradientSet),
    );
    expect(record(measurer, (ug) => d.drawU(ug)).map((e) => ('draw' in e ? e.draw.slice(0, 5) : ''))).toEqual([
      'ULine',
      'ULine',
    ]);
  });

  it('a colour that is neither simple nor gradient is a ClassCastException (Style.java:372-381 cast)', () => {
    const bad: HColorSet = {
      getColorOrWhite: (n: string): HColor =>
        n === TRANSPARENT_NAME ? { withDark: (d) => d } : HColorSimple.create(OPAQUE),
    };
    const d = new TaskDrawSeparator(
      TITLE,
      timeScale,
      RealUtils.createOrigin(),
      MIN_DAY,
      MAX_DAY,
      styleBuilder,
      skinParam(bad),
    );
    expect(() => {
      record(measurer, (ug) => d.drawU(ug));
    }).toThrow(/ClassCastException/);
  });
});

describe('TaskDrawSeparator.drawTitle (TaskDrawSeparator.java:94-108)', () => {
  const dx = MARGIN + PADDING; // margin.left + padding.left (java:97)
  const dy = MARGIN + PADDING; // margin.top + padding.top (java:98)
  const strategy = (position: LabelPosition): LabelStrategy => new LabelStrategy(position, HorizontalAlignment.LEFT);

  it('first-column strategy: x = colTitles (java:99-103)', () => {
    const log = record(measurer, (ug) => make(TITLE).drawTitle(ug, strategy(LabelPosition.FIRST_COLUMN), 40, 90));
    expect(log.length).toBeGreaterThan(0);
    for (const e of log) {
      expect('chain' in e && e.chain[0]).toBe(`translate(${String(40 + dx)},${String(dy)})`);
    }
    expect(log.some((e) => 'draw' in e && e.draw === `UText(${TITLE})`)).toBe(true);
  });

  it('other strategies: x = 0 (java:102-103)', () => {
    const log = record(measurer, (ug) => make(TITLE).drawTitle(ug, strategy(LabelPosition.LEGACY), 40, 90));
    for (const e of log) expect('chain' in e && e.chain[0]).toBe(`translate(${String(dx)},${String(dy)})`);
  });

  it('no name draws nothing (java:124-125)', () => {
    expect(
      record(measurer, (ug) => make(undefined).drawTitle(ug, strategy(LabelPosition.FIRST_COLUMN), 40, 90)),
    ).toEqual([]);
  });
});

describe('TaskDrawSeparator geometry and the TaskDraw members', () => {
  it('getFullHeightTask = margin.top + padding.top + textHeight + padding.bottom + margin.bottom (java:189-195)', () => {
    const textHeight = measurer.measure(TITLE, SANS).height;
    expect(make(TITLE).getFullHeightTask(bounder)).toBe(2 * MARGIN + 2 * PADDING + textHeight);
    expect(make(undefined).getFullHeightTask(bounder)).toBe(2 * MARGIN + 2 * PADDING);
  });

  it('getHeightMax equals getFullHeightTask (java:226-229)', () => {
    expect(make(TITLE).getHeightMax(bounder)).toBe(make(TITLE).getFullHeightTask(bounder));
  });

  it('getFingerPrint spans 0..end at y .. y + height (java:176-183)', () => {
    const y = RealUtils.createOrigin().addFixed(7);
    const d = make(TITLE, true, y as never);
    const h = d.getFullHeightTask(bounder);
    expect(d.getFingerPrint(bounder)).toEqual(new FingerPrint(0, 7, END, 7 + h));
  });

  it('getY(sb) returns the row Real; getTitleWidth is 0 (java:109-113, 201-204)', () => {
    const y = RealUtils.createOrigin();
    const d = make(TITLE, true, y);
    expect(d.getY(bounder)).toBe(y);
    expect(d.getTitleWidth(bounder)).toBe(0);
  });

  it('getTrueRow and getFingerPrintNote are null upstream, undefined here (java:184-187, 206-209)', () => {
    const d = make(TITLE);
    expect(d.getTrueRow()).toBeUndefined();
    expect(d.getFingerPrintNote(bounder)).toBeUndefined();
  });

  it('setColorsAndCompletion is a no-op (java:211-214)', () => {
    const d = make(TITLE);
    const before = d.getFullHeightTask(bounder);
    d.setColorsAndCompletion(new CenterBorderColor(undefined, undefined), 50, undefined, undefined, undefined);
    expect(d.getFullHeightTask(bounder)).toBe(before);
  });

  it('getTask, getY(sb, side) and getX throw UnsupportedOperationException (java:216-234)', () => {
    const d = make(TITLE);
    expect(() => d.getTask()).toThrow('UnsupportedOperationException');
    expect(() => d.getY(bounder, GSide.LEFT)).toThrow('UnsupportedOperationException');
    expect(() => d.getX(bounder, GSide.LEFT, GArrowType.INCOMING)).toThrow('UnsupportedOperationException');
  });

  it('a missing style is a NullPointerException (java:119-121 getMergedStyle null)', () => {
    const d = new TaskDrawSeparator(
      TITLE,
      timeScale,
      RealUtils.createOrigin(),
      MIN_DAY,
      MAX_DAY,
      new StyleBuilder(),
      skinParam(colorSet(true)),
    );
    expect(() => d.getFullHeightTask(bounder)).toThrow(/NullPointerException/);
  });
});

// T1c: `<:innocent:>` in the separator name draws the Twemoji artwork (Emoji.java:175-193: `getSvg` always
// finds the file on the classpath and `SvgSpriteParserFactory` turns it into vector paths; no text fallback).
describe('TaskDrawSeparator emoji title (TaskDrawSeparator.java:123-129, Emoji.java:175-193)', () => {
  const ARTWORK = '<circle cx="18" cy="18" r="18" fill="#123456"/>';
  const emojiSkin = (store: InternalEmojiStore | undefined): SkinParam =>
    new SkinParam({
      style: createMindmapSkinParam({}),
      skinparam: new Map(),
      sprites: createSpriteRegistry(undefined, store),
      pragma: Pragma.createEmpty(),
    });
  const drawWith = (store: InternalEmojiStore | undefined, name: string): string[] => {
    const d = new TaskDrawSeparator(
      name,
      timeScale,
      RealUtils.createOrigin(),
      MIN_DAY,
      MAX_DAY,
      styleBuilder,
      emojiSkin(store),
    );
    return record(measurer, (ug) =>
      d.drawTitle(ug, new LabelStrategy(LabelPosition.FIRST_COLUMN, HorizontalAlignment.LEFT), 40, 90),
    ).map((e) => ('draw' in e ? e.draw : ''));
  };

  it('with a store the emoji is the artwork shape (1.5 x the 11pt font) instead of the text run', () => {
    expect(drawWith({ get: (u) => (u === '1f607' ? ARTWORK : undefined) }, '<:innocent:> Phase')).toEqual([
      'UEllipse(16.5,16.5)',
      'UText( Phase)',
    ]);
  });

  it('without a store the output is unchanged: the platform-glyph text run', () => {
    expect(drawWith(undefined, '<:innocent:> Phase')).toEqual(['UText(\u{1F607})', 'UText( Phase)']);
  });
});
