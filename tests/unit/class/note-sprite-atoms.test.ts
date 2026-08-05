/**
 * A2s round 2, R2h — note text resolves `<$sprite>` atoms through the
 * diagram's sprite registry (rotisi-30-loge424's `note left : <$printer4>`).
 *
 * Pre-fix `measureNote` called the shared creole resolvers WITHOUT the
 * registry, so a sprite atom was dropped (rotisi's note node measured
 * 21x23px vs the jar's 36x25 = sprite 15x15 + Opale margins). The row
 * height counts the image atom's own height: `AtomImg`/`AtomSprite` have
 * `getStartingAltitude == 0`, the same bottom-align derivation as text
 * atoms, jar-confirmed by rotisi's note node height 0.347222in = 15 + 2*5.
 * @see ~/git/plantuml/.../klimt/creole/atom/AtomImg.java:242-244
 * @see ~/git/plantuml/.../klimt/creole/atom/AtomSprite.java:69-71
 */
import { describe, it, expect } from 'vitest';
import { measureNote } from '../../../src/diagrams/class/note-layout-measure.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { createSpriteRegistry, addSprite } from '../../../src/core/sprite-commands.js';
import { SpriteMonochrome } from '../../../src/core/klimt/sprite/SpriteMonochrome.js';

const measurer = new WidthTableMeasurer();

/** A 15x15 monochrome sprite — the same dims as rotisi-30's `$printer4`. */
function registryWith15x15(name: string): ReturnType<typeof createSpriteRegistry> {
  const registry = createSpriteRegistry();
  const sprite = new SpriteMonochrome(15, 15, 16);
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) sprite.setGray(x, y, (x + y) % 16);
  }
  addSprite(registry, name, sprite);
  return registry;
}

describe('R2h — measureNote threads the sprite registry into creole atoms', () => {
  it('a sprite-only note measures sprite + Opale margins (rotisi-30: 36x25px)', () => {
    const m = measureNote('<$p4>', defaultTheme, measurer, registryWith15x15('p4'));
    expect(m.width).toBeCloseTo(15 + 6 + 15, 4);
    expect(m.height).toBeCloseTo(15 + 2 * 5, 4);
    expect(m.lineAtoms[0]![0]).toMatchObject({ kind: 'image', width: 15, height: 15 });
  });

  it('a sprite inline with text adds the sprite width to the row', () => {
    const m = measureNote('<$p4> label', defaultTheme, measurer, registryWith15x15('p4'));
    const w = measurer.measure(' label', { family: defaultTheme.fontFamily, size: 13 }).width;
    expect(m.width).toBeCloseTo(15 + w + 21, 3);
    // Text (13, above the 10 floor) still exceeds the 15px sprite? No —
    // max(15, 13) = 15 drives the row.
    expect(m.height).toBeCloseTo(15 + 10, 4);
  });

  it('without a registry the sprite atom is still dropped (unchanged)', () => {
    const m = measureNote('<$p4>', defaultTheme, measurer);
    expect(m.width).toBeCloseTo(0 + 21, 4);
    expect(m.height).toBeCloseTo(13 + 10, 4);
  });
});
