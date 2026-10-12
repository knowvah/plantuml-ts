/**
 * KaTeX parse tree → JLaTeXMath atoms: what `TeXParser`/`PredefMacros`
 * would have built for the same source (JLaTeXMath 1.0.7,
 * `~/git/plantuml/gradle/libs.versions.toml:12`), with every glyph's
 * metrics taken from KaTeX in the font the source selects.
 *
 * A node kind with no JLaTeXMath counterpart modelled here is recorded in
 * `Context.unsupported` and sized by its children alone, so the caller can
 * tell an exact box from an approximate one.
 */
import type { Atom, CharAtom, Delimiter, FontGlyph, Limits, RowAtom } from './atoms.js';
import { isBigOperator, setOrdinary } from './atoms.js';
import type { Glyph, KNode } from './katex-glyphs.js';
import { nodeField, nodeList, probeGlyph, stringField } from './katex-glyphs.js';
import {
  STYLE_DISPLAY,
  STYLE_SCRIPT,
  STYLE_SCRIPT_SCRIPT,
  STYLE_TEXT,
  TYPE_BIG_OPERATOR,
  TYPE_BINARY_OPERATOR,
  TYPE_CLOSING,
  TYPE_INNER,
  TYPE_OPENING,
  TYPE_ORDINARY,
  TYPE_PUNCTUATION,
  TYPE_RELATION,
  XHEIGHT_CM,
  XHEIGHT_CMBX,
} from './tex-font.js';

/** The font a leaf is typeset in: KaTeX's math font command (`mathbf`) or
 *  text command (`\textbf`), and whether it is a bold font. */
export interface Context {
  mode: 'math' | 'text';
  font: string | undefined;
  bold: boolean;
  unsupported: Set<string>;
}

/** KaTeX `atom` families and `\mathbin`-style classes → `TeXConstants`
 *  types (`TeXSymbols.xml` `type` attribute values). */
const FAMILY_TYPES: Readonly<Record<string, number>> = {
  bin: TYPE_BINARY_OPERATOR,
  rel: TYPE_RELATION,
  open: TYPE_OPENING,
  close: TYPE_CLOSING,
  punct: TYPE_PUNCTUATION,
  inner: TYPE_INNER,
  mord: TYPE_ORDINARY,
  mop: TYPE_BIG_OPERATOR,
  mbin: TYPE_BINARY_OPERATOR,
  mrel: TYPE_RELATION,
  mopen: TYPE_OPENING,
  mclose: TYPE_CLOSING,
  mpunct: TYPE_PUNCTUATION,
  minner: TYPE_INNER,
};

/** `\displaystyle`…`\scriptscriptstyle` → `TeXConstants.STYLE_*`. */
const STYLES: Readonly<Record<string, number>> = {
  display: STYLE_DISPLAY,
  text: STYLE_TEXT,
  script: STYLE_SCRIPT,
  scriptscript: STYLE_SCRIPT_SCRIPT,
};

/** KaTeX fonts that select a bold Computer Modern face. */
const BOLD_FONTS: ReadonlySet<string> = new Set(['mathbf', 'boldsymbol', '\\textbf']);

const ZERO_GLYPH: Glyph = { width: 0, height: 0, depth: 0, italic: 0 };

/** `TeXParser#convertCharacter`: only `[0-9a-zA-Z]` become a `CharAtom`. */
const CHAR_ATOM = /^[0-9a-zA-Z]$/;

function fontGlyph(probe: string, ctx: Context, what: string): FontGlyph {
  const glyph = probeGlyph(probe);
  if (glyph === undefined) ctx.unsupported.add(`glyph ${what}`);
  return { glyph: glyph ?? ZERO_GLYPH, xHeight: ctx.bold ? XHEIGHT_CMBX : XHEIGHT_CM };
}

/** The probe that renders `text` alone in the context's font. */
function leafProbe(text: string, ctx: Context): string {
  if (ctx.mode === 'text') return `${ctx.font ?? '\\text'}{${text}}`;
  return ctx.font === undefined ? text : `\\${ctx.font}{${text}}`;
}

