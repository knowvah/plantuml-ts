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

/** {@link computeMeasuredLabelAttrs}'s magic-arrow arm, factored out to keep
 *  that function's NLOC under the project's per-function cap -- resolves a
 *  leading `<size:N>` tag ({@link resolveLineFont}) then decodes escapes on
 *  the result. `undefined` for an absent/empty remaining text. */
function resolveMagicArrowText(
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
  const vis = applyVisibilityIcon(label, classAttributeIconSize);
  // M4 cause C: `<<x>>` -> `«x»` BEFORE measuring (`core/edge-label-box.ts
  // #applyGuillemet`, `Guillemet.java:78-88`) -- runs AFTER the visibility
  // strip, mirroring `Display.manageGuillemet`'s per-line order
  // (`Display.java:415-418`: strip first, guillemet second, same line).
  // Escape decode runs LAST (`AtomText.java:120-133`) -- `nagega-30-poso418`.
  const m = measurer.measure(resolveTextEscapes(applyGuillemet(vis.text)), font);
  return { label, labelWidth: m.width + vis.iconWidth, labelHeight: Math.max(m.height, vis.iconHeight) };
}
