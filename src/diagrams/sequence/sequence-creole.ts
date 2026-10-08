/**
 * sequence-creole.ts — routes ONE sequence display line through the shared
 * creole atom engine (`core/klimt/creole/`) instead of drawing it as a single
 * plain `<text>`, producing the placed, measured `TextRun[]` the sequence
 * geometry already carries.
 *
 * ## Upstream mirror
 *
 * Every label a sequence component draws is built by one constructor:
 *
 * ```java
 * final FontConfiguration fc = getFontConfiguration();
 * ...
 * textBlock = display.create0(fc, horizontalAlignment, skinParam, maxMessageSize,
 *         CreoleMode.FULL, fontForStereotype, htmlColorForStereotype,
 *         padding.getLeft(), padding.getRight());
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractTextualComponent.java:80-92
 *
 * `create0` is `Display` -> `Creole` -> `Stripe` -> `Atom`: one `Atom` per
 * styled run, and `DriverTextSvg#draw` emits ONE `<text>` for each, advancing
 * x by the run's own measured width. There is no `<tspan>` anywhere on that
 * path (jar-verified, `object/linazi-45-gevo553`). So the shape this module
 * produces — a flat, left-to-right array of independently styled, measured
 * runs — is upstream's own emitted shape, not an approximation of it.
 *
 * ## Why the engine is reused rather than re-ported (D1, stop condition 8)
 *
 * `Display.create0` -> `TextBlock` -> `UGraphic` is the literal port, and it
 * is rejected: a `TextBlock`'s contract is `drawU(ug: UGraphic)`, and this
 * engine renders SVG strings through `core/svg.ts`, not through `UGraphic`.
 * Adopting `UGraphic` here would bypass the `sequenceText` seam and the
 * carried-metrics rule (D5) for no output difference. `core/creole.ts
 * #parseCreole` is rejected too: its `CreoleSpan` carries no url and no atoms.
 *
 * What is left is what `class` already did for the same reason, with the same
 * charter: a diagram-local ADAPTER over the SHARED atom primitives
 * (`classifyStripeLine` + `buildLineAtoms`, measured through
 * `core/creole-atoms-measure.ts`). `class-member-creole.ts` is that adapter
 * for member rows; this is it for sequence labels. Nothing under
 * `core/klimt/creole/` is modified, forked, or duplicated.
 *
 * `CreoleMode.FULL` per `AbstractTextualComponent.java:90` (D2). It differs
 * from `SIMPLE_LINE` only by the `*`-bullet and `#`-heading patterns
 * (`CreoleStripeSimpleParser.java:119-147`, both gated on FULL), neither of
 * which this port has ported for either mode — so the mode costs nothing
 * today and is recorded so that whoever ports them knows sequence wants them.
 *
 * ## Measurement identity — the property C2-C6 depend on
 *
 * For a line with NO creole markup, `classifyStripeLine` returns `{type:
 * 'NORMAL', content: line}` (the untouched input) and `buildStripeAtoms`
 * accumulates every unmatched character into one `pending` run flushed at
 * EOL (`StripeSimple.ts#StripeAtomBuilder#modifyStripe`). The result is
 * exactly ONE `'text'` atom carrying the original string at the original
 * font, so {@link sequenceCreoleRuns} measures `measurer.measure(line, spec)`
 * — byte-identical to the raw call each C2-C6 cutover replaces. That identity
 * is what makes those cutovers zero-diff, and it is pinned by this module's
 * own test rather than assumed.
 *
 * ## Named remainders
 *
 * A line holding a non-`'text'`, non-`'latex'` atom —
 * `<img>`/`<$sprite>`/`<&openiconic>` (`'inline'`), `<:emoji:>` — is left
 * WHOLLY literal, exactly as
 * this engine rendered it before the seam existed. A `TextRun` is a `<text>`
 * and an image is an `<image>` that sequence geometry has nowhere to put yet;
 * emitting no run for the atom would drop an ELEMENT and short-circuit the
 * comparator above everything else in the diagram, and `InlineAtomToken` keeps
 * no source string to rebuild a per-atom literal from. See the guard in
 * {@link sequenceCreoleRuns} for the measured case. Giving those atoms real
 * sequence geometry needs a new geo kind and a renderer branch.
 *
 * Raster `<img>`/`<$sprite>` LEFT that set for any caller passing a
 * {@link SequenceAtomContext} (cdd7 T1f: the participant head; unwind2-S10:
 * message and note labels): they
 * resolve through the shared `makeAtomImageResolverFor` and ride
 * `TextRun.image` exactly as `'latex'` does. What stays literal is vector
 * ink — OpenIconic, SVG sprites, emoji — whose primitives `TextRun` has no
 * field for, and every `'inline'` atom on a context-less caller (frame,
 * divider, delay, box labels).
 *
 * `<math>`/`<latex>` LEFT that set: a `'latex'` atom resolves to a measured,
 * drawable image through `core/latex.ts#renderLatexAsImage` — the one
 * renderer `AtomMath.ts` and the description engine already go through — so
 * {@link latexAtomRun} gives it real geometry and `TextRun.image` carries it
 * to `sequence-text.ts`. What sequence does NOT yet do is grow the label
 * block around a taller-than-a-text-line image: `text-block-geo.ts
 * #messageLabelBlock` reserves `rows * lineHeight`, where upstream reserves
 * the text block's own `calculateDimension().getHeight()`
 * (`AbstractTextualComponent.java:110-114`). Recorded as a residual, not a
 * decision — it is inert for every fixture whose atoms are all text.
 *
 * A `HORIZONTAL_LINE` line (a bare `----`/`====`/`....`) yields no atoms at
 * all upstream — it becomes a `CreoleHorizontalLine` stripe, a drawn rule.
 * Sequence has no rule geometry either, so the line stays the literal text it
 * renders as today (the same fallback `class-member-creole.ts#buildMemberAtoms`
 * makes, for the same reason): a remainder loses a rule, never a string.
 */

