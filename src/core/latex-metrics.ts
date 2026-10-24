/**
 * The size of a `<latex>` image, by the rule upstream sizes it with.
 *
 * Upstream: `AtomMath#calculateDimensionSlow` (`klimt/creole/atom/
 * AtomMath.java:64-71`) measures `math.getImage(…).withScale(1)`, which
 * `LatexBuilder.LatexImage#getImage` (`math/LatexBuilder.java:104-118`)
 * sizes `(int)(icon.getIconWidth() * scale)` × `(int)(icon.getIconHeight()
 * * scale)`; the SVG path (`LatexBuilder#getSvg`, java:72-80, through
 * `ConverterSvg.java:103`) uses the same icon dimensions. The icon is
 * `TeXIconBuilder`'s (`math/TeXIconBuilder.java:52-73`): display style
 * (`setStyle(0)`), size 20, then `setInsets(new Insets(1, 1, 1, 1))`.
 *
 * JLaTeXMath then sizes the icon from the formula's box (`TeXIcon.java`,
 * JLaTeXMath 1.0.7, `~/git/plantuml/gradle/libs.versions.toml:12`):
 *
 *     getIconWidth()  = (int)(box.width * size + 0.99 + insets.left + insets.right)
 *     getIconHeight() = (int)(box.height * size + 0.99 + insets.top)
 *                     + (int)(box.depth * size + 0.99 + insets.bottom)
 *
 * and `setInsets(insets)` adds `(int)(0.18f * size)` to every side
 * (`TeXIcon.java:141-157`, `trueValues` false), so each inset is
 * 1 + (int)3.6 = 4.
 *
 * The box is built by JLaTeXMath's typesetting rules (`latex-metrics/`)
 * over KaTeX's parse tree and KaTeX's Computer Modern glyph metrics; the
 * library divergence (KaTeX draws, JLaTeXMath does not) is DIVERGENCES.md
 * "LaTeX rendering engine".
 */
import type { Atom, Delimiter } from './latex-metrics/atoms.js';
import type { Box } from './latex-metrics/box.js';
import { strutBox } from './latex-metrics/box.js';
import type { Context } from './latex-metrics/convert.js';
import { fencedBox, fractionBox, nthRootBox } from './latex-metrics/fraction.js';
import { parseLatex } from './latex-metrics/katex-glyphs.js';
import { matrixBox } from './latex-metrics/matrix.js';
import { formulaRoot } from './latex-metrics/nodes.js';
import { charAtomBox, rowBox, spaceBox } from './latex-metrics/row.js';
import { bigOperatorBox, scriptsBox } from './latex-metrics/scripts.js';
import { STYLE_DISPLAY, TEX_ICON_SIZE, XHEIGHT_CM } from './latex-metrics/tex-font.js';

/** `TeXIconBuilder.java:68`: `final int margin = 1`. */
const TEX_ICON_MARGIN = 1;
/** `TeXIcon.java:144-147`: `(int)(0.18f * size)` added to each inset. */
const TEX_ICON_INSET = TEX_ICON_MARGIN + Math.trunc(0.18 * TEX_ICON_SIZE);
/** `TeXIcon.java:195,210`: the `0.99` each dimension is rounded up by. */
const TEX_ICON_ROUND_UP = 0.99;

/**
 * The radical `NthRoot` draws (`sqrtSymbol = "sqrt"`, `NthRoot.java:54`):
 * the `jlm_cmsy10` glyph and its four `jlm_cmex10` successors
 * (`fonts/maths/jlm_cmsy10.xml:205-207`, `fonts/base/jlm_cmex10.xml:303-314`).
 * KaTeX draws its radical as SVG and exposes no probe for it, so the
 * metrics are KaTeX's `"8730"` entries, `[depth, height, italic, skew,
 * width]`: Main-Regular `fontMetricsData.js:1089`, Size1 `:1815`, Size2
 * `:1857`, Size3 `:1893`, Size4 `:1916`.
 */
