/**
 * `sequence-creole.ts` — the producer that turns ONE sequence display line
 * into several placed, measured `TextRun`s.
 *
 * The oracle for the split itself is the shared creole atom engine
 * (`core/klimt/creole/legacy/StripeSimple.ts#buildLineAtoms`), which every
 * other diagram family already measures through — so these tests assert the
 * producer against the ENGINE's own output rather than against a second,
 * hand-written expectation of what creole means. That is the point of D1:
 * sequence gains creole by reusing the engine, not by re-porting it.
 *
 * The measurement-identity test is the load-bearing one. C2-C6 route existing,
 * already-conformant call sites through this producer; if a markup-free line
 * did not measure to exactly the number the raw `measurer.measure(text, spec)`
 * call produces, every one of those cutovers would move a golden for a reason
 * that has nothing to do with creole.
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { FontSpec } from '../../../src/core/measurer.js';
import { MONOSPACED } from '../../../src/core/klimt/creole/Parser.js';
import { linkWrap } from '../../../src/core/svg.js';
import {
  sequenceCreoleFont,
  sequenceCreoleRuns,
} from '../../../src/diagrams/sequence/sequence-creole.js';
import { sequenceText } from '../../../src/diagrams/sequence/sequence-text.js';
import { scaleSequenceGeometry } from '../../../src/diagrams/sequence/scale-geo.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type { SequenceGeometry, TextRun } from '../../../src/diagrams/sequence/ast.js';

const measurer = new DeterministicMeasurer();

/** `arrow { FontSize 13 }` (`plantuml.skin:306-308`) — the font a message
 *  label is measured at, and the one C3-C6 will hand this producer. */
const ARROW_FONT: FontSpec = { family: 'sans-serif', size: 13 };

const ORIGIN = { leftX: 100, baselineY: 40 };

function runsOf(line: string, spec: FontSpec = ARROW_FONT): readonly TextRun[] {
  return sequenceCreoleRuns(line, sequenceCreoleFont(spec), ORIGIN, measurer);
}

describe('sequenceCreoleRuns — one atom becomes one run (D3)', () => {
  it('splits a bold span into three runs, only the middle one bold', () => {
    const runs = runsOf('a <b>bold</b> label');
    expect(runs.map((r) => r.text)).toEqual(['a ', 'bold', ' label']);
    expect(runs.map((r) => r.bold)).toEqual([undefined, true, undefined]);
  });

  it('advances each run x by the PRECEDING run textWidth', () => {
    const runs = runsOf('a <b>bold</b> label');
    expect(runs[0]!.x).toBe(ORIGIN.leftX);
    expect(runs[1]!.x).toBeCloseTo(runs[0]!.x + runs[0]!.textWidth, 10);
    expect(runs[2]!.x).toBeCloseTo(runs[1]!.x + runs[1]!.textWidth, 10);
  });

  it('places every run of a line on the SAME baseline', () => {
    const runs = runsOf('a <b>bold</b> label');
    for (const run of runs) expect(run.y).toBe(ORIGIN.baselineY);
  });

  it('carries italic, colour and decoration off the atom font', () => {
    const [italic] = runsOf('<i>x</i>');
    expect(italic!.italic).toBe(true);
    expect(italic!.bold).toBeUndefined();

    const [coloured] = runsOf('<color:red>x</color>');
    expect(coloured!.color).toBe('#FF0000');

    const [struck] = runsOf('<s>x</s>');
    expect(struck!.decoration).toBe('line-through');

    const [underlined] = runsOf('<u>x</u>');
    expect(underlined!.decoration).toBe('underline');
  });
});

describe('sequenceCreoleRuns — fonts', () => {
  it('gives a `""mono""` run the monospaced family and drops the quotes', () => {
    const runs = runsOf('""mono""');
    expect(runs).toHaveLength(1);
    expect(runs[0]!.text).toBe('mono');
    expect(runs[0]!.fontFamily).toBe(MONOSPACED);
  });

  it('carries a `<size:N>` run own size, leaving its neighbours alone', () => {
    const runs = runsOf('a<size:20>big</size>');
    expect(runs.map((r) => r.fontSize)).toEqual([ARROW_FONT.size, 20]);
    // Measured at the run OWN size, not the ambient one.
    expect(runs[1]!.textWidth).toBeCloseTo(
      measurer.measure('big', { family: ARROW_FONT.family, size: 20 }).width,
      10,
    );
  });

  it('starts from the caller bold/italic font spec', () => {
    const runs = runsOf('plain', { ...ARROW_FONT, weight: 'bold', style: 'italic' });
    expect(runs[0]!.bold).toBe(true);
    expect(runs[0]!.italic).toBe(true);
  });
});

