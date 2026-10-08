/**
 * add4-T3gates: `CommandSwimlane.java:63` captures `([^|]+)` untrimmed and
 * `Swimlanes#getOrCreate` (`Swimlanes.java:168-176`) matches names by exact
 * `equals`, so `|a |` and `|a|` are two lanes and the first one's display
 * keeps its trailing space (`Swimlane.java:60`; `nesozi-09-zezu092`).
 */
import { describe, expect, it } from 'vitest';

import { parseActivity } from '../../../src/diagrams/activity/parser.js';

describe('swimlane name (CommandSwimlane.java:63)', () => {
  const ast = parseActivity({ lines: ['|a |', ':x;', '|a|', ':y;'], type: 'activity' });

  it('keeps surrounding whitespace and tells `a ` from `a`', () => {
    if ('refused' in ast) throw new Error('refused');
    expect(ast.swimlanes).toEqual(['a ', 'a']);
    expect(ast.nodes.map((n) => ('swimlane' in n ? n.swimlane : undefined))).toEqual(['a ', 'a']);
  });
});
