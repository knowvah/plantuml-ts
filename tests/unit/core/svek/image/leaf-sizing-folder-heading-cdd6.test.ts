/**
 * cdd6 T3f follow-up (cepedu-19-namu934): a folder/package leaf's label
 * line `= heading` is measured in its heading font -- `StripeSimple.java:
 * 199-202` `fontConfiguration.bigger(4).bold()` for order 0 -- not the flat
 * line height. Jar cepedu: `package foo2 [ = Creole heading ]` is 55 tall,
 * `package foo1 [ text containing \n description of foo ]` 51.
 */
import { describe, it, expect } from 'vitest';
import { measureFolderLeaf } from '../../../../../src/core/svek/image/leaf-sizing-folder.js';
import { WidthTableMeasurer } from '../../../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
const FONT = { family: 'sans-serif', size: 14 };

describe('measureFolderLeaf label heading font (cepedu-19-namu934)', () => {
  it('sizes a `=` heading label line at the heading font', () => {
    const dim = measureFolderLeaf(
      { id: 'foo2', display: '= Creole heading', symbol: 'package' },
      FONT,
      measurer,
      undefined,
      undefined,
    );
    expect(dim.height).toBe(55);
  });

  it('keeps a plain label line at the base line height', () => {
    const dim = measureFolderLeaf(
      { id: 'foo1', display: 'text containing \\n description of foo', symbol: 'package' },
      FONT,
      measurer,
      undefined,
      undefined,
    );
    expect(dim.height).toBe(51);
  });
});