import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { buildLineAtoms } from '../../core/klimt/creole/legacy/StripeSimple.js';
import { atomFontSpec, textAtomRuns } from './sequence-creole-text-atom.js';
import { CharHidder } from '../../core/utils/CharHidder.js';
import { manageGuillemet } from '../../core/text/Guillemet.js';
import type { TextRun } from './text-block-geo.js';
import { renderLatexAsImage } from '../../core/latex.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import type { AtomImageResolver } from '../../core/creole-atoms.js';
import { makeAtomImageResolverFor } from '../../core/creole-atoms-image-resolver.js';
import type { Paint } from '../../core/paint.js';

export { sequenceLineWidth } from './sequence-creole-text-atom.js';

/** Where a line's first run starts: `DriverTextSvg`'s own `x` (a LEFT edge)
 *  and `y` (a BASELINE), the same two quantities a `TextRun` carries. Every
 *  run of the line shares the baseline; only x advances. */
export interface CreoleOrigin {
  readonly leftX: number;
  readonly baselineY: number;
}

/**
 * The base `FontConfiguration` a sequence line's creole build starts from —
 * the port of `AbstractTextualComponent`'s own `final FontConfiguration fc =
 * getFontConfiguration()` (`java:80`), which resolves the component's style
 * bucket into the font every atom on the line inherits before any nested
 * `<b>`/`<i>`/`""…""` run modifies it.
 *
 * The two `FontSpec` flags map onto the two `FontStyle`s that mean the same
 * thing, exactly as `class-member-creole.ts#memberBaseFont` maps `{abstract}`
 * / `{static}` / `classAttributeFontStyle` onto theirs. `color` defaults to
 * `null` — `FontConfiguration.color === null` is upstream's transparent/unset
 * case, and a run whose colour is unset inherits the caller's ambient text
 * colour rather than hardcoding one here.
 */
export function sequenceCreoleFont(fontSpec: FontSpec, color: string | null = null): FontConfiguration {
  const styles = new Set<FontStyle>();
  if (fontSpec.weight === 'bold') styles.add(FontStyle.BOLD);
  if (fontSpec.style === 'italic') styles.add(FontStyle.ITALIC);
  return { family: fontSpec.family, size: fontSpec.size, color, styles };
}

