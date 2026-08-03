/**
 * render-atoms.ts — SI5b+E2r T7: builds the `AtomImageResolver` factory
 * that turns creole `<img>`/`<$sprite>` atoms (T6, `core/creole-atoms.ts`)
 * into actual SVG `<image>` geometry at render time, reconciling seams
 * (a)/(b) flagged in the batch-2 decision-journal row:
 *
 * - `img` atoms: never need a sprite registry at all. Dims come straight
 *   off `measureInlineAtom` (T6) — the SAME numbers `leaf-sizing.ts`
 *   already used to size the label during layout (D9) — and `href` is the
 *   atom's own `dataUri`, passed through VERBATIM (D7 — licensing).
 * - `sprite` atoms with a MONOCHROME registry entry: resolved against the
 *   per-diagram `SpriteRegistry` (T4, `core/sprite-commands.ts`) via
 *   `getSpriteMonochrome` (seam (b) bridge). An unresolved name returns
 *   `undefined` — matches `StripeSimple.addSprite` (upstream java
 *   :228-236): the atom contributes NOTHING, not a blank image. A resolved
 *   sprite is tinted + rasterized to a PNG data URI via T5's
 *   `spriteToPngDataUri`, through the seam (a) adapter
 *   (`spriteMonochromeAsLike`) that bridges T4's concrete
 *   `SpriteMonochrome` to T5's `SpriteLike` (see `sprite-raster.ts`'s
 *   file-header note — the one-line adapter that file anticipated once T4
 *   landed).
 * - `sprite` atoms with an SVG registry entry (`getSpriteSvg`): decomposed
 *   into `UPath` DRAW-TIME primitives via `SvgNanoParser.drawU`
 *   (svg-sprite-nanoparser T9, ADR-2) rather than re-emitted as an opaque
 *   `<image href="data:image/svg+xml;base64,...">`. See
 *   `resolveSvgSpriteAtom`'s own doc comment.
 *
 * Width/height are ALWAYS taken from `measureInlineAtom`, never from
 * `spriteToPngDataUri`'s own returned `width`/`height` (the two are
 * numerically identical by construction — both derive from the same
 * `sprite.width`/`height` and `atom.scale` — see that function's own doc
 * comment): this guarantees the drawn `<image>` box is pixel-identical to
 * the box D9's measurement pass already reserved for it during layout
 * (this task's own "drawing and measuring agree" charter).
 *
 * `fontColor` for the sprite tint gradient's dark end is `AtomSprite`'s
 * upstream `fontConfiguration.getColor()` (java
 * `legacy/StripeSimple.java#addSprite`) — approximated here as the CURRENT
 * textblock's own resolved font color (`fontTitle`/`fontBody`/
 * `fontStereo` — see `EntityImageDescription.ts`'s
 * `atomImageResolverFor(font)` call sites, one per textblock, each with
 * its own font). `atom.forcedColor` overrides it, matching upstream's
 * `forcedColor == null ? fontColor : forcedColor`. `backColor` is left
 * unset (defaults to white, `sprite-raster.ts`'s own default) — upstream's
 * `backColor` comes from the active `UGraphic`'s current `Back` paint
 * (`ug.getParam().getBackcolor()`), which this port's `TextBlock` seam
 * does not thread through; documented simplification, not a geometry bug
 * (T7's jar-verification scope pins RELATIONS, not tint bytes — see the
 * mission brief).
 */
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { AtomImageResolver, InlineAtomToken, SpriteDimsLookup } from '../../core/creole-atoms.js';
import {
  measureInlineAtom,
  spriteScale,
} from '../../core/creole-atoms-measure.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { getSpriteMonochrome, getSpriteSvg, spriteDimsLookupFor } from '../../core/sprite-commands.js';
import { spriteToPngDataUri, spriteMonochromeAsLike } from '../../core/klimt/sprite/sprite-raster.js';
import { SvgNanoParser } from '../../core/klimt/sprite/SvgNanoParser.js';
import type { DrawablePrimitive } from '../../core/creole-atoms.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UChange } from '../../core/klimt/UChange.js';
import type { UShape } from '../../core/klimt/UShape.js';
import type { UParam } from '../../core/klimt/UParam.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import type { ResolvedColor } from '../../core/klimt/color/HColorSet.js';
import { parseSimpleColor } from '../../core/klimt/color/HColorSet.js';
import type { Paint } from '../../core/paint.js';

