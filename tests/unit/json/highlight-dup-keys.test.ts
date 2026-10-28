import { describe, expect, it } from 'vitest';
import { parseJson } from '../../../src/diagrams/json/parser.js';
import {
  Highlighted,
  buildHighlightMap,
  containerEntries,
  isHighlighted,
  upOneLevel,
  walkTree,
} from '../../../src/diagrams/json/json-layout-prep.js';
import type { JsonContainer } from '../../../src/diagrams/json/json-layout-prep.js';

/** The `key=value` rows the jar draws a highlight rect for (artifact table). */
function highlightedRows(highlightLines: string[], json: string): string[] {
  const ast = parseJson({ type: 'json', lines: [...highlightLines, json] });
  const flat = walkTree(ast.root as JsonContainer);
  const map = buildHighlightMap(flat, ast.highlights);
  const rows: string[] = [];
  for (const fn of flat) {
    const keys = map.get(fn.id);
    for (const [k, v] of containerEntries(fn.value)) {
      if (keys?.has(k)) rows.push(`${k}=${typeof v === 'number' ? String(v) : '{}'}`);
    }
  }
  return rows;
}

const hl = (path: string, cls = ''): string => `#highlight ${path}${cls === '' ? '' : ` <<${cls}>>`}`;

describe('Highlighted (yaml/Highlighted.java)', () => {
  it('upOneLevel: ** is passed down unchanged (Highlighted.java:90-91)', () => {
    const h = new Highlighted(['**', 'a', 'b'], 'x');
    expect(h.upOneLevel('zzz')?.paths).toEqual(['**', 'a', 'b']);
  });

  it('upOneLevel: * and an equal key drop the first segment (:92-93)', () => {
    expect(new Highlighted(['*', 'b'], '').upOneLevel('q')?.paths).toEqual(['b']);
    expect(new Highlighted(['a', 'b'], '').upOneLevel('a')?.paths).toEqual(['b']);
  });

  it('upOneLevel: other keys and single-segment paths yield null (:87-88,94)', () => {
    expect(new Highlighted(['a', 'b'], '').upOneLevel('c')).toBeNull();
    expect(new Highlighted(['a'], '').upOneLevel('a')).toBeNull();
  });

  it('isKeyHighlight: lone key or ** / key only (:98-102)', () => {
    expect(new Highlighted(['a'], '').isKeyHighlight('a')).toBe(true);
    expect(new Highlighted(['**', 'a'], '').isKeyHighlight('a')).toBe(true);
    expect(new Highlighted(['**', 'a'], '').isKeyHighlight('b')).toBe(false);
    expect(new Highlighted(['**', 'a', 'b'], '').isKeyHighlight('b')).toBe(false);
    expect(new Highlighted(['a', 'b'], '').isKeyHighlight('a')).toBe(false);
  });

  it('upOneLevel(list) drops the non-followers (SmetanaForJson.java:148-156)', () => {
    const list = [new Highlighted(['a', 'b'], '1'), new Highlighted(['c', 'd'], '2')];
    expect(upOneLevel('a', list).map((h) => h.paths)).toEqual([['b']]);
  });

  it('isHighlighted returns the FIRST match (TextBlockJson.java:155-161)', () => {
    const list = [new Highlighted(['a'], 'h1'), new Highlighted(['a'], 'h2')];
    expect(isHighlighted('a', list)?.styleClass).toBe('h1');
    expect(isHighlighted('z', list)).toBeNull();
  });
});

describe('buildHighlightMap vs the jar (diagnosis/highlight-dup-keys.md)', () => {
  it('dup at root: both a.b rows (b=1 AND b=2)', () => {
    expect(highlightedRows([hl('"a" / "b"')], '{"a":{"b":1},"a":{"b":2}}')).toEqual(['b=1', 'b=2']);
  });

  it('target only under the 1st dup: b=1', () => {
    expect(highlightedRows([hl('"a" / "b"')], '{"a":{"b":1},"a":{"c":2}}')).toEqual(['b=1']);
  });

  it('target only under the 2nd dup: c=2', () => {
    expect(highlightedRows([hl('"a" / "c"')], '{"a":{"b":1},"a":{"c":2}}')).toEqual(['c=2']);
  });

  it('dup nested: b=1, b=2', () => {
    expect(highlightedRows([hl('"x" / "a" / "b"')], '{"x":{"a":{"b":1},"a":{"b":2}},"y":3}')).toEqual(['b=1', 'b=2']);
  });

  it('array under dup: 1, 3', () => {
    expect(highlightedRows([hl('"a" / "0"')], '{"a":[1,2],"a":[3,4]}')).toEqual(['0=1', '0=3']);
  });

  it('dup above two levels: c=1, c=2', () => {
    expect(highlightedRows([hl('"a" / "b" / "c"')], '{"a":{"b":{"c":1}},"a":{"b":{"c":2}}}')).toEqual(['c=1', 'c=2']);
  });

  it('dup as the highlighted leaf: a=1, a=2', () => {
    expect(highlightedRows([hl('"a"')], '{"a":1,"a":2}')).toEqual(['a=1', 'a=2']);
  });

  it('* / b and ** / b reach both dups', () => {
    const json = '{"a":{"b":1},"a":{"b":2}}';
    expect(highlightedRows([hl('"*" / "b"')], json)).toEqual(['b=1', 'b=2']);
    expect(highlightedRows([hl('"**" / "b"')], json)).toEqual(['b=1', 'b=2']);
  });

  it('** / a / b highlights nothing (Highlighted.java:90-91,98-102)', () => {
    expect(highlightedRows([hl('"**" / "a" / "b"')], '{"a":{"b":1},"c":{"a":{"b":2}}}')).toEqual([]);
  });

  it('two directives on one key: the first wins (TextBlockJson.java:155-161)', () => {
    const ast = parseJson({
      type: 'json',
      lines: [hl('"a"', 'h1'), hl('"a"', 'h2'), '{"a":1}'],
    });
    const flat = walkTree(ast.root as JsonContainer);
    expect(buildHighlightMap(flat, ast.highlights).get('n0')?.get('a')).toBe('h1');
  });

  it('no highlights: empty map', () => {
    const ast = parseJson({ type: 'json', lines: ['{"a":{"b":1}}'] });
    expect(buildHighlightMap(walkTree(ast.root as JsonContainer), ast.highlights).size).toBe(0);
  });
});
