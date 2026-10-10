/**
 * isw-T2-cls F7: a TYPE0 (`as "...`) body dedents relative to its first body
 * line, exactly like TYPE1 -- `CommandCreateElementMultilines.java:169`
 * `lines.trimSmart(1)` runs before the two types are told apart. Jar:
 * unknown/gejuvu-17-vufu851 draws `test 15` / `multiline with alias`.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';

describe('TYPE0 multi-line element dedent (trimSmart(1))', () => {
  it('removes the first body line indent from every body line', () => {
    const ast = parseClass({
      lines: ['usecase/ test15 as "', '    test 15', '      deeper', '  shallower', '"'],
      type: 'class',
    });
    expect(ast.classifiers.find((c) => c.id === 'test15')?.display).toBe('test 15\n  deeper\nshallower');
  });
});