/**
 * An atom whose box is an IMAGE, placed: the run carries no text, advances x
 * by the image's measured width, and bottom-aligns the box with the text
 * boxes beside it.
 *
 * Both image atoms this seam draws have a starting altitude of 0 --
 * `AtomMath#getStartingAltitude` (`AtomMath.java:73-75`) and
 * `AtomSprite#getStartingAltitude` (`AtomSprite.java:69-71`) -- and
 * `Sea#doAlign` drops every atom to `y = -height + getStartingAltitude`
 * (`Sea.java:72-80`), while `AtomText`'s altitude is its `FontPosition`
 * space, 0 for a NORMAL run (`AtomText.java:321-323`). So an image shares
 * its BOTTOM edge with the text beside it, and a text box's bottom is its
 * baseline plus its descent.
 *
 * `textAscent` is therefore the box's height ABOVE the baseline, `height -
 * descent`: it is the run's line-box top-to-baseline distance, the quantity
 * `sequence-layout-participants.ts#labelRows` stacks a row by. Jar-pinned on
 * a 25.846-tall sprite beside 14pt text: the row is 25.846 tall and the
 * text's baseline sits 22.735 = 25.846 - 3.111 below its top
 * (`tests/unit/sequence/sequence-creole-sprite.test.ts`).
 *
 * `drawn` is what the `<image>` element states, which may differ from the
 * measured `box`: a raster sprite/img is EMITTED `Math.round`ed while its box
 * keeps the raw scaled size (`driver-image-svg.ts`, jar-verified).
 */
function imageAtomRun(
  box: { readonly href: string; readonly width: number; readonly height: number },
  drawn: { readonly width: number; readonly height: number },
  origin: CreoleOrigin,
  descent: number,
): TextRun {
  return {
    text: '',
    x: origin.leftX,
    y: origin.baselineY,
    textWidth: box.width,
    textAscent: box.height - descent,
    textLineHeight: box.height,
    image: { href: box.href, width: drawn.width, height: drawn.height, y: origin.baselineY + descent - box.height },
  };
}

/**
 * One `'latex'` atom as an image run -- `AtomMath#calculateDimensionSlow`
 * measures the rendered image's own box and `#drawU` draws that same image
 * (`AtomMath.java:64-97`), which `core/latex.ts#renderLatexAsImage` answers
 * in one call, so the measured and the drawn box agree by construction.
 *
 * The colour is `XColor.BLACK`, `AtomMath#getColor`'s own default when the
 * atom's `foreground` is not an `HColorSimple` (`AtomMath.java:88,100-106`);
 * a `<color:…>` around the formula sets the atom's own.
 */
function latexAtomRun(atom: Extract<CreoleAtom, { kind: 'latex' }>, origin: CreoleOrigin, descent: number): TextRun {
  const drawn = renderLatexAsImage(atom.expr, atom.color ?? ATOM_MATH_DEFAULT_COLOR);
  return imageAtomRun(drawn, drawn, origin, descent);
}

/**
 * What a sequence label needs to resolve `<$sprite>`/`<img>` atoms: the
 * diagram's sprite registry (`skinParam.getSprite(src)`,
 * `StripeSimple.java:229`) and the label's own font colour, which
 * `StripeSimple#addSprite` hands `AtomSprite` as its `fontColor`
 * (`fontConfiguration.getColor()`, `StripeSimple.java:233`) and a monochrome
 * sprite tints with (`SpriteMonochrome.java:216-217`).
 */
export interface SequenceAtomContext {
  readonly sprites: SpriteRegistry;
  readonly fontColor: string;
  /** The `Back` the text is drawn on -- a monochrome sprite's gradient
   *  start (`SpriteMonochrome.java:216`, unwind2-S7). `undefined`: none. */
  readonly backColor?: Paint;
}

/**
 * The {@link SequenceAtomContext} a component's label draws with: the
 * diagram's sprites, the component font colour (`getFontConfiguration`,
 * `AbstractComponent.java:129-130`) and the `Back` the component applied
 * before `getTextBlock().drawU` -- the note fill (`ComponentRoseNote.java:
 * 121,136`), none for an arrow label (`ComponentRoseArrow.java:179`, drawn on
 * the ug it was handed). `undefined` with no registry.
 */
