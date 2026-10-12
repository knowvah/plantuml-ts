/**
 * Vertical constructions: `FractionAtom`, `NthRoot`, `FencedAtom` and the
 * `DelimiterFactory` they size delimiters with (JLaTeXMath 1.0.7,
 * `~/git/plantuml/gradle/libs.versions.toml:12`).
 */
import type { BuildBox, Delimiter, FencedAtom, FractionAtom, NthRootAtom } from './atoms.js';
import { leftType, rightType } from './atoms.js';
import type { Box } from './box.js';
import { ALIGN_CENTER, VBox, hbox, hboxAligned, strutBox } from './box.js';
import { glueBox, scaledCharBox } from './row.js';
import {
  ROOT_STYLE,
  STYLE_TEXT,
  TEX_ICON_SIZE,
  TYPE_CLOSING,
  TYPE_OPENING,
  crampStyle,
  denomStyle,
  muUnit,
  numStyle,
  param,
  sizeFactor,
  xHeight,
} from './tex-font.js';

/** `FractionAtom.java:289`: `\nulldelimiterspace`, 0.12 em each side. */
const NULL_DELIMITER_SPACE_EM = 0.12;

/** `FractionAtom.java:216-228`: the default shift amounts. */
function fractionShifts(style: number, thickness: number): Shifts {
  if (style < STYLE_TEXT) return { shiftUp: param('num1', style), shiftDown: param('denom1', style) };
  return {
    shiftUp: thickness > 0 ? param('num2', style) : param('num3', style),
    shiftDown: param('denom2', style),
  };
}

/** The equal-width numerator and denominator boxes and the rule. */
interface FractionParts {
  num: Box;
  denom: Box;
  thickness: number;
}

/** Mutable shift amounts the clearance rules raise. */
interface Shifts {
  shiftUp: number;
  shiftDown: number;
}

/** `FractionAtom.java:237-261`: WITH a rule, kerns either side of it. */
function fillRuled(v: VBox, parts: FractionParts, style: number, s: Shifts): void {
  const { num, denom, thickness } = parts;
  const axis = param('axisheight', style);
  const clr = style < STYLE_TEXT ? 3 * thickness : thickness;
  const delta = thickness / 2;
  let kern1 = s.shiftUp - num.depth - (axis + delta);
  let kern2 = axis - delta - (denom.height - s.shiftDown);
  const delta1 = clr - kern1;
  const delta2 = clr - kern2;
  if (delta1 > 0) {
    s.shiftUp += delta1;
    kern1 += delta1;
  }
  if (delta2 > 0) {
    s.shiftDown += delta2;
    kern2 += delta2;
  }
  v.add(strutBox(0, kern1, 0))
    .add(strutBox(num.width, thickness, 0))
    .add(strutBox(0, kern2, 0));
}

/** `FractionAtom.java:262-281`: WITHOUT a rule, one kern. */
function fillRuleless(v: VBox, parts: FractionParts, style: number, s: Shifts): void {
  const { num, denom } = parts;
  const drt = param('defaultrulethickness', style);
  const clr = style < STYLE_TEXT ? 7 * drt : 3 * drt;
  let kern = s.shiftUp - num.depth - (denom.height - s.shiftDown);
  const delta = (clr - kern) / 2;
  if (delta > 0) {
    s.shiftUp += delta;
    s.shiftDown += delta;
    kern += 2 * delta;
  }
  v.add(strutBox(0, kern, 0));
}

/**
 * `FractionAtom#createBox` (`FractionAtom.java:195-292`). The rule is the
 * default rule thickness (`FractionAtom(num, den, true)` → `noDefault`
 * false, java:93-95); a rule-less fraction (`\atop`, `\binom`) has none.
 */
export function fractionBox(atom: FractionAtom, style: number, build: BuildBox): Box {
  let num = atom.num === undefined ? strutBox(0, 0, 0) : build(atom.num, numStyle(style));
  let denom = atom.den === undefined ? strutBox(0, 0, 0) : build(atom.den, denomStyle(style));
  if (num.width < denom.width) num = hboxAligned(num, denom.width, ALIGN_CENTER);
  else denom = hboxAligned(denom, num.width, ALIGN_CENTER);
  const thickness = atom.rule ? param('defaultrulethickness', style) : 0;
  const s = fractionShifts(style, thickness);
  const v = new VBox().add(num);
  (thickness > 0 ? fillRuled : fillRuleless)(v, { num, denom, thickness }, style, s);
  v.add(denom);
  v.box.height = s.shiftUp + num.height;
  v.box.depth = s.shiftDown + denom.depth;
  const f = NULL_DELIMITER_SPACE_EM * sizeFactor(style);
  return hboxAligned(v.box, v.box.width + 2 * f, ALIGN_CENTER);
}

