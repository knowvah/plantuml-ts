/**
 * `ElementFactoryScroll` (ElementFactoryScroll.java:50-80): `ready()` on
 * exactly `{S`, `{S-`, `{SI` (the tokeniser splits `{s`/`{si` too, but
 * `equals` is case-sensitive); `create()` adds every cell to a
 * `Positionner2` — no `*` merge — and picks `ScrollStrategy.fromDesc(header)`.
 * Values from `fixtures/ComplexFactoryProbe.java`.
 */
import { describe, expect, it } from 'vitest';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import { ElementFactoryScroll } from '../../../../src/diagrams/salt/factory/ElementFactoryScroll.js';
import { dictionary } from './complex-factory-support.js';
import { createRowsMatchJar, readyColumnMatchesJar } from './jar-rows.js';

describe('ElementFactoryScroll.ready', () => {
  readyColumnMatchesJar('Scroll');
});

describe('ElementFactoryScroll.create', () => {
  createRowsMatchJar([
    'scroll-both',
    'scroll-vertical',
    'scroll-horizontal',
    'scroll-in-pyramid',
    'scroll-star',
    'terminator-scroll',
  ]);

  it('throws IllegalStateException when not ready', () => {
    const f = new ElementFactoryScroll(new DataSourceImpl(['{', 'a', '}']), dictionary);
    expect(() => f.create()).toThrow(new Error('IllegalStateException'));
  });
});
