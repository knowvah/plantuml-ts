/**
 * lgm-T1a: `inkOfBody` -- `LimitFinder`'s per-shape rules
 * (`klimt/drawing/LimitFinder.java:108-215`) over a serialized body.
 *
 * Expected values are the rule applied by hand, then cross-checked against
 * the jar: `futaxe-10-xonu513`-style frames size `ww` from exactly these
 * extents (`tests/oracle/svg-conformance/lgm-t1a-mainframe.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { inkOfBody } from '../../src/core/annotations/body-ink.js';
import { FixedMeasurer } from '../../src/core/measurer.js';

/** 10 per character, height 12 -- `LimitFinder#drawText` only needs the height for the top edge. */
const MEASURER = new FixedMeasurer(10, 12);

describe('inkOfBody -- one rule per shape', () => {
  it('URectangle: (x-1, y-1) .. (x+w-1, y+h-1)', () => {
    expect(inkOfBody('<rect x="10" y="20" width="30" height="40" fill="#FFF"/>', MEASURER)).toEqual({
      minX: 9,
      minY: 19,
      maxX: 39,
      maxY: 59,
    });
  });

  it('ULine: both end points', () => {
    expect(inkOfBody('<line x1="5" y1="6" x2="50" y2="7"/>', MEASURER)).toEqual({
      minX: 5,
      minY: 6,
      maxX: 50,
      maxY: 7,
    });
  });

  it('UEllipse: (cx-rx, cy-ry) .. (cx+rx-1, cy+ry-1)', () => {
    expect(inkOfBody('<ellipse cx="30" cy="40" rx="10" ry="5"/>', MEASURER)).toEqual({
      minX: 20,
      minY: 35,
      maxX: 39,
      maxY: 44,
    });
  });

  it('UPolygon: X widened by HACK_X_FOR_POLYGON (10) on both sides, Y exact', () => {
    expect(inkOfBody('<polygon points="40,10,50,14,40,18,44,14"/>', MEASURER)).toEqual({
      minX: 30,
      minY: 10,
      maxX: 60,
      maxY: 18,
    });
  });

  it('UPath: every segment point, an arc only its end point', () => {
    const d = 'M10,10 L30,10 C40,0 50,0 60,10 A5,5,0,0,1,70,20 Z';
    expect(inkOfBody(`<path d="${d}"/>`, MEASURER)).toEqual({ minX: 10, minY: 0, maxX: 70, maxY: 20 });
  });

  it('UImage: (x, y) .. (x+w-1, y+h-1)', () => {
    expect(inkOfBody('<image x="1" y="2" width="16" height="16"/>', MEASURER)).toEqual({
      minX: 1,
      minY: 2,
      maxX: 16,
      maxY: 17,
    });
  });

  it('UText: top = baseline - (height - 1.5), bottom = baseline + 1.5, width = textLength', () => {
    const body = '<text x="10" y="30" font-size="14" textLength="25">hello</text>';
    expect(inkOfBody(body, MEASURER)).toEqual({ minX: 10, minY: 19.5, maxX: 35, maxY: 31.5 });
  });

  it('UText without textLength falls back to the measured width', () => {
    expect(inkOfBody('<text x="0" y="12" font-size="14">ab</text>', MEASURER)).toEqual({
      minX: 0,
      minY: 1.5,
      maxX: 20,
      maxY: 13.5,
    });
  });
});

describe('inkOfBody -- accumulation', () => {
  it('is the union of every shape', () => {
    const body = '<rect x="0" y="0" width="10" height="10"/><line x1="0" y1="0" x2="80" y2="3"/>';
    expect(inkOfBody(body, MEASURER)).toEqual({ minX: -1, minY: -1, maxX: 80, maxY: 9 });
  });

  it('an empty body is MinMax.getEmpty(true): all zero (LimitFinder.java:217-221)', () => {
    expect(inkOfBody('<g></g>', MEASURER)).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('ignores markup that draws nothing (title, defs, comments)', () => {
    expect(inkOfBody('<title>x</title><defs/><!--c--><rect x="1" y="1" width="2" height="2"/>', MEASURER)).toEqual({
      minX: 0,
      minY: 0,
      maxX: 2,
      maxY: 2,
    });
  });
});
