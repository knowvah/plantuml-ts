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
 *    of the SAME string `fromLatex` received — verified identical to
 *    `getFormula()`'s value for every instance this port can construct, so
 *    the two fields are set from one constructor argument rather than
 *    threading a second, always-equal value through a fake "equation"
 *    layer.
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
 * ## NOT PORTED — `fromAsciiMath` (java:71-79) — a genuinely large,
 * separable follow-on, cited rather than silently dropped
 *
 * `fromAsciiMath`'s only two callers anywhere upstream are
 * `CommandCreoleMath.java` (a `<math>...</math>` creole command, sibling of
 * `CommandCreoleLatex` but never built in this port) and
 * `math/PSystemMath.java` (the `@startmath` diagram type, also never
 * built) — both genuinely unported, not "no caller today" in the ADR-8
 * corollary's forbidden sense (see `decisions.md`'s corollary: "not ported
 * yet" is never "unreachable" on its own, but a member IS droppable when
 * porting it needs a whole separate, large, unbuilt subsystem). Tracing
 * what `fromAsciiMath` itself needs: `new AsciiMath(formula)`
 * (`math/AsciiMath.java`, 79 lines) immediately calls `new
 * ASCIIMathTeXImg().getTeX(form)` (`math/ASCIIMathTeXImg.java`, 1032
 * lines) — a full ASCIIMath-notation-to-LaTeX parser/converter, a
 * standalone algorithm with zero relationship to `StripeLatex`/`AtomMath`
 * (this task's actual write-set targets) or to `core/latex.ts`'s KaTeX
 * binding. Porting it would mean adding a fourth file (`ASCIIMathTeXImg.ts`)
 * outside this task's declared write-set for a class this task's own
 * callers never reach. Per this task's own boundaries ("any file outside
 * the write-set -> STOP and report") and the established batch pattern
 * for exactly this shape (`StripeTree.ts`'s `blockedOnStripeTable`,
 * `StripeStyle.ts`'s `blockedOnAtomLayer`, `CreoleParser.ts`'s
 * `blockedOnSibling`), `fromAsciiMath` is NOT silently dropped — it throws
 * a cited, labelled seam naming the exact blocker, at the same point
 * upstream's own real work begins (`AsciiMath`'s constructor).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/math/ScientificEquationSafe.java
 */

/** Cited, thrown seam for `fromAsciiMath` — see this file's own module
 *  doc comment for the full reasoning. Mirrors `StripeTree.ts`'s
 *  `blockedOnStripeTable`/`StripeStyle.ts`'s `blockedOnAtomLayer` shape
 *  (no shared helper is exported anywhere in this batch — each file
 *  declares its own). */
function blockedOnAsciiMath(): Error {
  return new Error(
    'ScientificEquationSafe.fromAsciiMath: needs math/AsciiMath.java (79 ' +
      "lines), whose constructor immediately calls " +
      'math/ASCIIMathTeXImg.java (1032 lines, a full ASCIIMath-notation-to-' +
      'LaTeX parser) -- neither is ported, and both are genuinely large, ' +
      'separable follow-ons outside this file\'s write-set (T10e). ' +
      'fromAsciiMath\'s only two upstream callers -- CommandCreoleMath.java ' +
      '(<math> creole command) and math/PSystemMath.java (@startmath ' +
      'diagram type) -- are themselves not built in this port, so reaching ' +
      'this is a build/test-time signal only, not a runtime one in any ' +
      'shipped path today.',
  );
}

export class ScientificEquationSafe {
  private constructor(
    private readonly formula: string,
    private readonly source: string,
  ) {}

  /** java:81-89. See this file's own module doc comment for why upstream's
   *  try/catch has no reachable catch branch here. */
  static fromLatex(formula: string): ScientificEquationSafe {
    return new ScientificEquationSafe(formula, formula);
  }

  /** java:71-79. Always throws — see this file's own module doc comment's
   *  `fromAsciiMath` section. Signature matches upstream's
   *  (`formula: string -> ScientificEquationSafe`) even though the body
   *  never returns, mirroring `StripeTree.ts#analyzeAndAdd`'s identical
   *  "throw, keep the real signature" shape. */
  static fromAsciiMath(_formula: string): ScientificEquationSafe {
    throw blockedOnAsciiMath();
  }

  /** java:163-165. */
  getFormula(): string {
    return this.formula;
  }

  /** java:167-169 (`equation.getSource()`) — see this file's own module
   *  doc comment for why this equals `getFormula()` for every instance
   *  this port constructs. */
  getSource(): string {
    return this.source;
  }
}
