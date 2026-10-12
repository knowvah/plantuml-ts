/**
 * cdd8 T3b: the `ISkinSimple` the ELK label block hands `CreoleParser`. Each member is `SkinParam.java`'s
 * default for an unconfigured diagram.
 */
import { describe, expect, it, vi } from 'vitest';
import { MONOSPACED } from '../../../src/core/klimt/creole/Parser.js';
import { GUILLEMET_DEFAULT } from '../../../src/core/text/Guillemet.js';

vi.mock('../../../src/core/nested-diagram-registry.js', () => ({ getNestedDiagramRenderer: () => undefined }));

const { createSpriteRegistry } = await import('../../../src/core/sprite-registry.js');
const { labelSkinSimple, nestedRenderer } = await import('../../../src/diagrams/description/description-elk-label.js');

const FONT = { family: 'sans-serif', size: 13, color: '#000000', styles: new Set<never>() };

describe('labelSkinSimple (SkinParam.java defaults)', () => {
  const skin = labelSkinSimple(FONT, undefined);

  it('answers the unconfigured defaults', () => {
    expect(skin.guillemet()).toBe(GUILLEMET_DEFAULT);
    expect(skin.getTabSize()).toBe(8);
    expect(skin.getDpi()).toBe(96);
    expect(skin.getMonospacedFamily()).toBe(MONOSPACED);
    expect(skin.getFromMd5('x')).toBeNull();
    expect(skin.transformStringForSizeHack('abc')).toBe('abc');
    expect(skin.getValue('anything')).toBeNull();
    expect(skin.values().size).toBe(0);
    expect(skin.getPadding().getTop()).toBe(0);
    expect(skin.copyAllFrom(new Map())).toBeUndefined();
    expect(skin.getPragma()).toBe(skin.getPragma());
  });

  it('has no sprite without a registry, and looks one up in a registry', () => {
    expect(skin.getSprite('s')).toBeNull();
    const registry = createSpriteRegistry();
    expect(labelSkinSimple(FONT, registry).getSprite('missing')).toBeNull();
  });

  it('builds the creole sheet parser for a font', () => {
    expect(skin.sheet(FONT, 'LEFT', 'FULL')).toBeDefined();
  });
});

describe('nestedRenderer without a registered renderer', () => {
  it('fails with a message naming the cause when a {{ }} block is rendered', () => {
    expect(() => (nestedRenderer().render as (...a: unknown[]) => unknown)('{{ }}', undefined, undefined)).toThrow(
      'description ELK: no nested-diagram renderer is registered',
    );
  });
});
