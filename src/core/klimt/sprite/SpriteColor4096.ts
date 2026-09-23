import type { Sprite } from './Sprite.js';

/**
 * SpriteColor4096 — a rectangular grid of per-pixel RGB colour, decoded
 * from a `sprite $name [WxH/color] { ... }` body (`SpriteColorBuilder4096`,
 * the `net.sourceforge.plantuml.klimt.sprite` "4096-colour" sprite format).
 * The data half only — mirrors `SpriteMonochrome.ts`'s own "pixel grid +
 * get/set" scope split (that file's own doc comment): `toUImage`/
 * `asTextBlock` klimt drawing is NOT ported (this browser-safe port never
 * drives a `UGraphic` for a class-diagram atom; the raster half lives in
 * `sprite-raster.ts#spriteColor4096ToRgba`, the `spriteMonochromeAsLike`/
 * `spriteToRgba` sibling for this sprite kind).
 *
 * `color[y][x]` defaults to `0` (opaque black, `0x000000`) for every cell,
 * mirroring Java's `int[][]` zero-default-initialization EXACTLY —
 * `SpriteColorBuilder4096.buildSprite` (java :53-62) skips a cell whose
 * source row is shorter than the declared width (`if (col*2 >= line
 * .length()) continue;`), leaving that cell at its array default rather
 * than any transparent/unset sentinel. `gray`/`setGray` are ALSO ported
 * (faithful to the whole small upstream class, `SpriteColor.java`), even
 * though `SpriteColorBuilder4096.buildSprite` never calls `setGray` —
 * `getColor`'s own `-1` gray-fallback branch (upstream `toUImage`, NOT
 * ported here, see above) is the only consumer, so `setGray`'s effect is
 * observable only if a FUTURE caller mixes gray and colour cells on the
 * same sprite; current callers are 4096-colour-only.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteColor.java
 */
export class SpriteColor4096 implements Sprite {
  readonly width: number;
  readonly height: number;

  /** Row-major `color[y][x]`, an `0xRRGGBB` packed int or `-1` for "use
   *  the gray-level fallback instead" (`SpriteColor.java:88`, set by
   *  {@link setGray}). Zero-initialized, matching Java's array default —
   *  NOT `-1`, see this class's own doc comment. */
  private readonly color: number[][];
  /** Row-major `gray[y][x]`, a 0-15 level or `-1` once {@link setColor}
   *  has overwritten that cell (`SpriteColor.java:78`). */
  private readonly gray: number[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.color = [];
    this.gray = [];
    for (let y = 0; y < height; y++) {
      const colorRow: number[] = [];
      const grayRow: number[] = [];
      for (let x = 0; x < width; x++) {
        colorRow.push(0);
        grayRow.push(0);
      }
      this.color.push(colorRow);
      this.gray.push(grayRow);
    }
  }

  /** `SpriteColor#setGray` (java :67-79) — silently no-ops out of bounds;
   *  throws for an out-of-range level (matching upstream's
   *  `IllegalArgumentException`). Marks the cell's `color` as unset (`-1`). */
  setGray(x: number, y: number, level: number): void {
    if (x < 0 || x >= this.width) return;
    if (y < 0 || y >= this.height) return;
    if (level < 0 || level >= 16) throw new Error(`level=${level}`);
    this.gray[y]![x] = level;
    this.color[y]![x] = -1;
  }

  /** `SpriteColor#setColor` (java :81-90) — silently no-ops out of bounds.
   *  Marks the cell's `gray` as unset (`-1`). */
  setColor(x: number, y: number, rgb: number): void {
    if (x < 0 || x >= this.width) return;
    if (y < 0 || y >= this.height) return;
    this.gray[y]![x] = -1;
    this.color[y]![x] = rgb;
  }

  /** The raw packed `0xRRGGBB` colour at `(x, y)`, or `-1` when that cell
   *  was set via {@link setGray} instead (the `toUImage` gray-fallback
   *  sentinel, `SpriteColor.java:113`) — a future gray/colour tint reader
   *  reads {@link getGray} for that cell instead when this returns `-1`. */
  getColor(x: number, y: number): number {
    if (x < 0 || x >= this.width) throw new Error(`x=${x} width=${this.width}`);
    if (y < 0 || y >= this.height) throw new Error(`y=${y} height=${this.height}`);
    return this.color[y]![x]!;
  }

  /** The gray level (0-15) at `(x, y)` — meaningful only when
   *  {@link getColor} returns `-1` for the same cell. */
  getGray(x: number, y: number): number {
    if (x < 0 || x >= this.width) throw new Error(`x=${x} width=${this.width}`);
    if (y < 0 || y >= this.height) throw new Error(`y=${y} height=${this.height}`);
    return this.gray[y]![x]!;
  }
}
