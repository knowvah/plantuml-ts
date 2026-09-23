/**
 * cdd-B7FU-R3 (`ropera-76-jico895`): the class-diagram FontSize/FontStyle
 * `<style>` cascade — split out of `style-cascade-class.ts` (500-line cap),
 * a pure addition, not a move.
 *
 * `<style> class { FontSize N; FontStyle <tokens>; header { FontSize N;
 * FontStyle <tokens> } } }`: the PLAIN `CLASS_SNAMES` FontSize/FontStyle
 * feeds a member/field row's body font (`EntityImageClass.java:92-93,163`
 * — `entity.getBodier().getBody(..., getStyle(), null)`, `getStyle()`'s
 * signature at `:163`); the nested `header {}` sub-selector feeds the
 * classifier NAME's font independently (`EntityImageClassHeader.java
 * :93-101` — `styleHeader`, `HEADER_SNAMES`). Both paths build their
 * `FontConfiguration` the SAME way, `FontConfiguration.create(skinParam,
 * style, colors)` → `style.getUFont()` (`klimt/font/FontConfiguration.java
 * :213-219`, `style/Style.java:241-253`): `PName.FontSize` (default 14),
 * `PName.FontStyle.asFontFace()` for bold/italic.
 *
 * `resolveStyleCascade` on `HEADER_SNAMES` (`style-map-element.ts`) already
 * inherits a bare `class { FontStyle }` declaration when no `class {
 * header { FontStyle } } }` override exists — `HEADER_SNAMES` is a strict
 * superset of `CLASS_SNAMES`, so the SAME rule matches both queries and its
 * value is the "last match" for each independently. Both queries returning
 * the identical raw string is therefore this module's own signal that no
 * MORE SPECIFIC header declaration exists; the header cascade fields are
 * left `undefined` in that case rather than duplicating the plain value —
 * the caller (`class-layout-fonts.ts#resolveHeaderFont`) inherits it via
 * its own `?? attributeFont.bold/italic` fallback tier, mirroring
 * `classCascadeHeaderFontSize`'s identical "absent = inherit" contract
 * (`applyMaximumWidthOverrides` in the sibling file).
 *
 * `PName.FontStyle`'s value maps to bold/italic via `parseFontStyleFlags`
 * (`skinparam-key-handlers-shared.ts`) — independent booleans, not
 * mutually exclusive, matching `classTagCascadeEntry`'s own inline
 * equivalent for a `.tagname`-scoped `FontStyle` in the sibling file.
 */
import type { StyleMap } from './skinparam.js';
import { resolveStyleCascade } from './style-map-element.js';
import { parseFontStyleFlags } from './skinparam-key-handlers-shared.js';
import { CLASS_SNAMES, HEADER_SNAMES } from './style-cascade-class-snames.js';
import type { GraphCascadeOverride } from './style-cascade-class.js';

export function applyFontCascadeOverrides(styleMap: StyleMap, override: Partial<GraphCascadeOverride>): void {
  const fontSizeRaw = resolveStyleCascade(styleMap, CLASS_SNAMES, 'fontsize');
  if (fontSizeRaw !== undefined) {
    const n = Number(fontSizeRaw);
    if (Number.isFinite(n) && n > 0) override.classCascadeFontSize = n;
  }
  const fontStyleRaw = resolveStyleCascade(styleMap, CLASS_SNAMES, 'fontstyle');
  if (fontStyleRaw !== undefined) {
    const { bold, italic } = parseFontStyleFlags(fontStyleRaw);
    override.classCascadeFontBold = bold;
    override.classCascadeFontItalic = italic;
  }
  const headerFontStyleRaw = resolveStyleCascade(styleMap, HEADER_SNAMES, 'fontstyle');
  if (headerFontStyleRaw !== undefined && headerFontStyleRaw !== fontStyleRaw) {
    const { bold, italic } = parseFontStyleFlags(headerFontStyleRaw);
    override.classCascadeHeaderFontBold = bold;
    override.classCascadeHeaderFontItalic = italic;
  }
}
