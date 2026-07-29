/**
 * AtomMath — upstream: klimt/creole/atom/AtomMath.java (`extends
 * AbstractAtom implements Atom`, 107 lines). T10e (batch 3a). Wraps one
 * `ScientificEquationSafe` (the accumulated `<latex>...</latex>` formula)
 * as a measurable/drawable `Atom`, matching `AtomWithMargin.ts`/
 * `AtomTree.ts`'s established "OOP `Atom` implementor bound to this port's
 * OOP `Atom` interface (`SheetBlock1.ts`), not the data-oriented
 * `CreoleAtom` union" shape — `AtomMath` IS the whole `StripeLatex` block
 * (a compound atom, like `AtomTree`), not a flat text/inline/latex token,
 * so this is NOT the ADR-9 `CreoleAtom`/`AtomOps` pattern (that pattern is
 * for atoms `Sea`/`Position`/`SheetBlock1` iterate polymorphically inside
 * ONE physical line; `AtomMath` is constructed directly by `StripeLatex`
 * the same way `AtomWithMargin`/`AtomTree` are constructed directly by
 * `StripeTree`).
 *
 * Ported: the class shape (constructor, `getStartingAltitude`).
 *
 * ## `calculateDimensionSlow`/`drawU` — bound to `core/latex.ts`, NOT a
 * second math-rendering path
 *
 * Upstream's real bodies rasterize: `calculateDimensionSlow` builds a
 * `PortableImage` via `math.getImage(...)` and reads its pixel dimensions;
 * `drawU` builds a `UImageSvg`/`UImage` from the SAME raster/vector
 * pipeline. `ScientificEquationSafe.ts`'s own module doc comment documents
 * why that pipeline is not ported (architectural boundary — this port
 * renders `<latex>` as inline KaTeX MathML, not a rasterized image).
 * `calculateDimensionSlow` instead calls `core/latex.ts#measureLatex(math
 * .getSource())` directly; `drawU` calls `core/latex.ts#renderLatexAsImage
 * (math.getSource(), foreground)` and draws the result via `UImage.build`
 * — the EXACT SAME two functions, called the EXACT SAME way,
 * `EntityImageDescriptionSupport.ts`'s pre-existing `atom.kind === 'latex'`
 * branch already uses for the data-oriented `CreoleAtom` `'latex'` variant
 * (`measureAtomsWidthHeight`/`drawAtoms`). Binding here reuses that one
 * existing encoding of "how a latex expression becomes a measured,
 * drawable thing" rather than inventing a second — `renderLatexAsImage`
 * internally calls `measureLatex` for its own `{width, height}`
 * (`latex.ts`'s own body), so `calculateDimensionSlow`'s and `drawU`'s
 * dimensions agree by construction, matching upstream's own "draw what you
 * measured" invariant.
 *
 * `stringBounder.matchesProperty("TIKZ")` (java:66-68, `calculateDimensionSlow`'s
 * first branch) is NOT ported: this port's `StringBounder` interface has no
 * `matchesProperty` member at all — the SAME pre-existing, architectural
 * decision `Sea.ts`'s own doc comment already documents in full ("this is a
 * pure SVG renderer... with no other output backend... TIKZ is an OUTPUT
 * FORMAT this port's architecture forecloses outright"). Not re-derived
 * here; cited.
 *
 * `ug.getColorMapper()`/`ug.matchesProperty("SVG")` (java:80-96,
 * `drawU`'s `ColorMapper`/`isSvg` branching) are NOT ported: `UGraphic.ts`'s
 * own doc comment documents `getColorMapper()` as dropped in the T2 scope
 * reduction ("every other upstream member... depends on machinery this
 * task does not port (`ColorMapper`...)"), and `matchesProperty` is the
 * same architectural drop `Sea.ts` cites above. Since this port has no
 * other output backend, it is unconditionally the `isSvg === true` branch
 * in effect — there is no raster fallback to select between. `getColor`
 * (java:100-106, `HColorSimple` instanceof + `ColorMapper` resolution) is
 * likewise not needed: this port's colors arrive PRE-RESOLVED as plain CSS
 * strings (`UText.ts`'s `FontConfiguration.color: string | null` — the
 * same "already-resolved SVG-ready color string" state `StripeCode.ts`'s
 * own doc comment documents for the identical `HColor`-is-not-ported gap).
 *
 * `!TeaVM.isTeaVM()` (java:79, `drawU`'s outer guard) is dropped — this
 * port has no TeaVM branch at all (`SignatureUtils.ts`'s established
 * precedent: "This port has no TeaVM branch at all... running identically
 * in Node and the browser, so there is no second runtime path to port"),
 * so `drawU`'s body always executes.
 *
 * ## `foreground`/`background`: `HColor` -> `string | null` (established
 * T2/T10 substitution)
 *
 * `HColor foreground`/`HColor background` (java constructor params) become
 * `string | null` — `HColor` is not ported anywhere in this port
 * (`Position.ts`'s own doc comment). `StripeLatex.ts`'s only caller sources
 * `foreground` from `fontConfiguration.color: string | null`
 * (`UText.ts`'s `FontConfiguration`, the SAME field `StripeSimple.ts
 * #pushLatexAtom` already uses for the data-oriented `'latex'` `CreoleAtom`
 * variant's own `color`). `background` is threaded for structural fidelity
 * with upstream's constructor shape, but is always `null` from
 * `StripeLatex.ts` (there is no `extendedColor`/background-color field on
 * this port's `FontConfiguration` to source a non-null value from — the
 * same `HColor` gap, not a new one) AND has no operation to apply it to
 * even if it were non-null: `core/latex.ts#renderLatexAsImage`/
 * `renderLatexMathML` take a single foreground `color` parameter and no
 * background at all (KaTeX's MathML `<foreignObject>` output paints no
 * background fill). Referenced with a no-op statement below so the field
 * is not silently write-only, mirroring `StripeTree.ts`'s identical
 * `void this.fieldName;` pattern for a stored-but-currently-inert field.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomMath.java
 */
