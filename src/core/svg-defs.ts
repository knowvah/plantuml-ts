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
/** The bare opening tag -- `createSvgGradient` sets `id` AFTER the vector
 *  (`SvgGraphics.java:371-395`), so a klimt-emitted gradient does not start
 *  with {@link GRADIENT_OPEN}. Every pass that must see BOTH emitters'
 *  gradients scans for this instead. */
const GRADIENT_OPEN_TAG = '<linearGradient';
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

/** A def element's own `id` attribute, wherever it sits among the
 *  attributes -- `createSvgGradient` sets `id` AFTER the gradient vector
 *  (java:370-395), unlike `getFilterBackColor`, which sets it first
 *  (java:779), so this cannot be read positionally. */
function idOfElement(element: string): string | undefined {
  return /\bid="([^"]*)"/.exec(element)?.[1];
}

/**
 * Keep the FIRST def of each distinct `keyOf` value, drop the rest, and
 * rewrite every `url(#dropped)` reference in `body` to the kept id.
 *
 * This is upstream's map-hit branch, generalised over the key: both
 * `createSvgGradient` and `getFilterBackColor` do a `map.get(key)` and, on a
 * hit, RETURN THE EXISTING ID without creating a second element
 * (`SvgGraphics.java:367-371,411-415,763-767`). One diagram is one
 * `SvgGraphics`, so the map spans the whole document; this port's defs come
 * from several independent emitters, which is why the dedup has to happen
 * once, here, on the assembled payload.
 */
function collapseDefsBy(
  defs: string,
  body: string,
  open: string,
  close: string,
  keyOf: (element: string, id: string) => string,
): { defs: string; body: string } {
  const firstIdByKey = new Map<string, string>();
  const renames = new Map<string, string>();
  const kept: string[] = [];
  let cursor = 0;
  for (let span = nextDef(defs, cursor, open, close, ANY_ID_RE); span !== undefined;) {
    kept.push(defs.substring(cursor, span.at));
    cursor = span.end;
    const element = defs.substring(span.at, span.end);
    const id = idOfElement(element);
    const first = id === undefined ? undefined : firstIdByKey.get(keyOf(element, id));
    if (id !== undefined && first === undefined) firstIdByKey.set(keyOf(element, id), id);
    if (id !== undefined && first !== undefined) renames.set(id, first);
    else kept.push(element);
    span = nextDef(defs, cursor, open, close, ANY_ID_RE);
  }
  if (renames.size === 0) return { defs, body };
  kept.push(defs.substring(cursor));
  let rewritten = body;
  for (const [from, to] of renames) rewritten = rewritten.split(`url(#${from})`).join(`url(#${to})`);
  return { defs: kept.join(''), body: rewritten };
}

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
 * A BYTE key (the element with its own id blanked) is enough here, unlike
 * the gradient below, and that is measured rather than assumed: this port's
 * two back-colour filter emitters — `svg-defs.ts#backColorFilterDef` and
 * klimt's `SvgGraphicsShadow#getFilterBackColor` — both reproduce
 * `SvgGraphics.java:777-786` attribute for attribute in upstream's own
 * order, so a chrome `<back:red>` and a member-row `<back:red>` in one
 * diagram already collapse to a single def.
 */
export function collapseDuplicateFilterDefs(defs: string, body: string): { defs: string; body: string } {
  return collapseDefsBy(defs, body, FILTER_OPEN, FILTER_CLOSE, (element, id) =>
    element.replace(FILTER_OPEN + id + '"', FILTER_OPEN + '"'),
  );
}

/** Every `name="value"` pair of one tag, sorted, with `id` dropped.
 *
 *  The pairs are re-joined by concatenation, never a template literal ending
 *  in `="` before an interpolation (D5's ESLint selector shape): this builds
 *  a comparison KEY that is never emitted, so `attrs()` -- whose job is to
 *  escape values on the way OUT -- would be the wrong tool as well as the
 *  wrong direction. The values here were already escaped by whichever
 *  emitter wrote the def. */
function sortedAttrsOf(attrText: string): string {
  return [...attrText.matchAll(/([\w:-]+)="([^"]*)"/g)]
    .filter((m) => m[1] !== 'id')
    .map((m) => (m[1] ?? '') + '=' + DQUOTE + (m[2] ?? '') + DQUOTE)
    .sort()
    .join(' ');
}

const TAG_RE = /<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g;