type ResolvedAtomImage =
  | { readonly kind: 'image'; readonly href: string; readonly width: number; readonly height: number }
  | {
      readonly kind: 'drawable';
      readonly primitives: readonly DrawablePrimitive[];
      readonly width: number;
      readonly height: number;
    }
  | undefined;

/** `parseSimpleColor`, tolerant of `null`/`undefined` (font color/forced
 *  color are both optional at this seam) -- an unresolvable token collapses
 *  to `undefined`, the SAME fallback `ColorResolver`'s own constructor
 *  already treats as "use the BLACK default" (`ColorResolver.ts#getDefaultColor`). */
function resolveOptionalColor(color: string | null | undefined): ResolvedColor | undefined {
  if (color === null || color === undefined) return undefined;
  return parseSimpleColor(color);
}

/**
 * Collects the `UShape` primitives `SvgNanoParser.drawU` would otherwise
 * draw, instead of drawing them -- the "collect what would have been drawn"
 * idiom this port's `LimitFinder` (`core/klimt/drawing/LimitFinder.ts`)
 * already uses for `MinMax`, applied here per `SvgNanoParser.ts`'s own
 * module doc comment ("T9 should follow that same idiom... small `UGraphic`
 * implementation whose `draw(shape)` pushes `UPath`/other shapes onto an
 * array instead of drawing them").
 *
 * Records EVERY shape `drawU` draws, not just `UPath` (maintainer-approved
 * amendment to ADR-2 once `<circle>`/`<text>`-bearing sprites were found
 * to be silently dropped): `drawCircle` draws a `UEllipse`, `drawText` a
 * `UText`, `drawPath`/`drawEllipse` a `UPath` (`SvgNanoParser.java:172-264`).
 *
 * Each collected shape is paired with the translate/fore/back/stroke this
 * collector held at the moment `draw` was called ({@link DrawablePrimitive},
 * a SECOND maintainer-approved amendment), rather than baking that state
 * into the shape or forwarding it to a real backend -- a collecting
 * `UGraphic` has no real backend to forward to. `SvgNanoParser` itself sets
 * this state correctly via ordinary `ug.apply(new Fore(...)).apply(new
 * Back(...))` calls (`applyFillAndStroke`, `ColorResolver`); the FIRST cut
 * of this collector accepted those `apply()` calls (needed just to not
 * throw) but silently dropped the resulting paint, so every primitive drew
 * with the ENTITY's ambient color instead of its own -- caught by the jar
 * comparator (18/6/12 fill+stroke diffs on the three sprite fixtures, ZERO
 * geometry diffs). `translate` is a no-op bake for a `<path>`/`<ellipse>`-
 * sourced `UPath` (its own segments are already absolute -- `drawPath`
 * bakes the affine transform in at parse time, never via a raw
 * `ug.apply(translate)` call) but load-bearing for `UEllipse`/`UText`,
 * which carry no position of their own. Draw sites re-apply everything:
 * `ug.apply(primitive.translate).apply(new Fore(primitive.fore))
 * .apply(new Back(primitive.back)).apply(primitive.stroke)
 * .draw(primitive.shape)` (`EntityImageDescriptionSupport.ts#drawAtoms`,
 * `EntityImageDescriptionDelegates.ts#descAtomOps`) -- the REAL
 * `DriverPathSvg` then collapses `fore === back` to a strokeless flat fill
 * on its own, so an absent `stroke=` reproduces without this file (or the
 * draw sites) special-casing "no stroke" at all.
 */
class SpritePrimitiveCollector implements UGraphic {
  private constructor(
    private readonly translate: UTranslate,
    private readonly fore: Paint,
    private readonly back: Paint,
    private readonly stroke: UStroke,
    private readonly primitives: DrawablePrimitive[],
  ) {}

