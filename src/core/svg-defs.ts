/**
 * svg-defs.ts — `<defs>` collection for the pure-string SVG assembler.
 * Split out of `svg.ts` (line cap); re-exported from `svg.ts` so existing
 * import sites are unchanged.
 *
 * Upstream has ONE `SvgGraphics` per diagram, holding the one `defs`
 * element plus the two caches that keep it minimal: `gradients`
 * (`SvgGraphics.java:363-405`, keyed on `color1|color2|policy`) and
 * `filterBackColor` (`SvgGraphics.java:761-787`, keyed on the colour). This
 * port's string emitters instead prepend a def inline next to each
 * referencing shape, and its klimt fragments each own a SEPARATE
 * `SvgGraphics` document — so the caches cannot span the document, and both
 * the lifting ({@link extractGradientDefs}, {@link extractFilterDefs}) and
 * the cross-fragment collapse ({@link collapseDuplicateFilterDefs}) below
 * restore the jar's one-def-per-distinct-value invariant at assembly time.
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/SvgGraphics.java:363-405,761-787
 */

import { hashString } from './paint.js';
import { resolveColorToSvgHex } from './klimt/color/HColorSet.js';
import { escapeAttribute } from './svg-format.js';

// Matches one inline def opening. Built from strings (not regex literals) —
// the complexity checker miscounts `<`/`>` in literals. Scanned with
// `indexOf` rather than a regex: a lazy `[\s\S]*?` over library input is
// quadratic when open tags outnumber close tags (CodeQL js/polynomial-redos).
const GRADIENT_OPEN = '<linearGradient id="';
const GRADIENT_CLOSE = '</linearGradient>';
/** The FNV/base36 content-hash `paintToSvg` emits (`g` + [0-9a-z]). */
const GRADIENT_ID_RE = /^g[0-9a-z]+$/;

const FILTER_OPEN = '<filter id="';
const FILTER_CLOSE = '</filter>';
/** {@link backColorFilterId}'s own shape (`b` + FNV/base36 hash). Narrow on
 *  purpose: a `<filter>` a caller placed in `extraDefs` (a shadow filter, a
 *  klimt fragment's own) is already inside `<defs>` and must not be lifted. */
const FILTER_ID_RE = /^b[0-9a-z]+$/;

/** One def occurrence found by {@link nextDef}. */
interface DefSpan {
  readonly at: number;
  readonly end: number;
  readonly id: string | undefined;
}

/** The quoted id of the def opening at `at`, or `undefined` when the value
 *  does not match this def kind's own id shape. */
function idAt(body: string, at: number, open: string, idRe: RegExp): string | undefined {
  const idStart = at + open.length;
  const idEnd = body.indexOf('"', idStart);
  if (idEnd === -1) return undefined;
  const id = body.substring(idStart, idEnd);
  return idRe.test(id) ? id : undefined;
}

/** The next `open … close` def at or after `cursor`, or `undefined` when
 *  none remains. An occurrence whose id does not match `idRe` is reported
 *  with `id: undefined` so the caller can skip past it without consuming it. */
function nextDef(body: string, cursor: number, open: string, close: string, idRe: RegExp): DefSpan | undefined {
  const at = body.indexOf(open, cursor);
  if (at === -1) return undefined;
  const id = idAt(body, at, open, idRe);
  if (id === undefined) return { at, end: at + open.length, id: undefined };
  const closeAt = body.indexOf(close, at);
  // No close tag after this open means none after any later open either.
  if (closeAt === -1) return undefined;
  return { at, end: closeAt + close.length, id };
}

/**
 * Lift every inline def of one kind out of `body` and return them, deduped
 * by id in first-use order, for the document's `<defs>`.
 *
 * Dedup by id is exact rather than heuristic: every id this port mints
 * inline is a content hash of the def's own inputs, so equal ids mean
 * byte-identical defs.
 */
function extractInlineDefs(body: string, open: string, close: string, idRe: RegExp): { body: string; defs: string } {
  const seen = new Set<string>();
  const found: string[] = [];
  const kept: string[] = [];
  let cursor = 0;
  for (let span = nextDef(body, cursor, open, close, idRe); span !== undefined;) {
    kept.push(body.substring(cursor, span.id === undefined ? span.end : span.at));
    if (span.id !== undefined && !seen.has(span.id)) {
      seen.add(span.id);
      found.push(body.substring(span.at, span.end));
    }
    cursor = span.end;
    span = nextDef(body, cursor, open, close, idRe);
  }
  kept.push(body.substring(cursor));
  return { body: kept.join(''), defs: found.join('') };
}

