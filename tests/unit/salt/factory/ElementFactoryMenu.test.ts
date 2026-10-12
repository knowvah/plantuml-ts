/**
 * `ElementFactoryMenu` (ElementFactoryMenu.java:53-90): `ready()` on exactly
 * `{*`; `create()` adds the first line's tokens as entries, then on every
 * later line the first token names the entry and the rest are its
 * sub-entries — an unknown entry name is `ElementMenuBar#addSubEntry`'s
 * `IllegalArgumentException`, uncaught (salt/lakari-33-mone874). Values from
 * `fixtures/ComplexFactoryProbe.java`.
 */
import { describe, expect, it } from 'vitest';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import { ElementFactoryMenu } from '../../../../src/diagrams/salt/factory/ElementFactoryMenu.js';
import { dictionary } from './complex-factory-support.js';
import { createRowsMatchJar, readyColumnMatchesJar } from './jar-rows.js';

describe('ElementFactoryMenu.ready', () => {
  readyColumnMatchesJar('Menu');
});

describe('ElementFactoryMenu.create', () => {
  createRowsMatchJar(['menu-firuta', 'menu-xetajo', 'menu-lakari', 'menu-single-line-entry', 'terminator-menu']);

  it('throws IllegalStateException when not ready', () => {
    const f = new ElementFactoryMenu(new DataSourceImpl(['{', 'a', '}']), dictionary);
    expect(() => f.create()).toThrow(new Error('IllegalStateException'));
  });

  it('propagates addSubEntry IllegalArgumentException from the factory itself', () => {
    const f = new ElementFactoryMenu(new DataSourceImpl(['{*', 'A | B', 'C | *', '}']), dictionary);
    expect(() => f.create()).toThrow(new Error('IllegalArgumentException'));
  });
});
