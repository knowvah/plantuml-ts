/**
 * One KaTeX parse node → the JLaTeXMath atom its macro builds
 * (`PredefMacros`, `PredefinedTeXFormulas`, `TeXParser`; JLaTeXMath 1.0.7,
 * `~/git/plantuml/gradle/libs.versions.toml:12`).
 */
import type { Atom } from './atoms.js';
import type { Context } from './convert.js';
import {
  AtomConverter,
  BOLD_FONTS,
  FAMILY_TYPES,
  STYLES,
  asRow,
  bigOperatorSymbol,
  delimiter,
  leafAtom,
  opLimits,
  text,
} from './convert.js';
import type { KNode } from './katex-glyphs.js';
import { nodeField, nodeList, stringField } from './katex-glyphs.js';
import { TYPE_BIG_OPERATOR, TYPE_INNER, TYPE_ORDINARY, unitFactor } from './tex-font.js';

type NodeHandler = (n: KNode, ctx: Context) => Atom | undefined;

const converter: AtomConverter = new AtomConverter((n, ctx) => convertNode(n, ctx));

/** `RomanAtom`/`BoldAtom`/`TextStyleAtom`: ORDINARY wrappers. */
const wrap = (body: Atom | undefined, style?: number): Atom => ({
  kind: 'wrap',
  type: TYPE_ORDINARY,
  body: body ?? { kind: 'row', elements: [] },
  ...(style === undefined ? {} : { style }),
});

/** `PredefinedTeXFormulas.java:90-120`: `\sin` is
 *  `\mathop{\mathrm{sin}}\nolimits`, `\lim` `\mathop{\mathrm{lim}}`. */
function namedOperator(name: string, n: KNode, ctx: Context): Atom {
  const roman: Context = { ...ctx, mode: 'math', font: 'mathrm', bold: false };
  const chars = [...name.replace(/^\\/, '')].map((c) => leafAtom(c, TYPE_ORDINARY, roman));
  const body = wrap(chars.length === 1 ? chars[0] : { kind: 'row', elements: chars });
  return { kind: 'typed', left: TYPE_BIG_OPERATOR, right: TYPE_BIG_OPERATOR, limits: opLimits(n), body };
}

/** `\mathop{…}` (`PredefMacros#mathop_macro`): a typed big operator whose
 *  limits are NORMAL. */
function mathop(body: Atom | undefined, n: KNode): Atom {
  const explicit = n.raw['alwaysHandleSupSub'] === true;
  const limits = explicit ? opLimits(n) : 'normal';
  return { kind: 'typed', left: TYPE_BIG_OPERATOR, right: TYPE_BIG_OPERATOR, limits, body: wrap(body) };
}

function convertOp(n: KNode, ctx: Context): Atom {
  const name = stringField(n, 'name');
  if (n.raw['symbol'] === true && name !== undefined) return bigOperatorSymbol(name, opLimits(n), ctx);
  if (name !== undefined) return namedOperator(name, n, ctx);
  return mathop(converter.formula(nodeList(n, 'body'), ctx), n);
}

/** `\frac` → `FractionAtom(num, den, true)`; `\binom`/`\choose` fence a
 *  rule-less one. */
function convertGenfrac(n: KNode, ctx: Context): Atom {
  const frac: Atom = {
    kind: 'frac',
    type: TYPE_INNER,
    num: converter.argument(nodeField(n, 'numer'), ctx),
    den: converter.argument(nodeField(n, 'denom'), ctx),
    rule: n.raw['hasBarLine'] === true,
  };
  const left = delimiter(stringField(n, 'leftDelim') ?? undefined);
  const right = delimiter(stringField(n, 'rightDelim') ?? undefined);
  return left === undefined && right === undefined ? frac : { kind: 'fenced', left, body: frac, right };
}

/** `\text`/`\mbox`/`\textbf`… → `RomanAtom` over a text-mode formula. */
function convertText(n: KNode, ctx: Context): Atom {
  const font = stringField(n, 'font') ?? '\\text';
  const inner: Context = { ...ctx, mode: 'text', font, bold: ctx.bold || BOLD_FONTS.has(font) };
  return wrap(converter.formula(nodeList(n, 'body'), inner));
}

