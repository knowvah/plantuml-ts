/**
 * The plain (non-note, non-constraint-spot) MEASURED label arm of
 * `class-layout-edge-labels.ts#computeRelLabelAttrs` -- split out purely to
 * keep that file under the project's 500-line hook cap (cdd-T17, pushed
 * over by the role-label reservation doc comment). A pure move: neither
 * function's body changed, and `computeMeasuredLabelAttrs` was never
 * exported before this split (module-private in both files), so no
 * consumer's import path is affected except `class-layout-edge-labels.ts`
 * itself, which now imports it back. Same split rationale/precedent as that
 * file's own `wrapPlainTextLine` -> `class-edge-label-lines.ts` move.
 */
import type { StringMeasurer } from '../../core/measurer.js';
import type { LabelAttrs } from './class-layout-edge-labels.js';
import { applyVisibilityIcon, applyGuillemet, stripCreoleMarkup, resolveLineFont } from '../../core/edge-label-box.js';
import { resolveTextEscapes } from '../../core/text-escapes.js';
import { parseMagicArrowLabel, hasSeveralGuideLines, computeGuideLinesBox } from './class-magic-arrow.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import { scanLineForAtoms } from '../../core/creole-atoms.js';
import { resolveInlineAtom } from './class-member-atom-resolve.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';
import type { FontStyle } from '../../core/klimt/shape/UText.js';

/**
 * `SvekEdge.java:298-299`'s `create0(..., CreoleMode.SIMPLE_LINE, ...)`
 * resolves creole ATOM tokens even in single-line mode (`SIMPLE_LINE` only
 * suppresses block-level constructs -- bullets/tables/`\n`-driven wrapping
 * -- never atom scanning, `CreoleStripeSimpleParser`'s ONE `scanLine`
 * pipeline runs regardless of mode). A label that is ENTIRELY one
 * `<$sprite>` token therefore measures as the resolved sprite's own
 * declared box, not the literal `<$name>` glyphs -- `kexaba-26-kobu577`
 * (`sprite $pk [17x12/16z] ...`, `id:int(11)<$pk>` reserves 19x14 =
 * 17x12 + 2*marginLabel, `svek-1.dot`'s own `WIDTH="19" HEIGHT="14"`).
 * Reuses the SAME pixel-sprite resolver a member row's inline `<$name>`
 * already goes through (`class-member-atom-resolve.ts#resolveInlineAtom`)
 * rather than re-deriving sprite-to-PNG conversion here.
 *
 * Scoped to the raster (`'image'`-kind) sprite path only -- an
 * SVG-registered sprite's `'drawable'` decomposition has zero corpus reach
 * on an edge label (every sampled fixture with an SVG sprite places it on a
 * member row or a classifier symbol, never a relationship label) and is
 * left unhandled here, falling through to the plain-text path below.
 * `undefined` for a line carrying any text alongside the atom, more than
 * one atom, an unresolvable/unknown sprite name, or no registry at all.
 */
export function resolveLoneSpriteLabel(
  text: string,
  font: { family: string; size: number },
  sprites: SpriteRegistry | undefined,
): { href: string; width: number; height: number } | undefined {
  if (sprites === undefined) return undefined;
  const scan = scanLineForAtoms(text);
  if (scan.atoms.length !== 1 || scan.textWithoutAtoms.length > 0) return undefined;
  const atom = scan.atoms[0]!;
  if (atom.kind !== 'sprite') return undefined;
  const baseFont = { family: font.family, size: font.size, color: null, styles: new Set<FontStyle>() };
  const resolved = resolveInlineAtom(atom, baseFont, sprites, spriteDimsLookupFor(sprites));
  if (resolved === undefined || resolved.kind !== 'image') return undefined;
  return { href: resolved.href, width: resolved.width, height: resolved.height };
}

