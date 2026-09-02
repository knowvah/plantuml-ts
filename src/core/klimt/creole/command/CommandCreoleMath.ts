/**
 * CommandCreoleMath — `<math>expr</math>`.
 *
 * Upstream: klimt/creole/command/CommandCreoleMath.java, the exact sibling of
 * `CommandCreoleLatex` — same `starters()`/`matchingSize`/`executeAndAdvance`
 * shape over `Splitter.mathPattern` (`\<math\>(.+?)\</math\>`,
 * `command/Splitter.java:79`), differing only in which factory builds the
 * equation:
 *
 * ```java
 * final String math = m.group(2);
 * stripe.addMath(ScientificEquationSafe.fromAsciiMath(math));
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleMath.java:71-81
 *
 * `<math>` is ASCIIMath notation, not LaTeX: `fromAsciiMath` runs it through
 * `ASCIIMathTeXImg#getTeX` first (`math/AsciiMath.java:53-56`) and the
 * resulting LaTeX is what gets drawn. `<latex>` skips that conversion —
 * `fromLatex` stores its argument unchanged — which is the one and only
 * difference between the two tags downstream.
 *
 * Both end at the same place in this port: a `CreoleAtom` `'latex'` variant
 * drawn through `core/latex.ts#renderLatexAsImage` (KaTeX, NOT upstream's
 * JLaTeXMath). That rendering is a PERMANENT, maintainer-approved divergence
 * — `DIVERGENCES.md`, "LaTeX rendering engine", which names `<math>`
 * explicitly. Element structure is conformant; image bytes and glyph metrics
 * never will be. Do not file a fixture's residual here as a defect.
 */
import type { Command } from './Command.js';
import { ScientificEquationSafe } from '../../../math/ScientificEquationSafe.js';

const MATH_TAG_SOURCE = '<math>(.+?)</math>';

/** Upstream: `CommandCreoleMath.create()`. No EOL variant exists upstream,
 *  exactly as for `<latex>`: a `<math>` tag always needs its closing tag. */
export function createMathCommand(): Command {
  const re = new RegExp('^' + MATH_TAG_SOURCE);
  return {
    starters: ['<m'],
    matchingSize(line, pos) {
      const m = re.exec(line.slice(pos));
      return m === null ? 0 : m[0].length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = re.exec(line.slice(pos));
      if (m === null) return 0;
      const equation = ScientificEquationSafe.fromAsciiMath(m[1]!);
      // `fromAsciiMath` swallows a conversion failure and yields an instance
      // whose equation is null (java:71-79). Upstream's DRAWING paths then
      // fall back to `GraphicStrings.createBlackOnWhiteMonospaced(formula)`
      // (`ScientificEquationSafe.java:118-127,137-144`) — the raw formula as
      // text — rather than propagating it, so a malformed expression degrades
      // to visible source instead of failing the render.
      if (equation.hasEquation()) stripe.pushLatexAtom(equation.getSource());
      else stripe.analyzeAndAddInline(equation.getFormula());
      return m[0].length;
    },
  };
}