  static create(): SpritePrimitiveCollector {
    // Defaults are inert: `SvgNanoParser.drawU`'s FIRST act is always
    // `updateColor` (`ug.apply(new Fore(...)).apply(new Back(...))`,
    // `UGraphicWithScale.create`), so every real `draw()` call sees an
    // explicitly-applied fore/back, never these fallbacks -- matching
    // `UGraphicNo.getParam()`'s identical all-black/simple-stroke defaults.
    return new SpritePrimitiveCollector(UTranslate.none(), 'black', 'black', UStroke.simple(), []);
  }

  apply(change: UChange): UGraphic {
    const supported =
      change instanceof UStroke || change instanceof UTranslate || change instanceof Fore || change instanceof Back;
    if (!supported) {
      throw new Error(`SpritePrimitiveCollector.apply: unsupported UChange ${change.constructor.name}`);
    }
    const translate = change instanceof UTranslate ? this.translate.compose(change) : this.translate;
    const fore = change instanceof Fore ? change.getColor() : this.fore;
    const back = change instanceof Back ? change.getBackColor() : this.back;
    const stroke = change instanceof UStroke ? change : this.stroke;
    return new SpritePrimitiveCollector(translate, fore, back, stroke, this.primitives);
  }

  draw(shape: UShape): void {
    this.primitives.push({ shape, translate: this.translate, fore: this.fore, back: this.back, stroke: this.stroke });
  }

  getParam(): UParam {
    return {
      getStroke: () => this.stroke,
      getColor: () => this.fore,
      getBackcolor: () => this.back,
      getTranslate: () => this.translate,
    };
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    // SvgNanoParser.drawU never calls getStringBounder() on its `ug` --
    // matches AbstractCommonUGraphic.ts's identical "not supported by this
    // backend" convention for a seam this collector never exercises.
    throw new Error('SpritePrimitiveCollector.getStringBounder: not supported');
  }

  collected(): readonly DrawablePrimitive[] {
    return this.primitives;
  }
}

function resolveImgAtom(atom: Extract<InlineAtomToken, { kind: 'img' }>): ResolvedAtomImage {
  const dims = measureInlineAtom(atom);
  return { kind: 'image', href: atom.dataUri, width: dims.width, height: dims.height };
}

/**
 * An SVG sprite decomposes into per-`<path>` `UPath` primitives via
 * `SvgNanoParser.drawU` (T9, svg-sprite-nanoparser ADR-2/ADR-4) -- the SAME
 * decomposition upstream's `AtomSprite`/`SpriteSvg` draws, rather than an
 * opaque `<image>` re-embedding the whole SVG source. `width`/`height` stay
 * the DECLARED (scaled) box from `measureInlineAtom`, exactly as before this
 * task -- ink lives ONLY inside `primitives` (ADR-2's explicit non-goal:
 * this is NOT the ink/measurement side channel `sizer-footprint-parity` T2
 * deleted). `spriteScale` is the SAME `CommandCreoleSprite`
 * `fc.getSize2D() / 13.0` factor applied to both the declared box and the
 * decomposition, so drawn and measured sprite geometry cannot drift (S1L-f).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/AtomSprite.java#calculateDimensionSlow
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java#drawU
 *
 * Exported (T10, ADR-3): `leaf-sizing.ts#sizingAtomImageResolverFor` calls
 * this SAME function at SIZING time (via `SpriteDims.svg`, T10) so `Footprint`
 * observes the sprite's REAL drawn geometry instead of an approximation --
 * the ONE piece of `makeAtomImageResolverFor` sizing and rendering share.
 * Monochrome rasterization (`resolveSpriteAtom`, below) stays render-only:
 * it changes only `href`, never geometry, so sizing has no reason to pay for
 * it.
 */
