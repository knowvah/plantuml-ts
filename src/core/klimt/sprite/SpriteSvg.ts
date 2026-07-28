/**
 * `SpriteSvg` — a sprite defined by an inline `<svg>…</svg>` element rather
 * than the encoded grey-level grid `SpriteMonochrome` carries.
 *
 * Upstream pairs `SpriteSvg` with `UImageSvg`, whose `getData(name)` is the
 * whole dimension story (`klimt/shape/UImageSvg.java:118-143`):
 *
 *   1. a `viewBox` wins outright — width is its THIRD number, height its
 *      FOURTH, each `Math.ceil`'d;
 *   2. otherwise the `width=`/`height=` attribute inside the `<svg …>` tag,
 *      read as leading digits only;
 *   3. otherwise it throws.
 *
 * The viewBox precedence is load-bearing for the vendored bundles: archimate
 * declares `width="19.995mm" height="19.928mm" … viewBox="0 0 19.995 19.928"`,
 * so the `mm` units never need interpreting — the viewBox supplies 20×20.
 * bootstrap declares a bare `width="16" height="16"` with no viewBox and
 * takes branch 2; tatori-66-kaci883's inline sprite declares only
 * `viewBox="0 0 16 16"` and takes branch 1.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteSvg.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/UImageSvg.java
 */

import type { Sprite } from './Sprite.js';

/** `viewBox[= "']+(n)[\s,]+(n)[\s,]+(n)[\s,]+(n)` (UImageSvg.java:114-115). */
const VIEWBOX_RE = new RegExp('viewBox[= "\']+([0-9.]+)[\\s,]+([0-9.]+)[\\s,]+([0-9.]+)[\\s,]+([0-9.]+)');

/** `(?i)<svg[^>]+<name>\W+(\d+)` (UImageSvg.java:135) — leading digits only,
 *  and only when the attribute sits inside the opening `<svg …>` tag. */
function attributeDim(svg: string, name: string): number | undefined {
  const m = new RegExp('<svg[^>]+' + name + '\\W+(\\d+)', 'i').exec(svg);
  return m === null ? undefined : Number.parseInt(m[1]!, 10);
}

/**
 * `UImageSvg#getData` — the viewBox branch first, then the attribute branch.
 * Upstream throws when neither matches; this port returns `undefined` so the
 * caller can decline to register rather than fail the whole diagram (an
 * unregistered name then "contributes nothing", the same rule
 * `StripeSimple.addSprite` already applies to an unknown sprite).
 */
export function svgDimension(svg: string, name: 'width' | 'height'): number | undefined {
  const box = VIEWBOX_RE.exec(svg);
  if (box !== null) {
    return Math.ceil(Number.parseFloat((name === 'width' ? box[3] : box[4])!));
  }
  return attributeDim(svg, name);
}

/** A registry entry backed by an inline SVG element. `svg` is the verbatim
 *  source, re-emitted at render time; `kind` discriminates it from
 *  `SpriteMonochrome`, whose grey-grid accessors it does NOT have. */
export class SpriteSvg implements Sprite {
  readonly kind = 'svg';
  readonly width: number;
  readonly height: number;

  constructor(
    readonly svg: string,
    width: number,
    height: number,
  ) {
    this.width = width;
    this.height = height;
  }

  /** Builds one from raw SVG source, or `undefined` when neither a viewBox
   *  nor width/height attributes give dimensions. */
  static from(svg: string): SpriteSvg | undefined {
    const width = svgDimension(svg, 'width');
    const height = svgDimension(svg, 'height');
    if (width === undefined || height === undefined) return undefined;
    return new SpriteSvg(svg, width, height);
  }
}

/** True when a registry entry is an SVG sprite (see `SpriteSvg.kind`). */
export function isSpriteSvg(sprite: Sprite | undefined): sprite is SpriteSvg {
  return (sprite as { kind?: string } | undefined)?.kind === 'svg';
}