/** A `CharAtom`/`SymbolAtom` leaf. */
function leafAtom(text: string, type: number, ctx: Context): CharAtom {
  const glyph = fontGlyph(leafProbe(text, ctx), ctx, text);
  return { kind: 'char', type, limits: 'nolimits', glyph, mathChar: ctx.mode === 'math' && CHAR_ATOM.test(text) };
}

/** The TFM height of `jlm_cmex10`'s display-size operators
 *  (`fonts/base/jlm_cmex10.xml:208-260`, e.g. `code="88"` ∑); the
 *  integrals' (`code="73"`, `code="90"`) is 0, as is every text-size
 *  operator's (`:205-257`). */
const CMEX_DISPLAY_OP_HEIGHT = 0.100001;
/** The operators whose display glyph has no TFM height. */
const CMEX_INTEGRALS: ReadonlySet<string> = new Set(['\\int', '\\oint']);

/** KaTeX centres its operator glyphs on the axis; `SymbolAtom#createBox`
 *  centres them itself from the TFM split, so the glyph's total is
 *  re-divided at the TFM height. */
const tfmSplit = (g: Glyph, height: number): Glyph => ({ ...g, height, depth: g.height + g.depth - height });

/** `SymbolAtom` for a big operator: its text-style glyph and the display
 *  successor (`DefaultTeXFont#getNextLarger`). */
function bigOperatorSymbol(name: string, limits: Limits, ctx: Context): CharAtom {
  const small = fontGlyph(`\\textstyle${name}`, ctx, name);
  const glyph = { ...small, glyph: tfmSplit(small.glyph, 0) };
  const larger = probeGlyph(`\\displaystyle${name}`);
  const grows = larger !== undefined && larger.height + larger.depth > small.glyph.height + small.glyph.depth;
  const base: CharAtom = { kind: 'char', type: TYPE_BIG_OPERATOR, limits, glyph, mathChar: false };
  if (!grows) return base;
  const h = CMEX_INTEGRALS.has(name) ? 0 : CMEX_DISPLAY_OP_HEIGHT;
  return { ...base, larger: { glyph: tfmSplit(larger, h), xHeight: small.xHeight } };
}

/** `\big`…`\Bigg`: the delimiter's `NextLarger` chain as KaTeX sizes it. */
const DELIMITER_SIZES = ['\\big', '\\Big', '\\bigg', '\\Bigg'] as const;

/** A `\left`/`\right` delimiter; `.` is none (`FencedAtom.java:89-94`). */
export function delimiter(text: string | undefined): Delimiter | undefined {
  if (text === undefined || text === '.') return undefined;
  const sizes: FontGlyph[] = [];
  let prevTotal = -1;
  for (const probe of [text, ...DELIMITER_SIZES.map((s) => `${s}${text}`)]) {
    const g = probeGlyph(probe);
    if (g === undefined || g.height + g.depth <= prevTotal) break;
    sizes.push({ glyph: g, xHeight: XHEIGHT_CM });
    prevTotal = g.height + g.depth;
  }
  return sizes.length === 0 ? undefined : { sizes };
}

/** KaTeX `op.limits`/`alwaysHandleSupSub` → `type_limits`: `\limits`
 *  forces LIMITS (`PredefMacros#limits_macro`), a plain operator is NORMAL
 *  when it takes limits (`SymbolAtom.java:98-99`). */
function opLimits(n: KNode): Limits {
  if (n.raw['limits'] !== true) return 'nolimits';
  return n.raw['alwaysHandleSupSub'] === true ? 'limits' : 'normal';
}

/** The leaf text of a node, or `''`. */
const text = (n: KNode): string => stringField(n, 'text') ?? '';

export type Converter = (n: KNode, ctx: Context) => Atom | undefined;

/** `TeXFormula#add` (java:431-436): the right types a `BreakMarkAtom`
 *  follows. */
const BREAK_AFTER: ReadonlySet<number> = new Set([TYPE_BINARY_OPERATOR, TYPE_RELATION]);

