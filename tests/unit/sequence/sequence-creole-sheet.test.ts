/**
 * `sequence-creole-sheet.ts` — every sequence label through core's
 * `Display.create0` (`AbstractTextualComponent.java:84-92`,
 * `Display.java:637-713`), recorded as primitives.
 *
 * The oracle for what a label's atoms ARE is core's creole engine itself
 * (the same `CreoleParser`/`SheetBlock1` activity draws through); these tests
 * pin what the seam adds on top: one primitive per drawn shape, block-relative,
 * and the measurement identity every plain label depends on (a markup-free
 * line must measure exactly as the raw `measurer.measure` call it replaced —
 * 910 pinned goldens ride on it).
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';
import { MONOSPACED } from '../../../src/core/klimt/creole/Parser.js';
import { FontStyle } from '../../../src/core/klimt/shape/UText.js';
import { ULine } from '../../../src/core/klimt/shape/ULine.js';
import {
  componentLabelBlock,
  EMPTY_LABEL_BLOCK,
  primitiveKind,
  sequenceLabelBlock,
  sequenceStringBounder,
} from '../../../src/diagrams/sequence/sequence-creole-sheet.js';
import type { TextRun } from '../../../src/diagrams/sequence/ast.js';
import { labelBlockOf, labelFont, SANS } from '../../helpers/sequence-label.js';

const measurer = new DeterministicMeasurer();

/** `arrow { FontSize 13 }` (`plantuml.skin:316-317`). */
const ARROW_FONT: FontSpec = { family: SANS, size: 13 };
const FONT = labelFont(ARROW_FONT.size);

function runsOf(line: string, font = FONT): readonly TextRun[] {
  return labelBlockOf([line], font).primitives;
}

describe('one atom becomes one text primitive', () => {
  it('splits a bold span into three runs, only the middle one bold', () => {
    const runs = runsOf('a <b>bold</b> label');
    expect(runs.map((r) => r.text)).toEqual(['a ', 'bold', ' label']);
    expect(runs.map((r) => r.bold)).toEqual([undefined, true, undefined]);
  });

  it('advances each run x by the PRECEDING run textWidth, from the block left', () => {
    const runs = runsOf('a <b>bold</b> label');
    expect(runs[0]!.x).toBe(0);
    expect(runs[1]!.x).toBeCloseTo(runs[0]!.textWidth, 10);
    expect(runs[2]!.x).toBeCloseTo(runs[1]!.x + runs[1]!.textWidth, 10);
  });

  it('puts every run of a stripe on ONE baseline, one ascent below the block top', () => {
    // `AtomText#drawU`: `ypos = height - descent` (`AtomText.java:213-215`).
    const runs = runsOf('a <b>bold</b> label');
    const ascent = measurer.measure('a ', ARROW_FONT).height - measurer.getDescent(ARROW_FONT, 'a ');
    for (const run of runs) expect(run.y).toBeCloseTo(ascent, 10);
  });

  it('carries italic, colour and decoration off the atom font', () => {
    expect(runsOf('<i>x</i>')[0]!.italic).toBe(true);
    expect(runsOf('<color:red>x</color>')[0]!.color).toBe('#FF0000');
    expect(runsOf('<s>x</s>')[0]!.decoration).toBe('line-through');
    expect(runsOf('<u>x</u>')[0]!.decoration).toBe('underline');
  });
});

describe('fonts', () => {
  it('gives a `""mono""` run the monospaced family and drops the quotes', () => {
    const runs = runsOf('""mono""');
    expect(runs.map((r) => r.text)).toEqual(['mono']);
    expect(runs[0]!.fontFamily).toBe(MONOSPACED);
  });

  it('measures a `<size:N>` run at its own size', () => {
    const runs = runsOf('a<size:20>big</size>');
    expect(runs.map((r) => r.fontSize)).toEqual([13, 20]);
    expect(runs[1]!.textWidth).toBeCloseTo(measurer.measure('big', { family: SANS, size: 20 }).width, 10);
  });

  it('starts from the caller bold/italic font', () => {
    const run = runsOf('plain', labelFont(13, [FontStyle.BOLD, FontStyle.ITALIC]))[0]!;
    expect(run.bold).toBe(true);
    expect(run.italic).toBe(true);
  });
});

