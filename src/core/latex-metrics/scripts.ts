/**
 * Sub- and superscripts and big-operator limits: `ScriptsAtom.createBox`
 * and `BigOperatorAtom.createBox` (JLaTeXMath 1.0.7,
 * `~/git/plantuml/gradle/libs.versions.toml:12`).
 */
import type { Atom, BigOperatorAtom, BuildBox, CharAtom, ScriptsAtom } from './atoms.js';
import { limitsOf } from './atoms.js';
import type { Box } from './box.js';
import { ALIGN_CENTER, ALIGN_LEFT, VBox, hbox, hboxAligned, strutBox } from './box.js';
import { PREC, glueBox, scaledCharBox } from './row.js';
import {
  STYLE_DISPLAY,
  STYLE_TEXT,
  TEX_ICON_SIZE,
  TYPE_BIG_OPERATOR,
  TYPE_BINARY_OPERATOR,
  crampStyle,
  param,
  sizeFactor,
  subStyle,
  supStyle,
  xHeight,
} from './tex-font.js';

/** `ScriptsAtom.SCRIPT_SPACE` (`ScriptsAtom.java:57`): 0.5 `UNIT_POINT`,
 *  i.e. PostScript points over the icon size. */
const SCRIPT_SPACE = 0.5 / TEX_ICON_SIZE;

/** The pieces `ScriptsAtom` derives from its base before placing scripts. */
interface BaseLayout {
  hor: Box[];
  delta: number;
  shiftUp: number;
  shiftDown: number;
  deltaSymbol: Box;
}

/** `base instanceof SymbolAtom && base.type == TYPE_BIG_OPERATOR`. */
const bigOpSymbol = (a: Atom | undefined): CharAtom | undefined =>
  a?.kind === 'char' && a.type === TYPE_BIG_OPERATOR ? a : undefined;

/** Shifts measured from a box that is not a lone glyph
 *  (`ScriptsAtom.java:128-129`, `:141-142`). */
function droppedShifts(h: Box, style: number): Pick<BaseLayout, 'shiftUp' | 'shiftDown'> {
  return {
    shiftUp: h.height - param('supdrop', supStyle(style)),
    shiftDown: h.depth + param('subdrop', subStyle(style)),
  };
}

/** `ScriptsAtom.java:110-129`: a lone big-operator symbol, display-sized
 *  on the axis, whose italic correction offsets the superscript. */
function layoutBigOpSymbol(atom: ScriptsAtom, base: CharAtom, style: number): BaseLayout {
  const c = style < STYLE_TEXT && base.larger !== undefined ? base.larger : base.glyph;
  const x = scaledCharBox(c, style);
  x.shift = -(x.height + x.depth) / 2 - param('axisheight', style);
  const delta = c.glyph.italic * sizeFactor(style);
  const hor = delta > PREC && atom.sub === undefined ? [x, strutBox(delta, 0, 0)] : [x];
  const deltaSymbol = glueBox(TYPE_BINARY_OPERATOR, TYPE_BIG_OPERATOR, style);
  return { hor, delta, ...droppedShifts(hbox(...hor), style), deltaSymbol };
}

/** `ScriptsAtom.java:130-139`: a lone glyph; its italic correction either
 *  pads a superscript-only base or offsets the superscript. */
function layoutCharBase(atom: ScriptsAtom, base: CharAtom, b: Box, style: number): BaseLayout {
  const italic = base.glyph.glyph.italic * sizeFactor(style);
  const none = strutBox(0, 0, 0);
  if (italic > PREC && atom.sub === undefined) {
    return { hor: [b, strutBox(italic, 0, 0)], delta: 0, shiftUp: 0, shiftDown: 0, deltaSymbol: none };
  }
  return { hor: [b], delta: italic, shiftUp: 0, shiftDown: 0, deltaSymbol: none };
}

/** `ScriptsAtom.java:105-143`: the base's own box and the preliminary
 *  shifts, by kind of base. */
