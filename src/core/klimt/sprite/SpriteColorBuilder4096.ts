/**
 * SpriteColorBuilder4096 — decodes a `sprite $name [WxH/color] { ... }`
 * body into a {@link SpriteColor4096}. Ported: `buildSprite(List<String>)`
 * only (java :50-65) — `encodeImage` (java :67-83, the reverse direction,
 * authoring a `/color` sprite FROM a raster image) has no caller on this
 * port's read-a-`.puml`-body path, see `ColorPalette4096.ts`'s own doc
 * comment for the identical scope note.
 *
 * The DECLARED `[WxH/color]` header dimensions are IGNORED here, exactly
 * as upstream ignores them (`buildSprite`'s own `new SpriteColor(strings
 * .get(0).length() / 2, strings.size())` — width/height come from the
 * BODY: half the first row's character count, and the row count).
 * Jar-verified against `malara-55-moce209`'s `sprite $demo [13x26/color]`:
 * the declared `13x26` is a mismatch with the body's real 26-column
 * (52 chars / 2) x 24-row shape — the body wins, matching upstream.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteColorBuilder4096.java:50-65
 */
import { SpriteColor4096 } from './SpriteColor4096.js';
import { colorForCode4096 } from './ColorPalette4096.js';

/**
 * `SpriteColorBuilder4096#buildSprite` (java :50-65): `result.getWidth()`
 * = `strings.get(0).length() / 2` (the FIRST row's own half-length, not a
 * per-row recompute — a row shorter than the first is simply
 * under-populated, see the `col*2 >= line.length()` skip below, matching
 * upstream's own `continue` verbatim). `result.getHeight()` =
 * `strings.size()`. Each cell's 2-char code (`line.substring(col*2, col*2
 * +2)`) decodes through {@link colorForCode4096}; an out-of-palette code
 * (`getColorFor` returning `null` upstream, `NullPointerException` waiting
 * to happen at `rgb.getRGB()` — never actually hit by any known sprite
 * body) is treated as "leave this cell at its zero-initialized default"
 * here instead, a defensive, honest divergence from upstream's own latent
 * NPE risk (never exercised by `malara-55-moce209`, whose every code is a
 * valid palette entry).
 */
export function buildSpriteColor4096(bodyLines: readonly string[]): SpriteColor4096 {
  const firstRow = bodyLines[0] ?? '';
  const width = Math.floor(firstRow.length / 2);
  const height = bodyLines.length;
  const result = new SpriteColor4096(width, height);
  for (let col = 0; col < width; col++) {
    for (let line = 0; line < height; line++) {
      const row = bodyLines[line] ?? '';
      if (col * 2 >= row.length) continue;
      const encodedColor = row.substring(col * 2, col * 2 + 2);
      const rgb = colorForCode4096(encodedColor);
      if (rgb === undefined) continue;
      result.setColor(col, line, (rgb.r << 16) | (rgb.g << 8) | rgb.b);
    }
  }
  return result;
}
