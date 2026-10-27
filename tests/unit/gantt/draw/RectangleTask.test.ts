import { describe, expect, it } from 'vitest';
import { HColors } from '../../../../src/core/klimt/color/HColors.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { Segment } from '../../../../src/core/sequencediagram/graphic/Segment.js';
import { RectangleTask } from '../../../../src/diagrams/gantt/draw/RectangleTask.js';
import { record } from '../../../helpers/recording-ugraphic.js';

// Expected values are hand-derived from RectangleTask.java (line refs per case).
const HEIGHT = 20;
const NONE = '#00000000';
const WHITE = '#FFFFFF';
const DOTTED = 'stroke(2,3,1)';
const measurer = new DeterministicMeasurer();

/** One drawn shape as `[shape, ...apply chain]`. */
function drawLog(task: RectangleTask, oddStart: boolean, oddEnd: boolean): string[][] {
  return record(measurer, (ug) => {
    task.draw(ug, HEIGHT, HColors.WHITE, oddStart, oddEnd);
  }).map((e) => {
    if (!('draw' in e)) throw new Error('unexpected event');
    return [e.draw, ...e.chain];
  });
}

describe('RectangleTask without round (RectangleTask.java:130-161)', () => {
  it('one full segment, completion 100: back rect then outline (java:131-137, 181-188, 217-222)', () => {
    expect(drawLog(new RectangleTask(10, 50, 0, 100, []), false, false)).toEqual([
      ['URectangle(40,20)', 'translate(10,0)', `fore(${NONE})`],
      ['URectangle(40,20)', 'translate(10,0)', `back(${NONE})`],
    ]);
  });

  it('one segment, completion 50: filled half + background half (java:131-137, 223-229)', () => {
    expect(drawLog(new RectangleTask(10, 50, 0, 50, []), false, false)).toEqual([
      ['URectangle(20,20)', 'translate(10,0)', `fore(${NONE})`],
      ['URectangle(20,20)', 'translate(10,0)', `fore(${NONE})`, `back(${WHITE})`, 'translate(20,0)'],
      ['URectangle(40,20)', 'translate(10,0)', `back(${NONE})`],
    ]);
  });

  it('two segments, both ends odd: partial completion in the second (java:138-160, 170-179, 190-215)', () => {
    // segments [10,40],[60,100]; sum 70, lim 35; seg1: current 30 < lim 35 < next 70 -> 5.
    expect(drawLog(new RectangleTask(10, 100, 0, 50, [new Segment(40, 60)]), true, true)).toEqual([
      ['URectangle(31,20)', 'translate(10,0)', `fore(${NONE})`],
      ['ULine(30,0)', 'translate(10,0)', `back(${NONE})`],
      ['ULine(30,0)', 'translate(10,0)', `back(${NONE})`, 'translate(0,20)'],
      ['URectangle(5,20)', 'translate(60,0)', `fore(${NONE})`],
      ['URectangle(35,20)', 'translate(60,0)', `fore(${NONE})`, `back(${WHITE})`, 'translate(5,0)'],
      ['ULine(40,0)', 'translate(60,0)', `back(${NONE})`],
      ['ULine(40,0)', 'translate(60,0)', `back(${NONE})`, 'translate(0,20)'],
      ['ULine(14,0)', DOTTED, 'translate(43,0)'],
      ['ULine(14,0)', DOTTED, 'translate(43,0)', 'translate(0,20)'],
    ]);
  });

  it('two segments, even ends: first gets the start v-line, last the end v-line (java:150-157, 205-211)', () => {
    const log = drawLog(new RectangleTask(10, 100, 0, 100, [new Segment(40, 60)]), false, false);
    expect(log[1]).toEqual(['UPath', 'translate(10,0)', `back(${NONE})`]);
    expect(log[3]).toEqual(['UPath', 'translate(60,0)', `back(${NONE})`, 'translate(0,0)']);
    expect(log[4]).toEqual(['ULine(14,0)', DOTTED, 'translate(43,0)']);
  });

  it('current >= lim gives widthCompletion 0: background-filled rect (java:144-146, 217-222)', () => {
    // segments [10,40],[60,100]; completion 20 -> lim 14; seg0 is partial (4 draws), seg1 current 30 >= 14.
    const log = drawLog(new RectangleTask(10, 100, 0, 20, [new Segment(40, 60)]), true, true);
    expect(log[4]).toEqual(['URectangle(40,20)', 'translate(60,0)', `fore(${NONE})`, `back(${WHITE})`]);
  });

  it('dotted connector is skipped when the gap is 6 or less (java:170-179)', () => {
    // segments [10,40],[44,100]: v1 = 43, v2 = 41 -> no dotted lines.
    const log = drawLog(new RectangleTask(10, 100, 0, 100, [new Segment(40, 44)]), true, true);
    expect(log.some((entry) => entry.includes(DOTTED))).toBe(false);
  });
});

