/**
 * AsciiMath — upstream: `math/AsciiMath.java` (79 lines). The thin adapter
 * that turns an ASCIIMath formula into LaTeX: its constructor (java:54-57)
 * runs `new ASCIIMathTeXImg().getTeX(form)` and keeps the result, and
 * `getSource()` (java:75-77) hands that LaTeX back.
 *
 * ## NOT PORTED — `getDimension`/`getSvg`/`getImage` (java:59-73)
 *
 * All three delegate to the `LatexBuilder` field that upstream's constructor
 * builds alongside `tex` (java:56). `LatexBuilder` is JLaTeXMath rasterisation
 * — `PortableImage`, `MutableImage`, `UImageSvg`, `EpsGraphics` — none of
 * which exist in this port and none of which could, per `CLAUDE.md`'s pure-SVG
 * architecture. This port renders math as inline KaTeX MathML via
 * `core/latex.ts` from the `getSource()` string instead, the same
 * substitution `ScientificEquationSafe.ts` and `AtomMath.ts` already document
 * for the `<latex>` path. Dropping the `builder` field therefore drops
 * nothing reachable: `getSource()` never touches it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/math/AsciiMath.java
 */
import { ASCIIMathTeXImg } from './ASCIIMathTeXImg.js';

export class AsciiMath {
  private readonly tex: string;

  /**
   * java:54-57. Upstream declares `throws ScriptException,
   * NoSuchMethodException` for `LatexBuilder`'s benefit; `getTeX` itself
   * declares nothing but can still raise (see `ASCIIMathTeXImg.ts`'s module
   * doc comment on Java string-bounds exceptions), which is exactly what
   * `ScientificEquationSafe.fromAsciiMath`'s catch is there for.
   */
  constructor(form: string) {
    this.tex = new ASCIIMathTeXImg().getTeX(form);
  }

  /** java:75-77. */
  getSource(): string {
    return this.tex;
  }
}