/** `DelimiterFactory.create(symbol, env, minHeight)` (`DelimiterFactory.java`):
 *  the smallest successor tall enough, else the tallest. Extensible
 *  delimiters (`Extension` pieces) are not modelled: past the largest
 *  glyph KaTeX exposes, the largest is returned. */
export function delimiterBox(delim: Delimiter, style: number, minHeight: number): Box {
  let chosen = scaledCharBox(
    delim.sizes[0] ?? { glyph: { width: 0, height: 0, depth: 0, italic: 0 }, xHeight: 0 },
    style,
  );
  for (const size of delim.sizes.slice(1)) {
    if (chosen.height + chosen.depth >= minHeight) break;
    chosen = scaledCharBox(size, style);
  }
  return chosen;
}

/** `FencedAtom.java:60-62`. */
const DELIMITER_FACTOR = 901;
const DELIMITER_SHORTFALL = 5;

/** `FencedAtom#center` (java:112-115). */
function center(box: Box, axis: number): Box {
  const total = box.height + box.depth;
  box.shift = -(total / 2 - box.height) - axis;
  return box;
}

/** `FencedAtom#createBox` (`FencedAtom.java:117-170`); `\middle` is not
 *  modelled. */
export function fencedBox(atom: FencedAtom, style: number, build: BuildBox): Box {
  const content = build(atom.body, style);
  const shortfall = DELIMITER_SHORTFALL / TEX_ICON_SIZE;
  const axis = param('axisheight', style);
  const delta = Math.max(content.height - axis, content.depth + axis);
  const minHeight = Math.max((delta / 500) * DELIMITER_FACTOR, 2 * delta - shortfall);
  const parts: Box[] = [];
  if (atom.left !== undefined) parts.push(center(delimiterBox(atom.left, style, minHeight), axis));
  const isSpace = atom.body.kind === 'space';
  if (!isSpace) parts.push(glueBox(TYPE_OPENING, leftType(atom.body), style));
  parts.push(content);
  if (!isSpace) parts.push(glueBox(rightType(atom.body), TYPE_CLOSING, style));
  if (atom.right !== undefined) parts.push(center(delimiterBox(atom.right, style, minHeight), axis));
  return hbox(...parts);
}

/** `NthRoot.java:56`. */
const ROOT_FACTOR = 0.55;
/** The radical glyphs' TFM height, the rule thickness every size shares
 *  (`fonts/maths/jlm_cmsy10.xml:205`, `fonts/base/jlm_cmex10.xml:303-312`);
 *  KaTeX re-centres its radical metrics, so only their total is taken. */
const RADICAL_HEIGHT = 0.039999;

/** The radical as `NthRoot` sees it: TFM height, the rest as depth. */
function radicalBox(root: Delimiter, style: number, minHeight: number): Box {
  const b = delimiterBox(root, style, minHeight);
  const h = RADICAL_HEIGHT * sizeFactor(style);
  return { ...b, depth: b.height + b.depth - h, height: h };
}

/** `NthRoot#createBox` (`NthRoot.java:69-127`), for the radical `root`. */
export function nthRootBox(atom: NthRootAtom, style: number, build: BuildBox, root: Delimiter): Box {
  const drt = param('defaultrulethickness', style);
  let clr = drt + Math.abs(style < STYLE_TEXT ? xHeight(style, undefined) : drt) / 4;
  const b = hbox(build(atom.body, crampStyle(style)), strutBox(muUnit(crampStyle(style)), 0, 0));
  const totalH = b.height + b.depth;
  const rootSign = radicalBox(root, style, totalH + clr + drt);
  clr += (rootSign.depth - (totalH + clr)) / 2;
  rootSign.shift = -(b.height + clr);
  const ob = new VBox().add(strutBox(0, rootSign.height, 0)).add(strutBox(b.width, rootSign.height, 0));
  ob.add(strutBox(0, clr, 0)).add(b);
  ob.box.shift = -(b.height + clr + drt);
  const squareRoot = hbox(rootSign, ob.box);
  if (atom.index === undefined) return squareRoot;
  const r = build(atom.index, ROOT_STYLE);
  r.shift = squareRoot.depth - r.depth - ROOT_FACTOR * (squareRoot.height + squareRoot.depth);
  const negativeKern = strutBox(-10 * muUnit(style), 0, 0);
  const pos = r.width + negativeKern.width;
  return pos < 0 ? hbox(strutBox(-pos, 0, 0), r, negativeKern, squareRoot) : hbox(r, negativeKern, squareRoot);
}