describe('sequenceCreoleRuns — measurement identity', () => {
  // The property C2-C6 depend on: routing an unmarked line through the atom
  // engine must not move a single number.
  const PLAIN = ['Bob', 'Alice', 'hello world', 'a: b', 'Participant #1'];

  it('yields exactly one run per markup-free line', () => {
    for (const line of PLAIN) expect(runsOf(line)).toHaveLength(1);
  });

  it('measures that run byte-identically to a raw measurer.measure call', () => {
    for (const line of PLAIN) {
      const run = runsOf(line)[0]!;
      expect(run.text).toBe(line);
      expect(run.textWidth).toBe(measurer.measure(line, ARROW_FONT).width);
      expect(run.textLineHeight).toBe(measurer.measure(line, ARROW_FONT).height);
      expect(run.textAscent).toBe(
        measurer.measure(line, ARROW_FONT).height - measurer.getDescent(ARROW_FONT, line),
      );
    }
  });

  it('leaves a markup-free run free of every style field', () => {
    const run = runsOf('Bob')[0]!;
    expect(run.bold).toBeUndefined();
    expect(run.italic).toBeUndefined();
    expect(run.color).toBeUndefined();
    expect(run.decoration).toBeUndefined();
    expect(run.url).toBeUndefined();
  });
});

describe('sequenceCreoleRuns — non-text atoms', () => {
  // A line holding an atom this engine cannot draw stays WHOLLY literal —
  // exactly what sequence emitted before the seam existed. Emitting no run for
  // the atom drops an ELEMENT, and on the four sprite-only fixtures that
  // 12-against-13 child count short-circuits the comparator above the whole
  // diagram. `InlineAtomToken` keeps no source string, so a per-atom literal
  // would have to guess which `{scale=…}`/colour modifiers were written.
  it.each([
    // `'inline'`, an OpenIconic glyph.
    'x<&heart>y',
    // `'emoji'`.
    'x<:smile:>y',
    // `'latex'`, which this port resolves no dimensions for on a text path.
    'x<latex>e^x</latex>y',
  ])('leaves %s wholly literal, at the raw line width', (line) => {
    const runs = runsOf(line);
    expect(runs.map((r) => r.text)).toEqual([line]);
    expect(runs[0]!.textWidth).toBeCloseTo(measurer.measure(line, ARROW_FONT).width, 10);
  });

  it('keeps an undecodable `<img>` as its own fallback text run', () => {
    // `AtomImg.create` (`AtomImg.java:106-107`) emits the message as a real
    // text run at a hardcoded monospace 14 — so this one IS a `TextRun`, the
    // line holds nothing undrawable, and creole still applies.
    const runs = runsOf('a<img:/nope.png>b');
    expect(runs.map((r) => r.text)).toEqual(['a', '(Cannot decode)', 'b']);
    expect(runs[1]!.fontSize).toBe(14);
  });

  it('keeps a bare separator line as its own literal text', () => {
    // `classifyStripeLine` reports `----` as HORIZONTAL_LINE and yields NO
    // atoms; sequence has no horizontal-rule geometry, so the line stays the
    // plain text it renders as today rather than vanishing.
    const runs = runsOf('----');
    expect(runs.map((r) => r.text)).toEqual(['----']);
  });
});

describe('sequenceCreoleRuns — [[url]]', () => {
  it('tags the captured label run with its href and tooltip', () => {
    const runs = runsOf('[[https://example.com{tip} label]]');
    const tagged = runs.filter((r) => r.url !== undefined);
    expect(tagged).toHaveLength(1);
    expect(tagged[0]!.text).toBe('label');
    expect(tagged[0]!.url).toEqual({ url: 'https://example.com', tooltip: 'tip' });
  });
});

describe('sequenceText — a url-bearing run', () => {
  const URL = { url: 'https://example.com', tooltip: 'tip' };

  it('wraps the <text> in exactly the <a> linkWrap emits', () => {
    const spec = {
      leftX: 10,
      baselineY: 20,
      text: 'label',
      width: 30,
      fontFamily: 'sans-serif',
      fontSize: 13,
      fill: '#000',
    };
    const bare = sequenceText(spec);
    expect(sequenceText({ ...spec, url: URL })).toBe(linkWrap(bare, URL));
  });

  it('emits font-style="italic" when the run asks for it', () => {
    const markup = sequenceText({
      leftX: 10,
      baselineY: 20,
      text: 'label',
      width: 30,
      fontFamily: 'sans-serif',
      fontSize: 13,
      fill: '#000',
      fontStyle: 'italic',
    });
    expect(markup).toContain('font-style="italic"');
  });
});