/**
 * A `<linearGradient>`'s identity, as upstream keys it:
 * `Arrays.asList(color1, color2, policy)` (`SvgGraphics.java:368`; the
 * `HColorLinearGradient` overload keys on `buildLinearGradientKey(gr,
 * mapper)`, java:410, and shares the SAME `gradients` map, java:393/431).
 *
 * Expressed in emitted terms, that triple IS the direction vector plus the
 * ordered stops: `createSvgGradient` writes the policy out as `x1/y1/x2/y2`
 * (java:371-392) and the two colours as two `<stop>` children (java:397-405).
 * So the key here is every tag's attributes — id excluded, name-sorted —
 * with child order preserved.
 *
 * Sorting is what makes the key cross-EMITTER: this port has two, and they
 * write the same gradient with different attribute order
 * (`paint.ts#paintToSvg` emits `id x1 y1 x2 y2` and `offset stop-color`;
 * klimt's `SvgGraphicsCore#createSvgGradient` emits `x1 y1 x2 y2 id` and
 * `stop-color offset`), which is exactly how `popesa-39-sobe866` came to
 * carry two defs for one gradient once `database dummy2` started routing
 * through the USymbol/klimt path.
 *
 * The KEPT def keeps whichever emitter won — deliberately NOT normalised.
 * Attribute order is invisible to the comparator (`tests/oracle/
 * svg-conformance/normalize.ts` sorts every element's attributes
 * alphabetically before comparing) and invisible to SVG itself; rewriting
 * the survivor's markup would be churn with no observable effect. Child
 * ORDER is positional in the comparator, but both emitters write offset 0%
 * then 100%, matching upstream's own stop1-then-stop2 (java:397-404).
 */
function canonicalGradientKey(element: string): string {
  return element.replace(TAG_RE, (_m, name: string, attrText: string, selfClose: string) => {
    const attrs = sortedAttrsOf(attrText);
    return `<${name}${attrs === '' ? '' : ' ' + attrs}${selfClose}>`;
  });
}

/**
 * Collapse `<linearGradient>` defs that describe the SAME gradient, however
 * they were spelled — see {@link canonicalGradientKey} for the key and its
 * upstream citation. Runs before the seeded rename so the survivors are
 * numbered exactly as upstream's `gradients.size()` would number them.
 */