/** `\mathbf`/`\mathcal`/`\rm`… → the font wrapper over its argument. */
function convertFont(n: KNode, ctx: Context): Atom {
  const font = stringField(n, 'font');
  const inner: Context = { ...ctx, font, bold: font !== undefined && BOLD_FONTS.has(font) };
  return wrap(converter.argument(nodeField(n, 'body'), inner));
}

/** `\,` `\:` `\;` `\!` are `SpaceAtom` muskips (`PredefMacros#muskip_macros`);
 *  every other kern is a `SpaceAtom` in its unit. */
function convertKern(n: KNode, ctx: Context): Atom | undefined {
  const dim = n.raw['dimension'];
  if (typeof dim !== 'object' || dim === null) return undefined;
  const { number, unit } = dim as Readonly<Record<string, unknown>>;
  if (typeof number !== 'number' || typeof unit !== 'string') return undefined;
  if (unit === 'mu' && [3, 4, 5].includes(Math.abs(number))) {
    return { kind: 'space', space: { muskip: Math.sign(number) * (Math.abs(number) - 2) } };
  }
  if (unitFactor(unit, 0) === undefined) ctx.unsupported.add(`unit ${unit}`);
  return { kind: 'space', space: { em: (style) => number * (unitFactor(unit, style) ?? 0) } };
}

const HANDLERS: Readonly<Record<string, NodeHandler>> = {
  mathord: (n, ctx) => leafAtom(text(n), TYPE_ORDINARY, ctx),
  textord: (n, ctx) => leafAtom(text(n), TYPE_ORDINARY, ctx),
  atom: (n, ctx) => leafAtom(text(n), FAMILY_TYPES[stringField(n, 'family') ?? ''] ?? TYPE_ORDINARY, ctx),
  op: convertOp,
  operatorname: (n, ctx) => mathop(converter.formula(nodeList(n, 'body'), { ...ctx, font: 'mathrm' }), n),
  genfrac: convertGenfrac,
  sqrt: (n, ctx) => ({
    kind: 'sqrt',
    type: TYPE_ORDINARY,
    body: converter.argument(nodeField(n, 'body'), ctx) ?? { kind: 'row', elements: [] },
    index: converter.argument(nodeField(n, 'index'), ctx),
  }),
  leftright: (n, ctx) => ({
    kind: 'fenced',
    left: delimiter(stringField(n, 'left')),
    body: converter.formula(nodeList(n, 'body'), ctx) ?? { kind: 'row', elements: [] },
    right: delimiter(stringField(n, 'right')),
  }),
  text: convertText,
  font: convertFont,
  spacing: () => ({ kind: 'space', space: { blank: true } }),
  kern: convertKern,
  styling: (n, ctx) => wrap(converter.formula(nodeList(n, 'body'), ctx), STYLES[stringField(n, 'style') ?? '']),
  color: (n, ctx) => asRow(converter.formula(nodeList(n, 'body'), ctx)),
  mclass: (n, ctx) => {
    const t = FAMILY_TYPES[stringField(n, 'mclass') ?? ''] ?? TYPE_ORDINARY;
    return {
      kind: 'typed',
      left: t,
      right: t,
      limits: 'nolimits',
      body: wrap(converter.formula(nodeList(n, 'body'), ctx)),
    };
  },
};

/** Convert one node; an unmodelled kind is noted and sized by its body. */
export function convertNode(n: KNode, ctx: Context): Atom | undefined {
  const handler = HANDLERS[n.type];
  if (handler !== undefined) return handler(n, ctx);
  ctx.unsupported.add(n.type);
  const body = [...nodeList(n, 'body'), ...nodeList(n, 'base'), ...nodeList(n, 'html')];
  return body.length === 0 ? undefined : converter.formula(body, ctx);
}

/** The formula root for a parsed expression (`TeXFormula.root`). */
export const formulaRoot = (nodes: readonly KNode[], ctx: Context): Atom | undefined => converter.formula(nodes, ctx);