/** A geometry carrying exactly one message whose label is one run. */
function geometryWithRun(run: TextRun): SequenceGeometry {
  return {
    totalWidth: 200,
    totalHeight: 100,
    participants: [],
    events: [
      {
        kind: 'message',
        fromX: 40,
        toX: 160,
        y: 50,
        label: run.text,
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
}

describe('scaleSequenceGeometry on a creole run', () => {
  const RUN: TextRun = {
    text: 'hello',
    x: 20,
    y: 40,
    textWidth: 27.5,
    textAscent: 10.111,
    textLineHeight: 13,
    fontFamily: MONOSPACED,
    fontSize: 13,
    bold: true,
    italic: true,
    color: '#FF0000',
    decoration: 'underline',
    url: { url: 'https://example.com', tooltip: 'tip' },
  };
  const K = 2.5;

  function scaledRun(): TextRun {
    const message = scaleSequenceGeometry(geometryWithRun(RUN), K).events[0]!;
    if (message.kind !== 'message') throw new Error('unreachable');
    return message.labelLines[0]!;
  }

  it('multiplies every numeric field, fontSize included', () => {
    const run = scaledRun();
    expect(run.x).toBeCloseTo(20 * K, 10);
    expect(run.y).toBeCloseTo(40 * K, 10);
    expect(run.textWidth).toBeCloseTo(27.5 * K, 10);
    expect(run.textAscent).toBeCloseTo(10.111 * K, 10);
    expect(run.textLineHeight).toBeCloseTo(13 * K, 10);
    // `SvgGraphics#format` multiplies an emitted font-size too
    // (`SvgGraphics.java:693`), which is why `scaleSequenceTheme` already
    // scales `theme.fontSize` — a run carrying its OWN size must agree.
    expect(run.fontSize).toBeCloseTo(13 * K, 10);
  });

  it('leaves every style field untouched', () => {
    const run = scaledRun();
    expect(run.fontFamily).toBe(MONOSPACED);
    expect(run.bold).toBe(true);
    expect(run.italic).toBe(true);
    expect(run.color).toBe('#FF0000');
    expect(run.decoration).toBe('underline');
    expect(run.url).toEqual({ url: 'https://example.com', tooltip: 'tip' });
  });
});

describe('the `~` tile escape', () => {
  /**
   * Upstream hides the escaped character before the command scan and restores
   * it in the atom constructor — `StripeSimple.java:150` (`line =
   * CharHidder.hide(line)`, immediately before `modifyStripe`) and
   * `AtomText.java:79` (`String s = CharHidder.unhide(text)`). This port did
   * NOT port the `hide` half into `StripeSimple.ts`; its own doc comment
   * records the deferral and makes it the caller's job, which
   * `class-object-member-creole.ts:100,122` already does. Without it here,
   * `~[[Double]]` reached `CommandCreoleUrl` with a live `[[` and drew an `<a>`
   * the jar does not (`mufomi-43-vaso140`).
   */
  const runsOf = (line: string): readonly TextRun[] =>
    sequenceCreoleRuns(line, sequenceCreoleFont(ARROW_FONT), ORIGIN, measurer);

  it('renders a tile-escaped url as literal text, not as a link', () => {
    const runs = runsOf('Action ~[Single] ~[[Double]] ~[~[[Triple]]]');
    expect(runs.map((r) => r.text).join('')).toBe('Action [Single] [[Double]] [[[Triple]]]');
    expect(runs.some((r) => r.url !== undefined)).toBe(false);
  });

  it('leaves an UNescaped url a link, so the escape is what did the work', () => {
    const runs = runsOf('Action1 [[http://example.com]]');
    expect(runs.some((r) => r.url !== undefined)).toBe(true);
  });

  it('measures the RESTORED text, not the hidden private-use form', () => {
    const [run] = runsOf('~[Single]');
    expect(run?.text).toBe('[Single]');
    expect(run?.textWidth).toBeCloseTo(measurer.measure('[Single]', ARROW_FONT).width, 10);
  });
});

describe('guillemets', () => {
  /**
   * Upstream rewrites `<<x>>` on the DISPLAY LINE, before any classification:
   * `createStripes(skinParam.guillemet().manageGuillemet(cs.toString()), …)`
   * (`CreoleParser.java:175`). It is not part of the atom engine, so a caller
   * entering at `buildLineAtoms` skips it and `bodobu-73-noli773` kept four
   * literal characters where the jar draws two glyphs.
   */
  it('rewrites a guillemet run to the default pair', () => {
    const runs = runsOf('<<createRequest>>');
    expect(runs.map((r) => r.text).join('')).toBe('«createRequest»');
  });

  it('measures the REWRITTEN text, so the box is sized to the glyphs', () => {
    const [run] = runsOf('<<createRequest>>');
    expect(run?.textWidth).toBeCloseTo(measurer.measure('«createRequest»', ARROW_FONT).width, 10);
  });

  it('leaves a line with no guillemet run untouched', () => {
    expect(runsOf('a < b').map((r) => r.text).join('')).toBe('a < b');
  });
});