/**
 * Lift every inline `<linearGradient>` out of `body`.
 *
 * `SvgGraphics#createSvgGradient` keys a map on `(color1, color2, policy)`,
 * creates the element once on a miss, and appends it to `defs`
 * (`SvgGraphics.java:363-405`) -- so the jar emits ONE per distinct
 * gradient, in `<defs>`, referenced by id from wherever it is used. This
 * port's shape emitters each prepend their own def inline instead
 * (`svg-shapes.ts#rect`/`line`/`text`/...), which left `<defs/>` empty and
 * repeated the element once per referencing shape.
 */
export function extractGradientDefs(body: string): { body: string; defs: string } {
  return extractInlineDefs(body, GRADIENT_OPEN, GRADIENT_CLOSE, GRADIENT_ID_RE);
}

/**
 * Lift every inline `<filter>` this module minted ({@link backColorFilterId}
 * ids only) out of `body` — the `feFlood` text-background filter
 * `SvgGraphics#getFilterBackColor` registers once per colour
 * (`SvgGraphics.java:772-787`), which class's own string renderers emit
 * inline next to the `<text>` that references it.
 */
export function extractFilterDefs(body: string): { body: string; defs: string } {
  return extractInlineDefs(body, FILTER_OPEN, FILTER_CLOSE, FILTER_ID_RE);
}

/**
 * The id of the `feFlood` filter for one resolved text background colour.
 *
 * Upstream mints `filterUid + filterBackColor.size()` — per DOCUMENT seed,
 * in first-use order (`SvgGraphics.java:160,763-767`). This port's class
 * renderer has no document-wide counter to read at the point a member row is
 * serialized, so the id is a content hash of the colour instead, exactly as
 * `paint.ts#paintToSvg` already does for `<linearGradient>` ids. Same
 * consequence, already recorded for gradients in decision-journal row 62:
 * one `@id` diff per distinct colour against the jar, to be retired when
 * that row's cross-engine seed unification lands. Content-keyed rather than
 * ordinal, so two rows with the same colour share one def — which is the
 * invariant upstream's cache gives.
 */
export function backColorFilterId(resolvedColor: string): string {
  return 'b' + hashString(resolvedColor);
}

/**
 * The `feFlood`/`feComposite` filter element itself — `SvgGraphics.java:
 * 777-786` attribute for attribute (`x`/`y` 0, `width`/`height` 1,
 * `flood-color` + `result="flood"`, then `in="SourceGraphic"` `in2="flood"`
 * `operator="over"`).
 *
 * `color` is a raw token; it is resolved through the same
 * `resolveColorToSvgHex` choke point every other emitted colour uses, and
 * NOT shortened — the jar's own `flood-color` comes from `back.toRGB(mapper)`
 * (`DriverTextSvg.java:171`), the full `#RRGGBB` form, unlike the
 * `toSvg(mapper)` used for the extra decoration lines.
 */
export function backColorFilterDef(color: string): { id: string; def: string } {
  const resolved = resolveColorToSvgHex(color);
  const id = backColorFilterId(resolved);
  const def =
    '<filter id="' +
    escapeAttribute(id) +
    '" x="0" y="0" width="1" height="1">' +
    '<feFlood flood-color="' +
    escapeAttribute(resolved) +
    '" result="flood"/>' +
    '<feComposite in="SourceGraphic" in2="flood" operator="over"/>' +
    '</filter>';
  return { id, def };
}

/** Any `<filter id="…">…</filter>` in a `<defs>` payload, whatever the id's
 *  shape (a klimt fragment's seeded `b<seed>N` included) — the collapse pass
 *  below must see those, unlike {@link extractFilterDefs}'s narrow lift. */