export function sequenceAtomContext(
  sprites: SpriteRegistry | undefined,
  fontColor: string,
  backColor?: Paint,
): SequenceAtomContext | undefined {
  if (sprites === undefined) return undefined;
  return { sprites, fontColor, ...(backColor === undefined ? {} : { backColor }) };
}

/**
 * A label line's width as `getTextWidth` reads it: the creole block `create0`
 * built (`AbstractTextualComponent.java:89-92,100-108`), so a `<$sprite>`
 * reserves the sprite and not its source text. The LAST run's right edge --
 * a non-text atom advances x without a run of its own.
 */
export function sequenceLabelLineWidth(
  line: string,
  spec: FontSpec,
  measurer: StringMeasurer,
  atomContext: SequenceAtomContext | undefined,
): number {
  const runs = sequenceCreoleRuns(line, sequenceCreoleFont(spec), { leftX: 0, baselineY: 0 }, measurer, atomContext);
  const last = runs.at(-1);
  return last === undefined ? 0 : last.x + last.textWidth;
}

/** A run moved by `(dx, dy)`: an image run's top (`SequenceRunImage.y`) is
 *  absolute, so it moves with the baseline it was placed against. */
export function offsetRun(run: TextRun, dx: number, dy: number): TextRun {
  const moved = { ...run, x: run.x + dx, y: run.y + dy };
  return run.image === undefined ? moved : { ...moved, image: { ...run.image, y: run.image.y + dy } };
}

/** The widest of a label's lines by {@link sequenceLabelLineWidth}; 0 for none. */
export function sequenceLabelBlockWidth(
  lines: readonly string[],
  spec: FontSpec,
  measurer: StringMeasurer,
  atomContext: SequenceAtomContext | undefined,
): number {
  return Math.max(0, ...lines.map((l) => sequenceLabelLineWidth(l, spec, measurer, atomContext)));
}

/** A resolved raster `'inline'` atom -- an `<img>` or a monochrome/4096-colour
 *  sprite, both drawn as one `<image>`. */
interface RasterAtom {
  readonly kind: 'raster';
  readonly href: string;
  readonly width: number;
  readonly height: number;
  readonly rasterWidth?: number;
  readonly rasterHeight?: number;
}

/** The atoms a line can DRAW here, in order. */
type DrawableAtom = Extract<CreoleAtom, { kind: 'text' } | { kind: 'latex' }> | RasterAtom;

/** Marks a line that must fall back to its whole literal text. */
const LITERAL_LINE = 'literal';

/**
 * One `'inline'` atom through the SHARED resolver every description/usecase
 * textblock uses (`core/creole-atoms-image-resolver.ts
 * #makeAtomImageResolverFor`): `<img>` -> its data URI, a monochrome or
 * 4096-colour sprite -> a rasterised PNG, both at the `CommandCreoleSprite`
 * `fc.getSize2D() / 13.0` scale of the font active AT THE ATOM
 * (`ambientFont`, `CommandCreoleSprite.java:82`).
 *
 * - `undefined` -- an unknown sprite name. `StripeSimple#addSprite` adds NO
 *   atom when `skinParam.getSprite(src)` is null (`StripeSimple.java:228-
 *   235`), so the atom contributes nothing at all.
 * - {@link LITERAL_LINE} -- an OpenIconic glyph or an SVG sprite, which draw
 *   vector primitives this engine's `TextRun` has no field for (the named
 *   remainder in this module's doc comment).
 */
function resolveInlineAtom(
  atom: Extract<CreoleAtom, { kind: 'inline' }>,
  resolverFor: (font: FontConfiguration) => AtomImageResolver,
  lineFont: FontConfiguration,
  fontColor: string,
): RasterAtom | undefined | typeof LITERAL_LINE {
  if (atom.atom.kind === 'openiconic') return LITERAL_LINE;
  const resolved = resolverFor({ ...(atom.ambientFont ?? lineFont), color: fontColor })(atom.atom);
  if (resolved === undefined) return undefined;
  if (resolved.kind === 'drawable') return LITERAL_LINE;
  return { ...resolved, kind: 'raster' };
}