function layoutBase(atom: ScriptsAtom, b: Box, style: number): BaseLayout {
  const base = atom.base;
  const op = bigOpSymbol(base);
  if (op !== undefined) return layoutBigOpSymbol(atom, op, style);
  if (base?.kind === 'char') return layoutCharBase(atom, base, b, style);
  return { hor: [b], delta: 0, ...droppedShifts(b, style), deltaSymbol: strutBox(0, 0, 0) };
}

/** `ScriptsAtom.java:164-172`: the superscript's shift-up floor. */
function supShift(shiftUp: number, x: Box, style: number, lastXHeight: number | undefined): number {
  let p: number;
  if (style === STYLE_DISPLAY) p = param('sup1', style);
  else if (crampStyle(style) === style) p = param('sup3', style);
  else p = param('sup2', style);
  return Math.max(Math.max(shiftUp, p), x.depth + Math.abs(xHeight(style, lastXHeight)) / 4);
}

/** `ScriptsAtom.java:145-152`: a subscript alone. */
function subscriptOnly(lay: BaseLayout, x: Box, style: number, lastXHeight: number | undefined): Box {
  const sub1 = param('sub1', style);
  x.shift = Math.max(Math.max(lay.shiftDown, sub1), x.height - (4 * Math.abs(xHeight(style, lastXHeight))) / 5);
  return hbox(...lay.hor, x, lay.deltaSymbol);
}

/** The superscript box `x`, its padded `sup`, and the subscript box `y`. */
interface ScriptBoxes {
  sup: Box;
  x: Box;
  y: Box;
}

/** `ScriptsAtom.java:177-213`: both scripts, stacked. */
function bothScripts(lay: BaseLayout, s: ScriptBoxes, style: number, lastXH: number | undefined): Box {
  const { sup, x, y } = s;
  const sub = hbox(hboxAligned(y, x.width, ALIGN_LEFT), strutBox(SCRIPT_SPACE, 0, 0));
  let shiftUp = lay.shiftUp;
  let shiftDown = Math.max(lay.shiftDown, param('sub2', style));
  const drt = param('defaultrulethickness', style);
  let interSpace = shiftUp - x.depth + shiftDown - y.height;
  if (interSpace < 4 * drt) {
    shiftUp += 4 * drt - interSpace;
    const psi = (4 * Math.abs(xHeight(style, lastXH))) / 5 - (shiftUp - x.depth);
    if (psi > 0) {
      shiftUp += psi;
      shiftDown -= psi;
    }
  }
  sup.shift = lay.delta;
  interSpace = shiftUp - x.depth + shiftDown - y.height;
  const v = new VBox()
    .add(sup)
    .add(strutBox(0, interSpace, 0))
    .add(sub);
  v.box.height = shiftUp + x.height;
  v.box.depth = shiftDown + y.depth;
  return hbox(...lay.hor, v.box, lay.deltaSymbol);
}

/**
 * `ScriptsAtom#createBox` (`ScriptsAtom.java:79-220`). The UnderOverAtom
 * branch (java:88-90) needs a non-operator base with LIMITS, which only
 * `\limits` on a big operator in text style produces; it is not built here.
 */
export function scriptsBox(atom: ScriptsAtom, style: number, build: BuildBox): Box {
  const b = atom.base === undefined ? strutBox(0, 0, 0) : build(atom.base, style);
  if (atom.sub === undefined && atom.sup === undefined) return b;
  const lay = layoutBase(atom, b, style);
  const lastXH = b.lastXHeight;
  if (atom.sup === undefined) return subscriptOnly(lay, build(atom.sub as Atom, subStyle(style)), style, lastXH);
  const x = build(atom.sup, supStyle(style));
  const sup = hbox(x, strutBox(SCRIPT_SPACE, 0, 0));
  const shiftUp = supShift(lay.shiftUp, x, style, lastXH);
  if (atom.sub === undefined) {
    sup.shift = -shiftUp;
    return hbox(...lay.hor, sup, lay.deltaSymbol);
  }
  return bothScripts({ ...lay, shiftUp }, { sup, x, y: build(atom.sub, subStyle(style)) }, style, lastXH);
}