describe('measurement identity', () => {
  const PLAIN = ['Bob', 'Alice', 'hello world', 'a: b', 'Participant #1'];

  it('measures a markup-free line exactly as the raw measurer call', () => {
    for (const line of PLAIN) {
      const block = labelBlockOf([line], FONT);
      expect(block.primitives).toHaveLength(1);
      const run = block.primitives[0]!;
      expect(run.text).toBe(line);
      expect(run.textWidth).toBe(measurer.measure(line, ARROW_FONT).width);
      expect(block.width).toBe(measurer.measure(line, ARROW_FONT).width);
      expect(block.height).toBe(measurer.measure(line, ARROW_FONT).height);
      expect(run.textAscent).toBe(measurer.measure(line, ARROW_FONT).height - measurer.getDescent(ARROW_FONT, line));
    }
  });

  it('stacks stripes by their own heights (`SheetBlock1#initMap`, java:139-142)', () => {
    const block = labelBlockOf(['one', 'two'], FONT);
    const line = measurer.measure('one', ARROW_FONT).height;
    expect(block.height).toBeCloseTo(2 * line, 10);
    expect(block.primitives[1]!.y - block.primitives[0]!.y).toBeCloseTo(line, 10);
  });

  it('leaves a markup-free run free of every style field but its colour', () => {
    const run = runsOf('Bob')[0]!;
    expect([run.bold, run.italic, run.decoration, run.url, run.fontWeight, run.textBackColor]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(run.color).toBe('#000000');
  });
});

describe('non-text atoms and stripes', () => {
  it('keeps an undecodable `<img>` as its own fallback text run (`AtomImg.java:106-107`)', () => {
    const runs = runsOf('a<img:/nope.png>b');
    expect(runs.map((r) => r.text)).toEqual(['a', '(Cannot decode)', 'b']);
    expect(runs[1]!.fontSize).toBe(14);
  });

  it('draws a bare `----` as ONE line across the stencil, margins included', () => {
    // `CreoleHorizontalLine` (`StripeSimple.java:154-155`) through the block's
    // own stencil, `-marginX1 .. width + marginX2` (`SheetBlock1.java:247-253`).
    const block = labelBlockOf(['title', '----', 'body'], FONT, { marginX1: 7, marginX2: 9 });
    const shapes = block.primitives.filter((p) => primitiveKind(p) === 'shape');
    expect(shapes).toHaveLength(1);
    const line = shapes[0]!;
    expect(line.shape!.shape).toBeInstanceOf(ULine);
    expect(line.x).toBe(-7);
    expect((line.shape!.shape as ULine).getDX()).toBeCloseTo(block.width + 7 + 9, 10);
  });

  it('strokes the rule with the ink the component applied', () => {
    const block = labelBlockOf(['----'], FONT, { ink: { fore: '#123456' } });
    expect(block.primitives[0]!.shape!.fore).toBe('#123456');
  });

  it('draws a creole table as its cell texts plus grid shapes (`AtomTable.java:102-144`)', () => {
    const runs = labelBlockOf(['|= h1 |= h2 |', '| a | b |'], FONT).primitives;
    // A cell keeps its spaces; the driver trims them at emission (`run-draw-metrics.ts`).
    const texts = runs.filter((r) => primitiveKind(r) === 'text').map((r) => r.text.trim());
    expect(texts).toEqual(['h1', 'h2', 'a', 'b']);
    expect(runs.some((r) => primitiveKind(r) === 'shape')).toBe(true);
  });

  it('draws a `|_` tree with its connector shapes (`AtomTree.java:79-85`)', () => {
    const runs = labelBlockOf(['root', '|_ child'], FONT).primitives;
    expect(runs.filter((r) => primitiveKind(r) === 'text').map((r) => r.text.trim())).toEqual(['root', 'child']);
    expect(runs.filter((r) => primitiveKind(r) === 'shape').length).toBeGreaterThan(0);
  });
});

describe('what `DriverTextSvg` reads beyond the plain run', () => {
  it('carries a `<back:…>` colour as the run text back colour (`DriverTextSvg.java:159-173`)', () => {
    const run = runsOf('<back:#FF0000>hot</back>')[0]!;
    expect(run.textBackColor).toBe('#FF0000');
  });

  it('carries an extended-colour underline as an extra line, not a CSS decoration', () => {
    // `DriverTextSvg.java:133-140`: an UNDERLINE with an extended colour draws
    // a `<line>` at `y + size / 14`.
    const run = runsOf('<u:#00FF00>under</u>')[0]!;
    expect(run.decoration).toBeUndefined();
    expect(run.extraLines).toEqual([{ color: '#00FF00', deltaY: 13 / 14 }]);
  });

  it('tags a `[[url]]` label run with its href and tooltip', () => {
    const tagged = runsOf('[[https://example.com{tip} label]]').filter((r) => r.url !== undefined);
    expect(tagged.map((r) => r.text)).toEqual(['label']);
    expect(tagged[0]!.url).toEqual({ url: 'https://example.com', tooltip: 'tip' });
  });
});

describe('the `~` tile escape and guillemets', () => {
  it('renders a tile-escaped url as literal text, not as a link (`mufomi-43-vaso140`)', () => {
    const runs = runsOf('Action ~[Single] ~[[Double]] ~[~[[Triple]]]');
    expect(runs.map((r) => r.text).join('')).toBe('Action [Single] [[Double]] [[[Triple]]]');
    expect(runs.some((r) => r.url !== undefined)).toBe(false);
  });

  it('measures the RESTORED text, not the hidden private-use form', () => {
    const [run] = runsOf('~[Single]');
    expect(run?.textWidth).toBeCloseTo(measurer.measure('[Single]', ARROW_FONT).width, 10);
  });

  it('rewrites a guillemet run to the default pair (`CreoleParser.java:175`)', () => {
    const [run] = runsOf('<<createRequest>>');
    expect(run?.text).toBe('«createRequest»');
    expect(run?.textWidth).toBeCloseTo(measurer.measure('«createRequest»', ARROW_FONT).width, 10);
  });
});

describe('the display rules `create0` and its caller apply', () => {
  it('maps ONE empty line, or none, to `TextBlockEmpty` (`AbstractTextualComponent.java:86-87`)', () => {
    expect(componentLabelBlock([''], FONT, {}, measurer)).toBe(EMPTY_LABEL_BLOCK);
    expect(componentLabelBlock([], FONT, {}, measurer)).toBe(EMPTY_LABEL_BLOCK);
  });

  it('merges a MessageNumber LEFT of the label, 4 px apart (`Display.java:703-712`)', () => {
    const block = labelBlockOf(['hello'], FONT, { numberText: '12' });
    const [number, label] = block.primitives;
    expect(number!.text).toBe('12');
    expect(label!.x).toBeCloseTo(measurer.measure('12', ARROW_FONT).width + 4, 10);
    expect(block.width).toBeCloseTo(label!.x + measurer.measure('hello', ARROW_FONT).width, 10);
  });

  it('lays a head stereotype out first, in the stereotype font (`CreoleParser.java:168-173`)', () => {
    const stereoFont = labelFont(10, [FontStyle.ITALIC]);
    const runs = labelBlockOf(['Bob'], labelFont(14), {
      stereotype: { labels: ['«svc»'], font: stereoFont },
    }).primitives;
    expect(runs.map((r) => [r.text, r.fontSize, r.italic])).toEqual([
      ['«svc»', 10, true],
      ['Bob', 14, undefined],
    ]);
  });

  it('turns a `--` line of an enhanced block into a separator across the component stencil', () => {
    // `BodyEnhanced2` (`BodyEnhancedAbstract.java:66-80`): `--` starts a block
    // drawn under a `TextBlockLineBefore`, whose `UHorizontalLine` the
    // component's own stencil spans (`ComponentRoseNote.java:124,140-146`).
    const block = labelBlockOf(['top', '--', 'bottom'], FONT, {
      enhanced: { defaultThickness: 1, minimumWidth: 0 },
      componentStencil: { before: 6, after: 15 },
    });
    expect(block.primitives.filter((r) => primitiveKind(r) === 'text').map((r) => r.text)).toEqual(['top', 'bottom']);
    // `UHorizontalLine.infinite(thickness, 1, 1, separator)` skips 1 px at
    // each end (`TextBlockLineBefore.java:84`, `UHorizontalLine.java:99-108`).
    const rule = block.primitives.find((r) => primitiveKind(r) === 'shape')!;
    expect(rule.x).toBe(-6 + 1);
    expect((rule.shape!.shape as ULine).getDX()).toBeCloseTo(block.width + 6 + 15 - 2, 10);
  });
});

describe('the factory', () => {
  it('builds a block once per measurer and key, as the component constructor does', () => {
    const a = sequenceLabelBlock(['memo'], FONT, {}, measurer);
    expect(sequenceLabelBlock(['memo'], FONT, {}, measurer)).toBe(a);
    expect(sequenceLabelBlock(['memo'], FONT, {}, new DeterministicMeasurer())).not.toBe(a);
    expect(sequenceLabelBlock(['memo'], FONT, { marginX1: 3 }, measurer)).not.toBe(a);
  });

  it('hands a weight-aware measurer the BOLD a FontConfiguration keeps in `styles`', () => {
    const seen: FontSpec[] = [];
    const recording: StringMeasurer = {
      measure: (text, spec) => {
        seen.push(spec);
        return measurer.measure(text, spec);
      },
      getDescent: (spec, text) => measurer.getDescent(spec, text),
    };
    sequenceStringBounder(recording).calculateDimension(labelFont(13, [FontStyle.BOLD]), 'x');
    expect(seen[0]).toEqual({ family: SANS, size: 13, weight: 'bold' });
    sequenceStringBounder(recording).calculateDimension({ family: SANS, size: 9 }, 'x');
    expect(seen[1]).toEqual({ family: SANS, size: 9 });
  });
});
