/**
 * class-edge-label-sprite-runs — a single-line relationship label that mixes
 * text with creole `<$sprite>` atoms (unwind2-S11, `c-edge`: `A --> B : e
 * <$foo>`).
 *
 * Upstream the label is `display.create0(fontConfiguration, ...,
 * CreoleMode.SIMPLE_LINE, ...)` (`SvekEdge.java:298-299`): a creole text
 * block whose `<$foo>` is an `AtomSprite` (`StripeSimple.java:229`) sized
 * into the line by `Sea` and drawn as its PNG. This port's plain label path
 * measures one stripped string and draws one `<text>`, so it measured the
 * literal `<$foo>` glyphs and drew them; a label that is ONLY a sprite
 * already has its own arm (`class-edge-label-measure.ts
 * #resolveLoneSpriteLabel`). This module is the text+sprite arm: the line's
 * atoms in order (the SAME `buildLineAtoms` lexer the cluster title uses,
 * `class-namespace-title-runs.ts#namespaceTitleRuns`), each text atom one
 * `<text>`, each sprite one `<image>` on the line bottom (the jar's
 * `c-edge`: text baseline 96.111, sprite 87..99, line bottom = baseline +
 * descent).
 *
 * Scoped to labels whose text atoms all keep the base font (no `<b>`,
 * `<color>`, `<size>`, url): a styled run keeps the existing stripped path,
 * which models those separately (`renderer-edge-label.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:288-299
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { buildLineAtoms } from '../../core/klimt/creole/legacy/StripeSimple.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { manageGuillemet } from '../../core/text/Guillemet.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';
import type { SpriteTint } from '../../core/klimt/sprite/sprite-tint.js';
import { resolveInlineAtom } from './class-member-atom-resolve.js';

/** One run of a mixed label, in draw order. `dy` (images only) is the
 *  image top relative to the label baseline. */
export type EdgeLabelRun =
  | { readonly kind: 'text'; readonly text: string; readonly width: number }
  | {
      readonly kind: 'image';
      readonly href: string;
      readonly width: number;
      readonly height: number;
      readonly dy: number;
      readonly tint?: SpriteTint;
    };

/** The resolved runs plus the line box `Sea` gives them. */
export interface EdgeLabelRuns {
  readonly runs: readonly EdgeLabelRun[];
  readonly width: number;
  readonly height: number;
  /** Label baseline below the line top: `height - descent`. */
  readonly baseline: number;
}

function baseFontConfiguration(font: FontSpec): FontConfiguration {
  return { family: font.family, size: font.size, color: null, styles: new Set() };
}

/** A text atom drawn in the label's own base font: same size, no style,
 *  colour or link (this module's scope, module doc). */
function isPlainText(atom: { font: FontConfiguration; url?: unknown }, font: FontSpec): boolean {
  return (
    atom.url === undefined && atom.font.size === font.size && atom.font.styles.size === 0 && atom.font.color == null
  );
}

/**
 * The text+sprite runs of `text`, or `undefined` when the label has no
 * resolvable sprite, no text beside it, or a styled run (module doc).
 * Widths are each atom's own (`AtomText#getWidth` keeps a trailing space;
 * the sprite's scaled box, `CommandCreoleSprite.java:82`); the line is as
 * tall as its tallest atom, the baseline `descent` above its bottom.
 */
export function resolveSpriteLabelRuns(
  text: string,
  font: FontSpec,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
): EdgeLabelRuns | undefined {
  if (sprites === undefined) return undefined;
  const base = baseFontConfiguration(font);
  const dims = spriteDimsLookupFor(sprites);
  const runs: EdgeLabelRun[] = [];
  let textHeight = 0;
  for (const atom of buildLineAtoms(manageGuillemet(text), base, CreoleMode.SIMPLE_LINE).atoms) {
    if (atom.kind === 'text') {
      if (!isPlainText(atom, font)) return undefined;
      const m = measurer.measure(atom.text, font);
      textHeight = Math.max(textHeight, m.height);
      runs.push({ kind: 'text', text: atom.text, width: m.width });
      continue;
    }
    if (atom.kind !== 'inline') return undefined;
    const img = resolveInlineAtom(atom.atom, base, sprites, dims);
    if (img === undefined || img.kind !== 'image') return undefined;
    runs.push({ kind: 'image', href: img.href, width: img.width, height: img.height, dy: 0, ...tintOf(img) });
  }
  if (!runs.some((r) => r.kind === 'text') || !runs.some((r) => r.kind === 'image')) return undefined;
  return placeRuns(runs, textHeight, measurer.getDescent(font, text));
}

function tintOf(img: { readonly tint?: SpriteTint }): { tint?: SpriteTint } {
  return img.tint === undefined ? {} : { tint: img.tint };
}

/** `Sea`'s line box: the tallest atom; every image sits on the bottom. */
/** The label anchor for `mixed` centred on `center`: the reserved box's
 *  corner exactly as `class-edge-label-anchor.ts#portLabelAnchor` takes it
 *  (`center - trunc(dim) / 2`, `SvekEdge.java:750-767`), the baseline
 *  {@link EdgeLabelRuns.baseline} below its top. */
export function spriteRunsLabelAnchor(
  mixed: EdgeLabelRuns,
  center: { readonly x: number; readonly y: number },
): { text: string; x: number; y: number; width: number; runs: readonly EdgeLabelRun[] } {
  const top = center.y - Math.trunc(mixed.height) / 2;
  return {
    text: mixed.runs.map((r) => (r.kind === 'text' ? r.text : '')).join(''),
    x: center.x - Math.trunc(mixed.width) / 2,
    y: top + mixed.baseline,
    width: mixed.width,
    runs: mixed.runs,
  };
}

function placeRuns(runs: readonly EdgeLabelRun[], textHeight: number, descent: number): EdgeLabelRuns {
  const height = Math.max(textHeight, ...runs.map((r) => (r.kind === 'image' ? r.height : 0)));
  const baseline = height - descent;
  const placed = runs.map((r) => (r.kind === 'image' ? { ...r, dy: descent - r.height } : r));
  return { runs: placed, width: runs.reduce((w, r) => w + r.width, 0), height, baseline };
}
