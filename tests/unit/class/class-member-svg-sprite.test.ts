/**
 * C-3/C-4 (cdd3-T23, bidusa-22-jutu505 / ruliki-78-biji661): an SVG-backed
 * `<$sprite>` member-row atom -- `class-member-atom-resolve.ts#resolveSpriteAtom`'s
 * new `getSpriteSvg` branch, `resolveMemberAtoms`'s Sea participation (the
 * 'drawable' kind is NOT excluded from `seaEntries` the way 'image' is), and
 * `class-member-sprite-render.ts#renderMemberRowDrawable`'s fast-path
 * (`fore === back`) primitive-to-`<path>` conversion.
 *
 * `archimate/network.svg` (bidusa's own `sprite Netw jar:archimate/network`)
 * decomposes to exactly ONE `UPath` primitive with no `fill=`/`stroke=` of
 * its own (`assets/sprites/archimate/network.svg` has neither attribute on
 * its `<path>`), so `SvgNanoParser`'s `applyFillAndStroke` resolves BOTH
 * fore and back to the SAME forced/ambient colour -- `DriverPathSvg.java`'s
 * flat-fill fast path, jar-verified against the cached golden:
 * `<path d="M20.975,77.278 ..." fill="#AA0"/>`, no `stroke`/`style` at all.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverPathSvg.java
 */
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { createSpriteRegistry, addSprite } from '../../../src/core/sprite-commands.js';
import { SpriteSvg } from '../../../src/core/klimt/sprite/SpriteSvg.js';
import { getSpriteSvg, spriteDimsLookupFor } from '../../../src/core/sprite-registry.js';
import type { SpriteAtomToken } from '../../../src/core/creole-atoms.js';
import { resolveSvgSpriteAtom } from '../../../src/core/creole-atoms-image-resolver.js';
import {
  buildMemberAtoms,
  memberBaseFont,
  resolveMemberAtoms,
} from '../../../src/diagrams/class/class-member-creole.js';
import { renderMemberRowDrawable } from '../../../src/diagrams/class/class-member-sprite-render.js';

const measurer = new WidthTableMeasurer();
const FONT = memberBaseFont({ family: 'sans-serif', size: 14 }, {});

/** A minimal one-`<path>` SVG sprite, 20x20 declared box, no `fill=`/
 *  `stroke=` -- structurally identical to `archimate/network.svg`'s own
 *  shape (a plain outline path, size-agnostic content since only the
 *  declared box and the flat-fill fast path are under test here). */
function registryWithNetworkLikeSprite(name: string): ReturnType<typeof createSpriteRegistry> {
  const registry = createSpriteRegistry();
  const svg =
    '<svg width="20" height="20" viewBox="0 0 20 20"><path d="M2,2 L18,2 L18,18 Z" stroke-linecap="round"/></svg>';
  const sprite = SpriteSvg.from(svg);
  if (sprite === undefined) throw new Error('test fixture SVG failed to parse');
  addSprite(registry, name, sprite);
  return registry;
}

describe('C-4 — resolveMemberAtoms resolves a registered SVG sprite to a drawable atom', () => {
  it('produces one drawable atom with the declared (scaled) box, forced-colour-tinted', () => {
    const sprites = registryWithNetworkLikeSprite('Netw');
    const atoms = buildMemberAtoms('<$Netw,color=blue> text', FONT);
    const build = resolveMemberAtoms(atoms, FONT, measurer, sprites);
    const drawable = build.atoms.find((a) => a.kind === 'drawable');
    expect(drawable).toBeDefined();
    if (drawable?.kind !== 'drawable') throw new Error('unreachable');
    // 20 native * 14/13 (CommandCreoleSprite's fc.getSize2D()/13.0 factor).
    expect(drawable.width).toBeCloseTo((20 * 14) / 13, 4);
    expect(drawable.height).toBeCloseTo((20 * 14) / 13, 4);
    expect(drawable.primitives.length).toBe(1);
  });

  it('the fast-path primitive draws fill-only, no stroke (DriverPathSvg.java flat-fill branch)', () => {
    const sprites = registryWithNetworkLikeSprite('Netw');
    const atoms = buildMemberAtoms('<$Netw,color=blue> text', FONT);
    const build = resolveMemberAtoms(atoms, FONT, measurer, sprites);
    const drawable = build.atoms.find((a) => a.kind === 'drawable');
    if (drawable?.kind !== 'drawable') throw new Error('unreachable');
    const svg = renderMemberRowDrawable(drawable.primitives, 0, 0);
    expect(svg).toContain('fill="#00F"');
    expect(svg).not.toContain('stroke=');
  });

  it(
    'bidusa-22-jutu505: a row-dominating drawable atom gives the shared text atom a ' +
      "Sea dy of +7.538 (jar text/@y 89.427 vs the row's own 81.889 baseline)",
    () => {
      // A 21.538px-tall drawable (bidusa's real `<$Netw>` scaled box) sharing
      // a row with 14pt text -- `resolveMemberAtoms`'s `seaEntries` filter
      // only excludes 'image', so this 'drawable' atom's height drives
      // `maxSpan`, exactly like bidusa's real row.
      const sprites = registryWithNetworkLikeSprite('Netw');
      const atoms = buildMemberAtoms('<$Netw,color=blue> Not working with archimate', FONT);
      const build = resolveMemberAtoms(atoms, FONT, measurer, sprites);
      const drawable = build.atoms.find((a) => a.kind === 'drawable');
      const text = build.atoms.find((a) => a.kind === 'text');
      if (drawable?.kind !== 'drawable' || text?.kind !== 'text') throw new Error('unreachable');
      // reference = baseFont.size - descent(baseFont, '') = 14 - 3.1111 = 10.8889.
      expect(drawable.dy).toBeCloseTo(-10.8889, 3);
      expect(text.dy).toBeCloseTo(7.538, 2);
    },
  );
});

describe('resolveSvgSpriteAtom always yields a drawable atom (code-quality finding 12)', () => {
  it('returns kind drawable with the declared box, never an image or undefined', () => {
    const sprites = registryWithNetworkLikeSprite('Netw');
    const sprite: SpriteAtomToken = { kind: 'sprite', name: 'Netw', scale: 1 };
    const svg = getSpriteSvg(sprites, 'Netw');
    if (svg === undefined) throw new Error('test fixture sprite is not SVG-backed');
    const resolved = resolveSvgSpriteAtom(sprite, svg.svg, spriteDimsLookupFor(sprites), FONT);
    expect(resolved.kind).toBe('drawable');
    expect(resolved.primitives.length).toBe(1);
    expect(resolved.width).toBeCloseTo((20 * 14) / 13, 4);
    expect(resolved.height).toBeCloseTo((20 * 14) / 13, 4);
  });
});
