/**
 * `ElementFactoryPyramid` (ElementFactoryPyramid.java:56-120): `ready()` on
 * `{`, `{+`, `{^`, `{#`, `{!`, `{-` unless the next token is a border
 * position or a tree marker; `create()` feeds a `Positionner2` (`*` merges
 * left), takes a `{^"title"` title only on a NEWCOL header, and returns the
 * closing `}`'s terminator. Values from `fixtures/ComplexFactoryProbe.java`.
 */
import { describe, expect, it } from 'vitest';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import { ElementFactoryPyramid } from '../../../../src/diagrams/salt/factory/ElementFactoryPyramid.js';
import { dictionary } from './complex-factory-support.js';
import { createRowsMatchJar, readyColumnMatchesJar } from './jar-rows.js';

describe('ElementFactoryPyramid.ready', () => {
  readyColumnMatchesJar('Pyramid');
});

describe('ElementFactoryPyramid.create', () => {
  createRowsMatchJar([
    'pyramid-merge',
    'pyramid-title',
    'pyramid-title-newline',
    'pyramid-title-other-strategy',
    'pyramid-nested',
    'pyramid-first-star',
    'pyramid-merge-overflow',
    'pyramid-T-dot',
    'pyramid-unknown-cell',
    'terminator-pyramid',
    'menu-firuta',
    'nested-everything',
    'no-root',
  ]);

  it('throws IllegalStateException when not ready', () => {
    const f = new ElementFactoryPyramid(new DataSourceImpl(['a']), dictionary);
    expect(() => f.create()).toThrow(new Error('IllegalStateException'));
  });

  it('consumes through its closing brace and nothing after it', () => {
    const source = new DataSourceImpl(['{', '}', 'rest']);
    const t = new ElementFactoryPyramid(source, dictionary).create();
    expect(t.getTerminator()).toBe('NEWLINE');
    expect(source.next().getElement()).toBe('rest');
  });
});
