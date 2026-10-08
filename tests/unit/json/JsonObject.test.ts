import { describe, expect, it } from 'vitest';
import { JsonObject } from '../../../src/diagrams/json/JsonObject.js';
import { parseJson } from '../../../src/diagrams/json/parser.js';
import { parseYaml } from '../../../src/diagrams/yaml/parser.js';
import { parseHcl } from '../../../src/diagrams/hcl/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const src = (type: UmlSource['type'], lines: string[]): UmlSource => ({ lines, type });
const membersOf = (v: unknown): Array<[string, unknown]> => (v as JsonObject).members();

describe('JsonObject (JsonObject.java:337-348)', () => {
  it('add appends in order and keeps a repeated name', () => {
    const o = new JsonObject().add('b', 1).add('10', 2).add('b', 3);
    expect(o.size).toBe(3);
    expect(o.members()).toEqual([
      ['b', 1],
      ['10', 2],
      ['b', 3],
    ]);
  });
});

describe('each parser builds its object as upstream does', () => {
  it('json keeps duplicates and integer-like keys in source order (Json.java:377-378)', () => {
    const ast = parseJson(src('json', ['{"b": 1, "10": 2, "b": {"x": [1, {"2": null}]}}']));
    const members = membersOf(ast.root);
    expect(members.map(([k]) => k)).toEqual(['b', '10', 'b']);
    const nested = members[2]![1] as JsonObject;
    expect(nested.names).toEqual(['x']);
    expect(membersOf((nested.values[0] as unknown[])[1])).toEqual([['2', null]]);
  });

  it('yaml collapses a repeated key: last value, first position (Monomorph.java:103-111)', () => {
    const ast = parseYaml(src('yaml', ['a: 1', '10: 2', 'a: 3']));
    expect(membersOf(ast.root)).toEqual([
      ['a', '3'],
      ['10', '2'],
    ]);
  });

  it('hcl keeps a repeated field, collapses a repeated module (HclParser.java:61-75, :123-148)', () => {
    const fields = parseHcl(src('hcl', ['r {', 'a = "1"', '10 = "2"', 'a = "3"', '}']));
    expect(membersOf(fields.root)).toEqual([
      ['a', '1'],
      ['10', '2'],
      ['a', '3'],
    ]);
    const modules = parseHcl(src('hcl', ['m {', 'a = "1"', '}', 'o {', '}', 'm {', 'b = "2"', '}']));
    expect(membersOf(modules.root).map(([k, v]) => [k, (v as JsonObject).names])).toEqual([
      ['m', ['b']],
      ['o', []],
    ]);
  });
});