import { AbstractAtom } from './AbstractAtom.js';
import { UImage } from '../../shape/UImage.js';
import { measureLatex, renderLatexAsImage } from '../../../latex.js';
import { XDimension2D } from '../../geom/XDimension2D.js';
import type { ScientificEquationSafe } from '../../../math/ScientificEquationSafe.js';
import type { UGraphic } from '../../UGraphic.js';
import type { StringBounder } from '../../font/StringBounder.js';
import type { Atom } from '../SheetBlock1.js';

/** Upstream's own `getColor` default when `foreground` is `null`
 *  (`XColor.BLACK`, java:88) — this port has no `XColor`, so the
 *  equivalent CSS black is used directly at the `renderLatexAsImage` call
 *  site rather than inventing a color-model class for one constant. */
const DEFAULT_FOREGROUND = '#000000';

export class AtomMath extends AbstractAtom implements Atom {
  private readonly math: ScientificEquationSafe;
  private readonly foreground: string | null;
  private readonly background: string | null;

  constructor(math: ScientificEquationSafe, foreground: string | null, background: string | null) {
    super();
    this.math = math;
    this.foreground = foreground;
    this.background = background;
  }

  protected calculateDimensionSlow(_stringBounder: StringBounder): XDimension2D {
    const { width, height } = measureLatex(this.math.getSource());
    return new XDimension2D(width, height);
  }

  getStartingAltitude(_stringBounder: StringBounder): number {
    return 0;
  }

  drawU(ug: UGraphic): void {
    // `background` is stored for structural fidelity with upstream's
    // constructor shape but is not applied -- see this file's own module
    // doc comment.
    void this.background;
    const resolved = renderLatexAsImage(this.math.getSource(), this.foreground ?? DEFAULT_FOREGROUND);
    ug.draw(UImage.build(resolved.width, resolved.height, resolved.href));
  }
}