describe('RectangleTask with round (RectangleTask.java:74-111, 113-128)', () => {
  it('completion 100 draws the rounded rectangle at the segment start (java:101-110)', () => {
    expect(drawLog(new RectangleTask(10, 50, 6, 100, []), false, false)).toEqual([
      ['URectangle(40,20)', 'translate(10,0)'],
    ]);
  });

  it('completion 0 with oddStart draws the right-open U on the background (java:103-107)', () => {
    expect(drawLog(new RectangleTask(10, 50, 6, 0, []), true, false)).toEqual([
      ['UPath', `back(${WHITE})`, 'translate(10,0)'],
    ]);
  });

  it('completion 0 with oddEnd draws the left-open U (java:108-109)', () => {
    expect(drawLog(new RectangleTask(10, 50, 6, 0, []), false, true)).toEqual([
      ['UPath', `back(${WHITE})`, 'translate(10,0)'],
    ]);
  });

  it('completion 50 draws two U halves and the outline (java:110-118)', () => {
    // x1 = 40 * 50 / 100 = 20, so the second half starts at 10 + 20.
    expect(drawLog(new RectangleTask(10, 50, 6, 50, []), false, false)).toEqual([
      ['UPath', `fore(${NONE})`, 'translate(10,0)'],
      ['UPath', `back(${WHITE})`, `fore(${NONE})`, 'translate(30,0)'],
      ['URectangle(40,20)', `back(${NONE})`, 'translate(10,0)'],
    ]);
  });

  it('several segments: first, middle (partly), last, dotted (java:113-128)', () => {
    // segments [10,30],[40,60],[70,100]; middle length 20 * 50 / 100 = 10.
    expect(
      drawLog(new RectangleTask(10, 100, 6, 50, [new Segment(30, 40), new Segment(60, 70)]), false, false),
    ).toEqual([
      ['UPath', 'translate(10,0)'],
      ['URectangle(10,20)', 'translate(40,0)', `fore(${NONE})`],
      ['URectangle(11,20)', 'translate(40,0)', `fore(${NONE})`, `back(${WHITE})`, 'translate(10,0)'],
      ['ULine(20,0)', 'translate(40,0)', `back(${NONE})`],
      ['ULine(20,0)', 'translate(40,0)', `back(${NONE})`, 'translate(0,20)'],
      ['UPath', 'translate(70,0)'],
      ['ULine(4,0)', DOTTED, 'translate(33,0)'],
      ['ULine(4,0)', DOTTED, 'translate(33,0)', 'translate(0,20)'],
      ['ULine(4,0)', DOTTED, 'translate(63,0)'],
      ['ULine(4,0)', DOTTED, 'translate(63,0)', 'translate(0,20)'],
    ]);
  });
});

describe('RectangleTask constructor (RectangleTask.java:59-67)', () => {
  it('startPos >= endPos yields the one-pixel segment [start, start + 1]', () => {
    expect(drawLog(new RectangleTask(10, 10, 0, 100, []), false, false)).toEqual([
      ['URectangle(1,20)', 'translate(10,0)', `fore(${NONE})`],
      ['URectangle(1,20)', 'translate(10,0)', `back(${NONE})`],
    ]);
  });
});
