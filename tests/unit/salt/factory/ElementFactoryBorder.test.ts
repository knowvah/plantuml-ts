/**
 * `ElementFactoryBorder` (ElementFactoryBorder.java:51-105): `ready()` on
 * `{`, `{+`, `{#`, `{!`, `{-` followed by a whole `N=`/`S=`/`E=`/`W=` token
 * (not `C=`, not `{^`); `create()` dispatches each position on its FIRST
 * char only and throws `IllegalStateException` on any other. Values from
 * `fixtures/ComplexFactoryProbe.java`.
 */
import { describe, expect, it } from 'vitest';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import { ElementFactoryBorder } from '../../../../src/diagrams/salt/factory/ElementFactoryBorder.js';
import { dictionary } from './complex-factory-support.js';
import { createRowsMatchJar, readyColumnMatchesJar } from './jar-rows.js';

describe('ElementFactoryBorder.ready', () => {
  readyColumnMatchesJar('Border');
});

describe('ElementFactoryBorder.create', () => {
  createRowsMatchJar([
    'border-jukefo',
    'border-plain-cells',
    'border-first-char',
    'border-bad-position',
    'border-nested-border',
    'terminator-border',
  ]);

  it('throws IllegalStateException when not ready', () => {
    const f = new ElementFactoryBorder(new DataSourceImpl(['{', 'a', '}']), dictionary);
    expect(() => f.create()).toThrow(new Error('IllegalStateException'));
  });
});
