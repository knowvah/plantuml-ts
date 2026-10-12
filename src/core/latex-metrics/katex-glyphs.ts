/**
 * Glyph metrics and parse trees from KaTeX, the library this port typesets
 * with instead of JLaTeXMath (DIVERGENCES.md, "LaTeX rendering engine").
 *
 * KaTeX ships the Computer Modern TFM metrics JLaTeXMath also reads
 * (`node_modules/katex/src/fontMetricsData.js`: depth, height, italic, skew,
 * width per glyph, in em) but does not export them. It does expose
 * `__renderToHTMLTree`, whose symbol nodes carry exactly those metrics for
 * the font KaTeX picks, so a glyph's metrics are read by rendering a probe
 * of that one glyph (`\mathbf{x}`, `\text{o}`, `\Big(`) and taking its single
 * symbol node. A probe never combines characters
 * (`buildCommon.ts#tryCombineChars`, which keeps only the first width).
 *
 * `__parse` and `__renderToHTMLTree` are KaTeX's internal entry points,
 * present on the default export at runtime but absent from its type
 * declarations; both results are therefore received as `unknown` and
 * narrowed here.
 */
import katex from 'katex';

/** A glyph's KaTeX metrics, in em, unscaled by style. */
export interface Glyph {
  width: number;
  height: number;
  depth: number;
  italic: number;
}

/** The fields this module reads from a KaTeX parse node. Every other field
 *  is reached through {@link nodeField}/{@link nodeList}. */
export interface KNode {
  type: string;
  mode: string;
  raw: Readonly<Record<string, unknown>>;
}

/**
 * LaTeX commands JLaTeXMath accepts and KaTeX does not, mapped to KaTeX's own
 * equivalent.
 *
 * Upstream typesets through JLaTeXMath, which implements the standard LaTeX
 * text-mode box commands; KaTeX implements `\text` but not its `\mbox` alias
 * and, with `throwOnError: false`, renders an unknown control sequence as its
 * literal name in error red. `component/vimulo-11-buni641` drew a red
 * `\mbox` beside the formula where the jar draws the word "or"
 * (`P(y|\mathbf{x}) \mbox{ or } f(\mathbf{x})+\epsilon`).
 *
 * `\mbox{…}` and `\text{…}` are the same thing in LaTeX: horizontal text
 * mode. Mapping one to the other reproduces JLaTeXMath's reading rather than
 * approximating it.
 *
 * Scoped to MEASURED reach: `\mbox` is the only command in this corpus's ten
 * latex/math expressions that KaTeX rejects, and with this mapping none is
 * rejected. Add an entry when a fixture needs it, not speculatively.
 */
export const KATEX_MACROS: Readonly<Record<string, string>> = { '\\mbox': '\\text' };

type KatexEntry = (expr: string, options: Record<string, unknown>) => unknown;

function katexEntry(name: '__parse' | '__renderToHTMLTree'): KatexEntry {
  const fn: unknown = (katex as unknown as Readonly<Record<string, unknown>>)[name];
  if (typeof fn !== 'function') throw new Error(`katex.${name} is unavailable; the KaTeX version is unsupported`);
  return (expr, options) => (fn as (e: string, o: Record<string, unknown>) => unknown)(expr, options);
}

const isRecord = (v: unknown): v is Readonly<Record<string, unknown>> => typeof v === 'object' && v !== null;

/** Narrow one KaTeX parse node; anything without a string `type` is not one. */
export function toKNode(v: unknown): KNode | undefined {
  if (!isRecord(v) || typeof v['type'] !== 'string') return undefined;
  return { type: v['type'], mode: typeof v['mode'] === 'string' ? v['mode'] : 'math', raw: v };
}

/** A child node stored under `key`, if it is one. */
export const nodeField = (n: KNode, key: string): KNode | undefined => toKNode(n.raw[key]);

/** A list of child nodes stored under `key`; a single node becomes a list
 *  of one, anything else an empty list. */
export function nodeList(n: KNode, key: string): KNode[] {
  const v = n.raw[key];
  if (!Array.isArray(v)) {
    const one = toKNode(v);
    return one === undefined ? [] : [one];
  }
  return v.map(toKNode).filter((x): x is KNode => x !== undefined);
}

/** A string field, or `undefined`. */
export const stringField = (n: KNode, key: string): string | undefined => {
  const v = n.raw[key];
  return typeof v === 'string' ? v : undefined;
};

/** Parse `expr` in display mode; a KaTeX parse error throws. */
export function parseLatex(expr: string): KNode[] {
  const tree = katexEntry('__parse')(expr, { displayMode: true, throwOnError: true, macros: KATEX_MACROS });
  return Array.isArray(tree) ? tree.map(toKNode).filter((x): x is KNode => x !== undefined) : [];
}

/** The zero-width space KaTeX pads a vlist with (`buildCommon.ts`). */
const ZERO_WIDTH_SPACE = '​';

const isNumber = (v: unknown): v is number => typeof v === 'number';

/** A KaTeX `SymbolNode` with visible text, as a {@link Glyph}. */
function asSymbol(v: Readonly<Record<string, unknown>>): Glyph | undefined {
  const { text, width, height, depth, italic } = v;
  if (typeof text !== 'string' || text === '' || text === ZERO_WIDTH_SPACE) return undefined;
  if (!isNumber(width) || !isNumber(height) || !isNumber(depth) || !isNumber(italic)) return undefined;
  return { width, height, depth, italic };
}

function findSymbol(v: unknown): Glyph | undefined {
  if (!isRecord(v)) return undefined;
  const own = asSymbol(v);
  if (own !== undefined) return own;
  const children = v['children'];
  if (!Array.isArray(children)) return undefined;
  for (const c of children) {
    const g = findSymbol(c);
    if (g !== undefined) return g;
  }
  return undefined;
}

const cache = new Map<string, Glyph | undefined>();

/**
 * The metrics of the one glyph `probe` renders to, or `undefined` when KaTeX
 * rejects the probe or renders no glyph for it (an unknown symbol).
 * Results are memoized per probe; KaTeX's output for a probe is fixed.
 */
export function probeGlyph(probe: string): Glyph | undefined {
  if (cache.has(probe)) return cache.get(probe);
  let glyph: Glyph | undefined;
  try {
    const tree = katexEntry('__renderToHTMLTree')(probe, {
      displayMode: false,
      throwOnError: true,
      macros: KATEX_MACROS,
    });
    glyph = findSymbol(tree);
  } catch {
    // A rejected probe is an unknown glyph to the caller, not a failure:
    // KaTeX rejects symbols it has no font entry for.
    glyph = undefined;
  }
  cache.set(probe, glyph);
  return glyph;
}