/**
 * The line's atoms as the drawable sequence, or `undefined` when the line
 * holds an atom this engine cannot draw and must stay wholly literal. Without
 * a {@link SequenceAtomContext} every `'inline'` atom is undrawable, which is
 * the behaviour every caller outside the participant head still relies on.
 */
function drawableAtoms(
  atoms: readonly CreoleAtom[],
  lineFont: FontConfiguration,
  context: SequenceAtomContext | undefined,
): readonly DrawableAtom[] | undefined {
  const resolverFor =
    context === undefined ? undefined : makeAtomImageResolverFor(context.sprites, undefined, context.backColor);
  const out: DrawableAtom[] = [];
  for (const atom of atoms) {
    if (atom.kind === 'text' || atom.kind === 'latex') {
      out.push(atom);
      continue;
    }
    if (atom.kind !== 'inline' || resolverFor === undefined || context === undefined) return undefined;
    const raster = resolveInlineAtom(atom, resolverFor, lineFont, context.fontColor);
    if (raster === LITERAL_LINE) return undefined;
    if (raster !== undefined) out.push(raster);
  }
  return out;
}

/** `DriverImageSvg`'s emitted size: `Math.round` when a real raster backs the
 *  image, the declared size otherwise (`driver-image-svg.ts`, jar-verified). */
function rasterDrawnSize(atom: RasterAtom): { readonly width: number; readonly height: number } {
  if (atom.rasterWidth === undefined || atom.rasterHeight === undefined) return atom;
  return { width: atom.rasterWidth, height: atom.rasterHeight };
}

/** `AtomMath#getColor`'s own `XColor.BLACK` default (`AtomMath.java:88`) --
 *  this port has no `XColor`, so the equivalent CSS black stands in, exactly
 *  as `klimt/creole/atom/AtomMath.ts#DEFAULT_FOREGROUND` does. */
const ATOM_MATH_DEFAULT_COLOR = '#000000';

/**
 * ONE display line -> its placed, measured runs, left to right.
 *
 * `buildLineAtoms` is the shared "line -> visible atoms" lexer: it classifies
 * the raw line (`classifyStripeLine`), decodes `<U+XXXX>`/`&#NNN;` escapes per
 * atom, applies the `==`-heading font cascade, and returns the flat atom
 * sequence. Everything this function adds is PLACEMENT and MEASUREMENT — the
 * two things the engine deliberately does not do, because they belong to
 * whichever diagram is drawing.
 *
 * `line` is ONE physical line: `\n` splitting happens upstream of here
 * (upstream's own `Display.getWithNewlines`, which runs BEFORE creole
 * classification), so a caller with a multi-line display calls this once per
 * line and advances the baseline itself.
 */