/** `TeXFormula#add` and `TeXParser#getScripts` over a node list: the root
 *  becomes a row on its second atom, and a script takes the last atom. */
export class FormulaBuilder {
  root: Atom | undefined;

  add(el: Atom | undefined): void {
    if (el === undefined) return;
    if (this.root === undefined) {
      this.root = el;
      return;
    }
    const row: RowAtom = this.root.kind === 'row' ? this.root : { kind: 'row', elements: [this.root] };
    row.elements.push(el);
    if (el.kind === 'typed' && BREAK_AFTER.has(el.right)) row.elements.push({ kind: 'break' });
    this.root = row;
  }

  /** `TeXParser.parse`'s `{…}` case and `getArgument` (java:714-720,
   *  :996-1012): a leading group wraps in a row, a later one turns ORDINARY. */
  addGroup(inner: Atom | undefined): void {
    if (this.root === undefined) {
      this.root = { kind: 'row', elements: inner === undefined ? [] : [inner] };
      return;
    }
    if (inner !== undefined) this.add(setOrdinary(inner));
  }

  /** `getScripts`' base (java:826-834): the last atom of a row (a zero
   *  space when the row is empty, `RowAtom#getLastAtom`), the lone root, or
   *  a phantom when there is nothing yet. */
  takeLast(ctx: Context): Atom {
    const root = this.root;
    if (root === undefined) return phantomBase(ctx);
    if (root.kind === 'row') return root.elements.pop() ?? { kind: 'space', space: { em: () => 0 } };
    this.root = undefined;
    return root;
  }
}

/** Builds an atom tree from KaTeX parse nodes. */
export class AtomConverter {
  constructor(private readonly convertNode: Converter) {}

  /** A formula's root from a node list (`new TeXFormula(tp, s).root`). */
  formula(nodes: readonly KNode[], ctx: Context): Atom | undefined {
    const f = new FormulaBuilder();
    for (const n of nodes) this.addNode(f, n, ctx);
    return f.root;
  }

  /** A macro argument: KaTeX's argument `ordgroup` is the braces upstream
   *  strips before parsing the argument as its own formula. */
  argument(n: KNode | undefined, ctx: Context): Atom | undefined {
    if (n === undefined) return undefined;
    return this.formula(n.type === 'ordgroup' ? nodeList(n, 'body') : [n], ctx);
  }

  private addNode(f: FormulaBuilder, n: KNode, ctx: Context): void {
    if (n.type === 'ordgroup') {
      f.addGroup(this.formula(nodeList(n, 'body'), ctx));
      return;
    }
    if (n.type !== 'supsub') {
      f.add(this.convertNode(n, ctx));
      return;
    }
    const baseNode = nodeField(n, 'base');
    if (baseNode !== undefined) this.addNode(f, baseNode, ctx);
    const base = f.takeLast(ctx);
    const sub = this.argument(nodeField(n, 'sub'), ctx);
    const sup = this.argument(nodeField(n, 'sup'), ctx);
    if (isBigOperator(base)) f.add({ kind: 'bigop', type: TYPE_BIG_OPERATOR, base, under: sub, over: sup });
    else f.add({ kind: 'scripts', base, sub, sup });
  }
}

/** `PhantomAtom(new CharAtom('M', "mathnormal"), false, true, true)`
 *  (`TeXParser.java:814`): a script with nothing before it. */
function phantomBase(ctx: Context): Atom {
  return {
    kind: 'phantom',
    body: { kind: 'row', elements: [leafAtom('M', TYPE_ORDINARY, { ...ctx, font: undefined })] },
  };
}

/** A body as a row (`ColorAtom`'s `new RowAtom(atom)`, which flattens a
 *  row argument). */
export function asRow(atom: Atom | undefined): RowAtom {
  if (atom === undefined) return { kind: 'row', elements: [] };
  return atom.kind === 'row' ? atom : { kind: 'row', elements: [atom] };
}

export { FAMILY_TYPES, STYLES, BOLD_FONTS, bigOperatorSymbol, leafAtom, opLimits, text };