const SQRT_DELIMITER: Delimiter = {
  sizes: [
    [0.2, 0.8, 0.83334],
    [0.35001, 0.85, 1.0],
    [0.65002, 1.15, 1.0],
    [0.95003, 1.45, 1.0],
    [1.25003, 1.75, 1.0],
  ].map(([depth = 0, height = 0, width = 0]) => ({ glyph: { width, height, depth, italic: 0 }, xHeight: XHEIGHT_CM })),
};

type Builders = { [K in Atom['kind']]: (atom: Extract<Atom, { kind: K }>, style: number) => Box };

/** `Atom#createBox`, per atom kind. */
const BUILDERS: Builders = {
  char: charAtomBox,
  row: (atom, style) => rowBox(atom.elements, style, createBox),
  space: spaceBox,
  scripts: (atom, style) => scriptsBox(atom, style, createBox),
  bigop: (atom, style) => bigOperatorBox(atom, style, createBox),
  frac: (atom, style) => fractionBox(atom, style, createBox),
  sqrt: (atom, style) => nthRootBox(atom, style, createBox, SQRT_DELIMITER),
  fenced: (atom, style) => fencedBox(atom, style, createBox),
  matrix: (atom, style) => matrixBox(atom, style, createBox),
  typed: (atom, style) => createBox(atom.body, style),
  wrap: (atom, style) => createBox(atom.body, atom.style ?? style),
  break: () => strutBox(0, 0, 0),
  phantom: (atom, style) => {
    const b = createBox(atom.body, style);
    return strutBox(0, b.height, b.depth, b.shift);
  },
};

function dispatch<K extends Atom['kind']>(atom: Extract<Atom, { kind: K }>, style: number): Box {
  const build: Builders[K] = BUILDERS[atom.kind];
  return build(atom, style);
}

/** `Atom#createBox`. */
function createBox(atom: Atom, style: number): Box {
  return dispatch(atom, style);
}

/** A `<latex>` image's size, and the formula parts sized approximately. */
export interface TeXIconSize {
  width: number;
  height: number;
  /** KaTeX node kinds or glyphs this port does not size by JLaTeXMath's
   *  rules; empty when the size follows them throughout. */
  unsupported: readonly string[];
}

/** `TeXIcon#getIconWidth`/`getIconHeight` for a formula box. */
export function texIconDimension(box: Pick<Box, 'width' | 'height' | 'depth'>): { width: number; height: number } {
  const s = TEX_ICON_SIZE;
  return {
    width: Math.trunc(box.width * s + TEX_ICON_ROUND_UP + 2 * TEX_ICON_INSET),
    height:
      Math.trunc(box.height * s + TEX_ICON_ROUND_UP + TEX_ICON_INSET) +
      Math.trunc(box.depth * s + TEX_ICON_ROUND_UP + TEX_ICON_INSET),
  };
}

/**
 * The size JLaTeXMath gives `expr`'s image (`TeXIconBuilder` + `TeXIcon`).
 * A formula KaTeX cannot parse sizes as the empty formula
 * (`TeXFormula#createBox`'s `StrutBox(0, 0, 0, 0)` for a null root,
 * `TeXFormula.java:578-583`) and is reported unsupported.
 */
export function measureTeXIcon(expr: string): TeXIconSize {
  const ctx: Context = { mode: 'math', font: undefined, bold: false, unsupported: new Set() };
  let root: Atom | undefined;
  try {
    root = formulaRoot(parseLatex(expr), ctx);
  } catch {
    // KaTeX's parse error is not JLaTeXMath's: the formula is sized empty
    // and flagged, never thrown at a renderer.
    ctx.unsupported.add('katex-parse-error');
  }
  const box = root === undefined ? strutBox(0, 0, 0) : createBox(root, STYLE_DISPLAY);
  return { ...texIconDimension(box), unsupported: [...ctx.unsupported] };
}
