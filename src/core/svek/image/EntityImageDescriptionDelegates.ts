/**
 * EntityImageDescriptionDelegates — every private-instance-method body
 * `EntityImageDescription` delegates to (`buildDesc`, `buildStereo`, the
 * three link-scanning helpers, `computeShieldMargins`, `hideTextOffsets`,
 * `requireGroups`).
 *
 * Split out of `EntityImageDescriptionSupport.ts` (E2r/L1, mechanical only
 * — not an upstream divergence) purely to stay under this project's
 * 500-line complexity-hook ceiling once that file's text-construction seam
 * grew to accommodate the ported creole stripe/atom pipeline — this
 * project's established "500-line splits" workaround, same precedent as
 * the original `EntityImageDescription.ts`/`EntityImageDescriptionSupport
 * .ts` split.
 */
import type { UGraphic } from '../../klimt/UGraphic.js';
import type { StringBounder } from '../../klimt/font/StringBounder.js';
import { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import { HorizontalAlignment } from '../../klimt/geom/HorizontalAlignment.js';
import { UTranslate } from '../../klimt/UTranslate.js';
import { Fore } from '../../klimt/Fore.js';
import { Back } from '../../klimt/Back.js';
import type { FontConfiguration } from '../../klimt/shape/UText.js';
import { UText } from '../../klimt/shape/UText.js';
import { UImage } from '../../klimt/shape/UImage.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../klimt/shape/TextBlockUtils.js';
import type { AtomImageResolver, SpriteDimsLookup } from '../../creole-atoms.js';
import type { ResolvedColor } from '../../klimt/color/HColorSet.js';
import { SvgNanoParser } from '../../klimt/sprite/SvgNanoParser.js';
import type { USymbol } from '../../decoration/symbol/USymbol.js';
import type { UGraphicWithGroups } from '../DecorateEntityImage.js';
import { Margins, buildTextBlock, measureLine } from './EntityImageDescriptionSupport.js';
import { emojiSquareDim, emojiStartingAltitude } from '../../klimt/creole/atom/AtomEmoji.js';
import { drawEmojiAtom, type EmojiArtworkResolver } from './EntityImageDescriptionEmoji.js';
import type {
  EntityImageDescriptionLabels,
  EntityImageDescriptionPaint,
  EntityImageDescriptionLinkInfo,
  EntityImageDescriptionStereotypeSprite,
} from './EntityImageDescription.js';
import { BodyFactory } from '../../cucadiagram/BodyFactory.js';
import { Display } from '../../klimt/creole/Display.js';
import { Pragma } from '../../skin/Pragma.js';
import { LineBreakStrategy } from '../../klimt/LineBreakStrategy.js';
import { ClockwiseTopRightBottomLeft } from '../../klimt/geom/ClockwiseTopRightBottomLeft.js';
import { CreoleParser } from '../../klimt/creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../../klimt/creole/Parser.js';
import { GUILLEMET_DEFAULT, type GuillemetPair } from '../../text/Guillemet.js';
import { renderLatexAsImage } from '../../latex.js';
import type { ISkinSimple } from '../../style/ISkinSimple.js';
import type { AtomOps } from '../../klimt/creole/Sea.js';
import type { CreoleAtom } from '../../klimt/creole/atom/Atom.js';
import type { Atom } from '../../klimt/creole/SheetBlock1.js';
import type { NestedDiagramRenderer } from '../../EmbeddedDiagram.js';

/**
 * SI15 T1 (ADR-1): widens `AtomImageResolver`'s `image` variant with the
 * optional raster-pixel fields `render-atoms.ts`'s producers
 * (`resolveSpriteAtom`/`resolveImgAtom`) now populate. Declared locally
 * rather than widening `AtomImageResolver` itself in `creole-atoms.ts` --
 * that module sits at this project's 500-line file cap; the resolver's
 * runtime shape already carries these fields (`render-atoms.ts`'s own
 * `ResolvedAtomImage`), only the shared static type doesn't expose them.
 * Mirrors `EntityImageDescriptionTextBlock.ts`'s identical local type.
 */
type ResolvedAtomImageWithRaster =
  | (Extract<ReturnType<AtomImageResolver>, { readonly kind: 'image' }> & {
      readonly rasterWidth?: number;
      readonly rasterHeight?: number;
    })
  | Exclude<ReturnType<AtomImageResolver>, { readonly kind: 'image' }>;

// ---------------------------------------------------------------------------
// T4 (`plans/bodyenhanced-atom-seams/`) -- `desc` wired through the REAL
// `BodyFactory.create3` (`EntityImageDescription.java:188-191`). `name`/
// `stereo` still use `buildTextBlock` above, UNCHANGED (ADR-10: `create2` ->
// `BodyEnhanced1` is mission SI1's, not this one's).
//
// `create3`'s upstream trailing `Style style` resolves nothing this port can
// obtain from a real cascade (no `Style`/`PName` anywhere -- ADR-8 corollary),
// so the two scalars it fed (`LineThickness`/`MinimumWidth`) are additive,
// caller-overridable fields on `EntityImageDescriptionPaint` (see that
// interface's own doc comment for the traced `plantuml.skin` defaults: 1.0 /
// 0). `ISkinSimple`/`AtomOps`/the nested-diagram `NestedDiagramRenderer` have
// NO real production caller anywhere in this port yet (`ISkinSimple.ts`'s own
// doc comment; `.agent-notes/T9a-creoleparser.md`'s "T2b" flag on
// `DisplayCreole.ts#getCreole`) -- built HERE as the first real, non-stub
// instances, scoped to exactly what `desc`'s real call path
// (`BodyEnhanced2` -> `Display#create9` -> `DisplayCreole#getCreole` ->
// `ISkinSimple#sheet` -> `CreoleParser` -> `Sea`/`SheetBlock1`/`SheetBlock2`)
// actually reads (grep-verified: `guillemet()`, `getPragma()`, `getPadding()`
// -- table/tree cells also read `getPadding()` if `desc` ever contains one).
// Every OTHER `ISkinSimple` member gets upstream's own traced default
// (`SkinParam.java`'s own unset-skinparam fallback), not a guess, so the
// interface is satisfied in full rather than partially stubbed.
// ---------------------------------------------------------------------------

/** `plantuml.skin:15`, `root { LineThickness 1.0 }` -- no description-family
 *  selector (`component`/`usecase`/`rectangle`/`interface`/`folder`/
 *  `package`/`note`, `AbstractTextualComponent`'s callers) overrides it
 *  (grep-verified against `~/git/plantuml/.../skin/plantuml.skin`), so this
 *  is upstream's own real cascade result, not a fitted constant. */
const ROOT_LINE_THICKNESS = 1.0;

/** `EmbeddedDiagram`'s real caller needs a `NestedDiagramRenderer` (T10f's own
 *  seam); a description entity's `desc` text embedding a nested `{{ ... }}`
 *  diagram is a genuinely separate, unbuilt feature here (no caller anywhere
 *  in `src/diagrams/` constructs one) -- cited, thrown, matching this file's
 *  own `requireGroups`/`EntityImageDescription.ts#drawU`'s URL-not-supported
 *  precedent, not a silent drop. */
function blockedEmbeddedRenderer(): NestedDiagramRenderer {
  return {
    render(): TextBlock {
      throw new Error(
        'EntityImageDescriptionDelegates: embedded diagrams ({{ ... }}) inside a description ' +
          'label are not supported -- this port has no caller that constructs a nested-diagram ' +
          'renderer for description text (EmbeddedDiagram.ts#NestedDiagramRenderer is the seam).',
      );
    },
  };
}

/** `Stripe<A extends StripeAtom>`'s `StripeAtom = CreoleAtom | Atom`
 *  (`Stripe.ts`) -- `Sea`/`SheetBlock1` are typed over bare `CreoleAtom`
 *  ONLY (`Sea.ts`), but `DisplayCreole.ts#getCreole`'s own doc comment
 *  documents the REAL gap: a `CreoleParser`-built `Sheet` genuinely mixes
 *  plain-text `CreoleAtom`s with composite `Atom` instances (`StripeCode`/
 *  `StripeTable`/`StripeTree`/`CreoleHorizontalLine`/`EmbeddedDiagram`, each
 *  ALREADY implementing `Atom`'s own `calculateDimension`/`getStartingAltitude`
 *  /`drawU`) -- that file's own `as unknown as Sheet<CreoleAtom>` cast is a
 *  TYPE-LEVEL lie the RUNTIME value doesn't honor, flagged there for
 *  "whoever wires a real `ISkinSimple.sheet()` implementation next (T2b)" --
 *  this task. `'kind' in x` duck-types the plain-data union (only `CreoleAtom`
 *  members carry it); a composite `Atom` instance has no such field, so it
 *  delegates to ITS OWN already-ported methods rather than reimplementing
 *  them here -- the faithful answer, not a workaround. */
function isCreoleAtomData(x: CreoleAtom | Atom): x is CreoleAtom {
  return 'kind' in x;
}

/**
 * `AtomOps` for `desc`'s real Sea/SheetBlock1 pipeline (`Sea.ts`'s own doc
 * comment). `getStartingAltitude` is 0 for every `CreoleAtom` kind: upstream's
 * `AtomImg`/`AtomSprite`/`AtomMath` all `return 0` (java, grep-verified); its
 * `AtomText` returns `fontConfiguration.getSpace()` (`FontPosition#getSpace`,
 * 0 for `NORMAL`, nonzero only for `EXPOSANT`/`INDICE`) -- this port's
 * `FontConfiguration` (`UText.ts`) has no `FontPosition`/superscript concept
 * anywhere, so `NORMAL` (0) is the only reachable state, not a shortcut.
 * `drawU`'s per-atom baseline shift (`height - descent`, text only) mirrors
 * `AtomText.java`'s own `ypos = rect.getHeight() - descent` exactly. */
function descAtomOps(
  resolveAtomImage: AtomImageResolver | undefined,
  resolveEmojiArtwork: EmojiArtworkResolver | undefined,
): AtomOps {
  function dimensionOf(atom: CreoleAtom, stringBounder: StringBounder): { width: number; height: number } {
    if (atom.kind === 'text') return measureLine(stringBounder, atom.text, atom.font);
    if (atom.kind === 'latex') return renderLatexAsImage(atom.expr, atom.color ?? '#000000');
    // A2s R2i: a `<:name:>` emoji sizes as `AtomEmoji`'s exact contract
    // (`klimt/creole/atom/AtomEmoji.ts`); description previously measured
    // the raw markup as literal text (murava-69-tago286's backlog pin).
    //
    // F4-b: `calculateDimensionSlow` VERBATIM -- the 36*factor SQUARE, not
    // `emojiBoxDim`'s pre-combined 39*factor line height. THIS ops bundle
    // drives the real `Sea` (`getStartingAltitude` below returns the atom's
    // own -3*factor), so `Sea#doAlign`/`getHeight` derive the line height
    // themselves, exactly as upstream does: 39*factor when a text atom
    // shares the line, 36*factor when the emoji is alone on it. Folding the
    // hang into the DIMENSION double-counted it for an emoji-only line
    // (+3*factor = +1.75px at font 14 -- `emoji-only-line-height-0`).
    if (atom.kind === 'emoji') return emojiSquareDim(atom.factor);
    const resolved = resolveAtomImage?.(atom.atom);
    return resolved === undefined ? { width: 0, height: 0 } : resolved;
  }
  return {
    calculateDimension(creoleAtom: CreoleAtom, stringBounder: StringBounder): XDimension2D {
      const atom = creoleAtom as CreoleAtom | Atom;
      if (!isCreoleAtomData(atom)) return atom.calculateDimension(stringBounder);
      const { width, height } = dimensionOf(atom, stringBounder);
      return new XDimension2D(width, height);
    },
    getStartingAltitude(creoleAtom: CreoleAtom, stringBounder: StringBounder): number {
      const atom = creoleAtom as CreoleAtom | Atom;
      if (!isCreoleAtomData(atom)) return atom.getStartingAltitude(stringBounder);
      // F4-b: `AtomEmoji#getStartingAltitude` is the ONE `CreoleAtom` kind
      // whose altitude is NOT 0 upstream (`AtomEmoji.java:62-64`,
      // `-3 * factor`) -- the doc comment above enumerates `AtomImg`/
      // `AtomSprite`/`AtomMath` as `return 0` and `AtomText` as
      // `getSpace()` (0 for `NORMAL`, this port's only reachable state),
      // but predates the emoji atom kind. Reporting it here is what lets
      // `Sea#doAlign` derive the mixed (39*factor) and emoji-only
      // (36*factor) line heights instead of a baked-in constant.
      if (atom.kind === 'emoji') return emojiStartingAltitude(atom.factor);
      return 0;
    },
    drawU(creoleAtom: CreoleAtom, ug: UGraphic): void {
      const atom = creoleAtom as CreoleAtom | Atom;
      if (!isCreoleAtomData(atom)) {
        atom.drawU(ug);
        return;
      }
      if (atom.kind === 'text') {
        const m = measureLine(ug.getStringBounder(), atom.text, atom.font);
        ug.apply(new UTranslate(0, m.height - m.descent)).draw(UText.build(atom.text, atom.font));
        return;
      }
      if (atom.kind === 'latex') {
        const r = renderLatexAsImage(atom.expr, atom.color ?? '#000000');
        ug.draw(UImage.build(r.width, r.height, r.href));
        return;
      }
      // Artwork when the asset channel supplies it, platform-glyph text run
      // otherwise — `EntityImageDescriptionEmoji.ts#drawEmojiAtom`. Which one
      // runs changes LAYOUT, not just looks: `Footprint` collects the points
      // actually drawn, so a use-case ellipse fits the glyph.
      if (atom.kind === 'emoji') {
        drawEmojiAtom(ug, atom, resolveEmojiArtwork);
        return;
      }
      const resolved: ResolvedAtomImageWithRaster | undefined = resolveAtomImage?.(atom.atom);
      if (resolved === undefined) return;
      // svg-sprite-nanoparser T9 fix (was: `if (resolved.kind !== 'image')
      // return;`, T4's placeholder guard -- silently dropped every SVG
      // sprite once T9 started emitting `drawable`, a REAL regression
      // caught by the orchestrator jar-verifying T9's own report).
      //
      // CORRECTED BLAST RADIUS (T9's own two-level trace, preserved here so
      // it is not re-derived expensively): the brief that commissioned T9
      // claimed class/object/state sprite atoms reach this call site. They
      // do NOT -- `EntityImageDescription` (whose `desc`/`stereo` TextBlocks
      // call `descAtomOps`, hence this `drawU`) is constructed ONLY in
      // `src/diagrams/description/{leaf-sizing.ts,renderer-entity.ts}`
      // (grep-verified), and class diagrams' OWN sprite pipeline
      // (`class-member-creole.ts`) calls only `getSpriteMonochrome`, never
      // `getSpriteSvg` -- zero reach into an SVG-sprite `drawable` result.
      // The REAL affected path is narrower and more central: the
      // DESCRIPTION engine's own MAIN entity label (`buildDesc` ->
      // `BodyFactory.create3` -> here), a DIFFERENT draw site from
      // `EntityImageDescriptionSupport.ts#drawAtoms` (T7's `buildTextBlock`,
      // used only by stereotype labels and notes) -- which is why T7 landing
      // did not also fix this one.
      //
      // Mirrors `drawAtoms`'s own `drawable` branch (see that function's doc
      // comment, T7/T9 ADR-2): the only structural difference is that THIS
      // `ug` is already positioned at the atom's origin by
      // `SheetBlock1.ts#drawU`'s `position.translate(target)` before calling
      // `AtomOps.drawU` (Sea/SheetBlock1's own per-atom positioning), so no
      // extra `ug.apply(new UTranslate(x, origin.y))` wrapper is needed here
      // the way `drawAtoms`'s manual x-cursor requires one.
      if (resolved.kind === 'image') {
        // SI15 T1 (ADR-1): mirrors `drawAtoms`'s identical guarded fallback
        // (`EntityImageDescriptionTextBlock.ts`, this file's own doc
        // comment above) -- raster dims present only for a real
        // raster-backed atom (sprite/img).
        const rasterDims =
          resolved.rasterWidth !== undefined && resolved.rasterHeight !== undefined
            ? { rasterWidth: resolved.rasterWidth, rasterHeight: resolved.rasterHeight }
            : undefined;
        ug.draw(UImage.build(resolved.width, resolved.height, resolved.href, rasterDims));
      } else {
        // Each primitive re-applies its OWN translate+paint on top of the
        // atom's position `ug` already carries (`DrawablePrimitive`,
        // creole-atoms.ts): `UPath`'s translate is always `(0,0)` (its
        // geometry is already absolute), but `UEllipse`/`UText` carry no
        // position of their own; fore/back/stroke are the SAME
        // `SvgNanoParser` paint state, snapshotted rather than forwarded
        // when it was resolved (T9 amendment 2, mirrors `drawAtoms`'s
        // identical fix) -- `DriverPathSvg` collapses `fore === back` to a
        // strokeless flat fill on its own. @see SvgNanoParser.java#drawU
        for (const primitive of resolved.primitives) {
          ug
            .apply(primitive.translate)
            .apply(new Fore(primitive.fore))
            .apply(new Back(primitive.back))
            .apply(primitive.stroke)
            .draw(primitive.shape);
        }
      }
    },
  };
}

/** The real `ISkinSimple` `desc`'s `create3` call path needs -- see this
 *  section's own header comment for which members are actually read versus
 *  given upstream's traced default. `skin` self-references inside `sheet()`
 *  so a `StripeTable`/`StripeTree`/`CreoleHorizontalLine` constructed deeper
 *  in the `CreoleParser` dispatch sees the SAME capability object back. */
function buildLocalSkinSimple(guillemet: GuillemetPair | undefined, atomOps: AtomOps, pragma: Pragma): ISkinSimple {
  const renderer = blockedEmbeddedRenderer();
  const skin: ISkinSimple = {
    getSprite: () => null, // no SpriteRegistry reachable from ISkinSimple here (DisplayCreole.ts's own T9c note)
    guillemet: () => guillemet ?? GUILLEMET_DEFAULT,
    getFromMd5: () => null, // SkinParam.java: empty md5map by default
    transformStringForSizeHack: (s: string) => s, // SkinParam.java: empty svgCharSizes map -> identity
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(), // SkinParam.java: unset "padding" -> same(0)
    getMonospacedFamily: () => MONOSPACED, // SkinParam.java:1068 default (Parser.MONOSPACED)
    getTabSize: () => 8, // SkinParam.java:1074 default
    getDpi: () => 96, // SkinParam.java:641 default
    copyAllFrom: () => undefined,
    getPragma: () => pragma,
    sheet: (fontConfiguration, horizontalAlignment, creoleMode, stereo?: FontConfiguration) =>
      new CreoleParser(
        fontConfiguration,
        horizontalAlignment,
        skin,
        { creoleMode, stereotype: stereo ?? fontConfiguration },
        { atomOps, renderer },
      ),
  };
  return skin;
}

/** Upstream: the `desc` local-variable if/else-if/else chain
 *  (`EntityImageDescription.java:181-191`) -- the empty/package-leaf branch
 *  unchanged; the two `create3` branches (`fcTitle` vs `fc`, T4) now build a
 *  real `Display`/`ISkinSimple`/`AtomOps` and call the real `BodyFactory
 *  .create3` instead of the `buildTextBlock` scoped substitute. */
export function buildDesc(
  symbol: USymbol,
  labels: EntityImageDescriptionLabels,
  paint: EntityImageDescriptionPaint,
  atomImageResolverFor?: (font: FontConfiguration) => AtomImageResolver,
  emojiArtwork?: EmojiArtworkResolver,
): TextBlock {
  const isPackageLeaf = symbol.getSNames()[0] === 'package_';
  const displayEqualsCode = labels.displayText === labels.codeName;
  const isWhite = labels.displayText.trim().length === 0;
  if ((displayEqualsCode && isPackageLeaf) || isWhite) {
    return TextBlockUtils.empty(paint.minimumWidth ?? 0, 0);
  }
  const font = displayEqualsCode ? paint.fontTitle : (paint.fontBody ?? paint.fontTitle);
  const resolveAtomImage = atomImageResolverFor?.(font);
  const atomOps = descAtomOps(resolveAtomImage, emojiArtwork);
  const pragma = Pragma.createEmpty();
  const skinParam = buildLocalSkinSimple(paint.guillemet, atomOps, pragma);
  // `Display.create(...)`, NOT `getWithNewlines`: `labels.displayText` is
  // ALREADY split one-line-per-`\n` (this port's adaptation-seam convention
  // for `entity.getDisplay()`, EntityImageDescription.ts's own doc comment)
  // -- upstream's REAL `Display` is built the SAME way during parsing (one
  // `displayData` element per source line, `Display.create(List<String>)`).
  // `getWithNewlines` instead SCANS for the literal two-character `\n`
  // escape (`DisplayNewlines.ts`'s own doc comment) -- the WRONG parser for
  // an already-split array, and it would glue every line back into ONE
  // element (verified: it silently swallowed `BodyEnhanced2#collectBlocks`'s
  // separator-splitting entirely, since a single mega-element never matches
  // `isBlockSeparator`).
  const rawBody = Display.create(labels.displayText.split('\n'));
  const lineBreakStrategy =
    paint.wrapWidth !== undefined && paint.wrapWidth > 0 ? new LineBreakStrategy(String(paint.wrapWidth)) : LineBreakStrategy.NONE;
  return BodyFactory.create3(
    rawBody,
    { skinParam, align: paint.titleAlignment, titleConfig: font, lineBreakStrategy },
    { defaultThickness: paint.defaultThickness ?? ROOT_LINE_THICKNESS, minimumWidth: paint.minimumWidth ?? 0 },
    atomOps,
  );
}

/**
 * `SkinParam#getSprite`'s two tiers narrowed to the ONE shape
 * `EntityImageDescriptionLabels.stereotypeSprite` carries — the single
 * conversion both producers call, so the sizer
 * (`leaf-sizing-entity.ts#buildSizingEntityParams`, holding a
 * `SpriteDimsLookup`) and the renderer
 * (`renderer-entity.ts#buildEntityParams`, holding a `SpriteRegistry`
 * narrowed through `spriteDimsLookupFor`) cannot resolve the same name to
 * two different boxes. `planning/sizer-renderer-parity.md` exists because
 * that is exactly how this bug class recurs.
 *
 * `undefined` in / miss out — a stereotype naming an unknown sprite falls
 * back to its `«label»` block, which is `Stereotype#getSprite`'s own null
 * return (java:112-114), not a fallback invented here.
 */
export function resolveStereotypeSprite(
  ref: { readonly name: string; readonly scale: number; readonly color?: ResolvedColor | undefined } | undefined,
  sprites: SpriteDimsLookup | undefined,
): EntityImageDescriptionStereotypeSprite | undefined {
  if (ref === undefined) return undefined;
  const dims = sprites?.get(ref.name);
  if (dims === undefined) return undefined;
  return {
    width: dims.width,
    height: dims.height,
    scale: ref.scale,
    ...(dims.svg === undefined ? {} : { svg: dims.svg }),
    ...(ref.color === undefined ? {} : { color: ref.color }),
  };
}

/**
 * `ISvgSpriteParser#asTextBlock`'s anonymous `TextBlock`
 * (`svg/parser/SvgNanoParser.java:458-479`, byte-identical in
 * `SvgSaxParser.java:125-144`): the DECLARED box times `scale`, drawn by
 * replaying the sprite's own primitives at that scale.
 *
 * `backColor` is never passed by `Stereotype#getSprite` (java:116 hands it
 * `null`), so upstream's optional backing `URectangle` is unreachable from
 * this call site and is deliberately not ported here.
 */
class StereotypeSpriteBlock implements TextBlock {
  constructor(private readonly sprite: EntityImageDescriptionStereotypeSprite) {}

  calculateDimension(_stringBounder: StringBounder): XDimension2D {
    return new XDimension2D(this.sprite.width * this.sprite.scale, this.sprite.height * this.sprite.scale);
  }

  drawU(ug: UGraphic): void {
    // A PNG-backed internal sprite has no draw path in this port (see
    // `EntityImageDescriptionStereotypeSprite.svg`) -- it still measures.
    if (this.sprite.svg === undefined) return;
    new SvgNanoParser(this.sprite.svg).drawU(ug, this.sprite.scale, this.sprite.color, undefined);
  }
}

/** Upstream: the `stereo` local-variable if/else-if/else chain
 *  (`EntityImageDescription.java:192-201`), sprite branch included. */
export function buildStereo(
  stereotypeLabels: readonly string[],
  fontStereo: FontConfiguration,
  resolveAtomImage?: AtomImageResolver,
  sprite?: EntityImageDescriptionStereotypeSprite,
): TextBlock {
  // java:193-194 -- tested FIRST and unconditionally: a resolvable sprite
  // replaces the label block, and `TextBlockUtils.withMargin`'s 1px side
  // padding is NOT applied to it (that is the label branch's own call).
  if (sprite !== undefined) return new StereotypeSpriteBlock(sprite);
  if (stereotypeLabels.length === 0) return TextBlockUtils.empty(0, 0);
  const text = stereotypeLabels.map((label) => `«${label}»`).join('\n');
  const block = buildTextBlock(text, fontStereo, HorizontalAlignment.CENTER, resolveAtomImage);
  return TextBlockUtils.withMargin(block, 1, 1, 0, 0);
}

/** Upstream: `EntityImageDescription#hasSomeHorizontalLinkVisible`. */
export function hasSomeHorizontalLinkVisible(links: readonly EntityImageDescriptionLinkInfo[]): boolean {
  return links.some((link) => link.length === 1 && !link.isInvis);
}

/** Upstream: `EntityImageDescription#isThereADoubleLink`. */
export function isThereADoubleLink(links: readonly EntityImageDescriptionLinkInfo[]): boolean {
  const seen = new Set<string>();
  for (const link of links) {
    if (seen.has(link.otherEntityId)) return true;
    seen.add(link.otherEntityId);
  }
  return false;
}

/** Upstream: `EntityImageDescription#hasSomeHorizontalLinkDoubleDecorated`. */
export function hasSomeHorizontalLinkDoubleDecorated(links: readonly EntityImageDescriptionLinkInfo[]): boolean {
  return links.some((link) => link.length === 1 && link.isDoubleDecorated);
}

/** Upstream: the dimension math inside `getShield` (after the four
 *  early-return guards). */
export function computeShieldMargins(stereo: TextBlock, desc: TextBlock, asSmall: TextBlock, stringBounder: StringBounder): Margins {
  const dimStereo = stereo.calculateDimension(stringBounder);
  const dimDesc = desc.calculateDimension(stringBounder);
  const dimSmall = asSmall.calculateDimension(stringBounder);
  const x = Math.max(dimStereo.getWidth(), dimDesc.getWidth());
  const dimSmallWidth = dimSmall.getWidth();
  let suppX = x - dimSmallWidth;
  if (suppX < 1) suppX = 1;
  const y = Math.max(1, dimDesc.getHeight(), dimStereo.getHeight());
  return new Margins(suppX / 2, suppX / 2, y, y);
}

/** Shared `posx1`/`posx2` (+ the three dimensions they derive from) —
 *  upstream duplicates this exact computation once in `drawU`'s
 *  `hideText` block and once in `getOverscanX`; both still read
 *  upstream's own `(dimSmall.getWidth() - dimX.getWidth()) / 2` formula
 *  unchanged. */
export function hideTextOffsets(
  asSmall: TextBlock,
  desc: TextBlock,
  stereo: TextBlock,
  stringBounder: StringBounder,
): { posx1: number; posx2: number; dimSmall: XDimension2D; dimDesc: XDimension2D; dimStereo: XDimension2D } {
  const dimSmall = asSmall.calculateDimension(stringBounder);
  const dimDesc = desc.calculateDimension(stringBounder);
  const dimStereo = stereo.calculateDimension(stringBounder);
  const dimSmallWidth = dimSmall.getWidth();
  const posx1 = (dimSmallWidth - dimDesc.getWidth()) / 2;
  const posx2 = (dimSmallWidth - dimStereo.getWidth()) / 2;
  return { posx1, posx2, dimSmall, dimDesc, dimStereo };
}

/** Narrows `ug` to `UGraphicWithGroups` — duplicated locally per
 *  `DecorateEntityImage.ts`'s/`Cluster.ts`'s own one-local-helper-
 *  per-call-site convention (that module's own `requireGroups` is not
 *  exported). */
export function requireGroups(ug: UGraphic): UGraphicWithGroups {
  const candidate = ug as Partial<UGraphicWithGroups>;
  if (typeof candidate.startGroup !== 'function' || typeof candidate.closeGroup !== 'function') {
    throw new Error('EntityImageDescription: ug does not support startGroup/closeGroup (see UGraphicSvg)');
  }
  return ug as UGraphicWithGroups;
}
