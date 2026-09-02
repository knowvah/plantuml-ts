/**
 * C2 — every sequence display splits on its ESCAPED newline.
 *
 * `Display.getWithNewlines(Pragma, String)` (`Display.java:262-346`) is what
 * upstream runs a sequence display through before it ever becomes a text
 * block, at four call sites this suite covers:
 *
 *   - `CommandArrow.java:348`               a message label
 *   - `CommandParticipant.java:153`         a participant's `FULL` display
 *   - `CommandReferenceOverSeveral.java:132` a `ref over` body
 *   - `AbstractTextualComponent.java:64`    everything built from a raw label
 *
 * The escape is the two-character sequence backslash-n in the SOURCE, not a
 * real newline — `parseWithNewlines` has no real-newline branch at all,
 * because upstream's `Display` is already a list by the time anything reads
 * it.
 *
 * The last describe block is the SAFETY property, and it is the reason this
 * file exists rather than a handful of additions to
 * `text-block-geo-metrics.test.ts`: the split must be the IDENTITY on any
 * display carrying no escape, which is what makes every one of the 1141
 * corpus fixtures without one byte-identical across this change.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import {
  displayLines,
  messageLabelBlock,
  messageLabelRows,
  refBodyLines,
} from '../../../src/diagrams/sequence/text-block-geo.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../test-results/dot-cache/sequence',
);

/** The literal two-character escape, written as a TS escape of a backslash so
 *  the source of THIS file is unambiguous about which of the two it means. */
const ESC = '\\n';

const LEFT_X = 100;
const ARROW_Y = 200;

function measurer(): DeterministicMeasurer {
  return new DeterministicMeasurer();
}

/** Every `<text>` at the given font size, in document order. */
function textsAt(svg: string, size: number): Array<{ y: number; len: string; body: string }> {
  const out: Array<{ y: number; len: string; body: string }> = [];
  const re = new RegExp(`<text([^>]*font-size="${size}"[^>]*)>([^<]*)</text>`, 'g');
  for (const m of svg.matchAll(re)) {
    const attrs = m[1]!;
    out.push({
      y: Number(/\by="([^"]*)"/.exec(attrs)![1]!),
      len: /\btextLength="([^"]*)"/.exec(attrs)?.[1] ?? '',
      body: m[2]!,
    });
  }
  return out;
}

describe('displayLines — the shared splitter', () => {
  it('splits on the escaped newline', () => {
    expect(displayLines(`one${ESC}two`)).toEqual(['one', 'two']);
  });

  it('splits every time the escape appears', () => {
    expect(displayLines(`a${ESC}b${ESC}c`)).toEqual(['a', 'b', 'c']);
  });

  it('keeps an empty segment either side of the escape', () => {
    // `Display.java:296-297` pushes `current` unconditionally, empty or not.
    expect(displayLines(`${ESC}x${ESC}`)).toEqual(['', 'x', '']);
  });

  it('maps the other two backslash escapes without splitting', () => {
    // `\t` -> a tab, `\\` -> one backslash (`Display.java:299-302`).
    expect(displayLines('a\\tb')).toEqual(['a\tb']);
    expect(displayLines('C:\\\\tmp')).toEqual(['C:\\tmp']);
  });

  it('breaks on the alignment escapes too', () => {
    // `\l`/`\r` push the line AND set the block alignment (`Display.java:
    // 290-296`); this port consumes the break and discards the alignment.
    expect(displayLines('a\\lb')).toEqual(['a', 'b']);
    expect(displayLines('a\\rb')).toEqual(['a', 'b']);
  });

  it('carries a real newline through as a separate line', () => {
    // This port's parser lowers the escape to a REAL newline for note and
    // divider bodies (`command-note-factory.ts:119`, `command-misc.ts:89`)
    // and joins the multi-line `ref` form with one (`parser.ts:122`), which
    // is its stand-in for upstream's already-a-list `Display`.
    expect(displayLines('a\nb')).toEqual(['a', 'b']);
  });
});

