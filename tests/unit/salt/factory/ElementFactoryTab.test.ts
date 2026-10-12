/**
 * `ElementFactoryTab` (ElementFactoryTab.java:53-83): `ready()` on exactly
 * `{/`; `create()` adds every token as a tab and turns the bar vertical as
 * soon as one tab ends its line. Values from `fixtures/ComplexFactoryProbe.java`.
 */
import { describe, expect, it } from 'vitest';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import { ElementFactoryTab } from '../../../../src/diagrams/salt/factory/ElementFactoryTab.js';
import { dictionary } from './complex-factory-support.js';
import { createRowsMatchJar, readyColumnMatchesJar } from './jar-rows.js';

describe('ElementFactoryTab.ready', () => {
  readyColumnMatchesJar('Tab');
});

describe('ElementFactoryTab.create', () => {
  createRowsMatchJar(['tab-horizontal', 'tab-vertical', 'tab-mixed', 'terminator-tab']);

  it('throws IllegalStateException when not ready', () => {
    const f = new ElementFactoryTab(new DataSourceImpl(['{', 'a', '}']), dictionary);
    expect(() => f.create()).toThrow(new Error('IllegalStateException'));
  });
});
