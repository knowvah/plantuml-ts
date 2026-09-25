/**
 * `resolveNoteBackground` -- a note's own fill-color cascade, split out of
 * `renderer-note.ts` purely to keep that file under this project's 500-line
 * cap (T26; mirrors that file's own `renderBulletAtom` split precedent, same
 * reason). Pure move, zero behavior change.
 */
import type { ScaledTheme } from './class-scale-geo.js';
import type { Paint } from '../../core/paint.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';
import { splitStereotypeStyleTags } from './class-stereotype.js';
import { cleanStereotypeToken } from '../../core/style-map-element.js';

/**
 * G2 N34: jar's `EntityImageNote` ctor default (`ColorParam.noteBackground`,
 * `plantuml.skin`) -- the fallback when NEITHER the note's own explicit
 * `#color` NOR a `<style> note { BackgroundColor ... }` bucket applies.
 */
const NOTE_FILL = '#FEFFDD';

/**
 * G2 N34: a note's own fill color, cascading explicit `#color` override
 * (`ClassNote.color`, highest precedence -- `EntityImageNote.java`'s ctor:
 * `entity.getColors().getColor(BACK)` wins outright) -> the `<style> note
 * { BackgroundColor ... } </style>` bucket default -> the hardcoded
 * `NOTE_FILL`. Reads `theme.colors.elements.note` directly rather than via
 * `resolveElementPaint` (`theme.ts`) -- that helper's own generic "no
 * bucket" fallback is `nodeBackground` (`#F1F1F1`, the class-box default),
 * NOT jar's real note default (`ColorParam.noteBackground`, `#FEFFDD`) --
 * using it here would silently wrongize every note with no override. The
 * nested `.tagname` stereotype-cascade sub-selector (`note { .faint { ...
 * } }`) is a SEPARATE, deeper mechanism -- surveyed, not built (ledger).
 */
export function resolveNoteBackground(
  color: string | undefined,
  theme: ScaledTheme,
  // G2 N37: the note's OWN `<<stereotype>>` (`ClassNote.stereotype`) --
  // resolves the `.tagname` `<style>` cascade (`note { .faint {
  // BackgroundColor red } } }`) between the explicit `#color` override and
  // the bare `note {}` bucket default. Optional/trailing so every
  // pre-existing call site (no stereotype) is behavior-unchanged.
  stereotype?: string,
): Paint {
  const override = resolveBareOrBackColor(color);
  if (override !== undefined) return resolveColorToSvgHex(override);
  const tagBackground = resolveNoteTagBackground(theme, stereotype);
  if (tagBackground !== undefined) return tagBackground;
  const bucket = theme.colors.elements?.['note']?.background;
  if (bucket === undefined) return NOTE_FILL;
  // A `<style> note { BackgroundColor red }` bucket value is a raw
  // `parseColor` result (`core/paint.ts`) -- a plain color NAME still needs
  // HColorSet resolution (`resolveColorToSvgHex`, same as the explicit-
  // override branch above); a Gradient object is already a resolved `Paint`
  // and passes through unchanged (`core/svg.ts#resolvePaint` handles it).
  return typeof bucket === 'string' ? resolveColorToSvgHex(bucket) : bucket;
}

/**
 * G2 N37: `theme.colors.noteTagCascade` lookup, resolving the note's own
 * (possibly multi-label) stereotype the SAME way {@link
 * splitStereotypeStyleTags} splits a classifier's -- a note's stereotype
 * blob follows the identical `<<A>><<B>>` stacking grammar. Returns the
 * FIRST matching label's background (already a resolved `Paint` from
 * `computeNoteStyleTagCascade`'s `parseColor` call), or `undefined`.
 */
function resolveNoteTagBackground(theme: ScaledTheme, stereotype: string | undefined): Paint | undefined {
  if (stereotype === undefined) return undefined;
  const cascade = theme.colors.noteTagCascade;
  if (cascade === undefined) return undefined;
  for (const label of splitStereotypeStyleTags(stereotype)) {
    const bg = cascade[cleanStereotypeToken(label)]?.background;
    if (bg !== undefined) return bg;
  }
  return undefined;
}
