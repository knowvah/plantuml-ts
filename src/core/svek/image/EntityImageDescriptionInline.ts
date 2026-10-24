/**
 * EntityImageDescriptionInline — the description engine's draw of one
 * resolved `<img>`/`<$sprite>` inline atom (`descAtomOps#drawU`'s tail).
 *
 * Split out of `EntityImageDescriptionDelegates.ts` as a pure move (its
 * `drawResolvedInline` function and the `ResolvedAtomImageWithRaster` type,
 * bodies and comments unchanged) to keep that file under the 500-line cap
 * once `descAtomOps` gained the `'vertical'` (`AtomVerticalTexts`) branch.
 */
import type { UGraphic } from '../../klimt/UGraphic.js';
import { Fore } from '../../klimt/Fore.js';
import { Back } from '../../klimt/Back.js';
import { UImage } from '../../klimt/shape/UImage.js';
import type { AtomImageResolver } from '../../creole-atoms.js';
import { spriteHrefOver } from '../../klimt/sprite/sprite-tint.js';

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
export type ResolvedAtomImageWithRaster =
  | (Extract<ReturnType<AtomImageResolver>, { readonly kind: 'image' }> & {
      readonly rasterWidth?: number;
      readonly rasterHeight?: number;
    })
  | Exclude<ReturnType<AtomImageResolver>, { readonly kind: 'image' }>;

export function drawResolvedInline(ug: UGraphic, resolved: NonNullable<ResolvedAtomImageWithRaster>): void {
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
    ug.draw(
      UImage.build(resolved.width, resolved.height, spriteHrefOver(resolved, ug.getParam().getBackcolor()), rasterDims),
    );
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
      ug.apply(primitive.translate)
        .apply(new Fore(primitive.fore))
        .apply(new Back(primitive.back))
        .apply(primitive.stroke)
        .draw(primitive.shape);
    }
  }
}