export function resolveSvgSpriteAtom(
  atom: Extract<InlineAtomToken, { kind: 'sprite' }>,
  svg: string,
  spriteDims: SpriteDimsLookup,
  font: FontConfiguration,
): ResolvedAtomImage {
  const dims = measureInlineAtom(atom, spriteDims, font.size);
  const scale = spriteScale(atom.scale, font.size);
  const collector = SpritePrimitiveCollector.create();
  new SvgNanoParser(svg).drawU(collector, scale, resolveOptionalColor(font.color), resolveOptionalColor(atom.forcedColor));
  return { kind: 'drawable', primitives: [...collector.collected()], width: dims.width, height: dims.height };
}

function resolveSpriteAtom(
  atom: Extract<InlineAtomToken, { kind: 'sprite' }>,
  registry: SpriteRegistry,
  spriteDims: SpriteDimsLookup,
  font: FontConfiguration,
): ResolvedAtomImage {
  const svgSprite = getSpriteSvg(registry, atom.name);
  if (svgSprite !== undefined) return resolveSvgSpriteAtom(atom, svgSprite.svg, spriteDims, font);
  const sprite = getSpriteMonochrome(registry, atom.name);
  if (sprite === undefined) return undefined; // unknown name -- StripeSimple.addSprite: skip.
  // `font.size` is threaded so the sprite picks up `CommandCreoleSprite`'s
  // `fc.getSize2D() / 13.0` factor -- the SAME call the sizer makes, so drawn
  // and measured sprite geometry cannot drift (S1L-f).
  const dims = measureInlineAtom(atom, spriteDims, font.size);
  const png = spriteToPngDataUri(
    spriteMonochromeAsLike(sprite),
    font.color ?? undefined,
    atom.forcedColor,
    spriteScale(atom.scale, font.size),
  );
  // A monochrome sprite is RASTERISED to a PNG, whose pixel dimensions are
  // necessarily integers -- so the emitted `<image>` box is the ROUNDED
  // scaled size, while `measureInlineAtom` keeps the raw value the sizer
  // needs. That asymmetry is the JAR'S OWN and is mirrored deliberately
  // (si5b `decisions.md` D9, Amendment 1, 2026-08-03): a 48x48 encoded sprite MEASURES 51.6923
  // at font 14 (`spriteScale`'s jar-verified note) while a rasterised
  // monochrome grid EMITS integers. Jar-verified over 8 samples at font
  // sizes 13-39 -- raw 3.2308x2.1538 -> 3x2, 3.6923x2.4615 -> 4x2,
  // 4.6154x3.0769 -> 5x3, 5.7692x3.8462 -> 6x4, 6.9231x4.6154 -> 7x5, and a
  // 16x4 grid's 17.2308x4.3077 -> 17x4: plain Math.round every time.
  return {
    kind: 'image',
    href: png.dataUri,
    width: Math.round(dims.width),
    height: Math.round(dims.height),
  };
}

/**
 * Builds the `(font) => AtomImageResolver` factory `EntityImageDescription
 * .ts`'s `atomImageResolverFor` param expects (one call per textblock, so
 * each resolver closes over that textblock's own font/color). `registry`
 * is the diagram's `ast.sprites` (`undefined` for a diagram with no
 * `sprite` definitions at all — `<$name>` atoms then always resolve to
 * `undefined`/skip, matching upstream's `skinParam.getSprite(name)`
 * returning null when nothing is registered; `<img>` atoms are unaffected
 * either way).
 */
export function makeAtomImageResolverFor(
  registry: SpriteRegistry | undefined,
): (font: FontConfiguration) => AtomImageResolver {
  const spriteDims = registry !== undefined ? spriteDimsLookupFor(registry) : undefined;
  return (font: FontConfiguration): AtomImageResolver => {
    return (atom: InlineAtomToken): ResolvedAtomImage => {
      if (atom.kind === 'img') return resolveImgAtom(atom);
      // G2 N41: OpenIconic glyphs have zero description/usecase corpus
      // reach (class-only per the G2 N40 survey) -- undefined here matches
      // an unresolved sprite name's own "contributes nothing" rule rather
      // than guessing an unverified description-side render path.
      if (atom.kind === 'openiconic') return undefined;
      if (registry === undefined || spriteDims === undefined) return undefined;
      return resolveSpriteAtom(atom, registry, spriteDims, font);
    };
  };
}
