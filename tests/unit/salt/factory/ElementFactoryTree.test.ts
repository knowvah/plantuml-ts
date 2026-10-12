/**
 * `ElementFactoryTree` (ElementFactoryTree.java:53-140): `ready()` on `{`
 * followed by a tree marker (`T`, or `T` + a `TableStrategy` char); the
 * first cell of a row is a raw token (its `+` run is the level), every other
 * cell goes through `getNextElement()` — so a nested `{ … }` group or tree
 * is one cell (issue #2730). One instance is shared by every parent,
 * itself included (PSystemSalt.java:179-200). Values from
 * `fixtures/ComplexFactoryProbe.java`.
 */
import { describe, expect, it } from 'vitest';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import { ElementFactoryTree } from '../../../../src/diagrams/salt/factory/ElementFactoryTree.js';
import { dictionary } from './complex-factory-support.js';
import { createRowsMatchJar, readyColumnMatchesJar } from './jar-rows.js';

describe('ElementFactoryTree.ready', () => {
  readyColumnMatchesJar('Tree');
});

describe('ElementFactoryTree.isTreeMarker', () => {
  it.each([
    ['T', true],
    ['T#', true],
    ['T+', true],
    ['T^', true],
    ['T-', true],
    ['T!', true],
    ['T ', true],
    ['T.', false],
    ['Tx', false],
    ['T##', false],
    ['t', false],
    ['#T', false],
    ['', false],
  ])('isTreeMarker(%j) is %s', (text1, expected) => {
    expect(ElementFactoryTree.isTreeMarker(text1)).toBe(expected);
  });
});

describe('ElementFactoryTree.create', () => {
  createRowsMatchJar([
    'tree-root',
    'tree-in-pyramid',
    'tree-nested-group',
    'tree-nested-tree',
    'tree-raw-group-first-cell',
    'tree-empty',
    'tree-strategy-caret',
    'tree-raw-brace-rows',
    'terminator-tree',
    'pyramid-T-dot',
  ]);

  it('throws IllegalStateException when not ready', () => {
    const f = new ElementFactoryTree(new DataSourceImpl(['{', 'a', '}']), dictionary);
    expect(() => f.create()).toThrow(new Error('IllegalStateException'));
  });

  it('a first cell closing a raw group decrements the depth and ends the tree at the next brace', () => {
    // `{T` / `{` / `}` / `}`: the raw `{` opens depth 1 (java:83-86), the raw
    // `}` (a NEWLINE first cell) closes it, then the real `}` ends the tree.
    const source = new DataSourceImpl(['{T', '{', '}', '}', 'rest']);
    const t = new ElementFactoryTree(source, dictionary).create();
    expect(t.getTerminator()).toBe('NEWLINE');
    expect(source.next().getElement()).toBe('rest');
  });
});
