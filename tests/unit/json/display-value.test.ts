/**
 * ddc-T2d: how a parsed value reaches the page (`TextBlockJson#getShortString`,
 * `TextBlockJson.java:176-195`, then `Display.getWithNewlines`).
 */
import { describe, expect, it } from 'vitest';
import { JsonNumber } from '../../../src/diagrams/json/JsonNumber.js';
import { getDisplayValue, walkTree } from '../../../src/diagrams/json/json-layout-prep.js';
import { jsonParse } from '../../../src/diagrams/json/JsonParser.js';

describe('getDisplayValue', () => {
  it('draws a JsonNumber as its literal (JsonNumber.java:41-44)', () => {
    expect(getDisplayValue(new JsonNumber('-12.5e3'))).toEqual({ display: '-12.5e3', valueType: 'number' });
  });

  it('draws a plain number as String(n), which is its literal', () => {
    expect(getDisplayValue(0.25)).toEqual({ display: '0.25', valueType: 'number' });
  });
});

describe('walkTree', () => {
  it('does not take a JsonNumber member for a nested container', () => {
    const flat = walkTree(jsonParse('{"a": 1e10, "b": {"c": 2}}') as never);
    expect(flat.map((n) => n.parentKey)).toEqual([null, 'b']);
  });
});