/** {@link computeMeasuredLabelAttrs}'s magic-arrow arm, factored out to keep
 *  that function's NLOC under the project's per-function cap -- resolves a
 *  leading `<size:N>` tag ({@link resolveLineFont}) then decodes escapes on
 *  the result. `undefined` for an absent/empty remaining text. Exported
 *  (cdd-T25) so `class-edge-label-attach.ts#attachMagicArrow` can resolve
 *  the SAME `<size:N>` override for the RENDERED ink -- this measurement
 *  arm and that render arm must never drift (one resolver, two call
 *  sites), matching `xamule-03-jeda376`'s own DOT-box-vs-ink split. */
export function resolveMagicArrowText(
  text: string | undefined,
  font: { family: string; size: number },
): { text: string; font: { family: string; size: number } } | undefined {
  if (text === undefined || text === '') return undefined;
  const resolved = resolveLineFont(text, font);
  return { text: resolveTextEscapes(resolved.text), font: resolved.font };
}

/** The plain (non-note, non-constraint-spot) measured label -- multi-line,
 *  magic-arrow, or a single plain string. Plain single-line now ports M4
 *  causes A+B+C ({@link applyVisibilityIcon}, {@link applyGuillemet},
 *  `core/edge-label-box.ts`); multi-line ports C, the D6 per-line
 *  guide-line-arrow branch, and (T4) a per-line creole-tag strip;
 *  single-line magic-arrow resolves a leading `<size:N>` tag and strips
 *  creole formatting on its remaining text via {@link resolveLineFont}
 *  (`xamule-03-jeda376`) -- still no guillemet rewrite on that arm (no
 *  fixture combines a magic-arrow token with `<<x>>`). `label` stays RAW:
 *  only width/height change. */
export function computeMeasuredLabelAttrs(
  label: string,
  font: { family: string; size: number },
  measurer: StringMeasurer,
  classAttributeIconSize?: number,
  // kexaba-26-kobu577: threaded through from `class-layout-edge-labels.ts
  // #computeRelLabelAttrs`'s own `noteCtx?.sprites` (the SAME registry
  // `computeNoteMergedLabelAttrs` already reads on the sibling branch) --
  // see {@link resolveLoneSpriteLabel}'s own doc comment.
  sprites?: SpriteRegistry,
): LabelAttrs {
  const { lines } = splitDisplayLines(label);
  if (lines.length > 1) {
    // D6 (`SvekEdge.java:290-297`): a multi-line label whose lines include a
    // leading/trailing `< `/`> `/` <`/` >` guide-line token takes the
    // PER-LINE arrow path (`Display.hasSeveralGuideLines`,
    // `klimt/creole/Display.java:715-740`) instead of the plain stacked-text
    // formula below -- see {@link hasSeveralGuideLines}/
    // {@link computeGuideLinesBox}'s own doc comments.
    if (hasSeveralGuideLines(lines)) {
      const box = computeGuideLinesBox(lines, font, measurer);
      return { label, labelWidth: box.width, labelHeight: box.height };
    }
    // M4 cause C applies to EVERY line, unconditionally
    // (`Display.manageGuillemet`'s loop body, `Display.java:413-419` --
    // no `first`-only gate on the guillemet call, unlike the visibility
    // strip). T4 (`vuresa-33-kumu160`): a real creole TextBlock upstream
    // RENDERS `<b>..</b>` as bold formatting rather than measuring the tag
    // as glyphs (`Display.java:413-419` runs at Display-construction time,
    // BEFORE the later `create()`/`create9()` creole render this port
    // stands in for via {@link stripCreoleMarkup}) -- so the strip runs
    // AFTER guillemet, mirroring that same construct-then-render order.
    // Bold contributes no width delta in deterministic mode either way:
    // `StringBounderFromWidthTable#calculateDimension` (`klimt/drawing/font
    // /StringBounderFromWidthTable.java:63-79`) derives width from `font
    // .getSize2D()` and a fixed per-codepoint table alone -- no branch on
    // `FontStyle`/bold/italic exists in that class -- so stop 10 does not
    // fire here.
    // Decode LAST, per line -- mirrors `StripeSimple.ts#decodeAtomEscapes`'s
    // own per-line-not-whole-string ordering (see that function's comment).
    const guillemetLines = lines.map(applyGuillemet).map(stripCreoleMarkup).map(resolveTextEscapes);
    const widths = guillemetLines.map((l) => measurer.measure(l, font).width);
    const lineHeight = measurer.measure(guillemetLines[0] ?? '', font).height;
    return { label, labelWidth: Math.max(...widths), labelHeight: lineHeight * lines.length };
  }
  const magic = parseMagicArrowLabel(label);
  if (magic !== undefined) {
    // A leading `<size:N>` tag on the remaining text rewrites the TEXT's
    // own font ({@link resolveLineFont}) -- the arrow glyph below stays at
    // the BASE `font`, matching `addMagicArrow`'s own font argument
    // (`SvekEdge.java:304`); see the comment on `font.size` below.
    const resolved = resolveMagicArrowText(magic.text, font);
    const m = resolved !== undefined ? measurer.measure(resolved.text, resolved.font) : { width: 0, height: 0 };
    // `TextBlockArrow2.calculateDimension` (`klimt/shape/TextBlockArrow2
    // .java:57,87`) returns `(size, size)` where `size` is the SAME font
    // passed to `addMagicArrow` (`SvekEdge.java:304`) -- `font.size` here,
    // NOT `ARROW_GLYPH_SIZE` (the draw-only `.80` ink triangle, `:64-65`,
    // which never enters a measurement), and NOT the resolved text's own
    // font size when a `<size:N>` tag runs it larger (`xamule-03-jeda376`:
    // arrow block stays 13, text resolves to 30). `mergeLR` sums width,
    // maxes height (`XDimension2D.java:108-112`). A bare token's
    // `marginLabel` skip lives in `class-layout-edge-labels.ts
    // #withLabelMargin`, not here.
    return { label, labelWidth: font.size + m.width, labelHeight: Math.max(font.size, m.height) };
  }
  return computeSingleLinePlainLabelAttrs(label, font, measurer, classAttributeIconSize, sprites);
}