describe('message labels split on the escape', () => {
  it('counts the escaped lines in the vertical reservation', () => {
    expect(messageLabelRows(`one${ESC}two`, undefined)).toBe(2);
  });

  it('emits one run per escaped line, each with its own width', () => {
    const block = messageLabelBlock(
      `one${ESC}two`,
      undefined,
      LEFT_X,
      ARROW_Y,
      defaultTheme,
      measurer(),
    );
    expect(block.lines.map((r) => r.text)).toEqual(['one', 'two']);
    expect(block.lines[0]!.textWidth).not.toBe(block.lines[1]!.textWidth);
  });

  it('puts consecutive baselines one textLineHeight apart', () => {
    const block = messageLabelBlock(
      `one${ESC}two`,
      undefined,
      LEFT_X,
      ARROW_Y,
      defaultTheme,
      measurer(),
    );
    const [first, second] = block.lines;
    expect(second!.y - first!.y).toBeCloseTo(first!.textLineHeight, 10);
  });

  it('grows the block UPWARD, leaving the arrow’s own y alone', () => {
    // `posArrow = getTextHeight(stringBounder)` with `yText = 0`
    // (`ComponentRoseArrow.java:141-148`): the block's BOTTOM is pinned to
    // the arrow, so the last baseline is the same however many rows there are.
    const one = messageLabelBlock('one', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer());
    const two = messageLabelBlock(
      `one${ESC}two`,
      undefined,
      LEFT_X,
      ARROW_Y,
      defaultTheme,
      measurer(),
    );
    expect(two.lines.at(-1)!.y).toBeCloseTo(one.lines.at(-1)!.y, 10);
  });
});

describe('a ref body splits on the escape', () => {
  it('turns one escaped line into two body lines', () => {
    // `CommandReferenceOverSeveral.java:132`.
    expect(refBodyLines('ref', `first${ESC}second`)).toEqual(['first', 'second']);
  });
});

describe('butali-53-kige134 — a two-line participant head, against the jar', () => {
  const svg = renderFixtureSequence(
    readFileSync(join(CACHE, 'butali-53-kige134', 'in.puml'), 'utf8'),
    measurer(),
  );
  // The head font is `participant { FontSize 14 }`; the message labels beside
  // it are 13, so this selects heads and nothing else.
  const heads = textsAt(svg, 14);

  it('emits the escaped name as two runs', () => {
    // The jar's own: `Bob` then `on 2 lines` (`in.svg`, the first head block).
    expect(heads.slice(0, 3).map((t) => t.body)).toEqual(['Alice', 'Bob', 'on 2 lines']);
  });

  it('separates their baselines by one textLineHeight', () => {
    // The jar puts them at y=27.889 and y=41.889 — 14 apart, the 14pt line box.
    const bob = heads.find((t) => t.body === 'Bob')!;
    const rest = heads.find((t) => t.body === 'on 2 lines')!;
    expect(rest.y - bob.y).toBeCloseTo(14, 3);
  });

  it('gives each run its own textLength', () => {
    const bob = heads.find((t) => t.body === 'Bob')!;
    const rest = heads.find((t) => t.body === 'on 2 lines')!;
    expect(bob.len).not.toBe('');
    expect(rest.len).not.toBe('');
    expect(bob.len).not.toBe(rest.len);
  });
});

describe('cimofu-59-xotu865 — the root child count reaches the jar’s', () => {
  it('no longer short-circuits at the top-level child count', () => {
    const dir = join(CACHE, 'cimofu-59-xotu865');
    const svg = renderFixtureSequence(readFileSync(join(dir, 'in.puml'), 'utf8'), measurer());
    const { diffs } = compareSvg(svg, readFileSync(join(dir, 'in.svg'), 'utf8'), 'deterministic');
    expect(diffs.filter((d) => d.path === 'svg[childCount]')).toEqual([]);
  });
});

describe('SAFETY — a display with no escape is untouched', () => {
  it('is the identity on every escape-free display', () => {
    for (const s of [
      '',
      'hello',
      'Castor doo()',
      'こんにちわ',
      '<b>bold</b> & <color:red>x',
      '""mono"" [[http://x]]',
      'a b  c   ',
    ]) {
      expect(displayLines(s)).toEqual([s]);
    }
  });

  it('leaves a single-line message label at exactly one run', () => {
    const block = messageLabelBlock('hello', undefined, LEFT_X, ARROW_Y, defaultTheme, measurer());
    expect(block.lines).toHaveLength(1);
    expect(block.lines[0]!.text).toBe('hello');
    expect(messageLabelRows('hello', undefined)).toBe(1);
  });
});