export function sequenceCreoleRuns(
  line: string,
  font: FontConfiguration,
  origin: CreoleOrigin,
  measurer: StringMeasurer,
  atomContext?: SequenceAtomContext,
): readonly TextRun[] {
  // GUILLEMETS, which upstream rewrites on the DISPLAY LINE before any
  // classification happens:
  //
  // ```java
  // stripes = createStripes(skinParam.guillemet().manageGuillemet(cs.toString()),
  //         context, sheet.getLastStripe(), fontConfiguration);
  // ```
  // @see ~/git/plantuml/.../klimt/creole/legacy/CreoleParser.java:175
  //
  // It is not part of the atom engine, so a caller entering at
  // `buildLineAtoms` skips it and every `<<x>>` stays four literal characters
  // where the jar draws two glyphs (`bodobu-73-noli773`).
  //
  // The pair is `Guillemet.GUILLEMET`, upstream's default. `skinparam
  // guillemet` can override it (`Guillemet.java:60-67`) and this port carries
  // the override as far as `theme.guillemetStart`/`End`, but NO sequence
  // fixture in the corpus sets it — 0 of 1141, against 82 that write `<<…>>`
  // — so threading a pair through this signature would be building against
  // zero measured reach. `core/edge-label-box.ts#applyGuillemet` hardcodes the
  // same default for the same reason. Recorded as a residual, not a decision.
  //
  // The `~` TILE ESCAPE, which upstream applies inside the engine and this
  // port makes the caller's job.
  //
  // Upstream hides before the command scan and unhides per atom:
  // `StripeSimple.java:150` is `line = CharHidder.hide(line)` immediately
  // before `modifyStripe(line)`, and `AtomText.java:79` is
  // `String s = CharHidder.unhide(text)` in the constructor. This port did not
  // port the `hide` half into `StripeSimple.ts` — its own doc comment records
  // the deferral — so every caller of the shared engine performs it, and
  // `class-object-member-creole.ts:100,122` is the existing caller that does.
  //
  // Hiding runs BEFORE classification here, as it does there: `~""mono""`
  // must keep its quotes UNSTYLED, and classifying the raw line would consume
  // them before the scan ever saw the tile. Without this, `~[[Double]]` reaches
  // `CommandCreoleUrl` with a live `[[` and draws a link the jar does not
  // (`mufomi-43-vaso140`).
  const built = buildLineAtoms(CharHidder.hide(manageGuillemet(line)), font, CreoleMode.FULL);
  // HORIZONTAL_LINE yields no atoms at all — see the module's named
  // remainders for why the line stays its own literal text here.
  const atoms: readonly CreoleAtom[] =
    built.classification.type === 'HORIZONTAL_LINE'
      ? [{ kind: 'text', text: manageGuillemet(line), font: built.lineFont }]
      : built.atoms;

  // A line carrying an atom sequence cannot draw stays WHOLLY literal.
  //
  // `InlineAtomToken` keeps no source string — a `SpriteAtomToken` is a name,
  // a scale and an optional colour — so a per-atom fallback would have to
  // reconstruct `<$name{scale=2}>` by guessing which modifiers were written.
  // Falling back for the whole line instead reproduces, exactly, what this
  // engine emitted before the seam existed: one literal run at the raw line's
  // own measured width.
  //
  // Why fall back at all, rather than let the atom contribute only an
  // x-advance: dropping the run drops an ELEMENT. On the four sprite-only
  // fixtures (`ralegi-94-fure352`, `sodovo-72-kudu756`, `vibaru-39-gebo741`,
  // `zimoci-54-sedi066`) the jar draws the sprite as a `<path>`, this port
  // draws neither path nor text, and the resulting 12-against-13 child count
  // short-circuits the comparator above the other twelve elements. The literal
  // run is wrong in CONTENT and right in COUNT. cdd7 T1f narrowed the fallback
  // to vector atoms and context-less callers (named remainders above).
  const drawable = drawableAtoms(atoms, built.lineFont, atomContext);
  if (drawable === undefined) {
    const literal = { kind: 'text' as const, text: manageGuillemet(line), font: built.lineFont };
    return textAtomRuns(literal, origin.leftX, origin.baselineY, measurer).runs;
  }
  return placeDrawableAtoms(drawable, origin, measurer, measurer.getDescent(atomFontSpec(built.lineFont), 'M'));
}

/**
 * The drawable atoms, placed left to right on one baseline.
 *
 * `lineDescent` is the LINE's own descent, which every image atom's box
 * bottom is measured from -- `Sea` aligns the boxes, not the glyphs
 * (`Sea.java:72-80`). Read once, off the line font, for the same reason
 * `messageLabelBlock` reads it once.
 */
function placeDrawableAtoms(
  atoms: readonly DrawableAtom[],
  origin: CreoleOrigin,
  measurer: StringMeasurer,
  lineDescent: number,
): readonly TextRun[] {
  const runs: TextRun[] = [];
  let x = origin.leftX;
  for (const atom of atoms) {
    const at = { leftX: x, baselineY: origin.baselineY };
    if (atom.kind === 'text') {
      const placed = textAtomRuns(atom, x, origin.baselineY, measurer);
      runs.push(...placed.runs);
      x += placed.width;
      continue;
    }
    const run =
      atom.kind === 'latex'
        ? latexAtomRun(atom, at, lineDescent)
        : imageAtomRun(atom, rasterDrawnSize(atom), at, lineDescent);
    runs.push(run);
    x += run.textWidth;
  }
  return runs;
}
