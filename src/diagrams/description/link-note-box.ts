/**
 * The `note on link` operand `computeMergedLabelBox` merges into a
 * description-engine edge label -- `EntityImageNoteLink`'s dimension
 * (`svek/SvekEdge.java:309-310`, `new EntityImageNoteLink(note.getDisplay(),
 * note.getColors(), skinParam, link.getStyleBuilder())`). Thin description-
 * side adapter over the shared core port (`shared-seam-extraction` T6, D1)
 * -- kept as a wrapper (not deleted) because its importer,
 * `link-edge-attrs.ts:18`, is outside this task's write-set (T1's).
 *
 * Two operands, one shared padding rule:
 *
 * - **Pure text** comes from {@link buildNoteBody} (`leaf-sizing.ts`), this
 *   engine's REAL creole `TextBlock` for a note body -- the same
 *   `BodyFactory.create3`/`BodyEnhanced2` route `EntityImageNote.java:116-117`
 *   takes, and the same object the description RENDERER draws from
 *   (`renderer-entity.ts`, `planning/sizer-renderer-parity.md`). It carries
 *   NO outer margin of its own: `measureNote` (`leaf-sizing.ts`) adds
 *   `NOTE_MARGIN_H`/`NOTE_MARGIN_V` (Opale's 6+15 / 2*5) to this block's
 *   dimension AFTERWARDS, so the block returned here is the un-margined
 *   operand the core port's `pureText` strategy expects -- no double-count.
 * - **Padding** is `core/svek/image/EntityImageNoteLink.ts#measureLinkNoteDim`,
 *   whose default (Opale's 6/15/5 plus `ComponentRoseNote`'s constructor
 *   `paddingX`/`paddingY` a second time -- see that module's own doc
 *   comment for the full derivation) is applied via `roseNoteDim` even when
 *   a `pureText` strategy overrides the pure-measurement step, as it does
 *   here. It is `pure + 31` wide and `pure + 20` tall, NOT `measureNote`'s
 *   `pure + 21` / `pure + 10`.
 *
 * Sprite/`<img>` atoms are not resolved here (`buildNoteBody`'s
 * `atomImageResolverFor` is left unset, exactly as `renderer-entity.ts`'s
 * plain-note draw path does when no resolver is available): no corpus
 * `note on link` fixture carries one. If one surfaces, the resolver is a
 * parameter away -- the seam is `NoteBodyOpts`.
 */
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { resolveElementFontSize } from '../../core/theme-element-resolve.js';
import type { RoseNoteDim } from '../../core/rose-note-dim.js';
import { measureLinkNoteDim as coreMeasureLinkNoteDim } from '../../core/svek/image/EntityImageNoteLink.js';
import { buildNoteBody } from './leaf-sizing.js';
import { NOTE_FONT_SIZE } from './leaf-sizing-consts.js';

/**
 * The `note` element's font, resolved the way `renderer-entity.ts#noteFont`
 * resolves it: a per-element `FontSize` override if the style cascade set
 * one, else `FontParam.NOTE`'s own 13 -- NEVER `theme.fontSize` (14), which
 * would silently widen every link note by a point (`leaf-sizing.ts
 * #measureNote`'s ADR-4 trap). `color` is unread by a measurement and
 * `styles` is empty, matching `measureNote`'s own `NOTE_FONT_STYLES`.
 */
function linkNoteFont(theme: Theme): FontConfiguration {
  return {
    family: theme.fontFamily,
    size: resolveElementFontSize(theme, 'note', 'title') ?? NOTE_FONT_SIZE,
    color: null,
    styles: new Set(),
  };
}

/** `text` is the RAW `DescriptiveLink.linkNote` value -- creole markup
 *  included, since `buildNoteBody` is a real creole block and handles it. */
export function measureLinkNoteDim(
  text: string,
  theme: Theme,
  measurer: StringMeasurer,
): RoseNoteDim {
  const font = linkNoteFont(theme);
  return coreMeasureLinkNoteDim(text, { family: font.family }, measurer, (t, m) => {
    const block = buildNoteBody(t, font);
    const pure = block.calculateDimension(new MeasurerStringBounder(m));
    return { width: pure.getWidth(), height: pure.getHeight() };
  });
}