const ANY_ID_RE = /^[^"]*$/;

/**
 * Collapse `<filter>` defs that are byte-identical apart from their `id`,
 * keeping the first and rewriting every `url(#dropped)` reference in `body`
 * to the kept id.
 *
 * Upstream cannot produce such a pair: one diagram is one `SvgGraphics`, so
 * `filterBackColor` returns the SAME id for the same colour wherever it is
 * used (`SvgGraphics.java:772-776`) — `galili-87-zivo129`'s footer and
 * legend, both `<back:red>`, share ONE `<filter>` in the jar's `<defs>`.
 * This port draws each chrome element as its OWN klimt fragment with its own
 * seeded id namespace (`klimt/document-shell.ts#renderDrawableToFragment`),
 * so the same colour there yields two differently-named identical filters.
 * This pass is that missing per-document collapse.
 *
 * Restricted to `<filter>`: it is the only def kind whose id is minted from a
 * per-document counter rather than from its own content, so it is the only
 * kind where two identical elements can carry different ids.
 */
export function collapseDuplicateFilterDefs(defs: string, body: string): { defs: string; body: string } {
  const firstIdByContent = new Map<string, string>();
  const renames = new Map<string, string>();
  const kept: string[] = [];
  let cursor = 0;
  for (let span = nextDef(defs, cursor, FILTER_OPEN, FILTER_CLOSE, ANY_ID_RE); span !== undefined;) {
    kept.push(defs.substring(cursor, span.at));
    cursor = span.end;
    const element = defs.substring(span.at, span.end);
    const key = element.replace(FILTER_OPEN + span.id + '"', FILTER_OPEN + '"');
    const first = firstIdByContent.get(key);
    if (first === undefined) firstIdByContent.set(key, span.id!);
    else renames.set(span.id!, first);
    if (first === undefined) kept.push(element);
    span = nextDef(defs, cursor, FILTER_OPEN, FILTER_CLOSE, ANY_ID_RE);
  }
  if (renames.size === 0) return { defs, body };
  kept.push(defs.substring(cursor));
  let rewritten = body;
  for (const [from, to] of renames) rewritten = rewritten.split(`url(#${from})`).join(`url(#${to})`);
  return { defs: kept.join(''), body: rewritten };
}

/**
 * The whole document-level `<defs>` pass, in the order upstream's single
 * `SvgGraphics` produces it: caller-supplied defs first (markers, klimt
 * fragments' own), then every inline `<linearGradient>` and `<filter>`
 * lifted out of the body, then the cross-fragment filter collapse.
 *
 * One function so this port's TWO document assemblers — `svg.ts#svgRoot`
 * and `klimt/document-shell.ts#assembleDocumentShell` — cannot drift apart
 * on which defs reach `<defs>`.
 */
export function collectDocumentDefs(body: string, prefixDefs: string): { defs: string; body: string } {
  const gradients = extractGradientDefs(body);
  const filters = extractFilterDefs(gradients.body);
  return collapseDuplicateFilterDefs(prefixDefs + gradients.defs + filters.defs, filters.body);
}

/** The two def elements this port ever emits INLINE in a fragment body,
 *  before {@link collectDocumentDefs} lifts them into `<defs>`. */
const INLINE_DEF_OPENS: readonly (readonly [string, string])[] = [
  [GRADIENT_OPEN.slice(0, '<linearGradient'.length), GRADIENT_CLOSE],
  [FILTER_OPEN.slice(0, '<filter'.length), FILTER_CLOSE],
];

/** The next inline def span at or after `cursor`, or `undefined`. */
function nextInlineDefSpan(body: string, cursor: number): { at: number; end: number } | undefined {
  let best: { at: number; end: number } | undefined;
  for (const [open, close] of INLINE_DEF_OPENS) {
    const at = body.indexOf(open, cursor);
    if (at === -1 || (best !== undefined && at > best.at)) continue;
    const closeAt = body.indexOf(close, at);
    if (closeAt === -1) continue;
    best = { at, end: closeAt + close.length };
  }
  return best;
}

/**
 * Applies `transform` to every part of `body` that is NOT inside an inline
 * `<linearGradient>`/`<filter>` def.
 *
 * A def's own attributes are in the def's units — `objectBoundingBox`
 * percentages for a gradient vector (`SvgGraphics.java:377-383` emits
 * `x1="0%"`…), filter units for `x`/`y`/`width`/`height`
 * (`SvgGraphics.java:780-783`) — never document coordinates, so a
 * whole-body coordinate rewrite (`annotations/coord-shift.ts`) must step
 * over them. Kept here, next to the emitters that mint those defs, so the
 * one list of inline def shapes has one home.
 */
export function mapOutsideInlineDefs(body: string, transform: (segment: string) => string): string {
  const out: string[] = [];
  let cursor = 0;
  for (let span = nextInlineDefSpan(body, cursor); span !== undefined;) {
    out.push(transform(body.substring(cursor, span.at)), body.substring(span.at, span.end));
    cursor = span.end;
    span = nextInlineDefSpan(body, cursor);
  }
  out.push(transform(body.substring(cursor)));
  return out.join('');
}