/** {@link computeMeasuredLabelAttrs}'s trailing single-line, non-magic-arrow
 *  arm -- split out purely to keep that function's own NLOC under the
 *  project's per-function cap. */
function computeSingleLinePlainLabelAttrs(
  label: string,
  font: { family: string; size: number },
  measurer: StringMeasurer,
  classAttributeIconSize: number | undefined,
  sprites: SpriteRegistry | undefined,
): LabelAttrs {
  const vis = applyVisibilityIcon(label, classAttributeIconSize);
  // kexaba-26-kobu577: a label that is PURELY one `<$sprite>` atom sizes to
  // the resolved sprite's own declared box (`resolveLoneSpriteLabel`'s own
  // doc comment) -- checked BEFORE the guillemet/strip text path below,
  // which would otherwise measure the literal `<$name>` glyphs.
  const sprite = resolveLoneSpriteLabel(vis.text, font, sprites);
  if (sprite !== undefined) {
    return { label, labelWidth: sprite.width + vis.iconWidth, labelHeight: Math.max(sprite.height, vis.iconHeight) };
  }
  // M4 cause C: `<<x>>` -> `«x»` BEFORE measuring (`core/edge-label-box.ts
  // #applyGuillemet`, `Guillemet.java:78-88`) -- runs AFTER the visibility
  // strip, mirroring `Display.manageGuillemet`'s per-line order
  // (`Display.java:415-418`: strip first, guillemet second, same line).
  // rimeca-17-gice904: an inline formatting tag (`<u>`/`<color:..>`/...)
  // contributes NO width to a real creole TextBlock -- `stripCreoleMarkup`
  // runs BEFORE measuring here too, mirroring the multi-line branch above
  // (which already stripped; this single-line arm never did). Escape decode
  // runs LAST (`AtomText.java:120-133`) -- `nagega-30-poso418`.
  const m = measurer.measure(resolveTextEscapes(stripCreoleMarkup(applyGuillemet(vis.text))), font);
  return { label, labelWidth: m.width + vis.iconWidth, labelHeight: Math.max(m.height, vis.iconHeight) };
}
