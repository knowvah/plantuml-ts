/**
 * ScientificEquationSafe — upstream: math/ScientificEquationSafe.java (171
 * lines). T10e (batch 3a) — the third file `StripeLatex#getAtom` needs
 * (java:91, `ScientificEquationSafe.fromLatex(formula.toString())`), behind
 * `AtomMath.ts`.
 *
 * ## Ported: the value-object surface reachable without rasterization
 *
 *  - `fromLatex(String)` (java:81-89, `LatexBuilder(tex)` construction) —
 *    `LatexBuilder`'s constructor (`math/LatexBuilder.java:56-58`) is a bare
 *    field assignment that cannot throw, so upstream's surrounding
 *    try/catch (which exists only to guard `new LatexBuilder(formula)`
 *    against a checked/runtime exception neither this port's TS
 *    constructor call nor `LatexBuilder`'s own body can raise) has no
 *    reachable catch branch to preserve — ported as a direct construction.
 *  - `getFormula()` (java:163-165) — returns the raw constructor argument.
 *  - `getSource()` (java:167-169, `equation.getSource()`) — for the
 *    `fromLatex` path this is `LatexBuilder#getSource()`
 *    (`math/LatexBuilder.java:146-148`), a pure `return tex;` pass-through
 *    of the SAME string `fromLatex` received, so that path stores one
 *    constructor argument instead of threading a second, always-equal value
 *    through a fake "equation" layer. The `fromAsciiMath` path stores
 *    `AsciiMath#getSource()` (`math/AsciiMath.java:75-77`), which is the
 *    CONVERTED LaTeX and therefore differs from `getFormula()`.
 *  - `fromAsciiMath(String)` (java:71-79) — see its own section below.
 *
 * ## NOT PORTED — `getSvg`/`getImage`/`export`/`printTrace`/`getRollback`
 * (java:91-161) — an architectural boundary, not a gap
 *
 * Every one of these methods routes through upstream's raster/vector image
 * pipeline: `PortableImage`, `MutableImage`, `UImageSvg`, `EpsGraphics`,
 * `SImageIO`, `GraphicStrings`, `TextBlockExporter` — none of which exist
 * in this port, and none of which COULD exist without contradicting
 * `CLAUDE.md`'s architecture notes ("Pure SVG renderer — no DOM, no async,
 * no canvas... never use Node built-ins"). This port renders `<latex>`
 * math as inline KaTeX MathML (`core/latex.ts`) instead of rasterizing
 * JLaTeXMath output to a PNG/EPS/embedded-SVG image — a deliberate,
 * pre-existing architectural substitution (`CommandCreoleLatex.ts`'s own
 * doc comment; `EntityImageDescriptionSupport.ts`'s established `'latex'`
 * `CreoleAtom` render path), not a filesystem/Node seam the way
 * `SignatureUtils.ts`'s "BLOCKED ON THE FILE SEAM" methods are. `AtomMath.ts`
 * (this task) binds directly to `core/latex.ts#measureLatex`/
 * `renderLatexAsImage` using `getSource()`'s formula string instead of
 * calling any of these methods — see that file's own doc comment.
 *
 * ## Ported: `fromAsciiMath` (java:71-79)
 *
 * `fromAsciiMath` runs `new AsciiMath(formula)` (`math/AsciiMath.java`), whose
 * constructor is `new ASCIIMathTeXImg().getTeX(form)` — the ASCIIMath-notation
 * to LaTeX converter, now transcribed at `core/math/ASCIIMathTeXImg.ts` and
 * wrapped by `core/math/AsciiMath.ts`. Upstream's `try`/`catch (Exception e)`
 * IS reachable here and is preserved: `getTeX` walks the formula with Java
 * string-bounds semantics, so a malformed formula raises rather than emitting
 * wrong LaTeX (see `ASCIIMathTeXImg.ts`'s module doc comment), and this method
 * answers that the way upstream does — with an equation-less
 * `ScientificEquationSafe(formula, null)`, not a throw. Upstream's two
 * logging calls in that catch (`Logme.error(e)`, `Log.info(...)`) have no
 * counterpart in this port, which has no logging seam; the same omission
 * `EmbeddedDiagram.ts` already documents for its own `Logme.error` catches.
 *
 * The `equation` field is modelled as the nullable `source` string rather than
 * a `ScientificEquation` object, because `getSource()` (java:167-169) is the
 * only member this port reads it through — see `getSource`'s own comment for
 * what happens on the null branch.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/math/ScientificEquationSafe.java
 */

import { AsciiMath } from './AsciiMath.js';

export class ScientificEquationSafe {
  /** java:66-69. `source === null` models upstream's `equation == null`,
   *  the state `fromAsciiMath`/`fromLatex` fall back to on a parse failure. */
  private constructor(
    private readonly formula: string,
    private readonly source: string | null,
  ) {}

  /** java:81-89. See this file's own module doc comment for why upstream's
   *  try/catch has no reachable catch branch here. */
  static fromLatex(formula: string): ScientificEquationSafe {
    return new ScientificEquationSafe(formula, formula);
  }

  /** java:71-79. On any exception out of the converter, upstream logs and
   *  returns an equation-less instance rather than propagating — see this
   *  file's own module doc comment. */
  static fromAsciiMath(formula: string): ScientificEquationSafe {
    try {
      return new ScientificEquationSafe(formula, new AsciiMath(formula).getSource());
    } catch {
      // Logme.error(e); Log.info(() -> "Error parsing " + formula);
      return new ScientificEquationSafe(formula, null);
    }
  }

  /** java:163-165. */
  getFormula(): string {
    return this.formula;
  }

  /** Upstream's own `equation != null` guard, which every DRAWING path
   *  tests before touching the equation — `getSvg` (java:118) and `getImage`
   *  (java:137) both fall back to
   *  `GraphicStrings.createBlackOnWhiteMonospaced(formula)` when it fails,
   *  i.e. they draw the RAW formula rather than propagating the failure.
   *  Exposed as a predicate so a caller can take that same fallback without
   *  provoking {@link getSource}'s NullPointerException, which upstream only
   *  ever reaches from `printTrace` (java:132, itself behind this guard). */
  hasEquation(): boolean {
    return this.source !== null;
  }

  /** java:167-169. Upstream is a bare `equation.getSource()`, so a
   *  fallback instance (`equation == null`, java:77) throws a
   *  NullPointerException here; this raises the same way rather than
   *  inventing an empty-string result upstream never produces. For a
   *  `fromLatex` instance the value is the constructor argument unchanged
   *  (`LatexBuilder#getSource`, `math/LatexBuilder.java:146-148`). */
  getSource(): string {
    if (this.source === null) {
      throw new Error(
        'NullPointerException: ScientificEquationSafe#getSource on an ' +
          'instance whose formula failed to parse',
      );
    }
    return this.source;
  }
}