export function collapseDuplicateGradientDefs(defs: string, body: string): { defs: string; body: string } {
  return collapseDefsBy(defs, body, GRADIENT_OPEN_TAG, GRADIENT_CLOSE, (element) => canonicalGradientKey(element));
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
  const deduped = collapseDuplicateGradientDefs(prefixDefs + gradients.defs + filters.defs, filters.body);
  return collapseDuplicateFilterDefs(deduped.defs, deduped.body);
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

// ---------------------------------------------------------------------------
// Seeded def ids -- SvgGraphics.java:120-122,160-162,285-287,365-394,763-767
// ---------------------------------------------------------------------------

/**
 * Upstream mints every def id from the DIAGRAM's seed plus a per-kind,
 * per-document, first-use-order counter:
 *
 * ```java
 * this.filterUid  = "b" + getSeed(seed);   // :160
 * this.shadowId   = "f" + getSeed(seed);   // :161
 * this.gradientId = "g" + getSeed(seed);   // :162
 * private static String getSeed(long seed) {          // :285-287
 *   return Long.toString(Math.abs(seed), 36);
 * }
 * id = gradientId + gradients.size();                 // :393 and :431
 * result = filterUid + filterBackColor.size();        // :766
 * filter.setAttribute("id", shadowId);                // :1076 -- NO index
 * ```
 *
 * Three facts that decide the rule below, each read off those lines:
 * 1. gradients and back-colour filters have SEPARATE counters (two maps,
 *    `gradients` :365 and `filterBackColor` :761), so a document's first
 *    gradient is `g<uid>0` even when a filter was created before it.
 * 2. BOTH `createSvgGradient` overloads share the ONE `gradients` map
 *    (:393, :431), so the counter spans the plain and `HColorLinearGradient`
 *    forms.
 * 3. the drop shadow has NO index at all — one per document (`withShadow`
 *    is a boolean, :1074-1086).
 *
 * The index is assignment order, which for upstream is creation order, which
 * is also `defs` child order (every branch does `defs.appendChild(elt)` right
 * after minting the id). So renumbering this port's already-assembled
 * `<defs>` in child order reproduces it exactly, without any emitter needing
 * to know the seed.
 */
const SEEDED_KIND_PREFIX = { gradient: 'g', backColor: 'b', shadow: 'f' } as const;

const DQUOTE = '"';

/** `SvgGraphics#getSeed(long)` (java:285-287) -- `Math.abs` in base 36.
 *  Re-exported from the klimt seed module rather than re-derived. */
export { getSeed } from './klimt/drawing/svg/svg-seed.js';
import { getSeed } from './klimt/drawing/svg/svg-seed.js';

/** Which upstream counter a `<defs>` child belongs to, or `undefined` for a
 *  def upstream does not seed (an arrow `<marker>`, a hover style). */
function seededKind(element: string): keyof typeof SEEDED_KIND_PREFIX | undefined {
  if (element.startsWith('<linearGradient')) return 'gradient';
  if (!element.startsWith('<filter')) return undefined;
  // `feFlood` is `getFilterBackColor`'s own first child (java:784); the
  // shadow filter's is `feGaussianBlur` (java:1081). Nothing else in
  // `SvgGraphics` creates a filter.
  if (element.includes('<feFlood')) return 'backColor';
  return element.includes('<feGaussianBlur') ? 'shadow' : undefined;
}

/** The id upstream would mint for the `n`-th def of `kind`. */
function seededId(kind: keyof typeof SEEDED_KIND_PREFIX, uid: string, index: number): string {
  // The shadow filter carries no index (java:1076).
  return kind === 'shadow' ? SEEDED_KIND_PREFIX[kind] + uid : SEEDED_KIND_PREFIX[kind] + uid + String(index);
}

/**
 * The old -> new id map upstream's counters would produce for an assembled
 * `<defs>` payload. Separated from the rewrite so the numbering rule is
 * testable on its own.
 *
 * Scanned once per KIND, which is exactly what the per-kind counters need:
 * each kind's own relative order in `<defs>` is its creation order, and
 * upstream's two counters never interleave (`gradients` and
 * `filterBackColor` are separate maps, java:365,761).
 */
export function seededDefIdRenames(defs: string, uid: string): Map<string, string> {
  const renames = new Map<string, string>();
  const counters = { gradient: 0, backColor: 0, shadow: 0 };
  for (const [open, close] of INLINE_DEF_OPENS) {
    let cursor = 0;
    for (let span = nextDef(defs, cursor, open, close, ANY_ID_RE); span !== undefined;) {
      cursor = span.end;
      const element = defs.substring(span.at, span.end);
      const kind = seededKind(element);
      const id = idOfElement(element);
      if (kind !== undefined && id !== undefined) {
        renames.set(id, seededId(kind, uid, counters[kind]));
        counters[kind] += 1;
      }
      span = nextDef(defs, cursor, open, close, ANY_ID_RE);
    }
  }
  return renames;
}

/**
 * Rewrites every seeded def id in a FINISHED SVG document to the id upstream
 * would have minted for this diagram's seed, references included.
 *
 * Applied once, at the single central assembly point (`assemble-svg.ts
 * #assembleSvg`), rather than inside each emitter: the id is a property of
 * the DOCUMENT (one `SvgGraphics`, one seed, one counter per kind), and no
 * emitter in this port -- the class string renderer, the chrome klimt
 * fragments, `paint.ts#paintToSvg` -- can see the document it will end up
 * in. Every emitter therefore keeps minting its own content-derived id and
 * this pass renames them, which also makes the pass a no-op-by-construction
 * for a document whose ids are ALREADY jar-shaped (the description engine
 * seeds its own klimt document, `diagrams/description/index.ts:69`: same uid,
 * same order, same result).
 *
 * `seed` is the diagram's `UmlSource#seed()` (`UmlSource.java:222-234`),
 * computed by `klimt/drawing/svg/svg-seed.ts#seedOf`.
 */
export function applySeededDefIds(document: string, seed: bigint): string {
  const defsStart = document.indexOf('<defs');
  if (defsStart === -1) return document;
  const defsEnd = document.indexOf('</defs>', defsStart);
  if (defsEnd === -1) return document;
  const renames = seededDefIdRenames(document.substring(defsStart, defsEnd), getSeed(seed));
  if (renames.size === 0) return document;
  return document.replace(SEEDED_REF_RE, (match, idAttr: string | undefined, urlRef: string | undefined) => {
    const old = idAttr ?? urlRef;
    const next = old === undefined ? undefined : renames.get(old);
    if (next === undefined) return match;
    // Concatenated, not a template literal whose text ends in `id="` before
    // an interpolation (D5's ESLint selector shape) -- `paint.ts#paintToSvg`
    // does the same for the same reason. Nothing to escape: `next` is
    // `getSeed`'s base-36 digits plus a decimal index, by construction.
    return idAttr === undefined ? 'url(#' + next + ')' : 'id=' + DQUOTE + next + DQUOTE;
  });
}

/** One pass over both spellings a def id appears in: its own `id="…"` and
 *  every `url(#…)` reference. Single pass so a renamed id can never be
 *  renamed a second time by a later entry of the map. */
const SEEDED_REF_RE = /id="([^"]*)"|url\(#([^)]*)\)/g;
