/**
 * Directive lines in `@startjson`, as upstream handles them (unwind-U1):
 * the json family has no command table, only `StyleExtractor`.
 */

import { describe, expect, it } from 'vitest';
import { parseJson } from '../../../src/diagrams/json/parser.js';
import { isEmpty } from '../../../src/core/annotations/index.js';
import { plainOf } from '../../helpers/json-object.js';

function parse(lines: string[]) {
  return parseJson({ lines, type: 'json' as const });
}

describe('parseJson — directive lines (unwind-U1)', () => {
  // StyleExtractor.java:84-85 + JsonDiagramFactory.java:105-108: only a
  // leading `title ` line is chrome, and its text is taken raw.
  it('single-line `title X` populates annotations.title, not the JSON body', () => {
    const ast = parse(['title My JSON', '{"a": 1}']);
    expect(ast.annotations?.title.display).toEqual(['My JSON']);
    expect(plainOf(ast.root)).toEqual({ a: 1 });
  });

  it('keeps quotes in the title text (jar: unwind-U1/json-title-quoted)', () => {
    expect(parse(['title "Q"', '{"a": 1}']).annotations?.title.display).toEqual(['"Q"']);
  });

  // Everything else is payload, so the JSON fails to parse and the jar draws
  // "Your data does not sound like JSON data" (jar: unwind-U1/json-caption,
  // json-legend, json-header, json-footer, json-mainframe, json-title-after).
  it.each([
    ['multi-line title', ['title', 'Line One', 'end title']],
    ['caption', ['caption a caption']],
    ['legend', ['legend', 'a legend line', 'end legend']],
    ['header', ['header h']],
    ['footer', ['footer f']],
    ['mainframe', ['mainframe m']],
  ])('%s is payload: parse error, no chrome', (_name, lines) => {
    const ast = parse([...lines, '{"a": 1}']);
    expect(ast.parseError).toBe(true);
    expect(isEmpty(ast.annotations!)).toBe(true);
  });

  it('a title after the payload is payload', () => {
    expect(parse(['{"a": 1}', 'title Late']).parseError).toBe(true);
  });

  it('annotation-free fixture parses identically (no chrome, empty annotations)', () => {
    const ast = parse(['{"a": 1}']);
    expect(isEmpty(ast.annotations!)).toBe(true);
    expect(plainOf(ast.root)).toEqual({ a: 1 });
  });
});