/** `BigOperatorAtom#changeWidth` (java:218-223). */
function changeWidth(b: Box, maxWidth: number): Box {
  return Math.abs(maxWidth - b.width) > PREC ? hboxAligned(b, maxWidth, ALIGN_CENTER) : b;
}

/** `BigOperatorAtom.java:118-121`: whether the scripts go beside, not over
 *  and under. */
function asScripts(base: Atom, style: number): boolean {
  const limits = limitsOf(base);
  return style >= STYLE_TEXT || limits === 'nolimits';
}

/** `BigOperatorAtom.java:170-180`: the upper limit and the kern below it;
 *  returns that kern. */
function addOver(v: VBox, x: Box, delta: number, style: number): number {
  v.add(strutBox(0, param('bigopspacing5', style), 0));
  x.shift = delta / 2;
  v.add(x);
  const kern = Math.max(param('bigopspacing1', style), param('bigopspacing3', style) - x.depth);
  v.add(strutBox(0, kern, 0));
  return kern;
}

/** `BigOperatorAtom.java:185-194`: the kern above the lower limit, the
 *  limit, and the closing spacing. */
function addUnder(v: VBox, z: Box, delta: number, style: number): void {
  v.add(strutBox(0, Math.max(param('bigopspacing2', style), param('bigopspacing4', style) - z.height), 0));
  z.shift = -delta / 2;
  v.add(z).add(strutBox(0, param('bigopspacing5', style), 0));
}

/** A limit's box, if the limit is present. */
const optionalBox = (a: Atom | undefined, style: number, build: BuildBox): Box | undefined =>
  a === undefined ? undefined : build(a, style);

/** A missing limit is zero wide. */
const widthOf = (b: Box | undefined): number => (b === undefined ? 0 : b.width);

/** The operator box `y` and its italic correction `delta`. */
interface LimitsBase {
  y: Box;
  delta: number;
}

/** `BigOperatorAtom.java:150-201`: the limits stacked over and under. */
function stackLimits(atom: BigOperatorAtom, base: LimitsBase, style: number, build: BuildBox): Box {
  const xs = optionalBox(atom.over, supStyle(style), build);
  const zs = optionalBox(atom.under, subStyle(style), build);
  const maxWidth = Math.max(Math.max(widthOf(xs), base.y.width), widthOf(zs));
  const y = changeWidth(base.y, maxWidth);
  const v = new VBox();
  const x = xs === undefined ? undefined : changeWidth(xs, maxWidth);
  const kern = x === undefined ? 0 : addOver(v, x, base.delta, style);
  v.add(y);
  if (zs !== undefined) addUnder(v, changeWidth(zs, maxWidth), base.delta, style);
  const over = x === undefined ? 0 : param('bigopspacing5', style) + kern + x.height + x.depth;
  const h = y.height + over;
  const total = v.box.height + v.box.depth;
  v.box.height = h;
  v.box.depth = total - h;
  return v.box;
}

/** `BigOperatorAtom#createBox` (`BigOperatorAtom.java:100-213`). A
 *  `TypedAtom` base is unwrapped first (java:109-116). */
export function bigOperatorBox(atom: BigOperatorAtom, style: number, build: BuildBox): Box {
  const base = atom.base.kind === 'typed' ? atom.base.body : atom.base;
  const limitsBase = atom.base.kind === 'typed' ? atom.base : base;
  if (asScripts(limitsBase, style)) {
    return build({ kind: 'scripts', base, sub: atom.under, sup: atom.over }, style);
  }
  const op = bigOpSymbol(base);
  if (op !== undefined) {
    return stackLimits(atom, { y: build(op, style), delta: op.glyph.glyph.italic * sizeFactor(style) }, style, build);
  }
  return stackLimits(atom, { y: hbox(build(base, style)), delta: 0 }, style, build);
}
